import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { CONFIG } from '../config.js';

const execFileAsync = promisify(execFile);

export class MarketplaceManager {
  constructor(options = {}) {
    this.knownMarketplacesFile = options.knownMarketplacesFile || CONFIG.claudeKnownMarketplaces;
    this.customMarketplacesFile = options.customMarketplacesFile || CONFIG.customMarketplacesManifest;
    this.marketplacesDir = options.marketplacesDir || CONFIG.claudeMarketplacesDir;
    this.customMarketplacesDir = options.customMarketplacesDir || CONFIG.customMarketplacesDir;
    this.directoryCacheFile = options.directoryCacheFile || path.join(CONFIG.claudePluginsDir, 'plugin-directory-cache-v2.json');
  }

  getRegisteredMarketplaces() {
    const result = {};

    if (fs.existsSync(this.knownMarketplacesFile)) {
      try {
        const known = JSON.parse(fs.readFileSync(this.knownMarketplacesFile, 'utf8'));
        for (const [name, info] of Object.entries(known)) {
          if (info.installLocation && fs.existsSync(info.installLocation)) {
            result[name] = {
              name,
              source: info.source,
              installLocation: info.installLocation,
              lastUpdated: info.lastUpdated,
              type: 'claude-marketplace'
            };
          }
        }
      } catch (e) {
        console.warn('Could not read known_marketplaces.json:', e.message);
      }
    }

    if (fs.existsSync(this.customMarketplacesFile)) {
      try {
        const custom = JSON.parse(fs.readFileSync(this.customMarketplacesFile, 'utf8'));
        for (const [name, info] of Object.entries(custom)) {
          result[name] = {
            ...info,
            type: 'custom-marketplace'
          };
        }
      } catch (e) {}
    }

    return result;
  }

