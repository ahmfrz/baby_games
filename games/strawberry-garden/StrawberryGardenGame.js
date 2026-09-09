import { GameModule } from '../../core/GameModule.js';
import { rewardFeedback, tapFeedback } from '../../services/FeedbackService.js';

export const STRAWBERRY_SCENES = [
  { id: 'find', title: 'Find the strawberry', prompt: 'Where is the strawberry?', kind: 'find' },
  { id: 'pick', title: 'Pick the strawberry', prompt: 'Pick the strawberry!', kind: 'pick' },
  { id: 'basket', title: 'Fill the basket', prompt: 'Put the strawberries in the basket.', kind: 'basket' },
  { id: 'wash', title: 'Wash the strawberry', prompt: 'Wash the strawberry!', kind: 'wash' },
  { id: 'shake', title: 'Make a strawberry shake', prompt: "Let's make a strawberry shake!", kind: 'shake' },
  { id: 'decorate', title: 'Decorate', prompt: 'Put strawberries on the treat!', kind: 'decorate' },
  { id: 'free', title: 'Free play', prompt: 'Play in the strawberry garden!', kind: 'free' }
];

export const STRAWBERRY_COLORS = [
  { name: 'Strawberry', value: '#F53D55' },
  { name: 'Sunshine', value: '#FFD447' },
  { name: 'Berry', value: '#A855F7' },
  { name: 'Ocean', value: '#23A8F2' },
  { name: 'Mint', value: '#2DD4BF' },
  { name: 'Orange', value: '#FF8A3D' },
  { name: 'Leaf', value: '#54C84C' }
];

export const TARGET_COUNTS = [1, 2, 3];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function strawberrySvg({ face = 'happy', size = 120, className = '', interactive = false } = {}) {
  const eyes = face === 'surprised'
    ? '<circle cx="64" cy="67" r="5" fill="#4b2b31"/><circle cx="96" cy="67" r="5" fill="#4b2b31"/>'
    : '<path d="M58 67 Q64 73 70 67" fill="none" stroke="#4b2b31" stroke-width="4" stroke-linecap="round"/><path d="M90 67 Q96 73 102 67" fill="none" stroke="#4b2b31" stroke-width="4" stroke-linecap="round"/>';
  const mouth = face === 'sleepy'
    ? '<path d="M76 83 Q82 87 88 83" fill="none" stroke="#4b2b31" stroke-width="4" stroke-linecap="round"/>'
    : face === 'surprised'
      ? '<circle cx="80" cy="85" r="6" fill="#4b2b31"/>'
      : '<path d="M72 83 Q80 93 88 83" fill="none" stroke="#4b2b31" stroke-width="4" stroke-linecap="round"/>';
  return `
    <svg class="sg-strawberry ${className}" width="${size}" height="${size}" viewBox="0 0 160 160" role="img" aria-label="Strawberry" ${interactive ? 'data-strawberry-interactive="true"' : ''}>
      <defs>
        <linearGradient id="sgBerry" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ff6676"/><stop offset="1" stop-color="#e51f40"/>
        </linearGradient>
        <filter id="sgGlow"><feGaussianBlur stdDeviation="2.5"/></filter>
      </defs>
      <g class="sg-strawberry-body">
        <path d="M80 34 C53 24 27 44 31 75 C35 108 59 135 80 144 C101 135 125 108 129 75 C133 44 107 24 80 34Z" fill="url(#sgBerry)"/>
        <path d="M54 35 C63 20 72 16 80 26 C88 16 97 20 106 35 C96 31 89 34 80 42 C71 34 64 31 54 35Z" fill="#54c84c"/>
        <g fill="#ffe8b3">
          <ellipse cx="54" cy="57" rx="3.3" ry="6"/><ellipse cx="80" cy="51" rx="3.3" ry="6"/><ellipse cx="106" cy="57" rx="3.3" ry="6"/>
          <ellipse cx="46" cy="81" rx="3.3" ry="6"/><ellipse cx="68" cy="77" rx="3.3" ry="6"/><ellipse cx="92" cy="77" rx="3.3" ry="6"/><ellipse cx="114" cy="81" rx="3.3" ry="6"/>
          <ellipse cx="57" cy="105" rx="3.3" ry="6"/><ellipse cx="80" cy="101" rx="3.3" ry="6"/><ellipse cx="103" cy="105" rx="3.3" ry="6"/>
        </g>
        ${eyes}${mouth}
      </g>
    </svg>`;
}

