import { Capacitor, registerPlugin } from '@capacitor/core';

const ImageMateUpdater = registerPlugin('ImageMateUpdater');

export const isNativeAndroid = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export async function requestAndroidNotificationPermission() {
  if (!isNativeAndroid()) return { supported: false, granted: true };
  return ImageMateUpdater.requestNotificationPermission();
}

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

export async function getAndroidUpdateStatus() {
  if (!isNativeAndroid()) return { supported: false, status: 'none' };
  return ImageMateUpdater.getUpdateStatus();
}

export async function getAndroidAppVersion() {
  if (!isNativeAndroid()) return { supported: false, version: null };
  return ImageMateUpdater.getAppVersion();
}

export async function hasDownloadedAndroidUpdate() {
  if (!isNativeAndroid()) return { supported: false, ready: false };
  return ImageMateUpdater.hasDownloadedUpdate();
}

export async function saveProcessedFile(name, mime, base64) {
  if (!isNativeAndroid()) return { supported: false };
  return ImageMateUpdater.saveProcessedFile({ name, mime, base64 });
}

export async function listDownloadedFiles() { if (!isNativeAndroid()) return { supported:false, files:[] }; return ImageMateUpdater.listDownloadedFiles(); }
export async function openDownloadedFile(path) { if (!isNativeAndroid()) return { supported:false }; return ImageMateUpdater.openDownloadedFile({ path }); }
export async function shareDownloadedFile(path) { if (!isNativeAndroid()) return { supported:false }; return ImageMateUpdater.shareDownloadedFile({ path }); }
export async function exportDownloadedFile(path,name,mime) { if (!isNativeAndroid()) return { supported:false }; return ImageMateUpdater.exportDownloadedFile({ path,name,mime }); }
