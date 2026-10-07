import { Capacitor, registerPlugin } from '@capacitor/core';

const ImageMateUpdater = registerPlugin('ImageMateUpdater');

export const isNativeAndroid = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export async function notifyAndroidUpdate(version) {\n  if (!isNativeAndroid()) return { supported: false };\n  return ImageMateUpdater.notifyUpdate({ version });\n}\n\nexport async function installLatestAndroidUpdate(url) {
  if (!isNativeAndroid()) return { supported: false };
  return ImageMateUpdater.downloadAndInstall({ url });
}
