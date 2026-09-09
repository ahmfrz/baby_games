import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const runtime = fs.readFileSync(path.join(root, 'engine/phaser/PhaserGameRuntime.js'), 'utf8');
const game = fs.readFileSync(path.join(root, 'games/strawberry-garden/StrawberryGardenGame.js'), 'utf8');
const main = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');

const checks = [
  ['Phaser runtime boundary exists', runtime.includes('class PhaserGameRuntime')],
  ['Phaser is lazy-loaded', runtime.includes("import(PhaserGameRuntime.CDN_URL)")],
  ['Phaser owns the canvas/game loop', runtime.includes('new this.Phaser.Game')],
  ['Strawberry game uses Phaser Scene', game.includes('extends Phaser.Scene')],
  ['Strawberry game has multiple gameplay scenes', game.includes("['find', 'pick', 'basket', 'wash', 'shake', 'decorate', 'free']")],
  ['Strawberry game uses tweened feedback', game.includes('this.tweens.add')],
  ['Strawberry game uses touch input', game.includes('pointerdown')],
  ['Launcher loads the migrated Strawberry game', main.includes("import('../games/strawberry-garden/StrawberryGardenGame.js')")],
];

let passed = 0;
for (const [name, ok] of checks) {
  if (!ok) throw new Error(`FAIL: ${name}`);
  console.log(`PASS: ${name}`);
  passed += 1;
}
console.log(`Phaser architecture smoke test: ${passed}/${checks.length} passed`);
