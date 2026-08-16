import { GameModule } from '../../core/GameModule.js';
import { tapFeedback, vibrate } from '../../services/FeedbackService.js';

const SHAPES = [
  ['●', 'circle'], ['■', 'square'], ['▲', 'triangle'], ['★', 'star'], ['◆', 'diamond']
];

export class ShapePopGame extends GameModule {
  static metadata = {
    id: 'shape-pop',
    name: '🔷 Shape Pop',
    description: 'Find and tap the big friendly shape shown at the top.',
    version: '1.0.0',
    author: 'Baby Games',
    assetPath: 'games/shape-pop/assets/'
  };

  constructor(platform){ super(platform); this.root=null; this.isRunning=false; this.remainingSeconds=0; this.timerId=null; this.score=0; this.target=null; }
  async initialize(){ this.mountUI(); }
  start(){ this.timerService?.startSession?.(); this.remainingSeconds=this.timerService?.getRemainingSeconds?.()??120; this.score=0; this.isRunning=true; this.nextRound(); this.timerId=setInterval(()=>this.tick(),250); }
  tick(){this.remainingSeconds=this.timerService?.getRemainingSeconds?.()??Math.max(0,this.remainingSeconds-1);this.updateTimer();if(this.remainingSeconds<=0)this.endSession();}
  endSession(){if(!this.isRunning)return;this.isRunning=false;clearInterval(this.timerId);this.timerService?.endSession?.();this.platform?.audioManager?.speak?.(`Great playing! You found ${this.score} shapes.`);}
  stop(){this.isRunning=false;clearInterval(this.timerId);} pause(){this.stop();} resume(){if(this.remainingSeconds>0){this.isRunning=true;this.timerId=setInterval(()=>this.tick(),250);this.nextRound();}} reset(){this.stop();this.start();} cleanup(){this.stop();this.root?.remove();this.root=null;}
  mountUI(){const host=this.getGameContainerEl();this.root=document.createElement('section');this.root.className='simple-game shape-game';this.root.innerHTML=`<header class="simple-game-header"><div>🔷 Shape Pop</div><div>⏱ <span data-role="timer">0:00</span> · ⭐ <span data-role="score">0</span></div></header><div class="shape-prompt">Find <strong data-role="prompt">●</strong></div><div class="shape-grid" data-role="grid"></div>`;host?.appendChild(this.root);this.timerEl=this.root.querySelector('[data-role="timer"]');this.scoreEl=this.root.querySelector('[data-role="score"]');this.prompt=this.root.querySelector('[data-role="prompt"]');this.grid=this.root.querySelector('[data-role="grid"]');}
  nextRound(){if(!this.isRunning)return;this.grid.innerHTML='';this.target=SHAPES[Math.floor(Math.random()*SHAPES.length)];this.prompt.textContent=this.target[0];const choices=[...SHAPES].sort(()=>Math.random()-0.5);choices.forEach(([char,name])=>{const b=document.createElement('button');b.type='button';b.className='shape-target';b.textContent=char;b.dataset.name=name;b.addEventListener('click',()=>{if(!this.isRunning)return;if(name===this.target[1]){this.score++;tapFeedback(this.platform?.audioManager,'success');vibrate([15,20,30]);this.nextRound();}else{tapFeedback(this.platform?.audioManager,'error');vibrate(10);b.classList.add('shape-wrong');setTimeout(()=>b.classList.remove('shape-wrong'),180);}});this.grid.appendChild(b);});this.updateScore();this.updateTimer();}
  updateScore(){if(this.scoreEl)this.scoreEl.textContent=this.score;} updateTimer(){if(!this.timerEl)return;const m=Math.floor(this.remainingSeconds/60),s=String(this.remainingSeconds%60).padStart(2,'0');this.timerEl.textContent=`${m}:${s}`;}
}
