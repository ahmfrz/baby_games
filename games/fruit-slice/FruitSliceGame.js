import { GameModule } from '../../core/GameModule.js';
import { tapFeedback, vibrate } from '../../services/FeedbackService.js';

const FRUITS = [
  ['🍎', 'Apple'], ['🍊', 'Orange'], ['🍉', 'Watermelon'], ['🍓', 'Strawberry'],
  ['🍌', 'Banana'], ['🍇', 'Grapes'], ['🥝', 'Kiwi'], ['🍍', 'Pineapple']
];

export class FruitSliceGame extends GameModule {
  static metadata = {
    id: 'fruit-slice',
    name: '🍉 Fruit Slice',
    description: 'Gently swipe across the big fruit with a magic swish.',
    version: '1.1.0',
    author: 'Baby Games',
    assetPath: 'games/fruit-slice/assets/'
  };

  constructor(platform) {
    super(platform);
    this.root = null;
    this.isRunning = false;
    this.remainingSeconds = 0;
    this.timerId = null;
    this.spawnId = null;
    this.fruits = new Set();
    this.dragging = false;
    this.lastPoint = null;
    this.lastSlicePoint = null;
  }

  async initialize() { this.mountUI(); }

  start() {
    this.timerService?.startSession?.();
    this.remainingSeconds = this.timerService?.getRemainingSeconds?.() ?? 120;
    this.isRunning = true;
    this.updateTimer();
    this.startSpawning();
    this.timerId = setInterval(() => this.tick(), 250);
    this.platform?.audioManager?.speak?.('Swipe the magic swish across the fruit!');
  }

  tick() {
    this.remainingSeconds = this.timerService?.getRemainingSeconds?.() ?? Math.max(0, this.remainingSeconds - 1);
    this.updateTimer();
    if (this.remainingSeconds <= 0) this.endSession();
  }

