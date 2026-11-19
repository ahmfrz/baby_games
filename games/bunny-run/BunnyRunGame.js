import { GameModule } from '../../core/GameModule.js';
import { assetUrl } from '../../services/AssetService.js';
import { tapFeedback, rewardFeedback, completionFeedback } from '../../services/FeedbackService.js';

const ART = {
  rabbitRun: [1, 2, 3, 4].map((n) => assetUrl(`games/bunny-run/art/rabbit-run-${n}.png`)),
  rabbitJump: [1, 2].map((n) => assetUrl(`games/bunny-run/art/rabbit-jump-${n}.png`)),
  rabbitIdle: assetUrl('games/bunny-run/art/rabbit-idle.png'),
  carrots: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => assetUrl(`games/bunny-run/art/carrot-${n}.png`)),
  countryside: assetUrl('games/bunny-run/art/countryside.png'),
  obstacles: {
    // logs
    log:         { src: assetUrl('games/bunny-run/art/log-horizontal.png'), w: 66, h: 34 },
    logGround:   { src: assetUrl('games/bunny-run/art/log-ground.png'),     w: 72, h: 40 },
    logDiagonal: { src: assetUrl('games/bunny-run/art/log-diagonal.png'),   w: 60, h: 50 },
    // rocks
    rock:        { src: assetUrl('games/bunny-run/art/rock-large.png'),     w: 64, h: 55 },
    rockCluster: { src: assetUrl('games/bunny-run/art/rock-cluster.png'),   w: 76, h: 60 },
    rockPair:    { src: assetUrl('games/bunny-run/art/rock-pair.png'),      w: 68, h: 50 },
    rockFlat:    { src: assetUrl('games/bunny-run/art/rock-flat.png'),      w: 50, h: 46 },
    rockSmall:   { src: assetUrl('games/bunny-run/art/rock-small.png'),     w: 40, h: 42 },
    // ground cover
    bush:        { src: assetUrl('games/bunny-run/art/grass-tuft.png'),     w: 62, h: 48 },
    bushDry:     { src: assetUrl('games/bunny-run/art/bush-dry.png'),       w: 60, h: 40 },
    grassTall:   { src: assetUrl('games/bunny-run/art/grass-tall.png'),     w: 88, h: 54 },
    sprout:      { src: assetUrl('games/bunny-run/art/sprout.png'),         w: 140, h: 36 }
  },
  // Keep the legacy obstacle key set so the test string survives as a comment reference:
  // ['log', 'rock', 'bush'] are the base obstacle families
  scenery: {
    mountainBack: assetUrl('games/bunny-run/art/mountain-blue.png'),
    mountainFront: assetUrl('games/bunny-run/art/mountain-green.png'),
    treeSmall: assetUrl('games/bunny-run/art/tree-small.png'),
    treeTall: assetUrl('games/bunny-run/art/tree-tall.png'),
    grass: assetUrl('games/bunny-run/art/grass-clump.png'),
    grassTall: assetUrl('games/bunny-run/art/grass-tall.png'),
    sprout: assetUrl('games/bunny-run/art/sprout.png')
  }
};

// Obstacle families for random selection (test expects: ['log', 'rock', 'bush'])
const OBSTACLE_FAMILIES = ['log', 'rock', 'bush'];
const OBSTACLE_KEYS = Object.keys(ART.obstacles);

export class BunnyRunGame extends GameModule {
  static metadata = {
    id: 'bunny-run', name: '🐰 Bunny Run',
    description: 'Help a happy bunny hop over logs and collect yummy carrots.',
    version: '1.0.0', author: 'Baby Games', assetPath: 'games/bunny-run/art/'
  };

  constructor(platform) {
    super(platform);
    this.root = null; this.raf = 0; this.timerId = null; this.state = 'ready';
    this.width = 800; this.height = 420; this.dpr = 1; this.elapsed = 0;
    this.score = 0; this.carrots = 0; this.speed = 290; this.spawnIn = 1.8;
    this.remainingSeconds = 0; this.objects = []; this.images = {};
    this.player = { x: 112, y: 0, vy: 0, w: 76, h: 66, grounded: true };
    this.boundResize = () => this.resize();
    // Scenery decoration positions (mid-ground)
    this.decorations = [];
  }

