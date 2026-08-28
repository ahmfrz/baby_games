export class TimerService {
  constructor(storage = null) {
    this.timerDuration = 120;
    this.isLocked = false;
    this.resetPin = '1234';
    this.storage = storage || localStorage;
    this.sessionEndAt = null;
  }

  initialize() {
    this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = this.storage.getItem('babyGamesTimerSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        const savedDuration = Number(settings.duration);
        this.timerDuration = Number.isFinite(savedDuration) && savedDuration >= 30 && savedDuration <= 24 * 60 * 60
          ? Math.round(savedDuration)
          : 120;
        this.isLocked = Boolean(settings.isLocked);
      }
      const sessionEnd = Number(this.storage.getItem('babyGamesTimerSessionEnd') || 0);
      if (sessionEnd > Date.now()) this.sessionEndAt = sessionEnd;
      else this.clearSession();
    } catch (err) {
      console.warn('[TimerService] Failed to load settings:', err);
    }
  }

  saveSettings() {
    try {
      const settings = {
        duration: this.timerDuration,
        isLocked: this.isLocked,
        timestamp: new Date().toISOString()
      };
      this.storage.setItem('babyGamesTimerSettings', JSON.stringify(settings));
    } catch (err) {
      console.warn('[TimerService] Failed to save settings:', err);
    }
  }

  setDuration(minutes) {
    if (this.isLocked) return false;
    const seconds = Number(minutes) * 60;
    if (!Number.isFinite(seconds) || seconds < 30 || seconds > 24 * 60 * 60) return false;
    this.timerDuration = Math.round(seconds);
    this.saveSettings();
    return true;
  }

  setDurationSeconds(seconds) {
    if (this.isLocked) return false;
    const value = Number(seconds);
    if (!Number.isFinite(value) || value < 30 || value > 24 * 60 * 60) return false;
    this.timerDuration = Math.round(value);
    this.saveSettings();
    return true;
  }

  getDuration() {
    return this.timerDuration;
  }

  hasActiveSession() {
    return Number.isFinite(this.sessionEndAt) && this.sessionEndAt > Date.now();
  }

  startSession() {
    if (!this.hasActiveSession()) {
      this.sessionEndAt = Date.now() + this.timerDuration * 1000;
      try { this.storage.setItem('babyGamesTimerSessionEnd', String(this.sessionEndAt)); } catch (err) {}
    }
    return this.getRemainingSeconds();
  }

  getRemainingSeconds() {
    if (!this.hasActiveSession()) return 0;
    return Math.max(0, Math.ceil((this.sessionEndAt - Date.now()) / 1000));
  }

  clearSession() {
    this.sessionEndAt = null;
    try { this.storage.removeItem('babyGamesTimerSessionEnd'); } catch (err) {}
  }

  endSession() {
    this.clearSession();
  }

  setLocked(locked) {
    this.isLocked = locked;
    this.saveSettings();
  }

  isTimerLocked() {
    return this.isLocked;
  }

  checkResetPin(pin) {
    return String(pin) === this.resetPin;
  }

  setResetPin(pin) {
    const value = String(pin ?? '');
    if (!/^\d{4}$/.test(value)) return false;
    this.resetPin = value;
    this.saveSettings();
    return true;
  }

  resetToDefault() {
    this.timerDuration = 120;
    this.isLocked = false;
    this.endSession();
    this.saveSettings();
    return true;
  }
}
