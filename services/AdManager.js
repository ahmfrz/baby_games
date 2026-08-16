const ADS_DISABLED_KEY = 'babyGamesAdsDisabled';
const ADS_CLIENT = window.BABY_GAMES_AD_CLIENT || '';
const DEFAULT_SLOT = window.BABY_GAMES_AD_SLOT || '';

export class AdManager {
  constructor() {
    this.container = null;
  }

  initialize(containerId = 'adBanner') {
    this.container = document.getElementById(containerId);
    if (ADS_CLIENT && !document.querySelector('script[data-baby-ads]')) {
      const script = document.createElement('script');
      script.async = true; script.crossOrigin = 'anonymous';
      script.dataset.babyAds = 'true';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADS_CLIENT)}`;
      document.head.appendChild(script);
    }
    this.render();
  }

  isDisabled() {
    try { return localStorage.getItem(ADS_DISABLED_KEY) === '1'; } catch (e) { return false; }
  }

  disable() {
    try { localStorage.setItem(ADS_DISABLED_KEY, '1'); } catch (e) {}
    this.render();
  }

  enable() {
    try { localStorage.removeItem(ADS_DISABLED_KEY); } catch (e) {}
    this.render();
  }

  render() {
    if (!this.container) return;
    if (this.isDisabled()) {
      this.container.style.display = 'none';
      this.container.innerHTML = '';
      return;
    }

    this.container.style.display = 'flex';
    this.container.innerHTML = '';

    // Real AdSense integration is activated by defining BABY_GAMES_AD_CLIENT
    // and BABY_GAMES_AD_SLOT before main.js. Until then a clearly labelled
    // ad slot is shown so layout is tested without a fake ad network call.
    const label = document.createElement('div');
    label.className = 'ad-placeholder-label';
    label.textContent = 'Advertisement';
    this.container.appendChild(label);

    if (ADS_CLIENT && DEFAULT_SLOT) {
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', ADS_CLIENT);
      ins.setAttribute('data-ad-slot', DEFAULT_SLOT);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      this.container.appendChild(ins);
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    } else {
      const demo = document.createElement('div');
      demo.className = 'ad-placeholder-box';
      demo.innerHTML = '<span>Ad space</span><small>Add your ad network client/slot to enable live ads.</small>';
      this.container.appendChild(demo);
    }
  }
}
