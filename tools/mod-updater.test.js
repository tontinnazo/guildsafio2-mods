'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { createModUpdater, validateManifest } = require('../app/mod-updater');
const repository = 'tontinnazo/guildsafio2-mods';
function file(name, text) { return { name, size: Buffer.byteLength(text), sha256: crypto.createHash('sha256').update(text).digest('hex'), url: `https://github.com/${repository}/releases/download/v11/${name}` }; }
async function fixture(t) {
  const instancePath = await fs.mkdtemp(path.join(os.tmpdir(), 'guildsafio-test-'));
  t.after(() => fs.rm(instancePath, { recursive: true, force: true }));
  await fs.mkdir(path.join(instancePath, 'mods'));
  return instancePath;
}
test('adds, replaces, removes and backs up mods; unchanged mods are not downloaded', async t => {
  const instancePath = await fixture(t);
  for (const [name, text] of Object.entries({ 'old.jar': 'old', 'same.jar': 'same', 'replace.jar': 'before', 'notes.txt': 'keep' })) await fs.writeFile(path.join(instancePath, 'mods', name), text);
  const manifest = { schemaVersion: 1, version: 'v11', files: [file('same.jar', 'same'), file('replace.jar', 'after'), file('new.jar', 'new')] };
  const downloads = [];
  const fetchImpl = async url => {
    if (url.endsWith('mods-manifest.json')) return new Response(JSON.stringify(manifest));
    downloads.push(url);
    return new Response(url.endsWith('/new.jar') ? 'new' : 'after');
  };
  const updater = createModUpdater({ instancePath, repository, fetchImpl });
  await updater.sync();
  assert.equal(downloads.length, 2);
  assert.deepEqual((await fs.readdir(path.join(instancePath, 'mods'))).sort(), ['new.jar', 'notes.txt', 'replace.jar', 'same.jar']);
  assert.equal(await fs.readFile(path.join(instancePath, 'mods', 'replace.jar'), 'utf8'), 'after');
  const [backup] = await fs.readdir(path.join(instancePath, 'mod-backups'));
  assert.equal(await fs.readFile(path.join(instancePath, 'mod-backups', backup, 'old.jar'), 'utf8'), 'old');
  await updater.sync();
  assert.equal(downloads.length, 2);
});
test('corrupt downloads leave installed mods untouched and allow retry', async t => {
  const instancePath = await fixture(t);
  await fs.writeFile(path.join(instancePath, 'mods', 'a.jar'), 'old');
  const manifest = { schemaVersion: 1, version: 'v11', files: [file('a.jar', 'good')] };
  let corrupt = true;
  const updater = createModUpdater({ instancePath, repository, fetchImpl: async url => new Response(url.endsWith('.json') ? JSON.stringify(manifest) : corrupt ? 'evil' : 'good') });
  await assert.rejects(updater.sync(), /dañada/);
  assert.equal(await fs.readFile(path.join(instancePath, 'mods', 'a.jar'), 'utf8'), 'old');
  corrupt = false;
  await updater.sync();
  assert.equal(await fs.readFile(path.join(instancePath, 'mods', 'a.jar'), 'utf8'), 'good');
});
test('an interrupted switch is recovered even without internet', async t => {
  const instancePath = await fixture(t);
  await fs.writeFile(path.join(instancePath, 'mods', 'a.jar'), 'old');
  await fs.rename(path.join(instancePath, 'mods'), path.join(instancePath, '.mods-previous'));
  const updater = createModUpdater({ instancePath, repository, fetchImpl: async () => { throw new Error('offline'); } });
  await assert.rejects(updater.sync(), /offline/);
  assert.equal(await fs.readFile(path.join(instancePath, 'mods', 'a.jar'), 'utf8'), 'old');
});
test('rejects unsafe names, duplicate names, empty lists and unrelated download URLs', () => {
  const valid = file('a.jar', 'a');
  const manifest = files => ({ schemaVersion: 1, version: 'v11', files });
  for (const name of ['../a.jar', 'a/b.jar', 'a:stream.jar', 'CON.jar']) assert.throws(() => validateManifest(manifest([{ ...valid, name }]), repository));
  assert.throws(() => validateManifest(manifest([valid, { ...valid, name: 'A.jar' }]), repository));
  assert.throws(() => validateManifest(manifest([]), repository));
  assert.throws(() => validateManifest(manifest([{ ...valid, url: 'https://example.org/a.jar' }]), repository));
});
