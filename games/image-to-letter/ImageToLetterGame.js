import { GameModule } from '../../core/GameModule.js';

/**
 * Image -> Letter Game
 * Shows a picture and expects the toddler to tap the correct starting letter.
 */
export class ImageToLetterGame extends GameModule {
  static metadata = {
    id: 'image-to-letter',
    name: '🔍 Image To Letter',
    description: 'Look at the picture and pick the letter it starts with.',
    version: '1.0.0',
    author: 'Baby Games',
    assetPath: 'games/alphabet-learner/'
  };

  constructor(platform) {
    super(platform);

    this.currentChar = null;
    this.charList = [];
    this.charIndex = 0;
    this.score = 0;
    this.gameDataMap = new Map();

    // UI
    this.pictureDisplay = null;
    this.scoreDisplay = null;
    this.buttonsContainer = null;
    this.feedbackElement = null;
    this.rewardLayer = null;
    this.ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    this.isRunning = false;
    this.isWaitingForInput = false;
  }

  async initialize() {
    const manifest = await this.platform.assetManager.loadManifest(
      ImageToLetterGame.metadata.assetPath + 'manifest.json'
    );

    if (manifest.characters) {
      for (const charData of manifest.characters) {
        this.gameDataMap.set(charData.char, charData);
      }
    }

    if (manifest.sounds) {
      for (const [soundKey, soundPath] of Object.entries(manifest.sounds)) {
        const fullPath = ImageToLetterGame.metadata.assetPath + soundPath;
        await this.platform.audioManager.preloadAudio(fullPath, soundKey);
      }
    }

    this.createGameUI();
    this.setupInputHandlers();
  }

  start() {
    this.isRunning = true;
    this.score = 0;
    this.charIndex = 0;
    this.prepareCharacterList();
    this.updateScoreDisplay();
    this.nextRound();
  }

  stop() {
    this.isRunning = false;
    this.platform.inputManager.clear();
  }

  reset() {
    this.stop();
    this.start();
  }

