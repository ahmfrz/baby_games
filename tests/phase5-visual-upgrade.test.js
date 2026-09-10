import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const artDir = path.join(root, 'assets/games/strawberry-garden/art');
const required = [
  'strawberry.svg', 'toddler.svg', 'butterfly.svg', 'basket.svg',
  'sink.svg', 'blender.svg', 'cake.svg', 'garden-bg.svg', 'flower-cluster.svg'
];

for (const file of required) {
  const full = path.join(artDir, file);
  if (!fs.existsSync(full)) throw new Error(`Missing Phase 5 asset: ${file}`);
  const svg = fs.readFileSync(full, 'utf8');
  if (!svg.startsWith('<svg')) throw new Error(`Invalid SVG root: ${file}`);
  if (!svg.includes('viewBox')) throw new Error(`SVG needs viewBox for responsive rendering: ${file}`);
}

const manifest = fs.readFileSync(path.join(root, 'assets/games/strawberry-garden/manifest.js'), 'utf8');
for (const name of ['toddler.svg', 'flower-cluster.svg']) {
  if (!manifest.includes(name)) throw new Error(`Manifest does not expose ${name}`);
}

const game = fs.readFileSync(path.join(root, 'games/strawberry-garden/StrawberryGardenGame.js'), 'utf8');
for (const key of ['sg-toddler', 'sg-flowers', 'addSceneDecor', 'progressDots']) {
  if (!game.includes(key)) throw new Error(`Phase 5 integration missing: ${key}`);
}

console.log(`Phase 5 visual upgrade: ${required.length}/${required.length} assets and integrations present.`);

const strawberry = fs.readFileSync(path.join(artDir, 'strawberry.svg'), 'utf8');
for (const token of ['linearGradient', 'radialGradient', 'stroke=', 'ellipse cx="103"', 'ellipse cx="214"', 'path d="M124 205']) {
  if (!strawberry.includes(token)) throw new Error(`Premium strawberry artwork missing visual feature: ${token}`);
}
const garden = fs.readFileSync(path.join(artDir, 'garden-bg.svg'), 'utf8');
for (const token of ['fence', 'garden beds', 'trees', 'flowers', 'linearGradient id="sky"']) {
  if (!garden.includes(token)) throw new Error(`Garden environment missing layer: ${token}`);
}
