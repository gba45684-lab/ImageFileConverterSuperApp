# ImageMate UI/UX implementation guidance

Use the shared open-source design system at https://github.com/gba45684-lab/premium-ui-library as the default reference for future interface work.

## Product and visual direction
- Build a polished, compact, privacy-first image/document utility app. Prioritize fast task completion over decorative UI.
- Current visual system: premium minimalism with restrained glassmorphism, based on the approved ImageMate Option 7 UI brand guide. Use a cool near-white background, navy text, indigo/purple primary actions, teal success/accent states, amber highlights and white rounded cards. Use gradients selectively in the Home hero and selected surfaces.
- Keep layouts responsive across small Android phones, larger phones, tablets, and desktop browsers.
- Use consistent spacing, typography, borders, focus states, icon sizing, and light/dark theme tokens.
- Use Lucide icons already available in the project; avoid emoji as interface icons.

## Preserve existing behavior
- Inspect src/main.js, src/style.css, and related modules before changing UI.
- Do not remove or silently alter file conversion/compression, target-size export, resize, passport/signature sizing, PDF workflows, OCR, metadata cleaning, crop/rotate, photo editing, background removal, downloads, local processing, ads, updater, or Capacitor behavior.
- Keep processing on-device for supported workflows. Do not add file uploads or external processing without explicit approval.
- Avoid changing business logic to accomplish a visual refresh. Prefer isolated CSS and small semantic markup changes.
- Preserve keyboard access, accessible names, visible focus, reduced-motion support, safe-area behavior, and Android touch target sizing.
- Verify third-party resource licenses before adding dependencies or assets.

## Shared design reference
- Rules: https://github.com/gba45684-lab/premium-ui-library/blob/main/UI_UX_RULES.md
- Style presets: https://github.com/gba45684-lab/premium-ui-library/blob/main/presets/STYLE_PRESETS.md
- Open-source resources: https://github.com/gba45684-lab/premium-ui-library/blob/main/presets/OPEN_SOURCE_RESOURCES.md
- Redesign prompt: https://github.com/gba45684-lab/premium-ui-library/blob/main/prompts/REDESIGN_PROMPT.md

## Validation
- Run npm run build after UI changes.
- Test light/dark themes, mobile two-column tool cards, search, tool selection, upload/dropzone, settings, downloads, and the Android updater entry points.
- Report checks accurately; never claim a build or device test passed unless it was actually run.

## Whole-app UI/UX workflow — mandatory for every screen redesign
Before UI work, inspect `src/main.js`, `src/style.css`, `src/design-refresh.css`, the relevant feature module, and the shared design system. Read `https://github.com/gba45684-lab/premium-ui-library/blob/main/UI_UX_RULES.md` and `presets/STYLE_PRESETS.md`. Use **Premium Minimalism** as the primary preset with restrained **Glassmorphism** as the supporting motif. Match every screen to the approved brand guide: near-white #F8FAFC background, navy #10213F text/mark, indigo #6366F1 primary, purple #885CFF secondary, teal #14B8A6 accent, amber #F59E0B highlight, and consistent rounded cards.

### Required steps
1. Inventory current controls, IDs, event listeners, localStorage keys, navigation paths, native bridges and feature dependencies before editing.
2. Plan the page hierarchy: header/back path, main content groups, helper copy, status feedback and footer.
3. Keep UI markup, styles and behavior separate. Prefer scoped CSS and semantic markup. Preserve IDs and handlers unless a functional change is explicitly requested.
4. Use consistent spacing/radius/type tokens; responsive Grid/Flex with `minmax(0,1fr)`, `min-width:0`, wrapping and `overflow-wrap:anywhere`. Avoid fixed text-card heights and horizontal overflow.
5. Include accessible names, visible keyboard focus, comfortable touch targets, reduced-motion support, and useful loading/empty/error/success/disabled states.
6. Check light/dark themes and 320/360/390px, tablet and desktop widths. Test long copy, both toggle states, empty libraries, failed updates and repeated back/navigation actions.
7. Verify Home → Settings → Back, Settings → File Library → Back, format/quality persistence, automatic-update on/off and manual Refresh. Keep the Appearance toggle in Settings; do not duplicate it in the global header.
8. Do not add dependencies, remote assets, analytics, uploads or permissions for visual-only changes. Preserve local processing, ads, updater, Capacitor and file-saving behavior.
9. Run `npm run build`; inspect GitHub Actions web and Android builds and logs. Verify APK artifact/release asset when relevant. Never claim a physical-device test unless performed.
10. Review the final diff for accidental logic changes, dead/duplicate CSS, broken selectors, overflow, contrast and regressions before reporting.

