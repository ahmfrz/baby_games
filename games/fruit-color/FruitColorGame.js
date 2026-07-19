import { GameModule } from '../../core/GameModule.js';

const FILL_STEP = 7;         // progress gained per pointermove sample while scrubbing a region
const COMPLETE_THRESHOLD = 96;

export class FruitColorGame extends GameModule {
  static metadata = {
    id: 'fruit-color',
    name: '🍎 Fruit Coloring',
    description: 'Rub your finger on the fruit to color it in — colors are fixed so it always looks right.',
    version: '1.0.0',
    author: 'Baby Games',
    assetPath: 'games/fruit-color/assets/'
  };

  constructor(platform) {
    super(platform);

    this.root = null;
    this.elements = {};
    this.fruits = [];
    this.currentFruit = null;
    this.regionProgress = new Map();
    this.regionElements = new Map();
    this.isRunning = false;
    this.isDrawing = false;
    this.activePointerId = null;
    this.remainingSeconds = 0;
    this.timerId = null;
    this.pendingTimeouts = new Set();
  }

  async initialize() {
    await this.loadGameData();
    this.mountUI();
  }

  start() {
    this.isRunning = true;
    this.currentFruit = null;
    this.remainingSeconds = this.timerService?.getDuration?.() ?? 300;

    this.hideBlocker();
    this.updateTimer();
    this.showLibrary();
    this.startTimer();
  }

  pause() {
    this.isRunning = false;
    this.clearTimer();
  }

  resume() {
    if (this.remainingSeconds <= 0 || this.isBlocked()) return;
    this.isRunning = true;
    this.startTimer();
  }

  stop() {
    this.isRunning = false;
    this.clearTimer();
    this.clearPendingTimeouts();
    this.endDrawing();
  }

  reset() {
    this.stop();
    this.start();
  }

  cleanup() {
    this.stop();
    this.root?.remove();
    this.root = null;
    this.elements = {};
  }

  // ============================================
  // Data loading
  // ============================================

  async loadGameData() {
    const manifest = await this.fetchManifest();
    this.fruits = (manifest.fruits || []).filter((fruit) => fruit?.id && fruit?.file);
  }

