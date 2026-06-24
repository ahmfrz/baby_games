/**
 * Unified input manager for keyboard and button clicks
 * Handles both desktop (keyboard) and mobile (button) input
 */
export class InputManager {
  constructor() {
    this.keyListeners = new Map();
    this.buttonListeners = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize input manager - set up event listeners
   */
  initialize() {
    if (this.isInitialized) return;

    // Keyboard events
    document.addEventListener('keydown', e => this.handleKeyDown(e));
    document.addEventListener('keyup', e => this.handleKeyUp(e));

    this.isInitialized = true;
    console.log('[InputManager] Initialized');
  }

  /**
   * Register a keyboard key listener
   * @param {string} key - Key to listen for (e.g., 'A', 'Enter', 'ArrowUp')
   * @param {Function} onPress - Callback when key is pressed
   * @param {Function} onRelease - Optional callback when key is released
   */
  onKey(key, onPress, onRelease = null) {
    const keyUpper = key.toUpperCase();
    this.keyListeners.set(keyUpper, { onPress, onRelease });
  }

  /**
   * Unregister a keyboard key listener
   * @param {string} key - Key to stop listening for
   */
  offKey(key) {
    this.keyListeners.delete(key.toUpperCase());
  }

  /**
   * Register a button click listener
   * @param {HTMLElement} button - Button element
   * @param {Function} onClick - Callback when button is clicked
   */
  onButton(button, onClick) {
    button.addEventListener('click', () => onClick());
    this.buttonListeners.set(button, onClick);
  }

  /**
   * Unregister a button click listener
   * @param {HTMLElement} button - Button element
   */
  offButton(button) {
    button.removeEventListener('click', this.buttonListeners.get(button));
    this.buttonListeners.delete(button);
  }

  /**
   * Clear all input listeners
   */
  clear() {
    this.keyListeners.clear();
    this.buttonListeners.forEach((listener, button) => {
      button.removeEventListener('click', listener);
    });
    this.buttonListeners.clear();
  }

  // Private methods
  handleKeyDown(event) {
    const key = event.key.toUpperCase();
    if (this.keyListeners.has(key)) {
      const { onPress } = this.keyListeners.get(key);
      if (onPress) {
        onPress(key);
        event.preventDefault();
      }
    }
  }

  handleKeyUp(event) {
    const key = event.key.toUpperCase();
    if (this.keyListeners.has(key)) {
      const { onRelease } = this.keyListeners.get(key);
      if (onRelease) {
        onRelease(key);
        event.preventDefault();
      }
    }
  }
}

export const inputManager = new InputManager();
