import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { PluginConverter } from '../src/core/converter.js';
import { Registry } from '../src/core/registry.js';
import { Installer } from '../src/core/installer.js';

test('PluginConverter converts Claude plugin structure to Antigravity format', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-claude-plugin-'));
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-antigravity-plugin-'));

  try {
    fs.mkdirSync(path.join(tempDir, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.claude-plugin', 'plugin.json'), JSON.stringify({
      name: 'sample-claude-tool',
      version: '2.4.0',
      description: 'A test Claude plugin with skills, rules, and commands',
      keywords: ['testing', 'antigravity']
    }));

    fs.writeFileSync(path.join(tempDir, 'CLAUDE.md'), '# Project Guidelines\nAlways write tests.');

    fs.mkdirSync(path.join(tempDir, 'commands'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'commands', 'quick-fix.md'), '# Quick Fix\nRuns quick fix.');

    fs.mkdirSync(path.join(tempDir, 'skills', 'code-review'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'skills', 'code-review', 'SKILL.md'), '---\nname: code-review\ndescription: Reviews code\n---\nReview instructions.');

    fs.writeFileSync(path.join(tempDir, '.claude-plugin', 'mcp.json'), JSON.stringify({
      mcpServers: {
        'test-mcp': {
          command: 'node',
          args: ['${CLAUDE_PLUGIN_ROOT}/scripts/server.js']
        }
      }
    }));

    const converter = new PluginConverter();
    const result = await converter.convert(tempDir, targetDir);

    assert.strictEqual(result.name, 'sample-claude-tool');
    assert.strictEqual(result.version, '2.4.0');
    assert.ok(fs.existsSync(path.join(targetDir, 'plugin.json')));

    assert.ok(fs.existsSync(path.join(targetDir, 'rules', 'AGENTS.md')));
    const ruleContent = fs.readFileSync(path.join(targetDir, 'rules', 'AGENTS.md'), 'utf8');
    assert.ok(ruleContent.includes('Always write tests'));

    assert.ok(fs.existsSync(path.join(targetDir, 'skills', 'quick-fix', 'SKILL.md')));
    const quickFixSkill = fs.readFileSync(path.join(targetDir, 'skills', 'quick-fix', 'SKILL.md'), 'utf8');
    assert.ok(quickFixSkill.includes('name: quick-fix'));

    assert.ok(fs.existsSync(path.join(targetDir, 'skills', 'code-review', 'SKILL.md')));

    assert.ok(fs.existsSync(path.join(targetDir, 'mcp_config.json')));
    const mcpConfig = JSON.parse(fs.readFileSync(path.join(targetDir, 'mcp_config.json'), 'utf8'));
    assert.ok(mcpConfig.mcpServers['test-mcp']);
    assert.strictEqual(mcpConfig.mcpServers['test-mcp'].env.CLAUDE_PLUGIN_ROOT, targetDir);
    assert.strictEqual(mcpConfig.mcpServers['test-mcp'].args[0], `${targetDir}/scripts/server.js`);

  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
});

test('Registry records and retrieves installed plugins', () => {
  const tempManifest = path.join(os.tmpdir(), `test-registry-${Date.now()}.json`);
  try {
    const registry = new Registry(tempManifest);
    assert.strictEqual(registry.getAll().length, 0);

    registry.register({
      id: 'test-plugin@market',
      name: 'test-plugin',
      version: '1.0.0',
      installPath: '/tmp/test'
    });

    const items = registry.getAll();
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].id, 'test-plugin@market');

    const single = registry.get('test-plugin@market');
    assert.strictEqual(single.version, '1.0.0');

    registry.unregister('test-plugin@market');
    assert.strictEqual(registry.getAll().length, 0);
  } finally {
    if (fs.existsSync(tempManifest)) fs.rmSync(tempManifest, { force: true });
  }
});
