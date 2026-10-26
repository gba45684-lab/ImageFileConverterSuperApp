// Over-the-air update endpoint for @capgo/capacitor-updater (same contract as the ResuMate endpoint).
// The app POSTs { app_id, version_name } and receives { version, url, checksum } when a newer web bundle exists.
//
// ImageMate publishes web-layer bundles as ImageMate-ota.zip on GitHub Releases. OTA-only releases are
// prereleases, and GitHub's /releases/latest skips prereleases, so this endpoint scans recent releases
// and picks the newest non-draft release that carries the bundle with a sha256 digest.
import { createHash } from 'node:crypto';

export const APP_ID = 'com.gba45684.imagemate';
export const REPO = 'gba45684-lab/ImageFileConverterSuperApp';
export const BUNDLE = 'ImageMate-ota.zip';

const SHA256_DIGEST = /^sha256:([a-f0-9]{64})$/i;

// Tags look like "v1.3.8", "1.3.8" or "ota-1.3.8". Strip the prefixes before comparing.
export function versionFromTag(tag) {
  return String(tag || '').replace(/^ota-/i, '').replace(/^v/i, '');
}

// True when `candidate` is a strictly newer dotted version than `current` (missing parts count as 0).
export function isNewerVersion(candidate, current) {
  const parts = s => String(s).split('.').map(x => parseInt(x, 10) || 0);
  const a = parts(candidate);
  const b = parts(current);
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

// Picks the newest release (GitHub returns newest first) that has a usable OTA bundle.
export function pickRelease(releases) {
  if (!Array.isArray(releases)) return null;
  for (const release of releases) {
    if (!release || release.draft || !release.tag_name || !Array.isArray(release.assets)) continue;
    const asset = release.assets.find(item => item.name === BUNDLE);
    const digest = asset && SHA256_DIGEST.exec(String(asset.digest || ''));
    if (!asset || !asset.browser_download_url || !digest) continue;
    return {
      tag: String(release.tag_name),
      url: asset.browser_download_url,
      checksum: digest[1].toLowerCase(),
    };
  }
  return null;
}

async function latestRelease() {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'ImageMate-OTA' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=20`, { headers }).catch(() => null);
  if (!response || !response.ok) {
    console.error('update check: GitHub API failed with status', response ? response.status : 'network', 'token set:', !!process.env.GITHUB_TOKEN);
    return null;
  }
  return pickRelease(await response.json());
}

async function sha256Of(url) {
  const response = await fetch(url).catch(() => null);
  if (!response || !response.ok) return null;
  return createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  // Short cache so a newly published bundle reaches devices quickly.
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const info = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (info.app_id && info.app_id !== APP_ID) {
      return res.status(200).json({ message: 'No update for this app', version: info.version_name || '' });
    }
    const current = String(info.version_name || '0.0.0').replace(/^v/i, '');

    const release = await latestRelease();
    if (!release) return res.status(200).json({ message: 'No update available', version: current });

    const version = versionFromTag(release.tag);
    if (!version || !isNewerVersion(version, current)) {
      return res.status(200).json({ message: 'Already up to date', version: current });
    }

    const checksum = release.checksum || (await sha256Of(release.url));
    if (!checksum) return res.status(200).json({ message: 'Update checksum unavailable', version: current });

    return res.status(200).json({ version, url: release.url, checksum });
  } catch (error) {
    console.error('update check failed', error && error.message);
    return res.status(200).json({ message: 'Update check failed safely' });
  }
}
