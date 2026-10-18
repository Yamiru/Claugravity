import path from 'node:path';
import os from 'node:os';

const homeDir = os.homedir();

export const CONFIG = {
  geminiConfigDir: path.join(homeDir, '.gemini', 'config'),
  antigravityPluginsDir: path.join(homeDir, '.gemini', 'config', 'plugins'),
  antigravitySkillsDir: path.join(homeDir, '.gemini', 'config', 'skills'),
  antigravityInstalledManifest: path.join(homeDir, '.gemini', 'config', 'antigravity_marketplace_installed.json'),
  antigravityConfigFile: path.join(homeDir, '.gemini', 'config', 'config.json'),
  customMarketplacesDir: path.join(homeDir, '.gemini', 'config', 'marketplaces'),
  customMarketplacesManifest: path.join(homeDir, '.gemini', 'config', 'custom_marketplaces.json'),
  claudePluginsDir: path.join(homeDir, '.claude', 'plugins'),
  claudeMarketplacesDir: path.join(homeDir, '.claude', 'plugins', 'marketplaces'),
  claudeKnownMarketplaces: path.join(homeDir, '.claude', 'plugins', 'known_marketplaces.json'),
  claudeInstalledPlugins: path.join(homeDir, '.claude', 'plugins', 'installed_plugins.json'),
  claudePluginsCache: path.join(homeDir, '.claude', 'plugins', 'cache'),
  serverPort: 4321
};
