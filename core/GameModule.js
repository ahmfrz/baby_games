/**
 * Base class for all games. All games must extend this class and implement required methods.
 */
export class GameModule {
  /**
   * Static metadata for the game
   * Must be overridden in subclass
   */
  static metadata = {
    id: 'game-id',
    name: 'Game Name',
    description: 'Game description',
    version: '1.0.0',
    author: 'Author Name',
    assetPath: '/assets/games/game-id/'
  };

  /**
   * Constructor
   * @param {Object} platform - Platform services (AudioManager, InputManager, etc.)
   * @param {Object} [options] - Optional additional services or configurations
   */
  constructor(platform, options = {}) {
    this.platform = platform;
    this.isRunning = false;
    this.gameContainer = null;

    this.timerService = platform?.timerService || options?.timerService;
    this.audioManager = platform?.audioManager || options?.audioManager;
  }

  /**
   * Initialize the game (load assets, set up DOM, etc.)
   * Must be implemented by subclass
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Start the game
   * Must be implemented by subclass
   */
  start() {
    throw new Error('start() must be implemented by subclass');
  }

  /**
   * Pause the game
   * Must be implemented by subclass
   */
  pause() {
    throw new Error('pause() must be implemented by subclass');
  }

  /**
   * Resume the game from pause
   * Default implementation calls start()
   */
  resume() {
    this.start();
  }

  /**
   * Stop the game and clean up
   * Must be implemented by subclass
   */
  stop() {
    throw new Error('stop() must be implemented by subclass');
  }

  /**
   * Reset the game to initial state
   * Must be implemented by subclass
   */
  reset() {
    throw new Error('reset() must be implemented by subclass');
  }

  /**
   * Cleanup method - called when game is unloaded
   */
  cleanup() {
    this.stop();
    if (this.gameContainer && this.gameContainer.parentNode) {
      this.gameContainer.parentNode.removeChild(this.gameContainer);
    }
  }

  /**
   * Returns the platform's game container element where games mount their UI.
   */
  getGameContainerEl() {
    return this.platform?.gameContainerEl ?? this.platform?.gameContainer;
  }
}
