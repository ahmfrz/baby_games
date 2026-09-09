import { ToddlerCharacter } from '../engine/phaser/ToddlerCharacter.js';
import { ToddlerReward } from '../engine/phaser/ToddlerReward.js';
import { TODDLER_SOUNDS, playToddlerSound } from '../engine/phaser/ToddlerAudioEvents.js';

export function runToddlerExperienceTests() {
  const calls = [];
  const scene = {
    tweens: { add: (config) => { calls.push(config); return { stop() {} }; } },
    add: {
      text: () => ({ setOrigin() { return this; }, setDepth() { return this; }, destroy() {} }),
      circle: () => ({ setStrokeStyle() { return this; }, setDepth() { return this; }, destroy() {} }),
    },
  };
  const sprite = {
    x: 100, y: 100, scaleX: 1, scaleY: 1, angle: 0,
    setScale(x, y = x) { this.scaleX = x; this.scaleY = y; return this; },
  };

  const character = new ToddlerCharacter(scene, sprite, { baseScale: 1, bob: false });
  character.happy();
  if (character.state !== 'happy' || calls.length < 2) throw new Error('Character happy animation was not configured.');
  character.pick();
  if (character.state !== 'pick') throw new Error('Character pick state was not set.');
  character.wiggle();
  if (character.state !== 'wiggle') throw new Error('Character wiggle state was not set.');

  const audio = { playSound(type) { calls.push(type); } };
  const reward = new ToddlerReward(scene, audio);
  reward.burst(100, 100, { count: 4 });
  reward.floatText(100, 100, 'Great!');
  if (!calls.includes('reward')) throw new Error('Reward sound was not routed.');
  if (TODDLER_SOUNDS.tap !== 'click' || TODDLER_SOUNDS.blend !== 'blend') throw new Error('Toddler sound map is incomplete.');
  playToddlerSound(audio, 'success');
  if (!calls.includes('success')) throw new Error('Semantic audio event was not routed.');
  return 6;
}
