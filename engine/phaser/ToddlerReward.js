/** Shared reward presentation: burst, ring, floating stars and optional audio. */
export class ToddlerReward {
  constructor(scene, audioManager = null) {
    this.scene = scene;
    this.audio = audioManager;
  }

  burst(x, y, { count = 18, sound = 'reward', radius = 90 } = {}) {
    const points = [];
    for (let i = 0; i < count; i += 1) {
      const star = this.scene.add.text(x, y, i % 3 === 0 ? '✦' : '•', {
        fontFamily: 'Arial, sans-serif', fontSize: 14 + (i % 4) * 6,
        color: i % 2 ? '#fff6a6' : '#ffffff',
      }).setOrigin(0.5).setDepth(50);
      const angle = (Math.PI * 2 * i) / count;
      const distance = radius * (0.65 + (i % 5) * 0.09);
      this.scene.tweens.add({ targets: star, x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance,
        alpha: 0, scale: 0.2, duration: 500 + (i % 5) * 80, ease: 'Cubic.easeOut', onComplete: () => star.destroy() });
      points.push(star);
    }
    const ring = this.scene.add.circle(x, y, 18, 0xffffff, 0.02).setStrokeStyle(5, 0xffffff, 0.85).setDepth(49);
    this.scene.tweens.add({ targets: ring, scale: 4.2, alpha: 0, duration: 520, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    if (sound) this.audio?.playSound?.(sound);
    return points;
  }

  floatText(x, y, message, { emoji = '🍓', color = '#6d3f56' } = {}) {
    const label = this.scene.add.text(x, y, `${emoji}  ${message}`, {
      fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif', fontSize: 26, fontStyle: 'bold', color,
      stroke: '#ffffff', strokeThickness: 7,
    }).setOrigin(0.5).setDepth(60);
    this.scene.tweens.add({ targets: label, y: y - 72, alpha: 0, scale: 1.08, duration: 950, ease: 'Cubic.easeOut', onComplete: () => label.destroy() });
    return label;
  }
}
