import { Capacitor } from '@capacitor/core';

// Google's published Android sample IDs. These serve test creatives only.
export const TEST_AD_UNITS = Object.freeze({
  // 6300978111 is Google's fixed 320x50 banner demo; use the matching fixed size below.
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
  nativeAdvanced: 'ca-app-pub-3940256099942544/2247696110',
  appOpen: 'ca-app-pub-3940256099942544/9257395921'
});
const TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

let admob = null;
let initialized = false;
let bannerShown = false;
let bannerListenersRegistered = false;
let completedActions = 0;
let lastBannerError = '';
let appOpenShownThisLaunch = false;

export function isAndroidNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

async function getAdMob() {
  admob = admob || await import('@capacitor-community/admob');
  if (!initialized) {
    await admob.AdMob.initialize({ initializeForTesting: true });
    initialized = true;
    console.info('[ImageMate ads] AdMob initialized in test mode.', TEST_APP_ID);
  }
  return admob;
}

async function registerBannerDiagnostics(plugin) {
  if (bannerListenersRegistered || !plugin.BannerAdPluginEvents) return;
  bannerListenersRegistered = true;
  try {
    await plugin.AdMob.addListener(plugin.BannerAdPluginEvents.Loaded, () => {
      lastBannerError = '';
      console.info('[ImageMate ads] Banner creative loaded.');
    });
    await plugin.AdMob.addListener(plugin.BannerAdPluginEvents.FailedToLoad, error => {
      lastBannerError = String(error?.message || error?.code || JSON.stringify(error));
      console.error('[ImageMate ads] Banner failed to load:', error);
    });
    await plugin.AdMob.addListener(plugin.BannerAdPluginEvents.AdImpression, () => {
      console.info('[ImageMate ads] Banner impression recorded.');
    });
  } catch (error) {
    console.warn('[ImageMate ads] Could not register banner diagnostics:', error);
  }
}

export async function initNativeAds() {
  if (!isAndroidNative()) return { shown: false, reason: 'not-android' };

  try {
    const plugin = await getAdMob();
    await registerBannerDiagnostics(plugin);
    if (bannerShown) {
      // The native banner survives web-view re-renders; explicitly resume it if
      // Android or another screen previously hid it.
      await plugin.AdMob.resumeBanner();
      return { shown: true, resumed: true, error: lastBannerError };
    }

    await plugin.AdMob.showBanner({
      adId: TEST_AD_UNITS.banner,
      // The configured Google demo unit is a fixed-size 320x50 banner.
      // Do not request ADAPTIVE_BANNER with a fixed-size test unit.
      adSize: plugin.BannerAdSize.BANNER,
      position: plugin.BannerAdPosition.BOTTOM_CENTER,
      // Keep the banner above ImageMate's fixed bottom navigation.
      margin: 66
    });
    bannerShown = true;
    lastBannerError = '';
    console.info('[ImageMate ads] Google fixed-size test banner requested.', TEST_APP_ID);
    return { shown: true };
  } catch (error) {
    lastBannerError = String(error?.message || error);
    bannerShown = false;
    console.error('[ImageMate ads] Test banner failed:', error);
    return { shown: false, reason: lastBannerError };
  }
}

export function getNativeAdStatus() {
  return { supported: isAndroidNative(), initialized, bannerShown, lastBannerError };
}

// Show test App Open once on launch. Call after the first screen has rendered.
export async function maybeShowTestAppOpen() {
  if (!isAndroidNative() || appOpenShownThisLaunch) return;
  try {
    const plugin = await getAdMob();
    await plugin.AdMob.loadAppOpen({ adId: TEST_AD_UNITS.appOpen });
    const loaded = await plugin.AdMob.isAppOpenLoaded({ adId: TEST_AD_UNITS.appOpen });
    if (!loaded?.value) {
      console.warn('[ImageMate ads] App Open test ad did not finish loading; skipping show.');
      return;
    }
    await plugin.AdMob.showAppOpen({ adId: TEST_AD_UNITS.appOpen });
    appOpenShownThisLaunch = true;
    console.info('[ImageMate ads] App Open test ad shown.');
  } catch (error) {
    console.warn('[ImageMate ads] Test App Open ad failed:', error);
  }
}

// Call only from a clearly labelled, user-initiated "Watch ad" action.
// Never grant an app feature or benefit merely because an ad was clicked.
export async function showTestRewardedAd() {
  if (!isAndroidNative()) return { shown: false, reason: 'not-android' };
  try {
    const plugin = await getAdMob();
    await plugin.AdMob.prepareRewardVideoAd({ adId: TEST_AD_UNITS.rewarded });
    const reward = await plugin.AdMob.showRewardVideoAd();
    return { shown: true, reward };
  } catch (error) {
    console.warn('[ImageMate ads] Test rewarded ad failed:', error);
    return { shown: false, reason: String(error?.message || error) };
  }
}

// Test interstitials are infrequent and appear only at a natural completion point.
export async function maybeShowTestInterstitial() {
  if (!isAndroidNative() || !initialized || !admob) return;
  completedActions += 1;
  if (completedActions % 5 !== 0) return;
  try {
    await admob.AdMob.prepareInterstitial({ adId: TEST_AD_UNITS.interstitial });
    await admob.AdMob.showInterstitial();
  } catch (error) {
    console.warn('[ImageMate ads] Test interstitial failed:', error);
  }
}
