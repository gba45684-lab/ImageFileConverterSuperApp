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