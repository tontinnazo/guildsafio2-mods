'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
async function getBaseArchive(parent, resourcesPath, progress) {
  const config = JSON.parse(await fs.promises.readFile(path.join(resourcesPath, 'base-config.json'), 'utf8'));
  if (!/^https:\/\/github\.com\/tontinnazo\/guildsafio2-mods\/releases\/download\//.test(config.url) || !/^[a-f0-9]{64}$/.test(config.sha256) || !Number.isSafeInteger(config.size) || config.size < 1) throw new Error('Configuración de recursos inválida.');
  const archive = path.join(parent, 'base-' + config.sha256 + '.7z');
  if (fs.existsSync(archive)) {
    const hash = crypto.createHash('sha256');
    let size = 0;
    for await (const chunk of fs.createReadStream(archive)) { size += chunk.length; hash.update(chunk); }
    if (size === config.size && hash.digest('hex') === config.sha256) return archive;
    await fs.promises.unlink(archive);
  }
  const temporary = archive + '.part';
  const response = await fetch(config.url, { signal: AbortSignal.timeout(60 * 60 * 1000) });
  if (!response.ok || !response.body) throw new Error('No se pudieron descargar los recursos iniciales. HTTP ' + response.status);
  const handle = await fs.promises.open(temporary, 'w');
  const hash = crypto.createHash('sha256');
  let downloaded = 0;
  try {
    for await (const chunk of response.body) {
      downloaded += chunk.length;
      if (downloaded > config.size) throw new Error('El archivo de recursos supera el tamaño esperado.');
      hash.update(chunk);
      await handle.writeFile(chunk);
      progress({ percent: Math.round(downloaded / config.size * 100), message: `Descargando recursos iniciales: ${Math.round(downloaded / 1048576)} / ${Math.round(config.size / 1048576)} MB` });
    }
  } finally { await handle.close(); }
  if (downloaded !== config.size || hash.digest('hex') !== config.sha256) throw new Error('Los recursos se descargaron incompletos o dañados. Intenta de nuevo.');
  await fs.promises.rename(temporary, archive);
  return archive;
}
module.exports = { getBaseArchive };
