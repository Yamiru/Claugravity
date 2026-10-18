import test from 'node:test';
import assert from 'node:assert';

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

test('Version parsing correctly identifies beta and stable stages', () => {
  const v01 = parseVersion('0.1');
  assert.strictEqual(v01.stage, 'beta');
  assert.strictEqual(v01.major, 0);
  assert.strictEqual(v01.minor, 1);

  const v09 = parseVersion('v0.9.0');
  assert.strictEqual(v09.stage, 'beta');
  assert.strictEqual(v09.major, 0);
  assert.strictEqual(v09.minor, 9);

  const v10 = parseVersion('1.0');
  assert.strictEqual(v10.stage, 'stable');
  assert.strictEqual(v10.major, 1);

  const v24 = parseVersion('v2.4.1');
  assert.strictEqual(v24.stage, 'stable');
  assert.strictEqual(v24.major, 2);
  assert.strictEqual(v24.minor, 4);
});

test('Version comparison only alerts when latest version is strictly newer', () => {
  assert.strictEqual(isNewer('0.1', '0.1'), false);
  assert.strictEqual(isNewer('v0.1', '0.1'), false);
  assert.strictEqual(isNewer('1.0.0', '1.0.0'), false);

  assert.strictEqual(isNewer('0.1', '0.2'), false);
  assert.strictEqual(isNewer('0.9', '1.0'), false);

  assert.strictEqual(isNewer('0.2', '0.1'), true);
  assert.strictEqual(isNewer('1.0', '0.9'), true);
  assert.strictEqual(isNewer('1.1.0', '1.0.9'), true);
});
