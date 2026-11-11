'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { applyPackConfiguration, repairDisplay } = require('../app/pack-configuration');
function fixture(t) { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'guildsafio-options-')); t.after(() => fs.rmSync(root, { recursive: true, force: true })); fs.mkdirSync(path.join(root, 'config')); return root; }
test('starts with texture packs and shader selected, preserves other settings and subsequent player choices', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'options.txt'), 'resourcePacks:[]\nrenderDistance:12\n');
  fs.writeFileSync(path.join(root, 'config/oculus.properties'), 'maxShadowRenderDistance=32\n');
  const state = { defaultsRevision: '1', defaults: { resourcePacks: ['Texturas.zip'], shaderPack: 'Shader.zip', enableShaders: true }, folders: { resourcepacks: ['Texturas.zip'], shaderpacks: ['Shader.zip'] } };
  const settings = applyPackConfiguration(root, state, {});
  assert.match(fs.readFileSync(path.join(root, 'options.txt'), 'utf8'), /resourcePacks:\["file\/Texturas.zip"\]/);
  assert.match(fs.readFileSync(path.join(root, 'options.txt'), 'utf8'), /renderDistance:12/);
  assert.match(fs.readFileSync(path.join(root, 'config/oculus.properties'), 'utf8'), /shaderPack=Shader.zip/);
  assert.match(fs.readFileSync(path.join(root, 'config/oculus.properties'), 'utf8'), /enableShaders=true/);
  fs.writeFileSync(path.join(root, 'options.txt'), 'resourcePacks:[]\nrenderDistance:8\n');
  applyPackConfiguration(root, state, settings);
  assert.match(fs.readFileSync(path.join(root, 'options.txt'), 'utf8'), /resourcePacks:\[\]/);
  assert.match(fs.readFileSync(path.join(root, 'options.txt'), 'utf8'), /renderDistance:8/);
});
test('removing a remote pack also cleans its active selection', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'options.txt'), 'resourcePacks:["vanilla","file/Old.zip"]\n');
  fs.writeFileSync(path.join(root, 'config/oculus.properties'), 'shaderPack=Old.zip\nenableShaders=true\n');
  applyPackConfiguration(root, { defaultsRevision: '1', defaults: {}, folders: { resourcepacks: [], shaderpacks: [] } }, { packDefaultsRevision: '1' });
  assert.match(fs.readFileSync(path.join(root, 'options.txt'), 'utf8'), /resourcePacks:\["vanilla"\]/);
  assert.match(fs.readFileSync(path.join(root, 'config/oculus.properties'), 'utf8'), /enableShaders=false/);
});
test('repairs forced fullscreen and oversized Forge loading window once and respects later fullscreen choices', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'options.txt'), 'fullscreen:true\noverrideWidth:3840\noverrideHeight:2160\nfullscreenResolution:3840x2160@60:24\n');
  fs.writeFileSync(path.join(root, 'config/fml.toml'), 'earlyWindowControl = true\nearlyWindowMaximized = true\nearlyWindowWidth = 3840\nearlyWindowHeight = 2160\n');
  const repair = repairDisplay(root, { width: 1366, height: 728 }, {});
  assert.deepEqual(repair.size, { width: 1280, height: 628 });
  assert.match(fs.readFileSync(path.join(root, 'options.txt'), 'utf8'), /fullscreen:false/);
  assert.match(fs.readFileSync(path.join(root, 'options.txt'), 'utf8'), /overrideWidth:0/);
  assert.match(fs.readFileSync(path.join(root, 'config/fml.toml'), 'utf8'), /earlyWindowMaximized = false/);
  assert.match(fs.readFileSync(path.join(root, 'config/fml.toml'), 'utf8'), /earlyWindowControl = true/);
  fs.writeFileSync(path.join(root, 'options.txt'), 'fullscreen:true\n');
  repairDisplay(root, {width: 1920, height: 1080}, repair.settings);
  assert.equal(fs.readFileSync(path.join(root, 'options.txt'), 'utf8'), 'fullscreen:true\n');
});
