/**
 * Central registry for all available games
 * Manages game registration, instantiation, and metadata
 */
export class GameRegistry {
  constructor() {
    this.games = new Map();
    this.lazyGames = new Map();
    // Preserve the launcher order even after lazy-loaded games move into `games`.
    this.registrationOrder = [];
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
    if (!this.registrationOrder.includes(id)) this.registrationOrder.push(id);
    console.log(`[GameRegistry] Registered game: ${GameClass.metadata.name} (${id})`);
  }

  /**
   * Register a game whose module is loaded only when the game is launched.
   * @param {Object} metadata - Lightweight launcher metadata
   * @param {Function} loader - Async function returning the game module
   */
  registerLazy(metadata, loader, exportName = null) {
    if (!metadata?.id || typeof loader !== 'function') {
      throw new Error('Lazy game requires metadata.id and a loader function');
    }
    this.lazyGames.set(metadata.id, { metadata, loader, exportName });
    if (!this.registrationOrder.includes(metadata.id)) this.registrationOrder.push(metadata.id);
    console.log(`[GameRegistry] Registered lazy game: ${metadata.name} (${metadata.id})`);
  }

  /**
   * Get a game class by ID
   * @param {string} gameId - Game ID
   * @returns {Function} Game class
   * @throws {Error} if game not found
   */
  async loadGame(gameId) {
    if (this.games.has(gameId)) return this.games.get(gameId);

    const lazy = this.lazyGames.get(gameId);
    if (!lazy) throw new Error(`Game not found: ${gameId}`);

    const module = await lazy.loader();
    const GameClass = lazy.exportName
      ? module?.[lazy.exportName]
      : module?.default || module?.[Object.keys(module || {}).find((key) => key !== 'default')];

    if (!GameClass) {
      throw new Error(`Lazy game module did not export ${lazy.exportName || 'a game class'}: ${gameId}`);
    }

    if (!GameClass.metadata?.id) {
      throw new Error(`Lazy game class has no metadata.id: ${gameId}`);
    }

    if (GameClass.metadata.id !== gameId) {
      throw new Error(`Lazy game ID mismatch: requested ${gameId}, loaded ${GameClass.metadata.id}`);
    }

    this.games.set(gameId, GameClass);
    return GameClass;
  }

  getGame(gameId) {
    if (!this.games.has(gameId)) {
      throw new Error(`Game "${gameId}" has not been loaded yet. Use loadGame() first.`);
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
  async instantiate(gameId, platform, options = {}) {
    const GameClass = await this.loadGame(gameId);
    const gameInstance = new GameClass(platform, options);
    return gameInstance;
  }

  /**
   * Get metadata for all registered games
   * @returns {Array<Object>} Array of game metadata objects
   */
  listGames() {
    return this.registrationOrder
      .map((id) => {
        if (this.games.has(id)) return this.games.get(id).metadata;
        return this.lazyGames.get(id)?.metadata || null;
      })
      .filter(Boolean);
  }

  /**
   * Check if a game is registered
   * @param {string} gameId - Game ID
   * @returns {boolean}
   */
  hasGame(gameId) {
    return this.games.has(gameId) || this.lazyGames.has(gameId);
  }

  /**
   * Get total number of registered games
   * @returns {number}
   */
  getGameCount() {
    return this.games.size + Array.from(this.lazyGames.keys()).filter((id) => !this.games.has(id)).length;
  }
}

export const gameRegistry = new GameRegistry();
