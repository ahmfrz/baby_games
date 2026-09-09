/** Semantic audio events keep game code independent of sound implementation. */
export const TODDLER_SOUNDS = Object.freeze({
  tap: 'click',
  success: 'success',
  reward: 'reward',
  pop: 'pop',
  star: 'star',
  wash: 'wash',
  blend: 'blend',
});

export function playToddlerSound(audioManager, event) {
  if (!audioManager?.playSound) return;
  const sound = TODDLER_SOUNDS[event] || event;
  audioManager.playSound(sound);
}
