import { Capacitor, registerPlugin } from '@capacitor/core';

const ImageMateUpdater = registerPlugin('ImageMateUpdater');

export const isNativeAndroid = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export async function notifyAndroidUpdate(version) {
  if (!isNativeAndroid()) return { supported: false };
  return ImageMateUpdater.notifyUpdate({ version });
}

export async function downloadLatestAndroidUpdate(url) {
  if (!isNativeAndroid()) return { supported: false };
  return ImageMateUpdater.downloadUpdate({ url });
}

export async function installDownloadedAndroidUpdate() {
  if (!isNativeAndroid()) return { supported: false };
  return ImageMateUpdater.installDownloadedUpdate();
}

export async function hasDownloadedAndroidUpdate() {
  if (!isNativeAndroid()) return { supported: false, ready: false };
  return ImageMateUpdater.hasDownloadedUpdate();
}

export async function saveProcessedFile(name, mime, base64) {
  if (!isNativeAndroid()) return { supported: false };
  return ImageMateUpdater.saveProcessedFile({ name, mime, base64 });
}
