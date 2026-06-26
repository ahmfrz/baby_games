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
    this.sessionTimerDuration = 120; // default timer in seconds (2 minutes)
    this.remainingSeconds = 120;
    this.timerInterval = null;
    this.isSessionActive = false;
    this.gameMode = 'random'; // 'random' or 'sequence'
    this.gameDataMap = new Map(); // Maps characters to image/sound data
    
    // UI elements
    this.letterDisplay = null;
    this.pictureDisplay = null;
    this.scoreDisplay = null;
    this.buttonsContainer = null;
    this.keyboardHints = null;
    this.feedbackElement = null;
    this.timerDisplay = null;
    this.timerSelect = null;
    this.startSessionBtn = null;
    this.sparkleField = null;
    this.rewardLayer = null;
    this.ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    
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

    this.isRunning = false;
    this.isSessionActive = false;
    this.score = 0;
    this.charIndex = 0;
    this.remainingSeconds = this.sessionTimerDuration;
    this.sessionStartTime = null;

    // Prepare character list for the upcoming session
    this.prepareCharacterList();

    // Show game UI and timer controls
    this.updateScoreDisplay();
    this.showGameUI();
    this.updateTimerDisplay();
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
    this.isSessionActive = false;
    this.stopSpeech();
    this.platform.inputManager.clear();
    this.clearTimerInterval();

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
    this.stopSpeech();
    this.clearTimerInterval();
    this.score = 0;
    this.charIndex = 0;
    this.currentChar = null;
    this.isWaitingForInput = false;
    this.inputLocked = false;
    this.isSessionActive = false;
    this.remainingSeconds = this.sessionTimerDuration;
    this.prepareCharacterList();
    this.updateScoreDisplay();
    this.updateTimerDisplay();
  }

  // ============================================
  // Game Logic
  // ============================================

  /**
   * Prepare the list of characters to display
   */
  prepareCharacterList() {
    this.charList = [];

    for (let i = 0; i < 26; i++) {
      this.charList.push(String.fromCharCode(65 + i)); // A-Z
    }

    for (let i = 0; i < 10; i++) {
      this.charList.push(i.toString()); // 0-9
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
    this.speakPrompt();
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
    this.showRewardBurst();
    this.speakCorrectAnswer();

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
    this.speakWrongAnswer();

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
   * Show a short star burst to reward the correct answer.
   */
  showRewardBurst() {
    if (!this.rewardLayer) return;

    this.rewardLayer.innerHTML = '';
    const stars = 12;

    for (let i = 0; i < stars; i++) {
      const star = document.createElement('span');
      star.className = 'reward-star';
      star.style.setProperty('--angle', `${(360 / stars) * i}deg`);
      star.style.setProperty('--distance', `${75 + (i % 3) * 18}px`);
      star.style.setProperty('--delay', `${(i % 4) * 35}ms`);
      this.rewardLayer.appendChild(star);
    }

    setTimeout(() => {
      if (this.rewardLayer) {
        this.rewardLayer.innerHTML = '';
      }
    }, 1100);
  }

  /**
   * Speak the current learning prompt when browser TTS is available.
   */
  speakPrompt() {
    this.speak(`Where is ${this.getSpokenCharacter(this.currentChar)}?`);
  }

  /**
   * Speak a positive reinforcement phrase for the current character.
   */
  speakCorrectAnswer() {
    const charData = this.gameDataMap.get(this.currentChar);
    const spokenChar = this.getSpokenCharacter(this.currentChar);

    if (charData && charData.name) {
      this.speak(`Correct, ${spokenChar} for ${charData.name}!`);
      return;
    }

    this.speak(`Correct, ${spokenChar}!`);
  }

  /**
   * Speak a gentle retry prompt.
   */
  speakWrongAnswer() {
    this.speak('Oh! That is not right, try again!');
  }

  /**
   * Speak text using the browser's free built-in speech synthesis.
   * @param {string} text - Text to speak
   */
  speak(text) {
    if (!this.ttsSupported || !text) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.82;
      utterance.pitch = 1.18;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[AlphabetLearnerGame] Text-to-speech failed:', err);
    }
  }

  /**
   * Stop any queued or active speech.
   */
  stopSpeech() {
    if (!this.ttsSupported) return;

    try {
      window.speechSynthesis.cancel();
    } catch (err) {
      console.warn('[AlphabetLearnerGame] Failed to stop speech:', err);
    }
  }

  /**
   * Make letters and numbers sound natural in spoken prompts.
   * @param {string} char - Current character
   * @returns {string}
   */
  getSpokenCharacter(char) {
    const charData = this.gameDataMap.get(char);

    if (/^\d$/.test(char) && charData && charData.name) {
      return charData.name;
    }

    return char;
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

    this.sparkleField = document.createElement('div');
    this.sparkleField.className = 'sparkle-field';
    this.sparkleField.setAttribute('aria-hidden', 'true');
    this.createSparkleField();
    this.gameContainer.appendChild(this.sparkleField);

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

    // Order mode button
    const modeToggle = document.createElement('button');
    modeToggle.className = 'mode-toggle-btn';
    modeToggle.textContent = this.getModeButtonText();
    modeToggle.setAttribute('aria-label', 'Switch between random and sequence order');
    modeToggle.addEventListener('click', () => this.toggleOrderMode());
    scoreAndMode.appendChild(modeToggle);

    // Timer select
    this.timerSelect = document.createElement('select');
    this.timerSelect.className = 'timer-select';
    this.timerSelect.setAttribute('aria-label', 'Select session duration');
    ['1', '2', '3', '5'].forEach(minutes => {
      const option = document.createElement('option');
      option.value = String(minutes * 60);
      option.textContent = `${minutes} minute${minutes === '1' ? '' : 's'}`;
      if (Number(option.value) === this.sessionTimerDuration) {
        option.selected = true;
      }
      this.timerSelect.appendChild(option);
    });
    this.timerSelect.addEventListener('change', () => {
      this.sessionTimerDuration = Number(this.timerSelect.value);
      this.remainingSeconds = this.sessionTimerDuration;
      this.updateTimerDisplay();
    });
    scoreAndMode.appendChild(this.timerSelect);

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

    this.rewardLayer = document.createElement('div');
    this.rewardLayer.className = 'reward-burst';
    this.rewardLayer.setAttribute('aria-hidden', 'true');

    card.appendChild(this.letterDisplay);
    card.appendChild(this.pictureDisplay);
    card.appendChild(this.feedbackElement);
    card.appendChild(this.rewardLayer);
    content.appendChild(card);

    // Keyboard hints (desktop only)
    if (this.platform.deviceDetector.shouldShowKeyboardHints()) {
      this.keyboardHints = document.createElement('div');
      this.keyboardHints.className = 'keyboard-hints';
      this.keyboardHints.innerHTML = '<small>Press the key on your keyboard</small>';
      content.appendChild(this.keyboardHints);
    }

    // On-screen keyboard buttons (always visible)
    this.buttonsContainer = document.createElement('div');
    this.buttonsContainer.className = 'buttons-container';
    this.createCharacterButtons();
    content.appendChild(this.buttonsContainer);

    this.gameContainer.appendChild(content);

    // Timer panel display
    const timerPanel = document.createElement('div');
    timerPanel.className = 'timer-panel';
    this.timerDisplay = document.createElement('div');
    this.timerDisplay.className = 'timer-display';
    timerPanel.appendChild(this.timerDisplay);

    this.startSessionBtn = document.createElement('button');
    this.startSessionBtn.className = 'start-session-btn';
    this.startSessionBtn.textContent = 'Start Session';
    this.startSessionBtn.addEventListener('click', () => this.startSession());
    timerPanel.appendChild(this.startSessionBtn);

    content.appendChild(timerPanel);
  }

  /**
   * Create slow floating stars in the background.
   */
  createSparkleField() {
    const stars = [
      { x: 8, y: 18, size: 22, delay: 0, duration: 6.2 },
      { x: 18, y: 72, size: 16, delay: 1.1, duration: 7.4 },
      { x: 31, y: 9, size: 14, delay: 2.2, duration: 6.8 },
      { x: 73, y: 13, size: 18, delay: 0.7, duration: 7.1 },
      { x: 88, y: 34, size: 24, delay: 1.6, duration: 6.5 },
      { x: 82, y: 76, size: 15, delay: 2.7, duration: 7.8 },
      { x: 48, y: 83, size: 20, delay: 0.4, duration: 7.2 },
      { x: 6, y: 48, size: 13, delay: 3.1, duration: 6.9 }
    ];

    stars.forEach((config, index) => {
      const star = document.createElement('span');
      star.className = 'floating-star';
      star.style.setProperty('--x', `${config.x}%`);
      star.style.setProperty('--y', `${config.y}%`);
      star.style.setProperty('--size', `${config.size}px`);
      star.style.setProperty('--delay', `${config.delay}s`);
      star.style.setProperty('--duration', `${config.duration}s`);
      star.style.setProperty('--spin', index % 2 === 0 ? '10deg' : '-12deg');
      this.sparkleField.appendChild(star);
    });
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

    this.updateTimerDisplay();
  }

  /**
   * Toggle between random and sequential order.
   */
  toggleOrderMode() {
    this.gameMode = this.gameMode === 'random' ? 'sequence' : 'random';
    this.reset();
    this.updateModeButton();
  }

  /**
   * Start the timed session.
   */
  startSession() {
    if (this.isSessionActive) return;

    this.isRunning = true;
    this.isSessionActive = true;
    this.sessionStartTime = Date.now();
    this.remainingSeconds = this.sessionTimerDuration;
    this.updateTimerDisplay();
    this.startSessionBtn.textContent = 'Session Running';
    this.startSessionBtn.disabled = true;

    this.prepareCharacterList();
    this.nextRound();

    this.clearTimerInterval();
    this.timerInterval = setInterval(() => {
      this.remainingSeconds -= 1;
      this.updateTimerDisplay();

      if (this.remainingSeconds <= 0) {
        this.endSession();
      }
    }, 1000);
  }

  /**
   * End the timed session and stop the game.
   */
  endSession() {
    if (!this.isSessionActive) return;

    this.isSessionActive = false;
    this.isRunning = false;
    this.clearTimerInterval();
    this.startSessionBtn.textContent = 'Start Session';
    this.startSessionBtn.disabled = false;
    this.showFeedback('⏰', 'session-ended');
    this.platform.storageManager.set('lastSessionSummary', {
      score: this.score,
      duration: this.sessionTimerDuration - this.remainingSeconds,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Clear the timer interval.
   */
  clearTimerInterval() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Update the timer display text.
   */
  updateTimerDisplay() {
    if (!this.timerDisplay) return;

    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    this.timerDisplay.textContent = `Time: ${formatted}`;
  }

  /**
   * Update order mode button label.
   */
  updateModeButton() {
    const modeBtn = this.gameContainer.querySelector('.mode-toggle-btn');
    if (!modeBtn) return;

    modeBtn.textContent = this.getModeButtonText();
  }

  /**
   * Get visible label for the current order mode.
   * @returns {string}
   */
  getModeButtonText() {
    return this.gameMode === 'random' ? 'Random' : 'Sequence';
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
