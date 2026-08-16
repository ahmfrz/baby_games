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
    description: 'Swipe across the big fruits to make a gentle slice and hear a pop.',
    version: '1.0.0',
    author: 'Baby Games',
    assetPath: 'games/fruit-slice/assets/'
  };

  constructor(platform) {
    super(platform);
    this.root = null; this.isRunning = false; this.remainingSeconds = 0;
    this.timerId = null; this.spawnId = null; this.fruits = new Set();
    this.dragging = false;
  }

  async initialize() { this.mountUI(); }
  start() {
    this.timerService?.startSession?.();
    this.remainingSeconds = this.timerService?.getRemainingSeconds?.() ?? 120;
    this.isRunning = true; this.updateTimer(); this.startSpawning();
    this.timerId = setInterval(() => this.tick(), 250);
  }
  tick() { this.remainingSeconds = this.timerService?.getRemainingSeconds?.() ?? Math.max(0, this.remainingSeconds - 1); this.updateTimer(); if (this.remainingSeconds <= 0) this.endSession(); }
  endSession() { if (!this.isRunning) return; this.isRunning = false; this.clearIntervals(); this.timerService?.endSession?.(); this.platform?.audioManager?.speak?.('Fruit time is finished!'); }
  stop() { this.isRunning = false; this.clearIntervals(); }
  pause() { this.stop(); }
  resume() { if (this.remainingSeconds > 0) { this.isRunning = true; this.timerId = setInterval(() => this.tick(), 250); this.startSpawning(); } }
  reset() { this.stop(); this.start(); }
  cleanup() { this.stop(); this.root?.remove(); this.root = null; }
  clearIntervals() { clearInterval(this.timerId); clearInterval(this.spawnId); }

  mountUI() {
    const host = this.getGameContainerEl();
    this.root = document.createElement('section');
    this.root.className = 'simple-game fruit-slice-game';
    this.root.innerHTML = `
      <header class="simple-game-header"><div>🍉 Fruit Slice</div><div>⏱ <span data-role="timer">0:00</span></div></header>
      <div class="simple-game-stage" data-role="stage"><div class="simple-game-hint">Swipe across a fruit!</div><div class="slice-line"></div></div>`;
    host?.appendChild(this.root);
    this.timerEl = this.root.querySelector('[data-role="timer"]');
    this.stage = this.root.querySelector('[data-role="stage"]');
    this.stage.addEventListener('pointerdown', e => { this.dragging = true; this.lastPoint = [e.clientX, e.clientY]; });
    this.stage.addEventListener('pointermove', e => { if (this.dragging) this.drawTrail(e); });
    window.addEventListener('pointerup', () => { this.dragging = false; this.lastPoint = null; }, { passive: true });
  }

  startSpawning() {
    clearInterval(this.spawnId);
    this.spawnId = setInterval(() => this.spawnFruit(), 900);
    for (let i = 0; i < 3; i++) this.spawnFruit();
  }
  spawnFruit() {
    if (!this.isRunning) return;
    const [emoji] = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    const fruit = document.createElement('button');
    fruit.type = 'button'; fruit.className = 'fruit-target'; fruit.textContent = emoji;
    fruit.style.left = `${8 + Math.random() * 78}%`; fruit.style.top = `${14 + Math.random() * 70}%`;
    this.stage.appendChild(fruit); this.fruits.add(fruit);
    fruit.addEventListener('click', () => this.sliceFruit(fruit), { once: true });
    setTimeout(() => { this.fruits.delete(fruit); fruit.remove(); }, 2600);
  }
  drawTrail(e) {
    if (!this.lastPoint) { this.lastPoint = [e.clientX, e.clientY]; return; }
    const line = this.stage.querySelector('.slice-line');
    const rect = this.stage.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const x0 = this.lastPoint[0] - rect.left, y0 = this.lastPoint[1] - rect.top;
    line.style.left = `${x0}px`; line.style.top = `${y0}px`;
    line.style.width = `${Math.hypot(x-x0, y-y0)}px`; line.style.transform = `rotate(${Math.atan2(y-y0,x-x0)}rad)`;
    this.lastPoint = [e.clientX, e.clientY];
    for (const fruit of this.fruits) {
      const r = fruit.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      const near = Math.hypot(e.clientX-cx, e.clientY-cy) < r.width * 0.52;
      if (near) this.sliceFruit(fruit);
    }
  }
  sliceFruit(fruit) {
    if (!fruit.isConnected) return;
    this.fruits.delete(fruit);
    fruit.classList.add('sliced');
    tapFeedback(this.platform?.audioManager, 'slice'); vibrate([20, 25, 20]);
    setTimeout(() => fruit.remove(), 180);
  }
  updateTimer() { const m=Math.floor(this.remainingSeconds/60), s=String(this.remainingSeconds%60).padStart(2,'0'); if(this.timerEl)this.timerEl.textContent=`${m}:${s}`; }
}
