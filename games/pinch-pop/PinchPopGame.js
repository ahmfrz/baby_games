import { GameModule } from '../../core/GameModule.js';
import { tapFeedback, vibrate, rewardFeedback } from '../../services/FeedbackService.js';

export class PinchPopGame extends GameModule {
  static metadata = {
    id: 'pinch-pop',
    name: '🤏 Pinch Pop',
    description: 'Use two fingers to pinch colorful bubbles and make them pop.',
    version: '1.0.0',
    author: 'Baby Games',
    assetPath: 'games/pinch-pop/assets/'
  };

  constructor(platform) {
    super(platform);
    this.root = null;
    this.stage = null;
    this.bubble = null;
    this.timerEl = null;
    this.scoreEl = null;
    this.remainingSeconds = 0;
    this.timerId = null;
    this.score = 0;
    this.isRunning = false;
    this.pointers = new Map();
    this.startDistance = null;
    this.lastDistance = null;
    this.pinched = false;
    this.targetScale = 1;
  }

  async initialize() { this.mountUI(); }

  start() {
    this.timerService?.startSession?.();
    this.remainingSeconds = this.timerService?.getRemainingSeconds?.() ?? 120;
    this.score = 0;
    this.isRunning = true;
    this.updateScore();
    this.updateTimer();
    this.resetBubble();
    this.timerId = setInterval(() => this.tick(), 250);
    this.platform?.audioManager?.speak?.('Use two fingers. Pinch the bubble!');
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
    this.timerId = null;
    this.platform?.audioManager?.playSequence?.([523, 659, 784]);
    this.platform?.audioManager?.speak?.(`Wonderful! You popped ${this.score} bubbles.`);
  }

  stop() {
    this.isRunning = false;
    clearInterval(this.timerId);
    this.timerId = null;
    this.pointers.clear();
    this.startDistance = null;
    this.lastDistance = null;
  }

  pause() { this.stop(); }

  resume() {
    if (this.remainingSeconds <= 0) return;
    this.isRunning = true;
    this.timerId = setInterval(() => this.tick(), 250);
  }

  reset() { this.stop(); this.start(); }

  cleanup() {
    this.stop();
    this.root?.remove();
    this.root = null;
  }

  mountUI() {
    const host = this.getGameContainerEl();
    this.root = document.createElement('section');
    this.root.className = 'simple-game pinch-game';
    this.root.innerHTML = `
      <header class="simple-game-header">
        <div>🤏 Pinch Pop</div>
        <div>⏱ <span data-role="timer">0:00</span> · ⭐ <span data-role="score">0</span></div>
      </header>
      <div class="simple-game-stage pinch-stage" data-role="stage">
        <div class="simple-game-hint">Put two fingers on the bubble, then bring them together!</div>
        <div class="pinch-bubble" data-role="bubble" aria-hidden="true">
          <span>🤏</span><b>PINCH ME!</b>
        </div>
        <div class="pinch-finger-hint" aria-hidden="true">☝️ &nbsp; ☝️</div>
      </div>`;
    host?.appendChild(this.root);
    this.timerEl = this.root.querySelector('[data-role="timer"]');
    this.scoreEl = this.root.querySelector('[data-role="score"]');
    this.stage = this.root.querySelector('[data-role="stage"]');
    this.bubble = this.root.querySelector('[data-role="bubble"]');

    ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach((type) => {
      this.stage.addEventListener(type, (event) => this.handlePointer(type, event), { passive: false });
    });
  }

  handlePointer(type, event) {
    if (!this.isRunning) return;
    if (type === 'pointerdown' || type === 'pointermove') {
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    } else {
      this.pointers.delete(event.pointerId);
    }

    if (this.pointers.size < 2) {
      this.startDistance = null;
      this.lastDistance = null;
      this.bubble?.classList.remove('pinch-active');
      return;
    }

    event.preventDefault();
    const [a, b] = [...this.pointers.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y);

    if (this.startDistance === null) {
      this.startDistance = distance;
      this.lastDistance = distance;
      this.pinched = false;
    }

    this.lastDistance = distance;
    const scale = Math.max(.68, Math.min(1.35, distance / Math.max(80, this.startDistance)));
    this.targetScale = scale;
    this.bubble?.style.setProperty('--pinch-scale', String(scale));
    this.bubble?.classList.add('pinch-active');

    // A large, forgiving threshold makes the gesture easy for toddlers.
    if (!this.pinched && this.startDistance > 70 && distance < this.startDistance * 0.62) {
      this.pinched = true;
      this.popBubble();
    }
  }

  popBubble() {
    if (!this.bubble) return;
    this.score += 1;
    this.updateScore();
    tapFeedback(this.platform?.audioManager, 'pop');
    rewardFeedback(this.platform, 'Pop! Great pinch!', '🎉');
    vibrate([18, 25, 35]);
    this.bubble.classList.remove('pinch-pop');
    void this.bubble.offsetWidth;
    this.bubble.classList.add('pinch-pop');
    this.platform?.audioManager?.speak?.('Pop! Great pinch!');
    setTimeout(() => this.resetBubble(), 380);
  }

  resetBubble() {
    if (!this.bubble) return;
    this.pinched = false;
    this.startDistance = null;
    this.lastDistance = null;
    this.bubble.classList.remove('pinch-pop', 'pinch-active');
    this.bubble.style.setProperty('--pinch-scale', '1');
  }

  updateScore() { if (this.scoreEl) this.scoreEl.textContent = this.score; }

  updateTimer() {
    if (!this.timerEl) return;
    const m = Math.floor(this.remainingSeconds / 60);
    const s = String(this.remainingSeconds % 60).padStart(2, '0');
    this.timerEl.textContent = `${m}:${s}`;
  }
}
