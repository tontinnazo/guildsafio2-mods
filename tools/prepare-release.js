'use strict';
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { validateManifest } = require('../app/mod-updater');
async function main() {
  const [directory, destination, version, repository = 'tontinnazo/guildsafio2-mods'] = process.argv.slice(2);
  if (!directory || !destination || !/^[a-zA-Z0-9._-]+$/.test(version || '')) throw new Error('Uso: node tools/prepare-release.js CARPETA_MODS CARPETA_SALIDA v11 [usuario/repositorio]');
  await fs.mkdir(destination, { recursive: true });
  if ((await fs.readdir(destination)).length) throw new Error('Usa una carpeta de salida vacía.');
  const files = [];
  for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile() || !/\.jar$/i.test(entry.name)) continue;
    const source = path.join(directory, entry.name);
    const hash = crypto.createHash('sha256');
    const handle = await fs.open(source, 'r');
    try { for await (const chunk of handle.createReadStream()) hash.update(chunk); } finally { await handle.close(); }
    const sha256 = hash.digest('hex');
    const size = (await fs.stat(source)).size;
    const asset = sha256 + '.jar';
    files.push({ name: entry.name, size, sha256, url: `https://github.com/${repository}/releases/download/${version}/${asset}` });
  }
  const manifest = validateManifest({ schemaVersion: 1, version, files }, repository);
  for (const file of files) {
    const destinationFile = path.join(destination, file.sha256 + '.jar');
    await fs.copyFile(path.join(directory, file.name), destinationFile);
    const hash = crypto.createHash('sha256').update(await fs.readFile(destinationFile)).digest('hex');
    if (hash !== file.sha256) throw new Error('Un mod cambió mientras se preparaba la publicación. Ejecuta de nuevo en una carpeta vacía.');
  }
  await fs.writeFile(path.join(destination, 'mods-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Preparados ${files.length} mods. Sube TODOS los archivos de ${path.resolve(destination)} a una Release con etiqueta ${version}, marcada como Latest. No reutilices etiquetas de versiones anteriores.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
