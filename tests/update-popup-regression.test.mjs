import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('the update popup promotes its live action to install when the APK download completes', () => {
  const completeBranch = source.match(/if\(s\?\.status===['"]complete['"]\)\{([\s\S]*?)\}else if\(s\?\.status===['"]failed['"]/);
  assert.ok(completeBranch, 'download-complete branch must exist');
  assert.match(completeBranch[1], /overlay\.promoteToInstall\(\)/,
    'download completion must switch the popup action, not only change its label');
});

test('an already-open download popup is promoted when a later update check finds the APK ready', () => {
  assert.match(source, /const existingPopup\s*=\s*document\.querySelector\(['"]#update-popup['"]\)/,
    'the popup must detect an existing instance before creating another');
  assert.match(source, /existingPopup\.promoteToInstall\(\)/,
    'a ready-state update check must promote the existing popup instead of leaving a stale download handler');
});

test('the install click handler reads the current popup mode rather than a captured initial mode', () => {
  assert.match(source, /let installMode\s*=\s*mode\s*===\s*['"]install['"]/,
    'popup mode must be mutable across download-to-install transition');
});

test('the web-content updater applies a verified bundle without invoking the APK installer', () => {
  const ota = readFileSync(new URL('../src/ota.js', import.meta.url), 'utf8');
  assert.match(ota, /await LiveUpdate\.downloadBundle\(/,
    'the updater must download the OTA bundle');
  assert.match(ota, /await LiveUpdate\.setNextBundle\(\{ bundleId \}\)/,
    'the downloaded bundle must be selected for activation');
  assert.match(ota, /await LiveUpdate\.reload\(\)/,
    'the updater must reload the WebView to apply compatible web assets immediately');
  assert.doesNotMatch(ota, /installDownloadedAndroidUpdate|downloadLatestAndroidUpdate/,
    'web-content updates must not invoke the APK installer flow');
});


test('a failed or cancelled APK install keeps a retry action visible', () => {
  assert.match(source, /btn\.textContent='Try install again'/,
    'the install popup must keep a retry action after opening the installer');
  assert.match(source, /checkForAndroidUpdate\(true\)/,
    'the app must force an update check when returning from Android installer');
  assert.doesNotMatch(source, /if\(installing\)[\s\S]*?if\(b\)\{b\.hidden=true;b\.disabled=true\}[\s\S]*?return ['"]installing['"]/,
    'a stale installing flag must not hide the update action');
});
