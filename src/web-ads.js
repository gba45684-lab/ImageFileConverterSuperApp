import { Capacitor } from '@capacitor/core';

const publisherId = String(import.meta.env.VITE_ADSENSE_CLIENT || '').trim();
const adSlotId = String(import.meta.env.VITE_ADSENSE_SLOT || '').trim();
let adsenseScriptPromise = null;

const validPublisherId = /^ca-pub-\d{10,30}$/.test(publisherId);
const validSlotId = /^\d{4,20}$/.test(adSlotId);

function escapeAttribute(value) {
  return String(value).replace(/[&"<>]/g, char => ({
    '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;'
  }[char]));
}

function loadAdsenseScript() {
  if (adsenseScriptPromise) return adsenseScriptPromise;
  adsenseScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-imagemate-adsense]');
    if (existing) {
      if (existing.dataset.loaded === 'true') return resolve();
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.imagemateAdsense = 'true';
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(publisherId);
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('AdSense script failed to load. Check site approval, ad blockers, and network access.'));
    document.head.appendChild(script);
  });
  return adsenseScriptPromise;
}

export async function initWebAds() {
  if (Capacitor.isNativePlatform()) return { mode: 'native' };
  const slot = document.querySelector('[data-web-ad-slot]');
  if (!slot) return { mode: 'none' };

  if (!validPublisherId || !validSlotId) {
    slot.innerHTML = '<div class="web-ad-preview-art"><span class="web-ad-preview-label">ADVERTISEMENT · PREVIEW</span><div class="web-ad-preview-body"><span class="web-ad-preview-icon">IM</span><div><b>ImageMate sponsor placement</b><p>Responsive ad space ready for Google AdSense.</p><small>Add your approved publisher ID and ad-unit ID to enable live ads.</small></div><span class="web-ad-preview-cta">Learn more ↗</span></div></div>';
    slot.dataset.adMode = 'preview';
    return { mode: 'preview', reason: 'AdSense publisher/ad-slot IDs are not configured.' };
  }

  slot.innerHTML = '<ins class="adsbygoogle web-ad-live" style="display:block" data-ad-client="' +
    escapeAttribute(publisherId) + '" data-ad-slot="' + escapeAttribute(adSlotId) +
    '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
  try {
    await loadAdsenseScript();
    if (slot.dataset.adsRequested !== 'true') {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      slot.dataset.adsRequested = 'true';
    }
    slot.dataset.adMode = 'live';
    return { mode: 'live' };
  } catch (error) {
    slot.dataset.adMode = 'error';
    slot.innerHTML = '<div class="web-ad-status" role="status">Live ads could not load. Check your AdSense setup, site approval, or content blocker.</div>';
    console.warn('[ImageMate ads] Website AdSense failed:', error);
    return { mode: 'error', reason: String(error?.message || error) };
  }
}
