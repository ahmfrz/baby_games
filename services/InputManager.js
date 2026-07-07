export class InputManager {
  /**
   * Key press callback map
   * @type {Object<string, Function>}
   */
  keyCallbacks = {};

  /**
   * Register a key callback
   * @param {string} key - The key character
   * @param {Function} callback - Callback function to execute when key is pressed
   */
  onKey(key, callback) {
    if (!this.keyCallbacks[key]) {
      this.keyCallbacks[key] = [];
    }
    this.keyCallbacks[key].push(callback);
  }

  /**
   * Unregister a key callback
   * @param {string} key - The key character
   * @param {Function} callback - Callback function to remove
   */
  offKey(key, callback) {
    if (!this.keyCallbacks[key]) return;
    const index = this.keyCallbacks[key].indexOf(callback);
    if (index > -1) {
      this.keyCallbacks[key].splice(index, 1);
    }
  }

  /**
   * Trigger a key press
   * @param {string} key - The key character
   */
  triggerKey(key) {
    if (this.keyCallbacks[key] && this.keyCallbacks[key].length > 0) {
      this.keyCallbacks[key].forEach(callback => callback());
    }
  }

  /**
   * Handle global keyboard events
   */
  setupGlobalKeyHandlers() {
    document.addEventListener('keydown', (event) => {
      if (this.isEditableTarget(event.target)) {
        return;
      }

      // Ignore if game container exists
      if (this.gameContainer && this.gameContainer.offsetParent !== null) {
        const key = event.key.toUpperCase();
        // Check if key is a letter or number (or maybe emoji)
        if (/^[A-Z0-9]$/.test(key)) {
          this.triggerKey(key);
          // Prevent default behavior for game keys
          event.preventDefault();
        }
      }
    });
  }

  /**
   * Let form controls receive normal typing, especially parent PIN inputs.
   * @param {EventTarget} target - Event target from the keydown event
   * @returns {boolean}
   */
  isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) return false;
    const tagName = target.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
  }

  /**
   * Check if a key is registered
   * @param {string} key - The key character
   * @returns {boolean}
   */
  hasKey(key) {
    return !!this.keyCallbacks[key];
  }
}
