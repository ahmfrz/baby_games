import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

export function runPhase5ECelebrationTests() {
  const checks = [];
  const assert = (condition, message) => checks.push({ pass: Boolean(condition), message });

  const celebration = read('engine/core/ToddlerCelebration.js');
  const feedback = read('services/FeedbackService.js');
  const main = read('js/main.js');
  const css = read('styles/main.css');

  assert(celebration.includes('export class ToddlerCelebration'), 'Shared ToddlerCelebration service exists');
  assert(celebration.includes('showCard') && celebration.includes('confetti'), 'Celebration service has card and confetti presentation');
  assert(celebration.includes('ripple(x, y)'), 'Celebration service provides touch ripples');
  assert(celebration.includes('prefers-reduced-motion') || css.includes('prefers-reduced-motion'), 'Reduced-motion path exists');
  assert(feedback.includes('export function completionFeedback'), 'Semantic completion feedback exists');
  assert(feedback.includes("babyGameComplete"), 'Completion event is emitted');
  assert(main.includes("babyGameComplete") && main.includes('showCompletion'), 'Platform listens for completion events');
  assert(main.includes('this.celebration.resetStreak()'), 'Reward streak resets between games');
  assert(css.includes('.toddler-celebration') && css.includes('.touch-ripple'), 'Phase 5E styles are present');

  const games = [
    ['games/alphabet-learner/AlphabetLearnerGame.js', 'completionFeedback'],
    ['games/comic-stories/ComicStoryGame.js', 'completionFeedback'],
    ['games/fruit-color/FruitColorGame.js', 'completionFeedback'],
    ['games/fruit-slice/FruitSliceGame.js', 'completionFeedback'],
    ['games/shape-pop/ShapePopGame.js', 'completionFeedback'],
    ['games/pinch-pop/PinchPopGame.js', 'completionFeedback'],
    ['games/language-adventures/LanguageAdventureGame.js', 'completionFeedback'],
    ['games/strawberry-garden/StrawberryGardenGame.js', 'completionFeedback'],
    ['games/little-scribbles/LittleScribblesGame.js', 'completionFeedback'],
    ['games/star-collector/StarCollectorGame.js', 'completionFeedback'],
  ];
  games.forEach(([file, token]) => assert(read(file).includes(token), `${path.basename(file)} is wired to completion feedback`));

  return checks;
}
