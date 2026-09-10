import fs from 'fs';
import path from 'path';

const root = process.cwd();
const files = [
  'assets/shared/art/stars/star.svg',
  'assets/shared/art/fruits/apple.svg',
  'assets/shared/art/fruits/orange.svg',
  'assets/shared/art/fruits/watermelon.svg',
  'assets/shared/art/fruits/strawberry.svg',
  'assets/shared/art/fruits/banana.svg',
  'assets/shared/art/fruits/grapes.svg',
  'assets/shared/art/fruits/kiwi.svg',
  'assets/shared/art/fruits/pineapple.svg',
  'assets/shared/art/shapes/circle.svg',
  'assets/shared/art/shapes/square.svg',
  'assets/shared/art/shapes/triangle.svg',
  'assets/shared/art/shapes/star.svg',
  'assets/shared/art/shapes/diamond.svg',
  'assets/shared/art/nest/nest.svg',
  'assets/shared/art/nest/egg.svg',
  'assets/shared/art/nest/bird.svg'
];

for (const rel of files) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`Missing shared art: ${rel}`);
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  if (!text.includes('<svg')) throw new Error(`Invalid SVG: ${rel}`);
}

const sources = [
  'games/star-collector/StarCollectorGame.js',
  'games/fruit-slice/FruitSliceGame.js',
  'games/shape-pop/ShapePopGame.js',
  'games/pinch-pop/PinchPopGame.js'
];
for (const rel of sources) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  if (!text.includes("import.meta.url")) throw new Error(`No native asset resolution in ${rel}`);
}

console.log(`[PASS] Shared illustrated art system: ${files.length} assets + 4 games`);
