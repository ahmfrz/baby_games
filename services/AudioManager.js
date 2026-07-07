export class AudioManager {
  constructor() {
    this.context = null;
    this.volume = 1.0;
  }

  async initialize() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      console.log('[AudioManager] Initialized with AudioContext');
    } catch (error) {
      console.warn('[AudioManager] AudioContext not available:', error);
    }
  }

  /**
   * Play a sound using Web Audio API
   * @param {string} type - Type of sound (success, click, error, etc.)
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in seconds
   */
  playSound(type, frequency = 440, duration = 0.3) {
    if (!this.context) {
      console.warn('[AudioManager] AudioContext not initialized');
      return;
    }

    try {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type === 'success' ? 'sine' : 'square';

      gainNode.gain.setValueAtTime(this.volume, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + duration);

      console.log(`[AudioManager] Playing ${type} sound: ${frequency}Hz`);
    } catch (error) {
      console.warn('[AudioManager] Error playing sound:', error);
    }
  }

  /**
   * Play TTS speech
   * @param {string} text - Text to speak
   * @param {number} rate - Speech rate (0.1 - 10)
   */
  speak(text, rate = 1.0) {
    if (!('speechSynthesis' in window)) {
      console.warn('[AudioManager] Speech synthesis not supported');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.volume = 1.0;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
    console.log(`[AudioManager] Speaking: "${text}"`);
  }

  /**
   * Stop all current speech
   */
  stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      console.log('[AudioManager] Stopped speaking');
    }
  }

  /**
   * Set volume level
   * @param {number} volume - Volume level 0-1
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    console.log(`[AudioManager] Volume set to ${this.volume}`);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.context) {
      this.context.close();
      this.context = null;
      console.log('[AudioManager] Cleanup complete');
    }
    this.stopSpeaking();
  }
}