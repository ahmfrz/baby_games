/**
 * Shared, game-agnostic celebration layer for Baby Games.
 * Keeps reward/completion presentation consistent across DOM and Phaser games.
 */
export class ToddlerCelebration {
  constructor({ documentRef = globalThis.document } = {}) {
    this.document = documentRef;
    this.layer = null;
    this.hideTimer = null;
    this.streak = 0;
  }

  mount() {
    if (!this.document || this.layer) return this.layer;
    const layer = this.document.createElement('div');
    layer.id = 'toddlerCelebration';
    layer.className = 'toddler-celebration';
    layer.setAttribute('aria-live', 'polite');
    layer.innerHTML = `
      <div class="celebration-backdrop" aria-hidden="true"></div>
      <div class="celebration-confetti" aria-hidden="true"></div>
      <div class="celebration-card" role="status">
        <div class="celebration-icon">✨</div>
        <div class="celebration-title">Great!</div>
        <div class="celebration-subtitle"></div>
        <div class="celebration-streak" hidden></div>
        <button class="celebration-continue" type="button">Keep playing</button>
      </div>`;
    this.document.body.appendChild(layer);
    this.layer = layer;
    layer.querySelector('.celebration-continue')?.addEventListener('click', () => this.hide());
    return layer;
  }

  resetStreak() { this.streak = 0; }

  reward({ message = 'Great!', emoji = '✨', particles = 16 } = {}) {
    this.mount();
    this.streak += 1;
    this.showCard({ message, emoji, subtitle: this.streak >= 3 ? 'You are doing great!' : '', complete: false });
    this.confetti(Math.min(24, Math.max(8, particles)), false);
  }

  complete({ title = 'Amazing job!', message = 'You finished the game!', emoji = '🏆', score = null } = {}) {
    this.mount();
    this.streak = 0;
    const subtitle = score == null ? message : `${message}  Score: ${score}`;
    this.showCard({ message: title, emoji, subtitle, complete: true });
    this.confetti(34, true);
  }

  ripple(x, y) {
    if (!this.document) return;
    const ripple = this.document.createElement('span');
    ripple.className = 'touch-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    this.document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 480);
  }

  showCard({ message, emoji, subtitle, complete }) {
    const layer = this.layer;
    const card = layer.querySelector('.celebration-card');
    const icon = layer.querySelector('.celebration-icon');
    const title = layer.querySelector('.celebration-title');
    const sub = layer.querySelector('.celebration-subtitle');
    const streak = layer.querySelector('.celebration-streak');
    const button = layer.querySelector('.celebration-continue');

    icon.textContent = emoji;
    title.textContent = message;
    sub.textContent = subtitle;
    button.textContent = complete ? 'Done' : 'Keep playing';
    button.hidden = !complete;
    streak.hidden = this.streak < 3 || complete;
    streak.textContent = this.streak >= 3 ? `⭐ ${this.streak} great choices!` : '';

    layer.classList.toggle('celebration-complete', complete);
    layer.classList.remove('is-visible');
    void layer.offsetWidth;
    layer.classList.add('is-visible');

    clearTimeout(this.hideTimer);
    if (!complete) this.hideTimer = setTimeout(() => this.hide(), 1050);
  }

  confetti(count, dramatic) {
    const container = this.layer.querySelector('.celebration-confetti');
    container.replaceChildren();
    const glyphs = ['✦', '★', '●', '♥', '◆', '✿'];
    for (let i = 0; i < count; i += 1) {
      const piece = this.document.createElement('span');
      piece.textContent = glyphs[i % glyphs.length];
      piece.style.setProperty('--x', `${-48 + Math.random() * 96}vw`);
      piece.style.setProperty('--delay', `${Math.random() * (dramatic ? 0.28 : 0.12)}s`);
      piece.style.setProperty('--drift', `${-18 + Math.random() * 36}vw`);
      piece.style.setProperty('--spin', `${-360 + Math.random() * 720}deg`);
      piece.style.setProperty('--size', `${18 + Math.random() * 18}px`);
      container.appendChild(piece);
    }
  }

  hide() {
    if (!this.layer) return;
    this.layer.classList.remove('is-visible');
    clearTimeout(this.hideTimer);
  }
}
