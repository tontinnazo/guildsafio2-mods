'use strict';
const { createModUpdater, validateManifest } = require('./mod-updater');
const folders = ['mods', 'resourcepacks', 'shaderpacks'];
function validateIndex(index, repository) {
  if (index.schemaVersion !== 2 || typeof index.revision !== 'string' || !index.folders || !index.defaults || typeof index.defaultsRevision !== 'string') throw new Error('La lista del paquete en GitHub no es válida.');
  for (const folder of folders) {
    if (!Array.isArray(index.folders[folder])) throw new Error('Falta una carpeta del paquete: ' + folder);
    if (index.folders[folder].some(file => file.localBase || file.blobSha1)) throw new Error('El paquete debe contener solamente descargas verificadas de GitHub.');
    validateManifest({ schemaVersion: 1, version: index.revision, allowEmpty: true, files: index.folders[folder] }, repository, folder === 'mods' ? 'jar' : 'zip');
  }
  return index;
}
function createRemotePackUpdater({ instancePath, repository, fetchImpl = globalThis.fetch }) {
  let pending; let current;
  const updaters = folders.map(folderName => createModUpdater({ instancePath, repository, folderName, exact: true, concurrency: 4, fetchImpl: (url, options) => url.endsWith('/mods-manifest.json') ? Promise.resolve(new Response(JSON.stringify({ schemaVersion: 1, version: current.revision, allowEmpty: true, files: current.folders[folderName] }))) : fetchImpl(url, options) }));
  async function sync(progress) {
    progress({ percent: 0, message: 'Comprobando el paquete de GitHub…' });
    const response = await fetchImpl(`https://raw.githubusercontent.com/${repository}/main/pack-manifest.json?t=${Date.now()}`, { signal: AbortSignal.timeout(30000), cache: 'no-store' });
    if (!response.ok || !response.body) throw new Error('No se pudo comprobar el paquete de GitHub. HTTP ' + response.status);
    const chunks = []; let length = 0;
    for await (const chunk of response.body) { length += chunk.length; if (length > 2 * 1024 ** 2) throw new Error('Lista de descargas demasiado grande.'); chunks.push(Buffer.from(chunk)); }
    current = validateIndex(JSON.parse(Buffer.concat(chunks).toString('utf8')), repository);
    for (let index = 0; index < updaters.length; index++) await updaters[index].sync(state => progress({ percent: Math.round((index * 100 + state.percent) / 3), message: `${folders[index]}: ${state.message}` }));
    progress({ percent: 100, message: 'Mods, texturas y shaders actualizados' });
    return { defaults: current.defaults, defaultsRevision: current.defaultsRevision, folders: Object.fromEntries(folders.map(folder => [folder, current.folders[folder].map(file => file.name)])) };
  }
  return { sync(progress = () => {}) { if (!pending) pending = sync(progress).finally(() => { pending = null; }); return pending; } };
}
module.exports = { createRemotePackUpdater, validateIndex };
