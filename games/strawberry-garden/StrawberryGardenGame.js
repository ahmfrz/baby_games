import { GameModule } from '../../core/GameModule.js';
import { rewardFeedback, tapFeedback } from '../../services/FeedbackService.js';

export const STRAWBERRY_SCENES = [
  { id: 'find', title: 'Find the strawberry', prompt: 'Can you find the strawberry?', kind: 'find' },
  { id: 'pick', title: 'Pick the strawberry', prompt: 'Pick the strawberry!', kind: 'pick' },
  { id: 'basket', title: 'Fill the basket', prompt: 'Put the strawberries in the basket.', kind: 'basket' },
  { id: 'wash', title: 'Wash the strawberry', prompt: 'Give the strawberry a wash!', kind: 'wash' },
  { id: 'shake', title: 'Make a strawberry shake', prompt: "Let's make a strawberry shake!", kind: 'shake' },
  { id: 'decorate', title: 'Decorate the treat', prompt: 'Make it pretty with strawberries!', kind: 'decorate' },
  { id: 'free', title: 'Strawberry garden', prompt: 'Now you can play!', kind: 'free' }
];

export const STRAWBERRY_COLORS = [
  { name: 'Berry Red', value: '#FF416C' }, { name: 'Sunshine', value: '#FFD84D' },
  { name: 'Grape', value: '#A855F7' }, { name: 'Sky', value: '#2FB7FF' },
  { name: 'Mint', value: '#35D6A4' }, { name: 'Tangerine', value: '#FF8A3D' },
  { name: 'Leaf', value: '#58C84D' }
];
export const TARGET_COUNTS = [1, 2, 3];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function berrySvg({ face = 'happy', size = 150, className = '' } = {}) {
  const eyes = face === 'surprised'
    ? '<circle cx="64" cy="68" r="5.5" fill="#402B32"/><circle cx="96" cy="68" r="5.5" fill="#402B32"/>'
    : '<path d="M58 68 Q64 74 70 68 M90 68 Q96 74 102 68" fill="none" stroke="#402B32" stroke-width="4.5" stroke-linecap="round"/>';
  const mouth = face === 'surprised' ? '<ellipse cx="80" cy="87" rx="6" ry="8" fill="#402B32"/>' : '<path d="M70 84 Q80 96 90 84" fill="none" stroke="#402B32" stroke-width="4.5" stroke-linecap="round"/>';
  return `<svg class="sg-berry ${className}" width="${size}" height="${size}" viewBox="0 0 160 160" aria-label="Strawberry">
    <defs><linearGradient id="berryGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF6B7D"/><stop offset=".5" stop-color="#FF3155"/><stop offset="1" stop-color="#D8173C"/></linearGradient></defs>
    <ellipse cx="80" cy="145" rx="43" ry="7" fill="#7E334033"/>
    <path d="M80 34 C52 23 25 45 31 79 C36 111 61 137 80 145 C99 137 124 111 129 79 C135 45 108 23 80 34Z" fill="url(#berryGrad)" stroke="#C91439" stroke-width="2"/>
    <path d="M52 37 C61 19 72 15 80 27 C88 15 99 19 108 37 C97 32 89 35 80 44 C71 35 63 32 52 37Z" fill="#5CCB52" stroke="#3EA33A" stroke-width="2"/>
    <g fill="#FFE9A8">${[[54,57],[80,52],[106,57],[46,82],[68,78],[92,78],[114,82],[57,106],[80,102],[103,106]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="3.2" ry="6"/>`).join('')}</g>
    ${eyes}${mouth}<circle cx="57" cy="82" r="8" fill="#FF9DA8" opacity=".45"/><circle cx="103" cy="82" r="8" fill="#FF9DA8" opacity=".45"/>
  </svg>`;
}

export class StrawberryGardenGame extends GameModule {
  static metadata = { id: 'strawberry-garden', name: '🍓 Strawberry Garden', description: 'A colorful strawberry adventure for little hands.', version: '2.0.0', author: 'Baby Games', assetPath: 'games/strawberry-garden/' };

  constructor(platform) {
    super(platform); this.root = null; this.sessionRunning = false; this.sceneIndex = 0; this.targetCount = 1;
    this.placedCount = 0; this.washProgress = 0; this.shakeReady = false; this.decorationCount = 0;
    this.usedBasket = new Set(); this.usedDecor = new Set(); this.drag = null; this.completing = false;
    this.pending = new Set(); this.color = STRAWBERRY_COLORS[0].value; this.washLast = 0;
  }

  async initialize() { await this.audioManager?.initialize?.(); this.mountUI(); }
  start() { this.sessionRunning = true; this.resetState(); this.renderScene(); this.announceCurrent(); }
  pause() { this.sessionRunning = false; this.cancelDrag(); }
  resume() { this.sessionRunning = true; }
  stop() { this.sessionRunning = false; this.cancelDrag(); this.pending.forEach(clearTimeout); this.pending.clear(); this.audioManager?.stopSpeaking?.(); }
  reset() { this.stop(); this.start(); }
  cleanup() { this.stop(); this.root?.remove(); this.root = null; }
  resetState() { this.sceneIndex = 0; this.targetCount = TARGET_COUNTS[Math.floor(Math.random()*3)]; this.placedCount = 0; this.washProgress = 0; this.shakeReady = false; this.decorationCount = 0; this.usedBasket.clear(); this.usedDecor.clear(); this.completing = false; }
  get scene() { return STRAWBERRY_SCENES[this.sceneIndex]; }

  mountUI() {
    if (this.root?.isConnected) return;
    const host = this.getGameContainerEl(); if (!host) throw new Error('Strawberry Garden container unavailable.');
    const root = document.createElement('section'); root.id = 'strawberry-garden-game'; root.className = 'strawberry-game';
    root.innerHTML = `<header class="sg-topbar"><div class="sg-logo"><span>🍓</span><div><small>PLAY • DISCOVER • CREATE</small><strong>Strawberry Garden</strong></div></div><div class="sg-step" data-sg-progress></div></header><main class="sg-stage" data-sg-scene></main><div class="sg-prompt" data-sg-prompt></div>`;
    host.appendChild(root); this.root = root;
    root.addEventListener('click', e => this.onClick(e));
    root.addEventListener('pointerdown', e => this.onPointerDown(e), { passive:false }); root.addEventListener('pointermove', e => this.onPointerMove(e), { passive:false });
    root.addEventListener('pointerup', () => this.onPointerUp()); root.addEventListener('pointercancel', () => this.cancelDrag());
  }

  renderScene() {
    if (!this.root) return; this.cancelDrag(); this.completing = false;
    this.root.querySelector('[data-sg-scene]').innerHTML = this.sceneMarkup();
    this.root.querySelector('[data-sg-prompt]').textContent = this.scene.prompt;
    this.root.querySelector('[data-sg-progress]').textContent = this.scene.kind === 'free' ? 'FREE PLAY' : `${this.sceneIndex + 1} / 6`;
  }

  sceneMarkup() {
    switch(this.scene.kind) {
      case 'find': return `<div class="sg-world garden"><div class="sg-sky"><i class="sun"></i><i class="cloud one"></i><i class="cloud two"></i></div><div class="hills"></div><div class="garden-bed"><span class="leaf l1">🍃</span><span class="leaf l2">🌱</span><span class="leaf l3">🍃</span><button class="berry-button hidden-berry" data-action="find">${berrySvg({face:'surprised',size:170})}</button><button class="garden-object flower">🌼</button><button class="garden-object apple">🍎</button><button class="garden-object butterfly">🦋</button></div><div class="sg-fireflies">✦　·　✦</div></div>`;
      case 'pick': return `<div class="sg-world orchard"><div class="orchard-sun">☀</div><div class="orchard-tree"><span>🍃</span><span>🌿</span><span>🍃</span></div><button class="berry-button hanging" data-action="pick">${berrySvg({size:190})}<span class="tap-ring"></span></button><div class="wooden-basket">🧺<small>Basket</small></div></div>`;
      case 'basket': return `<div class="sg-world basket-world"><div class="counter-card"><span>STRAWBERRIES</span><strong>${this.placedCount}<em>/ ${this.targetCount}</em></strong></div><div class="berry-row">${Array.from({length:this.targetCount},(_,i)=>this.usedBasket.has(i)?'':`<div class="drag-berry" data-drag-kind="basket" data-item-index="${i}">${berrySvg({size:130})}</div>`).join('')}</div><div class="basket-target" data-drop-target="basket"><div class="basket-glow"></div><span>🧺</span><small>Drop here</small></div></div>`;
      case 'wash': return `<div class="sg-world wash-world"><div class="tile-wall"></div><div class="sink"><div class="faucet">🚰</div><div class="water"></div><div class="basin"></div></div><div class="wash-berry ${this.washProgress>60?'clean':''}" data-wash-target>${berrySvg({face:this.washProgress>60?'happy':'surprised',size:205})}<div class="soap-bubbles">${this.washProgress>10?'○ ○ ○':''}</div></div><div class="wash-meter"><span style="width:${this.washProgress}%"></span></div><div class="wash-label">${this.washProgress>60?'ALL CLEAN!':'RUB THE STRAWBERRY'}</div></div>`;
      case 'shake': return `<div class="sg-world kitchen-world"><div class="kitchen-window"><i></i><i></i></div><div class="counter"></div><div class="shake-berry" data-drag-kind="shake">${berrySvg({size:145})}<small>Strawberry</small></div><div class="milk"><span>🥛</span><small>Milk</small></div><div class="blender ${this.shakeReady?'ready':''}" data-drop-target="blender"><div class="jar"><div class="pink-liquid"></div></div><div class="base"></div><div class="blender-star">✦</div></div><button class="blend-button" data-action="blend" ${this.shakeReady?'':'disabled'}>${this.shakeReady?'BLEND!':'DRAG IT HERE'}</button></div>`;
      case 'decorate': return `<div class="sg-world bakery-world"><div class="bakery-window"><span>♡</span><span>CAFE</span></div><div class="cake" data-drop-target="cake"><div class="cake-top"><div class="icing"></div></div><div class="cake-body"></div><div class="cake-berries"></div></div><div class="decor-tray"><small>ADD STRAWBERRIES</small><div>${[0,1,2].map(i=>this.usedDecor.has(i)?'':`<div class="decor-berry" data-drag-kind="decorate" data-item-index="${i}">${berrySvg({size:105})}</div>`).join('')}</div></div><div class="decor-count">${this.decorationCount} / 3</div></div>`;
      case 'free': return `<div class="sg-world free-world"><div class="free-sky"><i class="sun"></i><i class="cloud one"></i><i class="cloud two"></i></div><div class="rainbow">◜　◝</div><div class="free-hills"></div><div class="free-tree">🌳</div><div class="free-flower f1">🌷</div><div class="free-flower f2">🌻</div><button class="free-berry b1" data-free-berry>${berrySvg({size:145})}</button><button class="free-berry b2" data-free-berry>${berrySvg({size:120})}</button><button class="free-berry b3" data-free-berry>${berrySvg({size:135})}</button><button class="free-butterfly" data-free-berry>🦋</button><div class="free-palette">${STRAWBERRY_COLORS.map(c=>`<button class="color-dot ${c.value===this.color?'selected':''}" data-color="${c.value}" style="--c:${c.value}" aria-label="${c.name}"></button>`).join('')}</div><button class="play-again" data-action="restart">Play again</button></div>`;
      default: return '';
    }
  }

  onClick(event) {
    const action = event.target.closest?.('[data-action]')?.dataset.action;
    if (action === 'find') return this.completeScene('You found it!');
    if (action === 'pick') return this.pickStrawberry();
    if (action === 'blend') return this.blendShake();
    if (action === 'restart') return this.reset();
    const color = event.target.closest?.('[data-color]')?.dataset.color;
    if (color) { this.color=color; this.root.querySelectorAll('.color-dot').forEach(b=>b.classList.toggle('selected',b.dataset.color===color)); this.announce('Pretty color!'); }
    const free = event.target.closest?.('[data-free-berry]'); if (free) { free.classList.remove('pulse'); void free.offsetWidth; free.classList.add('pulse'); tapFeedback(this.audioManager,'tap'); }
  }

  onPointerDown(event) {
    if (!this.sessionRunning) return;
    const wash = event.target.closest?.('[data-wash-target]'); const drag = event.target.closest?.('[data-drag-kind]');
    if (wash && this.scene.kind==='wash') { event.preventDefault(); this.wash(event); return; }
    if (drag && ['basket','decorate','shake'].includes(drag.dataset.dragKind)) { event.preventDefault(); this.startDrag(event,drag); }
  }
  onPointerMove(event) {
    if (!this.sessionRunning) return;
    if (this.scene.kind==='wash' && (event.buttons & 1 || event.pointerType==='touch')) this.wash(event);
    if (this.drag) { event.preventDefault(); this.moveDrag(event); }
  }
  onPointerUp() { if (this.drag) this.finishDrag(); }
  startDrag(event,source) { this.drag={source,kind:source.dataset.dragKind,ghost:source.cloneNode(true)}; this.drag.ghost.classList.add('drag-ghost'); document.body.appendChild(this.drag.ghost); source.style.opacity='.15'; this.moveDrag(event); }
  moveDrag(event) { if (!this.drag) return; this.drag.ghost.style.left=`${event.clientX}px`; this.drag.ghost.style.top=`${event.clientY}px`; }
  finishDrag() {
    if (!this.drag) return; const {source,kind,ghost}=this.drag; const r=ghost.getBoundingClientRect(); ghost.remove(); source.style.opacity=''; this.drag=null;
    const target = this.root.querySelector(kind==='basket'?'[data-drop-target="basket"]':kind==='shake'?'[data-drop-target="blender"]':'[data-drop-target="cake"]'); if(!target) return;
    const t=target.getBoundingClientRect(); const cx=r.left+r.width/2, cy=r.top+r.height/2; const hit=cx>t.left-90&&cx<t.right+90&&cy>t.top-90&&cy<t.bottom+90; if(!hit) return;
    if(kind==='basket'){ const i=Number(source.dataset.itemIndex); if(this.usedBasket.has(i)) return; this.usedBasket.add(i); this.placedCount++; }
    if(kind==='decorate'){ const i=Number(source.dataset.itemIndex); if(this.usedDecor.has(i)) return; this.usedDecor.add(i); this.decorationCount++; }
    if(kind==='shake') this.shakeReady=true; tapFeedback(this.audioManager,'success'); this.renderScene();
    if((kind==='basket'&&this.placedCount>=this.targetCount)||(kind==='decorate'&&this.decorationCount>=3)) this.completeScene(kind==='basket'?'Into the basket!':'So pretty!');
  }
  cancelDrag(){ if(!this.drag)return; this.drag.ghost?.remove(); this.drag.source.style.opacity=''; this.drag=null; }
  wash(event){ const now=performance.now(); if(now-this.washLast<35)return; this.washLast=now; const t=this.root.querySelector('[data-wash-target]'); if(!t)return; const r=t.getBoundingClientRect(); const x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height; if(x<-.25||x>1.25||y<-.25||y>1.25)return; this.washProgress=clamp(this.washProgress+2.5,0,100); if(this.washProgress>=80)this.completeScene('All clean!'); else if(Math.floor(this.washProgress)%10===0)this.renderScene(); }
  pickStrawberry(){ if(this.scene.kind!=='pick'||this.completing)return; const b=this.root.querySelector('.hanging'); if(!b||b.dataset.done)return; b.dataset.done='true'; b.classList.add('picked'); tapFeedback(this.audioManager,'success'); const id=setTimeout(()=>{this.pending.delete(id);this.completeScene('Got it!')},500);this.pending.add(id); }
  blendShake(){ if(this.scene.kind!=='shake'||!this.shakeReady||this.completing)return; const b=this.root.querySelector('.blend-button'); if(b?.disabled)return; b.disabled=true; this.root.querySelector('.blender')?.classList.add('blending'); const id=setTimeout(()=>{this.pending.delete(id);this.completeScene('Yummy strawberry shake!')},900);this.pending.add(id); }
  completeScene(message){ if(!this.sessionRunning||this.scene.kind==='free'||this.completing)return; this.completing=true; rewardFeedback(this.platform,message,'🍓'); tapFeedback(this.audioManager,'success'); const id=setTimeout(()=>{this.pending.delete(id);this.sceneIndex=Math.min(this.sceneIndex+1,STRAWBERRY_SCENES.length-1);this.renderScene();this.announceCurrent();},700);this.pending.add(id); }
  announceCurrent(){this.announce(this.scene.prompt);} announce(text){this.audioManager?.ensureRunning?.();this.audioManager?.speak?.(text,.86);}
}
