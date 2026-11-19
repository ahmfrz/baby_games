import fs from 'node:fs';
import path from 'node:path';

export function runBunnyRunTests() {
  const root = process.cwd();
  const game = fs.readFileSync(path.join(root, 'games/bunny-run/BunnyRunGame.js'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
  const resolver = fs.readFileSync(path.join(root, 'services/AssetService.js'), 'utf8');
  const checks = [
    ['Bunny Run is registered lazily', main.includes("id: 'bunny-run'") && main.includes("import('../games/bunny-run/BunnyRunGame.js')")],
    ['Game exposes the expected ID', game.includes("id: 'bunny-run'")],
    ['Tap jump and keyboard jump are supported', game.includes("addEventListener('pointerdown'") && game.includes("addEventListener('keydown'")],
    ['Obstacles and carrots are spawned', game.includes("['log', 'rock', 'bush']") && game.includes("type: 'carrot'")],
    ['Difficulty increases gradually', game.includes('this.elapsed * 8.5')],
    ['Forgiving collision boxes are inset', game.includes('this.player.x + 17') && game.includes('item.x + 9')],
    ['Assets resolve from the repository assets folder', resolver.includes("['games/bunny-run/', 'assets/games/bunny-run/']")],
    ['All required artwork files exist', ['bunny.svg', 'carrot.svg', 'countryside.png'].every((file) => fs.existsSync(path.join(root, 'assets/games/bunny-run/art', file)))],
    ['Game stylesheet is linked for source deployment', fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('games/bunny-run/styles.css')]
  ];
  for (const [label, passed] of checks) {
    if (!passed) throw new Error(`Bunny Run: ${label}`);
  }
  console.log(`[PASS] Bunny Run: ${checks.length}/${checks.length} checks`);
  return checks.length;
}
