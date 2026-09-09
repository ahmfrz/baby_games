import fs from 'node:fs';
import path from 'node:path';

const gameModules = [
  ['alphabet-learner', './games/alphabet-learner/AlphabetLearnerGame.js', './games/alphabet-learner/styles.css'],
  ['comic-stories', './games/comic-stories/ComicStoryGame.js', './games/comic-stories/styles.css'],
  ['fruit-color', './games/fruit-color/FruitColorGame.js', './games/fruit-color/styles.css'],
  ['star-collector', './games/star-collector/StarCollectorGame.js', './styles/simple-games.css'],
  ['fruit-slice', './games/fruit-slice/FruitSliceGame.js', './styles/simple-games.css'],
  ['shape-pop', './games/shape-pop/ShapePopGame.js', './styles/simple-games.css'],
  ['pinch-pop', './games/pinch-pop/PinchPopGame.js', './styles/simple-games.css'],
  ['language-adventures', './games/language-adventures/LanguageAdventureGame.js', './games/language-adventures/styles.css'],
  ['strawberry-garden', './games/strawberry-garden/StrawberryGardenGame.js', './games/strawberry-garden/styles.css'],
  ['little-scribbles', './games/little-scribbles/LittleScribblesGame.js', './games/little-scribbles/styles.css'],
];

export function runCssLoadingTests() {
  const root = process.cwd();
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  if (!index.includes('href="styles/simple-games.css"')) {
    throw new Error('Shared simple-games stylesheet is not linked from index.html');
  }

  for (const [id, modulePath, cssPath] of gameModules) {
    const source = fs.readFileSync(path.join(root, modulePath), 'utf8');
    if (/import\s+['"].*\.css['"]/.test(source)) {
      throw new Error(`${id}: game module still imports CSS as a JavaScript module; source deployment cannot load this`);
    }
    const resolvedCss = path.join(root, cssPath);
    if (!fs.existsSync(resolvedCss)) throw new Error(`${id}: missing stylesheet ${cssPath}`);
    if (!index.includes(`href="${cssPath.replace('./', '')}"`)) {
      throw new Error(`${id}: stylesheet is not linked from index.html`);
    }
  }

  const main = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
  if (main.includes('stylePath:') || main.includes('ensureGameStyles(')) {
    throw new Error('Launcher still tries to fetch game styles as raw relative URLs');
  }
  return gameModules.length;
}
