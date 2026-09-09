import fs from 'node:fs';
import path from 'node:path';

export function runSourceDeploymentTests() {
  const root = process.cwd();
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const runtime = fs.readFileSync(path.join(root, 'engine/phaser/PhaserGameRuntime.js'), 'utf8');
  const interaction = fs.readFileSync(path.join(root, 'engine/phaser/ToddlerInteractionSystem.js'), 'utf8');
  const manifest = fs.readFileSync(path.join(root, 'assets/games/strawberry-garden/manifest.js'), 'utf8');

  if (!index.includes('<script type="importmap">')) throw new Error('Missing native browser import map');
  if (!index.includes('"phaser": "https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js"')) {
    throw new Error('Import map does not point to the expected Phaser ESM build');
  }
  if (!interaction.includes("import * as Phaser from 'phaser';")) {
    throw new Error('ToddlerInteractionSystem must use Phaser namespace import; CDN ESM has no default export');
  }
  if (runtime.includes('module.default')) {
    throw new Error('Phaser runtime still assumes a default export from the browser ESM module');
  }
  if (!manifest.includes('new URL(`./art/${name}`, import.meta.url)')) {
    throw new Error('Strawberry asset manifest still depends on a Vite-only asset URL transform');
  }
  return 4;
}
