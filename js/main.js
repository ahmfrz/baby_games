/**
 * Baby Games Platform - Main Entry Point
 * Simplified interaction: Timer selection → Game selection → Game play
 */

import { gameRegistry } from '../core/GameRegistry.js';
import { TimerService } from '../services/TimerService.js';
import { AudioManager } from '../services/AudioManager.js';
import { InputManager } from '../services/InputManager.js';
import { AlphabetLearnerGame } from '../games/alphabet-learner/AlphabetLearnerGame.js';
import { ComicStoryGame } from '../games/comic-stories/ComicStoryGame.js';
import { FruitColorGame } from '../games/fruit-color/FruitColorGame.js';

// ============================================
// Platform Initialization
// ============================================

class BabyGamesPlatform {
  constructor() {
    this.timerService = new TimerService();
    this.audioManager = new AudioManager();
    this.inputManager = new InputManager();
    this.currentGame = null;
    this.isInitialized = false;
    this.gameContainerEl = null;
  }

  /**
   * Initialize the platform
   */
  async initialize() {
    console.log('[BabyGamesPlatform] Initializing...');

    try {
      // Initialize audio manager
      await this.audioManager.initialize();
      console.log(`[BabyGamesPlatform] Audio enabled`);

      // Initialize timer service
      this.timerService.initialize();
      console.log(`[BabyGamesPlatform] Timer duration: ${this.timerService.getDuration() / 60} minutes`);

      // Register games
      await this.registerGames();

      // Setup UI event listeners
      this.setupEventListeners();

      // Store reference to game container for games to mount UI into
      this.gameContainerEl = document.getElementById('gameContainer');

      // Wire up global input manager (keeps reference to gameContainer)
      try {
        this.inputManager.gameContainer = document.getElementById('gameContainer');
        this.inputManager.setupGlobalKeyHandlers();
        console.log('[BabyGamesPlatform] InputManager initialized');
      } catch (e) {
        console.warn('[BabyGamesPlatform] Failed to initialize InputManager', e);
      }

      // Show timer UI initially
      this.showTimerUI();

      this.isInitialized = true;
      console.log('[BabyGamesPlatform] Initialization complete');
    } catch (err) {
      console.error('[BabyGamesPlatform] Initialization failed:', err);
      alert('Failed to initialize platform');
    }
  }

  /**
   * Register all available games
   */
  async registerGames() {
    gameRegistry.register(AlphabetLearnerGame);
    gameRegistry.register(ComicStoryGame);
    gameRegistry.register(FruitColorGame);

    console.log(`[BabyGamesPlatform] Registered ${gameRegistry.getGameCount()} game(s)`);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Timer option click handlers
    document.querySelectorAll('.timer-option').forEach(option => {
      option.addEventListener('click', () => {
        const duration = Number(option.dataset.duration);
        this.handleTimerSelection(duration);
      });
    });

    // Listen for game selection
    document.addEventListener('selectGame', (e) => {
      this.launchGame(e.detail.gameId);
    });

    const pinInput = document.getElementById('pinInput');
    const pinCancel = document.getElementById('pinCancel');
    const resetTimerPinBtn = document.getElementById('resetTimerPinBtn');

    // Reset timer button triggers a PIN flow for resetting settings
    if (resetTimerPinBtn) {
      resetTimerPinBtn.addEventListener('click', async () => {
        const pin = await this.requestPin();
        if (pin === null) return;
        if (this.timerService.checkResetPin(pin)) {
          if (this.timerService.resetToDefault()) {
            alert('Timer settings have been reset to default.');
            this.updateTimerDisplay();
            this.closePinDialog();
          }
        } else {
          alert('Incorrect PIN. Please try again.');
        }
      });
    }

    // Basic input cleanup for PIN field
    if (pinInput) {
      pinInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
      });

