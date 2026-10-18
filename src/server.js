import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MarketplaceManager } from './core/marketplace.js';
import { Installer } from './core/installer.js';
import { Updater } from './core/updater.js';
import { Registry } from './core/registry.js';
import { PluginConverter } from './core/converter.js';
import { SkillChecker } from './core/skill_checker.js';
import { CONFIG } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDir = path.join(__dirname, 'web');

export function startServer(port = CONFIG.serverPort) {
  const marketplace = new MarketplaceManager();
  const registry = new Registry();
  const installer = new Installer({ registry });
  const updater = new Updater({ registry, marketplace, installer });
  const converter = new PluginConverter();
  const skillChecker = new SkillChecker();

  let cachedPlugins = null;
  let cacheTime = 0;

  async function getAvailablePluginsCached(includeCommunity = false) {
    const now = Date.now();
    if (!cachedPlugins || now - cacheTime > 20000 || includeCommunity) {
      cachedPlugins = await marketplace.listAvailablePlugins(includeCommunity);
      cacheTime = now;
    }
    return cachedPlugins;
  }

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    const json = (data, status = 200) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    };

    const readBody = () => new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });

    try {
      if (req.method === 'GET' && pathname === '/api/marketplaces') {
        const includeCommunity = url.searchParams.get('community') === 'true';
        const plugins = await getAvailablePluginsCached(includeCommunity);
        const installed = registry.getAll();
        const installedIds = new Set(installed.map(i => i.id));
        const installedNames = new Set(installed.map(i => i.name));

        const enriched = plugins.map(p => ({
          ...p,
          installed: installedIds.has(p.id) || installedNames.has(p.name)
        }));

        return json({
          success: true,
          count: enriched.length,
          marketplaces: marketplace.getRegisteredMarketplaces(),
          plugins: enriched
        });
      }

      if (req.method === 'POST' && pathname === '/api/marketplaces/add') {
        const body = await readBody();
        const result = await marketplace.addCustomMarketplace(body.gitUrl);
        cachedPlugins = null;
        return json(result);
      }

      if (req.method === 'POST' && pathname === '/api/marketplaces/update') {
        const body = await readBody();
        const result = await marketplace.updateMarketplace(body.name);
        cachedPlugins = null;
        return json(result);
      }

      if (req.method === 'POST' && pathname === '/api/marketplaces/remove') {
        const body = await readBody();
        const result = await marketplace.removeMarketplace(body.name);
        cachedPlugins = null;
        return json(result);
      }

      if (req.method === 'POST' && pathname === '/api/cache/reset') {
        cachedPlugins = null;
        if (typeof marketplace.clearCache === 'function') {
          marketplace.clearCache();
        }
        return json({ success: true, message: 'Server and marketplace caches have been reset.' });
      }

      if (req.method === 'GET' && pathname === '/api/installed') {
        const installed = registry.getAll();
        return json({ success: true, installed });
      }

      if (req.method === 'GET' && pathname === '/api/updates') {
        const updates = await updater.checkForUpdates();
        return json({ success: true, updates });
      }

      if (req.method === 'GET' && pathname === '/api/skills/check') {
        const skillsReport = await skillChecker.checkAllSkills();
        return json({ success: true, ...skillsReport });
      }

      if (req.method === 'POST' && pathname === '/api/skills/delete-path') {
        const body = await readBody();
        const result = await skillChecker.deleteSkillByPath(body.path);
        return json(result);
      }

      if (req.method === 'POST' && pathname === '/api/skills/delete-standalone') {
        const body = await readBody();
        const result = await skillChecker.deleteStandaloneSkill(body.skillName);
        return json(result);
      }

      if (req.method === 'GET' && pathname === '/api/skills/updates') {
        const updates = await skillChecker.checkSkillUpdates();
        return json({ success: true, updates });
      }

      if (req.method === 'POST' && pathname === '/api/skills/update') {
        const body = await readBody();
        const result = await skillChecker.updateSkill(body.name);
        return json(result);
      }

      if (req.method === 'POST' && pathname === '/api/plugins/uninstall') {
        const body = await readBody();
        const result = await skillChecker.uninstallPlugin(body.name);
        try {
          installer.registry.unregister(body.name);
        } catch (e) {}
        return json(result);
      }

      if (req.method === 'POST' && pathname === '/api/skills/consolidate') {
        const body = await readBody();
        const result = await skillChecker.consolidateSkills(body.skillNames, body.pluginName || 'superpowers');
        return json(result);
      }

      if (req.method === 'GET' && pathname === '/api/skills/content') {
        const filePath = url.searchParams.get('path');
        if (filePath && fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          return json({ success: true, content, filePath });
        }
        return json({ success: false, error: 'Skill file not found.' }, 404);
      }

      if (req.method === 'GET' && pathname === '/api/rules') {
        const rules = await skillChecker.getRulesList();
        return json({ success: true, rules });
      }

      if (req.method === 'GET' && pathname === '/api/rules/content') {
        const filePath = url.searchParams.get('path');
        if (filePath && fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          return json({ success: true, content, filePath });
        }
        return json({ success: false, error: 'Rule file not found.' }, 404);
      }

      if (req.method === 'GET' && pathname === '/api/mcp') {
        const servers = await skillChecker.getMcpList();
        const totalTools = servers.reduce((acc, s) => acc + (s.toolsCount || 0), 0);
        return json({ success: true, servers, totalTools });
      }

      if (req.method === 'GET' && pathname === '/api/agents') {
        const agents = await skillChecker.getAgentsList();
        return json({ success: true, agents, count: agents.length });
      }

      if (req.method === 'GET' && pathname === '/api/app-version') {
        const versionFilePath = path.join(process.cwd(), '.version');
        let localVersion = '0.1';
        if (fs.existsSync(versionFilePath)) {
          localVersion = fs.readFileSync(versionFilePath, 'utf8').trim();
        }

        const repoUrl = 'https://github.com/Yamiru/Claugravity';
        const blobUrl = 'https://github.com/Yamiru/Claugravity/blob/main/.version';
        const rawVersionUrl = 'https://raw.githubusercontent.com/Yamiru/Claugravity/main/.version';
        let latestVersion = localVersion;
        let hasUpdate = false;

        function parseVersion(v) {
          if (!v) return { major: 0, minor: 0, patch: 0, stage: 'beta', raw: '0.0' };
          const clean = String(v).trim().replace(/^v/i, '');
          const match = clean.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([a-zA-Z0-9.]+))?/);
          if (!match) return { major: 0, minor: 0, patch: 0, stage: 'beta', raw: clean };
          const major = parseInt(match[1] || '0', 10);
          const minor = parseInt(match[2] || '0', 10);
          const patch = parseInt(match[3] || '0', 10);
          const stage = major === 0 ? 'beta' : 'stable';
          return { major, minor, patch, stage, raw: clean };
        }

        function isNewer(latestStr, localStr) {
          const latest = parseVersion(latestStr);
          const local = parseVersion(localStr);
          if (latest.major > local.major) return true;
          if (latest.major < local.major) return false;
          if (latest.minor > local.minor) return true;
          if (latest.minor < local.minor) return false;
          if (latest.patch > local.patch) return true;
          return false;
        }

        try {
          const https = await import('node:https');
          const fetchVersionFromUrl = (urlStr, maxRedirects = 3) => {
            return new Promise((resolve) => {
              if (maxRedirects < 0) return resolve(localVersion);
              const req = https.get(urlStr, {
                headers: { 'User-Agent': 'Claugravity-App-Version-Checker' },
                timeout: 4000
              }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                  return resolve(fetchVersionFromUrl(res.headers.location, maxRedirects - 1));
                }
                if (res.statusCode === 200) {
                  let data = '';
                  res.on('data', chunk => data += chunk);
                  res.on('end', () => {
                    let text = data.trim();
                    const match = text.match(/\b([0-9]+\.[0-9]+(?:\.[0-9]+)?(?:-[a-zA-Z0-9_.]*)?)\b/);
                    if (text.length > 50 && match) {
                      resolve(match[1]);
                    } else if (text.length <= 50 && text.length > 0) {
                      resolve(text);
                    } else {
                      resolve(localVersion);
                    }
                  });
                } else {
                  resolve(localVersion);
                }
              });
              req.on('error', () => resolve(localVersion));
              req.on('timeout', () => { req.destroy(); resolve(localVersion); });
            });
          };

          latestVersion = await fetchVersionFromUrl(rawVersionUrl);
          hasUpdate = isNewer(latestVersion, localVersion);
        } catch (e) {}

        const localParsed = parseVersion(localVersion);
        const displayLabel = localParsed.stage === 'beta'
          ? `v${localParsed.raw} (Beta)`
          : `v${localParsed.raw}`;

        return json({
          success: true,
          version: localVersion,
          latestVersion,
          hasUpdate,
          stage: localParsed.stage,
          displayLabel,
          repoUrl,
          blobUrl,
          rawVersionUrl
        });
      }

      if (req.method === 'POST' && pathname === '/api/skills/create') {
        const body = await readBody();
        const skillName = (body.name || '').trim().replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
        if (!skillName) return json({ success: false, error: 'Provide a valid skill name.' }, 400);

        const targetDir = path.join(CONFIG.antigravitySkillsDir, skillName);
        fs.mkdirSync(targetDir, { recursive: true });

        const frontmatter = `---
name: ${skillName}
description: "${(body.description || `Skill ${skillName} for Antigravity`).replace(/"/g, "'")}"
version: "1.0.0"
author: "${(body.author || 'User').replace(/"/g, "'")}"
---

# ${skillName}

${body.instructions || 'Detailed instructions for Antigravity agent...'}`;

        fs.writeFileSync(path.join(targetDir, 'SKILL.md'), frontmatter, 'utf8');
        return json({ success: true, name: skillName, path: targetDir });
      }

      if (req.method === 'POST' && pathname === '/api/install') {
        const body = await readBody();
        const available = await getAvailablePluginsCached(true);
        const target = available.find(p => p.id === body.id || p.name === body.name) || body;

        const result = await installer.install(target, { scope: body.scope || 'global' });
        return json(result);
      }

      if (req.method === 'POST' && pathname === '/api/install-batch') {
        const body = await readBody();
        const items = body.items || [];
        const results = [];
        for (const item of items) {
          try {
            const res = await installer.install(item, { scope: body.scope || 'global' });
            results.push(res);
          } catch (e) {
            results.push({ success: false, name: item.name, error: e.message });
          }
        }
        return json({ success: true, results });
      }

      if (req.method === 'POST' && pathname === '/api/uninstall') {
        const body = await readBody();
        const result = await installer.uninstall(body.id);
        return json(result);
      }

      if (req.method === 'POST' && pathname === '/api/update') {
        const body = await readBody();
        const result = await updater.updatePlugin(body.id);
        return json(result);
      }

      if (req.method === 'POST' && pathname === '/api/convert') {
        const body = await readBody();
        const targetDir = body.targetDir || path.join(CONFIG.antigravityPluginsDir, body.name);
        const result = await converter.convert(body.sourceDir, targetDir, {
          name: body.name,
          version: body.version || '1.0.0',
          description: body.description
        });
        return json({ success: true, result });
      }

      let filePath = path.join(webDir, pathname === '/' ? 'index.html' : pathname);
      if (!filePath.startsWith(webDir)) {
        res.writeHead(403);
        return res.end('Forbidden');
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const mimeTypes = {
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'application/javascript',
          '.svg': 'image/svg+xml',
          '.json': 'application/json'
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        return fs.createReadStream(filePath).pipe(res);
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');

    } catch (err) {
      console.error('Server error:', err);
      json({ success: false, error: err.message }, 500);
    }
  });

  server.listen(port, () => {
    const versionFilePath = path.join(process.cwd(), '.version');
    let localVersion = '0.1';
    if (fs.existsSync(versionFilePath)) {
      localVersion = fs.readFileSync(versionFilePath, 'utf8').trim();
    }
    const clean = localVersion.replace(/^v/i, '');
    const num = parseFloat(clean) || 0;
    const stage = (num < 1.0) ? ' (Beta)' : '';
    console.log(`\n🌌 Claugravity v${clean}${stage} running at: http://localhost:${port}`);
    console.log(`Ready: Claude marketplace browsing, Antigravity conversion, and update tracking.\n`);
  });

  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = parseInt(process.env.PORT || '4321', 10);
  startServer(port);
}
