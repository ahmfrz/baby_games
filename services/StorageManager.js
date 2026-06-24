/**
 * Storage manager for persisting game data
 * Wrapper around localStorage for consistency
 */
export class StorageManager {
  constructor(prefix = 'babyGames_') {
    this.prefix = prefix;
  }

  /**
   * Get a value from storage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Value to return if key not found
   * @returns {*}
   */
  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(this.prefix + key);
      if (value === null) return defaultValue;

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (err) {
      console.error('[StorageManager] Failed to get value:', err);
      return defaultValue;
    }
  }

  /**
   * Set a value in storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store (will be JSON stringified)
   */
  set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (err) {
      console.error('[StorageManager] Failed to set value:', err);
    }
  }

  /**
   * Remove a value from storage
   * @param {string} key - Storage key
   */
  remove(key) {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (err) {
      console.error('[StorageManager] Failed to remove value:', err);
    }
  }

  /**
   * Clear all storage entries with this prefix
   */
  clear() {
    try {
      const keysToDelete = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(this.prefix)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => localStorage.removeItem(key));
    } catch (err) {
      console.error('[StorageManager] Failed to clear storage:', err);
    }
  }

  /**
   * Get all stored data (with prefix)
   * @returns {Object}
   */
  getAll() {
    const data = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(this.prefix)) {
          const cleanKey = key.replace(this.prefix, '');
          data[cleanKey] = this.get(cleanKey);
        }
      }
    } catch (err) {
      console.error('[StorageManager] Failed to get all values:', err);
    }
    return data;
  }

  /**
   * Check if a key exists
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  has(key) {
    try {
      return localStorage.getItem(this.prefix + key) !== null;
    } catch (err) {
      console.error('[StorageManager] Failed to check key:', err);
      return false;
    }
  }
}

export const storageManager = new StorageManager();
