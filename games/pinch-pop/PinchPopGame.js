import { GameModule } from '../../core/GameModule.js';
import { tapFeedback, vibrate, rewardFeedback } from '../../services/FeedbackService.js';

const LEVELS = [
  { eggs: 3, gap: 28, heightDelta: 0, label: 'Easy nest' },
  { eggs: 4, gap: 44, heightDelta: 50, label: 'High nest' },
  { eggs: 5, gap: 62, heightDelta: 95, label: 'Big move' },
  { eggs: 6, gap: 82, heightDelta: 145, label: 'Up and down' }
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class PinchPopGame extends GameModule {
  static metadata = {
    id: 'pinch-pop',
    name: '🤏 Nest & Move',
    description: 'Pinch an egg or ball with two fingers and carry it to the other nest.',
    version: '2.0.0',
    author: 'Baby Games',
    assetPath: 'games/pinch-pop/assets/'
  };

  constructor(platform) {
    super(platform);
    this.root = null;
    this.stage = null;
    this.timerEl = null;
    this.levelEl = null;
    this.scoreEl = null;
    this.instructionEl = null;
    this.sourceNest = null;
    this.targetNest = null;
    this.itemLayer = null;
    this.timerId = null;
    this.remainingSeconds = 0;
    this.levelIndex = 0;
    this.score = 0;
    this.itemCount = 0;
    this.itemsMoved = 0;
    this.isRunning = false;
    this.pointers = new Map();
    this.grab = null;
    this.dragOffset = { x: 0, y: 0 };
    this.levelTransitionId = null;
  }

  async initialize() { this.mountUI(); }

  start() {
    this.timerService?.startSession?.();
    this.remainingSeconds = this.timerService?.getRemainingSeconds?.() ?? 120;
    this.levelIndex = 0;
    this.score = 0;
    this.isRunning = true;
    this.updateScore();
    this.updateTimer();
    this.buildLevel();
    this.timerId = setInterval(() => this.tick(), 250);
    this.platform?.audioManager?.speak?.('Pinch an egg with two fingers, then move it to the other nest.');
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
    this.platform?.audioManager?.playSequence?.([523, 659, 784, 988]);
    this.platform?.audioManager?.speak?.(`Great job! You moved ${this.score} pieces.`);
  }

  stop() {
    this.isRunning = false;
    clearInterval(this.timerId);
    clearTimeout(this.levelTransitionId);
    this.timerId = null;
    this.levelTransitionId = null;
    this.pointers.clear();
    this.releaseGrab(false);
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
        <div>🤏 Nest &amp; Move</div>
        <div>🏆 <span data-role="score">0</span> · Level <span data-role="level">1</span> · ⏱ <span data-role="timer">0:00</span></div>
      </header>
      <div class="simple-game-stage pinch-stage nest-stage" data-role="stage">
        <div class="nest-sky-badge" data-role="instruction">Pinch an egg with two fingers!</div>
        <div class="nest-zone nest-source" data-role="sourceNest">
          <div class="nest-label">🏡 PICK UP</div>
          <div class="nest-bowl">🪺</div>
        </div>
        <div class="nest-zone nest-target" data-role="targetNest">
          <div class="nest-label">🏡 PUT HERE</div>
          <div class="nest-bowl">🪹</div>
        </div>
        <div class="nest-item-layer" data-role="itemLayer"></div>
        <div class="pinch-gesture-hint" aria-hidden="true">☝️  +  ☝️  →  🤏  →  🥚</div>
      </div>`;
    host?.appendChild(this.root);

    this.stage = this.root.querySelector('[data-role="stage"]');
    this.timerEl = this.root.querySelector('[data-role="timer"]');
    this.levelEl = this.root.querySelector('[data-role="level"]');
    this.scoreEl = this.root.querySelector('[data-role="score"]');
    this.instructionEl = this.root.querySelector('[data-role="instruction"]');
    this.sourceNest = this.root.querySelector('[data-role="sourceNest"]');
    this.targetNest = this.root.querySelector('[data-role="targetNest"]');
    this.itemLayer = this.root.querySelector('[data-role="itemLayer"]');

    ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach((type) => {
      this.stage.addEventListener(type, (event) => this.handlePointer(type, event), { passive: false });
    });
  }

  buildLevel() {
    const config = LEVELS[this.levelIndex];
    this.levelEl.textContent = String(this.levelIndex + 1);
    this.itemsMoved = 0;
    this.itemCount = config.eggs;
    this.grab = null;
    this.pointers.clear();
    this.itemLayer.replaceChildren();

    const stageRect = this.stage.getBoundingClientRect();
    const sideMargin = Math.min(100, stageRect.width * 0.12);
    const leftX = sideMargin + 80;
    const rightX = Math.max(leftX + 180, stageRect.width - sideMargin - 80);
    const baseY = stageRect.height * 0.62;
    const rightY = clamp(baseY - config.heightDelta, 90, stageRect.height - 130);

    this.placeNest(this.sourceNest, leftX, baseY);
    this.placeNest(this.targetNest, rightX, rightY);

    for (let i = 0; i < config.eggs; i += 1) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'nest-item';
      item.dataset.itemId = String(i);
      item.textContent = i % 2 === 0 ? '🥚' : '🟠';
      const angle = (i - (config.eggs - 1) / 2) * 18;
      const x = leftX + Math.sin(angle * Math.PI / 180) * Math.min(72, config.eggs * 9);
      const y = baseY - 12 - Math.abs(i - (config.eggs - 1) / 2) * 7;
      item.style.left = `${x}px`;
      item.style.top = `${y}px`;
      item.setAttribute('aria-label', 'Pinch me and move me');
      item.addEventListener('click', (event) => event.preventDefault());
      this.itemLayer.appendChild(item);
    }

    this.instructionEl.textContent = `Level ${this.levelIndex + 1}: pinch an egg, carry it to the other nest!`;
    this.platform?.audioManager?.speak?.(`${config.label}. Pinch an egg and move it to the other nest.`);
  }

  placeNest(nest, x, y) {
    if (!nest) return;
    nest.style.left = `${x}px`;
    nest.style.top = `${y}px`;
  }

  findItemAt(x, y) {
    const stageRect = this.stage.getBoundingClientRect();
    const localX = x - stageRect.left;
    const localY = y - stageRect.top;
    return [...this.itemLayer.querySelectorAll('.nest-item')]
      .find((item) => {
        const itemX = parseFloat(item.style.left);
        const itemY = parseFloat(item.style.top);
        return Math.hypot(localX - itemX, localY - itemY) < 62;
      });
  }

  handlePointer(type, event) {
    if (!this.isRunning) return;
    if (type === 'pointerdown') {
      event.preventDefault();
      this.stage.setPointerCapture?.(event.pointerId);
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      this.tryStartGrab();
      return;
    }

    if (type === 'pointermove') {
      if (!this.pointers.has(event.pointerId)) return;
      event.preventDefault();
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      this.updateGrabPosition();
      return;
    }

    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.releaseGrab(true);
  }

  tryStartGrab() {
    if (this.grab || this.pointers.size < 2) return;
    const points = [...this.pointers.values()];
    const midpoint = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
    const item = this.findItemAt(midpoint.x, midpoint.y);
    if (!item) return;

    const rect = this.stage.getBoundingClientRect();
    const currentX = parseFloat(item.style.left);
    const currentY = parseFloat(item.style.top);
    this.grab = { item, startX: currentX, startY: currentY, offsetX: currentX - (midpoint.x - rect.left), offsetY: currentY - (midpoint.y - rect.top) };
    item.classList.add('nest-item-grabbed');
    this.sourceNest.classList.add('nest-active');
    this.targetNest.classList.add('nest-ready');
    tapFeedback(this.platform?.audioManager, 'click');
    vibrate([20, 25]);
    this.instructionEl.textContent = 'Great! Keep pinching and carry it to the other nest!';
    this.platform?.audioManager?.speak?.('Got it! Carry the egg to the other nest.', 1.05);
  }

  updateGrabPosition() {
    if (!this.grab || this.pointers.size < 2) return;
    const points = [...this.pointers.values()];
    const midpoint = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
    const rect = this.stage.getBoundingClientRect();
    const x = clamp(midpoint.x - rect.left + this.grab.offsetX, 44, rect.width - 44);
    const y = clamp(midpoint.y - rect.top + this.grab.offsetY, 110, rect.height - 55);
    this.grab.item.style.left = `${x}px`;
    this.grab.item.style.top = `${y}px`;
    this.grab.item.style.setProperty('--lift', `${Math.max(0, this.grab.startY - y) / 20}px`);

    const targetRect = this.targetNest.getBoundingClientRect();
    const within = Math.hypot(midpoint.x - (targetRect.left + targetRect.width / 2), midpoint.y - (targetRect.top + targetRect.height * 0.55)) < Math.max(targetRect.width, targetRect.height) * 0.48;
    this.targetNest.classList.toggle('nest-target-hover', within);
  }

  releaseGrab(checkDrop) {
    if (!this.grab) return;
    const grab = this.grab;
    const item = grab.item;
    this.grab = null;
    item.classList.remove('nest-item-grabbed');
    this.sourceNest.classList.remove('nest-active');
    this.targetNest.classList.remove('nest-ready', 'nest-target-hover');

    if (!checkDrop) return;
    const targetRect = this.targetNest.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const itemCenter = { x: itemRect.left + itemRect.width / 2, y: itemRect.top + itemRect.height / 2 };
    const targetCenter = { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height * 0.55 };
    const dropped = Math.hypot(itemCenter.x - targetCenter.x, itemCenter.y - targetCenter.y) < Math.max(targetRect.width, targetRect.height) * 0.55;

    if (dropped) this.completeItem(item);
    else {
      item.style.left = `${grab.startX}px`;
      item.style.top = `${grab.startY}px`;
      this.instructionEl.textContent = 'Nice try! Pinch again and take it to the other nest.';
      this.platform?.audioManager?.playSound?.('error');
    }
  }

  completeItem(item) {
    this.itemsMoved += 1;
    this.score += 1;
    this.updateScore();
    item.classList.add('nest-item-placed');
    tapFeedback(this.platform?.audioManager, 'success');
    vibrate([20, 30, 45]);
    rewardFeedback(this.platform, 'Egg delivered!', '🥚');
    this.platform?.audioManager?.speak?.('Egg delivered! Great pinching!');

    setTimeout(() => item.remove(), 260);

    if (this.itemsMoved >= this.itemCount) {
      this.levelTransitionId = setTimeout(() => this.finishLevel(), 520);
    } else {
      this.instructionEl.textContent = `${this.itemCount - this.itemsMoved} more to go!`;
    }
  }

  finishLevel() {
    rewardFeedback(this.platform, `Level ${this.levelIndex + 1} complete!`, this.levelIndex >= LEVELS.length - 1 ? '🏆' : '🌟');
    this.platform?.audioManager?.playSequence?.([523, 659, 784, 1047]);
    if (this.levelIndex < LEVELS.length - 1) {
      this.levelIndex += 1;
      this.buildLevel();
    } else {
      this.instructionEl.textContent = 'You finished every nest! Wonderful work!';
      this.platform?.audioManager?.speak?.('You finished every level. Wonderful work!');
      this.isRunning = false;
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  updateScore() { if (this.scoreEl) this.scoreEl.textContent = String(this.score); }

  updateTimer() {
    if (!this.timerEl) return;
    const safe = Math.max(0, Math.floor(this.remainingSeconds));
    this.timerEl.textContent = `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
  }
}
