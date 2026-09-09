import { TRACE_STEPS, COLORS, LittleScribblesGame } from '../games/little-scribbles/LittleScribblesGame.js';

describe('LittleScribblesGame', () => {
  it('progresses from simple strokes to complex shapes', () => {
    const ids = TRACE_STEPS.map((step) => step.id);
    const expected = [
      'standing-line', 'sleeping-line', 'slanting-line-right', 'slanting-line-left',
      'zigzag', 'curve', 'circle', 'square', 'rectangle', 'triangle', 'oval',
      'pentagon', 'hexagon', 'star'
    ];
    expect(ids).toEqual(expected);
  });

  it('provides the requested bright palette', () => {
    expect(COLORS.length).toBe(7);
    expect(COLORS.every((entry) => /^#[0-9A-F]{6}$/i.test(entry.value))).toBe(true);
  });

  it('exposes the expected game identity', () => {
    expect(LittleScribblesGame.metadata.id).toBe('little-scribbles');
    expect(LittleScribblesGame.metadata.name).toBe('✏️ Little Scribbles');
  });
});
