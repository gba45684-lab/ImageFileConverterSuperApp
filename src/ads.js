import { Capacitor } from '@capacitor/core';

// Google's published Android sample IDs. These return test creatives only.
const TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';

let admob = null;
let initialized = false;
let bannerShown = false;
let completedActions = 0;
let lastBannerError = '';

export function isAndroidNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function initNativeAds() {
  if (!isAndroidNative()) return { shown: false, reason: 'not-android' };
  if (bannerShown) return { shown: true };

  try {
    admob = admob || await import('@capacitor-community/admob');

    // Test ad units must be testable without the production consent gate.
    // Production IDs must use the appropriate consent flow before requesting ads.
    if (!initialized) {
      await admob.AdMob.initialize();
      initialized = true;
    }

    await admob.AdMob.showBanner({
      adId: TEST_BANNER_ID,
      adSize: admob.BannerAdSize.ADAPTIVE_BANNER,
      position: admob.BannerAdPosition.BOTTOM_CENTER,
      // ImageMate has a fixed bottom navigation; raise the banner above it.
      margin: 66
    });

    bannerShown = true;
    lastBannerError = '';
    console.info('[ImageMate ads] Google test banner requested successfully.', TEST_APP_ID);
    return { shown: true };
  } catch (error) {
    lastBannerError = String(error?.message || error);
    console.error('[ImageMate ads] Test banner failed:', error);
    return { shown: false, reason: lastBannerError };
  }
}

export function getNativeAdStatus() {
  return {
    supported: isAndroidNative(),
    initialized,
    bannerShown,
    lastBannerError
  };
}

// Test interstitials are infrequent and appear only at a natural completion point.
export async function maybeShowTestInterstitial() {
  if (!isAndroidNative() || !initialized || !admob) return;

  completedActions += 1;
  if (completedActions % 5 !== 0) return;

  try {
    await admob.AdMob.prepareInterstitial({ adId: TEST_INTERSTITIAL_ID });
    await admob.AdMob.showInterstitial();
  } catch (error) {
    console.warn('[ImageMate ads] Test interstitial failed:', error);
  }
}
