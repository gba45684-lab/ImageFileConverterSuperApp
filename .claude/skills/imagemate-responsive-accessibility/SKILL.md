---
name: imagemate-responsive-accessibility
description: Audit responsive layouts, semantics, keyboard/touch operation, contrast, focus indicators and reduced motion for ImageMate UI changes.
---

# ImageMate responsive and accessibility skill

## Audit scope
Review only the current approved UI stage. Check `src/main.js`, `src/style.css` and `src/design-refresh.css`; identify actual controls and existing behavior before making changes.

## Responsive checks
- Test 320, 360, 390, 768 and 1440px wide viewports where relevant.
- Verify no unintentional horizontal scroll, clipped labels, overlap with bottom navigation, controls outside cards, or cut-off modal content.
- Use responsive Grid/Flex patterns, `minmax(0,1fr)`, `min-width:0`, safe wrapping and content-driven heights.
- Respect Android safe areas and provide comfortable touch targets. Avoid hover-only affordances on touch screens.

## Accessible interactions
- Every interactive control needs a descriptive accessible name and the correct semantic element.
- Check keyboard operation, visible focus, pressed/selected states, disabled/loading states and meaningful empty/error/success messaging.
- Maintain sufficient text/interactive contrast in light and dark themes. Never use color alone as status.
- Respect `prefers-reduced-motion: reduce`; avoid infinite logo or component animations.
- Ensure range inputs expose their current values and toggles expose checked state.

## Preservation
Do not delete handlers, change conversion logic, alter privacy claims, introduce remote processing, or add permissions just for the UI audit. Preserve all current feature flows.

## Output
Report viewport-by-viewport checks and each accessibility finding as PASS/FAIL, including any items not testable with the available browser/device tooling. Fix only issues in the current gated stage and rerun its checks.
