import { GameModule } from '../../core/GameModule.js';
import { tapFeedback, vibrate, rewardFeedback } from '../../services/FeedbackService.js';

export class StarCollectorGame extends GameModule {
  static metadata = {
    id: 'star-collector',
    name: '⭐ Star Catch',
    description: 'Tap the big twinkling stars as they slowly float up into the sky.',
    version: '1.1.0',
    author: 'Baby Games',
    assetPath: 'games/star-collector/assets/'
  };

  constructor(platform) {
    super(platform);
    this.root = null;
    this.isRunning = false;
    this.remainingSeconds = 0;
    this.timerId = null;
    this.spawnId = null;
    this.score = 0;
    this.activeStars = new Set();
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
    this.timerId = null;
    this.spawnId = null;
    this.timerService?.endSession?.();
    this.platform?.audioManager?.playSequence?.();
    this.platform?.audioManager?.speak?.(`Wonderful! You caught ${this.score} stars.`);
  }

  stop() {
    this.isRunning = false;
    clearInterval(this.timerId);
    clearInterval(this.spawnId);
    this.timerId = null;
    this.spawnId = null;
    this.activeStars.clear();
  }

  pause() { this.stop(); }
  resume() {
    if (this.remainingSeconds > 0) {
      this.isRunning = true;
      this.timerId = setInterval(() => this.tick(), 250);
      this.spawnStars();
    }
  }
  reset() { this.stop(); this.start(); }
  cleanup() { this.stop(); this.root?.remove(); this.root = null; }

  mountUI() {
    const host = this.getGameContainerEl();
    this.root = document.createElement('section');
    this.root.className = 'simple-game star-game';
    this.root.innerHTML = `
      <header class="simple-game-header"><div>⭐ Star Catch</div><div>⏱ <span data-role="timer">0:00</span> · ⭐ <span data-role="score">0</span></div></header>
      <div class="simple-game-stage star-stage" data-role="stage">
        <div class="simple-game-hint">Tap a big star before it floats away!</div>
      </div>`;
    host?.appendChild(this.root);
    this.timerEl = this.root.querySelector('[data-role="timer"]');
    this.scoreEl = this.root.querySelector('[data-role="score"]');
    this.stage = this.root.querySelector('[data-role="stage"]');
  }

  spawnStars() {
    clearInterval(this.spawnId);
    this.spawnId = setInterval(() => this.spawnStar(), 1400);
    // Start with two easy targets so the toddler immediately has something to tap.
    this.spawnStar();
    setTimeout(() => this.spawnStar(), 700);
  }

  spawnStar() {
    if (!this.isRunning || !this.stage) return;

    const star = document.createElement('button');
    star.className = 'star-target';
    star.type = 'button';
    star.setAttribute('aria-label', 'Star');
    star.textContent = ['⭐', '🌟'][Math.floor(Math.random() * 2)];
    star.style.left = `${10 + Math.random() * 74}%`;
    star.style.setProperty('--rise-duration', `${7.5 + Math.random() * 2.5}s`);
    star.style.setProperty('--star-tilt', `${-4 + Math.random() * 8}deg`);

    const removeStar = () => {
      this.activeStars.delete(star);
      star.remove();
    };

    star.addEventListener('click', () => {
      if (!this.isRunning || !star.isConnected) return;
      this.score += 1;
      this.updateScore();
      tapFeedback(this.platform?.audioManager, 'star');
      rewardFeedback(this.platform, 'Star!', '⭐');
      vibrate([18, 24, 24]);
      star.classList.add('star-caught');
      setTimeout(removeStar, 220);
    }, { once: true });

    this.activeStars.add(star);
    this.stage.appendChild(star);
    // The animation itself keeps the star visible for a long, predictable period.
    // A generous timeout is only a safety net for stalled animations.
    setTimeout(() => {
      if (star.isConnected) removeStar();
    }, 11000);
  }

  updateScore() { if (this.scoreEl) this.scoreEl.textContent = this.score; }

  updateTimer() {
    if (!this.timerEl) return;
    const m = Math.floor(this.remainingSeconds / 60);
    const s = String(this.remainingSeconds % 60).padStart(2, '0');
    this.timerEl.textContent = `${m}:${s}`;
  }
}
