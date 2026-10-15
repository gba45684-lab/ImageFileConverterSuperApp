# ImageMate UI implementation — gated execution runbook

**Source of truth:** the user-provided “ImageMate Option 7 UI Brand Guide” image. Treat it as the target composition and component specification, not inspiration to drift away from. Reproduce its brand, layout, spacing, hierarchy and motion as closely as the existing app architecture allows. Do not embed the board or its phone mockups as the actual app UI.

## Mandatory execution protocol — do not batch stages

Work in one numbered stage at a time. Never start a later stage in the same run, same PR, or same commit as the current stage.

For each stage:
1. Re-read this runbook, `AGENTS.md`, `CLAUDE.md`, the shared design rules, and only the relevant application code.
2. Write down the precise visual acceptance criteria for the stage before editing.
3. Make the smallest coherent change scoped to that stage. Preserve all working feature code and existing IDs/handlers except for explicitly reviewed navigation changes.
4. Build the app and preview the **running app output**, not an imagined mockup. Capture desktop 1440×1000 and mobile 390×844 at minimum; test dark mode too when stage changes shared surfaces. Use a genuine browser screenshot/capture if available. Screenshots must show the current commit. Do not claim pixel/visual confirmation based only on CSS inspection or a successful build.
5. Compare screenshots against the supplied guide. Review proportions, hierarchy, card placement, icon size, line breaks, colors, controls, active state, edges and clipping. Record each criterion as PASS or FAIL.
6. Test every control and route affected by this stage. Check browser errors and horizontal overflow at 320, 360, 390, 768 and 1440px where relevant.
7. Run `npm run build`; review the GitHub Actions build. If the app/Android layer or shared launcher assets are affected, wait for the Android workflow and its validation tests too. Fix every failure inside the current stage.
8. Commit the stage with an explicit stage number in the commit message. Report the commit, screenshots, visual comparison, functional tests, build result and known limitations.
9. **STOP and wait for the user's explicit approval** (for example, “approve Step 1”) before editing the next stage. A successful build is not visual approval. If the screenshot does not match, keep working on the same stage and do not ask to proceed.

If an actual screenshot of the running app cannot be produced, say so plainly. Do not substitute a static approximation and label it verified. Pause and ask for the missing visual verification path or a user-provided screenshot.

## Visual contract — exact details to match

### Brand and palette
- iM mark: deep navy `#10213F`, one amber dot `#FFB32C`; ImageMate wordmark and tagline aligned consistently.
- Main canvas `#F8FAFC`; indigo `#6366F1`; purple `#885CFF`; teal `#14B8A6`; amber `#F59E0B`.
- Use Poppins-like hierarchy only if legally/technically available; never silently fetch a remote font. Existing system fonts are the fallback. Bold, compact headings; readable muted body text.
- Bright screens: soft white cards, fine cool-gray borders and low soft shadows. Hero-only pastel blue/lavender/peach gradient. Dark mode maps the same tokens to deep navy surfaces and accessible accent shades.
- Lucide outline icons in consistent colored rounded-square tiles; no emoji icons. Consistent spacing, card radius, button height, input radius, active state and shadow language across all screens.
- Motion is short and purposeful: 180–300 ms hover/press/fade/slide; no continuous animation. Respect `prefers-reduced-motion`.

### Home reference
- Compact top bar: iM + ImageMate wordmark on the left; navigation/actions on the right on desktop and tight icon controls on mobile.
- Large rounded hero card with the exact headline “Tools for the paperwork of life.”, brief “Quick. Simple. Powerful.” supporting copy, pastel gradients, layered image-card illustration and four small page indicators.
- Four small page indicators immediately below the hero, then the title-case “Popular Tools” heading and “See All”. Do not add a LOCAL-FIRST divider, extra tool-count label, or search field on Home; search belongs on the distinct Tools screen.
- Six initial tool cards in a two-column × three-row phone grid: Image to PDF, PDF to Image, Compress, Resize, Convert and More Tools. Use compact, colorful icon tiles and short labels without category/description clutter on mobile; preserve fuller helper descriptions on wider layouts. All six cards must be visible without clipping or overlapping the bottom bar.
- Four-item mobile bottom bar: Home, Tools, Files, Settings. Only Home is active on Home. See All opens the distinct Tools screen. Page indicators must have a real, accessible state change if they look interactive. Search is tested on the Tools screen, not on Home.

### Tools reference
- Its own screen, not a renamed Home. A compact header/back path, All/Image/Document/Other category chips and a search field.
- The list uses rounded white rows with consistent colored icons, a name, small description and right chevron. Include every existing utility (currently 14).
- Category and search filters combine and have a meaningful empty state. Tapping a row opens the original dedicated tool workflow. Back returns to the correct origin.