  endSession() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.clearIntervals();
    this.platform?.audioManager?.speak?.('Fruit time is finished!');
  }

  stop() {
    this.isRunning = false;
    this.clearIntervals();
    this.dragging = false;
    this.lastPoint = null;
    this.fruits.clear();
  }

  pause() { this.stop(); }
  resume() {
    if (this.remainingSeconds > 0) {
      this.isRunning = true;
      this.timerId = setInterval(() => this.tick(), 250);
      this.startSpawning();
    }
  }
  reset() { this.stop(); this.start(); }
  cleanup() { this.stop(); this.root?.remove(); this.root = null; }

  clearIntervals() {
    clearInterval(this.timerId);
    clearInterval(this.spawnId);
    this.timerId = null;
    this.spawnId = null;
  }

  mountUI() {
    const host = this.getGameContainerEl();
    this.root = document.createElement('section');
    this.root.className = 'simple-game fruit-slice-game';
    this.root.innerHTML = `
      <header class="simple-game-header"><div>🍉 Fruit Slice</div><div>⏱ <span data-role="timer">0:00</span></div></header>
      <div class="simple-game-stage fruit-stage" data-role="stage">
        <div class="simple-game-hint">Swipe the magic swish across a fruit!</div>
        <div class="slice-line" aria-hidden="true"></div>
        <div class="slice-knife" data-role="knife" aria-hidden="true">✨</div>
      </div>`;
    host?.appendChild(this.root);

    this.timerEl = this.root.querySelector('[data-role="timer"]');
    this.stage = this.root.querySelector('[data-role="stage"]');
    this.knifeEl = this.root.querySelector('[data-role="knife"]');
    this.sliceLine = this.root.querySelector('.slice-line');

    this.onPointerDown = (e) => {
      if (!this.isRunning) return;
      e.preventDefault();
      this.dragging = true;
      this.lastPoint = [e.clientX, e.clientY];
      this.lastSlicePoint = [e.clientX, e.clientY];
      this.updateKnife(e.clientX, e.clientY, 0);
      this.knifeEl?.classList.add('knife-active');
      try { this.stage.setPointerCapture?.(e.pointerId); } catch (_) {}
    };

    this.onPointerMove = (e) => {
      if (!this.dragging || !this.isRunning) return;
      e.preventDefault();
      this.drawTrail(e);
    };

    this.onPointerUp = (e) => {
      if (!this.dragging) return;
      this.dragging = false;
      this.lastPoint = null;
      this.lastSlicePoint = null;
      this.knifeEl?.classList.remove('knife-active');
      try { this.stage.releasePointerCapture?.(e.pointerId); } catch (_) {}
      this.sliceLine.style.opacity = '0';
    };

    this.stage.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    this.stage.addEventListener('pointermove', this.onPointerMove, { passive: false });
    this.stage.addEventListener('pointerup', this.onPointerUp, { passive: false });
    this.stage.addEventListener('pointercancel', this.onPointerUp, { passive: false });
  }

  startSpawning() {
    clearInterval(this.spawnId);
    this.spawnId = setInterval(() => this.spawnFruit(), 1500);
    this.spawnFruit();
    setTimeout(() => this.spawnFruit(), 650);
  }

  spawnFruit() {
    if (!this.isRunning || !this.stage) return;

    const [emoji, name] = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    const fruit = document.createElement('button');
    fruit.type = 'button';
    fruit.className = 'fruit-target';
    fruit.textContent = emoji;
    fruit.setAttribute('aria-label', name);
    fruit.style.left = `${8 + Math.random() * 76}%`;
    fruit.style.setProperty('--rise-duration', `${8 + Math.random() * 2.5}s`);
    fruit.style.setProperty('--fruit-wobble', `${-5 + Math.random() * 10}deg`);

    const removeFruit = () => {
      this.fruits.delete(fruit);
      fruit.remove();
    };

    this.fruits.add(fruit);
    this.stage.appendChild(fruit);

    // Keep tap as a backup for toddlers who tap rather than swipe.
    fruit.addEventListener('click', () => this.sliceFruit(fruit), { once: true });

    // Fruit remains available for the full upward journey.
    setTimeout(() => {
      if (fruit.isConnected) removeFruit();
    }, 12000);
  }

  drawTrail(e) {
    if (!this.lastPoint) {
      this.lastPoint = [e.clientX, e.clientY];
      return;
    }

    const rect = this.stage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const x0 = this.lastPoint[0] - rect.left;
    const y0 = this.lastPoint[1] - rect.top;
    const dx = x - x0;
    const dy = y - y0;
    const angle = Math.atan2(dy, dx);

    this.sliceLine.style.left = `${x0}px`;
    this.sliceLine.style.top = `${y0}px`;
    this.sliceLine.style.width = `${Math.max(20, Math.hypot(dx, dy))}px`;
    this.sliceLine.style.transform = `rotate(${angle}rad)`;
    this.sliceLine.style.opacity = '1';
    this.updateKnife(e.clientX, e.clientY, angle);

    // Check the entire swipe segment, not just the latest pointer position.
    for (const fruit of [...this.fruits]) {
      if (!fruit.isConnected || fruit.classList.contains('sliced')) continue;
      const r = fruit.getBoundingClientRect();
      const center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      const radius = r.width * 0.52;
      const near = this.distanceToSegment(center.x, center.y, this.lastPoint[0], this.lastPoint[1], e.clientX, e.clientY) < radius;
      if (near) this.sliceFruit(fruit, center, angle);
    }

    this.lastPoint = [e.clientX, e.clientY];
  }

  updateKnife(clientX, clientY, angle = 0) {
    if (!this.knifeEl || !this.stage) return;
    const rect = this.stage.getBoundingClientRect();
    this.knifeEl.style.left = `${clientX - rect.left}px`;
    this.knifeEl.style.top = `${clientY - rect.top}px`;
    this.knifeEl.style.transform = `translate(-18%, -72%) rotate(${angle}rad)`;
  }

  distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
  }

  sliceFruit(fruit, center = null, angle = 0) {
    if (!fruit?.isConnected || fruit.classList.contains('sliced')) return;

    this.fruits.delete(fruit);
    const r = fruit.getBoundingClientRect();
    const fruitCenter = center || { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    const stageRect = this.stage.getBoundingClientRect();

    // Put a knife slash directly over the fruit so the toddler can see what happened.
    const slash = document.createElement('div');
    slash.className = 'knife-slash';
    slash.style.left = `${fruitCenter.x - stageRect.left}px`;
    slash.style.top = `${fruitCenter.y - stageRect.top}px`;
    slash.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
    this.stage.appendChild(slash);

    fruit.classList.add('sliced');
    tapFeedback(this.platform?.audioManager, 'slice');
    vibrate([20, 25, 20]);

    setTimeout(() => {
      slash.remove();
      fruit.remove();
    }, 360);
  }

  updateTimer() {
    const m = Math.floor(this.remainingSeconds / 60);
    const s = String(this.remainingSeconds % 60).padStart(2, '0');
    if (this.timerEl) this.timerEl.textContent = `${m}:${s}`;
  }
}
