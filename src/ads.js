import { Capacitor } from '@capacitor/core';

const TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
let admob = null;
let initialized = false;
let completedActions = 0;

export function isAndroidNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function initNativeAds() {
  if (!isAndroidNative() || initialized) return false;
  try {
    admob = await import('@capacitor-community/admob');
    await admob.AdMob.initialize();
    await admob.AdMob.showBanner({
      adId: TEST_BANNER_ID,
      adSize: admob.BannerAdSize.BANNER,
      position: admob.BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: true
    });
    initialized = true;
    console.info('ImageMate AdMob test banner initialized', TEST_APP_ID);
    return true;
  } catch (error) {
    console.warn('ImageMate AdMob initialization failed', error);
    return false;
  }
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
