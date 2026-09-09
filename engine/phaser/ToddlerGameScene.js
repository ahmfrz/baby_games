/** Shared helpers for Phaser toddler-game scenes. */
export function roundedRect(scene, x, y, width, height, radius, fill, alpha = 1, stroke = null) {
  const g = scene.add.graphics();
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
  if (stroke) {
    g.lineStyle(stroke.width || 2, stroke.color || 0xffffff, stroke.alpha ?? 1);
    g.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius);
  }
  return g;
}

export function text(scene, value, x, y, style = {}) {
  return scene.add.text(x, y, value, {
    fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif',
    fontSize: 28,
    color: '#3d3040',
    fontStyle: 'bold',
    align: 'center',
    ...style,
  }).setOrigin(0.5);
}

export function addSparkles(scene, x, y, count = 14) {
  const group = [];
  for (let i = 0; i < count; i += 1) {
    const s = scene.add.text(x, y, i % 2 ? '✦' : '✧', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 18 + (i % 4) * 5,
      color: i % 3 === 0 ? '#fff1a8' : '#ffffff',
    }).setOrigin(0.5);
    const angle = (Math.PI * 2 * i) / count;
    const distance = 40 + (i % 5) * 15;
    scene.tweens.add({
      targets: s,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      alpha: 0,
      scale: 0.4,
      duration: 650 + (i % 4) * 90,
      ease: 'Cubic.easeOut',
      onComplete: () => s.destroy(),
    });
    group.push(s);
  }
  return group;
}
