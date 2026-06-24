/**
 * Device detector for responsive design
 * Detects mobile/tablet vs desktop and manages input method visibility
 */
export class DeviceDetector {
  constructor() {
    this.isMobile = this.detectMobile();
    this.userPreference = null;
    this.loadPreference();
  }

  /**
   * Initialize device detector
   */
  initialize() {
    // Listen for viewport changes
    window.addEventListener('resize', () => {
      this.isMobile = this.detectMobile();
    });
  }

  /**
   * Detect if device is mobile/tablet
   * @returns {boolean}
   */
  detectMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Check if mobile or tablet
    const isMobileOrTablet = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    const isTouchDevice = () => {
      return (('ontouchstart' in window) ||
              (navigator.maxTouchPoints > 0) ||
              (navigator.msMaxTouchPoints > 0));
    };

    // Also check viewport width
    const isSmallViewport = window.innerWidth < 768;

    return isMobileOrTablet || isTouchDevice() || isSmallViewport;
  }

  /**
   * Check if should show on-screen buttons
   * @returns {boolean}
   */
  shouldShowButtons() {
    if (this.userPreference !== null) {
      return this.userPreference;
    }
    return this.isMobile;
  }

  /**
   * Check if should show keyboard hints
   * @returns {boolean}
   */
  shouldShowKeyboardHints() {
    if (this.userPreference === true) {
      return false; // User explicitly wants buttons only
    }
    return !this.isMobile;
  }

  /**
   * Set user preference for input method
   * @param {string} preference - 'buttons', 'keyboard', or 'auto'
   */
  setPreference(preference) {
    if (preference === 'auto') {
      this.userPreference = null;
    } else if (preference === 'buttons') {
      this.userPreference = true;
    } else if (preference === 'keyboard') {
      this.userPreference = false;
    }
    this.savePreference();
  }

  /**
   * Get current device type string
   * @returns {string} 'mobile', 'tablet', or 'desktop'
   */
  getDeviceType() {
    if (!this.isMobile) return 'desktop';
    return window.innerWidth < 600 ? 'mobile' : 'tablet';
  }

  /**
   * Get viewport info
   * @returns {Object} {width, height, dpr}
   */
  getViewport() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1
    };
  }

  // Private methods
  savePreference() {
    try {
      if (this.userPreference !== null) {
        localStorage.setItem('babyGames_inputPreference', JSON.stringify(this.userPreference));
      } else {
        localStorage.removeItem('babyGames_inputPreference');
      }
    } catch (err) {
      console.error('[DeviceDetector] Failed to save preference:', err);
    }
  }

  loadPreference() {
    try {
      const pref = localStorage.getItem('babyGames_inputPreference');
      if (pref !== null) {
        this.userPreference = JSON.parse(pref);
      }
    } catch (err) {
      console.error('[DeviceDetector] Failed to load preference:', err);
    }
  }
}

export const deviceDetector = new DeviceDetector();
