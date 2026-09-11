import { GameModule } from '../../core/GameModule.js';
import { rewardFeedback, tapFeedback, vibrate, completionFeedback } from '../../services/FeedbackService.js';
import { NEW_ART_ROOT, SCENE_ROOT, SCENARIOS } from './languageData.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/* ── Mumma pose per adventure & reaction state ─────────────────────────── */
const MUMMA_POSE = {
  home:   { idle: 'kneel',    happy: 'happy',    surprised: 'surprised', point: 'point'    },
  park:   { idle: 'wave',     happy: 'encourage',surprised: 'surprised', point: 'point'    },
  school: { idle: 'point',    happy: 'encourage',surprised: 'surprised', point: 'point'    },
  nature: { idle: 'encourage',happy: 'encourage',surprised: 'surprised', point: 'point'    },
  world:  { idle: 'wave',     happy: 'encourage',surprised: 'surprised', point: 'point'    },
};

/* ── Scene composition per adventure ───────────────────────────────────── */
const COMPOSITIONS = {
  home:   { toddlerSide: 'left',  mummaFacingLeft: true  },
  park:   { toddlerSide: 'left',  mummaFacingLeft: true  },
  school: { toddlerSide: 'left',  mummaFacingLeft: true  },
  nature: { toddlerSide: 'left',  mummaFacingLeft: true  },
  world:  { toddlerSide: 'left',  mummaFacingLeft: true  },
};

export class LanguageAdventureGame extends GameModule {
  static metadata = {
    id: 'language-adventures',
    name: '🗺️ Little Adventures',
    description: 'Explore, learn, and make kind choices.',
    version: '3.0.0',
    author: 'Baby Games',
    assetPath: 'games/language-adventures/assets/'
  };

  constructor(platform) {
    super(platform);
    this.root = null;
    this.stage = null;
    this.scenario = null;
    this.stepIndex = 0;
    this.score = 0;
    this.totalStars = this.loadTotalStars();
    this.soundEnabled = this.loadSoundPreference();
    this.isRunning = false;
    this.remainingSeconds = 0;
    this.timerId = null;
    this.stepLocked = false;
    this.timers = new Set();
    this.cleanupFns = [];
    this.completed = this.loadProgress();
  }

  async initialize() { this.mount(); this.showMap(); }

  start() {
    this.timerService?.startSession?.();
    this.remainingSeconds = this.timerService?.getRemainingSeconds?.() ?? 120;
    this.score = 0;
    this.isRunning = true;
    this.startTimerLoop();
    this.updateStats();
  }

  stop() {
    this.isRunning = false;
    clearInterval(this.timerId);
    this.timerId = null;
    this.clearTimers();
    this.clearListeners();
    this.platform?.audioManager?.stopSpeaking?.();
  }

  pause() {
    this.isRunning = false;
    clearInterval(this.timerId);
    this.timerId = null;
    this.platform?.audioManager?.stopSpeaking?.();
  }

  resume() {
    if (this.remainingSeconds > 0) {
      this.isRunning = true;
      this.startTimerLoop();
      if (this.scenario) this.renderStep();
      else this.showMap();
    }
  }

  reset() { this.stop(); this.start(); this.showMap(); }
  cleanup() { this.stop(); this.root?.remove(); this.root = null; }

  tick() {
    if (!this.isRunning) return;
    this.remainingSeconds = this.timerService?.getRemainingSeconds?.() ?? Math.max(0, this.remainingSeconds - 1);
    this.updateStats();
    if (this.remainingSeconds <= 0) this.endSession();
  }

