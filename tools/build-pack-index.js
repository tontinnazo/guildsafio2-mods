'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { validateManifest } = require('../app/mod-updater');
function buildIndex(root, revision, repository, removeShadowedReferences = false) {
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('Commit inválido.');
  const folders = {};
  for (const folder of ['mods', 'resourcepacks', 'shaderpacks']) {
    const directory = path.join(root, folder); const entries = fs.existsSync(directory) ? fs.readdirSync(directory, { withFileTypes: true }) : [];
    const files = new Map(); const referencePaths = new Map();
    for (const entry of entries.filter(entry => entry.name.endsWith('.download.json'))) {
      if (!entry.isFile() || entry.isSymbolicLink()) throw new Error('Referencia inválida: ' + entry.name);
      const file = JSON.parse(fs.readFileSync(path.join(directory, entry.name), 'utf8'));
      if (file.name !== entry.name.slice(0, -14)) throw new Error('El nombre de la referencia no coincide: ' + entry.name);
      if (file.localBase || file.blobSha1) throw new Error('La referencia debe apuntar a una descarga remota verificada.');
      files.set(file.name.toLowerCase(), file);
      referencePaths.set(file.name.toLowerCase(), path.join(directory, entry.name));
    }
    for (const entry of entries.filter(entry => (folder === 'mods' ? /\.jar$/i : /\.zip$/i).test(entry.name))) {
      if (!entry.isFile() || entry.isSymbolicLink()) throw new Error('Archivo inválido: ' + entry.name);
      const bytes = fs.readFileSync(path.join(directory, entry.name));
      files.set(entry.name.toLowerCase(), { name: entry.name, size: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), url: `https://raw.githubusercontent.com/${repository}/${revision}/${folder}/${encodeURIComponent(entry.name)}` });
      const shadowed = referencePaths.get(entry.name.toLowerCase());
      if (removeShadowedReferences && shadowed && fs.existsSync(shadowed)) fs.unlinkSync(shadowed);
    }
    folders[folder] = [...files.values()].sort((a,b) => a.name.localeCompare(b.name));
    validateManifest({ schemaVersion: 1, version: revision, allowEmpty: true, files: folders[folder] }, repository, folder === 'mods' ? 'jar' : 'zip');
  }
  const defaults = JSON.parse(fs.readFileSync(path.join(root, 'pack-defaults.json'), 'utf8'));
  return { schemaVersion: 2, revision, defaults, defaultsRevision: crypto.createHash('sha256').update(JSON.stringify(defaults)).digest('hex'), folders };
}
if (require.main === module) {
  const root = process.cwd();
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const index = buildIndex(root, revision, 'tontinnazo/guildsafio2-mods', true);
  fs.writeFileSync(path.join(root, 'pack-manifest.json'), JSON.stringify(index, null, 2) + '\n');
  console.log(Object.fromEntries(Object.entries(index.folders).map(([folder, files]) => [folder, files.length])));
}
module.exports = { buildIndex };
