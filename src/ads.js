import { Capacitor } from '@capacitor/core';

const TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
let admob = null;
let initialized = false;
let completedActions = 0;
let currentBannerMargin = null;
let bannerResizeListenerBound = false;
const BANNER_NAV_GAP = 6;

function getBannerBottomMargin() {
  const nav = document.querySelector('.mobile-bottom-nav');
  if (!nav || getComputedStyle(nav).display === 'none') return 0;
  const navRect = nav.getBoundingClientRect();
  if (!navRect.height) return 0;
  // BannerAdOptions.margin is a bottom offset. Align its lower edge just above
  // the real primary navigation, regardless of that screen's nav layout mode.
  return Math.max(0, Math.round(window.innerHeight - navRect.top + BANNER_NAV_GAP));
}

async function showBannerAtMargin(margin) {
  await admob.AdMob.showBanner({
    adId: TEST_BANNER_ID,
    adSize: admob.BannerAdSize.BANNER,
    position: admob.BannerAdPosition.BOTTOM_CENTER,
    margin,
    isTesting: true
  });
  currentBannerMargin = margin;
}

export function isAndroidNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function initNativeAds() {
  if (!isAndroidNative() || initialized) return false;
  try {
    admob = await import('@capacitor-community/admob');
    await admob.AdMob.initialize();
    await showBannerAtMargin(getBannerBottomMargin());
    initialized = true;
    if (!bannerResizeListenerBound) {
      bannerResizeListenerBound = true;
      window.addEventListener('resize', () => {
        window.requestAnimationFrame(() => {
          syncNativeAdPlacement().catch(error => console.debug('ImageMate ad placement refresh skipped', error));
        });
      }, { passive: true });
    }
    console.info('ImageMate AdMob test banner initialized', TEST_APP_ID);
    return true;
  } catch (error) {
    console.warn('ImageMate AdMob initialization failed', error);
    return false;
  }
}

export async function syncNativeAdPlacement() {
  if (!isAndroidNative() || !initialized || !admob) return false;
  const margin = getBannerBottomMargin();
  if (margin === currentBannerMargin) return true;
  await showBannerAtMargin(margin);
  return true;
}

export async function maybeShowTestInterstitial() {
  if (!isAndroidNative()) return;
  completedActions += 1;
  if (!initialized || !admob || completedActions % 2 !== 0) return;
  try {
    await admob.AdMob.prepareInterstitial({
      adId: TEST_INTERSTITIAL_ID,
      isTesting: true
    });
    await admob.AdMob.showInterstitial();
  } catch (error) {
    console.warn('ImageMate test interstitial failed', error);
  }
}
