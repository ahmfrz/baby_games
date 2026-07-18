import { GameModule } from '../../core/GameModule.js';

const SWIPE_THRESHOLD_PX = 40;

export class ComicStoryGame extends GameModule {
  static metadata = {
    id: 'comic-stories',
    name: '📖 Comic Stories',
    description: 'Flip through comic-style storybooks, panel by panel.',
    version: '1.0.0',
    author: 'Baby Games',
    assetPath: 'games/comic-stories/assets/'
  };

  constructor(platform) {
    super(platform);

    this.root = null;
    this.elements = {};
    this.stories = [];
    this.currentStory = null;
    this.currentPageIndex = 0;
    this.isRunning = false;
    this.remainingSeconds = 0;
    this.timerId = null;
    this.pendingTimeouts = new Set();
    this.touchStartX = null;
    this.keydownHandler = null;
  }

  async initialize() {
    await this.loadGameData();
    this.mountUI();
  }

  start() {
    this.isRunning = true;
    this.currentStory = null;
    this.currentPageIndex = 0;
    this.remainingSeconds = this.timerService?.getDuration?.() ?? 300;

    this.hideBlocker();
    this.updateTimer();
    this.showLibrary();
    this.bindKeyboardInput();
    this.startTimer();
  }

  pause() {
    this.isRunning = false;
    this.clearTimer();
    this.stopSpeech();
  }

  resume() {
    if (this.remainingSeconds <= 0 || this.isBlocked()) return;
    this.isRunning = true;
    this.startTimer();
  }

  stop() {
    this.isRunning = false;
    this.clearTimer();
    this.clearPendingTimeouts();
    this.stopSpeech();
    this.unbindKeyboardInput();
  }

  reset() {
    this.stop();
    this.start();
  }

  cleanup() {
    this.stop();
    this.root?.remove();
    this.root = null;
    this.elements = {};
  }

  // ============================================
  // Data loading
  // ============================================

  async loadGameData() {
    const manifest = await this.fetchManifest();
    this.stories = (manifest.stories || []).filter(
      (story) => story?.id && Array.isArray(story.pages) && story.pages.length > 0
    );
  }

