# ImageMate Engineering Rules

## Role
Act as a Claude Code-style agent for this repository: inspect the existing code first, make focused changes, run verification, inspect failures, fix them, and only then report success.

## Stack — preserve it
- Frontend: HTML, CSS and modern JavaScript (ES modules)
- Build/dev: Node.js + Vite
- Android: Capacitor 8 + Gradle/Java 21
- Image processing: browser Canvas/Web APIs and existing JS libraries
- PDF: pdfjs-dist + jsPDF
- OCR: Tesseract.js
- HEIC: heic2any
- ZIP: JSZip
- Ads: Capacitor AdMob
- Updates: native Android bridge + GitHub Releases/DownloadManager
- CI/CD: GitHub Actions

Do not rewrite the application into another language or framework merely to imitate an AI coding tool. Claude Code is an agent workflow, not a programming language.

## Architecture
- Preserve the Capacitor web-first architecture.
- Keep UI, browser processing, native Android integration and CI concerns separated.
- Reuse existing modules before adding duplicate implementations.
- Do not remove working features to fix an unrelated feature.
- Keep processing local whenever the existing feature is designed to be local.

## UI/UX
- Every ImageMate tool must open its own dedicated screen.
- Every screen must have a working back path to All tools.
- Maintain responsive phone, tablet and desktop layouts.
- Maintain dark mode across every screen.
- Prevent blank/white screens, broken event handlers, overflow and inaccessible controls.
- Upload -> settings -> process -> result -> download must be a complete flow.
- Buttons must perform the action their labels promise.
- Do not silently change the established visual language without a clear reason.

## Android
- Preserve the existing update flow.
- Version checking must use the latest GitHub Release and the ImageMate.apk asset.
- Preserve DownloadManager/background download, notification, vibration/sound and FileProvider installation behavior.
- Remember that Android requires user approval for APK installation; never implement a fake silent-install flow.
- Do not break native file saving, sharing or Downloads access while changing web UI.

## GitHub Actions
- Main is the release/build source of truth.
- Verify web build and Android APK build after significant changes.
- Verify the generated APK exists and the GitHub Release asset is published before calling an APK ready.
- Keep versioning deterministic and compatible with the updater.

## Verification workflow
After significant changes:
1. Inspect the affected code and related modules.
2. Run npm build.
3. Run the Android workflow or Android build when Android code/workflow is affected.
4. Inspect failed logs rather than guessing.
5. Verify the APK artifact and release asset when a release build is requested.
6. Check the installed-app update path when updater code changes.
7. Test the affected UI path for errors and blank screens.

## Debugging rules
- Reproduce or inspect the actual failure first.
- Prefer the smallest safe fix.
- Check browser console/runtime errors and Android build/runtime errors separately.
- Do not hide errors with broad catch blocks unless the fallback is intentional.
- Keep error messages actionable for the user.
- After fixing one failure, rerun the relevant verification instead of assuming the fix worked.

## Git rules
- Make focused commits with clear messages.
- Never overwrite unrelated work.
- Preserve user files and existing functionality.
- Do not claim a change, build, release or APK is ready unless the repository/tool output verifies it.

## Agent tooling
- Use repository instructions as the source of truth.
- MCP/tools may be used for GitHub or external integrations when explicitly configured.
- Keep agent configuration minimal and project-specific.
- If a tool integration is unavailable, continue with the repository's existing local/CI tooling rather than replacing the app architecture.

## Definition of done
A feature is done only when the code is changed, the relevant build/check passes, the user-facing flow works, and any requested Android artifact/release is actually verified.
