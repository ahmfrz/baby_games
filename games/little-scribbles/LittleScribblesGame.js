import { GameModule } from '../../core/GameModule.js';
import { rewardFeedback, completionFeedback } from '../../services/FeedbackService.js';

const CRAYON_ART = new URL('../../assets/shared/art/education/crayon-pal.svg', import.meta.url).href;

const TRACE_STEPS = [
  { id: 'standing-line', name: 'Standing Line', hint: 'Draw down the line', type: 'polyline', points: [[0.5, 0.2], [0.5, 0.8]] },
  { id: 'sleeping-line', name: 'Sleeping Line', hint: 'Draw across the line', type: 'polyline', points: [[0.2, 0.5], [0.8, 0.5]] },
  { id: 'slanting-line-right', name: 'Slanting Line', hint: 'Draw from top to bottom', type: 'polyline', points: [[0.28, 0.23], [0.72, 0.77]] },
  { id: 'slanting-line-left', name: 'Other Slanting Line', hint: 'Draw the other way', type: 'polyline', points: [[0.72, 0.23], [0.28, 0.77]] },
  { id: 'zigzag', name: 'Zigzag', hint: 'Follow the bumpy path', type: 'polyline', points: [[0.2, 0.62], [0.34, 0.38], [0.48, 0.62], [0.62, 0.38], [0.8, 0.62]] },
  { id: 'curve', name: 'Curvy Line', hint: 'Make a gentle curve', type: 'bezier', points: [[0.2, 0.62], [0.35, 0.28], [0.7, 0.28], [0.8, 0.62]] },
  { id: 'circle', name: 'Circle', hint: 'Go all the way around', type: 'ellipse', cx: 0.5, cy: 0.5, rx: 0.28, ry: 0.28 },
  { id: 'square', name: 'Square', hint: 'Trace all four sides', type: 'polygon', points: [[0.27, 0.27], [0.73, 0.27], [0.73, 0.73], [0.27, 0.73], [0.27, 0.27]] },
  { id: 'rectangle', name: 'Rectangle', hint: 'Trace the long shape', type: 'polygon', points: [[0.19, 0.32], [0.81, 0.32], [0.81, 0.68], [0.19, 0.68], [0.19, 0.32]] },
  { id: 'triangle', name: 'Triangle', hint: 'Go around the three sides', type: 'polygon', points: [[0.5, 0.22], [0.77, 0.74], [0.23, 0.74], [0.5, 0.22]] },
  { id: 'oval', name: 'Oval', hint: 'Trace around the oval', type: 'ellipse', cx: 0.5, cy: 0.5, rx: 0.33, ry: 0.24 },
  { id: 'pentagon', name: 'Pentagon', hint: 'Five sides', type: 'regular-polygon', sides: 5, radiusX: 0.31, radiusY: 0.31, rotation: -Math.PI / 2 },
  { id: 'hexagon', name: 'Hexagon', hint: 'Six sides', type: 'regular-polygon', sides: 6, radiusX: 0.31, radiusY: 0.31, rotation: Math.PI / 6 },
  { id: 'star', name: 'Star', hint: 'Trace the star', type: 'star', points: 5, outer: 0.32, inner: 0.15, rotation: -Math.PI / 2 }
];

const COLORS = [
  { name: 'Sunshine', value: '#FFD43B' },
  { name: 'Bubblegum', value: '#FF5C8A' },
  { name: 'Berry', value: '#A855F7' },
  { name: 'Ocean', value: '#21A9F5' },
  { name: 'Mint', value: '#2DD4BF' },
  { name: 'Grass', value: '#63D44A' },
  { name: 'Orange', value: '#FF8A3D' }
];

const BRUSH_WIDTH = 12;
const TRACE_THRESHOLD = 0.28;
const TRACE_TOLERANCE = 58;

export { TRACE_STEPS, COLORS };

export class LittleScribblesGame extends GameModule {
  static metadata = {
    id: 'little-scribbles',
    name: '✏️ Little Scribbles',
    description: 'Trace friendly shapes, then make your own colorful drawings.',
    version: '1.0.1',
    author: 'Baby Games',
    assetPath: 'games/little-scribbles/'
  };

  constructor(platform) {
    super(platform);
    this.root = null;
    this.canvas = null;
    this.ctx = null;
    this.mode = 'trace';
    this.stepIndex = 0;
    this.currentStep = TRACE_STEPS[0];
    this.color = COLORS[0].value;
    this.drawing = [];
    this.isDrawing = false;
    this.traceSucceeded = false;
    this.sessionRunning = false;
    this.layout = { width: 1, height: 1, dpr: 1 };
    this.resizeObserver = null;
    this.bound = {};
  }

