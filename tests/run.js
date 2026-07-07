import { expect, MockStorage } from './utils/mock-storage.js';
import { TimerService } from '../services/TimerService.js';

console.log('Starting TimerService Tests...\n');

let testCount = 0;
let passCount = 0;
let failCount = 0;

function runTest(suite, fn) {
  testCount++;
  try {
    console.log(`\n[TEST] ${suite}`);
    fn();
    passCount++;
    console.log(`[PASS] ${suite}`);
  } catch (error) {
    failCount++;
    console.error(`[FAIL] ${suite}`);
    console.error(error.message);
  }
}

function runTests() {
  // Initialization
  runTest('Initialization', () => {
    const mockStorage = new MockStorage();
    const service = new TimerService(mockStorage);

    runTest('should have default values', () => {
      expect(service.timerDuration).toBe(120);
      expect(service.isLocked).toBe(false);
      expect(service.resetPin).toBe('1234');
    });

    runTest('should initialize with loadSettings method', () => {
      expect(service.loadSettings).toBeDefined();
    });
  });

  // loadSettings
  runTest('loadSettings', () => {
    const mockStorage = new MockStorage();
    const service = new TimerService(mockStorage);

    runTest('should load saved duration', () => {
      mockStorage.setItem('babyGamesTimerSettings', JSON.stringify({
        duration: 60,
        isLocked: true,
        timestamp: new Date().toISOString()
      }));

      service.loadSettings();

      expect(service.timerDuration).toBe(60);
      expect(service.isLocked).toBe(true);
    });

    runTest('should load partial settings', () => {
      mockStorage.setItem('babyGamesTimerSettings', JSON.stringify({
        duration: 180
      }));

      service.loadSettings();

      expect(service.timerDuration).toBe(180);
    });

    runTest('should use default when no settings exist', () => {
      const service2 = new TimerService(new MockStorage());
      expect(service2.timerDuration).toBe(120);
    });

    runTest('should handle corrupted settings', () => {
      const mockStorage2 = new MockStorage();
      mockStorage2.setItem('babyGamesTimerSettings', 'invalid json');
      const service2 = new TimerService(mockStorage2);

      expect(service2.timerDuration).toBe(120);
    });
  });

  // saveSettings
  runTest('saveSettings', () => {
    const mockStorage = new MockStorage();
    const service = new TimerService(mockStorage);

    runTest('should save duration and locked state', () => {
      service.setDuration(90);
      service.setLocked(true);
      const saved = JSON.parse(mockStorage.getItem('babyGamesTimerSettings'));

      expect(saved.duration).toBe(90 * 60);
      expect(saved.isLocked).toBe(true);
    });
  });

  // setDuration
  runTest('setDuration', () => {
    const mockStorage = new MockStorage();
    const service = new TimerService(mockStorage);

    runTest('should set duration in seconds', () => {
      const result = service.setDuration(45);

      expect(result).toBe(true);
      expect(service.timerDuration).toBe(45 * 60);
    });

    runTest('should return false when locked', () => {
      service.setLocked(true);
      expect(service.setDuration(90)).toBe(false);
    });
  });

  // setLocked
  runTest('setLocked', () => {
    const mockStorage = new MockStorage();
    const service = new TimerService(mockStorage);

    runTest('should set locked state', () => {
      service.setLocked(true);
      expect(service.isLocked).toBe(true);
    });
  });

  // isTimerLocked
  runTest('isTimerLocked', () => {
    const mockStorage = new MockStorage();
    const service = new TimerService(mockStorage);

    runTest('should return current state', () => {
      expect(service.isTimerLocked()).toBe(false);
      service.setLocked(true);
      expect(service.isTimerLocked()).toBe(true);
    });
  });

  // checkResetPin
  runTest('checkResetPin', () => {
    const mockStorage = new MockStorage();
    const service = new TimerService(mockStorage);

    runTest('should validate correct pin', () => {
      expect(service.checkResetPin('1234')).toBe(true);
    });

    runTest('should invalidate incorrect pin', () => {
      expect(service.checkResetPin('0000')).toBe(false);
    });
  });

  // resetToDefault
  runTest('resetToDefault', () => {
    const mockStorage = new MockStorage();
    const service = new TimerService(mockStorage);

    runTest('should reset to default', () => {
      service.setDuration(60);
      service.resetToDefault();
      expect(service.timerDuration).toBe(120);
    });
  });

  // getDuration
  runTest('getDuration', () => {
    const mockStorage = new MockStorage();
    const service = new TimerService(mockStorage);

    runTest('should return duration', () => {
      service.timerDuration = 180;
      expect(service.getDuration()).toBe(180);
    });
  });

  console.log(`\nTest run complete. Total: ${testCount}, Passed: ${passCount}, Failed: ${failCount}`);
}

runTests();
