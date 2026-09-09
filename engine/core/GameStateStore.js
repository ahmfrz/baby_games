/** Serializable, renderer-independent state container for toddler games. */
export class GameStateStore {
  constructor(initialState = {}) {
    this.initialState = structuredClone(initialState);
    this.state = structuredClone(initialState);
    this.listeners = new Set();
  }
  get(key) { return key === undefined ? this.state : this.state[key]; }
  set(key, value) {
    if (typeof key === 'object') this.state = { ...this.state, ...structuredClone(key) };
    else this.state = { ...this.state, [key]: value };
    this.emit();
  }
  update(fn) { this.state = fn(structuredClone(this.state)); this.emit(); }
  reset() { this.state = structuredClone(this.initialState); this.emit(); }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  emit() { this.listeners.forEach((listener) => listener(this.state)); }
  serialize() { return structuredClone(this.state); }
}
