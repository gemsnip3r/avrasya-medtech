import assert from 'node:assert/strict';
import { access, cp, mkdir, readFile, readdir, rm } from 'node:fs/promises';

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

const output = new URL('public/', root);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const directory of ['assets', 'showroom', 'crm']) {
  await cp(new URL(`${directory}/`, root), new URL(`${directory}/`, output), { recursive: true });
}
const rootFiles = await readdir(root, { withFileTypes: true });
for (const entry of rootFiles) {
  if (entry.isFile() && /\.(?:html|png|jpg|ico|svg|webmanifest)$/i.test(entry.name)) {
    await cp(new URL(entry.name, root), new URL(entry.name, output));
  }
}
await Promise.all([
  access(new URL('index.html', output)),
  access(new URL('assets/digital-clinic/scan-upper.ply', output)),
  access(new URL('assets/digital-clinic/scan-lower.ply', output)),
  access(new URL('crm/index.html', output)),
]);

console.log(`PASS static showroom build (${payload.length} encoded bytes, output public/)`);
