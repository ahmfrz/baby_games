import { TimerService } from '../services/TimerService.js';
import { expect, MockStorage } from './utils/mock-storage.js';

const test = (name, fn) => {
  try { fn(); console.log(`✓ ${name}`); }
  catch (error) { console.error(`✗ ${name}: ${error.message}`); throw error; }
};

const makeService = () => new TimerService(new MockStorage());

test('uses safe defaults', () => {
  const service = makeService();
  expect(service.getDuration()).toBe(120);
  expect(service.isTimerLocked()).toBe(false);
  expect(service.resetPin).toBe('1234');
});

test('persists duration and lock state', () => {
  const storage = new MockStorage();
  const service = new TimerService(storage);
  expect(service.setDuration(5)).toBe(true);
  service.setLocked(true);
  const saved = JSON.parse(storage.getItem('babyGamesTimerSettings'));
  expect(saved.duration).toBe(300);
  expect(saved.isLocked).toBe(true);
});

test('rejects invalid duration values', () => {
  const service = makeService();
  expect(service.setDurationSeconds(29)).toBe(false);
  expect(service.setDurationSeconds(86401)).toBe(false);
  expect(service.setDurationSeconds(300)).toBe(true);
  expect(service.getDuration()).toBe(300);
});

test('locked timer cannot change duration', () => {
  const service = makeService();
  service.setLocked(true);
  expect(service.setDurationSeconds(300)).toBe(false);
  expect(service.getDuration()).toBe(120);
});

test('session start is idempotent while active', () => {
  const service = makeService();
  service.setDurationSeconds(60);
  service.startSession();
  const firstEnd = service.sessionEndAt;
  service.startSession();
  expect(service.sessionEndAt).toBe(firstEnd);
  expect(service.getRemainingSeconds() > 0).toBe(true);
});

test('clearing a session makes it inactive', () => {
  const service = makeService();
  service.startSession();
  service.clearSession();
  expect(service.hasActiveSession()).toBe(false);
  expect(service.getRemainingSeconds()).toBe(0);
});

test('reset restores defaults', () => {
  const service = makeService();
  service.setDurationSeconds(600);
  service.setLocked(true);
  service.startSession();
  service.resetToDefault();
  expect(service.getDuration()).toBe(120);
  expect(service.isTimerLocked()).toBe(false);
  expect(service.hasActiveSession()).toBe(false);
});

test('validates persisted duration values', () => {
  const storage = new MockStorage();
  storage.setItem('babyGamesTimerSettings', JSON.stringify({ duration: -60, isLocked: false }));
  const service = new TimerService(storage);
  service.initialize();
  expect(service.getDuration()).toBe(120);
});

test('can change the reset PIN through the explicit API', () => {
  const service = makeService();
  expect(service.setResetPin('5678')).toBe(true);
  expect(service.checkResetPin('5678')).toBe(true);
  expect(service.setResetPin('12')).toBe(false);
});
