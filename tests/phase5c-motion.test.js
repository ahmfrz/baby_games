import fs from 'fs';
import path from 'path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));

const checks = [
  ['shared toddler motion utility exists', exists('engine/phaser/ToddlerMotion.js')],
  ['strawberry loads character state assets', read('games/strawberry-garden/StrawberryGardenGame.js').includes("sg-strawberry-happy") && read('games/strawberry-garden/StrawberryGardenGame.js').includes("sg-strawberry-celebrate")],
  ['strawberry uses shared motion primitives', read('games/strawberry-garden/StrawberryGardenGame.js').includes('ToddlerMotion.')],
  ['simple games have character breathing motion', read('styles/simple-games.css').includes('@keyframes characterBreathe')],
  ['simple games have tactile success motion', read('styles/simple-games.css').includes('@keyframes characterCelebrate')],
  ['reduced motion is respected', read('styles/simple-games.css').includes('prefers-reduced-motion')],
];

let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed += 1; }
if (failed) process.exit(1);
console.log(`Phase 5C motion checks: ${checks.length - failed}/${checks.length}`);