export class StrawberryGardenGame extends GameModule {
  static metadata = {
    id: 'strawberry-garden',
    name: '🍓 Strawberry Garden',
    description: 'Find, pick, wash, mix, decorate, and play with a friendly strawberry.',
    version: '1.0.0',
    author: 'Baby Games',
    assetPath: 'games/strawberry-garden/'
  };

  constructor(platform) {
    super(platform);
    this.root = null;
    this.sessionRunning = false;
    this.sceneIndex = 0;
    this.targetCount = 1;
    this.placedCount = 0;
    this.washProgress = 0;
    this.shakeMixed = false;
    this.decorationCount = 0;
    this.usedBasketItems = new Set();
    this.usedDecorItems = new Set();
    this.drag = null;
    this.pendingTimeouts = new Set();
    this.bound = {};
    this.color = STRAWBERRY_COLORS[0].value;
  }

  async initialize() {
    await this.audioManager?.initialize?.();
    this.mountUI();
  }

  start() {
    this.sessionRunning = true;
    this.resetState();
    this.renderScene();
    this.announceCurrent();
  }

  pause() {
    this.sessionRunning = false;
    this.cancelDrag();
  }

  resume() {
    if (this.platform?.timerService?.hasActiveSession?.() === false) return;
    this.sessionRunning = true;
  }

  stop() {
    this.sessionRunning = false;
    this.cancelDrag();
    this.pendingTimeouts.forEach((id) => clearTimeout(id));
    this.pendingTimeouts.clear();
    this.audioManager?.stopSpeaking?.();
  }

  reset() {
    this.stop();
    this.start();
  }

  cleanup() {
    this.stop();
    this.root?.remove();
    this.root = null;
  }

  resetState() {
    this.sceneIndex = 0;
    this.targetCount = TARGET_COUNTS[Math.floor(Math.random() * TARGET_COUNTS.length)];
    this.placedCount = 0;
    this.washProgress = 0;
    this.shakeMixed = false;
    this.decorationCount = 0;
  }

  get scene() {
    return STRAWBERRY_SCENES[this.sceneIndex];
  }

  mountUI() {
    if (this.root?.isConnected) return;
    const host = this.getGameContainerEl();
    if (!host) throw new Error('Strawberry Garden game container is unavailable.');

    const root = document.createElement('section');
    root.id = 'strawberry-garden-game';
    root.className = 'strawberry-game';
    root.innerHTML = `
      <header class="sg-header">
        <div class="sg-brand"><span class="sg-brand-icon">🍓</span><div><div class="sg-kicker">PLAY & LEARN</div><h1>Strawberry Garden</h1></div></div>
        <div class="sg-progress" data-sg-progress>1 / ${STRAWBERRY_SCENES.length - 1}</div>
      </header>
      <main class="sg-main">
        <section class="sg-card sg-scene" data-sg-scene aria-live="polite"></section>
        <div class="sg-prompt" data-sg-prompt></div>
      </main>
    `;
    host.appendChild(root);
    this.root = root;
    root.addEventListener('click', (event) => this.onClick(event));
    root.addEventListener('pointerdown', (event) => this.onPointerDown(event), { passive: false });
    root.addEventListener('pointermove', (event) => this.onPointerMove(event), { passive: false });
    root.addEventListener('pointerup', (event) => this.onPointerUp(event));
    root.addEventListener('pointercancel', () => this.cancelDrag());
  }

