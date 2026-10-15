---
name: imagemate-visual-parity-review
description: Review the running ImageMate UI against the supplied design reference using genuine screenshots and explicit visual pass/fail criteria.
---

# ImageMate visual parity review skill

## Before comparing
- Read `UI_IMPLEMENTATION_RUNBOOK.md` and the current stage's acceptance criteria.
- Confirm the tested commit SHA matches the source you inspected and the screenshots were captured from its built/running app.
- Never use a hand-made mockup, design board, placeholder or old screenshot as evidence of the running app.

## Capture matrix
Capture a real app screenshot at:
- Phone: 390×844 light theme.
- Phone: 390×844 dark theme when shared surfaces/theme are in scope.
- Desktop: 1440×1000 light theme.
- Add 320, 360, 768px views when the stage changes responsive layout.

Save screenshots with a stage- and commit-aware path, for example `artifacts/ui-review/stage-1/<commit>/home-mobile-light.png`.

## Compare the reference
Review each visible detail and mark PASS/FAIL:
- Header logo proportions, wordmark baseline, actions and safe-area/top padding.
- Hero width/height, text hierarchy, copy, illustration placement, gradient restraint and corner radius.
- Indicators placement/shape, vertical gap to the next section, Popular Tools title, See All alignment.
- Card count, ordering, grid columns, icon colors/sizes, heights, label wrapping and bottom-nav overlap.
- Canvas/surface colors, borders, radii, shadows, typography and whitespace.
- Active navigation state, dark mode contrast and animation behavior.

## Functional evidence
Use real clicks/taps for all affected controls, capture any error/console output, and check horizontal overflow at relevant widths. For Home, test all four indicators, six cards, See All, mobile navigation and return path.

## Honest reporting
- Distinguish source inspection, build success, automated interaction tests, screenshot comparison and physical-device testing.
- If no live-browser screenshot capability exists, report the blocker and request a usable preview path or screenshot. Do not claim visual parity from reading CSS.
- Keep the current stage open when any acceptance criterion fails; fix and re-capture before requesting approval.
