import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = f => fs.readFileSync(path.join(root,f),'utf8');
const game = read('games/language-adventures/LanguageAdventureGame.js');
const data = read('games/language-adventures/languageData.js');
if (data.includes("new URL('./assets/new/', import.meta.url)") || data.includes("new URL('./assets/', import.meta.url)")) {
  throw new Error('Little Adventures asset URLs must not be relative to the generated Vite chunk');
}
const css = read('games/language-adventures/styles.css');
const resolver = read('services/AssetService.js');
if (!resolver.includes("export function assetDirectoryUrl(logicalPath = '', resourceType = 'image')")) {
  throw new Error('AssetService must provide a resource-type-aware directory resolver');
}
if (!resolver.includes("return `${RAW_BASE.replace(/\\/+$/, '')}/${type}/upload/${CLOUDINARY_PREFIX}/${normalized}/`")) {
  throw new Error('AssetService directory resolver must build Cloudinary resource-type URLs correctly');
}

const assets = [
  'games/language-adventures/assets/new/hero-explorer.webp',
  'games/language-adventures/assets/new/adventure-map.webp',
  'games/language-adventures/assets/new/park-friend.webp',
  'games/language-adventures/assets/new/home-helper.webp',
  'games/language-adventures/assets/new/school-friend.webp',
  'games/language-adventures/assets/new/nature-helper.webp',
  'games/language-adventures/assets/new/adventure-complete.webp',
  'games/language-adventures/assets/new/explorer-avatar.webp',
  'games/language-adventures/assets/new/targets.svg',
  'games/language-adventures/assets/new/toddler-hero.webp',
  'games/language-adventures/assets/new/mumma-card.webp',
  'games/language-adventures/assets/new/explorer-celebrate.webp',
  'games/language-adventures/assets/new/mumma-encourage.webp',
  'games/language-adventures/assets/new/cards/home-video.webp',
  'games/language-adventures/assets/new/characters/toddler/idle.webp',
  'games/language-adventures/assets/new/characters/toddler/point.webp',
  'games/language-adventures/assets/new/characters/toddler/happy.webp',
  'games/language-adventures/assets/new/characters/toddler/surprised.webp',
  'games/language-adventures/assets/new/characters/mumma/standing.webp',
  'games/language-adventures/assets/new/characters/mumma/point.webp',
  'games/language-adventures/assets/new/characters/mumma/happy.webp',
  'games/language-adventures/assets/new/characters/mumma/surprised.webp',
  'games/language-adventures/video/home-tidy-room.mp4',
];

for (const a of assets) if (!fs.existsSync(path.join(root,a))) throw new Error(`Missing Little Adventures v2 asset: ${a}`);
for (const token of ['class LanguageAdventureGame','showMap()','renderStep()','renderVideoStep()','buildVideoInteraction(step)','buildInteraction(step)','makeDrag','finish()','showTimeUp()','loadProgress()','saveProgress()','completionFeedback','scene-avatar','characters/toddler/idle.webp','data-mumma','explorer-celebrate.webp','mumma-encourage.webp','targetPosition','itemPosition','asset-icon']) {
  if (!game.includes(token)) throw new Error(`Little Adventures v2 missing ${token}`);
}
for (const token of ['At Home','In the Park','At School','In Nature','Around the World','type:\'drag\'','type:\'choice\'','activity:\'tidy-room\'','activity:\'share-at-park\'','activity:\'pack-school\'','activity:\'recycle-cleanup\'','activity:\'landmark-match\'']) {
  if (!data.includes(token)) throw new Error(`Little Adventures v2 data missing ${token}`);
}
for (const token of ['.la2-map','.la2-card','.la2-play','.choice-card','.drag-piece','.la2-complete','.la2-timeup','.timeup-card','.la2-card.is-complete','.scene-avatar','.asset-icon','.character-stage','.character-bubble','.globe-companion','.character-happy','.character-surprised','prefers-reduced-motion']) {

  if (!css.includes(token)) throw new Error(`Little Adventures v2 style missing ${token}`);
}

for (const token of ['totalStars','loadTotalStars()','saveTotalStars()','soundEnabled','toggleSound()','data-sound','aria-live=\"polite\"','progress-track','startTimerLoop()','timerService?.endSession?.()']) {
  if (!game.includes(token)) throw new Error(`Little Adventures v2 accessibility/progression feature missing ${token}`);
}
for (const token of ['.sound-toggle','.la2-progress-panel','.progress-track','.sr-only','focus-visible']) {
  if (!css.includes(token)) throw new Error(`Little Adventures v2 polish style missing ${token}`);
}

// Regression: gameplay layout must be a real flex/grid sizing chain.
if (!css.includes('.la2-main{min-height:0;flex:1 1 auto;display:flex;flex-direction:column;') ||
    !css.includes('[data-role="view"]{flex:1 1 auto;min-height:0;min-width:0;display:flex;flex-direction:column;') ||
    !css.includes('.la2-play{position:relative;display:grid;grid-template-rows:64px minmax(0,1fr);') ||
    !css.includes('.play-scene{position:relative;grid-row:2;')) {
  throw new Error('Little Adventures gameplay viewport sizing is not robust');
}
if (css.includes('.play-scene{position:absolute;')) throw new Error('Little Adventures play-scene must remain in normal grid flow');
if (!data.includes("art:'scenes/toy-room.webp'")) throw new Error('Home adventure must use the clean toy-room scene background');
if (!data.includes("cardArt:'cards/home-video.webp'")) throw new Error('Home adventure card must use the video-derived artwork');
if (!game.includes("cards/home-video.webp")) throw new Error('Main map must use the Home adventure cover');
if (!game.includes("s.id!=='home'")) throw new Error('Globe companion must not overlap the Home Mumma layout');
if (!css.includes('.play-scene.is-home-scene')) throw new Error('Home adventure layout fixes are missing');
if (css.includes('height:0') && css.includes('.play-scene{position:relative;flex:1 1 auto;min-height:0;height:0;')) {
  throw new Error('Little Adventures still contains the zero-height play-scene rule');
}

