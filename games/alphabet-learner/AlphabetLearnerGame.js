import { GameModule } from '../../core/GameModule.js';

/**
 * Alphabet & Numbers Learner Game
 * Displays letters/numbers one at a time, plays sounds, shows pictures on correct input
 */
export class AlphabetLearnerGame extends GameModule {
  static metadata = {
    id: 'alphabet-learner',
    name: '🔤 Learn Alphabet & Numbers',
    description: 'Learn letters A-Z and numbers 0-9 with fun pictures and sounds!',
    version: '1.0.0',
    author: 'Baby Games',
    assetPath: 'games/alphabet-learner/'
  };

  constructor(platform) {
    super(platform);
    
    // Game state
    this.currentChar = null;
    this.charList = [];
    this.charIndex = 0;
    this.score = 0;
    this.sessionStartTime = null;
    this.gameMode = 'random'; // 'random' or 'sequence'
    this.showLettersOnly = true; // Toggle between letters and numbers
    this.gameDataMap = new Map(); // Maps characters to image/sound data
    
    // UI elements
    this.letterDisplay = null;
    this.pictureDisplay = null;
    this.scoreDisplay = null;
    this.buttonsContainer = null;
    this.keyboardHints = null;
    this.feedbackElement = null;
    
    // State flags
    this.isWaitingForInput = false;
    this.isAnimating = false;
    this.inputLocked = false;
  }

  /**
   * Initialize game - load assets and setup
   */
  async initialize() {
    console.log('[AlphabetLearnerGame] Initializing...');

    try {
      // Load game manifest
      const manifest = await this.platform.assetManager.loadManifest(
        AlphabetLearnerGame.metadata.assetPath + 'manifest.json'
      );

      // Populate game data map from manifest
      if (manifest.characters) {
        for (const charData of manifest.characters) {
          this.gameDataMap.set(charData.char, charData);
        }
      }

      // Initialize audio
      if (manifest.sounds) {
        for (const [soundKey, soundPath] of Object.entries(manifest.sounds)) {
          const fullPath = AlphabetLearnerGame.metadata.assetPath + soundPath;
          await this.platform.audioManager.preloadAudio(fullPath, soundKey);
        }
      }

      // Create game UI
      this.createGameUI();

      // Initialize input handlers
      this.setupInputHandlers();

      // Initialize audio context on first user interaction
      this.platform.audioManager.initialize().catch(err => {
        console.warn('[AlphabetLearnerGame] Audio initialization failed:', err);
      });

      console.log('[AlphabetLearnerGame] Initialization complete');
    } catch (err) {
      console.error('[AlphabetLearnerGame] Initialization failed:', err);
      throw err;
    }
  }

  /**
   * Start the game
   */
  start() {
    console.log('[AlphabetLearnerGame] Starting game...');

    this.isRunning = true;
    this.score = 0;
    this.sessionStartTime = Date.now();
    this.charIndex = 0;

    // Prepare character list
    this.prepareCharacterList();

    // Show launcher controls
    this.updateScoreDisplay();
    this.showGameUI();

    // Start first round
    this.nextRound();
  }

  /**
   * Pause the game
   */
  pause() {
    this.isRunning = false;
    console.log('[AlphabetLearnerGame] Game paused');
  }

