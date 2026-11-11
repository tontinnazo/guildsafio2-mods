'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const [original, source, output] = process.argv.slice(2);
const input = fs.readFileSync(original);
const header = JSON.parse(input.subarray(16, 16 + input.readUInt32LE(12)).toString());
const start = 8 + input.readUInt32LE(4);
const contents = new Map();
function collect(node, prefix = '') {
  for (const [name, item] of Object.entries(node.files)) {
    const filename = prefix + name;
    if (item.files) collect(item, filename + '/');
    else { if (item.unpacked || item.link) throw new Error('Entrada ASAR no compatible: ' + filename); contents.set(filename, input.subarray(start + Number(item.offset), start + Number(item.offset) + item.size)); }
  }
}
collect(header);
for (const entry of fs.readdirSync(source, { withFileTypes: true })) if (entry.isFile()) contents.set(entry.name, fs.readFileSync(path.join(source, entry.name)));
const root = { files: {} }; let offset = 0;
for (const [filename, bytes] of contents) {
  const parts = filename.split('/'); const name = parts.pop(); let node = root;
  for (const part of parts) { node.files[part] ||= { files: {} }; node = node.files[part]; }
  const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
  const blocks = []; const blockSize = 4194304;
  for (let i = 0; i < bytes.length; i += blockSize) blocks.push(sha(bytes.subarray(i, i + blockSize)));
  node.files[name] = { size: bytes.length, offset: String(offset), integrity: { algorithm: 'SHA256', hash: sha(bytes), blockSize, blocks: blocks.length ? blocks : [sha(bytes)] } };
  offset += bytes.length;
}
const json = Buffer.from(JSON.stringify(root));
const headerSize = 8 + Math.ceil(json.length / 4) * 4;
const prefix = Buffer.alloc(8 + headerSize);
prefix.writeUInt32LE(4, 0); prefix.writeUInt32LE(headerSize, 4); prefix.writeUInt32LE(headerSize - 4, 8); prefix.writeUInt32LE(json.length, 12); json.copy(prefix, 16);
fs.writeFileSync(output, Buffer.concat([prefix, ...contents.values()]));
// Read every generated entry back and compare its contents before delivery.
const result = fs.readFileSync(output);
let verified = 0;
function verify(node, prefix = '') {
  for (const [name, item] of Object.entries(node.files)) {
    const filename = prefix + name;
    if (item.files) verify(item, filename + '/');
    else { const bytes = result.subarray(8 + headerSize + Number(item.offset), 8 + headerSize + Number(item.offset) + item.size); if (!bytes.equals(contents.get(filename))) throw new Error('ASAR verification failed: ' + filename); verified++; }
  }
}
verify(JSON.parse(result.subarray(16, 16 + result.readUInt32LE(12)).toString()));
console.log(`ASAR empaquetado y comprobado: ${verified} archivos, ${result.length} bytes.`);