  prepareCharacterList() {
    this.charList = [];
    for (let i = 0; i < 26; i++) this.charList.push(String.fromCharCode(65 + i));
    for (let i = 0; i < 10; i++) this.charList.push(i.toString());
    // shuffle
    for (let i = this.charList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.charList[i], this.charList[j]] = [this.charList[j], this.charList[i]];
    }
  }

  createGameUI() {
    this.gameContainer = document.createElement('div');
    this.gameContainer.className = 'game-container';

    const header = document.createElement('div');
    header.className = 'game-header';
    const title = document.createElement('div');
    title.className = 'game-title';
    title.textContent = '🔍 Image & Letter';
    header.appendChild(title);

    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.className = 'game-score-display';
    this.scoreDisplay.textContent = 'Score: 0';
    header.appendChild(this.scoreDisplay);
    this.gameContainer.appendChild(header);

    const content = document.createElement('div');
    content.className = 'game-content';

    const card = document.createElement('div');
    card.className = 'character-card';

    this.pictureDisplay = document.createElement('div');
    this.pictureDisplay.className = 'character-display display-picture display-active';
    card.appendChild(this.pictureDisplay);

    this.feedbackElement = document.createElement('div');
    this.feedbackElement.className = 'feedback-display';
    card.appendChild(this.feedbackElement);

    this.rewardLayer = document.createElement('div');
    this.rewardLayer.className = 'reward-burst';
    card.appendChild(this.rewardLayer);

    content.appendChild(card);

    this.buttonsContainer = document.createElement('div');
    this.buttonsContainer.className = 'buttons-container';
    this.createCharacterButtons();
    content.appendChild(this.buttonsContainer);

    this.gameContainer.appendChild(content);
  }

  createCharacterButtons() {
    const lettersRow = document.createElement('div');
    lettersRow.className = 'button-row';
    for (let i = 0; i < 26; i++) {
      const char = String.fromCharCode(65 + i);
      const btn = document.createElement('button');
      btn.className = 'char-button';
      btn.dataset.char = char;
      btn.textContent = char;
      btn.addEventListener('click', () => this.handleCharacterInput(char));
      lettersRow.appendChild(btn);
    }
    this.buttonsContainer.appendChild(lettersRow);

    const numbersRow = document.createElement('div');
    numbersRow.className = 'button-row';
    for (let i = 0; i < 10; i++) {
      const char = i.toString();
      const btn = document.createElement('button');
      btn.className = 'char-button';
      btn.dataset.char = char;
      btn.textContent = char;
      btn.addEventListener('click', () => this.handleCharacterInput(char));
      numbersRow.appendChild(btn);
    }
    this.buttonsContainer.appendChild(numbersRow);
  }

  setupInputHandlers() {
    for (let i = 0; i < 26; i++) {
      const char = String.fromCharCode(65 + i);
      this.platform.inputManager.onKey(char, () => this.handleCharacterInput(char));
    }
    for (let i = 0; i < 10; i++) {
      const char = i.toString();
      this.platform.inputManager.onKey(char, () => this.handleCharacterInput(char));
    }
  }

  async nextRound() {
    if (!this.isRunning) return;
    if (this.charIndex >= this.charList.length) {
      this.prepareCharacterList();
      this.charIndex = 0;
    }
    this.currentChar = this.charList[this.charIndex++];
    await this.showPictureFor(this.currentChar);
    this.isWaitingForInput = true;
  }

  async showPictureFor(char) {
    const charData = this.gameDataMap.get(char);
    if (!charData || !charData.imagePath) {
      this.pictureDisplay.textContent = '';
      return;
    }

    const imagePath = ImageToLetterGame.metadata.assetPath + charData.imagePath;
    await this.platform.assetManager.loadImage(imagePath, `img_${char}`);
    const img = this.platform.assetManager.get(`img_${char}`);
    this.pictureDisplay.innerHTML = '';
    this.pictureDisplay.appendChild(img.cloneNode());

    // Speak the prompt
    if (this.ttsSupported) {
      const name = charData.name || char;
      this.speak(`What does ${name} start with?`);
    }
  }

  handleCharacterInput(char) {
    if (!this.isRunning || !this.isWaitingForInput) return;
    this.isWaitingForInput = false;

    if (char === this.currentChar) {
      this.handleCorrectAnswer();
    } else {
      this.handleWrongAnswer();
    }
  }

  handleCorrectAnswer() {
    this.score++;
    if (this.scoreDisplay) this.scoreDisplay.textContent = `Score: ${this.score}`;
    this.platform.audioManager.playSound && this.platform.audioManager.playSound('success');
    this.showFeedback('✓', 'correct');
    this.showRewardBurst();
    setTimeout(() => this.nextRound(), 900);
  }

  handleWrongAnswer() {
    this.platform.audioManager.playSound && this.platform.audioManager.playSound('fail');
    this.showFeedback('✗', 'incorrect');
    setTimeout(() => { this.isWaitingForInput = true; }, 700);
  }

  showFeedback(emoji, type) {
    if (!this.feedbackElement) return;
    this.feedbackElement.textContent = emoji;
    this.feedbackElement.className = `feedback-display feedback-${type}`;
    this.feedbackElement.style.display = 'flex';
    setTimeout(() => { this.feedbackElement.style.display = 'none'; }, 900);
  }

  showRewardBurst() {
    if (!this.rewardLayer) return;
    this.rewardLayer.innerHTML = '';
    const stars = 8;
    for (let i = 0; i < stars; i++) {
      const s = document.createElement('span');
      s.className = 'reward-star';
      s.style.setProperty('--delay', `${i * 30}ms`);
      this.rewardLayer.appendChild(s);
    }
    setTimeout(() => { this.rewardLayer.innerHTML = ''; }, 1000);
  }

  speak(text) {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }
}