      if (pinCancel) {
        pinCancel.addEventListener('click', () => this.closePinDialog());
      }
    }
  }

  /**
   * Show timer UI initially
   */
  async showTimerUI() {
    const timerSetup = document.getElementById('timerSetup');
    const launcher = document.getElementById('launcher');
    const gameContainer = document.getElementById('gameContainer');

    // Hide everything first
    if (gameContainer) gameContainer.style.display = 'none';
    if (launcher) launcher.style.display = 'none';

    // Show timer setup
    if (timerSetup) {
      timerSetup.style.display = 'flex';
      await this.animateEnter(timerSetup);
    }
  }

  /**
   * Handle timer selection
   * @param {string} duration - Duration in seconds
   */
  async handleTimerSelection(duration) {
    const durationInMinutes = Math.round(duration / 60);

    if (!this.timerService.setDuration(durationInMinutes)) {
      alert('Session is already in progress');
      return;
    }

    this.updateTimerDisplay();

    // Update UI to show selection
    document.querySelectorAll('.timer-option').forEach(option => {
      option.classList.toggle('active', option.dataset.duration === duration);
    });

    // Prompt for PIN before starting the session
    let waitingForValidPin = true;
    while (waitingForValidPin) {
      const pin = await this.requestPin();
      if (pin === null) {
        // User cancelled PIN entry — keep timer UI visible
        return;
      }
      if (this.timerService.checkResetPin(pin)) {
        // PIN correct — proceed to start session
        this.closePinDialog();
        await this.hideTimerUI();
        await this.showLauncher();
        waitingForValidPin = false;
      } else {
        alert('Incorrect PIN. Please try again.');
      }
    }
  }

  /**
   * Request PIN from the user. Returns the entered PIN string, or null if cancelled.
   * This sets up temporary listeners and resolves once submitted or cancelled.
   */
  requestPin() {
    return new Promise((resolve) => {
      const pinDialog = document.getElementById('pinDialog');
      const pinInput = document.getElementById('pinInput');
      const pinSubmit = document.getElementById('pinSubmit');
      const pinCancel = document.getElementById('pinCancel');

      if (!pinDialog || !pinInput || !pinSubmit) return resolve(null);

      const cleanup = () => {
        pinSubmit.removeEventListener('click', onSubmit);
        pinCancel && pinCancel.removeEventListener('click', onCancel);
        pinInput.removeEventListener('keypress', onKey);
      };

      const onSubmit = () => {
        const value = pinInput.value;
        cleanup();
        resolve(value);
      };

      const onCancel = () => {
        cleanup();
        resolve(null);
      };

      const onKey = (e) => {
        if (e.key === 'Enter') onSubmit();
      };

      pinDialog.classList.remove('hidden');
      pinInput.value = '';
      pinInput.focus();

      pinSubmit.addEventListener('click', onSubmit);
      pinCancel && pinCancel.addEventListener('click', onCancel);
      pinInput.addEventListener('keypress', onKey);
    });
  }

  /**
   * Update timer display in launcher
   */
  updateTimerDisplay() {
    const timerSetup = document.getElementById('timerSetup');
    const timerDisplay = document.getElementById('timerDisplay');

    if (timerSetup && timerDisplay) {
      const durationInMinutes = Math.round(this.timerService.getDuration() / 60);
      timerDisplay.textContent = `${durationInMinutes} minute${durationInMinutes === 1 ? '' : 's'}`;
    }
  }

  /**
   * Hide timer UI
   */
  async hideTimerUI() {
    const timerSetup = document.getElementById('timerSetup');

    if (timerSetup) {
      await this.animateExit(timerSetup);
      timerSetup.style.display = 'none';
    }
  }

  /**
   * Close PIN dialog
   */
  closePinDialog() {
    const pinDialog = document.getElementById('pinDialog');
    if (pinDialog) {
      pinDialog.classList.add('hidden');
    }
  }

  /**
   * Show launcher (game selection screen)
   */
  async showLauncher() {
    const launcher = document.getElementById('launcher');
    const gameContainer = document.getElementById('gameContainer');

    if (gameContainer) {
      gameContainer.style.display = 'none';
    }

    if (launcher) {
      launcher.style.display = 'flex';
      await this.animateEnter(launcher);

      // Populate games list
      const gamesList = document.getElementById('gamesList');
      if (gamesList) {
        gamesList.innerHTML = '';

        const games = gameRegistry.listGames();
        games.forEach((gameMetadata, index) => {
          const gameCard = this.createGameCard(gameMetadata);
          gamesList.appendChild(gameCard);

          setTimeout(() => {
            gameCard.style.opacity = '1';
            gameCard.style.transform = 'translateY(0)';
          }, index * 100);
        });
      }
    }
  }

  /**
   * Create a game card for the launcher
   * @param {Object} gameMetadata - Game metadata
   * @returns {HTMLElement}
   */
  createGameCard(gameMetadata) {
    const card = document.createElement('div');
    card.className = 'game-card';

    const emoji = gameMetadata.name.split(' ')[0] || '🎮';

    card.innerHTML = `
      <div class="game-card-emoji">${emoji}</div>
      <h3 class="game-card-title">${gameMetadata.name}</h3>
      <p class="game-card-description">${gameMetadata.description}</p>
    `;

    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';

    card.addEventListener('click', () => {
      this.launchGame(gameMetadata.id);
    });

    card.addEventListener('touchstart', (e) => {
      e.preventDefault();
      card.classList.add('active');
    });

    card.addEventListener('touchend', (e) => {
      e.preventDefault();
      card.classList.remove('active');
      this.launchGame(gameMetadata.id);
    });

    card.addEventListener('touchcancel', () => {
      card.classList.remove('active');
    });

    return card;
  }

  /**
   * Launch a game
   * @param {string} gameId - Game ID
   */
  async launchGame(gameId) {
    console.log(`[BabyGamesPlatform] Launching game: ${gameId}`);

    try {
      if (this.currentGame) {
        this.currentGame.cleanup();
      }

      const gameInstance = gameRegistry.instantiate(gameId, this);
      this.currentGame = gameInstance;

      await this.currentGame.initialize();
      this.currentGame.start();

      await this.hideLauncher();

      const gameContainer = document.getElementById('gameContainer');
      if (gameContainer) {
        gameContainer.style.display = 'flex';
        // Don't clear innerHTML — the game manages its own content via initialize/createGameUI/showGameUI
        await this.animateEnter(gameContainer);
      }

      console.log('[BabyGamesPlatform] Game launched successfully');
    } catch (err) {
      console.error('[BabyGamesPlatform] Failed to launch game:', err);

      // Show error message
      alert(`Failed to launch ${gameId}: ${err.message || err}`);

      // Go back to launcher
      await this.showLauncher();
    }
  }

  /**
   * Hide launcher
   */
  async hideLauncher() {
    const launcher = document.getElementById('launcher');

    if (launcher) {
      await this.animateExit(launcher);
      launcher.style.display = 'none';
    }
  }

  /**
   * Animate element entrance
   * @param {HTMLElement} element - DOM element
   */
  async animateEnter(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(0)';
    await this.delay(50);

    const anim = element.animate([
      { opacity: 0, transform: 'translateY(30px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], {
      duration: 500,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    });

    try { await anim.finished; } catch (e) { /* ignore */ }
    // Ensure final state is visible for future layout checks
    element.style.opacity = '1';
    element.style.transform = '';
  }

  /**
   * Animate element exit
   * @param {HTMLElement} element - DOM element
   */
  async animateExit(element) {
    const anim = element.animate([
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(0.95)' }
    ], {
      duration: 300,
      easing: 'ease-out'
    });

    try { await anim.finished; } catch (e) { /* ignore */ }
    // Ensure final state is hidden (but don't change display here)
    element.style.opacity = '0';
    element.style.transform = '';
  }

  /**
   * Delay utility
   * @param {number} ms - Milliseconds
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================
// Application Entry Point
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    const platform = new BabyGamesPlatform();
    await platform.initialize();
    window.babyGamesPlatform = platform;
  });
} else {
  const platform = new BabyGamesPlatform();
  platform.initialize();
  window.babyGamesPlatform = platform;
}

console.log('[BabyGamesPlatform] Script loaded, waiting for DOM...');
