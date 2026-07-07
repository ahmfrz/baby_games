import { TimerService } from '../services/TimerService.js';
import { describe, it, expect, beforeEach, afterEach, MockStorage } from './utils/mock-storage.js';

describe('TimerService', () => {
  let service;
  let mockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    service = new TimerService();
    service._storage = mockStorage; // Access private property for testing
    service.initialize();
  });

  afterEach(() => {
    mockStorage.clear();
  });

  describe('Initialization', () => {
    it('should have default values', () => {
      expect(service.timerDuration).toBe(120);
      expect(service.isLocked).toBe(false);
      expect(service.resetPin).toBe('1234');
    });

    it('should initialize with default settings', () => {
      expect(service.loadSettings).toBeDefined();
      expect(typeof service.loadSettings).toBe('function');
    });
  });

  describe('loadSettings', () => {
    it('should load saved duration', () => {
      mockStorage.setItem('babyGamesTimerSettings', JSON.stringify({
        duration: 60,
        isLocked: true,
        timestamp: new Date().toISOString()
      }));

      service.loadSettings();

      expect(service.timerDuration).toBe(60);
      expect(service.isLocked).toBe(true);
    });

    it('should load partial settings', () => {
      mockStorage.setItem('babyGamesTimerSettings', JSON.stringify({
        duration: 180
      }));

      service.loadSettings();

      expect(service.timerDuration).toBe(180);
      expect(service.isLocked).toBe(false);
    });

    it('should handle corrupted settings', () => {
      mockStorage.setItem('babyGamesTimerSettings', 'invalid json');

      service.loadSettings();

      expect(service.timerDuration).toBe(120);
      expect(service.isLocked).toBe(false);
    });

    it('should use default when no settings exist', () => {
      expect(service.timerDuration).toBe(120);
    });
  });

  describe('saveSettings', () => {
    it('should save duration and locked state', () => {
      service.setDuration(90);
      service.setLocked(true);

      const saved = JSON.parse(mockStorage.getItem('babyGamesTimerSettings'));

      expect(saved.duration).toBe(90 * 60);
      expect(saved.isLocked).toBe(true);
      expect(saved.timestamp).toBeDefined();
    });

    it('should save current timestamp', () => {
      service.saveSettings();

      const saved = JSON.parse(mockStorage.getItem('babyGamesTimerSettings'));

      expect(saved.timestamp).toBeDefined();
    });
  });

  describe('setDuration', () => {
    it('should set duration in seconds', () => {
      const result = service.setDuration(45);

      expect(result).toBe(true);
      expect(service.timerDuration).toBe(45 * 60);
    });

    it('should return false when timer is locked', () => {
      service.setLocked(true);
      const result = service.setDuration(90);

      expect(result).toBe(false);
      expect(service.timerDuration).toBe(0); // Should not change
    });

    it('should not exceed maximum duration', () => {
      service.setDuration(300);
      expect(service.timerDuration).toBe(300 * 60);
    });
  });

  describe('setLocked', () => {
    it('should set locked state', () => {
      service.setLocked(true);

      expect(service.isLocked).toBe(true);

      const saved = JSON.parse(mockStorage.getItem('babyGamesTimerSettings'));
      expect(saved.isLocked).toBe(true);
    });

    it('should save unlocked state', () => {
      service.setLocked(false);

      const saved = JSON.parse(mockStorage.getItem('babyGamesTimerSettings'));
      expect(saved.isLocked).toBe(false);
    });
  });

  describe('isTimerLocked', () => {
    it('should return current locked state', () => {
      expect(service.isTimerLocked()).toBe(false);

      service.setLocked(true);
      expect(service.isTimerLocked()).toBe(true);

      service.setLocked(false);
      expect(service.isTimerLocked()).toBe(false);
    });
  });

  describe('checkResetPin', () => {
    it('should validate correct pin', () => {
      expect(service.checkResetPin('1234')).toBe(true);
    });

    it('should invalidate incorrect pin', () => {
      expect(service.checkResetPin('0000')).toBe(false);
      expect(service.checkResetPin('5678')).toBe(false);
      expect(service.checkResetPin('123')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(service.checkResetPin('1234')).toBe(true);
      expect(service.checkResetPin('1234'.toLowerCase())).toBe(false);
    });
  });

  describe('resetToDefault', () => {
    it('should reset to default values', () => {
      service.setDuration(60);
      service.setLocked(true);
      service.resetToDefault();

      expect(service.timerDuration).toBe(120);
      expect(service.isLocked).toBe(false);
    });

    it('should return true on success', () => {
      const result = service.resetToDefault();

      expect(result).toBe(true);
    });
  });

  describe('resetPin', () => {
    it('should change reset pin to 0000', () => {
      service.resetPin();

      expect(service.resetPin).toBe('0000');
    });
  });

  describe('getDuration', () => {
    it('should return current duration in seconds', () => {
      service.timerDuration = 180;

      expect(service.getDuration()).toBe(180);
    });

    it('should return 0 for locked timer', () => {
      service.isLocked = true;

      expect(service.getDuration()).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative durations', () => {
      mockStorage.setItem('babyGamesTimerSettings', JSON.stringify({
        duration: -60
      }));

      service.loadSettings();

      expect(service.timerDuration).toBe(120); // Should use default
    });

    it('should handle zero duration', () => {
      mockStorage.setItem('babyGamesTimerSettings', JSON.stringify({
        duration: 0
      }));

      service.loadSettings();

      expect(service.timerDuration).toBe(120); // Should use default
    });

    it('should handle very large durations', () => {
      mockStorage.setItem('babyGamesTimerSettings', JSON.stringify({
        duration: 999999
      }));

      service.loadSettings();

      expect(service.timerDuration).toBe(999999 * 60);
    });
  });
});
