import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { CONFIG } from '../config.js';

export const KNOWN_SKILL_METADATA = {
  'brainstorming': {
    author: 'Jesse Vincent (obra)',
    authorUrl: 'https://github.com/obra',
    repoUrl: 'https://github.com/obra/superpowers.git',
    packageName: 'superpowers',
    description: 'Disciplined creative and architecture exploration before implementation. Prevents building the wrong thing.'
  },
  'test-driven-development': {
    author: 'Jesse Vincent (obra)',
    authorUrl: 'https://github.com/obra',
    repoUrl: 'https://github.com/obra/superpowers.git',
    packageName: 'superpowers',
    description: 'Enforces rigorous test-first development: write failing test, write minimal code to pass, refactor.'
  },
  'systematic-debugging': {
    author: 'Jesse Vincent (obra)',
    authorUrl: 'https://github.com/obra',
    repoUrl: 'https://github.com/obra/superpowers.git',
    packageName: 'superpowers',
    description: 'Four-phase systematic root-cause debugging methodology before attempting speculative fixes.'
  },
  'executing-plans': {
    author: 'Jesse Vincent (obra)',
    authorUrl: 'https://github.com/obra',
    repoUrl: 'https://github.com/obra/superpowers.git',
    packageName: 'superpowers',
    description: 'Step-by-step implementation plan executor with batching, progress tracking, and verification.'
  },
  'writing-plans': {
    author: 'Jesse Vincent (obra)',
    authorUrl: 'https://github.com/obra',
    repoUrl: 'https://github.com/obra/superpowers.git',
    packageName: 'superpowers',
    description: 'Structured planning framework creating verifiable, reviewable implementation plans.'
  },
  'using-superpowers': {
    author: 'Jesse Vincent (obra)',
    authorUrl: 'https://github.com/obra',
    repoUrl: 'https://github.com/obra/superpowers.git',
    packageName: 'superpowers',
    description: 'Core dispatcher ensuring skills are invoked automatically for complex tasks.'
  },
  'subagent-driven-development': {
    author: 'Jesse Vincent (obra)',
    authorUrl: 'https://github.com/obra',
    repoUrl: 'https://github.com/obra/superpowers.git',
    packageName: 'superpowers',
    description: 'Autonomous execution framework using specialized child subagents for independent tasks.'
  },
  'verification-before-completion': {
    author: 'Jesse Vincent (obra)',
    authorUrl: 'https://github.com/obra',
    repoUrl: 'https://github.com/obra/superpowers.git',
    packageName: 'superpowers',
    description: 'Requires running actual test and verification commands before asserting any fix is complete.'
  },
  'finishing-a-development-branch': {
    author: 'Jesse Vincent (obra)',
    authorUrl: 'https://github.com/obra',
    repoUrl: 'https://github.com/obra/superpowers.git',
    packageName: 'superpowers',
    description: 'Guides merging, testing, rebasing, and finishing a git feature branch cleanly.'
  },
  'dispatching-parallel-agents': {
    author: 'Jesse Vincent (obra)',
    authorUrl: 'https://github.com/obra',
    repoUrl: 'https://github.com/obra/superpowers.git',
    packageName: 'superpowers',
    description: 'Coordinates multiple parallel subagents on non-overlapping modules.'
  },
  'using-git-worktrees': {
    author: 'Jesse Vincent (obra)',
    authorUrl: 'https://github.com/obra',
    repoUrl: 'https://github.com/obra/superpowers.git',
    packageName: 'superpowers',
    description: 'Manages isolated git worktrees for safe, branch-isolated agent modifications.'
  },
  'requesting-code-review': {
    author: 'Jesse Vincent (obra)',
    authorUrl: 'https://github.com/obra',
    repoUrl: 'https://github.com/obra/superpowers.git',
    packageName: 'superpowers',
    description: 'Prepares structured code reviews focusing on architectural clarity and regression risk.'
  },
  'receiving-code-review': {
    author: 'Jesse Vincent (obra)',
    authorUrl: 'https://github.com/obra',
    repoUrl: 'https://github.com/obra/superpowers.git',
    packageName: 'superpowers',
    description: 'Systematically addresses review comments with evidence and regression tests.'
  },
  'writing-skills': {
    author: 'Jesse Vincent (obra)',
    authorUrl: 'https://github.com/obra',
    repoUrl: 'https://github.com/obra/superpowers.git',
    packageName: 'superpowers',
    description: 'Best-practice guide for authoring, testing, and packaging new skills.'
  },
  'diagnosing-superpowers': {
    author: 'Jesse Vincent (obra)',
    authorUrl: 'https://github.com/obra',
    repoUrl: 'https://github.com/obra/superpowers.git',
    packageName: 'superpowers',
    description: 'Troubleshooting harness issues, subagent loops, and skill execution anomalies.'
  },
  'karpathy-guidelines': {
    author: 'Andrej Karpathy / Forrest Chang',
    authorUrl: 'https://github.com/forrestchang',
    repoUrl: 'https://github.com/forrestchang/andrej-karpathy-skills.git',
    packageName: 'andrej-karpathy-skills',
    description: 'Pragmatic coding rules to prevent LLM mistakes, code bloat, and premature abstraction.'
  },
  'humanizer': {
    author: 'blader',
    authorUrl: 'https://github.com/blader',
    repoUrl: 'https://github.com/blader/humanizer.git',
    packageName: 'humanizer',
    description: 'Transforms robotic, AI-sounding prose into natural, engaging human writing.'
  },
  'mhumanize': {
    author: 'blader',
    authorUrl: 'https://github.com/blader',
    repoUrl: 'https://github.com/blader/humanizer.git',
    packageName: 'humanizer',
    description: 'Removes AI fingerprints and invisible unicode watermarks while preserving content.'
  },
  'writing-clearly-and-concisely': {
    author: 'Jesse Vincent (obra) / Strunk & White',
    authorUrl: 'https://github.com/obra',
    repoUrl: 'https://github.com/obra/the-elements-of-style.git',
    packageName: 'elements-of-style',
    description: 'Applies Strunk\'s timeless writing rules to eliminate fluff and tighten prose.'
  },
  'agy-customizations': {
    author: 'Google DeepMind',
    authorUrl: 'https://deepmind.google',
    repoUrl: 'https://github.com/google-deepmind/antigravity',
    packageName: 'antigravity-core',
    description: 'Core reference for Antigravity customizations: loading priority, skills, rules, and hooks.'
  },
  'antigravity-guide': {
    author: 'Google DeepMind',
    authorUrl: 'https://deepmind.google',
    repoUrl: 'https://github.com/google-deepmind/antigravity',
    packageName: 'antigravity-core',
    description: 'Comprehensive guide and quick reference for Google Antigravity CLI and features.'
  },
  'automation': {
    author: 'Google DeepMind',
    authorUrl: 'https://deepmind.google',
    repoUrl: 'https://github.com/google-deepmind/antigravity',
    packageName: 'antigravity-core',
    description: 'Interactive guide and tools for creating scheduled background automations.'
  },
  'generative_ui': {
    author: 'Google DeepMind',
    authorUrl: 'https://deepmind.google',
    repoUrl: 'https://github.com/google-deepmind/antigravity',
    packageName: 'antigravity-core',
    description: 'Generates rich interactive HTML widgets, visualizations, and dynamic UI panels.'
  },
  'migrate-workflows': {
    author: 'Google DeepMind',
    authorUrl: 'https://deepmind.google',
    repoUrl: 'https://github.com/google-deepmind/antigravity',
    packageName: 'antigravity-core',
    description: 'Migrates legacy workflows into modern Antigravity skills across configurations.'
  },
  'plugin': {
    author: 'Google DeepMind',
    authorUrl: 'https://deepmind.google',
    repoUrl: 'https://github.com/google-deepmind/antigravity',
    packageName: 'antigravity-core',
    description: 'Manages bundled plugins containing skills, agents, rules, and MCP servers.'
  },
  'ui-plugin-navigation': {
    author: 'Google DeepMind',
    authorUrl: 'https://deepmind.google',
    repoUrl: 'https://github.com/google-deepmind/antigravity',
    packageName: 'antigravity-core',
    description: 'Surfaces UI plugin panels in Antigravity chat with quick one-click side-pane pills.'
  },
  'permissioned-github': {
    author: 'Google DeepMind',
    authorUrl: 'https://deepmind.google',
    repoUrl: 'https://github.com/google-deepmind/antigravity',
    packageName: 'antigravity-core',
    description: 'Fine-grained permission controls for GitHub operations in Antigravity.'
  }
};

