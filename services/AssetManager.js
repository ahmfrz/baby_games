/**
 * Asset manager for loading game assets (images, sounds, etc.)
 * Supports manifest-based asset loading
 */
export class AssetManager {
  constructor() {
    this.loadedAssets = new Map();
    this.manifestCache = new Map();
  }

  /**
   * Load a manifest file for a game
   * @param {string} manifestUrl - URL to manifest.json
   * @returns {Promise<Object>} Manifest object
   */
  async loadManifest(manifestUrl) {
    if (this.manifestCache.has(manifestUrl)) {
      return this.manifestCache.get(manifestUrl);
    }

    try {
      const response = await fetch(manifestUrl);
      const manifest = await response.json();
      this.manifestCache.set(manifestUrl, manifest);
      console.log(`[AssetManager] Loaded manifest: ${manifestUrl}`);
      return manifest;
    } catch (err) {
      console.error(`[AssetManager] Failed to load manifest: ${manifestUrl}`, err);
      throw err;
    }
  }

  /**
   * Preload an image
   * @param {string} url - Image URL
   * @param {string} cacheKey - Cache key for this image
   * @returns {Promise<HTMLImageElement>}
   */
  async loadImage(url, cacheKey) {
    return new Promise((resolve, reject) => {
      if (this.loadedAssets.has(cacheKey)) {
        resolve(this.loadedAssets.get(cacheKey));
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.loadedAssets.set(cacheKey, img);
        resolve(img);
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });
  }

  /**
   * Preload multiple images
   * @param {Array<{url: string, key: string}>} images - Array of {url, key} objects
   * @returns {Promise<void>}
   */
  async loadImages(images) {
    const promises = images.map(({ url, key }) => this.loadImage(url, key));
    await Promise.all(promises);
  }

  /**
   * Get a cached asset
   * @param {string} cacheKey - Cache key
   * @returns {*} Cached asset or null
   */
  get(cacheKey) {
    return this.loadedAssets.get(cacheKey) || null;
  }

  /**
   * Clear all cached assets
   */
  clear() {
    this.loadedAssets.clear();
  }

  /**
   * Clear cached assets matching a prefix
   * @param {string} prefix - Prefix to match
   */
  clearPrefix(prefix) {
    const keysToDelete = Array.from(this.loadedAssets.keys()).filter(key => key.startsWith(prefix));
    keysToDelete.forEach(key => this.loadedAssets.delete(key));
  }
}

export const assetManager = new AssetManager();
