import { TRACE_STEPS, COLORS, LittleScribblesGame } from '../games/little-scribbles/LittleScribblesGame.js';

const expected = [
  'standing-line', 'sleeping-line', 'slanting-line-right', 'slanting-line-left',
  'zigzag', 'curve', 'circle', 'square', 'rectangle', 'triangle', 'oval',
  'pentagon', 'hexagon', 'star'
];

const ids = TRACE_STEPS.map((step) => step.id);
if (JSON.stringify(ids) !== JSON.stringify(expected)) throw new Error('Shape progression is incorrect.');
if (COLORS.length !== 7 || !COLORS.every((entry) => /^#[0-9A-F]{6}$/i.test(entry.value))) throw new Error('Color palette contract is incorrect.');
if (LittleScribblesGame.metadata.id !== 'little-scribbles') throw new Error('Little Scribbles metadata is incorrect.');
if (LittleScribblesGame.metadata.name !== '✏️ Little Scribbles') throw new Error('Little Scribbles name is incorrect.');

console.log('Little Scribbles tests passed: 4 checks.');
