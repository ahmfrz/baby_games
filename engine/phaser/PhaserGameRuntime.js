/**
 * Lightweight Phaser runtime boundary for Baby Games.
 *
 * Phaser is intentionally loaded only for games that opt into the engine so
 * the existing games can continue to lazy-load independently during the
 * migration.
 */
export class PhaserGameRuntime {
  constructor({ parent, width = 960, height = 600, scene, background = '#f7fbff' } = {}) {
    this.parent = parent;
    this.width = width;
    this.height = height;
    this.sceneFactory = scene;
    this.background = background;
    this.game = null;
    this.Phaser = null;
  }

  async start() {
    if (!this.parent) throw new Error('Phaser runtime requires a parent element.');
    const module = await import('phaser');
    this.Phaser = module.default || module.Phaser || module;

    this.game = new this.Phaser.Game({
      type: this.Phaser.AUTO,
      parent: this.parent,
      width: this.width,
      height: this.height,
      backgroundColor: this.background,
      scale: {
        mode: this.Phaser.Scale.FIT,
        autoCenter: this.Phaser.Scale.CENTER_BOTH,
        width: this.width,
        height: this.height,
      },
      render: {
        antialias: true,
        roundPixels: false,
        pixelArt: false,
      },
      input: {
        activePointers: 3,
      },
      scene: [this.sceneFactory(this.Phaser)],
    });

    return this.game;
  }

  stop() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}
