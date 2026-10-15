# ImageMate whole-app UI/UX implementation standard

This is the required checklist for every UI change in ImageMate. It supplements `AGENTS.md` and `CLAUDE.md` and follows the shared design system at https://github.com/gba45684-lab/premium-ui-library.

## Visual system
- Primary preset: **Premium Minimalism**. Supporting motif: **restrained Glassmorphism** for selected hero/surface treatments.
- Use the brand guide’s soft aurora pastel gradients selectively for the Home hero and a few emphasis surfaces; don't decorate every component.
- The approved Option 7 brand guide is the reference for the whole app: #F8FAFC background, #10213F navy, #6366F1 indigo primary, #885CFF purple secondary, #14B8A6 teal accent, #F59E0B amber highlight, clean rounded white cards, subtle gradients, Lucide icons and quiet depth.
- Reuse and update the existing `--im-*` tokens in `src/design-refresh.css`. Don't introduce unrelated colors, font systems or one-off effects.
- Keep screens compact and purposeful: clear title, short helper copy, grouped controls, primary action and minimal decoration.
- The Appearance control is provided in Settings and persisted to local storage; do not add an unnecessary duplicate theme control to the global header.

## Required implementation sequence
1. **Inspect first.** Read repository instructions, shared UI rules, target markup/styles, event handlers and related modules. Record IDs, storage keys, navigation, native calls and behavior that must remain intact.
2. **Plan hierarchy.** Define page header/back navigation, primary content groups, secondary actions, status feedback and responsive collapse before writing CSS.
3. **Reuse the system.** Prefer existing tokens, button styles, spacing, radius, typography and Lucide icons. Keep markup semantic and selectors scoped to the affected screen.
4. **Preserve behavior.** Keep existing control IDs/listeners where possible. Do not rewrite processing, file handling, local storage, update checks, ads, permissions or Capacitor bridges for a visual-only change.
5. **Build robust layouts.** Use CSS Grid/Flex and `minmax(0,1fr)`; set `min-width:0` on flexible children; allow long words to wrap; avoid fixed card heights and accidental overflow; support safe areas and small touch screens.
6. **Make controls usable.** Every control needs an accessible label/name, keyboard operation, visible focus, appropriate disabled/loading state and a real action. Toggles must communicate their current state; status must not rely on color alone.
7. **Design all states.** Account for loading, empty, error, success, disabled, selected, unselected, offline/update failure and permission-required states where applicable. Add reduced-motion fallbacks.
8. **Check breakpoints.** Inspect 320px, 360px, 390px, 600px, tablet and desktop widths. Verify light/dark themes, long copy, large text when possible, no horizontal page scroll and no overlapping buttons.
9. **Exercise real flows.** Test Home → Settings → Back, Settings → File Library → Back, format/quality persistence, update toggle on/off, manual Refresh and each changed button. Do not claim device checks that were not run.
10. **Verify the release.** Run `npm run build`, inspect relevant GitHub Actions jobs/logs, and verify the APK artifact/release asset when Android packaging is affected. Review the final diff for accidental logic changes before reporting results.

## Settings acceptance criteria
- Header, warm color palette, card styling and typography feel like a natural continuation of Home.
- Back to tools always works.
- Processing format and quality persist and reflect stored values.
- Automatic update checks remain enabled by default unless disabled; disabling pauses background checks, while manual Refresh remains available.
- File Library opens the existing downloads screen.
- Version/privacy information remains visible.
- No horizontal overflow or clipped controls at 320–390px; desktop uses a balanced grid and small screens collapse to one column.

## Completion report
Report changed files and commit, build status with links, whether the APK artifact exists, and any tests that could not be performed. Never describe a build as successful or an APK as tested without tool evidence.


## Branding and logo placement — Option 7
- Official mark: deep-navy iM monogram with a single warm amber dot above the i; keep the wordmark clean and primarily navy.
- Keep `public/icon.svg`, `index.html` favicon/theme metadata and `manifest.webmanifest` icon/colors aligned. The main UI mark remains inline SVG so CSS can animate its dot without extra runtime dependencies.
- Global header: left aligned, vertically centered, icon tile 42px desktop / 38px narrow mobile, followed by ImageMate wordmark. Hide the small descriptor on narrow phones to avoid crowding.
- Home: small monogram immediately precedes the uppercase “IMAGEMATE / LOCAL-FIRST” eyebrow above the hero heading. Headline hierarchy stays stronger than the logo.
- Use navy `#10213f`, amber `#ffb32c` and existing warm `--im-*` tokens. Give the mark a pale surface behind it in both themes so navy remains readable.
- Animate only on interaction: a subtle one-shot 180–400ms hover response, with no infinite motion. Keep tap/focus visible and respect `prefers-reduced-motion`.
- Validate sizes at 18px, 38px and 42px; inspect clipping, contrast, positioning and mobile header overflow. Do not use screenshot artwork as the actual UI logo.


## Native icon/build parity
- Android CI recreates the Capacitor project. Keep the Android manifest launcher resource pointing to the Option 7 vector, and review the generated manifest/resource references whenever the icon changes.
- The native icon, PWA/browser icon and in-app header mark must remain consistent; the SVG/PWA icon does not automatically update Capacitor launcher resources.
- Re-run and verify Android packaging after changing launcher resources; do not mark the native icon complete based only on a web build.


## Whole-app visual scope
The reference covers more than the logo and landing page. Apply the same component system to every dedicated tool screen, tool selector/icon tile, format and range control, upload/dropzone, selected-file queue, processing action bar, progress indicator, error/success/result card, PDF/OCR output, downloads library, Settings, update dialog, navigation header, footer and responsive states. Preserve actual workflows and use semantic, live UI rather than embedding a reference screenshot.


## Home, Tools and Settings component contract
- **Home:** brand header, hero illustration, four hero indicators, six Popular Tools cards and a working See all tools action. Search is on Tools, not Home.
- **Tools:** a separate catalog screen with All / Image / Document / Other chips, search and rows for all 14 current utilities. Category and search filters must combine, update empty state and retain the appropriate active-navigation state.
- **Settings:** brand card; format selector; quality slider and live percentage; Appearance toggle; Automatic updates; Check now; File library; About and app version. Every control is functional and uses existing preference keys/native updater behavior.
- **Navigation:** Home, Tools, Files and Settings work as independent destinations on mobile; desktop navigation matches and highlights the current destination. Returning from a dedicated tool has a clear path back to the catalog/Home.
- Test the screen contract in both themes and at 320/360/390px, tablet and desktop. Test combined search/category filtering, all navigation, theme persistence, format/quality persistence, updater/manual check, file library and one real processing flow per affected class of tool.


## Sequential implementation and confirmation gate
For actual implementation use [UI_IMPLEMENTATION_RUNBOOK.md](UI_IMPLEMENTATION_RUNBOOK.md). Do not finish all screens in one large patch. Complete one stage, capture genuine screenshots from the built/running app, compare with the uploaded UI reference, check every interaction and build, commit the stage, and wait for the user's explicit approval before the next stage. Report visual comparison evidence separately from build/test status. If the current app cannot be screenshot-tested, do not call that stage visually approved.


### Exact Home mobile composition
Follow the uploaded reference: header with iM/ImageMate wordmark and settings gear; rounded pastel hero with “Tools for the paperwork of life.” and “Quick. Simple. Powerful.”; four indicators; “Popular Tools” plus See All; 3×2 compact card grid in the order Image to PDF, PDF to Image, Compress, Resize, Convert, More Tools. Remove extra Home search, LOCAL-FIRST divider, count label and category/subtitle clutter on mobile cards. Keep search on the Tools page.
