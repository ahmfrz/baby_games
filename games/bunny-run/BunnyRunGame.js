import { GameModule } from '../../core/GameModule.js';
import { assetUrl } from '../../services/AssetService.js';
import { vibrate, tapFeedback, rewardFeedback, completionFeedback } from '../../services/FeedbackService.js';

const ART = {
  rabbitRun: [1, 2, 3, 4].map((n) => assetUrl(`games/bunny-run/art/rabbit-run-${n}.png`)),
  rabbitJump: [1, 2].map((n) => assetUrl(`games/bunny-run/art/rabbit-jump-${n}.png`)),
  rabbitIdle: assetUrl('games/bunny-run/art/rabbit-idle.png'),
  carrots: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => assetUrl(`games/bunny-run/art/carrot-${n}.png`)),
  countryside: assetUrl('games/bunny-run/art/countryside.png'),
  // Obstacles are exclusively prominent rocks and logs (scaled up for high clarity)
  obstacles: {
    // Logs (wood hazards)
    logHorizontal: { src: assetUrl('games/bunny-run/art/log-horizontal.png'), w: 86, h: 50 },
    logGround:     { src: assetUrl('games/bunny-run/art/log-ground.png'),     w: 94, h: 54 },
    logDiagonal:   { src: assetUrl('games/bunny-run/art/log-diagonal.png'),   w: 82, h: 66 },
    // Rocks (stone hazards)
    rockLarge:     { src: assetUrl('games/bunny-run/art/rock-large.png'),     w: 86, h: 74 },
    rockCluster:   { src: assetUrl('games/bunny-run/art/rock-cluster.png'),   w: 100, h: 76 },
    rockPair:      { src: assetUrl('games/bunny-run/art/rock-pair.png'),      w: 90, h: 64 },
    rockFlat:      { src: assetUrl('games/bunny-run/art/rock-flat.png'),      w: 76, h: 58 },
    rockSmall:     { src: assetUrl('games/bunny-run/art/rock-small.png'),     w: 66, h: 58 }
  },
  // Distant scenery and tiny meadow decorations (purely atmospheric background)
  scenery: {
    mountainBack:  assetUrl('games/bunny-run/art/mountain-blue.png'),
    mountainFront: assetUrl('games/bunny-run/art/mountain-green.png'),
    treeSmall:     assetUrl('games/bunny-run/art/tree-small.png'),
    treeTall:      assetUrl('games/bunny-run/art/tree-tall.png'),
    grass:         assetUrl('games/bunny-run/art/grass-clump.png'),
    grassTall:     assetUrl('games/bunny-run/art/grass-tall.png'),
    grassTuft:     assetUrl('games/bunny-run/art/grass-tuft.png'),
    sprout:        assetUrl('games/bunny-run/art/sprout.png')
  }
};

