export class MockStorage {
  constructor() {
    this._store = {};
  }

  getItem(key) {
    return this._store[key] || null;
  }

  setItem(key, value) {
    this._store[key] = value.toString();
  }

  removeItem(key) {
    delete this._store[key];
  }

  clear() {
    this._store = {};
  }
}

global.localStorage = {
  getItem(key) {
    return localStorage._store[key] || null;
  },
  setItem(key, value) {
    localStorage._store[key] = value;
  },
  removeItem(key) {
    delete localStorage._store[key];
  },
  clear() {
    localStorage._store = {};
  }
};

localStorage._store = {};

export const describe = (name, fn) => {
  console.log(`\n[TEST] ${name}`);

  try {
    fn();
    console.log(`[PASS] ${name}`);
  } catch (error) {
    console.error(`[FAIL] ${name}`);
    console.error(error.message);
  }
};

export const it = (name, testFn) => {
  try {
    testFn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
    throw error;
  }
};

export const expect = (actual) => {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toEqual: (expected) => {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${expectedStr}, got ${actualStr}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined || actual === null) {
        throw new Error(`Expected value to be defined, got ${actual}`);
      }
    }
  };
};
