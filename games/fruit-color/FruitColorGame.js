import { GameModule } from '../../core/GameModule.js';

const CANVAS_SIZE = 400;
const BRUSH_RADIUS = 24;
const MIN_DAB_SPACING = 5;      // px in canvas space, avoids redundant dabs
const COVERAGE_CHECK_EVERY = 5; // dabs
const COMPLETE_THRESHOLD = 0.80; // 80% of a region's pixels painted

export class FruitColorGame extends GameModule {
  static metadata = {
    id: 'fruit-color',
    name: '🍎 Fruit Coloring',
    description: 'Rub your finger on the fruit to paint it — color appears where you touch, and only ever the right color.',
    version: '2.0.0',
    author: 'Baby Games',
    assetPath: 'games/fruit-color/assets/'
  };

  constructor(platform) {
    super(platform);

    this.root = null;
    this.elements = {};
    this.fruits = [];
    this.currentFruit = null;
    this.isRunning = false;
    this.remainingSeconds = 0;
    this.timerId = null;
    this.pendingTimeouts = new Set();

    // Per-fruit-session painting state
    this.regionMeta = new Map();     // id -> { maskData, maskCanvas, totalPixels, bbox, targetColor }
    this.paintCanvas = null;
    this.paintCtx = null;
    this.scratchCanvas = null;
    this.scratchCtx = null;
    this.isDrawing = false;
    this.activePointerId = null;
    this.lastDabPoint = null;
    this.dabsSinceCheck = 0;
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
    this.fruits = (manifest.fruits || []).filter((fruit) => fruit?.id && fruit?.outline && fruit?.regionMap);
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

  resolveAsset(relativePath) {
    return `${FruitColorGame.metadata.assetPath}${relativePath}`;
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
      thumb.src = this.resolveAsset(fruit.outline);

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

    const paintCanvas = document.createElement('canvas');
    paintCanvas.className = 'fruit-paint-layer';
    paintCanvas.width = CANVAS_SIZE;
    paintCanvas.height = CANVAS_SIZE;

    const outlineImg = document.createElement('img');
    outlineImg.className = 'fruit-outline-layer';
    outlineImg.alt = '';

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

    stage.append(paintCanvas, outlineImg, celebration);

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
    this.elements.paintCanvas = paintCanvas;
    this.elements.outlineImg = outlineImg;
    this.elements.celebration = celebration;

    this.paintCanvas = paintCanvas;
    this.paintCtx = paintCanvas.getContext('2d');

    this.scratchCanvas = document.createElement('canvas');
    this.scratchCanvas.width = CANVAS_SIZE;
    this.scratchCanvas.height = CANVAS_SIZE;
    this.scratchCtx = this.scratchCanvas.getContext('2d');

    this.bindPointerEvents(paintCanvas);

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
    this.elements.outlineImg.src = this.resolveAsset(fruit.outline);
    this.clearPaint();
    await this.loadRegionMasks(fruit);
  }

  openNextFruit() {
    const index = this.fruits.findIndex((f) => f.id === this.currentFruit?.id);
    const next = this.fruits[(index + 1) % this.fruits.length];
    if (next) this.openFruit(next);
    else this.showLibrary();
  }

  clearPaint() {
    this.paintCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }

  // ============================================
  // Region mask setup (runs once per fruit open)
  // ============================================

  async loadRegionMasks(fruit) {
    this.regionMeta.clear();

    const mapImg = await this.loadImage(this.resolveAsset(fruit.regionMap));
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = CANVAS_SIZE;
    sampleCanvas.height = CANVAS_SIZE;
    const sampleCtx = sampleCanvas.getContext('2d');
    sampleCtx.drawImage(mapImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const mapData = sampleCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;

    (fruit.regions || []).forEach((region) => {
      const target = this.hexToRgb(region.mapColor);
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = CANVAS_SIZE;
      maskCanvas.height = CANVAS_SIZE;
      const maskCtx = maskCanvas.getContext('2d');
      const maskImageData = maskCtx.createImageData(CANVAS_SIZE, CANVAS_SIZE);

      let totalPixels = 0;
      let minX = CANVAS_SIZE, minY = CANVAS_SIZE, maxX = 0, maxY = 0;

      for (let y = 0; y < CANVAS_SIZE; y += 1) {
        for (let x = 0; x < CANVAS_SIZE; x += 1) {
          const idx = (y * CANVAS_SIZE + x) * 4;
          const match = this.colorsClose(mapData, idx, target);
          if (match) {
            maskImageData.data[idx + 3] = 255;
            totalPixels += 1;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      maskCtx.putImageData(maskImageData, 0, 0);

      this.regionMeta.set(region.id, {
        mapColor: target,
        targetColor: region.targetColor,
        maskCanvas,
        maskData: maskImageData.data,
        totalPixels: Math.max(1, totalPixels),
        bbox: { minX, minY, maxX, maxY }
      });
    });

    this.mapSampleData = mapData;
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  colorsClose(data, idx, target, tolerance = 30) {
    return (
      Math.abs(data[idx] - target.r) <= tolerance &&
      Math.abs(data[idx + 1] - target.g) <= tolerance &&
      Math.abs(data[idx + 2] - target.b) <= tolerance
    );
  }

  hexToRgb(hex) {
    const value = hex.replace('#', '');
    return {
      r: parseInt(value.substring(0, 2), 16),
      g: parseInt(value.substring(2, 4), 16),
      b: parseInt(value.substring(4, 6), 16)
    };
  }

  // ============================================
  // Pointer / paint-where-you-touch interaction
  // ============================================

  bindPointerEvents(canvas) {
    canvas.style.touchAction = 'none';

    canvas.addEventListener('pointerdown', (event) => {
      if (!this.isRunning || this.isBlocked()) return;
      this.isDrawing = true;
      this.activePointerId = event.pointerId;
      this.lastDabPoint = null;
      canvas.setPointerCapture?.(event.pointerId);
      this.paintAtClientPoint(event.clientX, event.clientY);
      event.preventDefault();
    });

    canvas.addEventListener('pointermove', (event) => {
      if (!this.isDrawing || event.pointerId !== this.activePointerId) return;
      this.paintAtClientPoint(event.clientX, event.clientY);
      event.preventDefault();
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => {
      canvas.addEventListener(type, (event) => {
        if (event.pointerId === this.activePointerId) this.endDrawing();
      });
    });
  }

  endDrawing() {
    this.isDrawing = false;
    this.activePointerId = null;
    this.lastDabPoint = null;
  }

  paintAtClientPoint(clientX, clientY) {
    const rect = this.paintCanvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    if (this.lastDabPoint) {
      const dist = Math.hypot(x - this.lastDabPoint.x, y - this.lastDabPoint.y);
      if (dist < MIN_DAB_SPACING) return;
    }
    this.lastDabPoint = { x, y };

    const regionId = this.regionIdAt(x, y);
    if (!regionId) return;

    this.paintDab(regionId, x, y);

    this.dabsSinceCheck += 1;
    if (this.dabsSinceCheck >= COVERAGE_CHECK_EVERY) {
      this.dabsSinceCheck = 0;
      this.checkCompletion();
    }
  }

  regionIdAt(x, y) {
    const xi = Math.max(0, Math.min(CANVAS_SIZE - 1, Math.floor(x)));
    const yi = Math.max(0, Math.min(CANVAS_SIZE - 1, Math.floor(y)));
    const idx = (yi * CANVAS_SIZE + xi) * 4;
    for (const [regionId, meta] of this.regionMeta.entries()) {
      if (this.colorsClose(this.mapSampleData, idx, meta.mapColor)) return regionId;
    }
    return null;
  }

  paintDab(regionId, x, y) {
    const meta = this.regionMeta.get(regionId);
    if (!meta) return;

    const ctx = this.scratchCtx;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const rgb = this.hexToRawRgb(meta.targetColor);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, BRUSH_RADIUS);
    gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.95)`);
    gradient.addColorStop(0.7, `rgba(${rgb.r},${rgb.g},${rgb.b},0.9)`);
    gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(meta.maskCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    this.paintCtx.drawImage(this.scratchCanvas, 0, 0);
  }

  hexToRawRgb(hex) {
    const value = hex.replace('#', '');
    return {
      r: parseInt(value.substring(0, 2), 16),
      g: parseInt(value.substring(2, 4), 16),
      b: parseInt(value.substring(4, 6), 16)
    };
  }

  // ============================================
  // Completion check (real pixel coverage, not a heuristic counter)
  // ============================================

  checkCompletion() {
    if (!this.regionMeta.size) return;

    let totalRatio = 0;
    let allAbove = true;

    this.regionMeta.forEach((meta) => {
      const ratio = this.coverageRatio(meta);
      totalRatio += ratio;
      if (ratio < COMPLETE_THRESHOLD) allAbove = false;
    });

    if (allAbove) this.celebrate();
  }

  coverageRatio(meta) {
    const { minX, minY, maxX, maxY } = meta.bbox;
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    if (w <= 0 || h <= 0) return 1;

    const paintData = this.paintCtx.getImageData(minX, minY, w, h).data;
    let painted = 0;

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const localIdx = (y * w + x) * 4;
        const globalX = minX + x;
        const globalY = minY + y;
        const maskIdx = (globalY * CANVAS_SIZE + globalX) * 4;
        if (meta.maskData[maskIdx + 3] > 0 && paintData[localIdx + 3] > 40) {
          painted += 1;
        }
      }
    }

    return painted / meta.totalPixels;
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
    this.clearPaint();
    this.dabsSinceCheck = 0;
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