if (!game.includes("if(this.scenario.videoUrl || this.scenario.video){ this.renderVideoStep(); return; }")) throw new Error('Home video scenario must enter the video renderer');
if (!data.includes("video:'home-tidy-room.mp4'")) throw new Error('Home adventure must declare its public video asset');
if (!data.includes("import { assetDirectoryUrl } from '../../services/AssetService.js';")) throw new Error('Language Adventures must use the directory asset resolver');
if (!data.includes("VIDEO_ROOT = assetDirectoryUrl('games/language-adventures/video', 'video');")) throw new Error('Video asset root must use Cloudinary video resource type');
if (!data.includes("type:'video-tap'")) throw new Error('Home adventure must use video interaction checkpoints');
for (const token of ['videoStart','videoPause','VIDEO_ROOT','home-tidy-room.mp4']) if (!data.includes(token)) throw new Error(`Video adventure data missing ${token}`);
for (const token of ['videoStart:0','videoPause:1.85','videoStart:1.85','videoPause:5','videoStart:5','videoPause:6.85','videoStart:6.85','videoPause:8.55']) if (!data.includes(token)) throw new Error(`Home video checkpoint missing ${token}`);
for (const token of ["video:'park-adventure.mp4'","video:'school-adventure.mp4'","video:'world-adventure.mp4'",'videoPause:2.20','videoPause:4.60','videoPause:7.50','videoPause:9.20']) if (!data.includes(token)) throw new Error(`Little Adventures video integration missing ${token}`);
for (const token of ['.adventure-video','.video-hotspot','.video-progress','.video-phrase-card']) if (!css.includes(token)) throw new Error(`Video adventure style missing ${token}`);

const svg=read('games/language-adventures/assets/new/targets.svg');
for (const id of ['toybox','teddy','ball','bed','puppy','butterfly','friend','child','crayons','book','mountains','bottle','bin','earth','plane','landmark','globe','map']) if (!svg.includes(`id="${id}"`)) throw new Error(`Missing vector target: ${id}`);
console.log(`[PASS] Little Adventures v2: ${assets.length} art assets, vector targets, distinct activity surfaces, and character reactions`);


const renderVideoStart=game.indexOf('  renderVideoStep(){');
const renderVideoEnd=game.indexOf('\n  showVideoError(videoSrc){');
if(renderVideoStart < 0 || renderVideoEnd < 0 || renderVideoEnd <= renderVideoStart) throw new Error('Unable to isolate persistent video renderer');
const renderVideo=game.slice(renderVideoStart,renderVideoEnd);
if(!renderVideo.includes('const canReuse=Boolean(video && existingShell')) throw new Error('Home video must reuse the existing video element across checkpoints');
if(!renderVideo.includes('this.videoState={...this.videoState,stepIndex:this.stepIndex')) throw new Error('Home video checkpoint state must update without recreating the video');
if(!renderVideo.includes('if(continuing){')) throw new Error('Home video must resume the same video when advancing a checkpoint');
if(!renderVideo.includes('video.play()?.catch?.(err=>console.warn')) throw new Error('Home video must resume playback after a checkpoint');
if(renderVideo.includes('this.videoEl=null')) throw new Error('Persistent video renderer must not discard the active video element');
if(!game.includes("    },300);\n  }\n\n  playVideoToEndThenFinish()")) throw new Error('Home video checkpoint transition should use the short success delay');
if(!game.includes("if(this.scenario.video){\n          this.renderVideoStep();")) throw new Error('Video checkpoint transitions must stay inside the persistent video renderer');

const main = read('js/main.js');
if (!main.includes("'strawberry-garden': assetUrl('games/strawberry-garden/art/strawberry.svg')")) {
  throw new Error('Launcher Strawberry Garden art path is incorrect');
}
if (!game.includes("import targetsSvg from './assets/new/targets.svg?raw';")) {
  throw new Error('Little Adventures target sprite must be imported as build-time SVG text');
}
if (!game.includes('ensureTargetSymbols()') || !game.includes("id='la-target-symbols'")) {
  throw new Error('Little Adventures must inline target symbols into the same document');
}
if (game.includes('targets.svg#') || game.includes('${NEW_ART_ROOT}targets.svg')) {
  throw new Error('Little Adventures must not use cross-origin external SVG symbol references');
}
if (!game.includes('<use href=\"#${k}\"></use>')) {
  throw new Error('Little Adventures target icons must reference same-document symbols');
}
if (!game.includes('if(remaining<=0){') || !game.includes('this.showTimeUp();')) {
  throw new Error('Little Adventures must recover visibly when the session is expired');
}