  /**
   * Stop the game and cleanup
   */
  stop() {
    console.log('[AlphabetLearnerGame] Game stopped');

    this.isRunning = false;
    this.platform.inputManager.clear();

    // Save final score
    if (this.sessionStartTime) {
      const duration = Date.now() - this.sessionStartTime;
      this.platform.storageManager.set('lastGameScore', {
        score: this.score,
        duration,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Reset game to initial state
   */
  reset() {
    this.score = 0;
    this.charIndex = 0;
    this.currentChar = null;
    this.isWaitingForInput = false;
    this.inputLocked = false;
    this.updateScoreDisplay();
    this.nextRound();
  }

  // ============================================
  // Game Logic
  // ============================================

  /**
   * Prepare the list of characters to display
   */
  prepareCharacterList() {
    this.charList = [];

    // Add letters if enabled
    if (this.showLettersOnly) {
      for (let i = 0; i < 26; i++) {
        this.charList.push(String.fromCharCode(65 + i)); // A-Z
      }
    } else {
      // Add numbers 0-9
      for (let i = 0; i < 10; i++) {
        this.charList.push(i.toString());
      }
    }

    // Shuffle for random mode
    if (this.gameMode === 'random') {
      this.shuffleArray(this.charList);
    }
  }

  /**
   * Move to next round
   */
  nextRound() {
    if (!this.isRunning) return;

    // Check if we've gone through all characters
    if (this.charIndex >= this.charList.length) {
      this.prepareCharacterList();
      this.charIndex = 0;
    }

    this.currentChar = this.charList[this.charIndex];
    this.charIndex++;

    this.displayCharacter();
  }

  /**
   * Display current character in the card
   */
  displayCharacter() {
    this.isWaitingForInput = true;
    this.inputLocked = false;
    this.isAnimating = false;

    // Slide in animation
    this.letterDisplay.classList.remove('display-active');
    this.pictureDisplay.classList.remove('display-active');
    this.letterDisplay.style.display = 'flex';
    this.pictureDisplay.style.display = 'none';

    // Update letter
    this.letterDisplay.textContent = this.currentChar;

    // Trigger slide in animation
    setTimeout(() => {
      this.letterDisplay.classList.add('display-active');
    }, 50);

    // Update button highlights
    this.updateButtonHighlights(this.currentChar);
  }

  /**
   * Handle character input (from keyboard or button)
   * @param {string} char - Character pressed/clicked
   */
  handleCharacterInput(char) {
    if (!this.isRunning || !this.isWaitingForInput || this.inputLocked || this.isAnimating) {
      return;
    }

    this.inputLocked = true;
    this.isAnimating = true;

    if (char === this.currentChar) {
      this.handleCorrectAnswer();
    } else {
      this.handleWrongAnswer();
    }
  }

  /**
   * Handle correct answer
   */
  async handleCorrectAnswer() {
    console.log(`[AlphabetLearnerGame] Correct! ${this.currentChar}`);

    this.score++;
    this.updateScoreDisplay();

    // Play success sound
    this.platform.audioManager.playSound('success');

    // Show picture with celebration animation
    await this.showPicture();

    // Add celebration feedback
    this.showFeedback('✓', 'correct');

    // Wait before next round
    setTimeout(() => {
      this.isWaitingForInput = false;
      this.nextRound();
    }, 1500);
  }

  /**
   * Handle wrong answer
   */
  async handleWrongAnswer() {
    console.log(`[AlphabetLearnerGame] Wrong! Expected ${this.currentChar}`);

    // Play fail sound
    this.platform.audioManager.playSound('fail');

    // Show shake animation
    this.shakeCard();

    // Add error feedback
    this.showFeedback('✗', 'incorrect');

    // Wait before accepting next input
    setTimeout(() => {
      this.isAnimating = false;
      this.inputLocked = false;
      this.isWaitingForInput = true;
    }, 600);
  }

  /**
   * Display picture for current character
   */
  async showPicture() {
    const charData = this.gameDataMap.get(this.currentChar);
    if (!charData || !charData.imagePath) {
      console.warn(`[AlphabetLearnerGame] No image for ${this.currentChar}`);
      return;
    }

    try {
      // Load image if not already loaded
      const imagePath = AlphabetLearnerGame.metadata.assetPath + charData.imagePath;
      const cacheKey = `char_${this.currentChar}_image`;
      await this.platform.assetManager.loadImage(imagePath, cacheKey);

      // Show picture with flip animation
      const img = this.platform.assetManager.get(cacheKey);
      this.pictureDisplay.innerHTML = '';
      this.pictureDisplay.appendChild(img.cloneNode());

      // Flip animation
      this.letterDisplay.classList.remove('display-active');
      setTimeout(() => {
        this.letterDisplay.style.display = 'none';
        this.pictureDisplay.style.display = 'flex';
        this.pictureDisplay.classList.add('display-active');
      }, 300);
    } catch (err) {
      console.error(`[AlphabetLearnerGame] Failed to load image for ${this.currentChar}:`, err);
    }
  }

  /**
   * Show shake animation for wrong answers
   */
  shakeCard() {
    const card = this.letterDisplay;
    card.classList.remove('shake-animation');
    // Trigger reflow to restart animation
    void card.offsetWidth;
    card.classList.add('shake-animation');
  }

  /**
   * Show feedback message
   * @param {string} emoji - Emoji to display
   * @param {string} type - 'correct' or 'incorrect'
   */
  showFeedback(emoji, type) {
    this.feedbackElement.textContent = emoji;
    this.feedbackElement.className = `feedback-display feedback-${type}`;
    this.feedbackElement.style.display = 'flex';

    setTimeout(() => {
      this.feedbackElement.style.display = 'none';
    }, 1000);
  }

  /**
   * Update which button is highlighted
   * @param {string} char - Character to highlight
   */
  updateButtonHighlights(char) {
    // Only update if buttons container exists (mobile/tablet)
    if (!this.buttonsContainer) return;

    const buttons = this.buttonsContainer.querySelectorAll('.char-button');
    buttons.forEach(btn => {
      if (btn.dataset.char === char) {
        btn.classList.add('highlighted');
      } else {
        btn.classList.remove('highlighted');
      }
    });
  }

  // ============================================
  // UI Creation
  // ============================================

  /**
   * Create game UI elements
   */
  createGameUI() {
    // Create main container
    this.gameContainer = document.createElement('div');
    this.gameContainer.className = 'game-container';
    this.gameContainer.id = 'alphabet-learner-game';

    // Header
    const header = document.createElement('div');
    header.className = 'game-header';

    const title = document.createElement('div');
    title.className = 'game-title';
    title.textContent = '🔤 Alphabet & Numbers';
    header.appendChild(title);

    const scoreAndMode = document.createElement('div');
    scoreAndMode.className = 'game-header-controls';

    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.className = 'game-score-display';
    this.scoreDisplay.textContent = 'Score: 0';
    scoreAndMode.appendChild(this.scoreDisplay);

    // Mode toggle button
    const modeToggle = document.createElement('button');
    modeToggle.className = 'mode-toggle-btn';
    modeToggle.textContent = 'A-Z';
    modeToggle.addEventListener('click', () => this.toggleMode());
    scoreAndMode.appendChild(modeToggle);

    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'game-back-btn';
    backBtn.textContent = '← Back';
    backBtn.addEventListener('click', () => this.onBackToLauncher());
    scoreAndMode.appendChild(backBtn);

    header.appendChild(scoreAndMode);
    this.gameContainer.appendChild(header);

    // Game content
    const content = document.createElement('div');
    content.className = 'game-content';

    // Display card
    const card = document.createElement('div');
    card.className = 'character-card';

    this.letterDisplay = document.createElement('div');
    this.letterDisplay.className = 'character-display display-letter display-active';
    this.letterDisplay.textContent = 'A';

    this.pictureDisplay = document.createElement('div');
    this.pictureDisplay.className = 'character-display display-picture';

    this.feedbackElement = document.createElement('div');
    this.feedbackElement.className = 'feedback-display';

    card.appendChild(this.letterDisplay);
    card.appendChild(this.pictureDisplay);
    card.appendChild(this.feedbackElement);
    content.appendChild(card);

    // Keyboard hints (hidden on mobile)
    if (this.platform.deviceDetector.shouldShowKeyboardHints()) {
      this.keyboardHints = document.createElement('div');
      this.keyboardHints.className = 'keyboard-hints';
      this.keyboardHints.innerHTML = '<small>Press the key on your keyboard</small>';
      content.appendChild(this.keyboardHints);
    }

    // Buttons container (hidden on desktop if keyboard is primary)
    if (this.platform.deviceDetector.shouldShowButtons()) {
      this.buttonsContainer = document.createElement('div');
      this.buttonsContainer.className = 'buttons-container';
      this.createCharacterButtons();
      content.appendChild(this.buttonsContainer);
    }

    this.gameContainer.appendChild(content);
  }

  /**
   * Create character buttons (A-Z and 0-9)
   */
  createCharacterButtons() {
    // Letters
    const lettersRow = document.createElement('div');
    lettersRow.className = 'button-row';

    for (let i = 0; i < 26; i++) {
      const char = String.fromCharCode(65 + i);
      const btn = this.createCharacterButton(char);
      lettersRow.appendChild(btn);
    }
    this.buttonsContainer.appendChild(lettersRow);

    // Numbers
    const numbersRow = document.createElement('div');
    numbersRow.className = 'button-row';

    for (let i = 0; i < 10; i++) {
      const char = i.toString();
      const btn = this.createCharacterButton(char);
      numbersRow.appendChild(btn);
    }
    this.buttonsContainer.appendChild(numbersRow);
  }

  /**
   * Create a single character button
   * @param {string} char - Character to display on button
   * @returns {HTMLElement}
   */
  createCharacterButton(char) {
    const btn = document.createElement('button');
    btn.className = 'char-button';
    btn.dataset.char = char;
    btn.textContent = char;
    btn.addEventListener('click', () => this.handleCharacterInput(char));
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      btn.classList.add('button-pressed');
      this.handleCharacterInput(char);
    });
    btn.addEventListener('touchend', () => {
      btn.classList.remove('button-pressed');
    });
    return btn;
  }

  /**
   * Setup keyboard and button input handlers
   */
  setupInputHandlers() {
    // Keyboard input for all letters and numbers
    for (let i = 0; i < 26; i++) {
      const char = String.fromCharCode(65 + i);
      this.platform.inputManager.onKey(char, () => this.handleCharacterInput(char));
    }

    for (let i = 0; i < 10; i++) {
      const char = i.toString();
      this.platform.inputManager.onKey(char, () => this.handleCharacterInput(char));
    }
  }

  /**
   * Update score display
   */
  updateScoreDisplay() {
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = `Score: ${this.score}`;
    }
  }

  /**
   * Show game UI
   */
  showGameUI() {
    const launcher = document.getElementById('launcher');
    const gameContainer = document.getElementById('gameContainer');

    if (launcher) launcher.style.display = 'none';
    if (gameContainer) {
      gameContainer.innerHTML = '';
      gameContainer.appendChild(this.gameContainer);
      gameContainer.style.display = 'flex';
    }
  }

  /**
   * Toggle between letters and numbers
   */
  toggleMode() {
    this.showLettersOnly = !this.showLettersOnly;
    this.reset();
    const modeBtn = document.querySelector('.mode-toggle-btn');
    if (modeBtn) {
      modeBtn.textContent = this.showLettersOnly ? 'A-Z' : '0-9';
    }
  }

  /**
   * Called when back button is clicked
   */
  onBackToLauncher() {
    this.stop();
    window.location.reload(); // Simple way to go back to launcher
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Fisher-Yates shuffle algorithm
   * @param {Array} array - Array to shuffle
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
