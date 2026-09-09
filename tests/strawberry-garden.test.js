import { STRAWBERRY_SCENES, STRAWBERRY_COLORS, TARGET_COUNTS, StrawberryGardenGame } from '../games/strawberry-garden/StrawberryGardenGame.js';

const expectedKinds = ['find', 'pick', 'basket', 'wash', 'shake', 'decorate', 'free'];
const actualKinds = STRAWBERRY_SCENES.map((scene) => scene.kind);
if (JSON.stringify(actualKinds) !== JSON.stringify(expectedKinds)) throw new Error('Strawberry scene progression is incorrect.');
if (STRAWBERRY_COLORS.length !== 7 || !STRAWBERRY_COLORS.every((entry) => /^#[0-9A-F]{6}$/i.test(entry.value))) throw new Error('Strawberry palette contract is incorrect.');
if (JSON.stringify(TARGET_COUNTS) !== JSON.stringify([1, 2, 3])) throw new Error('Strawberry counting targets are incorrect.');
if (StrawberryGardenGame.metadata.id !== 'strawberry-garden') throw new Error('Strawberry Garden metadata is incorrect.');
if (StrawberryGardenGame.metadata.name !== '🍓 Strawberry Garden') throw new Error('Strawberry Garden name is incorrect.');

console.log('Strawberry Garden tests passed: 5 checks.');
