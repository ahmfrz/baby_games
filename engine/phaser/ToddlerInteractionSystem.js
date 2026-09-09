import * as Phaser from 'phaser';
import { vibrate } from '../../services/FeedbackService.js';

/** Phaser interaction primitives designed for imprecise toddler touch. */
export class ToddlerInteractionSystem {
  constructor(scene, { hitPadding = 28 } = {}) { this.scene = scene; this.hitPadding = hitPadding; this.disposers = []; }

  makeTapTarget(gameObject, handler, { padding = this.hitPadding, once = false } = {}) {
    gameObject.setInteractive({ useHandCursor: true });
    if (padding) gameObject.input?.hitArea?.setTo?.(-padding, -padding, (gameObject.width || 80) + padding * 2, (gameObject.height || 80) + padding * 2);
    const wrapped = (pointer, localX, localY, event) => {
      event?.stopPropagation?.();
      handler(pointer, localX, localY);
      vibrate(10);
      if (once) gameObject.disableInteractive();
    };
    gameObject.on('pointerdown', wrapped);
    this.disposers.push(() => gameObject.off('pointerdown', wrapped));
    return gameObject;
  }

  makeDragTarget(source, target, onDrop, { threshold = 90 } = {}) {
    source.setInteractive({ draggable: true, useHandCursor: true });
    const start = { x: source.x, y: source.y };
    const move = (pointer, dragX, dragY) => { source.x = dragX; source.y = dragY; };
    const end = () => {
      const distance = Phaser.Math.Distance.Between(source.x, source.y, target.x, target.y);
      if (distance <= threshold) onDrop(source, target);
      else this.scene.tweens.add({ targets: source, x: start.x, y: start.y, duration: 240, ease: 'Back.easeOut' });
    };
    source.on('drag', move); source.on('dragend', end);
    this.disposers.push(() => { source.off('drag', move); source.off('dragend', end); });
    return source;
  }

  clear() { this.disposers.splice(0).forEach((dispose) => dispose()); }
}