See [UI_UX_GUIDELINES.md](UI_UX_GUIDELINES.md) for the full implementation and acceptance checklist.


## Official ImageMate identity — Option 7
- Use the approved **iM monogram**: bold deep-navy stem/M strokes with one warm amber dot above the i. Keep the mark geometric, minimal and legible at small sizes. Do not substitute generic “IM” text or emoji.
- Primary editable vector source: `public/icon.svg`. Browser favicon and PWA metadata are defined in `index.html` and `manifest.webmanifest`. The app-header mark is inline SVG in `src/main.js` so its dot and paths can have accessible, lightweight CSS micro-interactions.
- Header positioning: mark tile left-aligned and vertically centered beside the ImageMate wordmark. Use a 42px tile on desktop and 38px on narrow phones; keep the wordmark baseline aligned, and hide the secondary tagline on narrow screens rather than letting the header overflow.
- Home positioning: a small inline monogram sits immediately before the uppercase “IMAGEMATE / LOCAL-FIRST” kicker above the main hero title. Keep the headline as the dominant element; never let the logo compete with “Tools for the paperwork of life.”
- Brand colors: deep navy `#10213f`, amber dot `#ffb32c`, and the existing warm neutral `--im-*` backgrounds and surfaces. Use a light tile behind the icon in dark mode to preserve logo contrast. Do not recolor the mark arbitrarily per screen.
- Animation: only short interaction-driven micro-motion (roughly 180–400ms) such as a one-shot dot pop on hover and a 1px lift. No continuous pulsing, spinning, bounce loops or movement that distracts from conversion tasks. Preserve normal focus indication, touch activation, and `prefers-reduced-motion`.
- Responsive QA: inspect the mark at 18px in the Home kicker, 38–42px in the global header, and PWA icon sizes. Check pixel clarity, proportions, tap target and light/dark contrast.
- Never use a screenshot/mockup of the branding board as a UI asset. Implement using vector paths and the shared design tokens so the logo stays sharp and maintainable.


### Native launcher icon parity
The Android workflow generates a fresh Capacitor project on each build, so it must also apply the Option 7 vector launcher icon after `npx cap add android`. Keep its icon resource, app-header inline SVG, `public/icon.svg`, browser favicon and PWA manifest aligned. If the icon changes, check the generated Android manifest resource references and validate the Android build; do not assume the PWA icon automatically becomes the native launcher icon.


## End-to-end visual acceptance
Treat the uploaded ImageMate Option 7 UI brand guide as the visual target for every screen, not only Home and Settings. Apply its token palette, consistent corner radii, icon tiles, strong typography hierarchy, restrained illustration and calm transitions to all tool screens and states. Do not recreate the reference's phone mockups inside the live app. Use actual app layout and working controls, never a static screenshot as the product UI.


## Home / Tools / Settings screen contract
- Home is the discovery screen: brand hero + illustration, six-tool "Popular Tools" preview, and a real "See all tools" route. Search belongs to the separate Tools screen.
- Tools is a distinct screen with an All / Image / Document / Other category filter, search, and accessible rows for all 14 utilities. Every row opens the existing dedicated tool workflow.
- Settings is a real preferences screen with ImageMate brand card, format and quality defaults, Appearance toggle, automatic update preference, manual update check, File Library entry and About/version information.
- Desktop global navigation and mobile bottom navigation must take users to these separate screens, keep the active destination visibly selected, and work in light and dark modes.
- Required navigation QA: Home → See all tools → category/search → open tool → Back; Home → Settings → change theme → return; Settings → File Library → Back; verify all setting changes preserve their stored preferences.


## Mandatory gated execution — do not skip approval
Before any UI implementation, follow [UI_IMPLEMENTATION_RUNBOOK.md](UI_IMPLEMENTATION_RUNBOOK.md). The runbook is the execution authority for the user-provided Option 7 reference. Work on one numbered stage at a time. For each stage: set acceptance criteria first; implement only that stage; build; capture genuine running-app screenshots at desktop and phone sizes and compare each visual criterion; test affected interactions; fix same-stage failures; commit; report evidence. **Then STOP and wait for the user's explicit approval before starting the next stage.** Never combine multiple stages, claim visual match based only on source/build, substitute a static mockup for a running-app screenshot, or claim tests that were not performed. If screenshots cannot be produced, state the blocker and pause.
