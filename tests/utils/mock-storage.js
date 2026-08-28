export class MockStorage {
  constructor() { this._store = Object.create(null); }
  getItem(key) { return Object.prototype.hasOwnProperty.call(this._store, key) ? this._store[key] : null; }
  setItem(key, value) { this._store[key] = String(value); }
  removeItem(key) { delete this._store[key]; }
  clear() { this._store = Object.create(null); }
}

export const expect = (actual) => ({
  toBe(expected) {
    if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
  },
  toEqual(expected) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },
  toBeDefined() {
    if (actual === undefined || actual === null) throw new Error(`Expected value to be defined, got ${actual}`);
  }
});
