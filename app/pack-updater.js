'use strict';
const { createModUpdater, validateManifest } = require('./mod-updater');
const directories = ['mods', 'resourcepacks', 'shaderpacks'];
function buildCatalog(release, repository) {
  if (!release || release.draft || release.prerelease || !Array.isArray(release.assets)) throw new Error('La publicación del paquete no está disponible.');
  const catalog = Object.fromEntries(directories.map(name => [name, { schemaVersion: 1, version: release.tag_name, allowEmpty: true, files: [] }]));
  for (const asset of release.assets) {
    if (!/\.(jar|zip)$/i.test(asset.name)) continue;
    if (asset.state !== 'uploaded') throw new Error('Hay archivos que todavía se están subiendo.');
    let relative;
    if (typeof asset.label === 'string' && /^(mods|resourcepacks|shaderpacks)\//.test(asset.label)) relative = asset.label;
    else if (asset.name.startsWith('shader__')) relative = 'shaderpacks/' + asset.name.slice(8);
    else if (asset.name.startsWith('texture__')) relative = 'resourcepacks/' + asset.name.slice(9);
    else relative = (/\.jar$/i.test(asset.name) ? 'mods/' : 'resourcepacks/') + asset.name;
    const parts = relative.split('/');
    if (parts.length !== 2 || !directories.includes(parts[0])) throw new Error('Ruta de paquete inválida.');
    if (!/^sha256:[a-f0-9]{64}$/.test(asset.digest || '')) throw new Error('GitHub no ha terminado de verificar: ' + asset.name);
    catalog[parts[0]].files.push({ name: parts[1], size: asset.size, sha256: asset.digest.slice(7), url: asset.browser_download_url });
  }
  if (!catalog.mods.files.length) throw new Error('La publicación no contiene mods. Se conserva la instalación actual.');
  for (const directory of directories) validateManifest(catalog[directory], repository, directory === 'mods' ? 'jar' : 'zip');
  return catalog;
}
function mergeRepositoryFiles(catalog, tree, repository) {
  if (!tree || tree.truncated || !Array.isArray(tree.tree)) throw new Error('No se pudo leer la lista completa de archivos del repositorio.');
  for (const entry of tree.tree) {
    const parts = entry.path.split('/');
    if (parts.length !== 2 || !directories.includes(parts[0])) continue;
    const [directory, name] = parts;
    if (!(directory === 'mods' ? /\.jar$/i : /\.zip$/i).test(name)) continue;
    if (entry.type !== 'blob' || !['100644', '100755'].includes(entry.mode) || !/^[a-f0-9]{40}$/.test(entry.sha)) throw new Error('Archivo del repositorio no válido: ' + entry.path);
    const file = { name, size: entry.size, blobSha1: entry.sha, url: `https://raw.githubusercontent.com/${repository}/main/${directory}/${encodeURIComponent(name)}?v=${entry.sha}` };
    const existing = catalog[directory].files.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
    if (existing === -1) catalog[directory].files.push(file); else catalog[directory].files[existing] = file;
  }
  for (const directory of directories) validateManifest(catalog[directory], repository, directory === 'mods' ? 'jar' : 'zip');
  return catalog;
}
function createPackUpdater({ instancePath, repository, fetchImpl = globalThis.fetch }) {
  let pending;
  let catalog;
  // The existing verified downloader handles each managed directory, including rollback.
  const updaters = directories.map(folderName => createModUpdater({ instancePath, repository, folderName, fetchImpl: (url, options) => url.endsWith('/mods-manifest.json') ? Promise.resolve(new Response(JSON.stringify(catalog[folderName]))) : fetchImpl(url, options) }));
  async function sync(progress) {
    progress({ percent: 0, message: 'Comprobando mods, texturas y shaders en GitHub…' });
    const response = await fetchImpl(`https://api.github.com/repos/${repository}/releases?per_page=100`, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(30000), cache: 'no-store' });
    if (!response.ok) throw new Error(response.status === 403 || response.status === 429 ? 'GitHub ha limitado temporalmente las consultas. Espera unos minutos e intenta de nuevo.' : 'No se pudo consultar el paquete en GitHub. HTTP ' + response.status);
    const releases = await response.json();
    if (!Array.isArray(releases)) throw new Error('Respuesta de GitHub inválida.');
    const release = releases.filter(item => !item.draft && !item.prerelease && (item.tag_name === 'mods-v11' || item.tag_name.startsWith('pack-') || item.tag_name.startsWith('mods-'))).sort((a,b) => Date.parse(b.published_at) - Date.parse(a.published_at))[0];
    catalog = buildCatalog(release, repository);
    const treeResponse = await fetchImpl(`https://api.github.com/repos/${repository}/git/trees/main?recursive=1`, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(30000), cache: 'no-store' });
    if (!treeResponse.ok) throw new Error('No se pudieron comprobar las carpetas del repositorio. HTTP ' + treeResponse.status);
    catalog = mergeRepositoryFiles(catalog, await treeResponse.json(), repository);
    for (let index = 0; index < updaters.length; index++) await updaters[index].sync(state => progress({ percent: Math.round((index * 100 + state.percent) / updaters.length), message: `${directories[index]}: ${state.message}` }));
    progress({ percent: 100, message: 'Mods, texturas y shaders verificados · ' + release.tag_name });
  }
  return { sync(progress = () => {}) { if (!pending) pending = sync(progress).finally(() => { pending = null; }); return pending; } };
}
module.exports = { createPackUpdater, buildCatalog, mergeRepositoryFiles };
