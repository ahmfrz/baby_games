/** Reusable toddler-friendly character animation controller. */
export class ToddlerCharacter {
  constructor(scene, sprite, { baseScale = sprite.scaleX, bob = true } = {}) {
    this.scene = scene;
    this.sprite = sprite;
    this.baseScale = baseScale;
    this.state = 'idle';
    this.bob = bob;
    this.tweens = [];
    if (bob) this.idle();
  }

  stopTweens() {
    this.tweens.forEach((t) => t?.stop?.());
    this.tweens = [];
  }

  idle() {
    this.stopTweens();
    this.state = 'idle';
    this.sprite.setScale(this.baseScale);
    this.tweens.push(this.scene.tweens.add({ targets: this.sprite, y: this.sprite.y - 7, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
    return this;
  }

  happy() {
    this.stopTweens();
    this.state = 'happy';
    this.tweens.push(this.scene.tweens.add({ targets: this.sprite, scaleX: this.baseScale * 1.12, scaleY: this.baseScale * 0.92, duration: 110, yoyo: true, repeat: 1, ease: 'Back.easeOut' }));
    this.tweens.push(this.scene.tweens.add({ targets: this.sprite, angle: -7, duration: 100, yoyo: true, repeat: 3, ease: 'Sine.easeInOut', onComplete: () => this.idle() }));
    return this;
  }

  pick() {
    this.stopTweens();
    this.state = 'pick';
    this.tweens.push(this.scene.tweens.add({ targets: this.sprite, scaleX: this.baseScale * 1.2, scaleY: this.baseScale * 0.82, duration: 130, yoyo: true, ease: 'Cubic.easeOut' }));
    this.tweens.push(this.scene.tweens.add({ targets: this.sprite, y: this.sprite.y - 28, duration: 220, yoyo: true, ease: 'Back.easeOut', onComplete: () => this.idle() }));
    return this;
  }

  wiggle() {
    this.stopTweens();
    this.state = 'wiggle';
    this.tweens.push(this.scene.tweens.add({ targets: this.sprite, angle: -10, duration: 75, yoyo: true, repeat: 5, ease: 'Sine.easeInOut', onComplete: () => this.idle() }));
    return this;
  }

  celebrate() {
    this.stopTweens();
    this.state = 'celebrate';
    this.tweens.push(this.scene.tweens.add({ targets: this.sprite, y: this.sprite.y - 48, scaleX: this.baseScale * 1.18, scaleY: this.baseScale * 1.18, duration: 240, ease: 'Back.easeOut' }));
    this.tweens.push(this.scene.tweens.add({ targets: this.sprite, y: this.sprite.y, scaleX: this.baseScale, scaleY: this.baseScale, duration: 300, delay: 180, ease: 'Bounce.easeOut', onComplete: () => this.idle() }));
    return this;
  }

  destroy() {
    this.stopTweens();
  }
}
