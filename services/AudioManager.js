/**
 * Audio manager for playing sounds
 * Handles audio context initialization (required by modern browsers)
 */
export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterVolume = 1.0;
    this.soundCache = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize audio context (required by browsers for audio playback)
   * Call this on first user interaction
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();

      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      this.isInitialized = true;
      console.log('[AudioManager] Initialized');
    } catch (err) {
      console.error('[AudioManager] Failed to initialize:', err);
    }
  }

  /**
   * Preload an audio file
   * @param {string} url - URL to audio file
   * @param {string} cacheKey - Key to store in cache
   * @returns {Promise<AudioBuffer>}
   */
  async preloadAudio(url, cacheKey) {
    if (this.soundCache.has(cacheKey)) {
      return this.soundCache.get(cacheKey);
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.soundCache.set(cacheKey, audioBuffer);
      return audioBuffer;
    } catch (err) {
      console.error(`[AudioManager] Failed to preload audio: ${url}`, err);
      return null;
    }
  }

  /**
   * Play a sound from cache
   * @param {string} cacheKey - Key of preloaded audio
   * @param {number} volume - Volume (0-1), default 1.0
   */
  playSound(cacheKey, volume = 1.0) {
    if (!this.audioContext) {
      console.warn('[AudioManager] Audio context not initialized. Call initialize() first.');
      return;
    }

    const audioBuffer = this.soundCache.get(cacheKey);
    if (!audioBuffer) {
      console.warn(`[AudioManager] Sound not found in cache: ${cacheKey}`);
      return;
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = audioBuffer;
    gainNode.gain.value = volume * this.masterVolume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start(0);
  }

  /**
   * Play audio from URL directly (useful for one-off sounds)
   * Note: subject to CORS, prefer preloading
   * @param {string} url - URL to audio file
   * @param {number} volume - Volume (0-1), default 1.0
   */
  playFromURL(url, volume = 1.0) {
    if (!this.audioContext) {
      console.warn('[AudioManager] Audio context not initialized.');
      return;
    }

    const audio = new Audio(url);
    audio.volume = volume * this.masterVolume;
    audio.play().catch(err => console.error('[AudioManager] Failed to play audio:', err));
  }

  /**
   * Set master volume
   * @param {number} volume - Volume (0-1)
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get master volume
   * @returns {number}
   */
  getMasterVolume() {
    return this.masterVolume;
  }

  /**
   * Clear all cached sounds
   */
  clearCache() {
    this.soundCache.clear();
  }
}

export const audioManager = new AudioManager();
