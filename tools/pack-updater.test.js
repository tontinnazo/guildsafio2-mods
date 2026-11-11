'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { createPackUpdater, buildCatalog } = require('../app/pack-updater');
const repository = 'tontinnazo/guildsafio2-mods';
function asset(name, text, label) { return { name, label, size: Buffer.byteLength(text), state: 'uploaded', digest: 'sha256:' + crypto.createHash('sha256').update(text).digest('hex'), browser_download_url: `https://github.com/${repository}/releases/download/pack-v12/${encodeURIComponent(name)}` }; }
test('checks real GitHub inventory and synchronizes mods, Unicode texture names and shaders', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'guildsafio-pack-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const folder of ['mods', 'resourcepacks', 'shaderpacks']) await fs.mkdir(path.join(root, folder));
  await fs.writeFile(path.join(root, 'mods/extra.jar'), 'remove');
  await fs.writeFile(path.join(root, 'resourcepacks/extra.zip'), 'remove');
  await fs.writeFile(path.join(root, 'resourcepacks/notes.txt'), 'keep');
  let release = { tag_name: 'pack-v12', published_at: '2026-11-11T12:00:00Z', assets: [asset('a.jar', 'mod'), asset('hashed.zip', 'texture', 'resourcepacks/§c Texturas.zip'), asset('shader__s.zip', 'shader')] };
  let downloads = 0;
  const payload = { 'a.jar': 'mod', 'hashed.zip': 'texture', 'shader__s.zip': 'shader' };
  const updater = createPackUpdater({ instancePath: root, repository, fetchImpl: async url => {
    if (url.startsWith('https://api.github.com/')) return new Response(JSON.stringify([release]));
    downloads++; return new Response(payload[decodeURIComponent(url.split('/').pop())]);
  } });
  await updater.sync();
  assert.equal(downloads, 3);
  assert.deepEqual((await fs.readdir(path.join(root, 'resourcepacks'))).sort(), ['notes.txt', '§c Texturas.zip']);
  assert.equal(await fs.readFile(path.join(root, 'shaderpacks/s.zip'), 'utf8'), 'shader');
  await updater.sync(); assert.equal(downloads, 3);
  // Replacing the file on the same GitHub release, without a manifest or new tag, is detected.
  release.assets[1] = asset('hashed.zip', 'modified', 'resourcepacks/§c Texturas.zip'); payload['hashed.zip'] = 'modified';
  await updater.sync(); assert.equal(downloads, 4);
  assert.equal(await fs.readFile(path.join(root, 'resourcepacks/§c Texturas.zip'), 'utf8'), 'modified');
  release.assets = [release.assets[0]];
  await updater.sync();
  assert.deepEqual(await fs.readdir(path.join(root, 'resourcepacks')), ['notes.txt']);
  assert.deepEqual(await fs.readdir(path.join(root, 'shaderpacks')), []);
});
test('validates all directories before touching the local installation', () => {
  assert.throws(() => buildCatalog({ tag_name: 'pack-v12', assets: [asset('a.jar', 'mod'), asset('b.zip', 'pack', 'resourcepacks/../b.zip')] }, repository), /Ruta/);
  assert.throws(() => buildCatalog({ tag_name: 'pack-v12', assets: [asset('a.jar', 'mod'), { ...asset('b.zip', 'pack'), digest: null }] }, repository), /verificar/);
});
