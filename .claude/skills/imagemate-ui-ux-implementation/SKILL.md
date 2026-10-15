---
name: imagemate-ui-ux-implementation
description: Stage a reference-led UI redesign for ImageMate while preserving working conversion features. Use for any screen or component UI change.
---

# ImageMate UI/UX implementation skill

## Required references
1. Read the repository `AGENTS.md`, `CLAUDE.md`, and `UI_IMPLEMENTATION_RUNBOOK.md`.
2. Read the shared design rules at https://github.com/gba45684-lab/premium-ui-library/blob/main/UI_UX_RULES.md, style presets at https://github.com/gba45684-lab/premium-ui-library/blob/main/presets/STYLE_PRESETS.md, and redesign prompt at https://github.com/gba45684-lab/premium-ui-library/blob/main/prompts/REDESIGN_PROMPT.md.
3. Treat the user's uploaded ImageMate Option 7 board as the visual target. It is a design reference, never an image to embed in the running app.
4. This project is vanilla HTML/CSS/JavaScript with Capacitor. Do not add React-only libraries or new dependencies merely to achieve visual polish.

## Mandatory gated workflow
- Inspect the actual code before editing: relevant render branch in `src/main.js`, `src/style.css`, `src/design-refresh.css`, event handlers, state keys, navigation and any affected native workflow.
- Follow only the current numbered stage in `UI_IMPLEMENTATION_RUNBOOK.md`. The currently open stage is Stage 1 — Home. Do not redesign Tools, Settings or later screens without an explicit user approval gate.
- Before edits, write concrete visual and interaction acceptance criteria for the current stage.
- Make the smallest coherent change for that stage. Prefer shared tokens and scoped CSS. Do not append another pile of overrides if a nearby rule can be amended safely.
- Preserve conversion logic, IDs/listeners, localStorage keys, file save/share paths, ads, updater and Capacitor integration unless a functional change is explicitly requested.
- Use Premium Minimalism as the primary style and restrained Glassmorphism only as a supporting motif. Follow the guide palette: #F8FAFC, #10213F, #6366F1, #885CFF, #14B8A6 and #F59E0B.
- Implement working accessible controls, not a static screenshot or decorative mock UI.

## Stage completion gate
- Build and preview the real app output. Capture phone (390×844) and desktop (1440×1000) screenshots, plus dark mode when relevant.
- Compare the screenshots with the reference and record criteria as PASS/FAIL. A successful build alone does not prove visual parity.
- Test each changed interaction and check 320, 360, 390, 768 and 1440px for clipping/horizontal overflow where relevant.
- Run `npm run build` and inspect the current GitHub Actions run. For Android-affecting assets/logic, also inspect the APK workflow and validation steps.
- Report the exact commit, screenshot evidence, interaction tests, build result and any untested items.
- STOP after this stage and wait for explicit user approval before starting the next stage. Do not interpret a build pass or general request as approval to skip the gate.

## ImageMate visual contract
- Home: logo/wordmark, the exact “Tools for the paperwork of life.” headline and “Quick. Simple. Powerful.” copy, layered hero illustration, four compact indicators, title-case “Popular Tools”, See All, six cards in a 3×2 mobile grid, full-width four-item mobile navigation. No extra Home search/count/category clutter.
- Tools and Settings remain separate screens, and are out of scope until Home is approved.
