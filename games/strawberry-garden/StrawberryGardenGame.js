import { GameModule } from '../../core/GameModule.js';
import { rewardFeedback, tapFeedback, completionFeedback } from '../../services/FeedbackService.js';
import { PhaserGameRuntime } from '../../engine/phaser/PhaserGameRuntime.js';
import { roundedRect, text, addSparkles } from '../../engine/phaser/ToddlerGameScene.js';
import { ToddlerInteractionSystem } from '../../engine/phaser/ToddlerInteractionSystem.js';
import { TweenFX } from '../../engine/phaser/TweenFX.js';
import { GameStateStore } from '../../engine/core/GameStateStore.js';
import { strawberryAssets } from '../../assets/games/strawberry-garden/manifest.js';
import { ToddlerCharacter } from '../../engine/phaser/ToddlerCharacter.js';
import { ToddlerReward } from '../../engine/phaser/ToddlerReward.js';
import { ToddlerMotion } from '../../engine/phaser/ToddlerMotion.js';

export const STRAWBERRY_SCENES = ['find', 'pick', 'basket', 'wash', 'shake', 'decorate', 'free'];
const W = 960;
const H = 600;

function createStrawberryScene(Phaser, gamePlatform) {
  return class StrawberryScene extends Phaser.Scene {
  constructor() { super({ key: 'strawberry-garden' }); this.gamePlatform = gamePlatform; this.state = null; }

  preload() {
    this.load.svg('sg-strawberry', strawberryAssets.character);
    this.load.svg('sg-strawberry-idle', new URL('../..' + '/assets/games/strawberry-garden/art/characters/strawberry-idle.svg', import.meta.url).href);
    this.load.svg('sg-strawberry-happy', new URL('../..' + '/assets/games/strawberry-garden/art/characters/strawberry-happy.svg', import.meta.url).href);
    this.load.svg('sg-strawberry-pick', new URL('../..' + '/assets/games/strawberry-garden/art/characters/strawberry-pick.svg', import.meta.url).href);
    this.load.svg('sg-strawberry-wink', new URL('../..' + '/assets/games/strawberry-garden/art/characters/strawberry-wink.svg', import.meta.url).href);
    this.load.svg('sg-strawberry-surprised', new URL('../..' + '/assets/games/strawberry-garden/art/characters/strawberry-surprised.svg', import.meta.url).href);
    this.load.svg('sg-strawberry-jump', new URL('../..' + '/assets/games/strawberry-garden/art/characters/strawberry-jump.svg', import.meta.url).href);
    this.load.svg('sg-strawberry-celebrate', new URL('../..' + '/assets/games/strawberry-garden/art/characters/strawberry-celebrate.svg', import.meta.url).href);
    this.load.svg('sg-butterfly', strawberryAssets.butterfly);
    this.load.svg('sg-basket', strawberryAssets.basket);
    this.load.svg('sg-sink', strawberryAssets.sink);
    this.load.svg('sg-blender', strawberryAssets.blender);
    this.load.svg('sg-cake', strawberryAssets.cake);
    this.load.svg('sg-garden', strawberryAssets.garden);
    this.load.svg('sg-toddler', strawberryAssets.toddler);
    this.load.svg('sg-flowers', strawberryAssets.flowers);
  }

  create() {
    const s = this;
    s.stateStore = new GameStateStore({ kind: 'find', basket: 0, wash: 0, decor: 0, shakeReady: false, berries: [] });
    s.state = s.stateStore.get();
    s.interactions = new ToddlerInteractionSystem(s, { hitPadding: 48 });
    s.reward = new ToddlerReward(s, s.gamePlatform?.audioManager);
    s.drawBackdrop();
    s.drawTopBar();
    s.renderKind();
  }

  drawBackdrop() {
    const bg = this.add.image(W / 2, H / 2, 'sg-garden').setDisplaySize(W, H);
    bg.setDepth(-20);
    const haze = this.add.graphics().setDepth(-19);
    haze.fillStyle(0xffffff, 0.10);
    haze.fillEllipse(480, 390, 760, 230);
  }

  drawTopBar() {
    const bar = roundedRect(this, W / 2, 48, 860, 72, 30, 0xfffbf6, 0.96, { color: 0xffffff, width: 3, alpha: 0.9 });
    bar.setDepth(5);
    const badge = this.add.circle(103, 48, 27, 0xffe9ee, 1).setDepth(6);
    this.add.image(103, 48, 'sg-strawberry').setDisplaySize(32, 36).setDepth(7);
    text(this, 'STRAWBERRY', 245, 38, { fontSize: 18, color: '#a44762', fontStyle: 'bold' }).setDepth(7);
    text(this, 'GARDEN', 245, 61, { fontSize: 25, color: '#56384b', fontStyle: 'bold' }).setDepth(7);
    this.stepText = text(this, '1 / 6', 790, 48, { fontSize: 20, color: '#7b6471', fontStyle: 'bold' }).setDepth(7);
    this.progressDots = [];
    for (let i = 0; i < 6; i += 1) {
      const dot = this.add.circle(654 + i * 25, 48, 6, i === 0 ? 0xf44868 : 0xe6dbe0, 1).setDepth(7);
      this.progressDots.push(dot);
    }
    this.promptPanel = roundedRect(this, W / 2, 557, 680, 58, 24, 0xfffbf6, 0.95, { color: 0xffffff, width: 3, alpha: 0.85 });
    this.promptPanel.setDepth(8);
    this.promptText = text(this, 'Can you find the strawberry?', W / 2, 557, { fontSize: 21, color: '#654958', fontStyle: 'bold' }).setDepth(9);
  }

  updateProgress() {
    const index = STRAWBERRY_SCENES.indexOf(this.state.kind);
    this.stepText.setText(this.state.kind === 'free' ? 'FREE PLAY' : `${index + 1} / 6`);
    this.progressDots?.forEach((dot, i) => {
      const active = this.state.kind === 'free' ? i < 6 : i <= index;
      dot.setFillStyle(active ? 0xf44868 : 0xe6dbe0, 1);
      dot.setScale(active ? 1.18 : 1);
    });
  }

  renderKind() {
    this.children.list.filter(c => c.getData?.('sceneObject')).forEach(c => c.destroy());
    this.updateProgress();
    const renderers = { find: () => this.findScene(), pick: () => this.pickScene(), basket: () => this.basketScene(), wash: () => this.washScene(), shake: () => this.shakeScene(), decorate: () => this.decorateScene(), free: () => this.freeScene() };
    renderers[this.state.kind]();
  }

  mark(obj) { obj.setData('sceneObject', true); return obj; }

  addSceneDecor({ mascot = true, flowers = true } = {}) {
    if (flowers) {
      const left = this.add.image(92, 438, 'sg-flowers').setDisplaySize(185, 136).setDepth(-2);
      const right = this.add.image(865, 440, 'sg-flowers').setDisplaySize(170, 125).setFlipX(true).setDepth(-2);
      this.mark(left); this.mark(right);
      TweenFX.float(this, left, 4, 1400);
      TweenFX.float(this, right, 5, 1550);
    }
    if (mascot) {
      const mascotImage = this.add.image(845, 380, 'sg-toddler').setDisplaySize(150, 198).setDepth(4);
      mascotImage.setData('mascot', true);
      this.mark(mascotImage);
      TweenFX.float(this, mascotImage, 5, 1100);
    }
    // Small ambient motions make the world feel alive without distracting from the task.
    const fireflies = [];
    for (let i = 0; i < 7; i += 1) {
      const mote = this.add.circle(120 + i * 118, 230 + (i % 3) * 58, 3 + (i % 2), 0xfff4a8, 0.72).setDepth(-1);
      this.mark(mote); fireflies.push(mote);
      this.tweens.add({ targets: mote, x: mote.x + (i % 2 ? 22 : -18), y: mote.y - 18, alpha: 0.15, duration: 1200 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 100 });
    }
  }

  berry(x, y, scale = 1, interactive = false) {
    const berry = this.add.image(x, y, 'sg-strawberry-idle').setScale(0.46 * scale);
    berry.setAlpha(0.98);
    berry.setBlendMode('NORMAL');
    this.mark(berry);
    berry.setData('baseScale', berry.scaleX);
    berry.setData('characterTextures', { idle: 'sg-strawberry-idle', happy: 'sg-strawberry-happy', pick: 'sg-strawberry-pick', wink: 'sg-strawberry-wink', surprised: 'sg-strawberry-surprised', jump: 'sg-strawberry-jump', celebrate: 'sg-strawberry-celebrate' });
    ToddlerMotion.breathe(this, berry, { scale: berry.scaleX });
    if (interactive) this.interactions.makeTapTarget(berry, () => this.berryTapped(berry), { padding: 44 });
    return berry;
  }

  setBerryState(berry, state) {
    const key = berry?.getData?.('characterTextures')?.[state];
    if (key && berry.texture?.key !== key) berry.setTexture(key);
    return berry;
  }

  berryTapped(berry) {
    const character = berry.getData('character');
    if (this.state.kind === 'find') {
      character?.happy(); this.setBerryState(berry, 'happy'); this.tweenHappy(berry); this.advance('You found it!');
    } else if (this.state.kind === 'pick') {
      character?.pick(); this.setBerryState(berry, 'pick'); this.tweenHappy(berry); this.advance('Got it!');
    } else if (this.state.kind === 'free') {
      character?.happy(); this.setBerryState(berry, 'happy'); this.tweenHappy(berry); tapFeedback(this.gamePlatform?.audioManager, 'tap'); this.reward?.burst(berry.x, berry.y, { count: 12, sound: 'pop', radius: 62 });
    }
  }

  tweenHappy(target) {
    TweenFX.pop(this, target);
    this.reward?.burst(target.x, target.y, { count: 14, sound: 'success' });
    tapFeedback(this.gamePlatform?.audioManager, 'success');
  }

  advance(message) {
    if (this.state.advancing) return;
    this.state.advancing = true;
    rewardFeedback(this.gamePlatform, message, '🍓');
    this.reward?.floatText(W / 2, 150, message, { emoji: '🍓' });
    this.time.delayedCall(650, () => {
      const i = STRAWBERRY_SCENES.indexOf(this.state.kind);
      if (i < STRAWBERRY_SCENES.length - 1) {
        this.stateStore.set('kind', STRAWBERRY_SCENES[i + 1]);
        if (this.state.kind === 'decorate' && STRAWBERRY_SCENES[i + 1] === 'free') {
          completionFeedback(this.gamePlatform, 'You made the garden beautiful!', '🍓');
        }
      }
      this.state = this.stateStore.get();
      this.state.advancing = false; this.renderKind();
    });
  }

  findScene() {
    this.promptText.setText('Can you find the strawberry hiding in the garden?');
    this.addSceneDecor({ mascot: true, flowers: true });
    const island = roundedRect(this, 480, 365, 760, 285, 44, 0xffffff, 0.20, { color: 0xffffff, width: 2, alpha: 0.18 });
    island.setDepth(-1); this.mark(island);
    const leaf = this.add.graphics();
    leaf.fillStyle(0x2f8f57, 1);
    for (let i = 0; i < 9; i += 1) {
      const x = 95 + i * 105; const y = 430 + (i % 3) * 22;
      leaf.fillEllipse(x, y, 92, 36);
      leaf.fillStyle(0x55b96a, 1); leaf.fillEllipse(x - 24, y - 30, 30, 58); leaf.fillEllipse(x + 24, y - 30, 30, 58);
      leaf.fillStyle(0x2f8f57, 1);
    }
    this.mark(leaf);
    const halo = this.add.circle(725, 355, 74, 0xffe6ee, 0.5).setDepth(-1); this.mark(halo);
    this.tweens.add({ targets: halo, scale: 1.18, alpha: 0.16, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const berry = this.berry(725, 355, 1.38, true);
    berry.setData('character', new ToddlerCharacter(this, berry, { baseScale: berry.scaleX, bob: true }));
    ToddlerMotion.idle(this, berry, { distance: 7, duration: 920, scale: berry.scaleX });
    const butterfly = this.add.image(205, 270, 'sg-butterfly').setDisplaySize(86, 72); this.mark(butterfly);
    this.tweens.add({ targets: butterfly, x: 260, y: 240, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  pickScene() {
    this.promptText.setText('Tap the ripe strawberry to pick it!');
    this.addSceneDecor({ mascot: true, flowers: false });
    const trunk = this.add.graphics();
    trunk.fillStyle(0x8b5a3c, 1); trunk.fillRoundedRect(450, 180, 58, 290, 26);
    trunk.fillStyle(0x6cb95c, 1); trunk.fillCircle(385, 205, 95); trunk.fillCircle(505, 175, 105); trunk.fillCircle(610, 225, 90);
    this.mark(trunk);
    const halo = this.add.circle(575, 325, 70, 0xffe6ee, 0.45).setDepth(-1); this.mark(halo);
    this.tweens.add({ targets: halo, scale: 1.16, alpha: 0.14, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const berry = this.berry(575, 325, 1.30, true);
    berry.setData('character', new ToddlerCharacter(this, berry, { baseScale: berry.scaleX, bob: true }));
    ToddlerMotion.wiggle(this, berry, { angle: 5, repeat: 2, duration: 150, onComplete: () => ToddlerMotion.idle(this, berry, { distance: 6, duration: 900, scale: berry.scaleX }) });
  }

  basketScene() {
    this.promptText.setText(`Put 3 strawberries in the basket.`);
    this.addSceneDecor({ mascot: true, flowers: true });
    const basket = this.add.image(720, 400, 'sg-basket').setDisplaySize(300, 218); this.mark(basket);
    const label = text(this, `${this.state.basket} / 3`, 720, 418, { fontSize: 30, color: '#6b3d28' }); this.mark(label);
    for (let i = 0; i < 3; i += 1) {
      if (i < this.state.basket) continue;
      const b = this.berry(150 + i * 155, 350, 0.72, false);
      this.interactions.makeTapTarget(b, () => {
        if (this.state.advancing) return;
        this.state.basket += 1;
        tapFeedback(this.gamePlatform?.audioManager, 'success');
        this.tweenTo(b, 720, 390, () => { if (this.state.basket >= 3) this.advance('All in the basket!'); else this.renderKind(); });
      }, { padding: 45 });
    }
  }

  tweenTo(target, x, y, done) { this.tweens.add({ targets: target, x, y, scale: 0.55, duration: 450, ease: 'Cubic.easeInOut', onComplete: done }); }

  washScene() {
    this.promptText.setText('Rub the strawberry gently to wash it!');
    this.addSceneDecor({ mascot: true, flowers: false });
    const sink = this.add.image(480, 385, 'sg-sink').setDisplaySize(520, 320); this.mark(sink);
    const berry = this.berry(480, 365, 1.12, false); this.mark(berry);
    berry.setInteractive({ useHandCursor: true });
    berry.on('pointermove', (p) => {
      if (!p.isDown || this.state.advancing) return;
      this.state.wash = Math.min(100, this.state.wash + 5);
      if (this.state.wash % 15 === 0) addSparkles(this, p.x, p.y, 6);
      if (this.state.wash >= 100) this.advance('Sparkling clean!');
    });
    const meter = roundedRect(this, 480, 535, 360, 28, 14, 0xffffff, 0.92); this.mark(meter);
    const fill = roundedRect(this, 300, 535, 1, 20, 10, 0x5fc9ed, 1); this.mark(fill); this.state.washFill = fill;
  }

  update(time, delta) {
    if (this.state?.kind === 'wash' && this.state.washFill) {
      const width = Math.max(1, 360 * (this.state.wash / 100)); this.state.washFill.width = width; this.state.washFill.x = 300 + width / 2; this.state.washFill.setDisplaySize(width, 20);
    }
  }

  shakeScene() {
    this.promptText.setText(this.state.shakeReady ? 'Tap BLEND to make a yummy shake!' : 'Tap the strawberry to add it to the blender!');
    this.addSceneDecor({ mascot: true, flowers: true });
    const blender = this.add.image(700, 350, 'sg-blender').setDisplaySize(245, 292); this.mark(blender);
    const berry = this.berry(315, 375, 1.00, false);
    this.interactions.makeTapTarget(berry, () => {
      if (this.state.shakeReady || this.state.advancing) return;
      this.state.shakeReady = true;
      this.tweenTo(berry, 700, 340, () => this.renderKind());
    }, { padding: 45 });
    if (this.state.shakeReady) {
      const btn = roundedRect(this, 700, 520, 190, 62, 28, 0xe85d82, 1, { color: 0xffffff, width: 3, alpha: 0.9 }); this.mark(btn);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => { if (this.state.advancing) return; this.tweens.add({ targets: blender, angle: 2, duration: 90, yoyo: true, repeat: 8 }); this.reward?.burst(700, 300, { count: 24, sound: 'blend', radius: 120 }); this.advance('Yummy shake!'); });
      text(this, 'BLEND!', 700, 520, { fontSize: 25, color: '#ffffff' });
    }
  }

  decorateScene() {
    this.promptText.setText('Make the cake pretty with 3 strawberries!');
    this.addSceneDecor({ mascot: true, flowers: true });
    const cake = this.add.image(480, 370, 'sg-cake').setDisplaySize(360, 276); this.mark(cake);
    const label = text(this, `${this.state.decor} / 3`, 480, 505, { fontSize: 30, color: '#8a4b5b' }); this.mark(label);
    for (let i = 0; i < 3; i += 1) {
      if (i < this.state.decor) continue;
      const b = this.berry(150 + i * 155, 520, 0.58, false);
      this.interactions.makeTapTarget(b, () => {
        if (this.state.advancing) return;
        this.state.decor += 1;
        this.tweenTo(b, 405 + this.state.decor * 55, 310, () => { if (this.state.decor >= 3) this.advance('So pretty!'); else this.renderKind(); });
      }, { padding: 42 });
    }
  }

  freeScene() {
    this.promptText.setText('Free play — tap the garden friends!');
    this.addSceneDecor({ mascot: false, flowers: true });
    [190, 450, 730].forEach((x, i) => {
      const b = this.berry(x, 345 + (i % 2) * 48, 0.78 + i * 0.08, true);
      b.setData('character', new ToddlerCharacter(this, b, { baseScale: b.scaleX, bob: true }));
      ToddlerMotion.idle(this, b, { distance: 8, duration: 900 + i * 120, scale: b.scaleX });
    });
    const butterfly = this.add.image(790, 255, 'sg-butterfly').setDisplaySize(110, 92); this.mark(butterfly);
    butterfly.setInteractive({ useHandCursor: true });
    butterfly.on('pointerdown', () => { addSparkles(this, butterfly.x, butterfly.y, 20); this.tweens.add({ targets: butterfly, x: 860, y: 205, duration: 700, yoyo: true, ease: 'Sine.easeInOut' }); });
    text(this, 'YOU DID IT!', 480, 150, { fontSize: 44, color: '#6d3f56' });
  }

  };
}

export class StrawberryGardenPhaserGame extends GameModule {
  static metadata = { id: 'strawberry-garden', name: '🍓 Strawberry Garden', description: 'A polished interactive strawberry adventure.', version: '3.2.0', author: 'Baby Games', assetPath: 'games/strawberry-garden/' };

  constructor(platform) { super(platform); this.runtime = null; this.host = null; }

  async initialize() {
    this.host = this.getGameContainerEl();
    if (!this.host) throw new Error('Game container unavailable.');
    this.host.replaceChildren();
    const canvasHost = document.createElement('div'); canvasHost.className = 'phaser-game-host'; this.host.appendChild(canvasHost);
    this.runtime = new PhaserGameRuntime({ parent: canvasHost, width: W, height: H, scene: (Phaser) => createStrawberryScene(Phaser, this.platform), background: '#dff7ff' });
  }

  async start() { this.isRunning = true; await this.runtime.start(); }
  pause() { this.isRunning = false; this.runtime?.game?.scene?.pause?.('default'); }
  resume() { this.isRunning = true; this.runtime?.game?.scene?.resume?.('default'); }
  stop() { this.isRunning = false; this.runtime?.stop(); }
  reset() { this.stop(); this.start(); }
  cleanup() { this.stop(); this.host?.replaceChildren(); this.host = null; }
}
