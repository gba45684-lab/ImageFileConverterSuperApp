import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// Web-layer OTA via @capgo/capacitor-updater, configured in capacitor.config.json.
// The plugin checks the update endpoint and downloads verified bundles (sha256 checksum).
// Config uses autoUpdate "onlyDownload", so the plugin never applies a bundle by itself;
// this module applies it (next + reload) only when the Settings toggle allows it.
// Android still needs a user-approved APK install for native changes; this path never installs an APK.

const AUTO_UPDATE_KEY = 'imagemate-auto-update';
const UPDATE_CHECK_KEY = 'imagemate-github-ota-last-check';
const MIN_CHECK_INTERVAL_MS = 10 * 60 * 1000;

let listenersReady = false;
let manualCheckRequested = false;
let applying = false;

function isAndroidNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

function autoUpdateEnabled() {
  return localStorage.getItem(AUTO_UPDATE_KEY) !== '0';
}

async function applyBundle(bundle) {
  if (!bundle || !bundle.id || applying) return;
  applying = true;
  try {
    // Queue the downloaded bundle, then reload so compatible HTML/CSS/JS changes take effect
    // without an APK install. Runs at startup or on an explicit user request, never mid-task.
    await CapacitorUpdater.next({ id: bundle.id });
    console.info('[ImageMate OTA] Web update queued:', bundle.version || bundle.id);
    await CapacitorUpdater.reload();
  } catch (error) {
    console.debug('[ImageMate OTA] Could not apply bundle:', error);
  } finally {
    applying = false;
  }
}

async function attachListeners() {
  if (listenersReady) return;
  listenersReady = true;
  await CapacitorUpdater.addListener('downloadComplete', event => {
    // A bundle is downloaded and verified. Apply it when auto-update is on or the user asked for a check.
    if (autoUpdateEnabled() || manualCheckRequested) {
      manualCheckRequested = false;
      applyBundle(event && event.bundle);
    }
  });
  await CapacitorUpdater.addListener('downloadFailed', event => {
    manualCheckRequested = false;
    console.debug('[ImageMate OTA] Download failed:', event);
  });
  await CapacitorUpdater.addListener('updateFailed', event => {
    console.debug('[ImageMate OTA] Bundle failed and was rolled back:', event);
  });
}

export async function initGitHubOta({ force = false } = {}) {
  if (!isAndroidNative()) return;
  try {
    await attachListeners();

    // Acknowledge the running bundle first so the plugin can roll back a bundle that fails on launch.
    await CapacitorUpdater.notifyAppReady();

    if (force) {
      // A user-requested check runs even when automatic checks are off.
      manualCheckRequested = true;
      localStorage.setItem(UPDATE_CHECK_KEY, String(Date.now()));
      await CapacitorUpdater.triggerUpdateCheck();
      return;
    }

    if (!autoUpdateEnabled()) return;
    const lastCheck = Number(localStorage.getItem(UPDATE_CHECK_KEY) || 0);
    if (Date.now() - lastCheck < MIN_CHECK_INTERVAL_MS) return;
    localStorage.setItem(UPDATE_CHECK_KEY, String(Date.now()));
    await CapacitorUpdater.triggerUpdateCheck();
  } catch (error) {
    manualCheckRequested = false;
    console.debug('[ImageMate OTA] Update check skipped:', error);
  }
}
