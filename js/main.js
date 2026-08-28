/**
 * Baby Games Platform - Main Entry Point
 * Simplified interaction: Timer selection → Game selection → Game play
 */

import { gameRegistry } from '../core/GameRegistry.js';
import { TimerService } from '../services/TimerService.js';
import { AudioManager } from '../services/AudioManager.js';
import { InputManager } from '../services/InputManager.js';
import { AdManager } from '../services/AdManager.js';
import { tapFeedback } from '../services/FeedbackService.js';

// ============================================
// Platform Initialization
// ============================================

class BabyGamesPlatform {
  constructor() {
    this.timerService = new TimerService();
    this.audioManager = new AudioManager();
    this.inputManager = new InputManager();
    this.adManager = new AdManager();
    this.currentGame = null;
    this.isInitialized = false;
    this.gameContainerEl = null;
    this.timerWatchId = null;
    this.timerExpiryHandled = false;
    this.pinRequestActive = false;
    this.loadedGameStyles = new Set();
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
      this.startTimerWatchdog();
      console.log(`[BabyGamesPlatform] Timer duration: ${this.timerService.getDuration() / 60} minutes`);

      // Register games
      await this.registerGames();

      this.adManager.initialize();
      this.createRewardLayer();
      window.addEventListener('babyGameReward', (event) => this.showReward(event.detail || {}));
      this.setupGlobalFeedback();

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
    // Keep only lightweight metadata in the initial bundle. Each game module is
    // fetched with a native dynamic import when the child actually launches it.
    const games = [
      {
        id: 'alphabet-learner',
        name: 'ABC 123 Learner',
        icon: 'games/alphabet-learner/assets/images/A-apple.png',
        iconEmoji: '🍎',
        description: 'Learn letters and numbers with pictures, speech, and gentle play.',
        stylePath: 'games/alphabet-learner/styles.css',
        loader: () => import('../games/alphabet-learner/AlphabetLearnerGame.js'),
        exportName: 'AlphabetLearnerGame'
      },
      {
        id: 'comic-stories',
        name: '📖 Comic Stories',
        icon: 'games/comic-stories/assets/images/star-story/cover.svg',
        iconEmoji: '📖',
        description: 'Flip through comic-style storybooks, panel by panel.',
        stylePath: 'games/comic-stories/styles.css',
        loader: () => import('../games/comic-stories/ComicStoryGame.js'),
        exportName: 'ComicStoryGame'
      },
      {
        id: 'fruit-color',
        name: '🍎 Fruit Coloring',
        icon: 'games/fruit-color/assets/outlines/apple-outline.png',
        iconEmoji: '🍎',
        description: 'Paint friendly fruits with big, easy strokes.',
        stylePath: 'games/fruit-color/styles.css',
        loader: () => import('../games/fruit-color/FruitColorGame.js'),
        exportName: 'FruitColorGame'
      },
      {
        id: 'star-collector',
        name: '⭐ Star Catch',
        iconEmoji: '⭐',
        description: 'Tap the big twinkling stars as they slowly float up into the sky.',
        stylePath: 'styles/simple-games.css',
        loader: () => import('../games/star-collector/StarCollectorGame.js'),
        exportName: 'StarCollectorGame'
      },
      {
        id: 'fruit-slice',
        name: '🍉 Fruit Slice',
        iconEmoji: '🍉',
        description: 'Swipe through big floating fruit with your finger.',
        stylePath: 'styles/simple-games.css',
        loader: () => import('../games/fruit-slice/FruitSliceGame.js'),
        exportName: 'FruitSliceGame'
      },
      {
        id: 'shape-pop',
        name: '🔷 Shape Pop',
        iconEmoji: '🔷',
        description: 'Find and tap the huge friendly shape shown at the top.',
        stylePath: 'styles/simple-games.css',
        loader: () => import('../games/shape-pop/ShapePopGame.js'),
        exportName: 'ShapePopGame'
      },
      {
        id: 'pinch-pop',
        name: '🤏 Nest & Move',
        iconEmoji: '🤏',
        description: 'Move shiny treasures between cozy nests. Tap or pinch to play.',
        stylePath: 'styles/simple-games.css',
        loader: () => import('../games/pinch-pop/PinchPopGame.js'),
        exportName: 'PinchPopGame'
      }
      ,{
        id: 'language-adventures',
        name: '🗣️ Little Adventures',
        icon: 'games/language-adventures/assets/scenes/park.png',
        description: 'Play little stories while learning easy English phrases.',
        stylePath: 'games/language-adventures/styles.css',
        loader: () => import('../games/language-adventures/LanguageAdventureGame.js'),
        exportName: 'LanguageAdventureGame'
      }
    ];

    games.forEach(({ loader, exportName, ...metadata }) => {
      gameRegistry.registerLazy(metadata, loader, exportName);
    });

    console.log(`[BabyGamesPlatform] Registered ${gameRegistry.getGameCount()} lazy game(s)`);
  }


