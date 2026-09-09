/** Stable asset keys keep game code independent from physical file paths. */
export class AssetManifest {
  constructor(entries = {}) { this.entries = entries; }
  add(key, config) { this.entries[key] = { ...config }; return this; }
  get(key) { const entry = this.entries[key]; if (!entry) throw new Error(`Unknown asset key: ${key}`); return entry; }
  has(key) { return Boolean(this.entries[key]); }
  entriesFor(prefix) { return Object.fromEntries(Object.entries(this.entries).filter(([key]) => key.startsWith(prefix))); }
}