  renderScene() {
    if (!this.root) return;
    const sceneEl = this.root.querySelector('[data-sg-scene]');
    const promptEl = this.root.querySelector('[data-sg-prompt]');
    sceneEl.innerHTML = this.sceneMarkup();
    promptEl.textContent = this.scene.prompt;
    const progress = this.root.querySelector('[data-sg-progress]');
    progress.textContent = this.scene.kind === 'free' ? 'FREE PLAY' : `${this.sceneIndex + 1} / ${STRAWBERRY_SCENES.length - 1}`;
  }

  sceneMarkup() {
    switch (this.scene.kind) {
      case 'find': return `
        <div class="sg-garden-scene">
          <div class="sg-sun">☀️</div><div class="sg-cloud c1">☁️</div><div class="sg-cloud c2">☁️</div>
          <div class="sg-plant p1">🌿</div><div class="sg-plant p2">🌿</div><div class="sg-flower">🌼</div>
          <button type="button" class="sg-hidden-strawberry" data-action="find-strawberry" aria-label="Find strawberry">${strawberrySvg({ face: 'surprised', size: 128, interactive: true })}</button>
          <button type="button" class="sg-dummy-object flower-btn" aria-label="Flower">🌻</button>
          <button type="button" class="sg-dummy-object apple-btn" aria-label="Apple">🍎</button>
        </div>`;
      case 'pick': return `
        <div class="sg-plant-scene">
          <div class="sg-big-plant">🌿</div>
          <button type="button" class="sg-hanging-strawberry" data-action="pick-strawberry" aria-label="Pick strawberry">${strawberrySvg({ face: 'happy', size: 160, interactive: true })}</button>
          <div class="sg-basket empty" data-sg-basket>🧺</div>
        </div>`;
      case 'basket': return `
        <div class="sg-basket-scene">
          <div class="sg-counter">${Array.from({ length: this.targetCount }, (_, i) => this.usedBasketItems.has(i) ? '' : `<div class="sg-drag-strawberry" data-item-index="${i}" data-drag-kind="basket" aria-label="Strawberry ${i + 1}">${strawberrySvg({ face: 'happy', size: 110, interactive: true })}</div>`).join('')}</div>
          <div class="sg-basket-target" data-drop-target="basket" aria-label="Basket">🧺<span>${this.placedCount}/${this.targetCount}</span></div>
        </div>`;
      case 'wash': return `
        <div class="sg-wash-scene">
          <div class="sg-tap">🚰</div><div class="sg-water-stream"></div>
          <div class="sg-wash-pad" data-wash-target>${strawberrySvg({ face: this.washProgress > 55 ? 'happy' : 'surprised', size: 190, interactive: true })}</div>
          <div class="sg-bubbles">${this.washProgress > 20 ? '🫧 🫧 🫧' : ''}</div>
          <div class="sg-wash-meter"><span style="width:${clamp(this.washProgress, 0, 100)}%"></span></div>
        </div>`;
      case 'shake': return `
        <div class="sg-shake-scene">
          <div class="sg-ingredient" data-drag-kind="shake">${strawberrySvg({ face: 'happy', size: 125, interactive: true })}<span>strawberry</span></div>
          <div class="sg-ingredient milk">🥛<span>milk</span></div>
          <div class="sg-blender" data-drop-target="blender"><div class="sg-blender-lid">🥤</div><div class="sg-blender-fill"></div></div>
          <button type="button" class="sg-big-button" data-action="blend">${this.shakeMixed ? 'Made it! 🍓' : 'BLEND!'}</button>
        </div>`;
      case 'decorate': return `
        <div class="sg-decorate-scene">
          <div class="sg-treat">🍰<div class="sg-toppings" data-drop-target="treat"></div></div>
          <div class="sg-decor-items">
            ${Array.from({ length: 3 }, (_, i) => this.usedDecorItems.has(i) ? '' : `<div class="sg-decor-strawberry" data-drag-kind="decorate" data-item-index="${i}">${strawberrySvg({ face: 'happy', size: 86, interactive: true })}</div>`).join('')}
          </div>
          <div class="sg-decor-count">🍓 ${this.decorationCount}</div>
          ${this.decorationCount >= 3 ? '<div class="sg-celebrate">You did it! 🎉</div>' : ''}
        </div>`;
      case 'free': return `
        <div class="sg-free-scene">
          <div class="sg-free-sky">☀️ ☁️</div>
          <div class="sg-free-garden"><span class="free-flower">🌼</span><span class="free-flower f2">🌷</span><span class="free-butterfly">🦋</span></div>
          <div class="sg-free-strawberries" data-free-area>
            <button class="sg-free-strawberry f1" data-free-strawberry>${strawberrySvg({ face: 'happy', size: 110, interactive: true })}</button>
            <button class="sg-free-strawberry f2" data-free-strawberry>${strawberrySvg({ face: 'happy', size: 96, interactive: true })}</button>
            <button class="sg-free-strawberry f3" data-free-strawberry>${strawberrySvg({ face: 'happy', size: 86, interactive: true })}</button>
          </div>
          <div class="sg-free-palette">${STRAWBERRY_COLORS.map((c) => `<button type="button" class="sg-color" data-color="${c.value}" style="--sg-color:${c.value}" aria-label="${c.name}"></button>`).join('')}</div>
          <button type="button" class="sg-play-again" data-action="restart">🍓 Play again</button>
        </div>`;
      default: return '';
    }
  }

