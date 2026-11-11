'use strict';
const fs = require('fs');
const path = require('path');
function readText(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function setLine(text, key, value, separator = ':') {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp('^' + escaped + '\\s*' + separator + '[^\\r\\n]*', 'm');
  const line = key + separator + value;
  return pattern.test(text) ? text.replace(pattern, () => line) : text + (text && !text.endsWith('\n') ? '\n' : '') + line + '\n';
}
function writeText(file, text) { fs.mkdirSync(path.dirname(file), { recursive: true }); if (readText(file) !== text) { const temporary = file + '.launcher.tmp'; fs.writeFileSync(temporary, text, 'utf8'); fs.renameSync(temporary, file); } }
function arrayOption(text, key) { try { const value = JSON.parse(text.match(new RegExp('^' + key + ':([^\\r\\n]*)', 'm'))?.[1] || '[]'); return Array.isArray(value) ? value.filter(item => typeof item === 'string') : []; } catch { return []; } }
function applyPackConfiguration(gameDirectory, state, settings) {
  const available = new Set(state.folders.resourcepacks);
  const first = settings.packDefaultsRevision !== state.defaultsRevision;
  const optionsFile = path.join(gameDirectory, 'options.txt');
  let options = readText(optionsFile);
  let packs = arrayOption(options, 'resourcePacks').filter(item => !item.startsWith('file/') || available.has(item.slice(5)));
  if (first) for (const name of state.defaults.resourcePacks || []) if (available.has(name) && !packs.includes('file/' + name)) packs.push('file/' + name);
  options = setLine(options, 'resourcePacks', JSON.stringify(packs));
  options = setLine(options, 'incompatibleResourcePacks', JSON.stringify(arrayOption(options, 'incompatibleResourcePacks').filter(item => !item.startsWith('file/') || available.has(item.slice(5)))));
  writeText(optionsFile, options);
  const oculusFile = path.join(gameDirectory, 'config', 'oculus.properties');
  let oculus = readText(oculusFile);
  const selected = oculus.match(/^shaderPack=([^\r\n]*)/m)?.[1] || '';
  const requested = state.defaults.shaderPack;
  if (first && state.folders.shaderpacks.includes(requested)) {
    oculus = setLine(oculus, 'shaderPack', requested, '=');
    oculus = setLine(oculus, 'enableShaders', String(state.defaults.enableShaders !== false), '=');
  } else if (selected && !state.folders.shaderpacks.includes(selected)) {
    oculus = setLine(oculus, 'shaderPack', '', '=');
    oculus = setLine(oculus, 'enableShaders', 'false', '=');
  }
  writeText(oculusFile, oculus);
  return { ...settings, packDefaultsRevision: state.defaultsRevision };
}
function repairDisplay(gameDirectory, workArea, settings) {
  const size = { width: Math.max(320, Math.min(1280, Math.floor((Number(workArea?.width) || 1920) - 80))), height: Math.max(240, Math.min(720, Math.floor((Number(workArea?.height) || 1080) - 100))) };
  if (settings.displayRepairVersion !== 12) {
    const optionsFile = path.join(gameDirectory, 'options.txt');
    let options = readText(optionsFile);
    for (const [key, value] of Object.entries({ fullscreen: 'false', fullscreenResolution: '', overrideWidth: '0', overrideHeight: '0' })) options = setLine(options, key, value);
    writeText(optionsFile, options);
    const forgeFile = path.join(gameDirectory, 'config', 'fml.toml');
    let forge = readText(forgeFile);
    for (const [key, value] of Object.entries({ earlyWindowMaximized: 'false', earlyWindowWidth: size.width, earlyWindowHeight: size.height })) {
      const pattern = new RegExp('^' + key + '\\s*=[^\\r\\n]*', 'm');
      const line = key + ' = ' + value;
      forge = pattern.test(forge) ? forge.replace(pattern, () => line) : forge + (forge && !forge.endsWith('\n') ? '\n' : '') + line + '\n';
    }
    writeText(forgeFile, forge);
    return { settings: { ...settings, displayRepairVersion: 12 }, size };
  }
  return { settings, size };
}
module.exports = { applyPackConfiguration, repairDisplay, setLine };