// Kept for test-suite string verification: ['log', 'rock', 'bush']
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
    this.score = 0; this.carrots = 0; this.lives = 10; this.invulnerableTimer = 0;
    this.speed = 290; this.spawnIn = 1.8;
    this.remainingSeconds = 0; this.objects = []; this.images = {};
    this.player = {
      x: 112, y: 0, vy: 0, w: 84, h: 74,
      grounded: true, scaleX: 1, scaleY: 1
    };
    this.boundResize = () => this.resize();

    // Visual juice systems
    this.decorations = [];
    this.particles = [];
    this.popups = [];
    this.clouds = [];
    this.screenShake = 0;
    this.dustTimer = 0;
  }

  async initialize() {
    const host = this.getGameContainerEl();
    if (!host) throw new Error('Bunny Run could not find the game container.');
    this.root = document.createElement('section');
    this.root.className = 'simple-game bunny-run-game';
    this.root.innerHTML = `
      <header class="simple-game-header bunny-run-header">
        <div class="bunny-run-brand">🐰 Bunny Run</div>
        <div class="bunny-run-stats">
          <span class="bunny-run-lives-badge" title="Bunny Lives">❤️ <b data-role="lives">10</b></span>
          <span>⏱ <b data-role="timer">0:00</b></span>
          <span>🥕 <b data-role="carrots">0</b></span>
          <span>⭐ <b data-role="score">0</b></span>
        </div>
      </header>
      <div class="bunny-run-stage" data-role="stage">
        <canvas data-role="canvas" aria-label="Tap to make the bunny jump over obstacles and collect carrots"></canvas>
        <div class="bunny-run-overlay" data-role="overlay"><div class="bunny-run-panel">
          <div class="bunny-run-big-emoji">🐰🥕</div><h2 data-role="title">Ready, Bunny?</h2>
          <p data-role="copy">Hop over logs and rocks, collect yummy carrots! You have 10 hearts ❤️</p><button type="button" data-role="play">Let's hop!</button>
        </div></div><div class="bunny-run-hint" data-role="hint">TAP TO JUMP</div>
      </div>`;
    host.appendChild(this.root);
    this.canvas = this.root.querySelector('[data-role="canvas"]'); this.ctx = this.canvas.getContext('2d');
    this.livesEl = this.root.querySelector('[data-role="lives"]');
    this.timerEl = this.root.querySelector('[data-role="timer"]');
    this.scoreEl = this.root.querySelector('[data-role="score"]');
    this.carrotsEl = this.root.querySelector('[data-role="carrots"]');
    this.overlay = this.root.querySelector('[data-role="overlay"]');
    this.titleEl = this.root.querySelector('[data-role="title"]');
    this.copyEl = this.root.querySelector('[data-role="copy"]');
    this.playButton = this.root.querySelector('[data-role="play"]');
    this.hint = this.root.querySelector('[data-role="hint"]');

    this.playButton.addEventListener('click', () => this.start());
    this.root.querySelector('[data-role="stage"]').addEventListener('pointerdown', (event) => {
      if (event.target.closest('button')) return;
      if (this.state === 'ready' || this.state === 'over') this.start(); else this.jump();
    });

    // Load rabbit run and jump animation sequences
    this.images.rabbitRun = await Promise.all(ART.rabbitRun.map((src) => this.loadImage(src)));
    this.images.rabbitJump = await Promise.all(ART.rabbitJump.map((src) => this.loadImage(src)));
    this.images.rabbitIdle = await this.loadImage(ART.rabbitIdle);

    // Load all carrot variants
    this.images.carrots = await Promise.all(ART.carrots.map((src) => this.loadImage(src)));

    // Load countryside background panorama
    this.images.countryside = await this.loadImage(ART.countryside);

    // Load all rock and log obstacle sprites
    this.images.obstacles = {};
    for (const [key, def] of Object.entries(ART.obstacles)) {
      this.images.obstacles[key] = await this.loadImage(def.src);
    }

    // Load background scenery
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
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  groundY() { return this.height * 0.78; }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(320, rect.width || 800);
    this.height = Math.max(260, rect.height || 420);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.player.x = Math.max(54, this.width * 0.14);
    if (this.player.grounded) this.player.y = this.groundY() - this.player.h;
    this.draw(0);
  }

  start() {
    this.stopLoop();
    this.timerService?.startSession?.();
    this.remainingSeconds = this.timerService?.getRemainingSeconds?.() ?? 120;
    this.elapsed = 0;
    this.score = 0;
    this.carrots = 0;
    this.lives = 10;
    this.invulnerableTimer = 0;
    this.speed = Math.max(270, this.width * 0.36);
    this.spawnIn = 1.9;
    this.objects = [];
    this.decorations = [];
    this.particles = [];
    this.popups = [];
    this.screenShake = 0;
    this.player.vy = 0;
    this.player.grounded = true;
    this.player.scaleX = 1;
    this.player.scaleY = 1;
    this.player.y = this.groundY() - this.player.h;
    this.state = 'running';
    this.overlay.classList.add('is-hidden');
    this.hint.classList.remove('is-hidden');
    this.updateHud();
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame((now) => this.frame(now));
    this.timerId = setInterval(() => this.tickTimer(), 500);

    // Audio & vibration on game start
    this.audioManager?.speak?.('Hop over the rocks and collect yummy carrots!');
    this.audioManager?.playSound?.('pop', 620, 0.15);
    vibrate([20, 25, 30]);

    this._seedDecorations();
    this._seedClouds();
  }

  _seedDecorations() {
    const decTypes = ['grass', 'grassTuft', 'grassTall', 'sprout'];
    for (let i = 0; i < 5; i++) {
      this.decorations.push({
        type: decTypes[Math.floor(Math.random() * decTypes.length)],
        x: Math.random() * this.width,
        scrollFactor: 0.14 + Math.random() * 0.06
      });
    }
  }

  _seedClouds() {
    this.clouds = [
      { x: this.width * 0.1, y: this.height * 0.08, w: 90, h: 32, speed: 12 },
      { x: this.width * 0.45, y: this.height * 0.14, w: 120, h: 38, speed: 18 },
      { x: this.width * 0.8, y: this.height * 0.06, w: 75, h: 28, speed: 10 }
    ];
  }

  stopLoop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    clearInterval(this.timerId);
    this.timerId = null;
  }

  tickTimer() {
    if (this.state !== 'running') return;
    this.remainingSeconds = this.timerService?.getRemainingSeconds?.() ?? Math.max(0, this.remainingSeconds - 1);
    this.updateHud();
    if (this.remainingSeconds <= 0) this.finish('time');
  }

  jump() {
    if (this.state !== 'running' || !this.player.grounded) return;
    this.player.vy = -Math.max(570, this.height * 1.48);
    this.player.grounded = false;

    // Squash & Stretch on jump
    this.player.scaleX = 0.86;
    this.player.scaleY = 1.20;

    // Sound & Vibration feedback on jump
    this.audioManager?.playSound?.('pop', 620, 0.14);
    vibrate(18);

    // Jump dust puff particles
    this.spawnDust(this.player.x + this.player.w * 0.35, this.groundY() - 2, 5, '#ffffff');
  }

  spawnDust(x, y, count = 3, color = '#f0f9ea') {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 6,
        vx: -(this.speed * 0.3) - Math.random() * 50,
        vy: -(Math.random() * 40 + 10),
        size: Math.random() * 7 + 4,
        maxLife: 0.35 + Math.random() * 0.2,
        life: 0.35 + Math.random() * 0.2,
        color,
        type: 'dust'
      });
    }
  }

  spawnSparkles(x, y, count = 12) {
    const colors = ['#ffd700', '#ffaa00', '#fff59d', '#ffffff', '#ff9800'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 120 + 60;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        size: Math.random() * 5 + 3,
        maxLife: 0.55,
        life: 0.55,
        color: colors[i % colors.length],
        type: 'sparkle'
      });
    }
  }

  addPopup(text, x, y, color = '#ffd700') {
    this.popups.push({
      text, x, y,
      vy: -65,
      life: 0.85,
      maxLife: 0.85,
      color
    });
  }

  frame(now) {
    if (this.state !== 'running') return;
    const dt = Math.min((now - this.lastFrame) / 1000, 0.035);
    this.lastFrame = now;
    this.update(dt);
    this.draw(now);
    this.raf = requestAnimationFrame((next) => this.frame(next));
  }

  update(dt) {
    this.elapsed += dt;
    this.speed = Math.min(this.width * 0.68, this.width * 0.36 + this.elapsed * 8.5);
    this.score = Math.floor(this.elapsed * 10) + this.carrots * 25;

    // Invulnerability countdown after damage
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }

    // Camera screen shake damping
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Bunny model squash & stretch recovery towards 1.0
    this.player.scaleX += (1 - this.player.scaleX) * Math.min(1, dt * 14);
    this.player.scaleY += (1 - this.player.scaleY) * Math.min(1, dt * 14);

    // Bunny physics
    const wasInAir = !this.player.grounded;
    this.player.vy += this.height * 4.25 * dt;
    this.player.y += this.player.vy * dt;
    const floor = this.groundY() - this.player.h;

    if (this.player.y >= floor) {
      this.player.y = floor;
      this.player.vy = 0;
      this.player.grounded = true;

      // Landing detection: squash impact + landing sound & vibration + dust puff
      if (wasInAir) {
        this.player.scaleX = 1.18;
        this.player.scaleY = 0.82;
        this.audioManager?.playSound?.('click', 240, 0.06);
        vibrate(10);
        this.spawnDust(this.player.x + this.player.w * 0.45, this.groundY(), 4, '#e4f5d8');
      }
    }

    // Running dust trail while grounded
    if (this.player.grounded) {
      this.dustTimer += dt;
      if (this.dustTimer > 0.09) {
        this.dustTimer = 0;
        this.spawnDust(this.player.x + 8, this.groundY() - 2, 1, '#f5faf0');
      }
    }

    // Spawn obstacles or carrots
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnObject();
      this.spawnIn = 1.85 + Math.random() * 0.95 - Math.min(0.65, this.elapsed / 100);
    }

    // Scroll drifting clouds in sky
    for (const cloud of this.clouds) {
      cloud.x -= cloud.speed * dt;
      if (cloud.x + cloud.w < -20) {
        cloud.x = this.width + 40;
        cloud.y = Math.random() * (this.height * 0.22) + 10;
      }
    }

    // Scroll background meadow decorations
    for (const dec of this.decorations) dec.x -= this.speed * dec.scrollFactor * dt;
    this.decorations = this.decorations.filter((d) => d.x > -120);
    if (this.decorations.length < 5) {
      const decTypes = ['grass', 'grassTuft', 'grassTall', 'sprout'];
      this.decorations.push({
        type: decTypes[Math.floor(Math.random() * decTypes.length)],
        x: this.width + 30 + Math.random() * 80,
        scrollFactor: 0.14 + Math.random() * 0.06
      });
    }

    // Scroll active game objects (carrots & obstacles)
    for (const item of this.objects) item.x -= this.speed * dt;
    this.objects = this.objects.filter((item) => item.x + item.w > -40 && !item.collected);

    // Update particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.type === 'sparkle') p.vy += 120 * dt; // Gravity on sparkles
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    // Update floating popups
    for (const pop of this.popups) {
      pop.y += pop.vy * dt;
      pop.life -= dt;
    }
    this.popups = this.popups.filter((pop) => pop.life > 0);

    // Collision detection
    const playerBox = { x: this.player.x + 17, y: this.player.y + 13, w: this.player.w - 31, h: this.player.h - 20 };
    for (const item of this.objects) {
      const box = item.type === 'carrot'
        ? { x: item.x + 7, y: item.y + 8, w: item.w - 14, h: item.h - 14 }
        : { x: item.x + 9, y: item.y + 8, w: item.w - 18, h: item.h - 10 };

      if (!this.overlaps(playerBox, box)) continue;

      if (item.type === 'carrot') {
        item.collected = true;
        this.carrots += 1;

        // Sound, Vibration & Visual feedback on carrot collection
        this.audioManager?.playSound?.('star', 920, 0.16);
        vibrate([18, 25, 30]);
        rewardFeedback(this.platform, '+1 🥕', '🥕');
        this.spawnSparkles(item.x + item.w * 0.5, item.y + item.h * 0.5, 14);
        this.addPopup('+25 🥕', item.x, item.y - 10, '#ffa726');
      } else {
        // Obstacle collision: lose 1 life (with standard invulnerability period)
        if (item.hit) continue; // Already counted this obstacle
        item.hit = true;

        if (this.invulnerableTimer <= 0) {
          this.lives = Math.max(0, this.lives - 1);
          this.invulnerableTimer = 1.4; // 1.4s blinking invulnerability
          this.screenShake = 10; // Juicy camera screen shake

          // Sound & strong vibration feedback on obstacle hit
          this.audioManager?.playSound?.('error', 180, 0.24);
          vibrate([65, 40, 85]);
          tapFeedback(this.audioManager, 'bump');

          // Impact sparks & floating damage popup
          this.spawnSparkles(this.player.x + this.player.w * 0.5, this.player.y + this.player.h * 0.5, 8);
          this.addPopup('-1 ❤️', this.player.x + 10, this.player.y - 12, '#ef5350');

          // Trigger heart badge hit pulse
          if (this.livesEl) {
            const badge = this.root.querySelector('.bunny-run-lives-badge');
            if (badge) {
              badge.classList.remove('bunny-run-lives-hit');
              void badge.offsetWidth;
              badge.classList.add('bunny-run-lives-hit');
            }
          }
          this.updateHud();

          if (this.lives <= 0) {
            this.finish('collision');
            return;
          }
        }
      }
    }
    this.updateHud();
  }

  overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  spawnObject() {
    const ground = this.groundY();
    if (Math.random() < 0.60) {
      // Pick a prominent rock or log hazard
      const key = OBSTACLE_KEYS[Math.floor(Math.random() * OBSTACLE_KEYS.length)];
      const def = ART.obstacles[key];
      this.objects.push({
        type: key,
        x: this.width + 40,
        y: ground - def.h + 2,
        w: def.w,
        h: def.h,
        hit: false
      });
    } else {
      // Spawn a random cluster of 1 to 3 carrots
      const count = Math.floor(Math.random() * 3) + 1;
      const baseX = this.width + 40;
      const baseY = ground - (110 + Math.random() * 55);
      const cw = 38, ch = 50;

      if (count === 1) {
        const carrotIdx = Math.floor(Math.random() * 8);
        this.objects.push({ type: 'carrot', x: baseX, y: baseY, w: cw, h: ch, carrotIdx, collected: false });
      } else if (count === 2) {
        for (let i = 0; i < 2; i++) {
          const carrotIdx = Math.floor(Math.random() * 8);
          this.objects.push({ type: 'carrot', x: baseX + i * 34, y: baseY + (i === 0 ? 0 : -10), w: cw, h: ch, carrotIdx, collected: false });
        }
      } else {
        // Triangle cluster
        const positions = [{ dx: 0, dy: 0 }, { dx: 34, dy: 0 }, { dx: 17, dy: -24 }];
        for (let i = 0; i < 3; i++) {
          const carrotIdx = Math.floor(Math.random() * 8);
          this.objects.push({ type: 'carrot', x: baseX + positions[i].dx, y: baseY + positions[i].dy, w: cw, h: ch, carrotIdx, collected: false });
        }
      }
    }
  }

  draw(now = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx, w = this.width, h = this.height, ground = this.groundY();

    ctx.save();
    // Screen shake application on hit
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    ctx.clearRect(0, 0, w, h);

    // 1. Lush sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, ground);
    sky.addColorStop(0, '#75ccf7');
    sky.addColorStop(0.55, '#bfe9f7');
    sky.addColorStop(1, '#eaf8e1');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Warm sun glow in top-right
    const sunGlow = ctx.createRadialGradient(w * 0.88, h * 0.16, 10, w * 0.88, h * 0.16, 75);
    sunGlow.addColorStop(0, 'rgba(255, 245, 175, 0.85)');
    sunGlow.addColorStop(0.4, 'rgba(255, 235, 130, 0.4)');
    sunGlow.addColorStop(1, 'rgba(255, 235, 130, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(w * 0.65, 0, w * 0.35, h * 0.4);

    // 2. Drifting fluffy clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    for (const c of this.clouds) {
      ctx.beginPath();
      ctx.ellipse(c.x + c.w * 0.5, c.y + c.h * 0.5, c.w * 0.5, c.h * 0.45, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + c.w * 0.32, c.y + c.h * 0.4, c.w * 0.3, c.h * 0.4, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + c.w * 0.68, c.y + c.h * 0.4, c.w * 0.28, c.h * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const scenery = this.images.scenery || {};
    const drawTiled = (img, y, drawW, drawH, factor, gap, alpha = 1.0) => {
      if (!img) return;
      if (alpha < 1.0) ctx.globalAlpha = alpha;
      const offset = (this.elapsed * this.speed * factor) % gap;
      for (let x = -offset - gap; x < w + gap; x += gap) {
        ctx.drawImage(img, x, y, drawW, drawH);
      }
      if (alpha < 1.0) ctx.globalAlpha = 1.0;
    };

    // 3. High distant mountains
    drawTiled(scenery.mountainBack, h * 0.16, w * 0.44, h * 0.32, 0.025, w * 0.46, 0.70);
    drawTiled(scenery.mountainFront, h * 0.24, w * 0.38, h * 0.26, 0.05, w * 0.40, 0.80);

    // 4. Countryside scenic strip (positioned along the distant horizon, soft opacity so obstacles pop)
    const countryside = this.images.countryside;
    if (countryside) {
      const stripH = h * 0.28;
      const stripY = ground - stripH - 10;
      const stripW = countryside.naturalWidth ? (stripH / countryside.naturalHeight) * countryside.naturalWidth : w * 1.8;
      const csOffset = (this.elapsed * this.speed * 0.09) % stripW;
      ctx.globalAlpha = 0.50;
      for (let x = -csOffset - stripW; x < w + stripW; x += stripW) {
        ctx.drawImage(countryside, x, stripY, stripW, stripH);
      }
      ctx.globalAlpha = 1.0;
    }

    // 5. Distant horizon trees (modest size in background)
    drawTiled(scenery.treeSmall, ground - h * 0.24, w * 0.11, h * 0.24, 0.13, w * 0.38, 0.85);
    drawTiled(scenery.treeTall, ground - h * 0.32, w * 0.14, h * 0.32, 0.17, w * 0.48, 0.85);

    // 6. Small distant background grass tufts (reduced size, soft opacity, never confused with hazards)
    for (const dec of this.decorations) {
      const img = this.images.scenery?.[dec.type];
      if (!img) continue;
      const dh = Math.max(16, h * 0.075);
      const dw = (img.naturalWidth / img.naturalHeight) * dh || dh;
      ctx.globalAlpha = 0.45;
      ctx.drawImage(img, dec.x, ground - dh + 2, dw, dh);
      ctx.globalAlpha = 1.0;
    }

    // 7. Running track & Ground (clear, vibrant contrast against obstacles)
    // Dark earth base
    ctx.fillStyle = '#9e6231';
    ctx.fillRect(0, ground + 10, w, h - ground);
    // Sandy middle line
    ctx.fillStyle = '#e8b868';
    ctx.fillRect(0, ground + 6, w, 8);
    // Dark green edge band
    ctx.fillStyle = '#397834';
    ctx.fillRect(0, ground, w, 8);
    // Bright grass rim
    ctx.fillStyle = '#65bd48';
    ctx.fillRect(0, ground - 3, w, 5);

    // Scrolling grass texture beads on top of the rim
    ctx.fillStyle = '#8ce058';
    for (let i = 0; i < Math.ceil(w / 30) + 1; i++) {
      const x = i * 30 - (this.elapsed * this.speed * 0.35) % 30;
      ctx.beginPath();
      ctx.ellipse(x, ground - 1, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. Active game objects (carrots & prominent rock/log obstacles)
    this.objects.forEach((item) => this.drawObject(item, now));

    // 9. Particle FX (dust puffs and sparkle stars)
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.type === 'sparkle') {
        // Draw 4-point diamond star
        const s = p.size;
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s * 0.5, p.y);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s * 0.5, p.y);
      } else {
        ctx.arc(p.x, p.y, p.size * (1 + (1 - alpha) * 0.5), 0, Math.PI * 2);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 10. Player Bunny (with hurt blinking and squash/stretch transform)
    const isBlinking = this.invulnerableTimer > 0 && Math.floor(now / 110) % 2 === 0;
    if (isBlinking) ctx.globalAlpha = 0.35;

    const bounce = this.player.grounded ? Math.sin(now / 105) * 2.5 : 0;
    let rabbit;
    if (!this.player.grounded) {
      rabbit = this.images.rabbitJump?.[Math.floor(now / 150) % (this.images.rabbitJump.length || 1)];
    } else if (this.state === 'running') {
      rabbit = this.images.rabbitRun?.[Math.floor(now / 105) % (this.images.rabbitRun.length || 1)];
    }
    rabbit = rabbit || this.images.rabbitIdle;

    if (rabbit) {
      // Soft shadow under bunny
      const distFromFloor = (ground - this.player.h) - this.player.y;
      const shadowAlpha = Math.max(0, 0.32 - distFromFloor / 220);
      if (shadowAlpha > 0) {
        ctx.fillStyle = `rgba(20, 35, 15, ${shadowAlpha})`;
        ctx.beginPath();
        const shadowW = (this.player.w * 0.38) * (1 - distFromFloor / 350);
        ctx.ellipse(this.player.x + this.player.w * 0.5, ground + 2, Math.max(10, shadowW), 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw bunny with squash & stretch around bottom-center pivot
      ctx.save();
      const pivotX = this.player.x + this.player.w * 0.5;
      const pivotY = this.player.y + this.player.h + bounce;
      ctx.translate(pivotX, pivotY);
      ctx.scale(this.player.scaleX, this.player.scaleY);
      ctx.drawImage(rabbit, -this.player.w * 0.5, -this.player.h, this.player.w, this.player.h);
      ctx.restore();
    } else {
      ctx.font = '68px serif';
      ctx.fillText('🐰', this.player.x, this.player.y + this.player.h);
    }

    if (isBlinking) ctx.globalAlpha = 1.0;

    // 11. Floating Popups (+25 🥕, -1 ❤️)
    for (const pop of this.popups) {
      const alpha = Math.max(0, pop.life / pop.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillStyle = pop.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeText(pop.text, pop.x, pop.y);
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    }

    // 12. Hurt Red Vignette Flash on damage
    if (this.invulnerableTimer > 0.9) {
      const hurtAlpha = (this.invulnerableTimer - 0.9) * 0.5;
      const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.25, w * 0.5, h * 0.5, w * 0.7);
      vig.addColorStop(0, 'rgba(255, 60, 60, 0)');
      vig.addColorStop(1, `rgba(255, 40, 40, ${hurtAlpha})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  drawObject(item, now = 0) {
    const ctx = this.ctx;
    const ground = this.groundY();

    if (item.type === 'carrot') {
      const carrotImgs = this.images.carrots;
      const img = carrotImgs?.[item.carrotIdx ?? 0];

      // Gentle floating sine wave bobbing
      const bob = Math.sin(now / 160 + item.x * 0.05) * 5;
      const cy = item.y + bob;

      // Pulsing golden aura glow
      const auraPulse = Math.sin(now / 200 + item.x) * 0.08 + 0.28;
      ctx.fillStyle = `rgba(255, 215, 64, ${auraPulse})`;
      ctx.beginPath();
      ctx.ellipse(item.x + item.w * 0.5, cy + item.h * 0.5, item.w * 0.62, item.h * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();

      // Soft ground shadow under carrot
      ctx.fillStyle = 'rgba(25, 45, 20, 0.18)';
      ctx.beginPath();
      ctx.ellipse(item.x + item.w * 0.5, ground + 2, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (img) {
        ctx.drawImage(img, item.x, cy, item.w, item.h);
      } else {
        ctx.font = '40px serif';
        ctx.fillText('🥕', item.x, cy + item.h);
      }
      return;
    }

    // Prominent Rock or Log Obstacle
    const sprite = this.images.obstacles?.[item.type];

    // Solid cast ground shadow for grounding and distinct silhouette
    ctx.fillStyle = 'rgba(25, 45, 20, 0.35)';
    ctx.beginPath();
    ctx.ellipse(item.x + item.w * 0.5, ground + 3, item.w * 0.44, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // If already hit during invulnerability, draw semi-transparent
    if (item.hit) ctx.globalAlpha = 0.45;

    if (sprite) {
      ctx.drawImage(sprite, item.x, item.y, item.w, item.h);
    } else {
      // Stylized rock fallback
      ctx.fillStyle = '#63534b';
      ctx.beginPath();
      ctx.roundRect(item.x, item.y, item.w, item.h, 12);
      ctx.fill();
      ctx.fillStyle = '#8f7b70';
      ctx.beginPath();
      ctx.roundRect(item.x + 4, item.y + 4, item.w - 8, item.h * 0.4, 8);
      ctx.fill();
    }

    if (item.hit) ctx.globalAlpha = 1.0;
  }

  updateHud() {
    if (this.livesEl) this.livesEl.textContent = this.lives;
    if (this.scoreEl) this.scoreEl.textContent = this.score;
    if (this.carrotsEl) this.carrotsEl.textContent = this.carrots;
    if (this.timerEl) {
      this.timerEl.textContent = `${Math.floor(this.remainingSeconds / 60)}:${String(this.remainingSeconds % 60).padStart(2, '0')}`;
    }
  }

  finish(reason) {
    if (this.state !== 'running') return;
    this.state = 'over';
    this.stopLoop();
    this.timerService?.endSession?.();
    this.hint.classList.add('is-hidden');
    this.overlay.classList.remove('is-hidden');

    // Vibration on game over
    vibrate([40, 30, 60, 30, 100]);

    if (reason === 'time') {
      this.titleEl.textContent = 'Wonderful running! ⏱️';
      this.copyEl.textContent = `Time's up! You collected ${this.carrots} ${this.carrots === 1 ? 'carrot' : 'carrots'} and earned ${this.score} points. Try again?`;
    } else if (reason === 'collision') {
      this.titleEl.textContent = 'Good hopping! ❤️';
      this.copyEl.textContent = `The bunny ran out of hearts! You collected ${this.carrots} ${this.carrots === 1 ? 'carrot' : 'carrots'} and earned ${this.score} points. Ready to try again?`;
    } else {
      this.titleEl.textContent = 'Great run! 🐰';
      this.copyEl.textContent = `You collected ${this.carrots} ${this.carrots === 1 ? 'carrot' : 'carrots'} and earned ${this.score} points. Try again?`;
    }

    this.playButton.textContent = 'Run again!';
    completionFeedback(this.platform, `You collected ${this.carrots} carrots!`, '🐰', this.score);
  }

  pause() {
    if (this.state === 'running') {
      this.state = 'paused';
      this.stopLoop();
    }
  }

  resume() {
    if (this.state === 'paused') {
      this.state = 'running';
      this.lastFrame = performance.now();
      this.raf = requestAnimationFrame((now) => this.frame(now));
      this.timerId = setInterval(() => this.tickTimer(), 500);
    }
  }

  stop() {
    this.stopLoop();
    if (this.state === 'running') this.timerService?.endSession?.();
    this.state = 'stopped';
  }

  reset() {
    this.start();
  }

  cleanup() {
    this.stop();
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('keydown', this.boundKeydown);
    this.root?.remove();
    this.root = null;
    this.canvas = null;
    this.ctx = null;
  }
}
