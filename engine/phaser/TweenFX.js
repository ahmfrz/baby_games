/** Small library of readable, toddler-friendly motion patterns. */
export const TweenFX = {
  pop(scene, target, scale = 1.12) {
    scene.tweens.add({ targets: target, scaleX: scale, scaleY: 0.92, duration: 110, yoyo: true, ease: 'Back.easeOut' });
  },
  bounceIn(scene, target) {
    target.setScale(0.7).setAlpha(0);
    scene.tweens.add({ targets: target, alpha: 1, scale: 1, duration: 420, ease: 'Back.easeOut' });
  },
  float(scene, target, distance = 8, duration = 900) {
    scene.tweens.add({ targets: target, y: target.y - distance, duration, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  },
  celebrate(scene, target) {
    scene.tweens.add({ targets: target, angle: { from: -5, to: 5 }, duration: 90, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
  }
};