export class SkillChecker {
  constructor(options = {}) {
    this.userHome = options.userHome || os.homedir();
    this.pluginsDir = options.pluginsDir || CONFIG.antigravityPluginsDir;
    this.skillsDir = options.skillsDir || CONFIG.antigravitySkillsDir;
    this.antigravityDir = path.join(this.userHome, '.gemini', 'antigravity');
    this.builtinSkillsDir = options.builtinSkillsDir || path.join(path.dirname(CONFIG.geminiConfigDir), 'antigravity', 'builtin', 'skills');
  }

  async checkAllSkills() {
    const rawSkills = [];

    if (fs.existsSync(this.pluginsDir)) {
      const pDirs = fs.readdirSync(this.pluginsDir, { withFileTypes: true });
      for (const p of pDirs) {
        if (!p.isDirectory()) continue;
        const pSkills = path.join(this.pluginsDir, p.name, 'skills');
        if (fs.existsSync(pSkills)) {
          const sEntries = fs.readdirSync(pSkills, { withFileTypes: true });
          for (const s of sEntries) {
            if (s.isDirectory()) {
              const f = path.join(pSkills, s.name, 'SKILL.md');
              if (fs.existsSync(f)) {
                rawSkills.push(this.validateSkillFile(f, s.name, 'plugin', p.name));
              }
            }
          }
        }
      }
    }

    if (fs.existsSync(this.skillsDir)) {
      const entries = fs.readdirSync(this.skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const f = path.join(this.skillsDir, entry.name, 'SKILL.md');
          if (fs.existsSync(f)) {
            rawSkills.push(this.validateSkillFile(f, entry.name, 'standalone', null));
          }
        }
      }
    }