  async fetchManifest() {
    try {
      const response = await fetch(`${FruitColorGame.metadata.assetPath}manifest.json`);
      if (!response.ok) throw new Error(`Manifest failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('[FruitColorGame] Could not load fruit manifest.', error);
      return { fruits: [] };
    }
  }

  resolveSvg(file) {
    return `${FruitColorGame.metadata.assetPath}svg/${file}`;
  }

  // ============================================
  // UI construction
  // ============================================

  mountUI() {
    if (this.root?.isConnected) return;

    const host = this.getGameContainerEl();
    const root = document.createElement('section');
    root.id = 'fruit-color-game';
    root.className = 'fruit-game';
    root.setAttribute('aria-label', 'Fruit coloring');

    root.append(
      this.createHeader(),
      this.createLibrary(),
      this.createCanvasScreen(),
      this.createBlocker()
    );

    host?.appendChild(root);
    this.root = root;
  }

  createHeader() {
    const header = document.createElement('header');
    header.className = 'fruit-header';

    const brand = document.createElement('div');
    brand.className = 'fruit-brand';
    brand.innerHTML = '<span class="brand-mark">🍓</span><span class="brand-label">Fruit Coloring</span>';

    const status = document.createElement('div');
    status.className = 'fruit-status';

    const timer = document.createElement('div');
    timer.className = 'status-pill timer-pill';
    timer.innerHTML = '<span class="status-icon">⏱</span><strong>0:00</strong>';

    const parentButton = document.createElement('button');
    parentButton.type = 'button';
    parentButton.className = 'parent-button';
    parentButton.textContent = 'Parent';
    parentButton.addEventListener('click', () => this.showPinBlocker('exit'));

    status.append(timer, parentButton);
    header.append(brand, status);

    this.elements.timer = timer.querySelector('strong');
    return header;
  }

  createLibrary() {
    const library = document.createElement('main');
    library.className = 'fruit-library';

    const heading = document.createElement('h2');
    heading.className = 'library-heading';
    heading.textContent = 'Pick a fruit';

    const grid = document.createElement('div');
    grid.className = 'fruit-grid';

    const empty = document.createElement('p');
    empty.className = 'library-empty hidden';
    empty.textContent = 'No fruits yet — add some to assets/manifest.json!';

    library.append(heading, grid, empty);

    this.elements.library = library;
    this.elements.fruitGrid = grid;
    this.elements.libraryEmpty = empty;

    return library;
  }

  renderLibrary() {
    const grid = this.elements.fruitGrid;
    grid.innerHTML = '';
    this.elements.libraryEmpty.classList.toggle('hidden', this.fruits.length > 0);

    this.fruits.forEach((fruit) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'fruit-card';
      card.setAttribute('aria-label', `Color the ${fruit.name}`);

      const thumb = document.createElement('img');
      thumb.className = 'fruit-thumb';
      thumb.alt = fruit.name || 'Fruit';
      thumb.loading = 'lazy';
      thumb.src = this.resolveSvg(fruit.file);

      const label = document.createElement('span');
      label.className = 'fruit-label';
      label.textContent = fruit.name || 'Fruit';

      card.append(thumb, label);
      card.addEventListener('click', () => this.openFruit(fruit));
      grid.appendChild(card);
    });
  }

  createCanvasScreen() {
    const screen = document.createElement('main');
    screen.className = 'fruit-canvas-screen hidden';

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'canvas-back';
    backButton.textContent = '← Fruits';
    backButton.addEventListener('click', () => this.showLibrary());

    const stage = document.createElement('div');
    stage.className = 'fruit-stage';

    const celebration = document.createElement('div');
    celebration.className = 'fruit-celebration hidden';
    celebration.innerHTML = `
      <div class="celebration-burst">🎉</div>
      <div class="celebration-text">Great job!</div>
      <div class="celebration-actions">
        <button type="button" class="celebration-again">Color again</button>
        <button type="button" class="celebration-next">Next fruit</button>
      </div>
    `;
    stage.appendChild(celebration);

    const footer = document.createElement('div');
    footer.className = 'canvas-footer';

    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.className = 'reset-button';
    resetButton.textContent = '↺ Start over';
    resetButton.addEventListener('click', () => this.resetCurrentFruit());

    footer.appendChild(resetButton);
    screen.append(backButton, stage, footer);

    celebration.querySelector('.celebration-again').addEventListener('click', () => this.resetCurrentFruit());
    celebration.querySelector('.celebration-next').addEventListener('click', () => this.openNextFruit());

    this.elements.canvasScreen = screen;
    this.elements.stage = stage;
    this.elements.celebration = celebration;

    return screen;
  }

  createBlocker() {
    const blocker = document.createElement('div');
    blocker.className = 'session-blocker hidden';
    blocker.setAttribute('role', 'dialog');
    blocker.setAttribute('aria-modal', 'true');
    blocker.innerHTML = `
      <div class="blocker-card">
        <div class="blocker-burst" aria-hidden="true">🍎</div>
        <h2 class="blocker-title">Coloring time is over</h2>
        <label class="pin-label" for="fruitPinInput">Parent PIN</label>
        <input id="fruitPinInput" class="pin-entry" type="password" maxlength="4" inputmode="numeric" autocomplete="off">
        <p class="pin-error" aria-live="polite"></p>
        <button type="button" class="unlock-button">Unlock</button>
      </div>
    `;

    const input = blocker.querySelector('.pin-entry');
    const unlock = blocker.querySelector('.unlock-button');
    const submit = () => this.handlePinSubmit();

    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '');
      this.elements.pinError.textContent = '';
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submit();
    });
    unlock.addEventListener('click', submit);

    this.elements.blocker = blocker;
    this.elements.blockerTitle = blocker.querySelector('.blocker-title');
    this.elements.pinInput = input;
    this.elements.pinError = blocker.querySelector('.pin-error');

    return blocker;
  }

  // ============================================
  // Library / canvas flow
  // ============================================

  showLibrary() {
    this.endDrawing();
    this.currentFruit = null;
    this.elements.canvasScreen.classList.add('hidden');
    this.elements.library.classList.remove('hidden');
    this.renderLibrary();
  }

  async openFruit(fruit) {
    this.currentFruit = fruit;
    this.elements.library.classList.add('hidden');
    this.elements.canvasScreen.classList.remove('hidden');
    this.elements.celebration.classList.add('hidden');
    await this.loadFruitSvg(fruit);
  }

  openNextFruit() {
    const index = this.fruits.findIndex((f) => f.id === this.currentFruit?.id);
    const next = this.fruits[(index + 1) % this.fruits.length];
    if (next) this.openFruit(next);
    else this.showLibrary();
  }

  async loadFruitSvg(fruit) {
    this.regionProgress.clear();
    this.regionElements.clear();

    const stage = this.elements.stage;
    stage.querySelector('svg')?.remove();

    try {
      const response = await fetch(this.resolveSvg(fruit.file));
      const svgText = await response.text();
      const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
      const svg = doc.documentElement;
      svg.classList.add('fruit-svg');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', fruit.name || 'Fruit to color');

      stage.insertBefore(svg, this.elements.celebration);
      this.wireRegions(svg);
      this.bindPointerEvents(svg);
    } catch (error) {
      console.warn('[FruitColorGame] Could not load fruit artwork.', error);
    }
  }

  wireRegions(svg) {
    const regionNodes = svg.querySelectorAll('.fruit-region');
    regionNodes.forEach((node) => {
      const regionId = node.dataset.regionId;
      if (!regionId) return;
      if (!this.regionElements.has(regionId)) {
        this.regionElements.set(regionId, []);
        this.regionProgress.set(regionId, 0);
      }
      this.regionElements.get(regionId).push(node);
    });

    // Normalize the resting appearance regardless of whatever raw `fill`
    // value the SVG file happens to have authored — this is what lets new
    // fruit art skip hand-tuning a pale starting color per region.
    this.regionElements.forEach((_, regionId) => this.paintRegion(regionId, 0));
  }

  // ============================================
  // Pointer / rub-to-fill interaction
  // ============================================

  bindPointerEvents(svg) {
    svg.style.touchAction = 'none';

    svg.addEventListener('pointerdown', (event) => {
      if (!this.isRunning || this.isBlocked()) return;
      this.isDrawing = true;
      this.activePointerId = event.pointerId;
      svg.setPointerCapture?.(event.pointerId);
      this.applyAtPoint(event.clientX, event.clientY);
      event.preventDefault();
    });

    svg.addEventListener('pointermove', (event) => {
      if (!this.isDrawing || event.pointerId !== this.activePointerId) return;
      this.applyAtPoint(event.clientX, event.clientY);
      event.preventDefault();
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => {
      svg.addEventListener(type, (event) => {
        if (event.pointerId === this.activePointerId) this.endDrawing();
      });
    });
  }

  endDrawing() {
    this.isDrawing = false;
    this.activePointerId = null;
  }

  applyAtPoint(clientX, clientY) {
    const target = document.elementFromPoint(clientX, clientY);
    const regionId = target?.dataset?.regionId;
    if (!regionId || !this.regionElements.has(regionId)) return;

    const current = this.regionProgress.get(regionId) || 0;
    const next = Math.min(100, current + FILL_STEP);
    this.regionProgress.set(regionId, next);
    this.paintRegion(regionId, next);
    this.checkCompletion();
  }

  paintRegion(regionId, progress) {
    const elementsForRegion = this.regionElements.get(regionId);
    if (!elementsForRegion?.length) return;

    const targetHex = elementsForRegion[0].dataset.targetColor;
    const color = this.interpolateColor(targetHex, progress / 100);
    elementsForRegion.forEach((el) => {
      el.style.fill = color;
    });
  }

  interpolateColor(targetHex, t) {
    const target = this.hexToRgb(targetHex);
    const base = { r: 255 * 0.82 + target.r * 0.18, g: 255 * 0.82 + target.g * 0.18, b: 255 * 0.82 + target.b * 0.18 };
    const r = base.r + (target.r - base.r) * t;
    const g = base.g + (target.g - base.g) * t;
    const b = base.b + (target.b - base.b) * t;
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }

  hexToRgb(hex) {
    const value = hex.replace('#', '');
    return {
      r: parseInt(value.substring(0, 2), 16),
      g: parseInt(value.substring(2, 4), 16),
      b: parseInt(value.substring(4, 6), 16)
    };
  }

  checkCompletion() {
    const progressValues = Array.from(this.regionProgress.values());
    if (!progressValues.length) return;
    const allDone = progressValues.every((value) => value >= COMPLETE_THRESHOLD);
    if (allDone) this.celebrate();
  }

  celebrate() {
    if (!this.elements.celebration.classList.contains('hidden')) return;
    this.endDrawing();
    this.elements.celebration.classList.remove('hidden');
    this.speak(`Great job! You colored the ${this.currentFruit?.name || 'fruit'}!`);
  }

  resetCurrentFruit() {
    if (!this.currentFruit) return;
    this.elements.celebration.classList.add('hidden');
    this.regionProgress.forEach((_, regionId) => {
      this.regionProgress.set(regionId, 0);
      this.paintRegion(regionId, 0);
    });
  }

  speak(text) {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  }

  // ============================================
  // Session timer + parent PIN blocker
  // ============================================

  updateTimer() {
    if (!this.elements.timer) return;
    const clamped = Math.max(0, this.remainingSeconds);
    const minutes = Math.floor(clamped / 60);
    const seconds = String(clamped % 60).padStart(2, '0');
    this.elements.timer.textContent = `${minutes}:${seconds}`;
  }

  startTimer() {
    this.clearTimer();
    this.timerId = setInterval(() => {
      this.remainingSeconds -= 1;
      this.updateTimer();
      if (this.remainingSeconds <= 0) this.endSession();
    }, 1000);
  }

  clearTimer() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  endSession() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.clearTimer();
    this.clearPendingTimeouts();
    this.endDrawing();
    this.showPinBlocker('sessionEnd');
  }

  showPinBlocker(mode) {
    this.elements.blockerTitle.textContent =
      mode === 'exit' ? 'Parent unlock' : 'Coloring time is over';

    this.elements.pinError.textContent = '';
    this.elements.pinInput.value = '';
    this.elements.blocker.classList.remove('hidden');
    this.elements.pinInput.focus({ preventScroll: true });
  }

  hideBlocker() {
    this.elements.blocker?.classList.add('hidden');
  }

  isBlocked() {
    return !!this.elements.blocker && !this.elements.blocker.classList.contains('hidden');
  }

  handlePinSubmit() {
    const pin = this.elements.pinInput.value;
    if (!this.timerService?.checkResetPin?.(pin)) {
      this.elements.pinError.textContent = 'Incorrect PIN';
      this.elements.pinInput.value = '';
      return;
    }
    this.hideBlocker();
    this.exitToTimerSetup();
  }

  async exitToTimerSetup() {
    this.cleanup();

    const gameContainer = this.getGameContainerEl();
    const launcher = document.getElementById('launcher');
    if (gameContainer) gameContainer.style.display = 'none';
    if (launcher) launcher.style.display = 'none';
    if (this.platform) this.platform.currentGame = null;

    await this.platform?.showTimerUI?.();
  }

  setManagedTimeout(callback, delay) {
    const id = setTimeout(() => {
      this.pendingTimeouts.delete(id);
      callback();
    }, delay);
    this.pendingTimeouts.add(id);
  }

  clearPendingTimeouts() {
    this.pendingTimeouts.forEach((id) => clearTimeout(id));
    this.pendingTimeouts.clear();
  }
}
