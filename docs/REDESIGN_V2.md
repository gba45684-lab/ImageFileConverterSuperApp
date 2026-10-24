# ImageMate redesign v2 — plan and status

Branch: `redesign/v2` (not merged to `main`).

## Baseline (audited)
- `main` builds (`npm run build`) and passes 12 tests (`npm test`).
- Entry: `index.html` loads `src/main.js` (~1,100 lines) and `src/home-interactions.js`.
- Styling is layered across 8 override stylesheets (`*-refresh.css`) on top of `style.css`.
- Persisted keys in use (must be preserved): `imagemate-dark`, `imagemate-format`,
  `imagemate-quality`, `imagemate-auto-update`, `imagemate-history`, `imagemate-last-used`,
  `imagemate-last-update-check`, `imagemate-update-*`.
- Android updater, AdMob and native bridges must keep working.

## Milestones
1. **Foundation (this commit):** design tokens in `src/design/tokens.css` (brand palette,
   type, spacing, radius, elevation, motion, light/dark, reduced motion). Not yet imported.
2. **Components:** buttons, cards, chips, list rows, dialogs, toasts, empty/loading/error states.
3. **Shell:** Home / Tools / Files / Settings navigation with working back paths.
4. **Tool workspaces:** the 14 existing tools on shared components; logic unchanged.
5. **Files, Settings, updater:** rebuild on shared components; keep storage keys.
6. **Verification:** build and tests on every commit; screenshots and manual flow checks
   at 320/360/390/768/1440px in light and dark, once a browser is available.

## Status
- Stage 1 (Home): contract copy, six-card grid, Popular Tools heading, carousel text unified.
  Touch targets raised to 44px on phone and tablet (brand, See All, top nav).
- Automated Home audit: `tests/ui/home-audit.mjs` (21 checks: overflow, accessible names,
  44px targets, focus, reduced motion, card order, indicators, console errors). Run it with a
  Chromium binary and `puppeteer-core` available (see the script header). Not in `package.json`.
- Stage 2 (Tools catalog): chips are All / Image / Document / Other (mapped from the workflow
  groups; Text & OCR counts as Other). Workflow group headings kept. All 37 tool rows kept.
  Automated check: `tests/ui/tools-audit.mjs` (7 checks). Open decision: the runbook says
  "14 utilities", but the app has 37 rows. This commit keeps all 37, since the preservation
  rules forbid removing features.
- Stage 3 (Settings): brand card added (iM mark, ImageMate, "Simple. Powerful. Yours.").
  Fixed a default bug: a new install's quality was 10% (Number(null) = 0, clamped to the
  minimum) instead of 88%. Automated check: `tests/ui/settings-audit.mjs` (11 checks).
  Not covered by automation: "Check now" (needs the native updater/network).
- Milestone 1: tokens written, unwired. Nothing visible has changed yet.
- Visual parity against the Option 7 reference: **not verified** (no browser or reference
  image available in the build environment).
