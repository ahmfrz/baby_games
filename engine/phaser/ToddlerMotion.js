/** Reusable high-polish motion primitives for preschool characters and props. */
export const ToddlerMotion = {
  idle(scene, target, { distance = 6, duration = 900, scale = 1 } = {}) {
    scene.tweens.add({
      targets: target,
      y: target.y - distance,
      scaleX: scale * 1.015,
      scaleY: scale * 0.985,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  },
  breathe(scene, target, { scale = target.scaleX } = {}) {
    scene.tweens.add({
      targets: target,
      scaleX: scale * 1.025,
      scaleY: scale * 0.985,
      duration: 1050,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  },
  wiggle(scene, target, { angle = 8, repeat = 3, duration = 85, onComplete } = {}) {
    return scene.tweens.add({
      targets: target,
      angle: { from: -angle, to: angle },
      duration,
      yoyo: true,
      repeat,
      ease: 'Sine.easeInOut',
      onComplete
    });
  },
  squash(scene, target, { amount = 1.12, duration = 110, onComplete } = {}) {
    const sx = target.scaleX;
    const sy = target.scaleY;
    return scene.tweens.add({
      targets: target,
      scaleX: sx * amount,
      scaleY: sy / amount,
      duration,
      yoyo: true,
      ease: 'Back.easeOut',
      onComplete
    });
  },
  jump(scene, target, { height = 34, duration = 230, onComplete } = {}) {
    const y = target.y;
    return scene.tweens.add({
      targets: target,
      y: y - height,
      duration,
      yoyo: true,
      ease: 'Back.easeOut',
      onComplete
    });
  },
  pulse(scene, target, { scale = 1.08, duration = 650 } = {}) {
    const base = target.scaleX;
    scene.tweens.add({
      targets: target,
      scaleX: base * scale,
      scaleY: base * scale,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  },
  sparkle(scene, x, y, { count = 8, radius = 36, duration = 550 } = {}) {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const star = scene.add.star?.(x, y, 5, 3, 9, 0xfff6a6, 0.95);
      const particle = star || scene.add.circle(x, y, 3, 0xfff6a6, 0.95);
      particle.setDepth(70);
      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        alpha: 0,
        scale: 0.2,
        duration,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }
};