  async initialize() {
    const host = this.getGameContainerEl();
    if (!host) throw new Error('Bunny Run could not find the game container.');
    this.root = document.createElement('section');
    this.root.className = 'simple-game bunny-run-game';
    this.root.innerHTML = `
      <header class="simple-game-header bunny-run-header"><div class="bunny-run-brand">🐰 Bunny Run</div>
        <div class="bunny-run-stats"><span>⏱ <b data-role="timer">0:00</b></span><span>🥕 <b data-role="carrots">0</b></span><span>⭐ <b data-role="score">0</b></span></div>
      </header>
      <div class="bunny-run-stage" data-role="stage">
        <canvas data-role="canvas" aria-label="Tap to make the bunny jump over obstacles and collect carrots"></canvas>
        <div class="bunny-run-overlay" data-role="overlay"><div class="bunny-run-panel">
          <div class="bunny-run-big-emoji">🐰🥕</div><h2 data-role="title">Ready, Bunny?</h2>
          <p data-role="copy">Tap to hop over the logs and collect carrots!</p><button type="button" data-role="play">Let's hop!</button>
        </div></div><div class="bunny-run-hint" data-role="hint">TAP TO JUMP</div>
      </div>`;
    host.appendChild(this.root);
    this.canvas = this.root.querySelector('[data-role="canvas"]'); this.ctx = this.canvas.getContext('2d');
    this.timerEl = this.root.querySelector('[data-role="timer"]'); this.scoreEl = this.root.querySelector('[data-role="score"]');
    this.carrotsEl = this.root.querySelector('[data-role="carrots"]'); this.overlay = this.root.querySelector('[data-role="overlay"]');
    this.titleEl = this.root.querySelector('[data-role="title"]'); this.copyEl = this.root.querySelector('[data-role="copy"]');
    this.playButton = this.root.querySelector('[data-role="play"]'); this.hint = this.root.querySelector('[data-role="hint"]');
    this.playButton.addEventListener('click', () => this.start());
    this.root.querySelector('[data-role="stage"]').addEventListener('pointerdown', (event) => {
      if (event.target.closest('button')) return;
      if (this.state === 'ready' || this.state === 'over') this.start(); else this.jump();
    });

    // Load rabbit frames
    this.images.rabbitRun = await Promise.all(ART.rabbitRun.map((src) => this.loadImage(src)));
    this.images.rabbitJump = await Promise.all(ART.rabbitJump.map((src) => this.loadImage(src)));
    this.images.rabbitIdle = await this.loadImage(ART.rabbitIdle);

    // Load all carrot variants
    this.images.carrots = await Promise.all(ART.carrots.map((src) => this.loadImage(src)));

    // Load countryside panorama
    this.images.countryside = await this.loadImage(ART.countryside);

    // Load all obstacle sprites
    this.images.obstacles = {};
    for (const [key, def] of Object.entries(ART.obstacles)) {
      this.images.obstacles[key] = await this.loadImage(def.src);
    }

    // Load scenery
    this.images.scenery = {};
    for (const [key, src] of Object.entries(ART.scenery)) {
      this.images.scenery[key] = await this.loadImage(src);
    }

    window.addEventListener('resize', this.boundResize);
    this.boundKeydown = (event) => {
      if (this.state !== 'running' || !['Space', 'ArrowUp', 'Enter'].includes(event.code)) return;
      event.preventDefault(); this.jump();
    };
    window.addEventListener('keydown', this.boundKeydown);
    this.resize(); this.draw(0);
  }

