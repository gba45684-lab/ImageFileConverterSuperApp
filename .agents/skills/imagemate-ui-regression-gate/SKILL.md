---
name: imagemate-ui-regression-gate
description: Run the stage-specific regression/build gate before a UI stage can be presented for approval.
---

# ImageMate UI regression gate skill

## Before a stage is marked complete
1. Read the current stage exit criteria in `UI_IMPLEMENTATION_RUNBOOK.md`.
2. Review the diff for unintended changes to state, IDs, handlers, localStorage, navigation, file processing, downloads/shares, updater, ads and Capacitor.
3. Run `npm run build`. Do not state that it passed unless the command or corresponding current Actions run confirms it.
4. Inspect the newest Web build for the exact commit. Ignore a passing older run if it does not contain the current changes.
5. If native behavior, manifest/icon configuration, dependencies or Capacitor configuration changed, inspect the exact Android APK run. Verify APK metadata/signing, emulator clean install/update checks and artifact/release status when available.
6. Test the current stage's user journeys. Do not treat successful compilation as proof that click handlers or navigation work.
7. Record build IDs/URLs, commit SHA, interaction results, screenshot paths, and any pending checks.
8. If a check fails or remains unverified, keep the stage open and fix within that stage. Never silently advance.

## Approval gate
When the stage passes, provide a concise review with evidence and ask for user approval. Wait for explicit approval before changing the next stage. A request to “check,” a build success, or an unrelated change is not approval.
