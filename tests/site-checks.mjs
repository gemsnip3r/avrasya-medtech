import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const [html, assets, patch] = await Promise.all([
  read('index.html'),
  read('showroom/clinical-assets.js'),
  read('showroom/source-patch.js'),
]);

const checks = [
  ['declares Turkish and a mobile viewport', () => {
    assert.match(html, /<html lang="tr">/);
    assert.match(html, /width=device-width,initial-scale=1,viewport-fit=cover/);
  }],
  ['loads clinical assets before repair patches', () => {
    const manifest = html.indexOf('/showroom/clinical-assets.js');
    const sourcePatch = html.indexOf('/showroom/source-patch.js');
    assert.ok(manifest > -1 && manifest < sourcePatch);
  }],
  ['does not preload multi-megabyte scan files', () => {
    assert.doesNotMatch(html, /preload[^>]+\.ply/i);
  }],
  ['keeps scan selection capability-aware', () => {
    assert.match(assets, /saveData/);
    assert.match(assets, /deviceMemory/);
    assert.match(patch, /chooseScanMode/);
    assert.match(patch, /catch[\s\S]+loadPacked/);
  }],
  ['uses the matched smile references', () => {
    assert.match(patch, /smileExample\.before/);
    assert.match(patch, /smileExample\.after/);
    assert.match(patch, /photoMode !== 'custom'/);
  }],
  ['releases local upload object URLs', () => assert.match(patch, /URL\.revokeObjectURL/)],
];

for (const [name, check] of checks) {
  check();
  console.log(`PASS ${name}`);
}
