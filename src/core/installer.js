import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { CONFIG } from '../config.js';
import { PluginConverter } from './converter.js';
import { Registry } from './registry.js';

const execFileAsync = promisify(execFile);

export class Installer {
  constructor(options = {}) {
    this.converter = options.converter || new PluginConverter();
    this.registry = options.registry || new Registry();
    this.pluginsDir = options.pluginsDir || CONFIG.antigravityPluginsDir;
    this.skillsDir = options.skillsDir || CONFIG.antigravitySkillsDir;
  }

  async install(plugin, opts = {}) {
    const scope = opts.scope || 'global';
    const basePluginsDir = scope === 'workspace' && opts.workspaceDir
      ? path.join(opts.workspaceDir, '.agents', 'plugins')
      : this.pluginsDir;

    fs.mkdirSync(basePluginsDir, { recursive: true });

    const { sourceDir, commitSha, gitUrl, cleanupTemp } = await this.resolveSourceDir(plugin);

    try {
      const sanitizedName = (plugin.name || 'imported-plugin').replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
      const targetDir = opts.targetDir || path.join(basePluginsDir, sanitizedName);

      const conversionResult = await this.converter.convert(sourceDir, targetDir, {
        name: sanitizedName,
        version: plugin.version && plugin.version !== '1.0.0' && plugin.version !== 'latest' ? plugin.version : undefined,
        description: plugin.description || `Imported ${plugin.name} plugin`
      });

      const record = {
        id: plugin.id || `${sanitizedName}@${plugin.marketplace || 'custom'}`,
        name: sanitizedName,
        displayName: plugin.displayName || plugin.name,
        marketplace: plugin.marketplace || 'custom',
        version: conversionResult.version,
        commitSha: commitSha || plugin.commitSha || null,
        gitUrl: gitUrl || plugin.gitUrl || null,
        installPath: targetDir,
        scope,
        installedAt: new Date().toISOString(),
        source: plugin.source || { type: 'local', path: sourceDir },
        stats: conversionResult.stats
      };

      this.registry.register(record);

      return {
        success: true,
        plugin: record,
        message: `Plugin "${sanitizedName}" successfully converted and installed for Antigravity!`
      };
    } finally {
      if (cleanupTemp && fs.existsSync(sourceDir)) {
        try {
          fs.rmSync(sourceDir, { recursive: true, force: true });
        } catch (e) {}
      }
    }
  }

  async uninstall(id) {
    const installed = this.registry.get(id);
    if (!installed) {
      throw new Error(`Plugin "${id}" was not found among installed plugins.`);
    }

    if (fs.existsSync(installed.installPath)) {
      fs.rmSync(installed.installPath, { recursive: true, force: true });
    }

    this.registry.unregister(installed.id);
    return {
      success: true,
      id: installed.id,
      message: `Plugin "${installed.displayName || installed.name}" was uninstalled successfully.`
    };
  }

  async resolveSourceDir(plugin) {
    let resolvedGitUrl = plugin.gitUrl || null;

    const gitUrlCandidate = plugin.source?.url || (typeof plugin.source === 'string' && plugin.source.startsWith('http') ? plugin.source : null);
    if (gitUrlCandidate && gitUrlCandidate.startsWith('http')) {
      resolvedGitUrl = gitUrlCandidate;
      const tempDir = path.join(os.tmpdir(), `agymp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
      fs.mkdirSync(tempDir, { recursive: true });

      const ref = plugin.source?.ref || 'main';
      try {
        await execFileAsync('git', ['clone', '--depth', '1', '-b', ref, resolvedGitUrl, tempDir]);
      } catch (err) {
        await execFileAsync('git', ['clone', '--depth', '1', resolvedGitUrl, tempDir]);
      }

      let commitSha = null;
      try {
        const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: tempDir });
        commitSha = stdout.trim();
      } catch (e) {}

      return { sourceDir: tempDir, commitSha, gitUrl: resolvedGitUrl, cleanupTemp: true };
    }

    if (plugin.source?.path && fs.existsSync(plugin.source.path)) {
      const { commitSha, gitUrl } = await this.inspectLocalGit(plugin.source.path);
      return { sourceDir: plugin.source.path, commitSha, gitUrl: gitUrl || resolvedGitUrl, cleanupTemp: false };
    }

    if (plugin.marketplacePath) {
      let candidatePath = null;
      if (typeof plugin.source === 'string' && plugin.source.startsWith('.')) {
        const fullPath = path.resolve(plugin.marketplacePath, plugin.source);
        if (fs.existsSync(fullPath)) candidatePath = fullPath;
      } else if (plugin.source?.path) {
        const fullPath = path.resolve(plugin.marketplacePath, plugin.source.path);
        if (fs.existsSync(fullPath)) candidatePath = fullPath;
      }

      if (!candidatePath) {
        const sub = path.join(plugin.marketplacePath, 'plugins', plugin.name);
        if (fs.existsSync(sub)) candidatePath = sub;
      }

      if (!candidatePath) candidatePath = plugin.marketplacePath;

      const { commitSha, gitUrl } = await this.inspectLocalGit(candidatePath);
      return { sourceDir: candidatePath, commitSha, gitUrl: gitUrl || resolvedGitUrl, cleanupTemp: false };
    }

    throw new Error(`Unable to resolve source location for plugin: ${JSON.stringify(plugin)}`);
  }

  async inspectLocalGit(dirPath) {
    let commitSha = null;
    let gitUrl = null;

    let current = dirPath;
    while (current && current.length > 3) {
      if (fs.existsSync(path.join(current, '.git'))) {
        try {
          const { stdout: shaOut } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: current });
          commitSha = shaOut.trim();
        } catch (e) {}

        try {
          const cfgPath = path.join(current, '.git', 'config');
          if (fs.existsSync(cfgPath)) {
            const cfg = fs.readFileSync(cfgPath, 'utf8');
            const m = cfg.match(/url\s*=\s*(.+)$/m);
            if (m) gitUrl = m[1].trim();
          }
        } catch (e) {}
        break;
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }

    return { commitSha, gitUrl };
  }
}
