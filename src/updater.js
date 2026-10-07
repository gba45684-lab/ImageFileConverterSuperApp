import { Capacitor, registerPlugin } from '@capacitor/core';

const ImageMateUpdater = registerPlugin('ImageMateUpdater');

export const isNativeAndroid = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export async function notifyAndroidUpdate(version) {
  if (!isNativeAndroid()) return { supported: false };
  return ImageMateUpdater.notifyUpdate({ version });
}

export async function installLatestAndroidUpdate(url) {
  if (!isNativeAndroid()) return { supported: false };
  return ImageMateUpdater.downloadAndInstall({ url });
}