  async fetchManifest() {
    try {
      const response = await fetch(`${ComicStoryGame.metadata.assetPath}manifest.json`);
      if (!response.ok) throw new Error(`Manifest failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('[ComicStoryGame] Could not load story manifest.', error);
      return { stories: [] };
    }
  }

  resolveImage(relativePath) {
    return `${ComicStoryGame.metadata.assetPath}images/${relativePath}`;
  }

  // ============================================
  // UI construction
  // ============================================

  mountUI() {
    if (this.root?.isConnected) return;

    const host = this.getGameContainerEl();
    const root = document.createElement('section');
    root.id = 'comic-stories-game';
    root.className = 'comic-game';
    root.setAttribute('aria-label', 'Comic story reader');

    root.append(
      this.createHeader(),
      this.createLibrary(),
      this.createReader(),
      this.createBlocker()
    );

    host?.appendChild(root);
    this.root = root;
  }

  createHeader() {
    const header = document.createElement('header');
    header.className = 'comic-header';

    const brand = document.createElement('div');
    brand.className = 'comic-brand';
    brand.innerHTML = '<span class="brand-mark">📖</span><span class="brand-label">Comic Stories</span>';

    const status = document.createElement('div');
    status.className = 'comic-status';

    const timer = document.createElement('div');
    timer.className = 'status-pill timer-pill';
    timer.innerHTML = '<span class="status-icon">⏱</span><strong>0:00</strong>';

    const parentButton = document.createElement('button');
    parentButton.type = 'button';
    parentButton.className = 'parent-button';
    parentButton.textContent = 'Parent';
    parentButton.addEventListener('click', () => this.showPinBlocker('exit'));

    status.append(timer, parentButton);
    header.append(brand, status);

    this.elements.timer = timer.querySelector('strong');

    return header;
  }

  createLibrary() {
    const library = document.createElement('main');
    library.className = 'comic-library';

    const heading = document.createElement('h2');
    heading.className = 'library-heading';
    heading.textContent = 'Pick a story';

    const grid = document.createElement('div');
    grid.className = 'story-grid';

    const empty = document.createElement('p');
    empty.className = 'library-empty hidden';
    empty.textContent = 'No stories yet — add some to assets/manifest.json!';

    library.append(heading, grid, empty);

    this.elements.library = library;
    this.elements.storyGrid = grid;
    this.elements.libraryEmpty = empty;

    return library;
  }

  renderLibrary() {
    const grid = this.elements.storyGrid;
    grid.innerHTML = '';

    this.elements.libraryEmpty.classList.toggle('hidden', this.stories.length > 0);

    this.stories.forEach((story) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'story-card';
      card.setAttribute('aria-label', `Read ${story.title}`);

      const cover = document.createElement('img');
      cover.className = 'story-cover';
      cover.alt = story.title || 'Story cover';
      cover.loading = 'lazy';
      cover.src = this.resolveImage(story.coverImage || story.pages[0].image);

      const title = document.createElement('span');
      title.className = 'story-title';
      title.textContent = story.title || 'Untitled story';

      card.append(cover, title);
      card.addEventListener('click', () => this.openStory(story));

      grid.appendChild(card);
    });
  }

  createReader() {
    const reader = document.createElement('main');
    reader.className = 'comic-reader hidden';

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'reader-back';
    backButton.textContent = '← Stories';
    backButton.addEventListener('click', () => this.showLibrary());

    const panelWrap = document.createElement('div');
    panelWrap.className = 'panel-wrap';

    const panelImage = document.createElement('img');
    panelImage.className = 'panel-image';
    panelImage.alt = '';
    panelImage.decoding = 'async';

    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.className = 'panel-nav panel-nav-prev';
    prevButton.setAttribute('aria-label', 'Previous panel');
    prevButton.textContent = '‹';
    prevButton.addEventListener('click', () => this.prevPage());

    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.className = 'panel-nav panel-nav-next';
    nextButton.setAttribute('aria-label', 'Next panel');
    nextButton.textContent = '›';
    nextButton.addEventListener('click', () => this.nextPage());

    panelWrap.append(panelImage, prevButton, nextButton);
    this.bindSwipe(panelWrap);

    const caption = document.createElement('p');
    caption.className = 'panel-caption';

    const footer = document.createElement('div');
    footer.className = 'reader-footer';

    const readAloud = document.createElement('button');
    readAloud.type = 'button';
    readAloud.className = 'read-aloud-button';
    readAloud.innerHTML = '🔊 Read to me';
    readAloud.addEventListener('click', () => this.speak(caption.textContent));

    const dots = document.createElement('div');
    dots.className = 'page-dots';

    footer.append(readAloud, dots);

    reader.append(backButton, panelWrap, caption, footer);

    this.elements.reader = reader;
    this.elements.panelImage = panelImage;
    this.elements.panelCaption = caption;
    this.elements.pageDots = dots;
    this.elements.prevButton = prevButton;
    this.elements.nextButton = nextButton;

    return reader;
  }

  createBlocker() {
    const blocker = document.createElement('div');
    blocker.className = 'session-blocker hidden';
    blocker.setAttribute('role', 'dialog');
    blocker.setAttribute('aria-modal', 'true');
    blocker.innerHTML = `
      <div class="blocker-card">
        <div class="blocker-burst" aria-hidden="true">📖</div>
        <h2 class="blocker-title">Story time is over</h2>
        <label class="pin-label" for="comicPinInput">Parent PIN</label>
        <input id="comicPinInput" class="pin-entry" type="password" maxlength="4" inputmode="numeric" autocomplete="off">
        <p class="pin-error" aria-live="polite"></p>
        <button type="button" class="unlock-button">Unlock</button>
      </div>
    `;

    const input = blocker.querySelector('.pin-entry');
    const unlock = blocker.querySelector('.unlock-button');
    const submit = () => this.handlePinSubmit();

    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '');
      this.elements.pinError.textContent = '';
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submit();
    });
    unlock.addEventListener('click', submit);

    this.elements.blocker = blocker;
    this.elements.blockerTitle = blocker.querySelector('.blocker-title');
    this.elements.pinInput = input;
    this.elements.pinError = blocker.querySelector('.pin-error');

    return blocker;
  }

  // ============================================
  // Library / reader flow
  // ============================================

  showLibrary() {
    this.stopSpeech();
    this.currentStory = null;
    this.elements.reader.classList.add('hidden');
    this.elements.library.classList.remove('hidden');
    this.renderLibrary();
  }

  openStory(story) {
    this.stopSpeech();
    this.currentStory = story;
    this.currentPageIndex = 0;
    this.elements.library.classList.add('hidden');
    this.elements.reader.classList.remove('hidden');
    this.renderPage();
  }

  renderPage() {
    if (!this.currentStory) return;
    this.stopSpeech();

    const pages = this.currentStory.pages;
    const page = pages[this.currentPageIndex];

    this.elements.panelImage.src = this.resolveImage(page.image);
    this.elements.panelImage.alt = page.caption || this.currentStory.title || 'Comic panel';
    this.elements.panelCaption.textContent = page.caption || '';

    this.elements.prevButton.disabled = this.currentPageIndex === 0;
    this.elements.nextButton.disabled = this.currentPageIndex === pages.length - 1;

    this.renderPageDots(pages.length);
  }

  renderPageDots(total) {
    const dots = this.elements.pageDots;
    dots.innerHTML = '';
    for (let index = 0; index < total; index += 1) {
      const dot = document.createElement('span');
      dot.className = `page-dot${index === this.currentPageIndex ? ' active' : ''}`;
      dots.appendChild(dot);
    }
  }

  nextPage() {
    if (!this.currentStory) return;
    const lastIndex = this.currentStory.pages.length - 1;
    if (this.currentPageIndex >= lastIndex) return;
    this.currentPageIndex += 1;
    this.renderPage();
  }

  prevPage() {
    if (!this.currentStory) return;
    if (this.currentPageIndex <= 0) return;
    this.currentPageIndex -= 1;
    this.renderPage();
  }

  // ============================================
  // Input handling
  // ============================================

  bindKeyboardInput() {
    this.unbindKeyboardInput();
    this.keydownHandler = (event) => {
      if (!this.isRunning || this.isBlocked() || !this.currentStory) return;
      if (event.key === 'ArrowRight') {
        this.nextPage();
        event.preventDefault();
      } else if (event.key === 'ArrowLeft') {
        this.prevPage();
        event.preventDefault();
      } else if (event.key === 'Escape') {
        this.showLibrary();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
  }

  unbindKeyboardInput() {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  }

  bindSwipe(panelWrap) {
    panelWrap.addEventListener('touchstart', (event) => {
      this.touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });

    panelWrap.addEventListener('touchend', (event) => {
      if (this.touchStartX === null) return;
      const deltaX = event.changedTouches[0].clientX - this.touchStartX;
      this.touchStartX = null;

      if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
      if (deltaX < 0) this.nextPage();
      else this.prevPage();
    }, { passive: true });
  }

  // ============================================
  // Narration
  // ============================================

  speak(text) {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }

  stopSpeech() {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // Speech synthesis is optional.
    }
  }

  // ============================================
  // Session timer + parent PIN blocker
  // ============================================

  updateTimer() {
    if (!this.elements.timer) return;
    const clamped = Math.max(0, this.remainingSeconds);
    const minutes = Math.floor(clamped / 60);
    const seconds = String(clamped % 60).padStart(2, '0');
    this.elements.timer.textContent = `${minutes}:${seconds}`;
  }

  startTimer() {
    this.clearTimer();
    this.timerId = setInterval(() => {
      this.remainingSeconds -= 1;
      this.updateTimer();
      if (this.remainingSeconds <= 0) this.endSession();
    }, 1000);
  }

  clearTimer() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  endSession() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.clearTimer();
    this.clearPendingTimeouts();
    this.stopSpeech();
    this.showPinBlocker('sessionEnd');
  }

  showPinBlocker(mode) {
    this.elements.blockerTitle.textContent =
      mode === 'exit' ? 'Parent unlock' : 'Story time is over';

    this.elements.pinError.textContent = '';
    this.elements.pinInput.value = '';
    this.elements.blocker.classList.remove('hidden');
    this.elements.pinInput.focus({ preventScroll: true });
  }

  hideBlocker() {
    this.elements.blocker?.classList.add('hidden');
  }

  isBlocked() {
    return !!this.elements.blocker && !this.elements.blocker.classList.contains('hidden');
  }

  handlePinSubmit() {
    const pin = this.elements.pinInput.value;
    if (!this.timerService?.checkResetPin?.(pin)) {
      this.elements.pinError.textContent = 'Incorrect PIN';
      this.elements.pinInput.value = '';
      return;
    }

    this.hideBlocker();
    this.exitToTimerSetup();
  }

  async exitToTimerSetup() {
    this.cleanup();

    const gameContainer = this.getGameContainerEl();
    const launcher = document.getElementById('launcher');
    if (gameContainer) gameContainer.style.display = 'none';
    if (launcher) launcher.style.display = 'none';
    if (this.platform) this.platform.currentGame = null;

    await this.platform?.showTimerUI?.();
  }

  setManagedTimeout(callback, delay) {
    const id = setTimeout(() => {
      this.pendingTimeouts.delete(id);
      callback();
    }, delay);
    this.pendingTimeouts.add(id);
  }

  clearPendingTimeouts() {
    this.pendingTimeouts.forEach((id) => clearTimeout(id));
    this.pendingTimeouts.clear();
  }
}
