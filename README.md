# ImageMate — Image & File Converter SuperApp

A privacy-first image and file utility app for local browser processing, PWA use and Android/Capacitor packaging.

## Current build
- JPG / PNG / WebP / AVIF conversion where browser support exists
- Image compression and target-size compression (20 / 50 / 100 / 200 KB)
- Resize, passport / ID photo sizing and signature preparation
- Image → PDF and PDF → image workflows
- PDF merge, metadata cleaning and simple background removal
- Crop / rotate and basic photo editor
- Local OCR with Tesseract.js
- Batch ZIP export where supported
- Downloaded-file library with Android open, share and export actions
- Responsive Editorial UI with persistent dark mode
- Capacitor Android APK with background updater and user-approved installation

## Run
```
npm install
npm run dev
```

## Build
```
npm run build
```

## Android release
GitHub Actions builds the debug APK, verifies it, uploads an artifact and publishes `ImageMate.apk` to the versioned GitHub Release.

## Privacy
Core file processing is performed locally. ImageMate does not need to upload the selected source files to a server for the supported browser workflows.


## UI/UX agentic skills (repo-local)
ImageMate ships reusable UI/UX skills for compatible coding agents:
- `.agents/skills/imagemate-ui-ux-implementation/SKILL.md` — inspect and implement one reference-led stage at a time.
- `.agents/skills/imagemate-visual-parity-review/SKILL.md` — compare genuine built-app screenshots with the reference.
- `.agents/skills/imagemate-responsive-accessibility/SKILL.md` — viewport, keyboard, touch, contrast, focus and reduced-motion checks.
- `.agents/skills/imagemate-ui-regression-gate/SKILL.md` — build, interaction and Android release verification before stage completion.
Matching copies live under `.claude/skills/` for Claude Code. Keep both copies in sync. These are instructions invoked by a compatible coding agent; they do not independently launch an AI agent. The CI skill-pack workflow checks file parity only.
