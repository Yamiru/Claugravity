import fs from 'node:fs';
import path from 'node:path';

export class PluginConverter {
  constructor(options = {}) {
    this.options = options;
  }

  async convert(sourceDir, targetDir, metaOverride = {}) {
    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Source directory does not exist: ${sourceDir}`);
    }

    fs.mkdirSync(targetDir, { recursive: true });

    const manifest = this.extractManifest(sourceDir, metaOverride);
    const pluginJsonPath = path.join(targetDir, 'plugin.json');
    fs.writeFileSync(pluginJsonPath, JSON.stringify(manifest, null, 2), 'utf8');

    const skillsCount = this.convertSkills(sourceDir, targetDir, manifest.name);
    const commandsCount = this.convertCommands(sourceDir, targetDir);
    const hasRules = this.convertRules(sourceDir, targetDir);
    const hasMcp = this.convertMcp(sourceDir, targetDir);
    const hasHooks = this.convertHooks(sourceDir, targetDir);

    this.copyAssetsAndScripts(sourceDir, targetDir);

    return {
      name: manifest.name,
      version: manifest.version,
      targetDir,
      stats: {
        skillsCount: skillsCount + commandsCount,
        hasRules,
        hasMcp,
        hasHooks
      }
    };
  }

  extractManifest(sourceDir, override = {}) {
    let base = {
      name: override.name || path.basename(sourceDir),
      version: override.version || '1.0.0',
      description: override.description || 'Imported Claude customization for Antigravity'
    };

    const claudePluginJson = path.join(sourceDir, '.claude-plugin', 'plugin.json');
    if (fs.existsSync(claudePluginJson)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(claudePluginJson, 'utf8'));
        base.name = parsed.name || base.name;
        base.version = parsed.version || base.version;
        base.description = parsed.description || base.description;
        if (parsed.author) base.author = parsed.author;
        if (parsed.keywords) base.keywords = parsed.keywords;
      } catch (e) {
        console.warn('Could not parse .claude-plugin/plugin.json:', e.message);
      }
    } else {
      const pkgJson = path.join(sourceDir, 'package.json');
      if (fs.existsSync(pkgJson)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
          base.name = parsed.name || base.name;
          base.version = parsed.version || base.version;
          base.description = parsed.description || base.description;
        } catch (e) {}
      }
    }

    const rootSkillFile = path.join(sourceDir, 'SKILL.md');
    if (fs.existsSync(rootSkillFile)) {
      try {
        const content = fs.readFileSync(rootSkillFile, 'utf8');
        const vMatch = content.match(/version:\s*["']?([^"\n\r]+)["']?/);
        if (vMatch && (!base.version || base.version === '1.0.0')) {
          base.version = vMatch[1].trim();
        }
        const nameMatch = content.match(/name:\s*["']?([^"\n\r]+)["']?/);
        if (nameMatch && (!base.name || base.name.startsWith('temp_') || base.name.startsWith('agymp_'))) {
          base.name = nameMatch[1].trim();
        }
      } catch (e) {}
    }

    const finalManifest = { ...base };
    if (override.name && !override.name.startsWith('agymp_') && !override.name.startsWith('temp_')) {
      finalManifest.name = override.name;
    }
    if (override.description && override.description.length > (base.description?.length || 0)) {
      finalManifest.description = override.description;
    }
    if (override.version && override.version !== '1.0.0' && override.version !== 'latest') {
      finalManifest.version = override.version;
    }

    return finalManifest;
  }

  convertSkills(sourceDir, targetDir, fallbackName) {
    let count = 0;
    const targetSkillsDir = path.join(targetDir, 'skills');

    const candidates = [
      path.join(sourceDir, 'skills'),
      path.join(sourceDir, '.claude', 'skills')
    ];

    const rootSkillFile = path.join(sourceDir, 'SKILL.md');
    if (fs.existsSync(rootSkillFile)) {
      let skillName = fallbackName;
      if (!skillName || skillName.startsWith('agymp_') || skillName.startsWith('temp_')) {
        skillName = this.extractSkillNameFromMd(rootSkillFile) || 'skill';
      }
      const destSkillDir = path.join(targetSkillsDir, skillName);
      fs.mkdirSync(destSkillDir, { recursive: true });
      this.ensureValidSkillMd(rootSkillFile, path.join(destSkillDir, 'SKILL.md'), skillName);
      count++;
    }

    for (const dir of candidates) {
      if (!fs.existsSync(dir)) continue;

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subSkillDir = path.join(dir, entry.name);
          const skillMd = path.join(subSkillDir, 'SKILL.md');
          if (fs.existsSync(skillMd)) {
            const destDir = path.join(targetSkillsDir, entry.name);
            this.copyDirRecursive(subSkillDir, destDir);
            count++;
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const skillName = path.basename(entry.name, '.md');
          const destDir = path.join(targetSkillsDir, skillName);
          fs.mkdirSync(destDir, { recursive: true });
          this.ensureValidSkillMd(path.join(dir, entry.name), path.join(destDir, 'SKILL.md'), skillName);
          count++;
        }
      }
    }

    return count;
  }

  convertCommands(sourceDir, targetDir) {
    let count = 0;
    const commandsDir = path.join(sourceDir, 'commands');
    if (!fs.existsSync(commandsDir)) return 0;

    const targetSkillsDir = path.join(targetDir, 'skills');
    fs.mkdirSync(targetSkillsDir, { recursive: true });

    const entries = fs.readdirSync(commandsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const cmdName = path.basename(entry.name, '.md');
        const destSkillDir = path.join(targetSkillsDir, cmdName);
        fs.mkdirSync(destSkillDir, { recursive: true });
        this.ensureValidSkillMd(path.join(commandsDir, entry.name), path.join(destSkillDir, 'SKILL.md'), cmdName);
        count++;
      }
    }

    return count;
  }

  extractSkillNameFromMd(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const m = content.match(/^---\r?\n[\s\S]*?name:\s*([^\r\n]+)/m);
      if (m) return m[1].trim().replace(/['"]/g, '');
    } catch (e) {}
    return null;
  }

  ensureValidSkillMd(srcPath, destPath, defaultName) {
    let content = fs.readFileSync(srcPath, 'utf8');

    const hasFrontmatter = content.trim().startsWith('---');
    if (!hasFrontmatter) {
      const summaryMatch = content.match(/^(?:#\s*.*?\n+)?([^\n]+)/);
      const desc = summaryMatch ? summaryMatch[1].replace(/[*_#`]/g, '').trim().slice(0, 150) : `Skill ${defaultName}`;
      content = `---\nname: ${defaultName}\ndescription: "${desc}"\n---\n\n` + content;
    }

    fs.writeFileSync(destPath, content, 'utf8');
  }

  convertRules(sourceDir, targetDir) {
    const claudeMdPath = path.join(sourceDir, 'CLAUDE.md');
    const targetRulesDir = path.join(targetDir, 'rules');

    if (fs.existsSync(claudeMdPath)) {
      fs.mkdirSync(targetRulesDir, { recursive: true });
      const content = fs.readFileSync(claudeMdPath, 'utf8');
      fs.writeFileSync(path.join(targetRulesDir, 'AGENTS.md'), content, 'utf8');
      return true;
    }

    const srcRulesDir = path.join(sourceDir, 'rules');
    if (fs.existsSync(srcRulesDir)) {
      this.copyDirRecursive(srcRulesDir, targetRulesDir);
      return true;
    }

    return false;
  }

  convertMcp(sourceDir, targetDir) {
    let mcpConfig = null;

    const candidates = [
      path.join(sourceDir, 'mcp_config.json'),
      path.join(sourceDir, '.claude-plugin', 'mcp.json'),
      path.join(sourceDir, '.mcp.json')
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          mcpConfig = JSON.parse(fs.readFileSync(p, 'utf8'));
          break;
        } catch (e) {
          console.warn('Failed parsing MCP config at', p, e.message);
        }
      }
    }

    if (!mcpConfig) {
      const claudePluginJson = path.join(sourceDir, '.claude-plugin', 'plugin.json');
      if (fs.existsSync(claudePluginJson)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(claudePluginJson, 'utf8'));
          if (parsed.mcpServers) {
            mcpConfig = { mcpServers: parsed.mcpServers };
          }
        } catch (e) {}
      }
    }

    if (!mcpConfig || !mcpConfig.mcpServers) return false;

    const adapted = { mcpServers: {} };
    for (const [name, srv] of Object.entries(mcpConfig.mcpServers)) {
      const serverCopy = { ...srv };
      
      serverCopy.env = {
        CLAUDE_PLUGIN_ROOT: targetDir,
        PLUGIN_DIR: targetDir,
        ANTIGRAVITY_COMPAT: '1',
        ...(serverCopy.env || {})
      };

      if (Array.isArray(serverCopy.args)) {
        serverCopy.args = serverCopy.args.map(arg => {
          if (typeof arg === 'string') {
            return arg
              .replaceAll('${CLAUDE_PLUGIN_ROOT}', targetDir)
              .replaceAll('$CLAUDE_PLUGIN_ROOT', targetDir)
              .replaceAll('${PLUGIN_DIR}', targetDir);
          }
          return arg;
        });
      }

      adapted.mcpServers[name] = serverCopy;
    }

    fs.writeFileSync(path.join(targetDir, 'mcp_config.json'), JSON.stringify(adapted, null, 2), 'utf8');
    return true;
  }

  convertHooks(sourceDir, targetDir) {
    const candidates = [
      path.join(sourceDir, 'hooks.json'),
      path.join(sourceDir, 'hooks', 'hooks.json'),
      path.join(sourceDir, '.claude-plugin', 'hooks.json')
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf8');
          const normalized = raw
            .replaceAll('${CLAUDE_PLUGIN_ROOT}', targetDir.replace(/\\/g, '/'))
            .replaceAll('$CLAUDE_PLUGIN_ROOT', targetDir.replace(/\\/g, '/'));
          
          fs.writeFileSync(path.join(targetDir, 'hooks.json'), normalized, 'utf8');
          return true;
        } catch (e) {
          console.warn('Could not copy hooks.json:', e.message);
        }
      }
    }
    return false;
  }

  copyAssetsAndScripts(sourceDir, targetDir) {
    const items = ['scripts', 'assets', 'bin', 'lib', 'src', 'agents'];
    for (const item of items) {
      const src = path.join(sourceDir, item);
      const dst = path.join(targetDir, item);
      if (fs.existsSync(src) && !fs.existsSync(dst)) {
        this.copyDirRecursive(src, dst);
      }
    }
  }

  copyDirRecursive(src, dst) {
    fs.mkdirSync(dst, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const dstPath = path.join(dst, entry.name);
      if (entry.name === '.git' || entry.name === 'node_modules') continue;

      if (entry.isDirectory()) {
        this.copyDirRecursive(srcPath, dstPath);
      } else if (entry.isFile()) {
        fs.copyFileSync(srcPath, dstPath);
      }
    }
  }
}