### Settings reference
- Its own screen with the same outer background, spacing, rounded-card grammar and typography as Home and Tools.
- Brand/banner card at the top with iM mark, “ImageMate” and “Simple. Powerful. Yours.”
- Cards for Processing Defaults (format and quality), Appearance, Automatic Updates, Check for Updates, File Library and About/version. Match the reference's icon tiles, alignment, controls and secondary actions.
- Current format/quality values remain correct and persistent. Theme, update toggle, manual check and File Library controls are wired to real existing handlers; no decorative/nonfunctional controls.

### Other app surfaces
- Every dedicated tool keeps its existing logic while using the same tokens/components: title/back header, drop zone, upload button, options, queued files, action bar, progress, error/success results and downloads.
- File Library rows, open/share/save actions, OCR/PDF output, update dialogs, loading/empty/error states and footer must fit the same component system.
- Desktop uses a balanced two-column/catalog layout where appropriate. Phone layouts collapse cleanly and use the four-item bottom bar. Avoid horizontal scrolling except intentionally scrollable category tabs/nav.

## Numbered stages and acceptance gate

### Stage 0 — Audit, baseline and test harness (read-only)
Inventory screens, event handlers, localStorage keys, updater and native bridge behavior. Capture current app output for desktop/mobile, light/dark and record baseline build status. No feature UI changes during this stage.
**Exit:** baseline evidence and test limitations documented.

### Stage 1 — Home screen (this must be completed and approved first)
Match only Home's logo/header, hero headline and supporting copy, layered illustration, four page indicators, title-case Popular Tools header, three-column × two-row six-card grid, distinct icon colors, full-width mobile bottom bar and Home active state. Remove the extra hero kicker, LOCAL-FIRST divider, six-tools count, Home search field and mobile card subtitles/category labels that are absent from the supplied phone reference; search belongs to Tools. Keep the Tools and Settings screen contents out of this stage except for required navigation wiring. Verify carousel/page-indicator actions, each popular card, See All and mobile Home nav. Search is owned by the Tools stage.
**Exit:** screenshots and all Home visual criteria pass; web build passes; user explicitly approves Step 1.

### Stage 2 — Tools catalog
Match the separate All Tools screen: page header, category chips, search, list-row rhythm, icon tiles, descriptions, active filter and empty state. Test all 14 rows, combined filter/search, selection and Back to Home/previous catalog origin.
**Exit:** screenshots at phone/desktop and light/dark pass; all filter/navigation checks pass; web build passes; user approval.

### Stage 3 — Settings
Match the identity banner and six reference setting components, including control placement, typography, surfaces, icon tiles and switches. Test format/quality persistence, light/dark toggle persistence, automatic update preference, manual update checks, File Library and version text.
**Exit:** phone/desktop light/dark screenshots pass; all controls and navigation work; web build passes; user approval.

### Stage 4 — Dedicated tool workspaces (all existing tools)
Apply consistent headers, upload/drop surfaces, settings panel, file queue rows, remove/clear controls and action bar across every utility without changing processing behavior.
**Exit:** regression test upload, options, processing, errors and download for representative image, PDF and OCR tools; responsive screenshots and web build pass; user approval.

### Stage 5 — Results, Downloads and update dialogs
Align progress bars, status labels, success/error result cards, OCR text output, downloads library rows, share/open/save actions, empty state and Android update modal.
**Exit:** real output is generated and download/open/share paths remain working; visual/state screenshots and build pass; user approval.

### Stage 6 — Whole-app responsive, theme and motion pass
Audit 320/360/390/768/1440 widths, safe areas, no overlaps/clipped content/horizontal overflow, both themes, touch and keyboard focus, readable contrast, reduced-motion behavior and long strings.
**Exit:** screenshot review for all three primary screens and representative workspace passes; user approval.

### Stage 7 — Release validation and handoff
Run a fresh web build and Android APK workflow on the approved commit; check archive/manifest, package/version/signing, emulator clean install and compatible-update smoke tests, workflow artifacts and actual release asset. Do not say the APK is ready until all requested checks finish.
**Exit:** complete test matrix, current screenshot set, final commit and release links reported. No claiming physical-device testing unless it occurred.

## Stage report template

- **Stage:** N — name
- **Commit:** full SHA and link
- **Reference comparison:** screenshot links and viewport/theme; per-criterion PASS/FAIL
- **Interaction regression:** controls/routes tested and result
- **Build:** exact run URL and success/failure/pending
- **Visual issues left:** list, or “none found in tested states”
- **Gate:** “Waiting for explicit user approval to start Stage N+1.” 
