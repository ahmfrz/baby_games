import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const manifest = JSON.parse(read('public/manifest.webmanifest'));
const index = read('index.html');
const serviceWorker = read('service-worker.js');

assert.equal(manifest.start_url, '/');
assert.equal(manifest.scope, '/');
assert.equal(manifest.id, '/');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.icons.length, 4);

for (const icon of manifest.icons) {
  assert.match(icon.src, /^\/icons\//, `PWA icon must use an absolute root URL: ${icon.src}`);
  assert.ok(fs.existsSync(path.join(root, 'public', icon.src.slice(1))), `Missing PWA icon: ${icon.src}`);
  assert.equal(icon.type, 'image/png');
}

assert.match(index, /<link rel="manifest" href="\/manifest\.webmanifest">/);
assert.match(index, /href="\/icons\/icon-192\.png"/);
assert.match(index, /serviceWorker\.register\('\/service-worker\.js',\s*\{\s*scope:\s*'\/'\s*\}\)/s);
assert.match(serviceWorker, /baby-games-cache-v13/);

console.log('PWA installability configuration checks passed.');
