# ImageMate UI/UX implementation guidance

Use the shared open-source design system at https://github.com/gba45684-lab/premium-ui-library as the default reference for future interface work.

## Product and visual direction
- Build a polished, compact, privacy-first image/document utility app. Prioritize fast task completion over decorative UI.
- Current direction: warm editorial minimalism with restrained glassmorphism; use translucent surfaces only where contrast remains clear.
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
Before UI work, inspect `src/main.js`, `src/style.css`, `src/design-refresh.css`, the relevant feature module, and the shared design system. Read `https://github.com/gba45684-lab/premium-ui-library/blob/main/UI_UX_RULES.md` and `presets/STYLE_PRESETS.md`. Use **Editorial / Swiss + Premium Minimalism** as the ImageMate baseline, with restrained glass surfaces as the only supporting motif. Match every screen to Home's warm palette, card borders, typography and spacing instead of introducing a separate visual theme.

### Required steps
1. Inventory current controls, IDs, event listeners, localStorage keys, navigation paths, native bridges and feature dependencies before editing.
2. Plan the page hierarchy: header/back path, main content groups, helper copy, status feedback and footer.
3. Keep UI markup, styles and behavior separate. Prefer scoped CSS and semantic markup. Preserve IDs and handlers unless a functional change is explicitly requested.
4. Use consistent spacing/radius/type tokens; responsive Grid/Flex with `minmax(0,1fr)`, `min-width:0`, wrapping and `overflow-wrap:anywhere`. Avoid fixed text-card heights and horizontal overflow.
5. Include accessible names, visible keyboard focus, comfortable touch targets, reduced-motion support, and useful loading/empty/error/success/disabled states.
6. Check light/dark themes and 320/360/390px, tablet and desktop widths. Test long copy, both toggle states, empty libraries, failed updates and repeated back/navigation actions.
7. Verify Home → Settings → Back, Settings → File Library → Back, format/quality persistence, automatic-update on/off and manual Refresh. Do not add a duplicate Theme/Appearance setting; Theme already lives in the global header.
8. Do not add dependencies, remote assets, analytics, uploads or permissions for visual-only changes. Preserve local processing, ads, updater, Capacitor and file-saving behavior.
9. Run `npm run build`; inspect GitHub Actions web and Android builds and logs. Verify APK artifact/release asset when relevant. Never claim a physical-device test unless performed.
10. Review the final diff for accidental logic changes, dead/duplicate CSS, broken selectors, overflow, contrast and regressions before reporting.

See [UI_UX_GUIDELINES.md](UI_UX_GUIDELINES.md) for the full implementation and acceptance checklist.
