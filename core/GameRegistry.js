/**
 * Central registry for all available games
 * Manages game registration, instantiation, and metadata
 */
export class GameRegistry {
  constructor() {
    this.games = new Map();
  }

  /**
   * Register a game class
   * @param {Function} GameClass - Game class extending GameModule
   * @throws {Error} if metadata is missing or invalid
   */
  register(GameClass) {
    if (!GameClass.metadata || !GameClass.metadata.id) {
      throw new Error('Game must have static metadata.id property');
    }
    const { id } = GameClass.metadata;
    this.games.set(id, GameClass);
    console.log(`[GameRegistry] Registered game: ${GameClass.metadata.name} (${id})`);
  }

  /**
   * Get a game class by ID
   * @param {string} gameId - Game ID
   * @returns {Function} Game class
   * @throws {Error} if game not found
   */
  getGame(gameId) {
    if (!this.games.has(gameId)) {
      throw new Error(`Game not found: ${gameId}`);
    }
    return this.games.get(gameId);
  }

  /**
   * Instantiate a game
   * @param {string} gameId - Game ID
   * @param {Object} platform - Platform services to inject
   * @param {Object} [options] - Optional additional services
   * @returns {GameModule} Game instance
   */
  instantiate(gameId, platform, options = {}) {
    const GameClass = this.getGame(gameId);
    const gameInstance = new GameClass(platform, options);
    return gameInstance;
  }

  /**
   * Get metadata for all registered games
   * @returns {Array<Object>} Array of game metadata objects
   */
  listGames() {
    return Array.from(this.games.values()).map(GameClass => GameClass.metadata);
  }

  /**
   * Check if a game is registered
   * @param {string} gameId - Game ID
   * @returns {boolean}
   */
  hasGame(gameId) {
    return this.games.has(gameId);
  }

  /**
   * Get total number of registered games
   * @returns {number}
   */
  getGameCount() {
    return this.games.size;
  }
}

export const gameRegistry = new GameRegistry();