  onClick(event) {
    const actionEl = event.target.closest?.('[data-action]');
    if (actionEl) {
      const action = actionEl.dataset.action;
      if (action === 'find-strawberry') this.completeScene('Strawberry!');
      if (action === 'pick-strawberry') this.pickStrawberry();
      if (action === 'blend') this.blendShake();
      if (action === 'restart') this.reset();
      return;
    }
    const color = event.target.closest?.('[data-color]')?.dataset.color;
    if (color) {
      this.color = color;
      this.announce('Color picked!');
      this.root.querySelectorAll('.sg-color').forEach((btn) => btn.classList.toggle('selected', btn.dataset.color === color));
    }
    if (event.target.closest?.('[data-free-strawberry]')) this.pulseElement(event.target.closest('[data-free-strawberry]'));
  }

  onPointerDown(event) {
    if (!this.sessionRunning) return;
    const wash = event.target.closest?.('[data-wash-target]');
    const dragItem = event.target.closest?.('[data-drag-kind]');
    if (wash && this.scene.kind === 'wash') {
      event.preventDefault();
      this.wash(event);
      return;
    }
    if (dragItem && ['basket', 'decorate', 'shake'].includes(dragItem.dataset.dragKind)) {
      event.preventDefault();
      this.startDrag(event, dragItem);
    }
  }

  onPointerMove(event) {
    if (!this.sessionRunning) return;
    if (this.scene.kind === 'wash' && (event.buttons & 1 || event.pointerType === 'touch')) {
      if (event.target.closest?.('[data-wash-target]') || this.root.querySelector('[data-wash-target]')) this.wash(event);
    }
    if (this.drag) {
      event.preventDefault();
      this.moveDrag(event);
    }
  }

  onPointerUp() {
    if (this.drag) this.finishDrag();
  }

  startDrag(event, source) {
    this.drag = { pointerId: event.pointerId, source, kind: source.dataset.dragKind, ghost: source.cloneNode(true) };
    this.drag.ghost.classList.add('sg-drag-ghost');
    document.body.appendChild(this.drag.ghost);
    source.style.opacity = '0.35';
    this.moveDrag(event);
  }

  moveDrag(event) {
    if (!this.drag) return;
    const rect = this.drag.ghost.getBoundingClientRect();
    this.drag.ghost.style.left = `${event.clientX - rect.width / 2 + window.scrollX}px`;
    this.drag.ghost.style.top = `${event.clientY - rect.height / 2 + window.scrollY}px`;
  }

