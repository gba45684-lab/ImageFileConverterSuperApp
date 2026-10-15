# ImageMate whole-app UI/UX implementation standard

This is the required checklist for every UI change in ImageMate. It supplements `AGENTS.md` and `CLAUDE.md` and follows the shared design system at https://github.com/gba45684-lab/premium-ui-library.

## Visual system
- Primary preset: **Editorial / Swiss + Premium Minimalism**.
- Supporting motif: restrained glassmorphism only where it improves hierarchy.
- Home is the visual reference: warm neutral backgrounds, readable ink/muted text, copper accent, thin borders, consistent rounded cards, quiet depth and Lucide icons.
- Reuse the existing `--im-*` design tokens in `src/design-refresh.css`. Do not introduce unrelated colors, font systems or one-off shadows for a single screen.
- Keep screens compact and purposeful: clear title, short helper copy, grouped controls, primary action and minimal decoration.
- Do not add a duplicate Appearance/Theme control to Settings; Theme remains in the global header.

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
