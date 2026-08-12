import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const localSources = [...html.matchAll(/<script src="\/([^"?]+)/g)].map((match) => match[1]);

assert.deepEqual(localSources, [
  'showroom/clinical-assets.js',
  'showroom/source-patch.js',
  'showroom/module-patch.js',
]);
await Promise.all(localSources.map((source) => access(new URL(source, root))));

const partNames = ['0.txt', '1.txt', '2.txt', '3.txt', '4a.txt', '5.txt'];
const parts = await Promise.all(partNames.map((name) => readFile(new URL(`showroom/parts/${name}`, root), 'utf8')));
const payload = parts.join('').replace(/\s+/g, '');
assert.equal(payload.length, 84852);
assert.match(payload, /^[A-Za-z0-9+/=]+$/);

console.log(`PASS static showroom build (${payload.length} encoded bytes)`);
