import './styles.css';
import { GameModule } from '../../core/GameModule.js';
import { rewardFeedback, tapFeedback, vibrate } from '../../services/FeedbackService.js';
import { ASSET_ROOT, SCENARIOS } from './languageData.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class LanguageAdventureGame extends GameModule {
  static metadata = {
    id: 'language-adventures',
    name: '🗣️ Little Adventures',
    description: 'Play little stories while learning easy English phrases.',
    version: '1.0.0',
    author: 'Baby Games',
    assetPath: 'games/language-adventures/assets/'
  };

  constructor(platform) {
    super(platform);
    this.root = null;
    this.stage = null;
    this.phraseEl = null;
    this.instructionEl = null;
    this.progressEl = null;
    this.scoreEl = null;
    this.timers = new Set();
    this.pointerCleanup = [];
    this.scenario = null;
    this.stepIndex = 0;
    this.score = 0;
    this.isRunning = false;
    this.remainingSeconds = 0;
    this.timerId = null;
    this.stepLocked = false;
    this.stepState = {};
  }

  async initialize() {
    this.mountUI();
    this.renderScenarioPicker();
  }

  start() {
    this.timerService?.startSession?.();
    this.remainingSeconds = this.timerService?.getRemainingSeconds?.() ?? 120;
    this.score = 0;
    this.isRunning = true;
    this.updateTimer();
    this.platform?.audioManager?.speak?.('Choose an adventure!', 0.82);
    this.timerId = setInterval(() => this.tick(), 250);
  }

  stop() {
    this.isRunning = false;
    clearInterval(this.timerId);
    this.timerId = null;
    this.clearStepTimers();
    this.clearPointerListeners();
    this.platform?.audioManager?.stopSpeaking?.();
  }

  pause() { this.stop(); }

  resume() {
    if (this.remainingSeconds > 0) {
      this.isRunning = true;
      this.timerId = setInterval(() => this.tick(), 250);
      this.presentStep();
    }
  }

  reset() {
    this.stop();
    this.start();
    this.renderScenarioPicker();
  }

  cleanup() {
    this.stop();
    this.root?.remove();
    this.root = null;
  }

  tick() {
    if (!this.isRunning) return;
    this.remainingSeconds = this.timerService?.getRemainingSeconds?.() ?? Math.max(0, this.remainingSeconds - 1);
    this.updateTimer();
    if (this.remainingSeconds <= 0) this.endSession();
  }

  endSession() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.timerId);
    this.timerId = null;
    this.clearStepTimers();
    this.clearPointerListeners();
    this.timerService?.endSession?.();
    this.platform?.audioManager?.speak?.(`Great playing! You learned ${this.score} phrases.`, 0.84);
  }

  mountUI() {
    const host = this.getGameContainerEl();
    this.root = document.createElement('section');
    this.root.className = 'language-game';
    this.root.innerHTML = `
      <header class="language-header">
        <div class="language-title"><span>🗣️ Little Adventures</span><small>Play & Talk</small></div>
        <div class="language-stats"><span>⏱ <b data-role="timer">0:00</b></span><span>⭐ <b data-role="score">0</b></span></div>
      </header>
      <div class="language-content">
        <div class="language-picker" data-role="picker"></div>
        <div class="language-adventure" data-role="adventure" hidden>
          <div class="language-topline">
            <button class="language-back" type="button" data-action="back">← Adventures</button>
            <div class="language-progress" data-role="progress"></div>
          </div>
          <div class="language-bubble" aria-live="polite">
            <div class="language-phrase" data-role="phrase"></div>
            <div class="language-instruction" data-role="instruction"></div>
            <button class="language-listen" type="button" data-action="listen">🔊 Hear it</button>
          </div>
          <div class="language-stage" data-role="stage"></div>
        </div>
      </div>`;
    host?.appendChild(this.root);

    this.timerEl = this.root.querySelector('[data-role="timer"]');
    this.scoreEl = this.root.querySelector('[data-role="score"]');
    this.picker = this.root.querySelector('[data-role="picker"]');
    this.adventure = this.root.querySelector('[data-role="adventure"]');
    this.stage = this.root.querySelector('[data-role="stage"]');
    this.phraseEl = this.root.querySelector('[data-role="phrase"]');
    this.instructionEl = this.root.querySelector('[data-role="instruction"]');
    this.progressEl = this.root.querySelector('[data-role="progress"]');

    this.root.querySelector('[data-action="listen"]').addEventListener('click', () => this.speakCurrent());
    this.root.querySelector('[data-action="back"]').addEventListener('click', () => {
      this.clearStepTimers();
      this.clearPointerListeners();
      this.scenario = null;
      this.adventure.hidden = true;
      this.picker.hidden = false;
      this.renderScenarioPicker();
      this.platform?.audioManager?.speak?.('Choose an adventure!', 0.82);
    });
  }

  renderScenarioPicker() {
    if (!this.picker) return;
    this.picker.innerHTML = `
      <div class="language-welcome">
        <div class="language-welcome-stars">✨ ⭐ ✨</div>
        <h2>Where shall we play?</h2>
        <p>Listen, look, and play. You will hear easy English phrases along the way.</p>
      </div>
      <div class="scenario-grid">
        ${SCENARIOS.map((scenario) => `
          <button class="scenario-card scenario-${scenario.color}" type="button" data-scenario="${scenario.id}">
            <span class="scenario-icon">${scenario.name.split(' ')[0]}</span>
            <strong>${scenario.shortName}</strong>
            <small>5 little plays</small>
          </button>`).join('')}
      </div>`;
    this.picker.hidden = false;
    this.picker.querySelectorAll('[data-scenario]').forEach((button) => {
      button.addEventListener('click', () => this.chooseScenario(button.dataset.scenario));
    });
  }

  chooseScenario(id) {
    if (!this.isRunning) return;
    this.clearStepTimers();
    this.clearPointerListeners();
    this.scenario = SCENARIOS.find((scenario) => scenario.id === id) || null;
    this.stepIndex = 0;
    this.stepLocked = false;
    this.stepState = {};
    if (!this.scenario) return;
    this.picker.hidden = true;
    this.adventure.hidden = false;
    this.presentStep();
  }

  currentStep() {
    return this.scenario?.steps?.[this.stepIndex] || null;
  }

  presentStep() {
    const step = this.currentStep();
    if (!step || !this.stage) return;
    this.clearStepTimers();
    this.clearPointerListeners();
    this.phraseEl.textContent = step.phrase;
    this.instructionEl.textContent = step.instruction;
    this.progressEl.innerHTML = this.scenario.steps.map((_, i) => `<span class="${i <= this.stepIndex ? 'done' : ''}"></span>`).join('');
    this.stage.dataset.scene = this.scenario.scene;
    this.stage.dataset.stepType = step.type;
    this.stepLocked = false;
    this.stage.innerHTML = '';
    this.renderStep(step);
    this.schedule(() => this.speakCurrent(), 260);
  }

  renderStep(step) {
    const addImg = (src, className, alt = '') => {
      const img = document.createElement('img');
      img.src = new URL(src, ASSET_ROOT).href;
      img.alt = alt;
      img.className = className;
      img.draggable = false;
      img.addEventListener('error', () => {
        img.hidden = true;
        img.setAttribute('aria-hidden', 'true');
      }, { once: true });
      this.stage.appendChild(img);
      return img;
    };
    const button = (className, label, onClick) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = className;
      b.setAttribute('aria-label', label);
      b.addEventListener('click', (event) => {
        tapFeedback(this.platform?.audioManager, 'click');
        onClick(event, b);
      });
      this.stage.appendChild(b);
      return b;
    };
    const makeBubble = (text, className = '') => {
      const el = document.createElement('div');
      el.className = `language-helper ${className}`;
      el.textContent = text;
      this.stage.appendChild(el);
      return el;
    };

    switch (step.type) {
      case 'find-mumma': {
        addImg('characters/toddler-searching.png', 'character toddler toddler-searching', 'Toddler looking around');
        // Mumma is physically placed behind the middle hiding object instead of
        // being hidden elsewhere on the stage. This makes the reveal read as a
        // real hide-and-seek interaction.
        const mumma = addImg('characters/mumma-wave.png', 'character mumma mumma-hidden', 'Mumma');
        mumma.style.opacity = '0';
        const spots = [
          ['cushion.png', 'language-cover cover-left', false],
          ['toy-box.png', 'language-cover cover-center', true],
          ['chair.png', 'language-cover cover-right', false]
        ];
        spots.forEach(([src, className, correct]) => {
          const b = button(`hide-spot ${className}`, 'look here', () => {
            if (correct) {
              rewardFeedback(this.platform, 'You found Mumma!', '💗');
              mumma.classList.remove('mumma-hidden');
              mumma.classList.add('mumma-reveal');
              b.classList.add('cover-reveal');
              this.schedule(() => this.completeStep(step.success), 600);
            } else {
              this.wrongTry(b, 'Not there. Keep looking!');
            }
          });
          b.style.backgroundImage = `url("${new URL(`objects/${src}`, ASSET_ROOT).href}")`;
        });
        makeBubble('Can you find Mumma?', 'bubble-bottom');
        break;
      }
      case 'come-here': {
        addImg('characters/toddler-walking.png', 'character toddler toddler-come', 'Toddler walking');
        addImg('characters/mumma-open-arms.png', 'character mumma mumma-waiting', 'Mumma');
        const zone = button('action-zone mumma-zone', 'Come here Mumma', () => {
          zone.classList.add('zone-hit');
          const toddler = this.stage.querySelector('.toddler-come');
          toddler?.classList.add('walk-to-mumma');
          rewardFeedback(this.platform, 'Come here!', '💗');
          this.schedule(() => this.completeStep(step.success), 1050);
        });
        zone.textContent = '💗';
        makeBubble('Mumma says: “Come here!”', 'bubble-bottom');
        break;
      }
      case 'door': {
        addImg('characters/toddler-walking.png', 'character toddler toddler-door', 'Toddler walking');
        const door = button('object-button door-target', 'Door', () => {
          door.classList.add('door-open');
          this.stage.querySelector('.toddler-door')?.classList.add('walk-out');
          rewardFeedback(this.platform, step.success, '🚪');
          this.schedule(() => this.completeStep(step.success), 800);
        });
        door.style.backgroundImage = `url("${new URL('objects/door.png', ASSET_ROOT).href}")`;
        makeBubble('Open the door!', 'bubble-bottom');
        break;
      }
      case 'going': {
        const path = button('walk-path', 'Watch me walk', () => {
          path.classList.add('path-hit');
          const toddler = this.stage.querySelector('.toddler-moving');
          toddler?.classList.add('walk-across');
          rewardFeedback(this.platform, 'I am going!', '👣');
          this.schedule(() => this.completeStep(step.success, path), 1000);
        });
        path.style.backgroundImage = `url("${new URL('characters/toddler-walking.png', ASSET_ROOT).href}")`;
        path.textContent = '';
        makeBubble('I am going!', 'bubble-bottom');
        break;
      }
      case 'sleeping': {
        const tap = button('sleepy-target', 'Sleeping girl', () => {
          tap.classList.add('sleepy-burst');
          rewardFeedback(this.platform, 'Sweet dreams!', '🌙');
          this.schedule(() => this.completeStep(step.success, tap), 500);
        });
        tap.style.backgroundImage = `url("${new URL('characters/toddler-sleeping.png', ASSET_ROOT).href}")`;
        makeBubble('Shhh…', 'bubble-bottom');
        break;
      }
      case 'running': {
        const run = button('run-target', 'Running girl', () => {
          run.classList.add('run-hit');
          run.classList.add('extra-run');
          rewardFeedback(this.platform, 'Run, run, run!', '🏃');
          this.schedule(() => this.completeStep(step.success, run), 700);
        });
        run.style.backgroundImage = `url("${new URL('characters/toddler-running.png', ASSET_ROOT).href}")`;
        makeBubble('Watch me run!', 'bubble-bottom');
        break;
      }
      case 'choice-ball': {
        addImg('characters/toddler-pointing.png', 'character toddler toddler-pointing-small', 'Toddler pointing');
        const choices = [
          ['ball.png', 'Ball', true, 'choice-ball-good'],
          ['plant.png', 'Plant', false, 'choice-ball-wrong'],
          ['cushion.png', 'Cushion', false, 'choice-ball-wrong']
        ];
        choices.forEach(([src, label, correct, cls], i) => {
          const b = button(`choice-object ${cls}`, label, () => correct
            ? this.completeStep(step.success, b)
            : this.wrongTry(b, 'Look at the ball!'));
          b.style.backgroundImage = `url("${new URL(`objects/${src}`, ASSET_ROOT).href}")`;
          b.style.setProperty('--choice-index', i);
        });
        makeBubble('What is that?', 'bubble-bottom');
        break;
      }
      case 'find-ball': {
        addImg('characters/toddler-searching.png', 'character toddler toddler-searching-ball', 'Toddler searching');
        const ball = addImg('objects/ball.png', 'object-ball hidden-ball', 'Ball');
        ball.style.left = '50%'; ball.style.top = '39%';
        const spots = [
          ['cushion.png', 'cover-left', false],
          ['toy-box.png', 'cover-center', true],
          ['chair.png', 'cover-right', false]
        ];
        spots.forEach(([src, cls, correct]) => {
          const b = button(`hide-spot ${cls}`, 'Search here', () => {
            if (correct) {
              ball.classList.remove('hidden-ball');
              b.classList.add('cover-reveal');
              rewardFeedback(this.platform, 'You found the ball!', '⚽');
              this.schedule(() => this.completeStep(step.success), 650);
            } else this.wrongTry(b, 'Not there. Try another spot!');
          });
          b.style.backgroundImage = `url("${new URL(`objects/${src}`, ASSET_ROOT).href}")`;
        });
        makeBubble('Where did it go?', 'bubble-bottom');
        break;
      }
      case 'destination-slide': {
        addImg('characters/toddler-pointing.png', 'character toddler toddler-destination', 'Toddler pointing');
        const target = button('destination slide-destination', 'Slide', () => {
          target.classList.add('destination-hit');
          this.stage.querySelector('.toddler-destination')?.classList.add('walk-to-slide');
          rewardFeedback(this.platform, 'Go there!', '🛝');
          this.schedule(() => this.completeStep(step.success), 1050);
        });
        target.textContent = '🛝';
        makeBubble('Go there!', 'bubble-bottom');
        break;
      }
      case 'destination-path': {
        addImg('characters/toddler-walking.png', 'character toddler toddler-path', 'Toddler walking');
        const target = button('destination path-destination', 'Path', () => {
          target.classList.add('destination-hit');
          this.stage.querySelector('.toddler-path')?.classList.add('walk-path-out');
          rewardFeedback(this.platform, "Let's go!", '👣');
          this.schedule(() => this.completeStep(step.success), 1050);
        });
        target.textContent = '👉';
        makeBubble("Let’s go!", 'bubble-bottom');
        break;
      }
      case 'eating': {
        addImg('characters/toddler-eating.png', 'eating-card', 'Toddler eating');
        const foods = [
          ['apple.png', 'Apple', '🍎'],
          ['banana.png', 'Banana', '🍌'],
          ['strawberry.png', 'Strawberry', '🍓']
        ];
        foods.forEach(([src, label, emoji], i) => {
          const b = button(`food-float food-${i}`, label, () => {
            this.stepState.selectedFood = { src, label, emoji };
            b.classList.add('food-caught');
            rewardFeedback(this.platform, `Yummy ${label}!`, emoji);
            this.schedule(() => this.completeStep(step.success), 500);
          });
          b.style.backgroundImage = `url("${new URL(`objects/${src}`, ASSET_ROOT).href}")`;
        });
        makeBubble('Mmm… I am eating!', 'bubble-bottom');
        break;
      }
      case 'food-choice': {
        addImg('characters/toddler-eating.png', 'eating-card small-eating-card', 'Toddler eating');
        const selected = this.stepState.selectedFood || { src: 'apple.png', label: 'Apple', emoji: '🍎' };
        const foods = [
          ['apple.png', 'Apple'],
          ['banana.png', 'Banana'],
          ['strawberry.png', 'Strawberry']
        ].map(([src, label]) => [src, label, src === selected.src]);
        this.phraseEl.textContent = 'What did you eat?';
        this.instructionEl.textContent = `Tap the ${selected.label.toLowerCase()}.`;
        foods.forEach(([src, label, correct], i) => {
          const b = button(`choice-object food-choice-${i}`, label, () => correct
            ? this.completeStep(`I ate ${selected.label.toLowerCase()}.`, b)
            : this.wrongTry(b, `Remember, you ate ${selected.label.toLowerCase()}.`));
          b.style.backgroundImage = `url("${new URL(`objects/${src}`, ASSET_ROOT).href}")`;
        });
        break;
      }
      case 'drink-choice': {
        addImg('characters/toddler-pointing.png', 'character toddler drink-pointer', 'Toddler pointing');
        const drinks = [
          ['water-glass.png', 'Water', true],
          ['juice.png', 'Juice', false],
          ['sippy-cup.png', 'Sippy cup', false]
        ];
        drinks.forEach(([src, label, correct], i) => {
          const b = button(`choice-object drink-choice drink-choice-${i}`, label, () => correct
            ? this.completeStep(step.success, b)
            : this.wrongTry(b, 'Tap the water!'));
          b.style.backgroundImage = `url("${new URL(`objects/${src}`, ASSET_ROOT).href}")`;
        });
        makeBubble('I am drinking!', 'bubble-bottom');
        break;
      }
      case 'drag-to-toddler':
        this.makeDragScene('banana.png', 'Drag the banana to the girl.', 'toddler-target', 'Toddler', step.success, '🟡');
        break;
      case 'drag-to-mumma':
        this.makeDragScene('cookie.png', 'Drag the cookie to Mumma.', 'mumma-target', 'Mumma', step.success, '💗');
        break;
      case 'teddy-choice': {
        addImg('characters/toddler-pointing.png', 'character toddler teddy-pointer', 'Toddler pointing');
        const teddy = button('teddy-choice', 'Teddy', () => {
          teddy.classList.add('teddy-happy');
          teddy.style.backgroundImage = `url("${new URL('characters/teddy-wave.png', ASSET_ROOT).href}")`;
          rewardFeedback(this.platform, 'That is Teddy!', '🧸');
          this.schedule(() => this.completeStep(step.success, teddy), 650);
        });
        teddy.style.backgroundImage = `url("${new URL('characters/teddy-standing.png', ASSET_ROOT).href}")`;
        makeBubble('What is that?', 'bubble-bottom');
        break;
      }
      case 'teddy-trick': {
        const teddy = button('teddy-trick interactive-character', 'Teddy', () => {
          teddy.classList.add('teddy-playing');
          teddy.style.backgroundImage = `url("${new URL('characters/teddy-running.png', ASSET_ROOT).href}")`;
          ball.classList.add('ball-trick');
          rewardFeedback(this.platform, 'Amazing Teddy!', '⭐');
          this.schedule(() => this.completeStep(step.success), 900);
        });
        teddy.style.backgroundImage = `url("${new URL('characters/teddy-standing.png', ASSET_ROOT).href}")`;
        const ball = addImg('objects/ball.png', 'trick-ball', 'Ball');
        const spark = document.createElement('div');
        spark.className = 'teddy-trick-spark';
        spark.textContent = '✨';
        this.stage.appendChild(spark);
        makeBubble('How do you do that?', 'bubble-bottom');
        break;
      }
      case 'how-are-you': {
        addImg('characters/teddy-standing.png', 'character teddy tiny-teddy', 'Teddy');
        const choices = [
          ['😊', true, 'Happy'], ['😴', false, 'Sleepy'], ['😮', false, 'Surprised']
        ];
        choices.forEach(([emoji, correct, label], i) => {
          const b = button(`face-choice face-${i}`, label, () => correct
            ? this.completeStep(step.success, b)
            : this.wrongTry(b, 'How are you? Find the happy face!'));
          b.textContent = emoji;
        });
        makeBubble('How are you?', 'bubble-bottom');
        break;
      }
      case 'teddy-mischief': {
        const teddy = button('teddy-mischief', 'Teddy', () => {
          teddy.classList.add('mischief-hit');
          teddy.classList.add('hide-and-peek');
          rewardFeedback(this.platform, 'Silly Teddy!', '😄');
          this.schedule(() => this.completeStep(step.success, teddy), 950);
        });
        teddy.style.backgroundImage = `url("${new URL('characters/teddy-surprised.png', ASSET_ROOT).href}")`;
        makeBubble('Teddy did something silly!', 'bubble-bottom');
        break;
      }
      case 'find-teddy': {
        addImg('characters/toddler-searching.png', 'character toddler teddy-searcher', 'Toddler searching');
        const teddy = addImg('characters/teddy-sleeping.png', 'character teddy hidden-teddy', 'Teddy');
        teddy.style.opacity = '0';
        const spots = [
          ['cushion.png', 'cover-left', false],
          ['toy-box.png', 'cover-center', true],
          ['tunnel.png', 'cover-right', false]
        ];
        spots.forEach(([src, cls, correct]) => {
          const b = button(`hide-spot ${cls}`, 'Find Teddy', () => {
            if (correct) {
              teddy.style.opacity = '1';
              teddy.classList.add('teddy-reveal');
              b.classList.add('cover-reveal');
              rewardFeedback(this.platform, 'You found Teddy!', '🧸');
              this.schedule(() => this.completeStep(step.success), 650);
            } else this.wrongTry(b, 'Keep looking!');
          });
          b.style.backgroundImage = `url("${new URL(`objects/${src}`, ASSET_ROOT).href}")`;
        });
        makeBubble('Where is Teddy?', 'bubble-bottom');
        break;
      }
      default:
        makeBubble('Let’s play!', 'bubble-bottom');
        break;
    }
  }

  makeDragScene(objectFile, instruction, targetClass, targetLabel, success, emoji) {
    const toddler = document.createElement('img');
    toddler.src = new URL('characters/toddler-pointing.png', ASSET_ROOT).href;
    toddler.alt = 'Toddler';
    toddler.className = 'character toddler drag-toddler';
    toddler.draggable = false;
    toddler.addEventListener('error', () => { toddler.hidden = true; }, { once: true });
    this.stage.appendChild(toddler);

    const target = document.createElement('div');
    target.className = `drag-target ${targetClass}`;
    if (targetClass === 'mumma-target') {
      const mumma = document.createElement('img');
      mumma.src = new URL('characters/mumma-open-arms.png', ASSET_ROOT).href;
      mumma.alt = 'Mumma';
      mumma.className = 'drag-target-character';
      mumma.draggable = false;
      target.appendChild(mumma);
    } else {
      const targetIcon = document.createElement('span');
      targetIcon.className = 'drag-target-icon';
      targetIcon.textContent = emoji;
      target.appendChild(targetIcon);
      const targetText = document.createElement('span');
      targetText.className = 'drag-target-label';
      targetText.textContent = targetLabel;
      target.appendChild(targetText);
    }
    this.stage.appendChild(target);

    const item = document.createElement('button');
    item.type = 'button';
    item.className = `drag-item drag-${objectFile.replace('.png','')}`;
    item.setAttribute('aria-label', objectFile.replace('.png',''));
    item.style.backgroundImage = `url("${new URL(`objects/${objectFile}`, ASSET_ROOT).href}")`;
    this.stage.appendChild(item);

    let dragging = false;
    let pointerId = null;
    let offsetX = 0;
    let offsetY = 0;
    const origin = { left: '45%', top: '42%' };
    item.style.left = origin.left;
    item.style.top = origin.top;
    const move = (event) => {
      if (!dragging || event.pointerId !== pointerId) return;
      const rect = this.stage.getBoundingClientRect();
      item.style.left = `${clamp(event.clientX - rect.left - offsetX, 8, rect.width - item.offsetWidth - 8)}px`;
      item.style.top = `${clamp(event.clientY - rect.top - offsetY, 8, rect.height - item.offsetHeight - 8)}px`;
      const targetRect = target.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const overlap = !(itemRect.right < targetRect.left || itemRect.left > targetRect.right || itemRect.bottom < targetRect.top || itemRect.top > targetRect.bottom);
      target.classList.toggle('target-near', overlap);
    };
    const up = (event) => {
      if (event.pointerId !== pointerId) return;
      const targetRect = target.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const overlap = !(itemRect.right < targetRect.left || itemRect.left > targetRect.right || itemRect.bottom < targetRect.top || itemRect.top > targetRect.bottom);
      dragging = false;
      item.releasePointerCapture?.(pointerId);
      pointerId = null;
      target.classList.remove('target-near');
      if (overlap) {
        item.classList.add('drag-success');
        target.classList.add('target-hit');
        rewardFeedback(this.platform, success, emoji);
        this.schedule(() => this.completeStep(success), 700);
      } else {
        item.classList.add('drag-return');
        item.style.left = origin.left;
        item.style.top = origin.top;
        this.schedule(() => item.classList.remove('drag-return'), 300);
        this.wrongTry(item, `Bring it to ${targetLabel}!`);
      }
    };
    item.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      pointerId = event.pointerId;
      dragging = true;
      const itemRect = item.getBoundingClientRect();
      offsetX = event.clientX - itemRect.left;
      offsetY = event.clientY - itemRect.top;
      item.setPointerCapture?.(pointerId);
    });
    item.addEventListener('pointermove', move);
    item.addEventListener('pointerup', up);
    item.addEventListener('pointercancel', up);
    this.pointerCleanup.push(() => {
      item.removeEventListener('pointermove', move);
      item.removeEventListener('pointerup', up);
      item.removeEventListener('pointercancel', up);
    });
    const helper = document.createElement('div');
    helper.className = 'language-helper bubble-bottom';
    helper.textContent = instruction;
    this.stage.appendChild(helper);
  }

  completeStep(message = 'Great!', sourceButton = null) {
    if (!this.isRunning || this.stepLocked) return;
    this.stepLocked = true;
    if (sourceButton) sourceButton.classList.add('success-hit');
    this.score += 1;
    this.updateScore();
    rewardFeedback(this.platform, message, '⭐');
    tapFeedback(this.platform?.audioManager, 'success');
    vibrate([18, 25, 35]);
    this.phraseEl.classList.add('phrase-win');
    this.schedule(() => this.phraseEl.classList.remove('phrase-win'), 420);
    this.schedule(() => {
      if (!this.scenario) return;
      if (this.stepIndex < this.scenario.steps.length - 1) {
        this.stepIndex += 1;
        this.presentStep();
      } else {
        this.finishScenario();
      }
    }, 650);
  }

  finishScenario() {
    this.clearStepTimers();
    this.clearPointerListeners();
    this.stage.innerHTML = `
      <div class="scenario-complete">
        <img src="${new URL('effects/success-badge.png', ASSET_ROOT).href}" alt="Success" class="success-badge">
        <h2>${this.scenario.shortName} complete!</h2>
        <p>⭐ ${this.scenario.steps.length} little phrases played</p>
        <div class="scenario-complete-actions">
          <button type="button" class="big-action" data-next="again">🔁 Play again</button>
          <button type="button" class="big-action" data-next="choose">🗺️ Choose another</button>
        </div>
      </div>`;
    rewardFeedback(this.platform, `${this.scenario.shortName} adventure complete!`, '🎉');
    this.stage.querySelector('[data-next="again"]').addEventListener('click', () => {
      this.stepIndex = 0;
      this.presentStep();
    });
    this.stage.querySelector('[data-next="choose"]').addEventListener('click', () => {
      this.scenario = null;
      this.adventure.hidden = true;
      this.picker.hidden = false;
      this.renderScenarioPicker();
    });
    this.platform?.audioManager?.speak?.(`Well done! You finished the ${this.scenario.shortName} adventure.`, 0.82);
  }

  wrongTry(element, speech) {
    if (!element) return;
    tapFeedback(this.platform?.audioManager, 'error');
    vibrate(12);
    element.classList.remove('wrong-hit');
    void element.offsetWidth;
    element.classList.add('wrong-hit');
    this.platform?.audioManager?.speak?.(speech, 0.82);
    return false;
  }

  speakCurrent() {
    const step = this.currentStep();
    if (!step || !this.isRunning) return;
    this.platform?.audioManager?.speak?.(`${step.phrase} ${step.instruction}`, 0.8);
  }

  schedule(fn, ms) {
    const id = setTimeout(() => {
      this.timers.delete(id);
      fn();
    }, ms);
    this.timers.add(id);
    return id;
  }

  clearStepTimers() {
    this.timers.forEach((id) => clearTimeout(id));
    this.timers.clear();
  }

  clearPointerListeners() {
    this.pointerCleanup.forEach((fn) => fn());
    this.pointerCleanup = [];
  }

  updateScore() {
    if (this.scoreEl) this.scoreEl.textContent = String(this.score);
  }

  updateTimer() {
    if (!this.timerEl) return;
    const m = Math.floor(this.remainingSeconds / 60);
    const s = String(this.remainingSeconds % 60).padStart(2, '0');
    this.timerEl.textContent = `${m}:${s}`;
  }
}
