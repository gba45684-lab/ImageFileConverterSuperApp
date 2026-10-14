import { Capacitor } from '@capacitor/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';

const RELEASES_API = 'https://api.github.com/repos/gba45684-lab/ImageFileConverterSuperApp/releases?per_page=20';
const OTA_ASSET = 'ImageMate-ota.zip';
const UPDATE_CHECK_KEY = 'imagemate-github-ota-last-check';

let checkInFlight = false;

export async function initGitHubOta({ force = false } = {}) {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
  // The Settings toggle controls automatic OTA checks. A user-requested manual refresh may still run while it is off.
  if (!force && localStorage.getItem('imagemate-auto-update') === '0') return;
  if (checkInFlight) return;
  checkInFlight = true;

  try {
    // Acknowledge the current bundle before attempting to download another one,
    // so the plugin can safely roll back a bundle that fails on the next launch.
    await LiveUpdate.ready();

    const lastCheck = Number(localStorage.getItem(UPDATE_CHECK_KEY) || 0);
    if (!force && Date.now() - lastCheck < 10 * 60 * 1000) return;
    localStorage.setItem(UPDATE_CHECK_KEY, String(Date.now()));

    const response = await fetch(RELEASES_API, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`GitHub Releases returned HTTP ${response.status}`);
    const releases = await response.json();
    if (!Array.isArray(releases)) return;

    // Releases are returned newest-first. Pick the newest release that actually
    // contains an OTA bundle; OTA-only releases are prereleases by design.
    const release = releases.find(item =>
      !item.draft && Array.isArray(item.assets) &&
      item.assets.some(asset => asset.name === OTA_ASSET && /^sha256:[a-f0-9]{64}$/i.test(asset.digest || ''))
    );
    if (!release) return;

    const asset = release.assets.find(item => item.name === OTA_ASSET);
    const checksum = String(asset.digest).replace(/^sha256:/i, '').toLowerCase();
    const bundleId = String(release.tag_name || '');
    if (!bundleId || !asset.browser_download_url) return;

    const [current, next] = await Promise.all([
      LiveUpdate.getCurrentBundle().catch(() => ({ bundleId: null })),
      LiveUpdate.getNextBundle().catch(() => ({ bundleId: null })),
    ]);
    if (current.bundleId === bundleId || next.bundleId === bundleId) return;

    await LiveUpdate.downloadBundle({
      url: asset.browser_download_url,
      bundleId,
      checksum,
    });
    await LiveUpdate.setNextBundle({ bundleId });
    console.info('[ImageMate OTA] Update downloaded and queued:', bundleId);
    // Apply on the next normal app launch; don't interrupt file processing.
  } catch (error) {
    console.debug('[ImageMate OTA] Update check skipped:', error);
  } finally {
    checkInFlight = false;
  }
}
