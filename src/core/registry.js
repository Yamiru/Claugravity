import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from '../config.js';

export class Registry {
  constructor(manifestPath = CONFIG.antigravityInstalledManifest) {
    this.manifestPath = manifestPath;
  }

  ensureDir() {
    const dir = path.dirname(this.manifestPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  read() {
    try {
      if (fs.existsSync(this.manifestPath)) {
        const raw = fs.readFileSync(this.manifestPath, 'utf8');
        const data = JSON.parse(raw);
        if (data && data.installed) {
          const deduplicated = {};
          for (const item of Object.values(data.installed)) {
            const key = item.id || `${item.name}@custom`;
            let duplicateFound = false;
            for (const [existingKey, existingVal] of Object.entries(deduplicated)) {
              if (existingVal.name === item.name || existingVal.installPath === item.installPath) {
                if (new Date(item.lastUpdated || item.installedAt) >= new Date(existingVal.lastUpdated || existingVal.installedAt)) {
                  delete deduplicated[existingKey];
                  deduplicated[key] = item;
                }
                duplicateFound = true;
                break;
              }
            }
            if (!duplicateFound) {
              deduplicated[key] = item;
            }
          }
          data.installed = deduplicated;
        }
        return data;
      }
    } catch (err) {
      console.error('Error reading installed manifest:', err.message);
    }
    return { version: 1, installed: {} };
  }

  write(data) {
    this.ensureDir();
    fs.writeFileSync(this.manifestPath, JSON.stringify(data, null, 2), 'utf8');
  }

  getAll() {
    const data = this.read();
    return Object.values(data.installed || {});
  }

  get(id) {
    const data = this.read();
    if (data.installed?.[id]) return data.installed[id];
    for (const item of Object.values(data.installed || {})) {
      if (item.name === id) return item;
    }
    return null;
  }

  register(item) {
    const data = this.read();
    if (!data.installed) data.installed = {};

    for (const [key, val] of Object.entries(data.installed)) {
      if ((val.name === item.name || val.installPath === item.installPath) && key !== item.id) {
        delete data.installed[key];
      }
    }

    const existing = data.installed[item.id] || {};
    data.installed[item.id] = {
      ...existing,
      ...item,
      lastUpdated: new Date().toISOString()
    };
    this.write(data);
    return data.installed[item.id];
  }

  unregister(id) {
    const data = this.read();
    if (data.installed && data.installed[id]) {
      const removed = data.installed[id];
      delete data.installed[id];
      this.write(data);
      return removed;
    }
    for (const [key, val] of Object.entries(data.installed || {})) {
      if (val.name === id) {
        delete data.installed[key];
        this.write(data);
        return val;
      }
    }
    return null;
  }
}
