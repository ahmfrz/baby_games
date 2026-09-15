import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'r2-assets');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const mappings = [
  ['assets/shared', 'shared'],
  ['assets/games/strawberry-garden/art', 'games/strawberry-garden/art'],
  ['games/alphabet-learner/assets/manifest.json', 'games/alphabet-learner/manifest.json'],
  ['games/alphabet-learner/assets/images', 'games/alphabet-learner/images'],
  ['games/alphabet-learner/assets/sounds', 'games/alphabet-learner/sounds'],
  ['games/comic-stories/assets/manifest.json', 'games/comic-stories/manifest.json'],
  ['games/comic-stories/assets/images', 'games/comic-stories/images'],
  ['games/fruit-color/assets/manifest.json', 'games/fruit-color/manifest.json'],
  ['games/fruit-color/assets/outlines', 'games/fruit-color/outlines'],
  ['games/fruit-color/assets/regionmaps', 'games/fruit-color/regionmaps'],
  ['games/language-adventures/assets/new', 'games/language-adventures/new'],
  ['games/language-adventures/assets/scenes', 'games/language-adventures/scenes'],
  ['games/language-adventures/video', 'games/language-adventures/video'],
];

function copyEntry(srcRel, dstRel) {
  const src = path.join(root, srcRel);
  if (!fs.existsSync(src)) throw new Error(`Missing source: ${srcRel}`);
  const stat = fs.statSync(src);
  const dst = path.join(out, dstRel);
  if (stat.isDirectory()) {
    fs.cpSync(src, dst, { recursive: true, filter: (source) => !source.endsWith('.py') });
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

for (const [src, dst] of mappings) copyEntry(src, dst);

console.log(`Prepared R2 asset tree: ${path.relative(root, out)}`);
