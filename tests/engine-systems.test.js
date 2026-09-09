import assert from 'node:assert/strict';
import { GameStateStore } from '../engine/core/GameStateStore.js';
import { AssetManifest } from '../engine/core/AssetManifest.js';

export function runEngineSystemTests() {
  const store = new GameStateStore({ step: 'find', count: 0 });
  let emissions = 0;
  const unsubscribe = store.subscribe(() => { emissions += 1; });
  store.set('count', 1);
  assert.equal(store.get('count'), 1);
  assert.equal(store.serialize().step, 'find');
  store.update((state) => ({ ...state, step: 'pick' }));
  assert.equal(store.get('step'), 'pick');
  store.reset();
  assert.equal(store.get('count'), 0);
  assert.equal(emissions, 3);
  unsubscribe();

  const manifest = new AssetManifest({ 'berry.idle': { type: 'image', source: 'berry-idle.png' } });
  assert.equal(manifest.has('berry.idle'), true);
  assert.equal(manifest.get('berry.idle').source, 'berry-idle.png');
  assert.throws(() => manifest.get('missing'), /Unknown asset key/);

  console.log('[PASS] Phaser engine systems');
}

if (import.meta.url === `file://${process.argv[1]}`) runEngineSystemTests();