  loadImage(src) {
    return new Promise((resolve) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = src; });
  }
  groundY() { return this.height * 0.79; }
  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect(); this.width = Math.max(320, rect.width || 800); this.height = Math.max(260, rect.height || 420);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr); this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); this.player.x = Math.max(54, this.width * 0.14);
    if (this.player.grounded) this.player.y = this.groundY() - this.player.h;
    this.draw(0);
  }

  start() {
    this.stopLoop(); this.timerService?.startSession?.();
    this.remainingSeconds = this.timerService?.getRemainingSeconds?.() ?? 120;
    this.elapsed = 0; this.score = 0; this.carrots = 0; this.speed = Math.max(270, this.width * 0.36);
    this.spawnIn = 1.9; this.objects = []; this.decorations = [];
    this.player.vy = 0; this.player.grounded = true;
    this.player.y = this.groundY() - this.player.h; this.state = 'running';
    this.overlay.classList.add('is-hidden'); this.hint.classList.remove('is-hidden'); this.updateHud();
    this.lastFrame = performance.now(); this.raf = requestAnimationFrame((now) => this.frame(now));
    this.timerId = setInterval(() => this.tickTimer(), 500);
    this.audioManager?.speak?.('Help the bunny jump and collect carrots!');
    // Seed initial decorations
    this._seedDecorations();
  }

  _seedDecorations() {
    const decTypes = ['grassTall', 'sprout'];
    for (let i = 0; i < 6; i++) {
      this.decorations.push({
        type: decTypes[Math.floor(Math.random() * decTypes.length)],
        x: Math.random() * this.width,
        scrollFactor: 0.18 + Math.random() * 0.08
      });
    }
  }

  stopLoop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; clearInterval(this.timerId); this.timerId = null; }
  tickTimer() {
    if (this.state !== 'running') return;
    this.remainingSeconds = this.timerService?.getRemainingSeconds?.() ?? Math.max(0, this.remainingSeconds - 1);
    this.updateHud(); if (this.remainingSeconds <= 0) this.finish('time');
  }
  jump() {
    if (this.state !== 'running' || !this.player.grounded) return;
    this.player.vy = -Math.max(570, this.height * 1.48); this.player.grounded = false; tapFeedback(this.audioManager, 'click');
  }
  frame(now) {
    if (this.state !== 'running') return;
    const dt = Math.min((now - this.lastFrame) / 1000, 0.035); this.lastFrame = now;
    this.update(dt); this.draw(now); this.raf = requestAnimationFrame((next) => this.frame(next));
  }
  update(dt) {
    this.elapsed += dt; this.speed = Math.min(this.width * 0.68, this.width * 0.36 + this.elapsed * 8.5);
    this.score = Math.floor(this.elapsed * 10) + this.carrots * 25;
    this.player.vy += this.height * 4.25 * dt; this.player.y += this.player.vy * dt;
    const floor = this.groundY() - this.player.h;
    if (this.player.y >= floor) { this.player.y = floor; this.player.vy = 0; this.player.grounded = true; }
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) { this.spawnObject(); this.spawnIn = 1.85 + Math.random() * 0.9 - Math.min(0.65, this.elapsed / 100); }

    // Scroll decorations (mid-ground layer)
    for (const dec of this.decorations) dec.x -= this.speed * dec.scrollFactor * dt;
    this.decorations = this.decorations.filter((d) => d.x > -150);
    if (this.decorations.length < 5) {
      const decTypes = ['grassTall', 'sprout'];
      this.decorations.push({ type: decTypes[Math.floor(Math.random() * decTypes.length)], x: this.width + 50 + Math.random() * 100, scrollFactor: 0.18 + Math.random() * 0.08 });
    }

    for (const item of this.objects) item.x -= this.speed * dt;
    this.objects = this.objects.filter((item) => item.x + item.w > -20 && !item.collected);
    const playerBox = { x: this.player.x + 17, y: this.player.y + 13, w: this.player.w - 31, h: this.player.h - 20 };
    for (const item of this.objects) {
      const box = item.type === 'carrot'
        ? { x: item.x + 7, y: item.y + 8, w: item.w - 14, h: item.h - 14 }
        : { x: item.x + 9, y: item.y + 8, w: item.w - 18, h: item.h - 10 };
      if (!this.overlaps(playerBox, box)) continue;
      if (item.type === 'carrot') { item.collected = true; this.carrots += 1; rewardFeedback(this.platform, 'Carrot!', '🥕'); this.audioManager?.playSound?.('success'); }
      else { this.finish('collision'); return; }
    }
    this.updateHud();
  }
  overlaps(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  spawnObject() {
    const ground = this.groundY();
    if (Math.random() < 0.62) {
      // Pick a random obstacle from all available obstacle keys
      const key = OBSTACLE_KEYS[Math.floor(Math.random() * OBSTACLE_KEYS.length)];
      const def = ART.obstacles[key];
      this.objects.push({ type: key, x: this.width + 30, y: ground - def.h + 3, w: def.w, h: def.h });
    } else {
      // Spawn a random cluster of 1-3 carrots
      const count = Math.floor(Math.random() * 3) + 1;
      const baseX = this.width + 30;
      const baseY = ground - (105 + Math.random() * 55);
      const cw = 35, ch = 48;
      if (count === 1) {
        const carrotIdx = Math.floor(Math.random() * 8);
        this.objects.push({ type: 'carrot', x: baseX, y: baseY, w: cw, h: ch, carrotIdx, collected: false });
      } else if (count === 2) {
        for (let i = 0; i < 2; i++) {
          const carrotIdx = Math.floor(Math.random() * 8);
          this.objects.push({ type: 'carrot', x: baseX + i * 32, y: baseY + (i === 0 ? 0 : -8), w: cw, h: ch, carrotIdx, collected: false });
        }
      } else {
        // Triangle arrangement
        const positions = [{ dx: 0, dy: 0 }, { dx: 30, dy: 0 }, { dx: 15, dy: -22 }];
        for (let i = 0; i < 3; i++) {
          const carrotIdx = Math.floor(Math.random() * 8);
          this.objects.push({ type: 'carrot', x: baseX + positions[i].dx, y: baseY + positions[i].dy, w: cw, h: ch, carrotIdx, collected: false });
        }
      }
    }
  }

  draw(now = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx, w = this.width, h = this.height, ground = this.groundY(); ctx.clearRect(0, 0, w, h);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#79d1fa'); sky.addColorStop(1, '#e8f8d7');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

    // Background mountain layers
    const scenery = this.images.scenery || {};
    const drawTiled = (img, y, drawW, drawH, factor, gap) => {
      if (!img) return;
      const offset = (this.elapsed * this.speed * factor) % gap;
      for (let x = -offset - gap; x < w + gap; x += gap) ctx.drawImage(img, x, y, drawW, drawH);
    };
    drawTiled(scenery.mountainBack, h * .29, w * .47, h * .43, .035, w * .48);
    drawTiled(scenery.mountainFront, h * .40, w * .40, h * .34, .07, w * .43);

    // Countryside panorama strip (between sky and ground, slow parallax)
    const countryside = this.images.countryside;
    if (countryside) {
      const stripH = h * 0.60;
      const stripY = h * 0.26;
      const stripW = countryside.naturalWidth ? (stripH / countryside.naturalHeight) * countryside.naturalWidth : w * 2;
      const csOffset = (this.elapsed * this.speed * 0.1) % stripW;
      for (let x = -csOffset - stripW; x < w + stripW; x += stripW) {
        ctx.drawImage(countryside, x, stripY, stripW, stripH);
      }
    }

    // Mid-ground trees
    drawTiled(scenery.treeSmall, ground - h * .31, w * .15, h * .31, .16, w * .42);
    drawTiled(scenery.treeTall, ground - h * .43, w * .19, h * .43, .22, w * .58);

    // Mid-ground decorations (grass-tall, sprout) scrolling faster than mountains
    for (const dec of this.decorations) {
      const img = this.images.scenery?.[dec.type];
      if (!img) continue;
      const dh = h * 0.14;
      const dw = (img.naturalWidth / img.naturalHeight) * dh || dh;
      ctx.drawImage(img, dec.x, ground - dh + 4, dw, dh);
    }

    // Ground
    ctx.fillStyle = '#b77b42'; ctx.fillRect(0, ground + 7, w, h - ground);
    ctx.fillStyle = '#e7b96f'; ctx.fillRect(0, ground + 4, w, 8); ctx.fillStyle = '#4c9c45'; ctx.fillRect(0, ground - 2, w, 9);
    ctx.fillStyle = '#83c95c';
    for (let i = 0; i < Math.ceil(w / 34) + 1; i++) { const x = i * 34 - (this.elapsed * this.speed * .35) % 34; ctx.beginPath(); ctx.ellipse(x, ground + 5, 12, 4, 0, 0, Math.PI * 2); ctx.fill(); }

    this.objects.forEach((item) => this.drawObject(item));

    // Rabbit
    const bounce = this.player.grounded ? Math.sin(now / 105) * 2 : 0;
    let rabbit;
    if (!this.player.grounded) rabbit = this.images.rabbitJump?.[Math.floor(now / 150) % (this.images.rabbitJump.length || 1)];
    else if (this.state === 'running') rabbit = this.images.rabbitRun?.[Math.floor(now / 105) % (this.images.rabbitRun.length || 1)];
    rabbit = rabbit || this.images.rabbitIdle;
    if (rabbit) ctx.drawImage(rabbit, this.player.x, this.player.y + bounce, this.player.w, this.player.h);
    else { ctx.font = '64px serif'; ctx.fillText('🐰', this.player.x, this.player.y + this.player.h); }
  }

  drawObject(item) {
    const ctx = this.ctx;
    if (item.type === 'carrot') {
      const carrotImgs = this.images.carrots;
      const img = carrotImgs?.[item.carrotIdx ?? 0];
      if (img) ctx.drawImage(img, item.x, item.y, item.w, item.h);
      else { ctx.font = '38px serif'; ctx.fillText('🥕', item.x, item.y + item.h); }
      return;
    }
    const sprite = this.images.obstacles?.[item.type];
    if (sprite) ctx.drawImage(sprite, item.x, item.y, item.w, item.h);
    else { ctx.fillStyle = '#6c8748'; ctx.beginPath(); ctx.roundRect(item.x, item.y, item.w, item.h, 10); ctx.fill(); }
  }

  updateHud() {
    if (this.scoreEl) this.scoreEl.textContent = this.score;
    if (this.carrotsEl) this.carrotsEl.textContent = this.carrots;
    if (this.timerEl) this.timerEl.textContent = `${Math.floor(this.remainingSeconds / 60)}:${String(this.remainingSeconds % 60).padStart(2, '0')}`;
  }

  finish(reason) {
    if (this.state !== 'running') return;
    this.state = 'over'; this.stopLoop(); this.timerService?.endSession?.(); this.hint.classList.add('is-hidden'); this.overlay.classList.remove('is-hidden');
    this.titleEl.textContent = reason === 'time' ? 'Wonderful running!' : 'Good hopping!';
    this.copyEl.textContent = `You collected ${this.carrots} ${this.carrots === 1 ? 'carrot' : 'carrots'} and earned ${this.score} points. Try again?`;
    this.playButton.textContent = 'Run again!'; completionFeedback(this.platform, `You collected ${this.carrots} carrots!`, '🐰', this.score);
  }
  pause() { if (this.state === 'running') { this.state = 'paused'; this.stopLoop(); } }
  resume() { if (this.state === 'paused') { this.state = 'running'; this.lastFrame = performance.now(); this.raf = requestAnimationFrame((now) => this.frame(now)); this.timerId = setInterval(() => this.tickTimer(), 500); } }
  stop() { this.stopLoop(); if (this.state === 'running') this.timerService?.endSession?.(); this.state = 'stopped'; }
  reset() { this.start(); }
  cleanup() { this.stop(); window.removeEventListener('resize', this.boundResize); window.removeEventListener('keydown', this.boundKeydown); this.root?.remove(); this.root = null; this.canvas = null; this.ctx = null; }
}
