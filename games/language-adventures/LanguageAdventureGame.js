import { GameModule } from '../../core/GameModule.js';
import { rewardFeedback, tapFeedback, vibrate, completionFeedback } from '../../services/FeedbackService.js';
import { ASSET_ROOT, NEW_ART_ROOT, VIDEO_ROOT, SCENARIOS } from './languageData.js';

const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));

export class LanguageAdventureGame extends GameModule {
  static metadata = { id:'language-adventures', name:'🗺️ Little Adventures', description:'Explore, learn, and make kind choices.', version:'2.2.0', author:'Baby Games', assetPath:'games/language-adventures/assets/' };
  constructor(platform){ super(platform); this.root=null; this.stage=null; this.scenario=null; this.videoEl=null; this.stepIndex=0; this.score=0; this.totalStars=this.loadTotalStars(); this.soundEnabled=this.loadSoundPreference(); this.isRunning=false; this.remainingSeconds=0; this.timerId=null; this.stepLocked=false; this.timers=new Set(); this.cleanupFns=[]; this.completed=this.loadProgress(); }
  async initialize(){ this.mount(); this.showMap(); }
  start(){ this.timerService?.startSession?.(); this.remainingSeconds=this.timerService?.getRemainingSeconds?.()??120; this.score=0; this.isRunning=true; this.startTimerLoop(); this.updateStats(); }
  stop(){ this.isRunning=false; clearInterval(this.timerId); this.timerId=null; this.videoEl?.pause?.(); this.videoEl=null; this.clearTimers(); this.clearListeners(); this.platform?.audioManager?.stopSpeaking?.(); }
  pause(){this.isRunning=false;clearInterval(this.timerId);this.timerId=null;this.videoEl?.pause?.();this.platform?.audioManager?.stopSpeaking?.()} resume(){ if(this.remainingSeconds>0){this.isRunning=true;this.startTimerLoop();if(this.scenario){if(this.scenario.video&&this.videoEl){this.videoEl.play()?.catch?.(()=>{});}else this.renderStep();}else this.showMap();} }
  reset(){this.stop();this.start();this.showMap();}
  cleanup(){this.stop();this.root?.remove();this.root=null;}
  tick(){ if(!this.isRunning)return; this.remainingSeconds=this.timerService?.getRemainingSeconds?.()??Math.max(0,this.remainingSeconds-1); this.updateStats(); if(this.remainingSeconds<=0)this.endSession(); }
  endSession(){ if(!this.isRunning)return; this.isRunning=false; clearInterval(this.timerId); this.timerId=null; this.clearTimers(); this.clearListeners(); this.timerService?.endSession?.(); this.showTimeUp(); completionFeedback(this.platform,`You explored ${this.score} little steps!`,'🌍',this.score); }
  mount(){
    const host=this.getGameContainerEl();
    this.root=document.createElement('section'); this.root.className='la2';
    this.root.innerHTML=`<div class="la2-shell"><header class="la2-header"><div class="la2-brand"><span class="la2-logo">🌍</span><div><strong>Little Adventures</strong><small>Explore • Learn • Grow</small></div></div><div class="la2-stats"><span>⏱ <b data-role="timer">2:00</b></span><span>⭐ <b data-role="score">0</b></span><span>🏆 <b data-role="total">0</b></span><button class="sound-toggle" data-sound aria-label="Turn sound off" aria-pressed="true">🔊</button></div></header><main class="la2-main"><div data-role="view"></div><div class="sr-only" data-role="status" aria-live="polite"></div></main></div>`;
    host?.appendChild(this.root); this.view=this.root.querySelector('[data-role="view"]'); this.timerEl=this.root.querySelector('[data-role="timer"]'); this.scoreEl=this.root.querySelector('[data-role="score"]'); this.totalEl=this.root.querySelector('[data-role="total"]'); this.statusEl=this.root.querySelector('[data-role="status"]'); this.soundBtn=this.root.querySelector('[data-sound]'); this.soundBtn?.addEventListener('click',()=>this.toggleSound()); this.updateSoundButton();
  }
  loadProgress(){ try{return JSON.parse(localStorage.getItem('baby-games:little-adventures:completed')||'{}')}catch{return {}} }
  saveProgress(){ try{localStorage.setItem('baby-games:little-adventures:completed',JSON.stringify(this.completed))}catch{} }
  loadTotalStars(){ try{return Number(localStorage.getItem('baby-games:little-adventures:stars')||0)}catch{return 0} }
  saveTotalStars(){ try{localStorage.setItem('baby-games:little-adventures:stars',String(this.totalStars))}catch{} }
  loadSoundPreference(){ try{return localStorage.getItem('baby-games:little-adventures:sound')!=='off'}catch{return true} }
  saveSoundPreference(){ try{localStorage.setItem('baby-games:little-adventures:sound',this.soundEnabled?'on':'off')}catch{} }
  toggleSound(){ this.soundEnabled=!this.soundEnabled; this.saveSoundPreference(); this.updateSoundButton(); if(!this.soundEnabled)this.platform?.audioManager?.stopSpeaking?.(); else if(this.scenario)this.speak(this.scenario.steps[this.stepIndex]); this.announce(this.soundEnabled?'Sound on':'Sound off'); }
  updateSoundButton(){ if(!this.soundBtn)return; this.soundBtn.textContent=this.soundEnabled?'🔊':'🔇'; this.soundBtn.setAttribute('aria-pressed',String(this.soundEnabled)); this.soundBtn.setAttribute('aria-label',this.soundEnabled?'Turn sound off':'Turn sound on'); }
  announce(message){ if(this.statusEl)this.statusEl.textContent=message; }
  startTimerLoop(){ clearInterval(this.timerId); this.timerId=setInterval(()=>this.tick(),250); }
  showMap(){
    this.scenario=null;
    const completedCount=SCENARIOS.filter(s=>this.completed[s.id]).length;
    this.view.innerHTML=`<section class="la2-map"><div class="la2-map-hero"><div class="la2-hero-art"><img class="hero-character-art" src="${NEW_ART_ROOT}characters/toddler/happy.png" alt="Little explorer"></div><div class="la2-hero-copy"><span class="eyebrow">BIG WORLD • SMALL STEPS</span><h1>Choose an adventure</h1><p>Tap a place, learn a simple phrase, and make a kind choice.</p><div class="la2-values"><span>💛 Be kind</span><span>🔎 Be curious</span><span>🌱 Keep growing</span></div></div></div><div class="la2-path">${SCENARIOS.map((s,i)=>{const done=Boolean(this.completed[s.id]);return `<button class="la2-card tone-${s.tone} ${done?'is-complete':''}" data-id="${s.id}"><div class="card-art"><img src="${NEW_ART_ROOT}${s.cardArt||s.art}" alt=""></div><div class="card-body"><div class="card-title"><span>${s.icon}</span><strong>${s.title}</strong><em>${done?'✓':i+1}</em></div><p>${s.subtitle}</p><span class="play-pill">${done?'Play again':'Play adventure'} <b>→</b></span></div></button>`}).join('')}</div><div class="la2-progress-panel"><div><strong>${completedCount}/${SCENARIOS.length} adventures explored</strong><span>${this.totalStars} total stars</span></div><div class="progress-track"><i style="width:${(completedCount/SCENARIOS.length)*100}%"></i></div></div><div class="la2-map-footer">✨ Every adventure teaches a little phrase and a big idea. ✨</div></section>`;
    this.view.querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>this.choose(b.dataset.id)));
  }
  choose(id){
    const next=SCENARIOS.find(s=>s.id===id);
    if(!next || !this.view)return;

    // The platform may animate the host while the game changes screens. Make
    // the game surface explicitly visible before swapping the map for play.
    const host=this.getGameContainerEl();
    if(host){
      host.style.display='flex';
      host.style.visibility='visible';
      host.style.opacity='1';
      host.style.transform='';
    }
    if(this.root){
      this.root.style.display='block';
      this.root.style.visibility='visible';
      this.root.style.opacity='1';
    }

    if(!this.isRunning){
      const remaining=this.timerService?.getRemainingSeconds?.() ?? this.remainingSeconds;
      if(remaining<=0){ this.showTimeUp(); return; }
      this.isRunning=true;
      this.remainingSeconds=remaining;
      this.startTimerLoop();
    }

    this.scenario=next;
    this.stepIndex=0;
    this.updateStats();
    try{
      this.renderStep();
    }catch(error){
      console.error('[Little Adventures] Failed to open adventure:',error);
      this.showRenderError(error);
    }
  }

  showRenderError(error=null){
    if(!this.view)return;
    this.clearTimers();
    this.clearListeners();
    if(error) console.error('[Little Adventures] Render error details:',error);
    this.view.innerHTML=`<section class="la2-error"><div class="la2-error-card"><div class="timeup-icon">🧭</div><h2>Let’s try that again!</h2><p>This adventure did not open correctly.</p><div class="complete-actions"><button data-error-map>Back to adventures</button></div></div></section>`;
    this.view.querySelector('[data-error-map]')?.addEventListener('click',()=>this.showMap());
  }
  renderStep(){
    if(!this.scenario || !this.view)return;
    if(this.scenario.video){ this.renderVideoStep(); return; }
    const step=this.scenario.steps?.[this.stepIndex];
    if(!step){ console.error('[Little Adventures] Missing adventure step', this.scenario.id, this.stepIndex); this.showRenderError(); return; }
    this.clearTimers(); this.clearListeners(); this.stepLocked=false; const s=this.scenario;
    this.view.innerHTML=`<section class="la2-play"><div class="play-top"><button class="back-btn" data-back>← Adventures</button><div class="step-title"><span>${s.icon}</span><strong>${s.title}</strong><div class="dots">${s.steps.map((_,i)=>`<i class="${i<=this.stepIndex?'on':''}"></i>`).join('')}</div><small>${this.stepIndex+1}/${s.steps.length}</small></div><button class="sound-btn" data-speak>🔊</button></div><div class="play-scene tone-${s.tone} ${s.id==='home'?'is-home-scene':''}" style="--scene:url('${NEW_ART_ROOT}${s.art}')"><div class="scene-wash"></div>${s.id==='home'?`<div class="mumma-stage"><img data-mumma src="${NEW_ART_ROOT}characters/mumma/kneel.png" alt="Mumma"></div>`:''}<div class="character-stage"><img class="scene-avatar character-idle" data-character src="${NEW_ART_ROOT}characters/toddler/idle.png" alt="Explorer"><div class="character-bubble" data-character-bubble aria-live="polite"></div></div>${s.id!=='home'?`<div class="globe-companion" data-companion>${this.iconFor('globe')}</div>`:''}<div class="phrase-card"><div class="phrase">${step.phrase}</div><div class="prompt">${step.prompt}</div></div><div class="interaction" data-interaction></div><div class="guide">💡 ${this.guideFor(step)}</div></div></section>`;
    this.view.querySelector('[data-back]').addEventListener('click',()=>this.showMap());
    this.view.querySelector('[data-speak]').addEventListener('click',()=>this.speak(step));
    this.buildInteraction(step);
    this.schedule(()=>{ this.speak(step); this.setCharacterReaction('point'); this.schedule(()=>this.setCharacterReaction('idle'),1100); },250);
  }
  renderVideoStep(){
    const s=this.scenario;
    const step=s?.steps?.[this.stepIndex];
    if(!s || !step || !this.view)return;
    this.clearTimers();
    this.clearListeners();
    this.stepLocked=false;
    this.videoEl?.pause?.();
    this.videoEl=null;

    const videoSrc=`${VIDEO_ROOT}${s.video}`;
    this.view.innerHTML=`<section class="la2-play la2-video-play"><div class="play-top"><button class="back-btn" data-back>← Adventures</button><div class="step-title"><span>${s.icon}</span><strong>${s.title}</strong><div class="dots">${s.steps.map((_,i)=>`<i class="${i<=this.stepIndex?'on':''}"></i>`).join('')}</div><small>${this.stepIndex+1}/${s.steps.length}</small></div><button class="sound-btn" data-speak>🔊</button></div><div class="play-scene video-scene tone-${s.tone}"><video class="adventure-video" data-adventure-video playsinline muted preload="auto" src="${videoSrc}"></video><div class="video-shade"></div><div class="phrase-card video-phrase-card"><div class="phrase">${step.phrase}</div><div class="prompt">${step.prompt}</div></div><div class="interaction video-interaction" data-interaction data-activity="${step.activity}"></div><div class="video-progress"><i data-video-progress></i></div><div class="guide video-guide">💡 ${this.guideFor(step)}</div></div></section>`;

    this.view.querySelector('[data-back]').addEventListener('click',()=>this.showMap());
    this.view.querySelector('[data-speak]').addEventListener('click',()=>this.speak(step));
    this.videoEl=this.view.querySelector('[data-adventure-video]');
    this.buildVideoInteraction(step);

    const video=this.videoEl;
    const start=Math.max(0,Number(step.videoStart)||0);
    const pauseAt=Math.max(start+0.1,Number(step.videoPause)||start+2);
    const progress=this.view.querySelector('[data-video-progress]');
    const syncProgress=()=>{
      const span=Math.max(0.1,pauseAt-start);
      const pct=Math.max(0,Math.min(100,((video.currentTime-start)/span)*100));
      if(progress)progress.style.width=`${pct}%`;
      if(video.currentTime >= pauseAt-0.03){
        video.pause();
        video.currentTime=Math.min(pauseAt,video.duration||pauseAt);
        if(progress)progress.style.width='100%';
      }
    };
    const startPlayback=()=>{
      try{ video.currentTime=Math.min(start,Math.max(0,(video.duration||pauseAt)-0.05)); }catch{}
      this.speak(step);
      const playPromise=video.play();
      if(playPromise?.catch)playPromise.catch(err=>console.warn('[Little Adventures] Video autoplay prevented:',err));
    };
    video.addEventListener('timeupdate',syncProgress);
    video.addEventListener('loadedmetadata',startPlayback,{once:true});
    video.addEventListener('ended',syncProgress);
    this.cleanupFns.push(()=>{video.removeEventListener('timeupdate',syncProgress);video.removeEventListener('loadedmetadata',startPlayback);video.removeEventListener('ended',syncProgress);video.pause();});
    if(video.readyState>=1)startPlayback();
  }

  buildVideoInteraction(step){
    const host=this.view?.querySelector('[data-interaction]');
    if(!host)return;
    const [x,y]=step.position||[50,60];
    const label=this.targetLabel(step.target);
    host.innerHTML=`<div class="video-target-hint" aria-hidden="true">✦</div><button class="video-hotspot target-${step.target}" data-video-tap aria-label="${label}" style="--x:${x}%;--y:${y}%"><span class="hotspot-ring"></span><span class="hotspot-icon">${this.iconFor(step.target)}</span><em>${label}</em></button>`;
    host.querySelector('[data-video-tap]').addEventListener('click',e=>this.success(step,e.currentTarget));
  }

  setCharacterReaction(state, message=''){ const avatar=this.view?.querySelector('[data-character]'); const mumma=this.view?.querySelector('[data-mumma]'); const companion=this.view?.querySelector('[data-companion]'); const bubble=this.view?.querySelector('[data-character-bubble]'); const toddlerPose={idle:'idle',point:'point',happy:'happy',surprised:'surprised'}[state]||'idle'; const mummaPose={idle:'kneel',point:'point',happy:'happy',surprised:'surprised'}[state]||'kneel'; if(avatar){ avatar.dataset.state=state; avatar.src=`${NEW_ART_ROOT}characters/toddler/${toddlerPose}.png`; avatar.classList.remove('character-idle','character-point','character-happy','character-surprised'); avatar.classList.add(`character-${state}`); } if(mumma){ mumma.dataset.state=state; mumma.src=`${NEW_ART_ROOT}characters/mumma/${mummaPose}.png`; } if(companion){ companion.dataset.state=state; } if(bubble){ bubble.textContent=message; bubble.classList.toggle('show',Boolean(message)); } }
  guideFor(step){
    const guides={
      'tidy-room':'Find the ball, then help put the toys away.', 'put-ball-away':'Tap the toy box to put the ball away.', 'put-teddy-away':'Tap the toy box to put Teddy away.', 'find-hidden':'Look carefully. Which picture is Teddy?',
      'share-toy':'Move the ball all the way to your friend.', 'bedtime':'Help the room get ready for sleep.',
      'meet-friend':'Find your new friend and say hello.', 'spot-nature':'Look closely at the pictures around you.',
      'share-at-park':'Can you share the ball with your friend?', 'follow-path':'Tap the path and start your walk.',
      'greet-classmate':'Find a friend and say hello.', 'pack-school':'Choose what belongs in your school bag.',
      'share-supplies':'Move the crayons to your friend.', 'open-book':'Tap the book to start learning.',
      'discover-view':'Look up and discover something beautiful.', 'protect-nature':'Choose something that belongs in nature.',
      'recycle-cleanup':'Move the bottle into the recycling bin.', 'care-for-earth':'Tap our happy planet.',
      'board-plane':'Tap the plane to begin your journey.', 'landmark-match':'Which picture shows a famous landmark?',
      'greet-world':'Say hello to your new world friend.', 'trace-route':'Tap the map and choose your next route.'
    };
    return guides[step.activity] || (step.type==='drag'?'Press, hold, and move the picture.':step.type==='choice'?'There is one best answer.':'Big tap, little explorer!');
  }
  speak(step){ if(!this.isRunning)return; if(!this.soundEnabled)return; this.platform?.audioManager?.speak?.(`${step.phrase} ${step.prompt}`,0.82); }
  buildInteraction(step){
    const host=this.view.querySelector('[data-interaction]');
    host.dataset.activity=step.activity||step.type;
    const activityLabels={
      'tidy-room':'HELP AT HOME','find-hidden':'LOOK & FIND','share-toy':'SHARE TOGETHER','bedtime':'BEDTIME',
      'meet-friend':'MAKE A FRIEND','spot-nature':'LOOK CLOSELY','share-at-park':'SHARE AT THE PARK','follow-path':'FOLLOW THE PATH',
      'greet-classmate':'HELLO, FRIEND','pack-school':'PACK YOUR BAG','share-supplies':'SHARE SUPPLIES','open-book':'TIME TO LEARN',
      'discover-view':'DISCOVER','protect-nature':'CARE FOR NATURE','recycle-cleanup':'CLEAN UP','care-for-earth':'OUR HOME',
      'board-plane':'ALL ABOARD','landmark-match':'TRAVEL MATCH','greet-world':'HELLO, WORLD','trace-route':'PICK A ROUTE'
    };
    const title=activityLabels[step.activity]||'LITTLE ADVENTURE';
    const decorate=content=>{host.insertAdjacentHTML('afterbegin',`<div class="activity-badge">${title}</div>`); host.insertAdjacentHTML('beforeend','<div class="activity-sparkle" aria-hidden="true">✦</div>');};
    if(step.type==='choice'){
      host.className+=' choice-grid';
      host.innerHTML=`<div class="choice-stage">${step.choices.map(([label,key,correct],i)=>`<button class="choice-card choice-${i+1}" data-correct="${correct}"><span class="choice-icon">${this.iconFor(key)}</span><strong>${label}</strong><small>${correct?'Look here!':'Try another'}</small></button>`).join('')}</div>`;
      const cards=host.querySelectorAll('.choice-card');
      cards.forEach(b=>b.addEventListener('click',()=>b.dataset.correct==='true'?this.success(step,b):this.wrong(b)));
      decorate('');
    } else if(step.type==='drag'){
      host.className+=' drag-board';
      const [tx,ty]=step.targetPosition||[78,68], [ix,iy]=step.itemPosition||[45,60];
      const actionText=step.activity==='recycle-cleanup'?'Clean it up!':step.activity?.includes('share')?'Let’s share!':'Move it here!';
      host.innerHTML=`<div class="drag-story"><span>${actionText}</span><b>→</b></div><div class="drag-target" data-target style="--x:${tx}%;--y:${ty}%">${this.iconFor(step.target)}<span>${this.targetLabel(step.target)}</span></div><button class="drag-piece" data-piece aria-label="${step.item}" style="--x:${ix}%;--y:${iy}%">${this.iconFor(step.item)}</button>`;
      this.makeDrag(host.querySelector('[data-piece]'),host.querySelector('[data-target]'),step);
      decorate('');
    } else {
      host.className+=' tap-board';
      const [x,y]=step.position||[50,62];
      const verbs={
        'tidy-room':'Tap to tidy','bedtime':'Good night','meet-friend':'Say hello','follow-path':'Go this way',
        'open-book':'Open it','discover-view':'Wow!','care-for-earth':'Care for Earth','board-plane':'Take off',
        'greet-world':'Hello!','trace-route':'Explore!'
      };
      host.innerHTML=`<div class="tap-scene-label">${verbs[step.activity]||'Your turn!'}</div><button class="big-target target-${step.target}" data-tap aria-label="${step.target}" style="--x:${x}%;--y:${y}%"><span>${this.iconFor(step.target)}</span><em>${this.targetLabel(step.target)}</em></button>`;
      host.querySelector('[data-tap]').addEventListener('click',e=>this.success(step,e.currentTarget));
      decorate('');
    }
  }
  iconFor(k){
    const supported={toybox:1,teddy:1,ball:1,book:1,bed:1,puppy:1,butterfly:1,leaf:1,path:1,friend:1,crayons:1,cup:1,mountains:1,bottle:1,bin:1,earth:1,wrapper:1,plane:1,landmark:1,cloud:1,suitcase:1,globe:1,map:1,child:1};
    if(!supported[k]) return '<span class="fallback-icon">✨</span>';
    return `<svg class="asset-icon icon-${k}" viewBox="0 0 200 190" aria-hidden="true"><use href="${NEW_ART_ROOT}targets.svg#${k}"></use></svg>`;
  }
  targetLabel(k){return {child:'Explorer',friend:'Friend',bin:'Recycle',teddy:'Teddy',toybox:'Toy box',ball:'Ball',book:'Book'}[k]||k;}
  makeDrag(item,target,step){ let dragging=false,id=null,ox=0,oy=0; const [ix,iy]=step.itemPosition||[45,60]; const origin={left:`${ix}%`,top:`${iy}%`}; item.style.left=origin.left; item.style.top=origin.top; const move=e=>{if(!dragging||e.pointerId!==id)return; const r=this.view.querySelector('.play-scene').getBoundingClientRect(); item.style.left=`${clamp(e.clientX-r.left-ox,10,r.width-item.offsetWidth-10)}px`; item.style.top=`${clamp(e.clientY-r.top-oy,120,r.height-item.offsetHeight-15)}px`; const a=item.getBoundingClientRect(),b=target.getBoundingClientRect(); target.classList.toggle('near',!(a.right<b.left||a.left>b.right||a.bottom<b.top||a.top>b.bottom));}; const up=e=>{if(e.pointerId!==id)return; dragging=false; item.releasePointerCapture?.(id); id=null; const a=item.getBoundingClientRect(),b=target.getBoundingClientRect(); const ok=!(a.right<b.left||a.left>b.right||a.bottom<b.top||a.top>b.bottom); target.classList.remove('near'); if(ok)this.success(step,item); else {item.classList.add('return');item.style.left=origin.left;item.style.top=origin.top;this.schedule(()=>item.classList.remove('return'),280);this.wrong(item);} }; item.addEventListener('pointerdown',e=>{e.preventDefault();id=e.pointerId;dragging=true;const r=item.getBoundingClientRect();ox=e.clientX-r.left;oy=e.clientY-r.top;item.setPointerCapture?.(id)}); item.addEventListener('pointermove',move);item.addEventListener('pointerup',up);item.addEventListener('pointercancel',up); this.cleanupFns.push(()=>{item.removeEventListener('pointermove',move);item.removeEventListener('pointerup',up);item.removeEventListener('pointercancel',up);}); }
  success(step,el){
    if(this.stepLocked||!this.isRunning)return;
    this.stepLocked=true;
    el?.classList.add('hit');
    this.applyActivitySuccess(step,el);
    this.score+=1;
    this.setCharacterReaction('happy',step.success);
    this.updateStats();
    this.totalStars+=1; this.saveTotalStars();
    rewardFeedback(this.platform,step.success,'⭐');
    this.announce(step.success);
    tapFeedback(this.platform?.audioManager,'success');
    vibrate([18,25,35]);
    const phrase=this.view.querySelector('.phrase');
    phrase?.classList.add('win');
    this.schedule(()=>{if(!this.scenario)return;if(this.stepIndex<this.scenario.steps.length-1){this.stepIndex++;this.renderStep();}else this.finish();},850);
  }
  applyActivitySuccess(step,el){
    const host=this.view?.querySelector('[data-interaction]');
    if(!host)return;
    const effects={
      'tidy-room':['🧸','🧹','✨'],'find-hidden':['🔎','⭐'],'share-toy':['💛','🤝'],'bedtime':['🌙','⭐','💤'],
      'meet-friend':['👋','🐶','💛'],'spot-nature':['🦋','🌿','✨'],'share-at-park':['🤝','⚽','💚'],'follow-path':['👣','➡️','🌳'],
      'greet-classmate':['👋','😊'],'pack-school':['🎒','✏️','⭐'],'share-supplies':['🤝','🖍️'],'open-book':['📖','💡','⭐'],
      'discover-view':['🏔️','✨'],'protect-nature':['🌿','🦋','💚'],'recycle-cleanup':['♻️','💚','✨'],'care-for-earth':['🌍','💚','⭐'],
      'board-plane':['✈️','☁️','✨'],'landmark-match':['📍','⭐'],'greet-world':['🌍','👋','💛'],'trace-route':['🗺️','👣','✨']
    };
    const burst=effects[step.activity]||['⭐','✨'];
    const fx=document.createElement('div');
    fx.className='activity-success-burst';
    fx.innerHTML=burst.map(x=>`<span>${x}</span>`).join('');
    host.appendChild(fx);
    host.classList.add(`activity-success-${step.activity}`);
    this.schedule(()=>fx.remove(),720);
  }
  wrong(el){ this.announce('Try again.'); this.setCharacterReaction('surprised','Try again!'); this.schedule(()=>this.setCharacterReaction('idle'),900); tapFeedback(this.platform?.audioManager,'error');vibrate(10);el?.classList.remove('wrong');void el?.offsetWidth;el?.classList.add('wrong');}
  showTimeUp(){
    this.view.innerHTML=`<section class="la2-timeup"><div class="timeup-card"><div class="timeup-icon">⏰</div><h2>Time for a little break!</h2><p>You explored ${this.score} little steps. Adventures can wait for another day.</p><div class="complete-actions"><button data-retry>Try again</button><button data-map>Choose an adventure</button></div></div></section>`;
    this.view.querySelector('[data-retry]')?.addEventListener('click',()=>{this.start();this.showMap()});
    this.view.querySelector('[data-map]')?.addEventListener('click',()=>{this.start();this.showMap()});
  }
  finish(){this.clearTimers();this.clearListeners(); const s=this.scenario; if(s){this.completed[s.id]=true;this.saveProgress();} this.view.innerHTML=`<section class="la2-complete" style="--scene:url('${NEW_ART_ROOT}adventure-complete.png')"><div class="complete-art"></div><div class="complete-characters"><img class="complete-toddler" src="${NEW_ART_ROOT}explorer-celebrate.png" alt="Explorer celebrating"><img class="complete-mumma" src="${NEW_ART_ROOT}mumma-encourage.png" alt="Mumma cheering"><span>${this.iconFor('globe')}</span></div><div class="complete-card"><div class="burst">✨ ⭐ ✨</div><h2>Adventure complete!</h2><p>${s.title} • ${s.steps.length} phrases</p><div class="earned"><span>⭐ ${s.steps.length}</span><span>💛 Kind choice</span><span>🌍 Explorer</span></div><div class="complete-actions"><button data-again>Play again</button><button data-map>Choose another</button></div></div></section>`; completionFeedback(this.platform,`${s.title} adventure complete!`,'🌟',s.steps.length); this.view.querySelector('[data-again]').addEventListener('click',()=>{this.stepIndex=0;this.renderStep()}); this.view.querySelector('[data-map]').addEventListener('click',()=>this.showMap()); }
  updateStats(){if(this.scoreEl)this.scoreEl.textContent=String(this.score);if(this.totalEl)this.totalEl.textContent=String(this.totalStars);if(this.timerEl){const m=Math.floor(this.remainingSeconds/60),s=String(this.remainingSeconds%60).padStart(2,'0');this.timerEl.textContent=`${m}:${s}`;}}
  schedule(fn,ms){const id=setTimeout(()=>{this.timers.delete(id);fn();},ms);this.timers.add(id);return id;}
  clearTimers(){this.timers.forEach(clearTimeout);this.timers.clear();}
  clearListeners(){this.cleanupFns.forEach(fn=>fn());this.cleanupFns=[];}
}
