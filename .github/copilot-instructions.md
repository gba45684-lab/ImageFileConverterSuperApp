# Permanent GitHub Copilot instructions — ImageMate

These instructions apply to future development and redesign tasks in this repository. They complement `AGENTS.md`, `CLAUDE.md`, `UI_UX_GUIDELINES.md`, and `UI_IMPLEMENTATION_RUNBOOK.md`. If instructions conflict, preserve user-approved product behavior and follow the runbook's stage/approval gates.

## Always use the repo's design and agentic skill system

Before UI, UX, frontend, mobile, Android, or design-system work:
1. Read `AGENTS.md`, `CLAUDE.md`, `UI_UX_GUIDELINES.md`, and the current section of `UI_IMPLEMENTATION_RUNBOOK.md`.
2. Consult the shared open-source design system at https://github.com/gba45684-lab/premium-ui-library, especially `UI_UX_RULES.md`, `presets/STYLE_PRESETS.md`, `presets/OPEN_SOURCE_RESOURCES.md`, and the redesign prompt.
3. Invoke/use the applicable repo-local skill instructions:
   - `.agents/skills/imagemate-ui-ux-implementation/SKILL.md`
   - `.agents/skills/imagemate-visual-parity-review/SKILL.md`
   - `.agents/skills/imagemate-responsive-accessibility/SKILL.md`
   - `.agents/skills/imagemate-ui-regression-gate/SKILL.md`
   Claude Code mirrored copies under `.claude/skills/` must remain identical.
4. Check the shared library and official upstreams for useful free/open-source skills or components. Verify licenses, framework compatibility, security, maintenance, and dependencies before adopting them. Do not add React-only libraries to this vanilla JavaScript/Vite/Capacitor app.
5. Prefer Premium Minimalism with restrained Glassmorphism and the approved ImageMate Option 7 tokens. Keep the app's design coherent across Home, Tools, Settings, all utility workspaces, results, Downloads, dialogs, and responsive states.

## Permanent preservation rules

- Inspect current markup, CSS, handlers, state, localStorage keys, navigation, file processing, ads, updater, Capacitor/native bridge, Android workflow, and release behavior before editing.
- Preserve all working features and local-first processing. No unapproved uploads, analytics, permissions, framework migration, dependency additions, or business-logic changes for visual-only tasks.
- Keep controls functional and accessible: semantic names, keyboard focus, touch targets, contrast, reduced motion, loading/empty/error/success/disabled states, and responsive layouts.
- Do not use screenshots or static mockups as the live application UI.
- Make small, reversible changes. Never overwrite unrelated work or remove existing functionality to simplify a redesign.

## Mandatory step-by-step UI/UX process

- Follow the numbered stages in `UI_IMPLEMENTATION_RUNBOOK.md` exactly.
- Define acceptance criteria before each stage; implement only that stage.
- Build and inspect the real running app. Compare genuine screenshots at phone and desktop sizes; test light/dark themes and relevant interactions.
- Check responsive widths 320, 360, 390, 768, and 1440px where relevant.
- Run `npm run build`, review the relevant GitHub Actions web build, and validate the Android workflow when native files, dependencies, icons, updater, or Capacitor behavior are affected.
- Record commit SHA, screenshot evidence, functional test results, build/workflow links, failures, and untested limitations honestly.
- After completing a stage, STOP and wait for the user's explicit approval before starting the next stage. A general redesign request is not permission to skip individual approval gates.
- Never claim pixel-perfect parity, successful tests, a verified APK, or physical-device testing without evidence.

## App-specific design source of truth

Use the ImageMate Option 7 brand guide and current repository documentation. Keep the existing app architecture: HTML, CSS, modern JavaScript ES modules, Vite, and Capacitor. Preserve the iM mark, wordmark, semantic color tokens, native launcher icon parity, updater compatibility, and current file-conversion workflows. Update this file only when the user-approved development policy changes.