  async ensureGameStyles(gameMetadata) {
    const href = gameMetadata?.stylePath;
    if (!href || this.loadedGameStyles.has(href)) return;

    const existing = document.querySelector(`link[data-game-style="${href}"]`);
    if (existing) {
      this.loadedGameStyles.add(href);
      return;
    }

    await new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.gameStyle = href;
      link.onload = resolve;
      link.onerror = () => reject(new Error(`Could not load game styles: ${href}`));
      document.head.appendChild(link);
    });

    this.loadedGameStyles.add(href);
  }

  createRewardLayer() {
    if (document.getElementById('rewardLayer')) return;
    const layer = document.createElement('div');
    layer.id = 'rewardLayer';
    layer.className = 'reward-layer';
    layer.setAttribute('aria-live', 'polite');
    layer.innerHTML = '<div class="reward-message"><span class="reward-emoji">✨</span><span class="reward-text">Great!</span></div><div class="reward-particles" aria-hidden="true"></div>';
    document.body.appendChild(layer);

  }

  showReward(detail = {}) {
    const layer = document.getElementById('rewardLayer');
    if (!layer) return;

    const message = detail.message || 'Great!';
    const emoji = detail.emoji || '✨';
    const count = Math.min(22, Math.max(8, Number(detail.particles) || 14));
    const messageEl = layer.querySelector('.reward-message');
    const emojiEl = layer.querySelector('.reward-emoji');
    const textEl = layer.querySelector('.reward-text');
    const particles = layer.querySelector('.reward-particles');

    emojiEl.textContent = emoji;
    textEl.textContent = message;
    particles.innerHTML = '';

    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement('span');
      particle.className = 'reward-particle';
      particle.textContent = ['✨', '⭐', '💖', '🎈', '🌟'][i % 5];
      particle.style.setProperty('--x', `${-45 + Math.random() * 90}vw`);
      particle.style.setProperty('--y', `${-30 - Math.random() * 55}vh`);
      particle.style.setProperty('--delay', `${Math.random() * 0.12}s`);
      particle.style.setProperty('--spin', `${-180 + Math.random() * 360}deg`);
      particles.appendChild(particle);
    }

    layer.classList.remove('reward-show');
    messageEl.classList.remove('reward-message-pop');
    void layer.offsetWidth;
    void messageEl.offsetWidth;
    layer.classList.add('reward-show');
    messageEl.classList.add('reward-message-pop');

    clearTimeout(this.rewardHideId);
    this.rewardHideId = setTimeout(() => layer.classList.remove('reward-show'), 1150);
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
    const customTimerBtn = document.getElementById('customTimerBtn');

    if (customTimerBtn) customTimerBtn.addEventListener('click', () => this.handleCustomDuration());

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

    this.hideGameNavigation();
    if (this.adManager) this.adManager.render();

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
    const seconds = Number(duration);
    if (!Number.isFinite(seconds) || seconds < 30) return;

    const pin = await this.requestPin();
    if (pin === null) return;
    if (!this.timerService.checkResetPin(pin)) {
      alert('Incorrect PIN. Please try again.');
      return;
    }

    if (!this.timerService.setDurationSeconds(seconds)) {
      alert('Unable to set that timer length.');
      return;
    }

    this.timerService.clearSession();
    this.timerExpiryHandled = false;
    this.updateTimerDisplay();
    document.querySelectorAll('.timer-option').forEach(option => {
      option.classList.toggle('active', Number(option.dataset.duration) === seconds);
    });

    this.closePinDialog();
    this.timerService.startSession();
    await this.hideTimerUI();
    await this.showLauncher();
  }

  async handleCustomDuration() {
    const minutesInput = document.getElementById('customMinutesInput');
    const minutes = Number(minutesInput?.value);
    if (!Number.isFinite(minutes) || minutes < 0.5 || minutes > 1440) {
      alert('Please enter a time between 0.5 and 1440 minutes.');
      return;
    }
    const seconds = Math.round(minutes * 60);
    await this.handleTimerSelection(seconds);
  }

  /**
   * Request PIN from the user. Returns the entered PIN string, or null if cancelled.
   * This sets up temporary listeners and resolves once submitted or cancelled.
   */
  requestPin(options = {}) {
    const {
      title = '🔐 PIN Required',
      description = 'Enter PIN to reset timer settings',
      cancelable = true
    } = options;

    if (this.pinRequestActive) return Promise.resolve(null);

    return new Promise((resolve) => {
      const pinDialog = document.getElementById('pinDialog');
      const pinInput = document.getElementById('pinInput');
      const pinSubmit = document.getElementById('pinSubmit');
      const pinCancel = document.getElementById('pinCancel');
      const titleEl = pinDialog?.querySelector('.pin-dialog-title');
      const descriptionEl = pinDialog?.querySelector('.pin-dialog-description');

      if (!pinDialog || !pinInput || !pinSubmit) return resolve(null);

      this.pinRequestActive = true;
      const previousTitle = titleEl?.textContent;
      const previousDescription = descriptionEl?.textContent;
      const previousCancelDisplay = pinCancel?.style.display || '';

      const cleanup = () => {
        pinSubmit.removeEventListener('click', onSubmit);
        pinCancel && pinCancel.removeEventListener('click', onCancel);
        pinInput.removeEventListener('keypress', onKey);
        if (titleEl && previousTitle != null) titleEl.textContent = previousTitle;
        if (descriptionEl && previousDescription != null) descriptionEl.textContent = previousDescription;
        if (pinCancel) pinCancel.style.display = previousCancelDisplay;
        this.pinRequestActive = false;
      };

      const onSubmit = () => {
        const value = pinInput.value;
        cleanup();
        resolve(value);
      };

      const onCancel = () => {
        if (!cancelable) return;
        cleanup();
        resolve(null);
      };

      const onKey = (e) => {
        if (e.key === 'Enter') onSubmit();
      };

      if (titleEl) titleEl.textContent = title;
      if (descriptionEl) descriptionEl.textContent = description;
      if (pinCancel) pinCancel.style.display = cancelable ? '' : 'none';

      pinDialog.classList.remove('hidden');
      pinInput.value = '';
      setTimeout(() => pinInput.focus(), 0);

      pinSubmit.addEventListener('click', onSubmit);
      pinCancel && pinCancel.addEventListener('click', onCancel);
      pinInput.addEventListener('keypress', onKey);
    });
  }

  /**
   * Continuously enforce the session deadline. The countdown is persisted, so
   * simply navigating between games must never restart or bypass it.
   */
  startTimerWatchdog() {
    if (this.timerWatchId) clearInterval(this.timerWatchId);

    this.timerWatchId = setInterval(() => {
      if (this.timerService.hasActiveSession()) {
        this.timerExpiryHandled = false;
        this.updateGlobalTime();
        return;
      }

      // A session only needs enforcement after it has actually been started.
      const hasStoredSession = Boolean(this.timerService.sessionEndAt);
      if (hasStoredSession && !this.timerExpiryHandled) {
        this.enforceTimerExpiry();
      }
    }, 250);

    // Handle a session that expired while the page was backgrounded.
    if (this.timerService.sessionEndAt && !this.timerService.hasActiveSession()) {
      this.enforceTimerExpiry();
    }
  }

  async enforceTimerExpiry() {
    if (this.timerExpiryHandled || this.pinRequestActive) return;
    this.timerExpiryHandled = true;

    console.log('[BabyGamesPlatform] Session timer expired; locking gameplay.');

    // Stop the current game immediately. Do not let a game continue underneath
    // the PIN dialog.
    if (this.currentGame) {
      try { this.currentGame.stop(); } catch (e) { console.warn('[BabyGamesPlatform] Game stop failed:', e); }
      try { this.currentGame.cleanup(); } catch (e) { console.warn('[BabyGamesPlatform] Game cleanup failed:', e); }
      this.currentGame = null;
    }

    this.hideGameNavigation();

    const pin = await this.requestPin({
      title: '⏰ Time Is Up',
      description: 'Enter the parent PIN to start another play session.',
      cancelable: false
    });

    // The dialog is intentionally non-cancelable. Incorrect PINs leave the app
    // locked, so there is no way for a child to continue after the timer ends.
    if (pin !== null && this.timerService.checkResetPin(pin)) {
      this.closePinDialog();
      this.timerService.clearSession();
      this.timerExpiryHandled = false;
      await this.showTimerUI();
      return;
    }

    // Keep the expired session represented as an expired session and show the
    // PIN dialog again. This also handles an incorrect PIN without allowing
    // gameplay to resume.
    if (pin !== null) {
      alert('Incorrect PIN. Please try again.');
    }
    this.timerExpiryHandled = false;
    setTimeout(() => this.enforceTimerExpiry(), 0);
  }

  /**
   * Update timer display in launcher
   */
  updateTimerDisplay() {
    const timerSetup = document.getElementById('timerSetup');
    const timerDisplay = document.getElementById('timerDisplay');

    if (timerSetup && timerDisplay) {
      const seconds = this.timerService.getDuration();
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      timerDisplay.textContent = secs ? `${minutes}m ${secs}s` : `${minutes} minute${minutes === 1 ? '' : 's'}`;
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
      this.adManager?.render?.();
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
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'game-card';
    card.dataset.gameId = gameMetadata.id;
    card.setAttribute('aria-label', `Play ${gameMetadata.name.replace(/^[^\p{L}\p{N}]+/u, '').trim()}`);

    const icon = document.createElement('div');
    icon.className = 'game-card-icon';
    icon.setAttribute('aria-hidden', 'true');

    if (gameMetadata.icon) {
      const image = document.createElement('img');
      image.src = gameMetadata.icon;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('error', () => {
        icon.classList.add('emoji-fallback');
        icon.textContent = gameMetadata.iconEmoji || gameMetadata.name.split(' ')[0] || '🎮';
      }, { once: true });
      icon.appendChild(image);
    } else {
      icon.textContent = gameMetadata.iconEmoji || gameMetadata.name.split(' ')[0] || '🎮';
    }

    const title = document.createElement('h3');
    title.className = 'game-card-title';
    title.textContent = gameMetadata.name.replace(/^[^\p{L}\p{N}]+/u, '').trim();

    const description = document.createElement('p');
    description.className = 'game-card-description';
    description.textContent = gameMetadata.description;

    const play = document.createElement('span');
    play.className = 'game-card-play';
    play.textContent = 'Play';
    play.setAttribute('aria-hidden', 'true');

    card.append(icon, title, description, play);
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';

    card.addEventListener('click', () => this.launchGame(gameMetadata.id));
    return card;
  }

  setupGlobalFeedback() {
    document.addEventListener('pointerdown', (event) => {
      const target = event.target.closest('button, .timer-option, .game-card, .shape-target, .star-target, .fruit-target');
      if (target) tapFeedback(this.audioManager, 'click');
    }, { passive: true });

    const secretAdToggle = async () => {
      const pin = await this.requestPin();
      if (pin === null) return;
      if (this.timerService.checkResetPin(pin)) {
        if (this.adManager.isDisabled()) this.adManager.enable();
        else this.adManager.disable();
        this.closePinDialog();
      } else {
        alert('Incorrect PIN.');
      }
    };

    const adBanner = document.getElementById('adBanner');
    if (adBanner) {
      let taps = 0;
      let resetTapTimer = null;
      adBanner.addEventListener('click', () => {
        taps += 1;
        clearTimeout(resetTapTimer);
        resetTapTimer = setTimeout(() => { taps = 0; }, 900);
        if (taps >= 5) { taps = 0; secretAdToggle(); }
      });
    }

    const timerTitle = document.querySelector('.timer-setup-title');
    if (timerTitle) {
      let taps = 0; let resetTapTimer = null;
      timerTitle.addEventListener('click', () => {
        taps += 1; clearTimeout(resetTapTimer);
        resetTapTimer = setTimeout(() => { taps = 0; }, 1000);
        if (taps >= 5) { taps = 0; secretAdToggle(); }
      });
    }
  }

  showGameNavigation() {
    let nav = document.getElementById('gameNavOverlay');
    if (!nav) {
      nav = document.createElement('div');
      nav.id = 'gameNavOverlay';
      nav.className = 'game-nav-overlay';
      nav.innerHTML = `
        <button type="button" id="changeGameBtn" class="game-nav-button">🎮 Change Game</button>
        <div class="game-nav-time">⏳ <span id="globalRemainingTime">0:00</span></div>`;
      document.body.appendChild(nav);
      nav.querySelector('#changeGameBtn').addEventListener('click', () => this.showLauncherPreservingSession());
    }
    nav.style.display = 'flex';
    this.updateGlobalTime();
    if (!this.globalTimeId) this.globalTimeId = setInterval(() => this.updateGlobalTime(), 1000);
  }

  hideGameNavigation() {
    const nav = document.getElementById('gameNavOverlay');
    if (nav) nav.style.display = 'none';
    if (this.globalTimeId) { clearInterval(this.globalTimeId); this.globalTimeId = null; }
  }

  updateGlobalTime() {
    const el = document.getElementById('globalRemainingTime');
    const seconds = this.timerService.getRemainingSeconds();
    if (el) {
      const min = Math.floor(seconds / 60);
      const sec = String(seconds % 60).padStart(2, '0');
      el.textContent = `${min}:${sec}`;
    }
  }

  async showLauncherPreservingSession() {
    if (this.currentGame) {
      this.currentGame.stop();
      this.currentGame.cleanup();
      this.currentGame = null;
    }
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) gameContainer.style.display = 'none';
    const adBanner = document.getElementById('adBanner');
    if (adBanner) adBanner.style.display = 'none';
    await this.showLauncher();
    this.showGameNavigation();
  }

  /**
   * Launch a game
   * @param {string} gameId - Game ID
   */
  async launchGame(gameId) {
    console.log(`[BabyGamesPlatform] Launching game: ${gameId}`);

    try {
      if (!this.timerService.hasActiveSession()) {
        // Never allow a game to start without a valid session. The watchdog
        // normally handles this, but this guard prevents a race/bypass.
        await this.enforceTimerExpiry();
        return;
      }

      if (this.currentGame) {
        try { this.currentGame.stop(); } catch (e) {}
        try { this.currentGame.cleanup(); } catch (e) {}
        this.currentGame = null;
      }
      this.hideGameNavigation();

      const gameMetadata = gameRegistry.listGames().find((game) => game.id === gameId);
      if (!gameMetadata) throw new Error(`Unknown game: ${gameId}`);

      const adBanner = document.getElementById('adBanner');
      if (adBanner) { adBanner.style.display = 'none'; adBanner.innerHTML = ''; }

      const gameHost = document.getElementById('gameContainer');
      if (gameHost) {
        gameHost.replaceChildren();
        gameHost.style.display = 'none';
      }

      await this.ensureGameStyles(gameMetadata);
      const gameInstance = await gameRegistry.instantiate(gameId, this);
      if (gameInstance?.constructor?.metadata?.id !== gameId) {
        throw new Error(`Loaded game does not match requested game: ${gameId}`);
      }
      this.currentGame = gameInstance;

      const gameContainer = document.getElementById('gameContainer');
      // Make the host measurable before game initialization/start. Some games
      // calculate touch targets from the stage dimensions during start().
      if (gameContainer) gameContainer.style.display = 'flex';
      await this.hideLauncher();

      await this.currentGame.initialize();
      this.currentGame.start();

      if (gameContainer) {
        // Don't clear innerHTML — the game manages its own content via initialize/createGameUI/showGameUI
        await this.animateEnter(gameContainer);
      }

      this.showGameNavigation();
      console.log('[BabyGamesPlatform] Game launched successfully');
    } catch (err) {
      console.error('[BabyGamesPlatform] Failed to launch game:', err);

      if (this.currentGame) {
        try { this.currentGame.stop(); } catch (e) {}
        try { this.currentGame.cleanup(); } catch (e) {}
        this.currentGame = null;
      }
      const gameContainer = document.getElementById('gameContainer');
      if (gameContainer) gameContainer.replaceChildren();

      alert(`Failed to launch ${gameId}: ${err.message || err}`);
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
