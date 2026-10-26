import test from 'node:test';
import assert from 'node:assert/strict';
import { isNewerVersion, pickRelease, versionFromTag, BUNDLE } from '../api/updates.js';

const DIGEST = 'sha256:' + 'a'.repeat(64);

function release(tag, { draft = false, digest = DIGEST, name = BUNDLE } = {}) {
  return {
    tag_name: tag,
    draft,
    assets: [{ name, browser_download_url: `https://example.test/${tag}/${name}`, digest }],
  };
}

test('version tags drop the v and ota- prefixes', () => {
  assert.equal(versionFromTag('v1.3.8'), '1.3.8');
  assert.equal(versionFromTag('ota-1.3.8'), '1.3.8');
  assert.equal(versionFromTag('1.3.8.42'), '1.3.8.42');
});

test('version comparison is numeric per part, so 1.10.0 is newer than 1.9.9', () => {
  assert.equal(isNewerVersion('1.10.0', '1.9.9'), true);
  assert.equal(isNewerVersion('1.3.8', '1.3.8'), false);
  assert.equal(isNewerVersion('1.3.8.2', '1.3.8'), true);
  assert.equal(isNewerVersion('1.3.7', '1.3.8'), false);
});

test('release selection takes the newest release that carries the bundle, including prereleases', () => {
  const picked = pickRelease([
    { tag_name: 'v1.3.9', draft: false, assets: [{ name: 'ImageMate.apk' }] },
    release('ota-1.3.9'),
    release('v1.3.8'),
  ]);
  assert.equal(picked.tag, 'ota-1.3.9');
  assert.equal(picked.checksum, 'a'.repeat(64));
});

test('drafts and releases without a sha256 digest are skipped', () => {
  const picked = pickRelease([
    release('v1.4.0', { draft: true }),
    release('v1.3.9', { digest: '' }),
    release('v1.3.8'),
  ]);
  assert.equal(picked.tag, 'v1.3.8');
});

test('releases not newer than the device version are skipped, so an older stable release cannot hide a newer OTA', () => {
  const picked = pickRelease([
    release('v1.3.8'),
    release('ota-1.3.8.42'),
  ], '1.3.8.10');
  assert.equal(picked.tag, 'ota-1.3.8.42');
  assert.equal(pickRelease([release('v1.3.8')], '1.3.8'), null);
});

test('no usable release returns null instead of a partial update', () => {
  assert.equal(pickRelease([]), null);
  assert.equal(pickRelease(null), null);
  assert.equal(pickRelease([release('v1.0.0', { name: 'other.zip' })]), null);
});
