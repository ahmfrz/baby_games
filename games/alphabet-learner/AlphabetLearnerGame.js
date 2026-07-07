import { GameModule } from '../../core/GameModule.js';

const MODE_SEQUENCE = 'sequential';
const MODE_RANDOM = 'random';
const MODE_BUTTON = 'button';
const MODES = [MODE_SEQUENCE, MODE_RANDOM, MODE_BUTTON];
const ROUND_ADVANCE_MS = 3000;
const WRONG_RESET_MS = 850;
const REVEAL_RESET_MS = 1250;

export class AlphabetLearnerGame extends GameModule {
  static metadata = {
    id: 'alphabet-learner',
    name: 'ABC 123 Learner',
    description: 'Learn letters and numbers with pictures, speech, and gentle play.',
    version: '3.0.0',
    author: 'Baby Games',
    assetPath: 'games/alphabet-learner/assets/'
  };

  constructor(platform) {
    super(platform);

    this.root = null;
    this.elements = {};
    this.items = [];
    this.itemByChar = new Map();
    this.sequence = [];
    this.sequenceIndex = 0;
    this.currentItem = null;
    this.mode = MODE_RANDOM;
    this.score = 0;
    this.remainingSeconds = 0;
    this.timerId = null;
    this.isRunning = false;
    this.inputLocked = false;
    this.boundKeyHandlers = new Map();
    this.pendingTimeouts = new Set();
    this.backgroundAudio = null;
  }

  async initialize() {
    await this.audioManager?.initialize?.();
    await this.loadGameData();
    this.mountUI();
    this.bindKeyboardInput();
  }

  start() {
    this.score = 0;
    this.sequenceIndex = 0;
    this.currentItem = null;
    this.inputLocked = false;
    this.remainingSeconds = this.timerService?.getDuration?.() ?? 120;
    this.isRunning = true;

    this.hideBlocker();
    this.prepareSequence();
    this.updateScore();
    this.updateTimer();
    this.updateModeButtons();
    this.showGameContainer();
    this.bindKeyboardInput();
    this.startTimer();
    this.startBackgroundAudio();
    this.beginRound();
  }

  pause() {
    this.isRunning = false;
    this.clearTimer();
    this.clearPendingTimeouts();
    this.stopSpeech();
    this.stopBackgroundAudio();
  }

  resume() {
    if (this.remainingSeconds <= 0 || this.isBlocked()) return;

    this.isRunning = true;
    this.startTimer();
    this.startBackgroundAudio();
  }