  async initialize() {
    await this.audioManager?.initialize?.();
    this.mountUI();
  }

  start() {
    this.sessionRunning = true;
    this.mode = 'trace';
    this.stepIndex = 0;
    this.currentStep = TRACE_STEPS[0];
    this.resetDrawing();
    this.render();
    this.announceStep();
  }

  pause() {
    this.sessionRunning = false;
    this.stopDrawing();
  }

  resume() {
    if (!this.platform?.timerService?.hasActiveSession?.()) return;
    this.sessionRunning = true;
    this.render();
  }

  stop() {
    this.sessionRunning = false;
    this.stopDrawing();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.audioManager?.stopSpeaking?.();
  }

  reset() {
    this.stepIndex = 0;
    this.mode = 'trace';
    this.currentStep = TRACE_STEPS[0];
    this.resetDrawing();
    this.render();
  }

  cleanup() {
    this.stop();
    this.root?.remove();
    this.root = null;
    this.canvas = null;
    this.ctx = null;
  }

  mountUI() {
    if (this.root?.isConnected) return;
    const host = this.getGameContainerEl();
    if (!host) throw new Error('Little Scribbles game container is unavailable.');

    const root = document.createElement('section');
    root.id = 'little-scribbles-game';
    root.className = 'scribbles-game';
    root.setAttribute('aria-label', 'Little Scribbles writing practice');
    root.innerHTML = `
      <div class="scribbles-header">
        <div class="scribbles-brand">
          <img class="scribbles-brand-art" src="${CRAYON_ART}" alt="">
          <div><div class="scribbles-kicker">LET'S DRAW</div>
          <h1 class="scribbles-title">Little Scribbles</h1></div>
          <p class="scribbles-subtitle" data-scribbles-hint>Draw down the line</p>
        </div>
        <div class="scribbles-step" data-scribbles-step>1 / ${TRACE_STEPS.length}</div>
      </div>
      <div class="scribbles-stage-wrap">
        <div class="scribbles-stage">
          <canvas class="scribbles-canvas" data-scribbles-canvas aria-label="Drawing canvas"></canvas>
          <div class="scribbles-badge" data-scribbles-badge aria-live="polite"></div>
        </div>
      </div>
      <div class="scribbles-controls">
        <div class="scribbles-mode-buttons" role="group" aria-label="Drawing mode">
          <button type="button" class="scribbles-control active" data-mode="trace">✏️ Trace shapes</button>
          <button type="button" class="scribbles-control" data-mode="free">🎨 Free draw</button>
        </div>
        <div class="scribbles-palette" role="group" aria-label="Colors"></div>
        <div class="scribbles-actions">
          <button type="button" class="scribbles-action" data-action="undo" aria-label="Undo">↶ Undo</button>
          <button type="button" class="scribbles-action" data-action="clear">🧹 Clear</button>
          <button type="button" class="scribbles-action primary" data-action="next" hidden>Next shape →</button>
        </div>
      </div>
    `;

    host.appendChild(root);
    this.root = root;
    this.canvas = root.querySelector('[data-scribbles-canvas]');
    this.ctx = this.canvas.getContext('2d');
    this.renderPalette();
    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.canvas.parentElement);
    requestAnimationFrame(() => this.resizeCanvas());
  }

  bindEvents() {
    this.bound.pointerdown = (event) => this.beginDrawing(event);
    this.bound.pointermove = (event) => this.continueDrawing(event);
    this.bound.pointerup = () => this.stopDrawing();
    this.bound.pointercancel = () => this.stopDrawing();

    this.canvas.addEventListener('pointerdown', this.bound.pointerdown, { passive: false });
    this.canvas.addEventListener('pointermove', this.bound.pointermove, { passive: false });
    this.canvas.addEventListener('pointerup', this.bound.pointerup);
    this.canvas.addEventListener('pointercancel', this.bound.pointercancel);

    this.root.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => this.setMode(button.dataset.mode));
    });
    this.root.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => this.handleAction(button.dataset.action));
    });
  }

  renderPalette() {
    const palette = this.root.querySelector('.scribbles-palette');
    palette.innerHTML = COLORS.map((entry, index) => `
      <button type="button" class="scribbles-color ${index === 0 ? 'selected' : ''}" style="--swatch:${entry.value}" data-color="${entry.value}" aria-label="${entry.name}"></button>
    `).join('');
    palette.querySelectorAll('[data-color]').forEach((button) => {
      button.addEventListener('click', () => {
        this.color = button.dataset.color;
        palette.querySelectorAll('[data-color]').forEach((other) => other.classList.toggle('selected', other === button));
      });
    });
  }

  setMode(mode) {
    if (!['trace', 'free'].includes(mode)) return;
    this.mode = mode;
    this.stopDrawing();
    this.resetDrawing();
    this.root.querySelectorAll('[data-mode]').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
    this.root.querySelector('[data-action="next"]').hidden = true;
    this.render();
    this.announce(mode === 'free' ? 'Free draw time!' : `Let's draw a ${this.currentStep.name}.`);
  }

  handleAction(action) {
    if (action === 'clear') {
      this.resetDrawing();
      this.render();
      return;
    }
    if (action === 'undo') {
      this.drawing.pop();
      this.traceSucceeded = false;
      this.root.querySelector('[data-scribbles-badge]')?.classList.remove('show');
      this.root.querySelector('[data-action="next"]').hidden = true;
      this.render();
      return;
    }
    if (action === 'next' && this.mode === 'trace' && this.traceSucceeded) this.advanceStep();
  }

  beginDrawing(event) {
    if (!this.sessionRunning) return;
    event.preventDefault();
    this.isDrawing = true;
    this.canvas.setPointerCapture?.(event.pointerId);
    const point = this.getCanvasPoint(event);
    this.drawing.push([point]);
    this.drawInkSegment(point, point);
    this.updateTraceProgress();
  }

  continueDrawing(event) {
    if (!this.isDrawing || !this.sessionRunning) return;
    event.preventDefault();
    const point = this.getCanvasPoint(event);
    const stroke = this.drawing[this.drawing.length - 1];
    const previous = stroke[stroke.length - 1];
    stroke.push(point);
    this.drawInkSegment(previous, point);
    this.updateTraceProgress();
  }

  stopDrawing() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    if (this.mode === 'trace') this.checkTraceSuccess();
  }

  updateTraceProgress() {
    if (this.mode !== 'trace' || !this.drawing.length || this.traceSucceeded) return;
    const progress = this.calculateTraceScore();
    if (progress >= TRACE_THRESHOLD) this.markSuccess();
  }

  checkTraceSuccess() {
    if (this.mode !== 'trace' || this.traceSucceeded) return;
    if (this.calculateTraceScore() >= TRACE_THRESHOLD) this.markSuccess();
  }

  markSuccess() {
    this.traceSucceeded = true;
    this.root.querySelector('[data-action="next"]').hidden = false;
    const badge = this.root.querySelector('[data-scribbles-badge]');
    badge.textContent = `Great! ${this.currentStep.name}`;
    badge.classList.add('show');
    rewardFeedback(this.platform, `Great! ${this.currentStep.name}`, '✨');
  }

  advanceStep() {
    if (this.stepIndex >= TRACE_STEPS.length - 1) {
      this.setMode('free');
      completionFeedback(this.platform, 'You finished all the shapes!', '✏️');
      this.announce('You finished all the shapes! Now you can draw anything.');
      return;
    }
    this.stepIndex += 1;
    this.currentStep = TRACE_STEPS[this.stepIndex];
    this.resetDrawing();
    this.render();
    this.announce(`Let's draw a ${this.currentStep.name}.`);
  }

  resetDrawing() {
    this.drawing = [];
    this.traceSucceeded = false;
    const badge = this.root?.querySelector('[data-scribbles-badge]');
    badge?.classList.remove('show');
    const next = this.root?.querySelector('[data-action="next"]');
    if (next) next.hidden = true;
  }

  resizeCanvas() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(300, Math.floor(rect.height));
    this.layout = { width, height, dpr };
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.render();
  }

  render() {
    if (!this.ctx || !this.canvas || !this.root) return;
    const { width, height } = this.layout;
    if (!width || !height) return;
    this.ctx.clearRect(0, 0, width, height);
    this.drawBackground();
    if (this.mode === 'trace') this.drawGuide();
    this.drawInk();
    this.root.querySelector('[data-scribbles-hint]').textContent = this.mode === 'free' ? 'Make a picture with any color!' : this.currentStep.hint;
    this.root.querySelector('[data-scribbles-step]').textContent = this.mode === 'free' ? 'FREE DRAW' : `${this.stepIndex + 1} / ${TRACE_STEPS.length}`;
  }

  drawBackground() {
    const ctx = this.ctx;
    const { width, height } = this.layout;
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#fffdf7');
    gradient.addColorStop(1, '#f5fbff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.11)';
    ctx.lineWidth = 1;
    for (let x = 24; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 24; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  }

  drawGuide() {
    const points = this.getGuidePoints(this.currentStep);
    const ctx = this.ctx;
    if (!points.length) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([5, 11]);
    ctx.lineWidth = 9;
    ctx.strokeStyle = 'rgba(99, 116, 139, 0.25)';
    ctx.beginPath();
    points.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#9ab0c6';
    const [sx, sy] = points[0];
    ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6f8297';
    ctx.font = '900 18px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('START', sx, sy - 28);
    ctx.restore();
  }

  drawInk() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = BRUSH_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this.drawing.forEach((stroke) => {
      if (!stroke.length) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0], stroke[0][1]);
      stroke.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.stroke();
    });
    ctx.restore();
  }

  drawInkSegment(from, to) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = BRUSH_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(from[0], from[1]); ctx.lineTo(to[0], to[1]); ctx.stroke();
    ctx.restore();
  }

  getCanvasPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }

  getGuidePoints(step, samples = 180) {
    const { width, height } = this.layout;
    const map = ([x, y]) => [x * width, y * height];
    if (step.type === 'polyline' || step.type === 'polygon') return step.points.map(map);
    if (step.type === 'bezier') {
      const p = step.points.map(map); const out = [];
      for (let i = 0; i <= samples; i += 1) {
        const t = i / samples; const u = 1 - t;
        out.push([
          u ** 3 * p[0][0] + 3 * u ** 2 * t * p[1][0] + 3 * u * t ** 2 * p[2][0] + t ** 3 * p[3][0],
          u ** 3 * p[0][1] + 3 * u ** 2 * t * p[1][1] + 3 * u * t ** 2 * p[2][1] + t ** 3 * p[3][1]
        ]);
      }
      return out;
    }
    if (step.type === 'ellipse') {
      const out = [];
      for (let i = 0; i <= samples; i += 1) {
        const angle = i / samples * Math.PI * 2;
        out.push([(step.cx + Math.cos(angle) * step.rx) * width, (step.cy + Math.sin(angle) * step.ry) * height]);
      }
      return out;
    }
    if (step.type === 'regular-polygon') {
      const cx = 0.5; const cy = 0.5;
      return Array.from({ length: step.sides + 1 }, (_, index) => {
        const i = index % step.sides;
        const angle = step.rotation + i * Math.PI * 2 / step.sides;
        return [(cx + Math.cos(angle) * step.radiusX) * width, (cy + Math.sin(angle) * step.radiusY) * height];
      });
    }
    if (step.type === 'star') {
      const out = [];
      for (let i = 0; i <= step.points * 2; i += 1) {
        const angle = step.rotation + i * Math.PI / step.points;
        const radius = i % 2 === 0 ? step.outer : step.inner;
        out.push([0.5 * width + Math.cos(angle) * radius * width, 0.5 * height + Math.sin(angle) * radius * height]);
      }
      return out;
    }
    return [];
  }

  calculateTraceScore() {
    const points = this.drawing.flat();
    if (points.length < 6) return 0;
    const guide = this.getGuidePoints(this.currentStep);
    if (!guide.length) return 0;
    const tolerance = Math.min(TRACE_TOLERANCE, Math.max(42, Math.min(this.layout.width, this.layout.height) * 0.085));
    let near = 0;
    points.forEach(([x, y]) => {
      let min = Infinity;
      for (let i = 0; i < guide.length; i += 1) min = Math.min(min, Math.hypot(x - guide[i][0], y - guide[i][1]));
      if (min <= tolerance) near += 1;
    });
    const proximity = near / points.length;
    const strokeLength = this.drawing.reduce((sum, stroke) => sum + this.pathLength(stroke), 0);
    const guideLength = this.pathLength(guide);
    const normalizedLength = guideLength ? Math.min(1, strokeLength / guideLength) : 0;
    // Keep tracing forgiving, but don't let a tiny dot near the start point
    // count as a completed shape. A child should cover a meaningful part of
    // the guide while staying reasonably close to it.
    if (normalizedLength < 0.24 || proximity < 0.52) return proximity * 0.55 + normalizedLength * 0.45;
    return proximity * 0.62 + normalizedLength * 0.38;
  }

  pathLength(points) {
    let total = 0;
    for (let i = 1; i < points.length; i += 1) total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    return total;
  }

  announce(text) {
    if (!text) return;
    this.audioManager?.ensureRunning?.();
    this.audioManager?.speak?.(text, 0.9);
  }

  announceStep() {
    setTimeout(() => this.announce(`Let's draw a ${this.currentStep.name}. ${this.currentStep.hint}.`), 120);
  }
}
