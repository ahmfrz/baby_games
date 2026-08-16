export class AudioManager {
  constructor() {
    this.context = null;
    this.volume = 0.18;
    this.unlocked = false;
  }

  async initialize() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.unlockOnGesture();
    } catch (error) {
      console.warn('[AudioManager] AudioContext not available:', error);
    }
  }

  unlockOnGesture() {
    const unlock = async () => {
      try {
        if (this.context?.state === 'suspended') await this.context.resume();
        this.unlocked = true;
      } catch (e) {}
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  async ensureRunning() {
    if (this.context?.state === 'suspended') {
      try { await this.context.resume(); } catch (e) {}
    }
  }

  playSound(type = 'click', frequency = 440, duration = 0.1) {
    if (!this.context) return;
    try {
      const now = this.context.currentTime;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.connect(gain);
      gain.connect(this.context.destination);
      const presets = {
        click: { wave: 'sine', freq: 520 },
        success: { wave: 'sine', freq: 740 },
        error: { wave: 'triangle', freq: 220 },
        pop: { wave: 'sine', freq: 610 },
        star: { wave: 'sine', freq: 880 },
        slice: { wave: 'sawtooth', freq: 320 }
      };
      const preset = presets[type] || {};
      osc.type = preset.wave || 'sine';
      osc.frequency.setValueAtTime(preset.freq || frequency, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(this.volume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (error) {
      console.warn('[AudioManager] Error playing sound:', error);
    }
  }

  playSequence(notes = [660, 780, 920]) {
    notes.forEach((freq, i) => setTimeout(() => this.playSound('success', freq, 0.12), i * 70));
  }

  speak(text, rate = 1.0) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.volume = 1;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, Number(volume) || 0));
  }

  cleanup() {
    this.stopSpeaking();
    if (this.context) this.context.close().catch(() => {});
    this.context = null;
  }
}
