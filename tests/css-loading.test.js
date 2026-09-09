import fs from 'node:fs';
import path from 'node:path';

const gameModules = [
  ['alphabet-learner', './games/alphabet-learner/AlphabetLearnerGame.js', './styles.css', './games/alphabet-learner/styles.css'],
  ['comic-stories', './games/comic-stories/ComicStoryGame.js', './styles.css', './games/comic-stories/styles.css'],
  ['fruit-color', './games/fruit-color/FruitColorGame.js', './styles.css', './games/fruit-color/styles.css'],
  ['star-collector', './games/star-collector/StarCollectorGame.js', '../../styles/simple-games.css', './styles/simple-games.css'],
  ['fruit-slice', './games/fruit-slice/FruitSliceGame.js', '../../styles/simple-games.css', './styles/simple-games.css'],
  ['shape-pop', './games/shape-pop/ShapePopGame.js', '../../styles/simple-games.css', './styles/simple-games.css'],
  ['pinch-pop', './games/pinch-pop/PinchPopGame.js', '../../styles/simple-games.css', './styles/simple-games.css'],
  ['language-adventures', './games/language-adventures/LanguageAdventureGame.js', './styles.css', './games/language-adventures/styles.css'],
  ['strawberry-garden', './games/strawberry-garden/StrawberryGardenGame.js', './styles.css', './games/strawberry-garden/styles.css'],
  ['little-scribbles', './games/little-scribbles/LittleScribblesGame.js', './styles.css', './games/little-scribbles/styles.css'],
];

export function runCssLoadingTests() {
  const root = process.cwd();
  for (const [id, modulePath, cssImport, cssPath] of gameModules) {
    const source = fs.readFileSync(path.join(root, modulePath), 'utf8');
    if (!source.includes(`import '${cssImport}'`)) {
      throw new Error(`${id}: game module does not own/import its stylesheet`);
    }
    const resolvedCss = path.join(root, cssPath);
    if (!fs.existsSync(resolvedCss)) throw new Error(`${id}: missing stylesheet ${cssPath}`);
  }

  const main = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
  if (main.includes('stylePath:') || main.includes('ensureGameStyles(')) {
    throw new Error('Launcher still tries to fetch game styles as raw relative URLs');
  }
  return gameModules.length;
}
