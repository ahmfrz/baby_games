import { GameModule } from '../../core/GameModule.js';
import { tapFeedback, vibrate } from '../../services/FeedbackService.js';

export class StarCollectorGame extends GameModule {
  static metadata = {
    id: 'star-collector',
    name: '⭐ Star Catch',
    description: 'Tap the twinkling stars and fill the sky with sparkles.',
    version: '1.0.0',
    author: 'Baby Games',
    assetPath: 'games/star-collector/assets/'
  };

  constructor(platform) {
    super(platform);
    this.root = null;
    this.isRunning = false;
    this.remainingSeconds = 0;
    this.timerId = null;
    this.score = 0;
    this.spawnId = null;
  }

  async initialize() { this.mountUI(); }

  start() {
    this.timerService?.startSession?.();
    this.remainingSeconds = this.timerService?.getRemainingSeconds?.() ?? 120;
    this.score = 0;
    this.isRunning = true;
    this.updateScore();
    this.updateTimer();
    this.spawnStars();
    this.timerId = setInterval(() => this.tick(), 250);
    this.platform?.audioManager?.speak?.('Tap the stars!');
  }

  tick() {
    this.remainingSeconds = this.timerService?.getRemainingSeconds?.() ?? Math.max(0, this.remainingSeconds - 1);
    this.updateTimer();
    if (this.remainingSeconds <= 0) this.endSession();
  }

  endSession() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.timerId);
    clearInterval(this.spawnId);
    this.timerService?.endSession?.();
    this.platform?.audioManager?.playSequence?.();
    this.platform?.audioManager?.speak?.(`Wonderful! You caught ${this.score} stars.`);
  }

  stop() {
    this.isRunning = false;
    clearInterval(this.timerId);
    clearInterval(this.spawnId);
  }

  pause() { this.stop(); }
  resume() { if (this.remainingSeconds > 0) { this.isRunning = true; this.timerId = setInterval(() => this.tick(), 250); this.spawnStars(); } }
  reset() { this.stop(); this.start(); }
  cleanup() { this.stop(); this.root?.remove(); this.root = null; }

  mountUI() {
    const host = this.getGameContainerEl();
    this.root = document.createElement('section');
    this.root.className = 'simple-game star-game';
    this.root.innerHTML = `
      <header class="simple-game-header"><div>⭐ Star Catch</div><div>⏱ <span data-role="timer">0:00</span> · ⭐ <span data-role="score">0</span></div></header>
      <div class="simple-game-stage" data-role="stage"><div class="simple-game-hint">Tap a star!</div></div>`;
    host?.appendChild(this.root);
    this.timerEl = this.root.querySelector('[data-role="timer"]');
    this.scoreEl = this.root.querySelector('[data-role="score"]');
    this.stage = this.root.querySelector('[data-role="stage"]');
  }

  spawnStars() {
    clearInterval(this.spawnId);
    this.spawnId = setInterval(() => this.spawnStar(), 850);
    this.spawnStar(); this.spawnStar();
  }

  spawnStar() {
    if (!this.isRunning || !this.stage) return;
    const star = document.createElement('button');
    star.className = 'star-target';
    star.type = 'button';
    star.textContent = ['⭐','🌟','✨'][Math.floor(Math.random() * 3)];
    star.style.left = `${8 + Math.random() * 80}%`;
    star.style.top = `${12 + Math.random() * 74}%`;
    star.style.animationDelay = `${Math.random() * 200}ms`;
    star.addEventListener('click', () => {
      if (!this.isRunning) return;
      this.score += 1; this.updateScore();
      tapFeedback(this.platform?.audioManager, 'star');
      vibrate(24);
      star.remove();
    }, { once: true });
    this.stage.appendChild(star);
    setTimeout(() => star.remove(), 2400);
  }

  updateScore() { if (this.scoreEl) this.scoreEl.textContent = this.score; }
  updateTimer() {
    if (!this.timerEl) return;
    const m = Math.floor(this.remainingSeconds / 60), s = String(this.remainingSeconds % 60).padStart(2, '0');
    this.timerEl.textContent = `${m}:${s}`;
  }
}
