import { MarketplaceManager } from './core/marketplace.js';
import { Installer } from './core/installer.js';
import { Updater } from './core/updater.js';
import { Registry } from './core/registry.js';
import { PluginConverter } from './core/converter.js';
import { SkillChecker } from './core/skill_checker.js';
import { startServer } from './server.js';
import { CONFIG } from './config.js';

const marketplace = new MarketplaceManager();
const registry = new Registry();
const installer = new Installer({ registry });
const updater = new Updater({ registry, marketplace, installer });
const converter = new PluginConverter();
const skillChecker = new SkillChecker();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'serve':
    case 'ui':
    case 'dashboard': {
      const port = parseInt(args[1], 10) || CONFIG.serverPort;
      startServer(port);
      break;
    }

    case 'list': {
      console.log('\nInstalled packages in Antigravity:');
      const installed = registry.getAll();
      if (installed.length === 0) {
        console.log('No installed packages recorded yet.');
      } else {
        for (const item of installed) {
          console.log(`- ${item.displayName || item.name} (v${item.version}) [ID: ${item.id}]`);
          console.log(`  Path: ${item.installPath}`);
          if (item.gitUrl) console.log(`  Git: ${item.gitUrl}`);
          if (item.commitSha) console.log(`  Commit: ${item.commitSha.slice(0, 7)}`);
        }
      }
      break;
    }

    case 'search': {
      const query = (args[1] || '').toLowerCase();
      console.log(`\nSearching for "${query}" across registered marketplaces...`);
      const all = await marketplace.listAvailablePlugins(true);
      const filtered = all.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.keywords && p.keywords.some(k => k.toLowerCase().includes(query)))
      );

      console.log(`Found ${filtered.length} matching packages:\n`);
      for (const p of filtered.slice(0, 20)) {
        console.log(`* ${p.name} (v${p.version}) [Market: ${p.marketplace}]`);
        console.log(`  ID: ${p.id}`);
        console.log(`  Description: ${p.description.slice(0, 100)}`);
        console.log('');
      }
      if (filtered.length > 20) {
        console.log(`... and ${filtered.length - 20} more packages. Open the web UI for the full catalog.`);
      }
      break;
    }

    case 'install': {
      const targetId = args[1];
      if (!targetId) {
        console.error('Error: Specify a plugin ID or name to install.');
        process.exit(1);
      }

      console.log(`\nPreparing installation: ${targetId}...`);
      const available = await marketplace.listAvailablePlugins(true);
      const target = available.find(p => p.id === targetId || p.name === targetId);

      if (!target) {
        console.error(`Plugin "${targetId}" was not found in known marketplaces.`);
        process.exit(1);
      }

      console.log(`Converting and adapting for Antigravity (${target.name})...`);
      const result = await installer.install(target);
      console.log(`Done: ${result.message}`);
      console.log(`Installed to: ${result.plugin.installPath}`);
      console.log(`Summary: ${result.plugin.stats.skillsCount} skills, Rules: ${result.plugin.stats.hasRules ? 'Yes' : 'No'}, MCP: ${result.plugin.stats.hasMcp ? 'Yes' : 'No'}`);
      break;
    }

    case 'add-market': {
      const gitUrl = args[1];
      if (!gitUrl) {
        console.error('Error: Provide a Git repository URL (for example: https://github.com/NVIDIA/skills.git).');
        process.exit(1);
      }

      console.log(`\nCloning and analyzing marketplace from ${gitUrl}...`);
      const res = await marketplace.addCustomMarketplace(gitUrl);
      console.log(`Marketplace "${res.marketplaceName}" added successfully.`);
      console.log(`Found items: ${res.itemCount}`);
      console.log('\nAvailable items for installation:');
      for (const item of res.items) {
        console.log(`- ${item.name} (${item.category || 'skill'}): ${item.description.slice(0, 80)}`);
        console.log(`  Install command: claugravity install "${item.id}"`);
      }
      break;
    }

    case 'skills-check': {
      console.log('\nChecking status, categories, and integrity of Antigravity skills...');
      const report = await skillChecker.checkAllSkills();
      const healthy = report.skills.filter(s => s.isHealthy && s.checks.securitySafe);

      console.log(`Total skills found: ${report.totalCount} (${healthy.length} verified healthy).`);
      console.log(`- From marketplace plugins: ${report.categories.plugin.length}`);
      console.log(`- Standalone skills: ${report.categories.standalone.length}`);
      console.log(`- Built-in Antigravity skills: ${report.categories.builtin.length}`);

      if (report.collisions.length > 0) {
        console.log(`\nName collisions detected (${report.collisions.length}):`);
        for (const c of report.collisions) {
          console.log(`* Skill "${c.skillName}":`);
          console.log(`  - Active: [${c.activeSkill.origin}] (takes precedence in Antigravity)`);
          for (const d of c.duplicates) {
            console.log(`  - Shadowed: [${d.origin}]`);
          }
          console.log(`  Resolution: run "claugravity clean-duplicate ${c.skillName}" to remove the duplicate copy.`);
        }
      }

      console.log('\nSkill Overview:');
      for (const s of report.skills) {
        const status = (s.isHealthy && s.checks.securitySafe) ? '[OK]' : '[WARN]';
        const activeMarker = s.isActive ? '(Active)' : '(Shadowed)';
        console.log(`${status} ${s.displayName} [${s.origin}] ${activeMarker}`);
      }
      break;
    }

    case 'clean-duplicate': {
      const skillName = args[1];
      const targetType = args[2] || 'standalone';
      if (!skillName) {
        console.error('Usage: claugravity clean-duplicate <skillName> [standalone|plugin]');
        console.error('Example: claugravity clean-duplicate humanizer standalone');
        process.exit(1);
      }

      if (targetType === 'plugin') {
        const report = await skillChecker.checkAllSkills();
        const found = report.skills.find(s => s.name === skillName && s.category === 'plugin');
        if (!found) {
          console.error(`Plugin skill "${skillName}" was not found.`);
          process.exit(1);
        }
        console.log(`\nRemoving plugin copy of "${skillName}" at ${found.filePath}...`);
        const res = await skillChecker.deleteSkillByPath(found.filePath);
        console.log(`${res.message} (Standalone copy remains active)`);
      } else {
        console.log(`\nRemoving standalone copy of "${skillName}"...`);
        const res = await skillChecker.deleteStandaloneSkill(skillName);
        console.log(`${res.message} (Plugin copy remains active)`);
      }
      break;
    }

    case 'consolidate': {
      const pluginName = args[1] || 'superpowers';
      console.log(`\nBundling standalone skills into plugin "${pluginName}"...`);
      const report = await skillChecker.checkAllSkills();
      const standaloneNames = report.categories.standalone.map(s => s.name);
      if (standaloneNames.length === 0) {
        console.log('No standalone skills found to consolidate.');
        break;
      }
      const res = await skillChecker.consolidateSkills(standaloneNames, pluginName);
      console.log(`Moved ${res.movedCount} skills into ~/.gemini/config/plugins/${pluginName}.`);
      break;
    }

    case 'check':
    case 'updates': {
      console.log('\nChecking for package updates against GitHub and marketplaces...');
      const updates = await updater.checkForUpdates();
      const availableUpdates = updates.filter(u => u.hasUpdate);

      if (availableUpdates.length === 0) {
        console.log('All installed packages are up to date.');
      } else {
        console.log(`${availableUpdates.length} update(s) available:\n`);
        for (const u of availableUpdates) {
          console.log(`- ${u.displayName}: ${u.currentVersion} -> ${u.latestVersion}`);
          if (u.gitUrl) console.log(`  Source: ${u.gitUrl}`);
          console.log(`  Details: ${u.reason}`);
          console.log(`  Run: claugravity update "${u.id}"\n`);
        }
      }
      break;
    }

    case 'update': {
      const targetId = args[1];
      if (targetId) {
        console.log(`\nUpdating ${targetId}...`);
        const res = await updater.updatePlugin(targetId);
        console.log(`Successfully updated to version ${res.plugin.version}`);
      } else {
        console.log('\nUpdating all outdated packages...');
        const updates = await updater.checkForUpdates();
        const available = updates.filter(u => u.hasUpdate);
        for (const u of available) {
          console.log(`Updating ${u.name}...`);
          await updater.updatePlugin(u.id);
        }
        console.log('All updates complete.');
      }
      break;
    }

    case 'convert': {
      const srcDir = args[1];
      const dstDir = args[2] || `${srcDir}-antigravity`;
      if (!srcDir) {
        console.error('Error: Specify the source plugin folder.');
        process.exit(1);
      }
      console.log(`Converting from ${srcDir} to ${dstDir}...`);
      const res = await converter.convert(srcDir, dstDir);
      console.log(`Converted successfully: ${res.name} v${res.version}`);
      break;
    }

    case 'delete-skill': {
      const targetName = args[1];
      if (!targetName) {
        console.error('Usage: claugravity delete-skill <skillName>');
        process.exit(1);
      }
      console.log(`\nDeleting skill "${targetName}"...`);
      const report = await skillChecker.checkAllSkills();
      const target = report.skills.find(s => s.name === targetName || s.displayName === targetName);
      if (!target) {
        console.error(`Skill "${targetName}" was not found.`);
        process.exit(1);
      }
      const res = await skillChecker.deleteSkillByPath(target.filePath);
      console.log(res.message);
      break;
    }

    case 'update-skill': {
      const targetName = args[1];
      if (!targetName) {
        console.error('Usage: claugravity update-skill <skillName>');
        process.exit(1);
      }
      console.log(`\nUpdating skill "${targetName}" from upstream...`);
      const res = await skillChecker.updateSkill(targetName);
      console.log(res.message);
      break;
    }

    case 'uninstall': {
      const pluginId = args[1];
      if (!pluginId) {
        console.error('Usage: claugravity uninstall <pluginIdOrName>');
        process.exit(1);
      }
      console.log(`\nUninstalling plugin "${pluginId}"...`);
      try {
        const res = await installer.uninstall(pluginId);
        console.log(res.message);
      } catch (e) {
        const res = await skillChecker.uninstallPlugin(pluginId);
        console.log(res.message);
      }
      break;
    }

    default:
      console.log(`
Claugravity - Antigravity Marketplace & Claude Bridge
-----------------------------------------------------
Commands:
  claugravity serve [port]              Start the local web UI (default: http://localhost:4321)
  claugravity list                      List installed packages
  claugravity search <term>             Search Claude marketplaces
  claugravity add-market <git-url>      Add a marketplace from GitHub and list its items
  claugravity skills-check              Check skill categories, health, and collisions
  claugravity update-skill <skill>      Update an Antigravity skill from its upstream repository
  claugravity delete-skill <skill>      Delete an Antigravity skill
  claugravity clean-duplicate <skill>   Remove duplicate copy (standalone or plugin)
  claugravity consolidate [name]        Bundle loose standalone skills into a plugin
  claugravity install <id>              Convert and install a package into Antigravity
  claugravity uninstall <id>            Uninstall and remove a package
  claugravity check                     Check for package updates
  claugravity update [id]               Update a package to the latest version
`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
