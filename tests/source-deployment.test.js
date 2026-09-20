import fs from 'node:fs';
import path from 'node:path';

export function runSourceDeploymentTests() {
  const root = process.cwd();
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const runtime = fs.readFileSync(path.join(root, 'engine/phaser/PhaserGameRuntime.js'), 'utf8');
  const interaction = fs.readFileSync(path.join(root, 'engine/phaser/ToddlerInteractionSystem.js'), 'utf8');
  const manifest = fs.readFileSync(path.join(root, 'assets/games/strawberry-garden/manifest.js'), 'utf8');
  const pwaManifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  const publicManifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8'));
  const serviceWorker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
  const publicServiceWorker = fs.readFileSync(path.join(root, 'public/service-worker.js'), 'utf8');

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
  if (pwaManifest.start_url !== './' || pwaManifest.scope !== './' || pwaManifest.id !== './') {
    throw new Error('PWA manifest must use the application root as id, start_url, and scope');
  }
  if (JSON.stringify(publicManifest) !== JSON.stringify(pwaManifest)) {
    throw new Error('Vite public PWA manifest is out of sync with the source manifest');
  }
  for (const icon of pwaManifest.icons) {
    const iconPath = path.join(root, 'public', icon.src.replace(/^\.\//, ''));
    if (!fs.existsSync(iconPath)) throw new Error(`Missing PWA icon: ${icon.src}`);
  }
  if (!fs.existsSync(path.join(root, 'public/service-worker.js'))) {
    throw new Error('Vite public service worker is missing');
  }
  if (serviceWorker !== publicServiceWorker) {
    throw new Error('Vite public service worker is out of sync with the source service worker');
  }
  if (!index.includes("navigator.serviceWorker.register('./service-worker.js', { scope: './' })")) {
    throw new Error('Service worker must be registered with an explicit application-root scope');
  }
  if (!manifest.includes("assetUrl(`games/strawberry-garden/art/${name}`)")) {
    throw new Error('Strawberry asset manifest must use the runtime asset resolver');
  }
  return 13;
}
