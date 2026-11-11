'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Readable } = require('stream');
function buildBaseCatalog(manifest) {
  const catalog = Object.fromEntries(['mods','resourcepacks','shaderpacks'].map(name => [name, { schemaVersion: 1, version: 'Base incluida + carpetas GitHub', allowEmpty: true, files: [] }]));
  for (const file of manifest.files) {
    const match = /^Forge 1\.20\.1\/(mods|resourcepacks|shaderpacks)\/([^/]+)$/.exec(file.path);
    if (!match || !(match[1] === 'mods' ? /\.jar$/i : /\.zip$/i).test(match[2])) continue;
    catalog[match[1]].files.push({ name: match[2], size: file.size, sha256: file.sha256, localBase: true, url: 'guildsafio-local://base/' + encodeURIComponent(file.path) });
  }
  if (!catalog.mods.files.length) throw new Error('Falta la lista de mods originales incluidos.');
  return catalog;
}
function createLocalBaseFetch({ manifest, resourcesPath, cachePath }) {
  const allowed = new Map(manifest.files.filter(file => /^Forge 1\.20\.1\/(mods|resourcepacks|shaderpacks)\/[^/]+$/.test(file.path)).map(file => [file.path, file]));
  return async function localFetch(url) {
    const relative = decodeURIComponent(new URL(url).pathname.slice(1));
    if (!allowed.has(relative)) throw new Error('Archivo base no autorizado.');
    const target = path.join(cachePath, relative);
    if (!fs.existsSync(target)) {
      await fs.promises.mkdir(cachePath, { recursive: true });
      await new Promise((resolve, reject) => {
        const process = spawn(path.join(resourcesPath, '7za.exe'), ['x', path.join(resourcesPath, 'game-resources.7z'), '-o' + cachePath, '-y', relative], { windowsHide: true, stdio: 'ignore' });
        process.once('error', reject);
        process.once('exit', code => code === 0 ? resolve() : reject(new Error('No se pudo restaurar un archivo original incluido.')));
      });
    }
    return new Response(Readable.toWeb(fs.createReadStream(target)));
  };
}
module.exports = { buildBaseCatalog, createLocalBaseFetch };
