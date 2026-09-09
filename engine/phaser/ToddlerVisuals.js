/** Shared visual language for toddler games: soft cards, reward bursts and gentle motion. */
export function addSoftShadow(scene, x, y, width, height, alpha = 0.14) {
  return scene.add.ellipse(x, y, width, height, 0x5a3546, alpha);
}

export function pulseHint(scene, target, scale = 1.08) {
  const base = target.scaleX;
  return scene.tweens.add({ targets: target, scaleX: base * scale, scaleY: base * scale, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

export function rewardRing(scene, x, y) {
  const ring = scene.add.circle(x, y, 18, 0xffffff, 0);
  ring.setStrokeStyle(5, 0xffd76b, 0.9);
  scene.tweens.add({ targets: ring, radius: 70, alpha: 0, duration: 600, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
  return ring;
}
