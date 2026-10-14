#!/usr/bin/env bash
set -euo pipefail

: "${GITHUB_WORKSPACE:?GITHUB_WORKSPACE is required}"
: "${APK_RELATIVE_PATH:?APK_RELATIVE_PATH must point to the validated APK}"

PACKAGE_ID="com.gba45684.imagemate"
APK="$GITHUB_WORKSPACE/$APK_RELATIVE_PATH"

echo "Testing APK: $APK"
test -s "$APK"

if [ -n "${BASELINE_APK:-}" ] && [ -s "$BASELINE_APK" ]; then
  echo "A signing-compatible prior release was prepared; testing an in-place upgrade."
  adb install "$BASELINE_APK"
  adb install -r "$APK"
else
  echo "No signing-compatible prior release is available; testing a clean installation."
  adb install "$APK"
fi

adb logcat -c
adb shell monkey -p "$PACKAGE_ID" -c android.intent.category.LAUNCHER 1
sleep 8

INSTALLED_PATH="$(adb shell pm path "$PACKAGE_ID" | tr -d '\r' | grep 'package:' || true)"
if [ -z "$INSTALLED_PATH" ]; then
  echo "::error::ImageMate is not installed after adb install."
  exit 1
fi

CRASH_LOG="$(adb logcat -d -s AndroidRuntime:E || true)"
if printf '%s\n' "$CRASH_LOG" | grep -F "Process: $PACKAGE_ID" >/dev/null; then
  printf '%s\n' "$CRASH_LOG"
  echo "::error::ImageMate crashed on startup in the Android emulator."
  exit 1
fi

echo "PASS: APK installed and launched without a detected fatal runtime exception."
