import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();

async function loadAssets() {
  const source = await readFile(path.join(root, 'showroom/clinical-assets.js'), 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox);
  return sandbox.window.AvrasyaClinicalAssets;
}

async function assertPly(relativePath, vertexCount, faceCount) {
  const filePath = path.join(root, relativePath);
  const bytes = await readFile(filePath);
  const headerEnd = bytes.indexOf(Buffer.from('end_header'));
  assert.notEqual(headerEnd, -1, `${relativePath} has a PLY header`);
  const header = bytes.subarray(0, headerEnd + 10).toString('ascii');
  assert.match(header, /^ply\r?\nformat binary_little_endian 1\.0/m);
  assert.match(header, new RegExp(`element vertex ${vertexCount}`));
  assert.match(header, new RegExp(`element face ${faceCount}`));
  assert.ok((await stat(filePath)).size > 1_000_000, `${relativePath} is not a reduced placeholder`);
}

async function assertReferenceImage(relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  const isJpeg = bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  assert.ok(isJpeg || isPng, `${relativePath} is a browser image`);
  assert.ok(bytes.length > 100_000);
}

test('chooses the full PLY pair only for capable sessions', async () => {
  const assets = await loadAssets();
  assert.equal(assets.chooseScanMode({ webgl: true, saveData: false, deviceMemory: 8, mobile: false }), 'full');
  assert.equal(assets.chooseScanMode({ webgl: true, saveData: true, deviceMemory: 8, mobile: false }), 'fallback');
  assert.equal(assets.chooseScanMode({ webgl: false, saveData: false, deviceMemory: 8, mobile: false }), 'fallback');
  assert.equal(assets.chooseScanMode({ webgl: true, saveData: false, deviceMemory: 2, mobile: true }), 'fallback');
});

test('ships the supplied binary PLY and matched smile images', async () => {
  await assertPly('assets/digital-clinic/scan-upper.ply', 351290, 697206);
  await assertPly('assets/digital-clinic/scan-lower.ply', 122815, 241225);
  await assertReferenceImage('assets/digital-clinic/example-before.jpg');
  await assertReferenceImage('assets/digital-clinic/example-after.jpg');
});