  endSession() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.timerId);
    this.timerId = null;
    this.clearTimers();
    this.clearListeners();
    this.timerService?.endSession?.();
    this.showTimeUp();
    completionFeedback(this.platform, `You explored ${this.score} little steps!`, '🌍', this.score);
  }

  mount() {
    const host = this.getGameContainerEl();
    this.root = document.createElement('section');
    this.root.className = 'la2';
    this.root.innerHTML = `
      <div class="la2-shell">
        <header class="la2-header">
          <div class="la2-brand">
            <span class="la2-logo">🌍</span>
            <div><strong>Little Adventures</strong><small>Explore • Learn • Grow</small></div>
          </div>
          <div class="la2-stats">
            <span>⏱ <b data-role="timer">2:00</b></span>
            <span>⭐ <b data-role="score">0</b></span>
            <span>🏆 <b data-role="total">0</b></span>
            <button class="sound-toggle" data-sound aria-label="Turn sound off" aria-pressed="true">🔊</button>
          </div>
        </header>
        <main class="la2-main">
          <div data-role="view"></div>
          <div class="sr-only" data-role="status" aria-live="polite"></div>
        </main>
      </div>`;
    host?.appendChild(this.root);
    this.view = this.root.querySelector('[data-role="view"]');
    this.timerEl = this.root.querySelector('[data-role="timer"]');
    this.scoreEl = this.root.querySelector('[data-role="score"]');
    this.totalEl = this.root.querySelector('[data-role="total"]');
    this.statusEl = this.root.querySelector('[data-role="status"]');
    this.soundBtn = this.root.querySelector('[data-sound]');
    this.soundBtn?.addEventListener('click', () => this.toggleSound());
    this.updateSoundButton();
  }

  /* ── Persistence ──────────────────────────────────────────────────────── */
  loadProgress() { try { return JSON.parse(localStorage.getItem('baby-games:little-adventures:completed') || '{}'); } catch { return {}; } }
  saveProgress() { try { localStorage.setItem('baby-games:little-adventures:completed', JSON.stringify(this.completed)); } catch { /* */ } }
  loadTotalStars() { try { return Number(localStorage.getItem('baby-games:little-adventures:stars') || 0); } catch { return 0; } }
  saveTotalStars() { try { localStorage.setItem('baby-games:little-adventures:stars', String(this.totalStars)); } catch { /* */ } }
  loadSoundPreference() { try { return localStorage.getItem('baby-games:little-adventures:sound') !== 'off'; } catch { return true; } }
  saveSoundPreference() { try { localStorage.setItem('baby-games:little-adventures:sound', this.soundEnabled ? 'on' : 'off'); } catch { /* */ } }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.saveSoundPreference();
    this.updateSoundButton();
    if (!this.soundEnabled) this.platform?.audioManager?.stopSpeaking?.();
    else if (this.scenario) this.speak(this.scenario.steps[this.stepIndex]);
    this.announce(this.soundEnabled ? 'Sound on' : 'Sound off');
  }

  updateSoundButton() {
    if (!this.soundBtn) return;
    this.soundBtn.textContent = this.soundEnabled ? '🔊' : '🔇';
    this.soundBtn.setAttribute('aria-pressed', String(this.soundEnabled));
    this.soundBtn.setAttribute('aria-label', this.soundEnabled ? 'Turn sound off' : 'Turn sound on');
  }

  announce(message) { if (this.statusEl) this.statusEl.textContent = message; }
  startTimerLoop() { clearInterval(this.timerId); this.timerId = setInterval(() => this.tick(), 250); }

  /* ── Map ──────────────────────────────────────────────────────────────── */
  showMap() {
    this.scenario = null;
    this.platform?.celebration?.hide?.();
    const completedCount = SCENARIOS.filter(s => this.completed[s.id]).length;
    this.view.innerHTML = `
      <section class="la2-map">
        <div class="la2-map-hero">
          <div class="la2-hero-art">
            <img class="hero-character-art" src="${NEW_ART_ROOT}characters/toddler/happy.png" alt="Little explorer">
          </div>
          <div class="la2-hero-copy">
            <span class="eyebrow">BIG WORLD • SMALL STEPS</span>
            <h1>Choose an adventure</h1>
            <p>Tap a place, learn a simple phrase, and make a kind choice.</p>
            <div class="la2-values">
              <span>💛 Be kind</span>
              <span>🔎 Be curious</span>
              <span>🌱 Keep growing</span>
            </div>
          </div>
        </div>
        <div class="la2-path">
          ${SCENARIOS.map((s, i) => {
            const done = Boolean(this.completed[s.id]);
            return `<button class="la2-card tone-${s.tone} ${done ? 'is-complete' : ''}" data-id="${s.id}">
              <div class="card-art">
                <img src="${NEW_ART_ROOT}${s.cardArt}" alt="${s.title}" loading="lazy">
              </div>
              <div class="card-body">
                <div class="card-title">
                  <span>${s.icon}</span>
                  <strong>${s.title}</strong>
                  <em>${done ? '✓' : i + 1}</em>
                </div>
                <p>${s.subtitle}</p>
                <span class="play-pill">${done ? 'Play again' : 'Play adventure'} <b>→</b></span>
              </div>
            </button>`;
          }).join('')}
        </div>
        <div class="la2-progress-panel">
          <div>
            <strong>${completedCount}/${SCENARIOS.length} adventures explored</strong>
            <span>${this.totalStars} total stars</span>
          </div>
          <div class="progress-track"><i style="width:${(completedCount / SCENARIOS.length) * 100}%"></i></div>
        </div>
        <div class="la2-map-footer">✨ Every adventure teaches a little phrase and a big idea. ✨</div>
      </section>`;
    this.view.querySelectorAll('[data-id]').forEach(b =>
      b.addEventListener('click', () => this.choose(b.dataset.id))
    );
  }

  /* ── Adventure selection ──────────────────────────────────────────────── */
  choose(id) {
    this.platform?.celebration?.hide?.();
    const next = SCENARIOS.find(s => s.id === id);
    if (!next || !this.view) return;

    const host = this.getGameContainerEl();
    if (host) {
      host.style.display = 'flex';
      host.style.visibility = 'visible';
      host.style.opacity = '1';
      host.style.transform = '';
    }
    if (this.root) {
      this.root.style.display = 'block';
      this.root.style.visibility = 'visible';
      this.root.style.opacity = '1';
    }

    if (!this.isRunning) {
      const remaining = this.timerService?.getRemainingSeconds?.() ?? this.remainingSeconds;
      if (remaining <= 0) { this.showTimeUp(); return; }
      this.isRunning = true;
      this.remainingSeconds = remaining;
      this.startTimerLoop();
    }

    this.scenario = next;
    this.stepIndex = 0;
    this.updateStats();
    try {
      this.renderStep();
    } catch (error) {
      console.error('[Little Adventures] Failed to open adventure:', error);
      this.showRenderError(error);
    }
  }

  showRenderError(error = null) {
    if (!this.view) return;
    this.clearTimers();
    this.clearListeners();
    if (error) console.error('[Little Adventures] Render error details:', error);
    this.view.innerHTML = `
      <section class="la2-error">
        <div class="la2-error-card">
          <div class="timeup-icon">🧭</div>
          <h2>Let's try that again!</h2>
          <p>This adventure did not open correctly.</p>
          <div class="complete-actions">
            <button data-error-map>Back to adventures</button>
          </div>
        </div>
      </section>`;
    this.view.querySelector('[data-error-map]')?.addEventListener('click', () => this.showMap());
  }

  /* ── Step renderer ────────────────────────────────────────────────────── */
  renderStep() {
    if (!this.scenario || !this.view) return;
    const step = this.scenario.steps?.[this.stepIndex];
    if (!step) {
      console.error('[Little Adventures] Missing adventure step', this.scenario.id, this.stepIndex);
      this.showRenderError();
      return;
    }

    this.clearTimers();
    this.clearListeners();
    this.stepLocked = false;

    const s = this.scenario;
    const comp = COMPOSITIONS[s.id] || COMPOSITIONS.home;

    // Scene background: use photo if available, else CSS class handles gradient
    const sceneBg = s.art
      ? `style="--scene-bg:url('${SCENE_ROOT}${s.art}')"`
      : '';

    const mummaIdlePose = (MUMMA_POSE[s.id] || MUMMA_POSE.home).idle;
    const mummaFlip = comp.mummaFacingLeft ? '' : 'style="transform:scaleX(-1)"';

    this.view.innerHTML = `
      <section class="la2-play">

        <!-- ── HUD bar ── -->
        <div class="play-top">
          <button class="back-btn" data-back>← Adventures</button>
          <div class="step-title">
            <span>${s.icon}</span>
            <strong>${s.title}</strong>
            <div class="dots">${s.steps.map((_, i) => `<i class="${i <= this.stepIndex ? 'on' : ''}"></i>`).join('')}</div>
            <small>${this.stepIndex + 1}/${s.steps.length}</small>
          </div>
          <button class="sound-btn" data-speak aria-label="Repeat phrase">🔊</button>
        </div>

        <!-- ── Prompt zone — outside scene, never overlaps ── -->
        <div class="play-prompt">
          <div class="phrase" data-phrase>${step.phrase}</div>
          <div class="prompt">${step.prompt}</div>
        </div>

        <!-- ── Play scene ── -->
        <div class="play-scene ${s.sceneClass || ''}" ${sceneBg}>
          <div class="scene-wash"></div>

          <!-- Toddler — floor left -->
          <div class="character-stage" data-character-stage>
            <img class="scene-avatar character-idle" data-character
                 src="${NEW_ART_ROOT}characters/toddler/idle.png" alt="Explorer">
            <div class="character-bubble" data-character-bubble aria-live="polite"></div>
          </div>

          <!-- Mumma — floor right, faces left toward toddler -->
          <div class="mumma-stage" data-mumma-stage ${mummaFlip}>
            <img data-mumma
                 src="${NEW_ART_ROOT}characters/mumma/${mummaIdlePose}.png"
                 alt="Mumma">
          </div>

          <!-- Interaction layer — tap/drag/choice targets -->
          <div class="interaction" data-interaction></div>
        </div>

        <!-- ── Hint bar ── -->
        <div class="guide">💡 ${this.guideFor(step)}</div>

      </section>`;

    this.view.querySelector('[data-back]').addEventListener('click', () => this.showMap());
    this.view.querySelector('[data-speak]').addEventListener('click', () => this.speak(step));
    this.buildInteraction(step);
    this.schedule(() => {
      this.speak(step);
      this.setCharacterReaction('point');
      this.schedule(() => this.setCharacterReaction('idle'), 1100);
    }, 250);
  }

  /* ── Character reactions ──────────────────────────────────────────────── */
  setCharacterReaction(state, message = '') {
    const avatar = this.view?.querySelector('[data-character]');
    const mummaImg = this.view?.querySelector('[data-mumma]');
    const bubble = this.view?.querySelector('[data-character-bubble]');

    const sid = this.scenario?.id || 'home';
    const poses = MUMMA_POSE[sid] || MUMMA_POSE.home;

    const toddlerPose = { idle: 'idle', point: 'point', happy: 'happy', surprised: 'surprised' }[state] || 'idle';
    const mummaPose = poses[state] || poses.idle;

    if (avatar) {
      avatar.dataset.state = state;
      avatar.src = `${NEW_ART_ROOT}characters/toddler/${toddlerPose}.png`;
      avatar.classList.remove('character-idle', 'character-point', 'character-happy', 'character-surprised');
      avatar.classList.add(`character-${state}`);
    }
    if (mummaImg) {
      mummaImg.src = `${NEW_ART_ROOT}characters/mumma/${mummaPose}.png`;
      // Also update the container so CSS selectors like [data-mumma-stage][data-state="happy"] work
      const mummaStage = this.view?.querySelector('[data-mumma-stage]');
      if (mummaStage) mummaStage.dataset.state = state;
    }
    if (bubble) {
      bubble.textContent = message;
      bubble.classList.toggle('show', Boolean(message));
    }
  }

  /* ── Guide text ───────────────────────────────────────────────────────── */
  guideFor(step) {
    const guides = {
      'tidy-room': 'Find the toy box and help tidy up.',
      'find-hidden': 'Look carefully. Which one is Teddy?',
      'share-toy': 'Move the ball all the way to your friend.',
      'bedtime': 'Help the room get ready for sleep.',
      'meet-friend': 'Find your new friend and say hello.',
      'spot-nature': 'Look closely — tap the butterfly!',
      'share-at-park': 'Can you share the ball with your friend?',
      'follow-path': 'Tap the path and start your walk.',
      'greet-classmate': 'Find a friend and say hello.',
      'pack-school': 'Which one belongs in your bag?',
      'share-supplies': 'Move the crayons to your friend.',
      'open-book': 'Tap the book to start learning.',
      'discover-view': 'Look up and discover something beautiful.',
      'protect-nature': 'Which one belongs in nature?',
      'recycle-cleanup': 'Move the bottle into the recycling bin.',
      'care-for-earth': 'Tap our happy planet.',
      'board-plane': 'Tap the plane to begin your journey.',
      'landmark-match': 'Which picture shows a famous place?',
      'greet-world': 'Say hello to the world!',
      'trace-route': 'Tap the map to explore together.',
    };
    return guides[step.activity] || (
      step.type === 'drag' ? 'Press, hold, and move the picture.' :
      step.type === 'choice' ? 'Tap the right picture.' :
      'Big tap, little explorer!'
    );
  }

  speak(step) {
    if (!this.isRunning) return;
    if (!this.soundEnabled) return;
    this.platform?.audioManager?.speak?.(`${step.phrase}  ${step.prompt}`, 0.82);
  }

  /* ── Interaction builder ──────────────────────────────────────────────── */
  buildInteraction(step) {
    const host = this.view.querySelector('[data-interaction]');
    host.dataset.activity = step.activity || step.type;

    const activityLabels = {
      'tidy-room': 'HELP AT HOME', 'find-hidden': 'LOOK & FIND', 'share-toy': 'SHARE TOGETHER', 'bedtime': 'BEDTIME',
      'meet-friend': 'MAKE A FRIEND', 'spot-nature': 'LOOK CLOSELY', 'share-at-park': 'SHARE AT THE PARK', 'follow-path': 'FOLLOW THE PATH',
      'greet-classmate': 'HELLO, FRIEND', 'pack-school': 'PACK YOUR BAG', 'share-supplies': 'SHARE SUPPLIES', 'open-book': 'TIME TO LEARN',
      'discover-view': 'DISCOVER', 'protect-nature': 'CARE FOR NATURE', 'recycle-cleanup': 'CLEAN UP', 'care-for-earth': 'OUR HOME',
      'board-plane': 'ALL ABOARD', 'landmark-match': 'TRAVEL MATCH', 'greet-world': 'HELLO, WORLD', 'trace-route': 'PICK A ROUTE',
    };
    const title = activityLabels[step.activity] || 'LITTLE ADVENTURE';
    const addBadge = () => {
      host.insertAdjacentHTML('afterbegin', `<div class="activity-badge">${title}</div>`);
      host.insertAdjacentHTML('beforeend', '<div class="activity-sparkle" aria-hidden="true">✦</div>');
    };

    if (step.type === 'choice') {
      host.className += ' choice-grid';
      host.innerHTML = `<div class="choice-stage">${step.choices.map(([label, key], i) =>
        `<button class="choice-card choice-${i + 1}" data-correct="${step.choices[i][2]}">
          <span class="choice-icon">${this.iconFor(key)}</span>
          <strong>${label}</strong>
        </button>`
      ).join('')}</div>`;
      host.querySelectorAll('.choice-card').forEach(b =>
        b.addEventListener('click', () =>
          b.dataset.correct === 'true' ? this.success(step, b) : this.wrong(b)
        )
      );
      addBadge();

    } else if (step.type === 'drag') {
      host.className += ' drag-board';
      const [tx, ty] = step.targetPosition || [76, 65];
      const [ix, iy] = step.itemPosition || [40, 62];
      const actionText = step.activity === 'recycle-cleanup' ? 'Clean it up!' :
                         step.activity?.includes('share') ? 'Let\'s share!' : 'Move it here!';
      host.innerHTML = `
        <div class="drag-story"><span>${actionText}</span><b>→</b></div>
        <div class="drag-target" data-target style="--x:${tx}%;--y:${ty}%">
          ${this.iconFor(step.target)}
          <span>${this.targetLabel(step.target)}</span>
        </div>
        <button class="drag-piece" data-piece aria-label="${step.item}" style="--x:${ix}%;--y:${iy}%">
          ${this.iconFor(step.item)}
        </button>`;

      const pieceEl = host.querySelector('[data-piece]');
      const targetEl = host.querySelector('[data-target]');
      this.makeDrag(pieceEl, targetEl, step);

      // Toddler accessibility: tapping the piece or target also moves the item to the target
      let tapMoved = false;
      const animateToTarget = () => {
        if (tapMoved || this.stepLocked) return;
        tapMoved = true;
        pieceEl.style.transition = 'left 0.4s ease, top 0.4s ease, transform 0.4s ease';
        pieceEl.style.left = `${tx}%`;
        pieceEl.style.top = `${ty}%`;
        pieceEl.style.transform = 'translate(-50%, -50%) scale(1.1)';
        targetEl.classList.add('near');
        this.schedule(() => {
          this.success(step, pieceEl);
        }, 420);
      };

      pieceEl.addEventListener('click', (e) => {
        if (!e.defaultPrevented) animateToTarget();
      });
      targetEl.addEventListener('click', () => animateToTarget());

      addBadge();

    } else {
      // tap
      host.className += ' tap-board';
      const [x, y] = step.position || [50, 62];
      const verbs = {
        'tidy-room': 'Tap to tidy', 'bedtime': 'Good night', 'meet-friend': 'Say hello',
        'follow-path': 'Go this way', 'open-book': 'Open it', 'discover-view': 'Wow!',
        'care-for-earth': 'Care for Earth', 'board-plane': 'Take off',
        'greet-world': 'Hello!', 'trace-route': 'Explore!', 'greet-classmate': 'Say hello',
      };
      host.innerHTML = `
        <div class="tap-scene-label">${verbs[step.activity] || 'Your turn!'}</div>
        <button class="big-target target-${step.target}" data-tap
                aria-label="${step.target}" style="--x:${x}%;--y:${y}%">
          <span>${this.iconFor(step.target)}</span>
          <em>${this.targetLabel(step.target)}</em>
        </button>`;
      host.querySelector('[data-tap]').addEventListener('click', e => this.success(step, e.currentTarget));
      addBadge();
    }
  }

  iconFor(k) {
    const supported = { toybox: 1, teddy: 1, ball: 1, book: 1, bed: 1, puppy: 1, butterfly: 1, leaf: 1, path: 1, friend: 1, crayons: 1, cup: 1, mountains: 1, bottle: 1, bin: 1, earth: 1, wrapper: 1, plane: 1, landmark: 1, cloud: 1, suitcase: 1, globe: 1, map: 1, child: 1 };
    if (!supported[k]) return '<span class="fallback-icon">✨</span>';
    return `<svg class="asset-icon icon-${k}" viewBox="0 0 200 190" aria-hidden="true"><use href="${NEW_ART_ROOT}targets.svg#${k}"></use></svg>`;
  }

  targetLabel(k) {
    return { child: 'Explorer', friend: 'Friend', bin: 'Recycle', teddy: 'Teddy', toybox: 'Toy Box', puppy: 'Puppy', butterfly: 'Butterfly', mountains: 'Mountains', earth: 'Earth', plane: 'Airplane', globe: 'Globe', map: 'Map', path: 'Path', book: 'Book', bed: 'Bed', crayons: 'Crayons' }[k] || k;
  }

  makeDrag(item, target, step) {
    let dragging = false, id = null, ox = 0, oy = 0;
    const [ix, iy] = step.itemPosition || [40, 62];
    const origin = { left: `${ix}%`, top: `${iy}%` };
    item.style.left = origin.left;
    item.style.top = origin.top;

    const move = e => {
      if (!dragging || e.pointerId !== id) return;
      const r = this.view.querySelector('.play-scene').getBoundingClientRect();
      item.style.left = `${clamp(e.clientX - r.left - ox, 10, r.width - item.offsetWidth - 10)}px`;
      item.style.top = `${clamp(e.clientY - r.top - oy, 80, r.height - item.offsetHeight - 15)}px`;
      const a = item.getBoundingClientRect(), b = target.getBoundingClientRect();
      target.classList.toggle('near', !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom));
    };

    const up = e => {
      if (e.pointerId !== id) return;
      dragging = false;
      item.releasePointerCapture?.(id);
      id = null;
      const a = item.getBoundingClientRect(), b = target.getBoundingClientRect();
      const ok = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
      target.classList.remove('near');
      if (ok) this.success(step, item);
      else {
        item.classList.add('return');
        item.style.left = origin.left;
        item.style.top = origin.top;
        this.schedule(() => item.classList.remove('return'), 280);
        this.wrong(item);
      }
    };

    item.addEventListener('pointerdown', e => {
      e.preventDefault();
      id = e.pointerId;
      dragging = true;
      const r = item.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
      item.setPointerCapture?.(id);
    });
    item.addEventListener('pointermove', move);
    item.addEventListener('pointerup', up);
    item.addEventListener('pointercancel', up);
    this.cleanupFns.push(() => {
      item.removeEventListener('pointermove', move);
      item.removeEventListener('pointerup', up);
      item.removeEventListener('pointercancel', up);
    });
  }

  /* ── Success / Wrong ──────────────────────────────────────────────────── */
  success(step, el) {
    if (this.stepLocked || !this.isRunning) return;
    this.stepLocked = true;
    el?.classList.add('hit');
    this.applyActivitySuccess(step, el);
    this.score += 1;
    this.setCharacterReaction('happy', step.success);
    this.updateStats();
    this.totalStars += 1;
    this.saveTotalStars();
    rewardFeedback(this.platform, step.success, '⭐');
    this.announce(step.success);
    tapFeedback(this.platform?.audioManager, 'success');
    vibrate([18, 25, 35]);
    const phrase = this.view.querySelector('[data-phrase]');
    phrase?.classList.add('win');
    this.schedule(() => {
      if (!this.scenario) return;
      if (this.stepIndex < this.scenario.steps.length - 1) {
        this.stepIndex++;
        this.renderStep();
      } else {
        this.finish();
      }
    }, 950);
  }

  applyActivitySuccess(step, el) {
    const host = this.view?.querySelector('[data-interaction]');
    if (!host) return;
    const effects = {
      'tidy-room': ['🧸', '🧹', '✨'], 'find-hidden': ['🔎', '⭐'], 'share-toy': ['💛', '🤝'], 'bedtime': ['🌙', '⭐', '💤'],
      'meet-friend': ['👋', '🐶', '💛'], 'spot-nature': ['🦋', '🌿', '✨'], 'share-at-park': ['🤝', '⚽', '💚'], 'follow-path': ['👣', '➡️', '🌳'],
      'greet-classmate': ['👋', '😊'], 'pack-school': ['🎒', '✏️', '⭐'], 'share-supplies': ['🤝', '🖍️'], 'open-book': ['📖', '💡', '⭐'],
      'discover-view': ['🏔️', '✨'], 'protect-nature': ['🌿', '🦋', '💚'], 'recycle-cleanup': ['♻️', '💚', '✨'], 'care-for-earth': ['🌍', '💚', '⭐'],
      'board-plane': ['✈️', '☁️', '✨'], 'landmark-match': ['📍', '⭐'], 'greet-world': ['🌍', '👋', '💛'], 'trace-route': ['🗺️', '👣', '✨'],
    };
    const burst = effects[step.activity] || ['⭐', '✨'];
    const fx = document.createElement('div');
    fx.className = 'activity-success-burst';
    fx.innerHTML = burst.map(x => `<span>${x}</span>`).join('');
    host.appendChild(fx);
    host.classList.add(`activity-success-${step.activity}`);
    this.schedule(() => fx.remove(), 720);
  }

  wrong(el) {
    this.announce('Try again!');
    this.setCharacterReaction('surprised', 'Try again!');
    this.schedule(() => this.setCharacterReaction('idle'), 900);
    tapFeedback(this.platform?.audioManager, 'error');
    vibrate(10);
    el?.classList.remove('wrong');
    void el?.offsetWidth;
    el?.classList.add('wrong');
  }

  /* ── Time up / Completion ─────────────────────────────────────────────── */
  showTimeUp() {
    this.view.innerHTML = `
      <section class="la2-timeup">
        <div class="timeup-card">
          <div class="timeup-icon">⏰</div>
          <h2>Time for a little break!</h2>
          <p>You explored ${this.score} little steps. Adventures can wait for another day.</p>
          <div class="complete-actions">
            <button data-retry>Try again</button>
            <button data-map>Choose an adventure</button>
          </div>
        </div>
      </section>`;
    this.view.querySelector('[data-retry]')?.addEventListener('click', () => { this.start(); this.showMap(); });
    this.view.querySelector('[data-map]')?.addEventListener('click', () => { this.start(); this.showMap(); });
  }

  finish() {
    this.clearTimers();
    this.clearListeners();
    const s = this.scenario;
    if (s) { this.completed[s.id] = true; this.saveProgress(); }
    this.view.innerHTML = `
      <section class="la2-complete">
        <div class="complete-art"></div>
        <div class="complete-content-wrap">
          <img class="complete-toddler"
               src="${NEW_ART_ROOT}characters/toddler/celebrate.png"
               alt="Explorer celebrating">
          <div class="complete-card">
            <div class="burst">✨ ⭐ ✨</div>
            <h2>Adventure complete!</h2>
            <p>${s.title} • ${s.steps.length} phrases</p>
            <div class="earned">
              <span>⭐ ${s.steps.length}</span>
              <span>💛 Kind choice</span>
              <span>🌍 Explorer</span>
            </div>
            <div class="complete-actions">
              <button data-again>Play again</button>
              <button data-map>Choose another</button>
            </div>
          </div>
          <img class="complete-mumma"
               src="${NEW_ART_ROOT}characters/mumma/hug.png"
               alt="Mumma cheering">
        </div>
      </section>`;

    // Toddler audio & vibration celebration without modal overlay
    this.platform?.celebration?.hide?.();
    try {
      this.platform?.audioManager?.playSequence?.([523, 659, 784, 1047, 1319]);
      vibrate([20, 25, 35, 25, 55, 35]);
    } catch (e) {}

    this.view.querySelector('[data-again]').addEventListener('click', () => { this.stepIndex = 0; this.renderStep(); });
    this.view.querySelector('[data-map]').addEventListener('click', () => this.showMap());
  }

  /* ── Utility ──────────────────────────────────────────────────────────── */
  updateStats() {
    if (this.scoreEl) this.scoreEl.textContent = String(this.score);
    if (this.totalEl) this.totalEl.textContent = String(this.totalStars);
    if (this.timerEl) {
      const m = Math.floor(this.remainingSeconds / 60);
      const s = String(this.remainingSeconds % 60).padStart(2, '0');
      this.timerEl.textContent = `${m}:${s}`;
    }
  }

  schedule(fn, ms) {
    const id = setTimeout(() => { this.timers.delete(id); fn(); }, ms);
    this.timers.add(id);
    return id;
  }

  clearTimers() { this.timers.forEach(clearTimeout); this.timers.clear(); }
  clearListeners() { this.cleanupFns.forEach(fn => fn()); this.cleanupFns = []; }
}
