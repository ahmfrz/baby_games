import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredAssets = [
  'assets/shared/art/characters/toddler-mascot.svg',
  'assets/shared/art/characters/teddy-mascot.svg',
  'assets/shared/art/education/abc-blocks.svg',
  'assets/shared/art/education/story-book.svg',
  'assets/shared/art/education/crayon-pal.svg',
  'assets/shared/art/education/globe-smile.svg',
  'assets/shared/art/backgrounds/learning/abc-garden.svg',
  'assets/shared/art/backgrounds/learning/storybook-room.svg',
  'assets/shared/art/backgrounds/learning/art-studio.svg',
  'assets/shared/art/backgrounds/learning/adventure-world.svg',
  'assets/shared/art/backgrounds/learning/pencil-playground.svg'
];

const gameFiles = [
  ['games/alphabet-learner/AlphabetLearnerGame.js', 'ABC_ART', 'TODDLER_ART'],
  ['games/comic-stories/ComicStoryGame.js', 'BOOK_ART', 'TODDLER_ART'],
  ['games/fruit-color/FruitColorGame.js', 'STRAWBERRY_ART', 'CRAYON_ART'],
  ['games/language-adventures/LanguageAdventureGame.js', 'showMap()', 'buildInteraction(step)', 'finish()'],
  ['games/little-scribbles/LittleScribblesGame.js', 'CRAYON_ART']
];

for (const file of requiredAssets) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing art asset: ${file}`);
}
for (const [file, ...symbols] of gameFiles) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for (const symbol of symbols) {
    if (!text.includes(symbol)) throw new Error(`${file} does not use ${symbol}`);
  }
}
const main = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
if (!main.includes('LAUNCHER_ART') || !main.includes('game-card-art')) throw new Error('Launcher art integration missing');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!index.includes('games/pinch-pop/styles.css')) throw new Error('Pinch Pop stylesheet not linked');
console.log('[PASS] Phase 5F art upgrade: shared assets, five core games, launcher, and Pinch Pop styling');
