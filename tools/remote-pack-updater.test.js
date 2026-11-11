'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { createRemotePackUpdater } = require('../app/remote-pack-updater');
const repository = 'tontinnazo/guildsafio2-mods';
function file(name, content) { return { name, size: Buffer.byteLength(content), sha256: crypto.createHash('sha256').update(content).digest('hex'), url: `https://github.com/${repository}/releases/download/mods-v11/${encodeURIComponent(name)}` }; }
function index(files) { return { schemaVersion: 2, revision: 'test', defaultsRevision: 'defaults1', defaults: { resourcePacks: ['§cTexturas.zip'], shaderPack: 'shader.zip' }, folders: { mods: [file('a.jar', files['a.jar'])], resourcepacks: [file('§cTexturas.zip', files['§cTexturas.zip'])], shaderpacks: [file('shader.zip', files['shader.zip'])] } }; }
test('remote-only package installs from empty folders and removes every unexpected client file with backups', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'guildsafio-remote-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'mods', 'extra-directory'), { recursive: true });
  await fs.writeFile(path.join(root, 'mods', 'extra.jar'), 'extra');
  await fs.writeFile(path.join(root, 'mods', 'notes.txt'), 'extra');
  let contents = { 'a.jar': 'mod', '§cTexturas.zip': 'pack', 'shader.zip': 'shader' };
  let manifest = index(contents); let downloads = 0;
  const updater = createRemotePackUpdater({ instancePath: root, repository, fetchImpl: async url => {
    if (url.includes('/pack-manifest.json?')) return new Response(JSON.stringify(manifest));
    downloads++; return new Response(contents[decodeURIComponent(url.split('/').pop())]);
  } });
  const result = await updater.sync();
  assert.equal(downloads, 3);
  assert.deepEqual(await fs.readdir(path.join(root, 'mods')), ['a.jar']);
  assert.deepEqual(result.folders.resourcepacks, ['§cTexturas.zip']);
  const [backup] = await fs.readdir(path.join(root, 'mod-backups'));
  assert.equal(await fs.readFile(path.join(root, 'mod-backups', backup, 'notes.txt'), 'utf8'), 'extra');
  await updater.sync(); assert.equal(downloads, 3);
  contents['a.jar'] = 'MOD'; manifest = index(contents);
  await updater.sync(); assert.equal(downloads, 4);
  assert.equal(await fs.readFile(path.join(root, 'mods/a.jar'), 'utf8'), 'MOD');
  manifest.folders.resourcepacks = []; manifest.folders.shaderpacks = [];
  await updater.sync();
  assert.deepEqual(await fs.readdir(path.join(root, 'resourcepacks')), []);
  assert.deepEqual(await fs.readdir(path.join(root, 'shaderpacks')), []);
});
test('corrupt remote files and unavailable index leave the installed package intact', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'guildsafio-remote-fail-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'mods')); await fs.writeFile(path.join(root, 'mods/a.jar'), 'old');
  const contents = { 'a.jar': 'new', '§cTexturas.zip': 'pack', 'shader.zip': 'shader' };
  const manifest = index(contents); let offline = true;
  const updater = createRemotePackUpdater({ instancePath: root, repository, fetchImpl: async url => url.includes('/pack-manifest.json?') ? offline ? new Response('', { status: 503 }) : new Response(JSON.stringify(manifest)) : new Response('BAD') });
  await assert.rejects(updater.sync(), /503/);
  offline = false;
  await assert.rejects(updater.sync(), /dañada/);
  assert.equal(await fs.readFile(path.join(root, 'mods/a.jar'), 'utf8'), 'old');
});
test('downloads in parallel with a maximum of four requests per managed folder', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'guildsafio-remote-parallel-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const manifest = { schemaVersion: 2, revision: 'test', defaultsRevision: '1', defaults: {}, folders: { mods: Array.from({length: 9}, (_,i) => file(i + '.jar', 'mod')), resourcepacks: [], shaderpacks: [] } };
  let active = 0; let maximum = 0;
  await createRemotePackUpdater({ instancePath: root, repository, fetchImpl: async url => {
    if (url.includes('/pack-manifest.json?')) return new Response(JSON.stringify(manifest));
    active++; maximum = Math.max(maximum, active);
    await new Promise(resolve => setTimeout(resolve, 15));
    active--; return new Response('mod');
  } }).sync();
  assert.equal(maximum, 4);
});
