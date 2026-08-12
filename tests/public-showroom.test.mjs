import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();

const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

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

test('loads full PLY paths only inside the scan intent flow', async () => {
  const index = await read('index.html');
  const patch = await read('showroom/source-patch.js');
  assert.match(index, /showroom\/clinical-assets\.js/);
  assert.doesNotMatch(index, /preload[^>]+scan-(upper|lower)\.ply/i);
  assert.match(patch, /chooseScanMode/);
  assert.match(patch, /fullScan\.upper/);
  assert.match(patch, /fullScan\.lower/);
});

test('keeps the packed surface loader as a catch fallback', async () => {
  const patch = await read('showroom/source-patch.js');
  assert.match(patch, /catch[\s\S]+loadPacked/);
  assert.match(patch, /scanFallback/);
});

test('restores the matched example before and after pair', async () => {
  const patch = await read('showroom/source-patch.js');
  assert.match(patch, /smileExample\.before/);
  assert.match(patch, /smileExample\.after/);
  assert.match(patch, /afterReady:\s*isExample\s*\?\s*true/);
});

test('does not generate rectangular teeth for example mode', async () => {
  const patch = await read('showroom/source-patch.js');
  assert.match(patch, /if \(s\.photoMode !== 'custom'\) return;/);
});

test('retains local upload cleanup and custom guided fallback', async () => {
  const patch = await read('showroom/source-patch.js');
  assert.match(patch, /URL\.revokeObjectURL/);
  assert.match(patch, /renderGuidedDesign/);
  assert.match(patch, /photoMode === 'custom'/);
});

test('exposes every required repository proof command', async () => {
  const pkg = JSON.parse(await read('package.json'));
  for (const name of ['typecheck', 'lint', 'test', 'test:e2e', 'build']) {
    assert.equal(typeof pkg.scripts[name], 'string', `${name} script exists`);
    assert.ok(pkg.scripts[name].length > 0, `${name} script is executable`);
  }
});

test('builds static deployment output where Vercel expects it', async () => {
  const config = JSON.parse(await read('vercel.json'));
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(config.outputDirectory, 'public');
  assert.match(pkg.scripts.build, /build-static\.mjs/);
});