  stop() {
    this.isRunning = false;
    this.clearTimer();
    this.clearPendingTimeouts();
    this.stopSpeech();
    this.stopBackgroundAudio();
    this.unbindKeyboardInput();
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

  async loadGameData() {
    const manifest = await this.fetchManifest();
    const imageDir = manifest.imageDir || 'images/';
    const letters = manifest.characters || [];
    const numbers = manifest.numbers || [];

    this.items = [...letters, ...numbers].map((entry) => {
      const char = entry.char || entry.character;
      const kind = /^[0-9]$/.test(char) ? 'Number' : 'Letter';
      const word = entry.name || char;

      return {
        char,
        kind,
        word,
        imagePath: `${AlphabetLearnerGame.metadata.assetPath}${imageDir}${entry.imageFile || ''}`
      };
    }).filter((item) => item.char);

    if (this.items.length === 0) {
      this.items = this.createFallbackItems();
    }

    if (!this.items.some((item) => item.char === '0')) {
      this.items.push({
        char: '0',
        kind: 'Number',
        word: 'Zero',
        imagePath: this.createFallbackImageDataUrl('0', 'Zero')
      });
    }

    this.itemByChar = new Map(this.items.map((item) => [item.char, item]));
  }

  async fetchManifest() {
    try {
      const response = await fetch(`${AlphabetLearnerGame.metadata.assetPath}manifest.json`);
      if (!response.ok) throw new Error(`Manifest failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('[AlphabetLearnerGame] Using fallback alphabet data.', error);
      return {};
    }
  }

  createFallbackItems() {
    const letters = Array.from({ length: 26 }, (_, index) => {
      const char = String.fromCharCode(65 + index);
      return {
        char,
        kind: 'Letter',
        word: char,
        imagePath: this.createFallbackImageDataUrl(char, char)
      };
    });

    const numbers = Array.from({ length: 10 }, (_, index) => {
      const char = String(index);
      return {
        char,
        kind: 'Number',
        word: char,
        imagePath: this.createFallbackImageDataUrl(char, char)
      };
    });

    return [...letters, ...numbers];
  }

  createFallbackImageDataUrl(char, word) {
    const safeChar = this.escapeSvgText(char);
    const safeWord = this.escapeSvgText(word);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480">
        <rect width="640" height="480" rx="48" fill="#fff7d6"/>
        <circle cx="138" cy="116" r="58" fill="#5ce1e6" opacity=".75"/>
        <circle cx="520" cy="350" r="72" fill="#4ade80" opacity=".65"/>
        <path d="M116 360 C210 245 278 416 372 276 C432 186 486 230 548 136" fill="none" stroke="#fbbf24" stroke-width="34" stroke-linecap="round"/>
        <text x="320" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="180" font-weight="900" fill="#1f2937">${safeChar}</text>
        <text x="320" y="348" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="800" fill="#0d9488">${safeWord}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  escapeSvgText(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  mountUI() {
    if (this.root?.isConnected) return;

    const host = this.getGameContainerEl();
    const root = document.createElement('section');
    root.id = 'alphabet-learner-game';
    root.className = 'alphabet-game';
    root.setAttribute('aria-label', 'Alphabet and numbers learner');

    root.append(
      this.createHeader(),
      this.createStage(),
      this.createKeyboard(),
      this.createBlocker()
    );

    host?.appendChild(root);
    this.root = root;
    this.renderKeyboard();
  }

  createHeader() {
    const header = document.createElement('header');
    header.className = 'alphabet-header';

    const brand = document.createElement('div');
    brand.className = 'alphabet-brand';
    brand.innerHTML = '<span class="brand-mark">ABC</span><span class="brand-submark">123</span>';

    const modes = document.createElement('div');
    modes.className = 'mode-switcher';
    modes.setAttribute('aria-label', 'Choose game mode');

    const modeLabels = {
      [MODE_SEQUENCE]: 'Sequence',
      [MODE_RANDOM]: 'Random',
      [MODE_BUTTON]: 'Button'
    };

    MODES.forEach((mode) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mode-button';
      button.dataset.mode = mode;
      button.textContent = modeLabels[mode];
      button.addEventListener('click', () => this.setMode(mode));
      modes.appendChild(button);
    });

    const status = document.createElement('div');
    status.className = 'session-status';

    const score = document.createElement('div');
    score.className = 'status-pill score-pill';
    score.innerHTML = '<span class="status-icon">Star</span><strong>0</strong>';

    const timer = document.createElement('div');
    timer.className = 'status-pill timer-pill';
    timer.innerHTML = '<span class="status-icon">Time</span><strong>0:00</strong>';

    const parentButton = document.createElement('button');
    parentButton.type = 'button';
    parentButton.className = 'parent-button';
    parentButton.textContent = 'Parent';
    parentButton.addEventListener('click', () => this.showPinBlocker('exit'));

    status.append(score, timer, parentButton);
    header.append(brand, modes, status);

    this.elements.score = score.querySelector('strong');
    this.elements.timer = timer.querySelector('strong');
    this.elements.modeButtons = modes.querySelectorAll('.mode-button');

    return header;
  }

  createStage() {
    const stage = document.createElement('main');
    stage.className = 'learning-stage';

    const ambient = document.createElement('div');
    ambient.className = 'ambient-shapes';
    ambient.setAttribute('aria-hidden', 'true');
    ambient.innerHTML = '<span></span><span></span><span></span><span></span>';

    const card = document.createElement('article');
    card.className = 'learning-card';

    const prompt = document.createElement('div');
    prompt.className = 'prompt-line';
    prompt.textContent = 'Find the glowing key';

    const display = document.createElement('div');
    display.className = 'character-display';

    const character = document.createElement('div');
    character.className = 'display-character';
    character.textContent = '?';

    const imageWrap = document.createElement('div');
    imageWrap.className = 'display-image-wrap hidden';

    const image = document.createElement('img');
    image.className = 'display-image';
    image.alt = '';
    image.decoding = 'async';
    image.addEventListener('error', () => {
      const item = this.currentItem;
      if (item && image.dataset.fallback !== 'true') {
        image.dataset.fallback = 'true';
        image.src = this.createFallbackImageDataUrl(item.char, item.word);
      }
    });
    imageWrap.appendChild(image);

    const word = document.createElement('div');
    word.className = 'display-word';

    display.append(character, imageWrap, word);

    const feedback = document.createElement('div');
    feedback.className = 'feedback-badge';
    feedback.setAttribute('aria-live', 'polite');

    const sparkleLayer = document.createElement('div');
    sparkleLayer.className = 'sparkle-layer';
    sparkleLayer.setAttribute('aria-hidden', 'true');

    card.append(prompt, display, feedback, sparkleLayer);
    stage.append(ambient, card);

    this.elements.prompt = prompt;
    this.elements.card = card;
    this.elements.character = character;
    this.elements.imageWrap = imageWrap;
    this.elements.image = image;
    this.elements.word = word;
    this.elements.feedback = feedback;
    this.elements.sparkleLayer = sparkleLayer;

    return stage;
  }

  createKeyboard() {
    const keyboard = document.createElement('nav');
    keyboard.className = 'keyboard-panel';
    keyboard.setAttribute('aria-label', 'Alphabet and number keys');
    this.elements.keyboard = keyboard;
    return keyboard;
  }

  createBlocker() {
    const blocker = document.createElement('div');
    blocker.className = 'session-blocker hidden';
    blocker.setAttribute('role', 'dialog');
    blocker.setAttribute('aria-modal', 'true');
    blocker.innerHTML = `
      <div class="blocker-card">
        <div class="blocker-burst" aria-hidden="true">ABC</div>
        <h2 class="blocker-title">Session complete</h2>
        <p class="blocker-score">Score: <strong>0</strong></p>
        <label class="pin-label" for="alphabetPinInput">Parent PIN</label>
        <input id="alphabetPinInput" class="pin-entry" type="password" maxlength="4" inputmode="numeric" autocomplete="off">
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
    this.elements.blockerScore = blocker.querySelector('.blocker-score strong');
    this.elements.pinInput = input;
    this.elements.pinError = blocker.querySelector('.pin-error');

    return blocker;
  }

  renderKeyboard() {
    const keyboard = this.elements.keyboard;
    if (!keyboard) return;

    keyboard.innerHTML = '';
    this.items.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'character-key';
      button.dataset.char = item.char;
      button.textContent = item.char;
      button.setAttribute('aria-label', `${item.kind} ${item.char}`);
      button.addEventListener('pointerdown', () => this.resumeAudioContext());
      button.addEventListener('click', () => this.handleInput(item.char));
      keyboard.appendChild(button);
    });
  }

  bindKeyboardInput() {
    this.unbindKeyboardInput();
    this.items.forEach((item) => {
      const handler = () => this.handleInput(item.char);
      this.boundKeyHandlers.set(item.char, handler);
      this.platform.inputManager?.onKey?.(item.char, handler);
    });
  }

  unbindKeyboardInput() {
    this.boundKeyHandlers.forEach((handler, char) => {
      this.platform.inputManager?.offKey?.(char, handler);
    });
    this.boundKeyHandlers.clear();
  }

  showGameContainer() {
    const host = this.getGameContainerEl();
    if (host) host.style.display = 'flex';
    this.root?.classList.remove('hidden');
  }

  setMode(mode) {
    if (!MODES.includes(mode) || mode === this.mode) return;

    this.mode = mode;
    this.inputLocked = false;
    this.clearPendingTimeouts();
    this.prepareSequence();
    this.updateModeButtons();
    this.beginRound();
  }

  prepareSequence() {
    this.sequence = [...this.items];
    if (this.mode === MODE_RANDOM) this.shuffle(this.sequence);
    this.sequenceIndex = 0;
  }

  beginRound() {
    if (!this.isRunning || this.isBlocked()) return;

    this.inputLocked = false;
    this.clearFeedback();
    this.clearKeyStates();

    if (this.mode === MODE_BUTTON) {
      this.currentItem = null;
      this.elements.prompt.textContent = 'Tap any key';
      this.showPlaceholder();
      this.speak('Tap any key.');
      return;
    }

    if (this.sequenceIndex >= this.sequence.length) {
      this.prepareSequence();
    }

    this.currentItem = this.sequence[this.sequenceIndex];
    this.sequenceIndex += 1;
    this.elements.prompt.textContent = 'Find the glowing key';
    this.showCharacter(this.currentItem);
    this.highlightKey(this.currentItem.char);
    this.speak(`Where is ${this.currentItem.char}?`);
  }

  handleInput(char) {
    if (!this.isRunning || this.inputLocked || this.isBlocked()) return;

    this.resumeAudioContext();
    const item = this.itemByChar.get(char);
    if (!item) return;

    if (this.mode === MODE_BUTTON) {
      this.revealButtonModeItem(item);
      return;
    }

    if (char === this.currentItem?.char) {
      this.handleCorrect(item);
    } else {
      this.handleIncorrect(char);
    }
  }

  handleCorrect(item) {
    this.inputLocked = true;
    this.score += 1;
    this.updateScore();
    this.markKey(item.char, 'correct');
    this.showImage(item);
    this.showFeedback('Yay!', 'correct');
    this.playCorrectSound();
    this.speak(`That is correct, ${this.answerPhrase(item)}!`);
    this.launchSparkles('correct');

    this.setManagedTimeout(() => {
      this.clearKeyStates();
      this.beginRound();
    }, ROUND_ADVANCE_MS);
  }

  handleIncorrect(char) {
    this.inputLocked = true;
    this.markKey(char, 'wrong');
    this.showFeedback('Try again', 'wrong');
    this.playWrongSound();
    this.speak(`Oops! You pressed ${char}, where is ${this.currentItem.char}?`);
    this.elements.card.classList.remove('gentle-shake');
    void this.elements.card.offsetWidth;
    this.elements.card.classList.add('gentle-shake');

    this.setManagedTimeout(() => {
      this.inputLocked = false;
      this.clearFeedback();
      this.clearKeyStates();
      this.highlightKey(this.currentItem?.char);
    }, WRONG_RESET_MS);
  }

  revealButtonModeItem(item) {
    this.inputLocked = true;
    this.currentItem = item;
    this.markKey(item.char, 'correct');
    this.showImage(item);
    this.showFeedback('Hello!', 'correct');
    this.playCorrectSound();
    this.speak(this.answerPhrase(item));
    this.launchSparkles('correct');

    this.setManagedTimeout(() => {
      this.clearKeyStates();
      this.inputLocked = false;
      this.showPlaceholder();
      this.elements.prompt.textContent = 'Tap any key';
    }, REVEAL_RESET_MS);
  }

  showPlaceholder() {
    this.elements.character.textContent = '?';
    this.elements.character.classList.remove('hidden');
    this.elements.imageWrap.classList.add('hidden');
    this.elements.image.removeAttribute('src');
    this.elements.word.textContent = '';
    this.elements.card.classList.remove('image-revealed');
  }

  showCharacter(item) {
    this.elements.character.textContent = item.char;
    this.elements.character.classList.remove('hidden');
    this.elements.imageWrap.classList.add('hidden');
    this.elements.image.removeAttribute('src');
    this.elements.word.textContent = '';
    this.elements.card.classList.remove('image-revealed');
    this.pulseCard();
  }

  showImage(item) {
    this.elements.character.classList.add('hidden');
    this.elements.imageWrap.classList.remove('hidden');
    this.elements.image.dataset.fallback = 'false';
    this.elements.image.src = item.imagePath;
    this.elements.image.alt = `${item.char} for ${item.word}`;
    this.elements.word.textContent = `${item.char} - ${item.word}`;
    this.elements.card.classList.add('image-revealed');
    this.pulseCard();
  }

  pulseCard() {
    this.elements.card.classList.remove('card-pop');
    void this.elements.card.offsetWidth;
    this.elements.card.classList.add('card-pop');
  }

  updateModeButtons() {
    this.elements.modeButtons?.forEach((button) => {
      const active = button.dataset.mode === this.mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  updateScore() {
    if (this.elements.score) this.elements.score.textContent = String(this.score);
  }

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
    this.stopSpeech();
    this.stopBackgroundAudio();
    this.clearKeyStates();
    this.showPinBlocker('sessionEnd');
  }

  showPinBlocker(mode) {
    if (mode === 'exit') {
      this.elements.blockerTitle.textContent = 'Parent unlock';
      this.elements.blockerScore.parentElement.classList.add('hidden');
    } else {
      this.elements.blockerTitle.textContent = 'Great learning!';
      this.elements.blockerScore.textContent = String(this.score);
      this.elements.blockerScore.parentElement.classList.remove('hidden');
    }

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
      this.playWrongSound();
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

  highlightKey(char) {
    if (!char) return;
    this.findKey(char)?.classList.add('target');
  }

  markKey(char, state) {
    const key = this.findKey(char);
    if (!key) return;
    key.classList.remove('target', 'correct', 'wrong');
    key.classList.add(state);
  }

  clearKeyStates() {
    this.elements.keyboard?.querySelectorAll('.character-key').forEach((key) => {
      key.classList.remove('target', 'correct', 'wrong');
    });
  }

  findKey(char) {
    return this.elements.keyboard?.querySelector(`[data-char="${CSS.escape(char)}"]`);
  }

  showFeedback(text, type) {
    this.elements.feedback.textContent = text;
    this.elements.feedback.className = `feedback-badge show ${type}`;
  }

  clearFeedback() {
    this.elements.feedback.textContent = '';
    this.elements.feedback.className = 'feedback-badge';
  }

  launchSparkles(type) {
    const layer = this.elements.sparkleLayer;
    if (!layer) return;

    layer.innerHTML = '';
    for (let index = 0; index < 16; index += 1) {
      const sparkle = document.createElement('span');
      sparkle.className = `sparkle ${type}`;
      sparkle.style.setProperty('--angle', `${index * 22.5}deg`);
      sparkle.style.setProperty('--distance', `${90 + (index % 4) * 18}px`);
      layer.appendChild(sparkle);
    }

    this.setManagedTimeout(() => {
      if (layer.isConnected) layer.innerHTML = '';
    }, 1000);
  }

  speak(text) {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.82;
    utterance.pitch = 1.18;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }

  stopSpeech() {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // Speech synthesis is optional.
    }
  }

  answerPhrase(item) {
    return `${item.char} for ${item.word}`;
  }

  resumeAudioContext() {
    if (this.audioManager?.context?.state === 'suspended') {
      this.audioManager.context.resume();
    }
  }

  playCorrectSound() {
    this.playToneSequence([523.25, 659.25, 783.99], 0.08, 'sine', 0.18);
  }

  playWrongSound() {
    this.playToneSequence([220, 196], 0.09, 'triangle', 0.12);
  }

  playToneSequence(frequencies, noteDuration, type, volume) {
    const context = this.audioManager?.context;
    if (!context) return;

    this.resumeAudioContext();
    frequencies.forEach((frequency, index) => {
      const start = context.currentTime + index * noteDuration;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + noteDuration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + noteDuration + 0.02);
    });
  }

  startBackgroundAudio() {
    const context = this.audioManager?.context;
    if (!context || this.backgroundAudio) return;

    this.resumeAudioContext();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.025, context.currentTime + 0.8);
    gain.connect(context.destination);

    const oscillators = [261.63, 329.63, 392].map((frequency) => {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start();
      return oscillator;
    });

    this.backgroundAudio = { context, gain, oscillators };
  }

  stopBackgroundAudio() {
    if (!this.backgroundAudio) return;

    const { context, gain, oscillators } = this.backgroundAudio;
    const stopAt = context.currentTime + 0.35;
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
    oscillators.forEach((oscillator) => oscillator.stop(stopAt + 0.02));
    this.backgroundAudio = null;
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

  shuffle(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }
  }
}
