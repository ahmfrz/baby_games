/**
 * Baby Games Platform - Main Entry Point
 * Initializes platform services, loads games, and manages application flow
 */

import { gameRegistry } from '../core/GameRegistry.js';
import { eventEmitter } from '../core/EventEmitter.js';
import { inputManager } from '../services/InputManager.js';
import { audioManager } from '../services/AudioManager.js';
import { storageManager } from '../services/StorageManager.js';
import { assetManager } from '../services/AssetManager.js';
import { deviceDetector } from '../services/DeviceDetector.js';
import { adManager } from '../services/AdManager.js';
import { AlphabetLearnerGame } from '../games/alphabet-learner/AlphabetLearnerGame.js';

// ============================================
// Platform Initialization
// ============================================

class BabyGamesPlatform {
  constructor() {
    this.services = {
      inputManager,
      audioManager,
      storageManager,
      assetManager,
      deviceDetector,
      adManager,
      eventEmitter
    };

    this.currentGame = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the platform
   */
  async initialize() {
    console.log('[BabyGamesPlatform] Initializing...');

    try {
      // Initialize device detector
      deviceDetector.initialize();
      console.log(`[BabyGamesPlatform] Device: ${deviceDetector.getDeviceType()}`);

      // Initialize input manager
      inputManager.initialize();

      // Load ad configuration
      try {
        const adConfig = await fetch('config/ads.json').then(r => r.json());
        await adManager.initialize(adConfig);
      } catch (err) {
        console.warn('[BabyGamesPlatform] Failed to load ad config:', err);
      }

      // Register games
      this.registerGames();

      // Setup UI event listeners
      this.setupEventListeners();

      // Load and display launcher
      this.showLauncher();

      this.isInitialized = true;
      console.log('[BabyGamesPlatform] Initialization complete');
    } catch (err) {
      console.error('[BabyGamesPlatform] Initialization failed:', err);
      this.showError('Failed to initialize platform', err);
    }
  }

  /**
   * Register all available games
   */
  registerGames() {
    gameRegistry.register(AlphabetLearnerGame);
    // Future games will be registered here
    console.log(`[BabyGamesPlatform] Registered ${gameRegistry.getGameCount()} game(s)`);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for game selection
    document.addEventListener('selectGame', (e) => {
      this.launchGame(e.detail.gameId);
    });

    // Initialize audio on first user interaction
    document.addEventListener('click', () => {
      audioManager.initialize().catch(err => {
        console.warn('[BabyGamesPlatform] Audio init on click failed:', err);
      });
    }, { once: true });

    document.addEventListener('touchstart', () => {
      audioManager.initialize().catch(err => {
        console.warn('[BabyGamesPlatform] Audio init on touch failed:', err);
      });
    }, { once: true });
  }

  /**
   * Display launcher (game selection screen)
   */
  showLauncher() {
    const launcher = document.getElementById('launcher');
    const gameContainer = document.getElementById('gameContainer');

    if (gameContainer) gameContainer.style.display = 'none';
    if (launcher) launcher.style.display = 'flex';

    // Populate games list
    const gamesList = document.getElementById('gamesList');
    if (gamesList) {
      gamesList.innerHTML = '';

      const games = gameRegistry.listGames();
      games.forEach(gameMetadata => {
        const gameCard = this.createGameCard(gameMetadata);
        gamesList.appendChild(gameCard);
      });
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
    card.innerHTML = `
      <div class="game-card-emoji">${gameMetadata.name.split(' ')[0]}</div>
      <h3 class="game-card-title">${gameMetadata.name}</h3>
      <p class="game-card-description">${gameMetadata.description}</p>
    `;

    card.addEventListener('click', () => {
      this.launchGame(gameMetadata.id);
    });

    card.addEventListener('touchstart', (e) => {
      e.preventDefault();
      card.classList.add('active');
    });

    card.addEventListener('touchend', () => {
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
      // Cleanup previous game if running
      if (this.currentGame) {
        this.currentGame.cleanup();
      }

      // Instantiate game
      this.currentGame = gameRegistry.instantiate(gameId, this.services);

      // Initialize game (load assets, setup UI)
      await this.currentGame.initialize();

      // Start game
      this.currentGame.start();

      // Hide launcher
      const launcher = document.getElementById('launcher');
      if (launcher) launcher.style.display = 'none';

      // Show game container
      const gameContainer = document.getElementById('gameContainer');
      if (gameContainer) gameContainer.style.display = 'flex';
    } catch (err) {
      console.error('[BabyGamesPlatform] Failed to launch game:', err);
      this.showError(`Failed to launch ${gameId}`, err);
    }
  }

  /**
   * Show error message
   * @param {string} title - Error title
   * @param {Error} err - Error object
   */
  showError(title, err) {
    console.error(`[BabyGamesPlatform] ${title}:`, err);
    alert(`${title}\n\n${err.message || err}`);
  }
}

// ============================================
// Application Entry Point
// ============================================

// Initialize platform when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    const platform = new BabyGamesPlatform();
    await platform.initialize();
    window.babyGamesPlatform = platform; // Expose globally for debugging
  });
} else {
  const platform = new BabyGamesPlatform();
  platform.initialize().catch(err => {
    console.error('[BabyGamesPlatform] Fatal error:', err);
  });
  window.babyGamesPlatform = platform; // Expose globally for debugging
}

console.log('[BabyGamesPlatform] Script loaded, waiting for DOM...');
