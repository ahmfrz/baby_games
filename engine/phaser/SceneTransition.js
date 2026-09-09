export class SceneTransition {
  static fade(scene, next, { color = 0xffffff, duration = 280 } = {}) {
    const overlay = scene.add.rectangle(scene.scale.width / 2, scene.scale.height / 2, scene.scale.width, scene.scale.height, color, 1).setDepth(10000);
    scene.tweens.add({ targets: overlay, alpha: 0, duration, ease: 'Sine.easeOut', onComplete: () => { overlay.destroy(); next(); } });
  }
}
