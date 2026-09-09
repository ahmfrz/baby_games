import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const art = path.join(root, 'assets/games/strawberry-garden/art');

export function runVisualAssetSystemTests() {
  const required = ['strawberry.svg', 'butterfly.svg', 'basket.svg', 'sink.svg', 'blender.svg', 'cake.svg', 'garden-bg.svg'];
  for (const file of required) {
    assert.ok(fs.existsSync(path.join(art, file)), `Missing visual asset: ${file}`);
    const svg = fs.readFileSync(path.join(art, file), 'utf8');
    assert.ok(svg.startsWith('<svg'), `${file} is not SVG`);
  }
  return 3 + required.length;
}
