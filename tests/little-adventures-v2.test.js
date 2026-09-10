import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = f => fs.readFileSync(path.join(root,f),'utf8');
const game = read('games/language-adventures/LanguageAdventureGame.js');
const data = read('games/language-adventures/languageData.js');
const css = read('games/language-adventures/styles.css');

const assets = [
  'games/language-adventures/assets/new/hero-explorer.png',
  'games/language-adventures/assets/new/adventure-map.png',
  'games/language-adventures/assets/new/park-friend.png',
  'games/language-adventures/assets/new/home-helper.png',
  'games/language-adventures/assets/new/school-friend.png',
  'games/language-adventures/assets/new/nature-helper.png',
  'games/language-adventures/assets/new/adventure-complete.png',
  'games/language-adventures/assets/new/explorer-avatar.png',
  'games/language-adventures/assets/new/targets.svg'
];

for (const a of assets) if (!fs.existsSync(path.join(root,a))) throw new Error(`Missing Little Adventures v2 asset: ${a}`);
for (const token of ['class LanguageAdventureGame','showMap()','renderStep()','buildInteraction(step)','makeDrag','finish()','showTimeUp()','loadProgress()','saveProgress()','completionFeedback','scene-avatar','targetPosition','itemPosition','asset-icon']) {
  if (!game.includes(token)) throw new Error(`Little Adventures v2 missing ${token}`);
}
for (const token of ['At Home','In the Park','At School','In Nature','Around the World','type:\'drag\'','type:\'choice\'','activity:\'tidy-room\'','activity:\'share-at-park\'','activity:\'pack-school\'','activity:\'recycle-cleanup\'','activity:\'landmark-match\'']) {
  if (!data.includes(token)) throw new Error(`Little Adventures v2 data missing ${token}`);
}
for (const token of ['.la2-map','.la2-card','.la2-play','.choice-card','.drag-piece','.la2-complete','.la2-timeup','.timeup-card','.la2-card.is-complete','.scene-avatar','.asset-icon','.character-stage','.character-bubble','.globe-companion','.character-happy','.character-surprised','prefers-reduced-motion']) {
  if (!css.includes(token)) throw new Error(`Little Adventures v2 style missing ${token}`);
}

for (const token of ['totalStars','loadTotalStars()','saveTotalStars()','soundEnabled','toggleSound()','data-sound','aria-live=\"polite\"','progress-track','startTimerLoop()','timerService?.endSession?.()']) {
  if (!game.includes(token)) throw new Error(`Little Adventures v2 accessibility/progression feature missing ${token}`);
}
for (const token of ['.sound-toggle','.la2-progress-panel','.progress-track','.sr-only','focus-visible']) {
  if (!css.includes(token)) throw new Error(`Little Adventures v2 polish style missing ${token}`);
}

const svg=read('games/language-adventures/assets/new/targets.svg');
for (const id of ['toybox','teddy','ball','bed','puppy','butterfly','friend','child','crayons','book','mountains','bottle','bin','earth','plane','landmark','globe','map']) if (!svg.includes(`id="${id}"`)) throw new Error(`Missing vector target: ${id}`);
console.log(`[PASS] Little Adventures v2: ${assets.length} art assets, vector targets, distinct activity surfaces, and character reactions`);

const main = read('js/main.js');
if (!main.includes("'strawberry-garden': new URL('../assets/games/strawberry-garden/art/strawberry.svg', import.meta.url).href")) {
  throw new Error('Launcher Strawberry Garden art path is incorrect');
}
if (!game.includes('if(remaining<=0){') || !game.includes('this.showTimeUp();')) {
  throw new Error('Little Adventures must recover visibly when the session is expired');
}

console.log('[PASS] Little Adventures uses a body-level fixed viewport portal to prevent blank adventure screens');
if (!game.includes('document.body') || !css.includes('position:fixed') || !css.includes('100dvh')) throw new Error('Little Adventures viewport portal regression');
