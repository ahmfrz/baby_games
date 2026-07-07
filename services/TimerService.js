export class TimerService {
  constructor(storage = null) {
    this.timerDuration = 120;
    this.isLocked = false;
    this.resetPin = '1234';
    this.storage = storage || localStorage;
  }

  initialize() {
    this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = this.storage.getItem('babyGamesTimerSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.timerDuration = settings.duration || 120;
        this.isLocked = settings.isLocked || false;
      }
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
    this.timerDuration = minutes * 60;
    this.saveSettings();
    return true;
  }

  getDuration() {
    return this.timerDuration;
  }

  setLocked(locked) {
    this.isLocked = locked;
    this.saveSettings();
  }

  isTimerLocked() {
    return this.isLocked;
  }

  checkResetPin(pin) {
    return pin === this.resetPin;
  }

  resetToDefault() {
    this.timerDuration = 120;
    this.isLocked = false;
    this.saveSettings();
    return true;
  }

  resetPin() {
    this.resetPin = '0000';
    this.saveSettings();
  }
}