import { Capacitor } from '@capacitor/core';

// Google's published Android sample IDs. These display test creatives only.
const TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';

let admob = null;
let initialized = false;
let bannerShown = false;
let canRequestAds = false;
let completedActions = 0;

export function isAndroidNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function initNativeAds() {
  if (!isAndroidNative() || bannerShown) return bannerShown;

  try {
    admob = await import('@capacitor-community/admob');

    // Follow Google's consent flow before requesting ads.
    let consent = await admob.AdMob.requestConsentInfo();
    if (
      consent.isConsentFormAvailable &&
      consent.status === admob.AdmobConsentStatus.REQUIRED
    ) {
      consent = await admob.AdMob.showConsentForm();
    }

    canRequestAds = Boolean(consent.canRequestAds);
    if (!canRequestAds) {
      console.info('ImageMate ads not requested: consent is not ready.');
      return false;
    }

    if (!initialized) {
      await admob.AdMob.initialize();
      initialized = true;
    }

    await admob.AdMob.showBanner({
      adId: TEST_BANNER_ID,
      adSize: admob.BannerAdSize.ADAPTIVE_BANNER,
      position: admob.BannerAdPosition.BOTTOM_CENTER,
      // Keep the adaptive native banner above ImageMate's bottom navigation.
      margin: 66
    });

    bannerShown = true;
    console.info('ImageMate Google AdMob test banner shown', TEST_APP_ID);
    return true;
  } catch (error) {
    console.warn('ImageMate AdMob test banner could not be shown', error);
    return false;
  }
}

// Test interstitials are intentionally infrequent and only shown at a natural
// completion point. Replace test IDs with your own approved IDs before launch.
export async function maybeShowTestInterstitial() {
  if (!isAndroidNative() || !canRequestAds || !initialized || !admob) return;

  completedActions += 1;
  if (completedActions % 5 !== 0) return;

  try {
    await admob.AdMob.prepareInterstitial({ adId: TEST_INTERSTITIAL_ID });
    await admob.AdMob.showInterstitial();
  } catch (error) {
    console.warn('ImageMate AdMob test interstitial could not be shown', error);
  }
}
