import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { Registry } from './registry.js';
import { MarketplaceManager } from './marketplace.js';
import { Installer } from './installer.js';

const execFileAsync = promisify(execFile);

export class Updater {
  constructor(options = {}) {
    this.registry = options.registry || new Registry();
    this.marketplace = options.marketplace || new MarketplaceManager();
    this.installer = options.installer || new Installer({ registry: this.registry });
  }

  async checkForUpdates() {
    const installedList = this.registry.getAll();
    const availablePlugins = await this.marketplace.listAvailablePlugins();
    const pluginMap = new Map();
    for (const p of availablePlugins) {
      pluginMap.set(p.id, p);
      if (p.name) pluginMap.set(p.name, p);
    }

    const updates = [];

    for (const item of installedList) {
      const match = pluginMap.get(item.id) || pluginMap.get(item.name);
      let hasUpdate = false;
      let latestVersion = item.version || '1.0.0';
      let reason = '';
      let targetRef = null;

      if (match && match.version && match.version !== 'latest') {
        if (this.isNewerVersion(match.version, item.version)) {
          hasUpdate = true;
          latestVersion = match.version;
          reason = `New version in marketplace: ${match.version} (current: ${item.version})`;
        }
      }

      const gitUrl = item.gitUrl || match?.gitUrl || item.source?.url;
      if (gitUrl && gitUrl.startsWith('http')) {
        try {
          const { stdout: tagsOut } = await execFileAsync('git', ['ls-remote', '--tags', gitUrl], { timeout: 7000 });
          const highestTag = this.extractHighestTag(tagsOut);
          if (highestTag && this.isNewerVersion(highestTag, item.version)) {
            hasUpdate = true;
            latestVersion = highestTag;
            targetRef = `v${highestTag}`;
            reason = `New version on GitHub: v${highestTag} (current: ${item.version})`;
          }
        } catch (e) {}

        if (!hasUpdate) {
          try {
            const { stdout: headOut } = await execFileAsync('git', ['ls-remote', gitUrl, 'HEAD'], { timeout: 6000 });
            const remoteSha = headOut.split(/\s+/)[0]?.trim();
            if (remoteSha) {
              if (item.commitSha && remoteSha !== item.commitSha) {
                hasUpdate = true;
                latestVersion = `${item.version || '1.0.0'} (${remoteSha.slice(0, 7)})`;
                targetRef = remoteSha;
                reason = `New commit on GitHub: ${remoteSha.slice(0, 7)} (current: ${item.commitSha.slice(0, 7)})`;
              } else if (!item.commitSha) {
                const localSha = await this.findLocalCommit(item.installPath);
                if (localSha && remoteSha !== localSha) {
                  hasUpdate = true;
                  latestVersion = `${item.version || '1.0.0'} (${remoteSha.slice(0, 7)})`;
                  targetRef = remoteSha;
                  reason = `New commit on GitHub: ${remoteSha.slice(0, 7)}`;
                }
              }
            }
          } catch (e) {}
        }
      }

      updates.push({
        id: item.id,
        name: item.name,
        displayName: item.displayName || item.name,
        currentVersion: item.version,
        latestVersion,
        hasUpdate,
        reason,
        gitUrl,
        targetRef,
        installPath: item.installPath,
        lastUpdated: item.lastUpdated || item.installedAt
      });
    }

    return updates;
  }

  extractHighestTag(lsRemoteTagsOutput) {
    if (!lsRemoteTagsOutput) return null;
    const lines = lsRemoteTagsOutput.split('\n');
    let maxSemver = null;

    for (const line of lines) {
      const match = line.match(/refs\/tags\/(?:v)?([0-9]+\.[0-9]+(?:\.[0-9]+)?)/);
      if (match) {
        const ver = match[1];
        if (!maxSemver || this.isNewerVersion(ver, maxSemver)) {
          maxSemver = ver;
        }
      }
    }

    return maxSemver;
  }

  isNewerVersion(remote, local) {
    if (!local || !remote) return false;
    if (remote === local) return false;
    const cleanR = remote.replace(/^[v^~]/, '').split('.').map(n => parseInt(n, 10) || 0);
    const cleanL = local.replace(/^[v^~]/, '').split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(cleanR.length, cleanL.length); i++) {
      const r = cleanR[i] || 0;
      const l = cleanL[i] || 0;
      if (r > l) return true;
      if (r < l) return false;
    }
    return false;
  }

  async findLocalCommit(dirPath) {
    if (!dirPath || !fs.existsSync(dirPath)) return null;
    let curr = dirPath;
    while (curr && curr.length > 3) {
      if (fs.existsSync(path.join(curr, '.git'))) {
        try {
          const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: curr });
          return stdout.trim();
        } catch (e) {}
        break;
      }
      const parent = path.dirname(curr);
      if (parent === curr) break;
      curr = parent;
    }
    return null;
  }

  async updatePlugin(id) {
    const installed = this.registry.get(id);
    if (!installed) {
      throw new Error(`Plugin "${id}" is not installed.`);
    }

    const availablePlugins = await this.marketplace.listAvailablePlugins();
    const match = availablePlugins.find(p => p.id === id || p.name === installed.name);

    const gitUrl = installed.gitUrl || match?.gitUrl || installed.source?.url;

    let targetRef = 'main';
    if (gitUrl && gitUrl.startsWith('http')) {
      try {
        const { stdout: headOut } = await execFileAsync('git', ['ls-remote', gitUrl, 'HEAD'], { timeout: 6000 });
        const remoteSha = headOut.split(/\s+/)[0]?.trim();
        if (remoteSha) {
          targetRef = remoteSha;
        }
      } catch (e) {}
    }

    const pluginToInstall = {
      ...(match || {}),
      id: installed.id,
      name: installed.name,
      displayName: installed.displayName || installed.name,
      gitUrl: gitUrl || undefined,
      source: gitUrl ? { type: 'git', url: gitUrl, ref: targetRef } : (match?.source || installed.source)
    };

    return await this.installer.install(pluginToInstall, {
      scope: installed.scope || 'global',
      targetDir: installed.installPath
    });
  }
}
