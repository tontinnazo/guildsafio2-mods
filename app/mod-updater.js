'use strict';
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

function validateManifest(manifest, repository, extension = 'jar') {
  if (manifest.schemaVersion !== 1 || typeof manifest.version !== 'string' || !Array.isArray(manifest.files) || manifest.files.length > 2000) throw new Error('Lista de mods inválida.');
  if (!manifest.files.length && manifest.allowEmpty !== true) throw new Error('Lista vacía: publicación rechazada para proteger los mods.');
  const names = new Set();
  for (const file of manifest.files) {
    if (typeof file.name !== 'string' || !file.name || /[<>:"/\\|?*\x00-\x1f]/.test(file.name) || /[. ]$/.test(file.name) || !file.name.toLowerCase().endsWith('.' + extension) || file.name.length > 180 || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])\./i.test(file.name)) throw new Error('Nombre de archivo inválido.');
    const key = file.name.toLowerCase();
    if (names.has(key)) throw new Error('Hay mods duplicados en la publicación.');
    names.add(key);
    const sha256 = /^[a-f0-9]{64}$/.test(file.sha256 || '');
    const blobSha1 = /^[a-f0-9]{40}$/.test(file.blobSha1 || '');
    if (sha256 === blobSha1 || !Number.isSafeInteger(file.size) || file.size < 1 || file.size > 2 * 1024 ** 3) throw new Error('Tamaño o firma de mod inválidos.');
    const url = new URL(file.url);
    const releaseURL = sha256 && url.origin === 'https://github.com' && url.pathname.startsWith(`/${repository}/releases/download/`) && !url.search;
    const repositoryURL = blobSha1 && url.origin === 'https://raw.githubusercontent.com' && url.pathname.startsWith(`/${repository}/main/`) && url.search === '?v=' + file.blobSha1;
    const localURL = sha256 && file.localBase === true && url.protocol === 'guildsafio-local:' && url.hostname === 'base' && !url.search;
    if ((!releaseURL && !repositoryURL && !localURL) || url.username || url.password || url.hash) throw new Error('El archivo no pertenece al repositorio configurado.');
  }
  return manifest;
}

async function digest(filename, expected) {
  const hash = crypto.createHash(expected.blobSha1 ? 'sha1' : 'sha256');
  if (expected.blobSha1) hash.update('blob ' + expected.size + '\0');
  const handle = await fs.open(filename, 'r');
  try { for await (const chunk of handle.createReadStream()) hash.update(chunk); }
  finally { await handle.close(); }
  return hash.digest('hex');
}

async function exists(filename) { try { await fs.lstat(filename); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; } }

function createModUpdater({ instancePath, repository, fetchImpl = globalThis.fetch, folderName = 'mods' }) {
  if (!['mods', 'resourcepacks', 'shaderpacks'].includes(folderName)) throw new Error('Carpeta no administrada.');
  const extension = folderName === 'mods' ? 'jar' : 'zip';
  const managedFile = name => name.toLowerCase().endsWith('.' + extension);
  const backupFolder = folderName === 'mods' ? 'mod-backups' : folderName + '-backups';
  let pending;
  const mods = path.join(instancePath, folderName);
  const previous = path.join(instancePath, '.' + folderName + '-previous');
  const stage = path.join(instancePath, '.' + folderName + '-download');
  async function assertDirectory(folder) {
    if (!await exists(folder)) return;
    const stat = await fs.lstat(folder);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('La carpeta de mods no puede ser un enlace.');
  }
  async function download(url, file, expected) {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(10 * 60 * 1000) });
    if (!response.ok || !response.body) throw new Error(`Descarga fallida (HTTP ${response.status}).`);
    const handle = await fs.open(file, 'wx');
    let size = 0;
    const hash = crypto.createHash(expected.blobSha1 ? 'sha1' : 'sha256');
    if (expected.blobSha1) hash.update('blob ' + expected.size + '\0');
    try {
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > expected.size) throw new Error('El mod supera el tamaño publicado.');
        hash.update(chunk);
        await handle.writeFile(chunk);
      }
    } finally { await handle.close(); }
    if (size !== expected.size || hash.digest('hex') !== (expected.blobSha1 || expected.sha256)) throw new Error('La descarga está incompleta o dañada: ' + expected.name);
  }
  async function sync(progress) {
    if (!/^[a-zA-Z0-9-]+\/[a-zA-Z0-9_.-]+$/.test(repository || '')) throw new Error('Falta configurar el repositorio público de GitHub.');
    await fs.mkdir(instancePath, { recursive: true });
    await assertDirectory(mods); await assertDirectory(previous); await assertDirectory(stage);
    // Recover an interrupted directory switch before making network requests.
    if (await exists(previous)) {
      if (!await exists(mods)) await fs.rename(previous, mods);
      else {
        await fs.mkdir(path.join(instancePath, backupFolder), { recursive: true });
        await fs.rename(previous, path.join(instancePath, backupFolder, crypto.randomUUID()));
      }
    }
    progress({ percent: 0, message: 'Buscando actualizaciones de mods en GitHub…' });
    const response = await fetchImpl(`https://github.com/${repository}/releases/latest/download/mods-manifest.json`, { signal: AbortSignal.timeout(30000), cache: 'no-store' });
    if (!response.ok || !response.body) throw new Error(`No se pudo consultar la actualización (HTTP ${response.status}). Revisa tu conexión.`);
    const chunks = []; let length = 0;
    for await (const chunk of response.body) { length += chunk.length; if (length > 2 * 1024 ** 2) throw new Error('Lista de mods demasiado grande.'); chunks.push(Buffer.from(chunk)); }
    const manifest = validateManifest(JSON.parse(Buffer.concat(chunks).toString('utf8')), repository, extension);
    const current = await exists(mods) ? await fs.readdir(mods, { withFileTypes: true }) : [];
    if (current.some(entry => entry.isSymbolicLink())) throw new Error('Hay enlaces dentro de la carpeta de mods.');
    const changed = [];
    for (const file of manifest.files) {
      const filename = path.join(mods, file.name);
      const stat = await exists(filename) ? await fs.lstat(filename) : null;
      if (!stat || !stat.isFile() || stat.size !== file.size || await digest(filename, file) !== (file.blobSha1 || file.sha256)) changed.push(file.name);
    }
    const wanted = new Set(manifest.files.map(file => file.name));
    const removed = current.filter(entry => managedFile(entry.name) && !wanted.has(entry.name));
    if (!changed.length && !removed.length) { progress({ percent: 100, message: 'Mods actualizados · ' + manifest.version }); return; }
    await fs.rm(stage, { recursive: true, force: true });
    await fs.mkdir(stage);
    // Preserve non-JAR content. The previous full directory is retained as backup.
    for (const entry of current.filter(entry => !managedFile(entry.name))) await fs.cp(path.join(mods, entry.name), path.join(stage, entry.name), { recursive: true, dereference: false });
    for (let index = 0; index < manifest.files.length; index++) {
      const file = manifest.files[index];
      progress({ percent: Math.round(index / Math.max(1, manifest.files.length) * 95), message: `Preparando mods (${index + 1}/${manifest.files.length}): ${file.name}` });
      if (changed.includes(file.name)) await download(file.url, path.join(stage, file.name), file);
      else await fs.copyFile(path.join(mods, file.name), path.join(stage, file.name));
    }
    await fs.mkdir(path.join(instancePath, backupFolder), { recursive: true });
    if (await exists(mods)) await fs.rename(mods, previous);
    try { await fs.rename(stage, mods); }
    catch (e) { if (await exists(previous)) await fs.rename(previous, mods); throw e; }
    if (await exists(previous)) await fs.rename(previous, path.join(instancePath, backupFolder, crypto.randomUUID()));
    progress({ percent: 100, message: 'Mods actualizados · ' + manifest.version });
  }
  return { sync(progress = () => {}) { if (!pending) pending = sync(progress).finally(() => { pending = null; }); return pending; } };
}
module.exports = { createModUpdater, validateManifest };