  finishDrag() {
    if (!this.drag) return;
    const { source, kind, ghost } = this.drag;
    const pointerRect = ghost.getBoundingClientRect();
    ghost.remove();
    source.style.opacity = '';
    const targetSelector = kind === 'basket' ? '[data-drop-target="basket"]' : kind === 'shake' ? '[data-drop-target="blender"]' : '[data-drop-target="treat"]';
    const target = this.root.querySelector(targetSelector);
    if (target) {
      const t = target.getBoundingClientRect();
      const centerX = pointerRect.left + pointerRect.width / 2;
      const centerY = pointerRect.top + pointerRect.height / 2;
      const hit = centerX >= t.left - 70 && centerX <= t.right + 70 && centerY >= t.top - 70 && centerY <= t.bottom + 70;
      if (hit) {
        const itemIndex = Number(source.dataset.itemIndex);
        if (kind === 'basket') { this.usedBasketItems.add(itemIndex); this.placedCount += 1; }
        if (kind === 'decorate') { this.usedDecorItems.add(itemIndex); this.decorationCount += 1; }
        if (kind === 'shake') this.shakeMixed = true;
        tapFeedback(this.audioManager, 'success');
        this.drag = null;
        if ((kind === 'basket' && this.placedCount >= this.targetCount) || (kind === 'decorate' && this.decorationCount >= 3) || kind === 'shake') {
          this.completeScene(kind === 'basket' ? 'All in the basket!' : kind === 'decorate' ? 'So pretty!' : 'Ready to blend!');
          return;
        }
        this.renderScene();
      }
    }
    this.drag = null;
  }

  cancelDrag() {
    if (!this.drag) return;
    this.drag.ghost?.remove();
    this.drag.source.style.opacity = '';
    this.drag = null;
  }

  wash(event) {
    const target = this.root.querySelector('[data-wash-target]');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    if (x < -0.2 || x > 1.2 || y < -0.2 || y > 1.2) return;
    this.washProgress = clamp(this.washProgress + 1.8, 0, 100);
    if (this.washProgress >= 80) {
      this.completeScene('All clean!');
    } else {
      this.renderScene();
    }
  }

  pickStrawberry() {
    if (this.scene.kind !== 'pick') return;
    const berry = this.root.querySelector('.sg-hanging-strawberry');
    if (!berry || berry.dataset.done === 'true') return;
    berry.dataset.done = 'true';
    berry.classList.add('picked');
    const timer = setTimeout(() => this.completeScene('Got it!'), 550);
    this.pendingTimeouts.add(timer);
  }

  blendShake() {
    if (this.scene.kind !== 'shake' || !this.shakeMixed || this.root.querySelector('.sg-big-button')?.disabled) return;
    const button = this.root.querySelector('.sg-big-button');
    button.disabled = true;
    this.root.querySelector('.sg-blender')?.classList.add('blending');
    const timer = setTimeout(() => this.completeScene('Strawberry shake!'), 800);
    this.pendingTimeouts.add(timer);
  }

  completeScene(message) {
    if (!this.sessionRunning || this.scene.kind === 'free' || this.root?.dataset.completing === 'true') return;
    this.root.dataset.completing = 'true';
    rewardFeedback(this.platform, message, '🍓');
    tapFeedback(this.audioManager, 'success');
    const timer = setTimeout(() => {
      this.pendingTimeouts.delete(timer);
      this.root.dataset.completing = 'false';
      this.sceneIndex += 1;
      if (this.sceneIndex >= STRAWBERRY_SCENES.length) this.sceneIndex = STRAWBERRY_SCENES.length - 1;
      this.renderScene();
      this.announceCurrent();
    }, 650);
    this.pendingTimeouts.add(timer);
  }

  pulseElement(element) {
    if (!element) return;
    element.classList.remove('pulse');
    void element.offsetWidth;
    element.classList.add('pulse');
  }

  announceCurrent() {
    if (!this.scene) return;
    this.announce(`${this.scene.prompt}`);
  }

  announce(text) {
    this.audioManager?.ensureRunning?.();
    this.audioManager?.speak?.(text, 0.88);
  }
}