    if (fs.existsSync(this.builtinSkillsDir)) {
      const entries = fs.readdirSync(this.builtinSkillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const f = path.join(this.builtinSkillsDir, entry.name, 'SKILL.md');
          if (fs.existsSync(f)) {
            rawSkills.push(this.validateSkillFile(f, entry.name, 'builtin', 'Antigravity Core'));
          }
        }
      }
    }

    const nameMap = new Map();
    for (const skill of rawSkills) {
      if (!nameMap.has(skill.name)) {
        nameMap.set(skill.name, []);
      }
      nameMap.get(skill.name).push(skill);
    }

    const collisions = [];
    for (const [name, list] of nameMap.entries()) {
      if (list.length > 1) {
        const priorityOrder = { standalone: 3, plugin: 2, builtin: 1 };
        list.sort((a, b) => priorityOrder[b.category] - priorityOrder[a.category]);
        list[0].isActive = true;
        for (let i = 1; i < list.length; i++) {
          list[i].isActive = false;
          list[i].isShadowed = true;
          list[i].shadowedBy = list[0].origin;
        }

        collisions.push({
          skillName: name,
          activeSkill: list[0],
          duplicates: list.slice(1)
        });
      } else {
        list[0].isActive = true;
      }
    }

    return {
      totalCount: rawSkills.length,
      categories: {
        plugin: rawSkills.filter(s => s.category === 'plugin'),
        standalone: rawSkills.filter(s => s.category === 'standalone'),
        builtin: rawSkills.filter(s => s.category === 'builtin')
      },
      collisions,
      skills: rawSkills
    };
  }

  validateSkillFile(filePath, skillName, category, parentPlugin = null) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    const checks = {
      hasFrontmatter: false,
      hasValidName: false,
      hasDescription: false,
      progressiveDisclosureCompliant: true,
      securitySafe: true
    };

    let frontmatter = {};
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (frontmatterMatch) {
      checks.hasFrontmatter = true;
      const yamlStr = frontmatterMatch[1];
      const nameMatch = yamlStr.match(/^name:\s*(.+)$/m);
      const descMatch = yamlStr.match(/^description:\s*([>|-]?\s*[\s\S]+?)(?=\n[a-zA-Z0-9_-]+:|$)/m);
      const versionMatch = yamlStr.match(/^version:\s*["']?([^"\n\r]+)["']?/m);
      const authorMatch = yamlStr.match(/^author:\s*["']?([^"\n\r]+)["']?/m);

      if (nameMatch) {
        checks.hasValidName = true;
        frontmatter.name = nameMatch[1].trim().replace(/['"]/g, '');
      } else {
        issues.push({ level: 'error', code: 'MISSING_NAME', message: 'SKILL.md frontmatter is missing parameter "name".' });
      }

      if (descMatch) {
        checks.hasDescription = true;
        frontmatter.description = descMatch[1].trim();
      } else {
        issues.push({ level: 'error', code: 'MISSING_DESC', message: 'SKILL.md frontmatter is missing parameter "description".' });
      }

      if (versionMatch) frontmatter.version = versionMatch[1].trim();
      if (authorMatch) frontmatter.author = authorMatch[1].trim();
    } else {
      issues.push({ level: 'error', code: 'NO_FRONTMATTER', message: 'File does not have valid YAML frontmatter (--- ... ---).' });
    }

    const securityPatterns = [
      { pattern: /curl\s+.*\|\s*(?:bash|sh|zsh)/i, warning: 'Contains dangerous download and immediate execution pattern (curl | sh).' },
      { pattern: /iex\s*\(\s*new-object\s+net\.webclient/i, warning: 'PowerShell download cradle (IEX webclient).' },
      { pattern: /(?:api_key|secret|password)\s*[:=]\s*["'][a-zA-Z0-9_-]{20,}["']/i, warning: 'Potential hardcoded secret or API key.' }
    ];

    for (const sec of securityPatterns) {
      if (sec.pattern.test(content)) {
        checks.securitySafe = false;
        issues.push({ level: 'warning', code: 'SECURITY_ALERT', message: sec.warning });
      }
    }

    let originLabel = '';
    let originType = category;

    if (category === 'plugin') {
      originLabel = `Plugin: ${parentPlugin}`;
    } else if (category === 'standalone') {
      originLabel = 'Installed: Standalone (~/.gemini/config/skills)';
    } else if (category === 'builtin') {
      originLabel = 'Original Antigravity (Google DeepMind Core)';
    }

    const knownMeta = KNOWN_SKILL_METADATA[skillName] || {};
    
    let pluginMeta = {};
    if (parentPlugin) {
      try {
        const pManifestPath = path.join(this.pluginsDir, parentPlugin, 'plugin.json');
        if (fs.existsSync(pManifestPath)) {
          pluginMeta = JSON.parse(fs.readFileSync(pManifestPath, 'utf8'));
        }
      } catch (e) {}
    }

    let rawAuthor = frontmatter.author || knownMeta.author || pluginMeta.author || (category === 'builtin' ? 'Google DeepMind' : (parentPlugin || 'Community'));
    let author = 'Community';
    let authorUrl = knownMeta.authorUrl || pluginMeta.authorUrl || (knownMeta.repoUrl ? knownMeta.repoUrl.replace(/\.git$/, '') : null);

    if (typeof rawAuthor === 'object' && rawAuthor !== null) {
      author = rawAuthor.name || rawAuthor.username || rawAuthor.owner || 'Community';
      if (!authorUrl && rawAuthor.url) authorUrl = rawAuthor.url;
    } else if (typeof rawAuthor === 'string') {
      author = rawAuthor.trim();
    }

    let repoUrl = knownMeta.repoUrl || pluginMeta.repository || pluginMeta.gitUrl || null;
    if (typeof repoUrl === 'object' && repoUrl !== null) {
      repoUrl = repoUrl.url || null;
    }
    if (typeof repoUrl === 'string') {
      repoUrl = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');
    }

    const packageName = knownMeta.packageName || parentPlugin || (category === 'builtin' ? 'antigravity-core' : 'standalone-skill');
    
    let description = frontmatter.description || knownMeta.description || pluginMeta.description || 'No description provided.';
    description = description.replace(/^[>|-]\s*/, '').replace(/\r?\n\s*/g, ' ').trim();

    return {
      name: skillName,
      displayName: frontmatter.name || skillName,
      description,
      version: frontmatter.version || pluginMeta.version || (category === 'builtin' ? 'Antigravity Core' : '1.0.0'),
      author,
      authorUrl,
      repoUrl,
      packageName,
      category,
      originType,
      parentPlugin,
      origin: originLabel,
      filePath,
      isHealthy: issues.filter(i => i.level === 'error').length === 0,
      checks,
      issues
    };
  }

  async consolidateSkills(skillNames, targetPluginName) {
    const pluginDir = path.join(this.pluginsDir, targetPluginName);
    const pluginSkillsDir = path.join(pluginDir, 'skills');
    fs.mkdirSync(pluginSkillsDir, { recursive: true });

    const manifest = {
      name: targetPluginName,
      version: '1.0.0',
      description: `Consolidated skills (${skillNames.join(', ')}) for Antigravity`
    };
    fs.writeFileSync(path.join(pluginDir, 'plugin.json'), JSON.stringify(manifest, null, 2), 'utf8');

    const moved = [];
    for (const name of skillNames) {
      const src = path.join(this.skillsDir, name);
      const dst = path.join(pluginSkillsDir, name);
      if (fs.existsSync(src)) {
        fs.cpSync(src, dst, { recursive: true });
        fs.rmSync(src, { recursive: true, force: true });
        moved.push(name);
      }
    }

    return { success: true, pluginName: targetPluginName, movedCount: moved.length, moved };
  }

  async deleteSkillByPath(targetPath) {
    if (!targetPath) {
      throw new Error('Target path is required.');
    }

    let targetDir = targetPath;
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
      targetDir = path.dirname(targetPath);
    }

    if (!fs.existsSync(targetDir)) {
      throw new Error(`Target path "${targetDir}" does not exist.`);
    }

    const normalized = path.normalize(targetDir);
    const safeSkills = path.normalize(this.skillsDir);
    const safePlugins = path.normalize(this.pluginsDir);

    if (!normalized.startsWith(safeSkills) && !normalized.startsWith(safePlugins)) {
      throw new Error('Permission denied: Can only delete skills inside Antigravity skills or plugins directories.');
    }

    fs.rmSync(normalized, { recursive: true, force: true });

    if (normalized.startsWith(safePlugins)) {
      const parentSkillsDir = path.dirname(normalized);
      if (fs.existsSync(parentSkillsDir) && path.basename(parentSkillsDir) === 'skills') {
        const remainingSkills = fs.readdirSync(parentSkillsDir);
        if (remainingSkills.length === 0) {
          const pluginDir = path.dirname(parentSkillsDir);
          try {
            fs.rmSync(pluginDir, { recursive: true, force: true });
          } catch (e) {}
        }
      }
    }

    return { success: true, path: targetPath, message: 'Skill successfully removed.' };
  }

  async deleteStandaloneSkill(skillName) {
    const target = path.join(this.skillsDir, skillName);
    if (!fs.existsSync(target)) {
      throw new Error(`Standalone skill "${skillName}" not found.`);
    }
    fs.rmSync(target, { recursive: true, force: true });
    return { success: true, skillName, message: `Standalone skill "${skillName}" was removed, plugin version remains active.` };
  }

  async checkSkillUpdates() {
    const report = await this.checkAllSkills();
    const updates = [];

    const knownSkillUpstreams = {
      'brainstorming': { repo: 'https://github.com/obra/superpowers.git', name: 'Superpowers Library' },
      'test-driven-development': { repo: 'https://github.com/obra/superpowers.git', name: 'Superpowers Library' },
      'systematic-debugging': { repo: 'https://github.com/obra/superpowers.git', name: 'Superpowers Library' },
      'executing-plans': { repo: 'https://github.com/obra/superpowers.git', name: 'Superpowers Library' },
      'writing-plans': { repo: 'https://github.com/obra/superpowers.git', name: 'Superpowers Library' },
      'using-superpowers': { repo: 'https://github.com/obra/superpowers.git', name: 'Superpowers Library' },
      'subagent-driven-development': { repo: 'https://github.com/obra/superpowers.git', name: 'Superpowers Library' },
      'verification-before-completion': { repo: 'https://github.com/obra/superpowers.git', name: 'Superpowers Library' },
      'finishing-a-development-branch': { repo: 'https://github.com/obra/superpowers.git', name: 'Superpowers Library' },
      'dispatching-parallel-agents': { repo: 'https://github.com/obra/superpowers.git', name: 'Superpowers Library' },
      'using-git-worktrees': { repo: 'https://github.com/obra/superpowers.git', name: 'Superpowers Library' },
      'requesting-code-review': { repo: 'https://github.com/obra/superpowers.git', name: 'Superpowers Library' },
      'receiving-code-review': { repo: 'https://github.com/obra/superpowers.git', name: 'Superpowers Library' },
      'writing-skills': { repo: 'https://github.com/obra/superpowers.git', name: 'Superpowers Library' },
      'diagnosing-superpowers': { repo: 'https://github.com/obra/superpowers.git', name: 'Superpowers Library' },
      'karpathy-guidelines': { repo: 'https://github.com/forrestchang/andrej-karpathy-skills.git', name: 'Karpathy Skills' },
      'humanizer': { repo: 'https://github.com/blader/humanizer.git', name: 'Humanizer' }
    };

    for (const skill of report.skills) {
      if (skill.category === 'builtin') {
        updates.push({
          name: skill.name,
          displayName: skill.displayName,
          category: skill.category,
          currentVersion: 'Antigravity Core',
          latestVersion: 'Managed by Antigravity Engine',
          hasUpdate: false,
          upstream: 'Google DeepMind Core'
        });
        continue;
      }

      const upstream = knownSkillUpstreams[skill.name];
      if (upstream) {
        updates.push({
          name: skill.name,
          displayName: skill.displayName,
          category: skill.category,
          filePath: skill.filePath,
          currentVersion: skill.version || '1.0.0',
          latestVersion: 'Upstream Git Ready',
          hasUpdate: false,
          upstream: upstream.name,
          repoUrl: upstream.repo
        });
      } else {
        updates.push({
          name: skill.name,
          displayName: skill.displayName,
          category: skill.category,
          filePath: skill.filePath,
          currentVersion: skill.version || '1.0.0',
          latestVersion: skill.version || '1.0.0',
          hasUpdate: false,
          upstream: skill.parentPlugin ? `Plugin: ${skill.parentPlugin}` : 'Custom Local'
        });
      }
    }

    return updates;
  }

  async updateSkill(skillName) {
    const knownSkillUpstreams = {
      'brainstorming': { repo: 'https://github.com/obra/superpowers.git', subPath: 'skills/brainstorming' },
      'test-driven-development': { repo: 'https://github.com/obra/superpowers.git', subPath: 'skills/test-driven-development' },
      'systematic-debugging': { repo: 'https://github.com/obra/superpowers.git', subPath: 'skills/systematic-debugging' },
      'executing-plans': { repo: 'https://github.com/obra/superpowers.git', subPath: 'skills/executing-plans' },
      'writing-plans': { repo: 'https://github.com/obra/superpowers.git', subPath: 'skills/writing-plans' },
      'using-superpowers': { repo: 'https://github.com/obra/superpowers.git', subPath: 'skills/using-superpowers' },
      'subagent-driven-development': { repo: 'https://github.com/obra/superpowers.git', subPath: 'skills/subagent-driven-development' },
      'verification-before-completion': { repo: 'https://github.com/obra/superpowers.git', subPath: 'skills/verification-before-completion' },
      'finishing-a-development-branch': { repo: 'https://github.com/obra/superpowers.git', subPath: 'skills/finishing-a-development-branch' },
      'dispatching-parallel-agents': { repo: 'https://github.com/obra/superpowers.git', subPath: 'skills/dispatching-parallel-agents' },
      'using-git-worktrees': { repo: 'https://github.com/obra/superpowers.git', subPath: 'skills/using-git-worktrees' },
      'requesting-code-review': { repo: 'https://github.com/obra/superpowers.git', subPath: 'skills/requesting-code-review' },
      'receiving-code-review': { repo: 'https://github.com/obra/superpowers.git', subPath: 'skills/receiving-code-review' },
      'writing-skills': { repo: 'https://github.com/obra/superpowers.git', subPath: 'skills/writing-skills' },
      'diagnosing-superpowers': { repo: 'https://github.com/obra/superpowers.git', subPath: 'skills/diagnosing-superpowers' },
      'karpathy-guidelines': { repo: 'https://github.com/forrestchang/andrej-karpathy-skills.git', subPath: 'skills/karpathy-guidelines' },
      'humanizer': { repo: 'https://github.com/blader/humanizer.git', subPath: '' },
      'writing-clearly-and-concisely': { repo: 'https://github.com/obra/the-elements-of-style.git', subPath: 'skills/writing-clearly-and-concisely' }
    };

    const report = await this.checkAllSkills();
    const existing = report.skills.find(s => s.name === skillName || s.displayName === skillName);

    let targetSkillDir = path.join(this.skillsDir, skillName);
    if (existing) {
      targetSkillDir = path.dirname(existing.filePath);
    }
    fs.mkdirSync(targetSkillDir, { recursive: true });

    let upstream = knownSkillUpstreams[skillName];
    if (!upstream && existing && existing.parentPlugin) {
      const { Registry } = await import('./registry.js');
      const reg = new Registry();
      const pl = reg.get(existing.parentPlugin);
      if (pl && pl.gitUrl) {
        upstream = { repo: pl.gitUrl, subPath: `skills/${skillName}` };
      }
    }

    if (!upstream) {
      throw new Error(`No automated upstream repository configured for skill "${skillName}". You can update its parent plugin instead.`);
    }

    const os = await import('node:os');
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execFileAsync = promisify(execFile);

    const tempDir = path.join(os.tmpdir(), `agymp_update_${skillName}_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      await execFileAsync('git', ['clone', '--depth', '1', upstream.repo, tempDir]);
      
      let sourceSkillPath = path.join(tempDir, upstream.subPath);
      if (!fs.existsSync(sourceSkillPath) || !fs.statSync(sourceSkillPath).isDirectory()) {
        if (fs.existsSync(path.join(tempDir, 'SKILL.md'))) {
          sourceSkillPath = tempDir;
        } else if (fs.existsSync(path.join(tempDir, 'skills', skillName))) {
          sourceSkillPath = path.join(tempDir, 'skills', skillName);
        }
      }

      if (fs.existsSync(sourceSkillPath)) {
        if (fs.statSync(sourceSkillPath).isDirectory()) {
          const files = fs.readdirSync(sourceSkillPath);
          for (const file of files) {
            if (file === '.git') continue;
            const src = path.join(sourceSkillPath, file);
            const dst = path.join(targetSkillDir, file);
            if (fs.statSync(src).isDirectory()) {
              fs.cpSync(src, dst, { recursive: true, filter: (source) => !source.includes('.git') });
            } else {
              fs.copyFileSync(src, dst);
            }
          }
        } else {
          fs.copyFileSync(sourceSkillPath, path.join(targetSkillDir, 'SKILL.md'));
        }
        return { success: true, skillName, message: `Skill "${skillName}" successfully updated from upstream repository.` };
      } else {
        throw new Error(`Upstream repository does not contain skill files for "${skillName}".`);
      }
    } finally {
      if (fs.existsSync(tempDir)) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
      }
    }
  }

  async uninstallPlugin(pluginName) {
    const targetDir = path.join(this.pluginsDir, pluginName);
    if (!fs.existsSync(targetDir)) {
      throw new Error(`Plugin "${pluginName}" does not exist in ${this.pluginsDir}.`);
    }

    fs.rmSync(targetDir, { recursive: true, force: true });
    return { success: true, pluginName, message: `Plugin "${pluginName}" completely uninstalled and removed from Antigravity.` };
  }

  async getRulesList() {
    const rules = [];
    const candidates = [
      {
        name: 'Antigravity Global System Directive',
        path: path.join(this.userHome, '.gemini', 'GEMINI.md'),
        scope: 'Global System',
        target: 'Antigravity / Gemini Core',
        description: 'Primary global behavioral rules and execution guidelines for Antigravity.'
      },
      {
        name: 'Superpowers Global AGENTS Rules',
        path: path.join(this.userHome, '.gemini', 'config', 'superpowers', 'AGENTS.md'),
        scope: 'Global Engineering Framework',
        target: 'Subagents & Engineering Rules',
        description: 'Subagent orchestration directives, test-driven requirements, and debugging protocols.'
      },
      {
        name: 'Superpowers Global GEMINI Rules',
        path: path.join(this.userHome, '.gemini', 'config', 'superpowers', 'GEMINI.md'),
        scope: 'Global Guidelines',
        target: 'Verification Protocols',
        description: 'Strict pre-completion verification and non-speculative problem-solving directives.'
      }
    ];

    if (fs.existsSync(this.pluginsDir)) {
      const pDirs = fs.readdirSync(this.pluginsDir);
      for (const pName of pDirs) {
        const pDir = path.join(this.pluginsDir, pName);
        try {
          if (!fs.statSync(pDir).isDirectory()) continue;
          const ruleFiles = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'RULES.md'];
          for (const rf of ruleFiles) {
            const rPath = path.join(pDir, rf);
            if (fs.existsSync(rPath)) {
              candidates.push({
                name: `${pName} (${rf})`,
                path: rPath,
                scope: `Plugin: ${pName}`,
                target: 'Plugin Rules & Guidance',
                description: `Specialized operational rules and context provided by the ${pName} plugin.`
              });
            }
          }
        } catch (e) {}
      }
    }

    for (const c of candidates) {
      if (fs.existsSync(c.path)) {
        try {
          const stat = fs.statSync(c.path);
          const raw = fs.readFileSync(c.path, 'utf8');
          const lines = raw.split(/\r?\n/);
          rules.push({
            name: c.name,
            path: c.path,
            scope: c.scope,
            target: c.target,
            description: c.description,
            size: stat.size,
            linesCount: lines.length,
            preview: lines.slice(0, 15).join('\n')
          });
        } catch (e) {}
      }
    }

    return rules;
  }

  async getMcpList() {
    const servers = [];
    const seenNames = new Set();
    const mcpConfigPaths = [
      path.join(this.antigravityDir, 'mcp_config.json'),
      path.join(this.userHome, '.gemini', 'config', 'mcp_config.json')
    ];

    for (const cfgPath of mcpConfigPaths) {
      if (fs.existsSync(cfgPath)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
          const srvs = parsed.mcpServers || {};
          for (const [sName, sCfg] of Object.entries(srvs)) {
            if (seenNames.has(sName)) continue;
            seenNames.add(sName);

            const schemaDir = path.join(this.antigravityDir, 'mcp', sName);
            let tools = [];
            if (fs.existsSync(schemaDir)) {
              const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.json'));
              tools = files.map(f => {
                try {
                  const schema = JSON.parse(fs.readFileSync(path.join(schemaDir, f), 'utf8'));
                  return {
                    name: f.replace('.json', ''),
                    description: schema.description || 'MCP Tool',
                    parameters: schema.parameters ? Object.keys(schema.parameters.properties || {}) : []
                  };
                } catch {
                  return { name: f.replace('.json', ''), description: 'MCP Tool', parameters: [] };
                }
              });
            }

            servers.push({
              name: sName,
              command: sCfg.command || 'node',
              args: sCfg.args || [],
              env: sCfg.env || {},
              status: 'Configured & Active',
              configPath: cfgPath,
              toolsCount: tools.length,
              tools: tools
            });
          }
        } catch (e) {}
      }
    }

    return servers;
  }

  async getAgentsList() {
    const agents = [
      {
        name: 'self',
        role: 'Parent Clone Subagent',
        type: 'builtin',
        origin: 'Antigravity Core',
        model: 'inherit',
        description: 'Inherits parent agent full configuration including tools, system prompt, and model. Runs in a separate conversation context for multi-agent workflows.',
        tools: ['all (read, write, terminal, mcp, subagents)']
      },
      {
        name: 'research',
        role: 'Research & Codebase Surveyor',
        type: 'builtin',
        origin: 'Antigravity Core',
        model: 'flash / inherit',
        description: 'Read-only subagent equipped for deep codebase surveying, web research, and documentation extraction without polluting the main context.',
        tools: ['view_file', 'read_url_content', 'search_web', 'send_message']
      },
      {
        name: 'image-generator',
        role: 'Creative Visual Synthesizer',
        type: 'builtin',
        origin: 'Antigravity Core',
        model: 'inherit',
        description: 'Generates or edits visual images and design assets based on user prompts and responds with saved local file paths.',
        tools: ['generate_image', 'send_message']
      }
    ];

    if (fs.existsSync(this.pluginsDir)) {
      const pDirs = fs.readdirSync(this.pluginsDir);
      for (const p of pDirs) {
        const pAgentsDir = path.join(this.pluginsDir, p, 'agents');
        if (fs.existsSync(pAgentsDir)) {
          const aFiles = fs.readdirSync(pAgentsDir);
          for (const af of aFiles) {
            agents.push({
              name: `${p}/${af.replace(/\.[^.]+$/, '')}`,
              role: `Plugin Persona: ${af}`,
              type: 'plugin',
              origin: `Plugin: ${p}`,
              filePath: path.join(pAgentsDir, af),
              description: `Custom agent definition configured in the ${p} plugin.`,
              tools: ['plugin-defined']
            });
          }
        }
      }
    }

    const claudeMarkets = path.join(this.userHome, '.claude', 'plugins', 'marketplaces');
    if (fs.existsSync(claudeMarkets)) {
      try {
        for (const m of fs.readdirSync(claudeMarkets)) {
          const mAgentsDir = path.join(claudeMarkets, m, 'agents');
          if (fs.existsSync(mAgentsDir)) {
            for (const af of fs.readdirSync(mAgentsDir)) {
              agents.push({
                name: `${m}/${af.replace(/\.[^.]+$/, '')}`,
                role: 'Discovered Marketplace Agent',
                type: 'marketplace',
                origin: `Marketplace: ${m}`,
                filePath: path.join(mAgentsDir, af),
                description: `Claude marketplace agent definition ready for Antigravity compatibility.`,
                tools: ['claude-agent']
              });
            }
          }
        }
      } catch (e) {}
    }

    return agents;
  }
}