  async addCustomMarketplace(gitUrl) {
    if (!gitUrl || !gitUrl.startsWith('http')) {
      throw new Error('Invalid Git repository URL.');
    }

    const repoMatch = gitUrl.replace(/\.git$/, '').split('/').slice(-2);
    const repoName = repoMatch.join('-').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const targetDir = path.join(this.customMarketplacesDir, repoName);

    fs.mkdirSync(this.customMarketplacesDir, { recursive: true });

    let commitSha = null;
    if (fs.existsSync(path.join(targetDir, '.git'))) {
      try {
        await execFileAsync('git', ['pull'], { cwd: targetDir });
      } catch (e) {}
    } else {
      await execFileAsync('git', ['clone', '--depth', '1', gitUrl, targetDir]);
    }

    try {
      const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: targetDir });
      commitSha = stdout.trim();
    } catch (e) {}

    const discovered = new Map();
    this.scanMarketplaceDir(targetDir, repoName, discovered, gitUrl);

    const items = Array.from(discovered.values());

    let customManifest = {};
    if (fs.existsSync(this.customMarketplacesFile)) {
      try {
        customManifest = JSON.parse(fs.readFileSync(this.customMarketplacesFile, 'utf8'));
      } catch (e) {}
    }

    customManifest[repoName] = {
      name: repoName,
      source: { type: 'git', url: gitUrl },
      installLocation: targetDir,
      commitSha,
      itemCount: items.length,
      lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync(this.customMarketplacesFile, JSON.stringify(customManifest, null, 2), 'utf8');

    return {
      success: true,
      marketplaceName: repoName,
      gitUrl,
      installLocation: targetDir,
      itemCount: items.length,
      items
    };
  }

  async listAvailablePlugins(includeCommunityCache = false) {
    const plugins = new Map();
    const marketplaces = this.getRegisteredMarketplaces();

    for (const [name, info] of Object.entries(marketplaces)) {
      if (info.installLocation && fs.existsSync(info.installLocation)) {
        const gitUrl = info.source?.url || null;
        this.scanMarketplaceDir(info.installLocation, name, plugins, gitUrl);
      }
    }

    if (includeCommunityCache && fs.existsSync(this.directoryCacheFile)) {
      try {
        const cache = JSON.parse(fs.readFileSync(this.directoryCacheFile, 'utf8'));
        if (cache && cache.listings) {
          const listings = Array.isArray(cache.listings) ? cache.listings : Object.values(cache.listings);
          for (const item of listings) {
            if (!item || !item.name) continue;
            const id = `${item.name}@community`;
            if (!plugins.has(id)) {
              plugins.set(id, {
                id,
                name: item.name,
                marketplace: 'community-directory',
                description: item.summary || item.description || '',
                version: item.version || 'latest',
                author: item.author || (item.source?.repository?.owner) || 'community',
                source: item.source || { type: 'git', url: item.links?.github || '' },
                gitUrl: item.links?.github || item.source?.url || null,
                keywords: item.keywords || item.surfaces || [],
                installed: false
              });
            }
          }
        }
      } catch (e) {
        console.warn('Failed parsing directory cache:', e.message);
      }
    }

    return Array.from(plugins.values());
  }

  scanMarketplaceDir(mpPath, mpName, plugins, fallbackGitUrl = null) {
    let resolvedGitUrl = fallbackGitUrl;
    if (!resolvedGitUrl && fs.existsSync(path.join(mpPath, '.git'))) {
      try {
        const configStr = fs.readFileSync(path.join(mpPath, '.git', 'config'), 'utf8');
        const urlMatch = configStr.match(/url\s*=\s*(.+)$/m);
        if (urlMatch) resolvedGitUrl = urlMatch[1].trim();
      } catch (e) {}
    }

    const mpJsonCandidates = [
      path.join(mpPath, '.claude-plugin', 'marketplace.json'),
      path.join(mpPath, 'marketplace.json')
    ];

    let foundMpJson = false;
    for (const jsonPath of mpJsonCandidates) {
      if (fs.existsSync(jsonPath)) {
        try {
          const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          if (Array.isArray(content.plugins)) {
            for (const p of content.plugins) {
              const id = `${p.name}@${mpName}`;
              const pluginGitUrl = p.source?.url || (typeof p.source === 'string' && p.source.startsWith('http') ? p.source : resolvedGitUrl);
              let author = p.author?.name || p.author || content.owner?.name || mpName;
              let authorUrl = p.author?.url || p.homepage || null;
              if (typeof author === 'object' && author !== null) {
                authorUrl = author.url || authorUrl;
                author = author.name || author.username || 'Community';
              }
              let repoUrl = p.repository?.url || p.repository || pluginGitUrl;
              if (typeof repoUrl === 'object' && repoUrl !== null) {
                repoUrl = repoUrl.url || null;
              }
              if (typeof repoUrl === 'string') {
                repoUrl = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');
              }
              plugins.set(id, {
                id,
                name: p.name,
                displayName: p.displayName || p.name,
                marketplace: mpName,
                description: p.description || '',
                version: p.version || '1.0.0',
                author: typeof author === 'string' ? author : 'Community',
                authorUrl,
                source: p.source || { type: 'local', path: mpPath },
                gitUrl: repoUrl || pluginGitUrl,
                repository: repoUrl || pluginGitUrl,
                marketplacePath: mpPath,
                keywords: p.keywords || [],
                category: p.category || 'tools'
              });
            }
            foundMpJson = true;
          }
        } catch (e) {
          console.warn(`Error reading ${jsonPath}:`, e.message);
        }
      }
    }

    const subPluginsDir = path.join(mpPath, 'plugins');
    if (fs.existsSync(subPluginsDir)) {
      const entries = fs.readdirSync(subPluginsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const pDir = path.join(subPluginsDir, entry.name);
        const id = `${entry.name}@${mpName}`;
        if (!plugins.has(id)) {
          let desc = `Plugin ${entry.name}`;
          let version = '1.0.0';
          let author = mpName;
          let authorUrl = null;
          let repoUrl = resolvedGitUrl;
          const pJson = path.join(pDir, '.claude-plugin', 'plugin.json');
          if (fs.existsSync(pJson)) {
            try {
              const meta = JSON.parse(fs.readFileSync(pJson, 'utf8'));
              desc = meta.description || desc;
              version = meta.version || version;
              if (meta.author) {
                if (typeof meta.author === 'object' && meta.author !== null) {
                  author = meta.author.name || meta.author.username || author;
                  authorUrl = meta.author.url || null;
                } else if (typeof meta.author === 'string') {
                  author = meta.author;
                }
              }
              if (meta.repository) {
                repoUrl = typeof meta.repository === 'object' ? meta.repository.url : meta.repository;
              }
              if (meta.homepage && !authorUrl) authorUrl = meta.homepage;
            } catch (e) {}
          }
          if (typeof repoUrl === 'string') {
            repoUrl = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');
          }
          plugins.set(id, {
            id,
            name: entry.name,
            displayName: entry.name,
            marketplace: mpName,
            description: desc,
            version,
            author: typeof author === 'string' ? author : 'Community',
            authorUrl,
            source: { type: 'local', path: pDir },
            gitUrl: repoUrl || resolvedGitUrl,
            repository: repoUrl || resolvedGitUrl,
            marketplacePath: mpPath,
            keywords: [],
            category: 'plugin'
          });
        }
      }
    }

    const skillsFolder = path.join(mpPath, 'skills');
    if (fs.existsSync(skillsFolder)) {
      const sEntries = fs.readdirSync(skillsFolder, { withFileTypes: true });
      for (const s of sEntries) {
        if (s.isDirectory()) {
          const sId = `${s.name}@${mpName}`;
          if (!plugins.has(sId)) {
            let desc = `Skill ${s.name}`;
            let author = mpName;
            let version = '1.0.0';
            const skillMd = path.join(skillsFolder, s.name, 'SKILL.md');
            if (fs.existsSync(skillMd)) {
              const content = fs.readFileSync(skillMd, 'utf8');
              const descMatch = content.match(/description:\s*["']?([^"\n]+)["']?/);
              if (descMatch) desc = descMatch[1].trim();
              const authorMatch = content.match(/author:\s*["']?([^"\n]+)["']?/);
              if (authorMatch) author = authorMatch[1].trim();
              const versionMatch = content.match(/version:\s*["']?([^"\n]+)["']?/);
              if (versionMatch) version = versionMatch[1].trim();
            }
            plugins.set(sId, {
              id: sId,
              name: s.name,
              displayName: s.name,
              marketplace: mpName,
              description: desc,
              version,
              author: typeof author === 'string' ? author : 'Community',
              source: { type: 'local', path: path.join(skillsFolder, s.name) },
              gitUrl: resolvedGitUrl,
              repository: resolvedGitUrl,
              marketplacePath: mpPath,
              keywords: ['skill'],
              category: 'skill'
            });
          }
        }
      }
    }

    if (!foundMpJson && !fs.existsSync(subPluginsDir)) {
      const id = `${mpName}@${mpName}`;
      if (!plugins.has(id)) {
        let desc = `Plugin ${mpName}`;
        let version = '1.0.0';
        let author = mpName;
        let authorUrl = null;
        let repoUrl = resolvedGitUrl;
        const pJson = path.join(mpPath, '.claude-plugin', 'plugin.json');
        if (fs.existsSync(pJson)) {
          try {
            const meta = JSON.parse(fs.readFileSync(pJson, 'utf8'));
            desc = meta.description || desc;
            version = meta.version || version;
            if (meta.author) {
              if (typeof meta.author === 'object' && meta.author !== null) {
                author = meta.author.name || meta.author.username || author;
                authorUrl = meta.author.url || null;
              } else if (typeof meta.author === 'string') {
                author = meta.author;
              }
            }
            if (meta.repository) {
              repoUrl = typeof meta.repository === 'object' ? meta.repository.url : meta.repository;
            }
          } catch (e) {}
        }
        if (typeof repoUrl === 'string') {
          repoUrl = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');
        }
        plugins.set(id, {
          id,
          name: mpName,
          displayName: mpName,
          marketplace: mpName,
          description: desc,
          version,
          author: typeof author === 'string' ? author : 'Community',
          authorUrl,
          source: { type: 'local', path: mpPath },
          gitUrl: repoUrl || resolvedGitUrl,
          repository: repoUrl || resolvedGitUrl,
          marketplacePath: mpPath,
          keywords: []
        });
      }
    }
  }

  async updateMarketplace(marketName) {
    const markets = this.getRegisteredMarketplaces();
    const market = markets[marketName];
    if (!market || !market.installLocation || !fs.existsSync(market.installLocation)) {
      throw new Error(`Marketplace "${marketName}" not found.`);
    }

    if (fs.existsSync(path.join(market.installLocation, '.git'))) {
      try {
        await execFileAsync('git', ['pull'], { cwd: market.installLocation });
      } catch (e) {
        throw new Error(`Git pull failed for marketplace "${marketName}": ${e.message}`);
      }
    }

    const discovered = new Map();
    const gitUrl = market.source?.url || null;
    this.scanMarketplaceDir(market.installLocation, marketName, discovered, gitUrl);
    const items = Array.from(discovered.values());

    if (fs.existsSync(this.customMarketplacesFile)) {
      try {
        const custom = JSON.parse(fs.readFileSync(this.customMarketplacesFile, 'utf8'));
        if (custom[marketName]) {
          custom[marketName].itemCount = items.length;
          custom[marketName].lastUpdated = new Date().toISOString();
          fs.writeFileSync(this.customMarketplacesFile, JSON.stringify(custom, null, 2), 'utf8');
        }
      } catch (e) {}
    }

    return {
      success: true,
      marketName,
      itemCount: items.length,
      items,
      message: `Marketplace "${marketName}" updated successfully.`
    };
  }

  async removeMarketplace(marketName) {
    const markets = this.getRegisteredMarketplaces();
    const market = markets[marketName];

    if (fs.existsSync(this.customMarketplacesFile)) {
      try {
        const custom = JSON.parse(fs.readFileSync(this.customMarketplacesFile, 'utf8'));
        if (custom[marketName]) {
          delete custom[marketName];
          fs.writeFileSync(this.customMarketplacesFile, JSON.stringify(custom, null, 2), 'utf8');
        }
      } catch (e) {}
    }

    if (market && market.installLocation && market.installLocation.startsWith(this.customMarketplacesDir)) {
      if (fs.existsSync(market.installLocation)) {
        fs.rmSync(market.installLocation, { recursive: true, force: true });
      }
    }

    return {
      success: true,
      marketName,
      message: `Marketplace "${marketName}" removed successfully.`
    };
  }

  clearCache() {
    if (fs.existsSync(this.directoryCacheFile)) {
      try {
        fs.rmSync(this.directoryCacheFile, { force: true });
      } catch (e) {}
    }
  }
}
