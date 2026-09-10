import fs from 'fs';
import path from 'path';
const root = process.cwd();
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const exists = p => fs.existsSync(path.join(root,p));
const checks = [
 ['star background asset exists', exists('assets/shared/art/backgrounds/star-sky.svg')],
 ['fruit background asset exists', exists('assets/shared/art/backgrounds/fruit-garden.svg')],
 ['shape background asset exists', exists('assets/shared/art/backgrounds/shape-meadow.svg')],
 ['nest background asset exists', exists('assets/shared/art/backgrounds/nest-garden.svg')],
 ['simple game CSS uses scene backgrounds', read('styles/simple-games.css').includes('star-sky.svg') && read('styles/simple-games.css').includes('fruit-garden.svg') && read('styles/simple-games.css').includes('shape-meadow.svg') && read('styles/simple-games.css').includes('nest-garden.svg')],
 ['ambient scene sparkle layer exists', read('styles/simple-games.css').includes('.scene-sparkles')],
 ['reward star burst exists', read('styles/simple-games.css').includes('@keyframes rewardStars')],
 ['reduced motion remains supported', read('styles/simple-games.css').includes('prefers-reduced-motion')],
 ['star game mounts sparkles', read('games/star-collector/StarCollectorGame.js').includes('scene-sparkles')],
 ['fruit game mounts sparkles', read('games/fruit-slice/FruitSliceGame.js').includes('scene-sparkles')],
 ['nest game mounts sparkles', read('games/pinch-pop/PinchPopGame.js').includes('scene-sparkles')],
];
let failed=0; for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`); if(!ok) failed++;} if(failed) process.exit(1); console.log(`Phase 5D polish checks: ${checks.length-failed}/${checks.length}`);
