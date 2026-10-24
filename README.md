# ImageMate — PDF & Image Workspace

A privacy-first PDF, image and document utility app for local browser processing, PWA use and Android/Capacitor packaging.

## Current build
- JPG / PNG / WebP / AVIF conversion where browser support exists
- Image compression and target-size compression (20 / 50 / 100 / 200 KB)
- Resize, passport / ID photo sizing and signature preparation
- Image → PDF and PDF → image workflows
- PDF merge and alternate/mix with PDF structure preserved
- PDF page organization, extraction, split by page count/bookmarks/half/approximate size/text, and page deletion
- PDF lossless compression, watermarks, text overlay, typed-signature stamp, flattening, and password protect/unlock
- Interactive PDF form-field creation
- PDF → text, DOCX, XLSX and slide-image PPTX exports; HTML and DOCX → PDF
- Metadata cleaning and simple background removal
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

## Advertising setup

- **Android development:** the app uses Google's published AdMob test app/banner/interstitial IDs. These show test creatives only and do not earn revenue. The Android workflow adds the test App ID to the generated manifest.
- **Website preview:** when no AdSense IDs are configured, ImageMate shows a clearly labelled layout preview, not a live Google ad.
- **Website live ads:** obtain an approved AdSense publisher ID and create a responsive display ad unit. In the Vercel project, set these Production environment variables, then redeploy:
  - `VITE_ADSENSE_CLIENT` — your publisher ID, in the format `ca-pub-XXXXXXXXXXXXXXXX`
  - `VITE_ADSENSE_SLOT` — the numeric ad-unit/slot ID
- AdSense must approve the website and serve the ad unit before real ads can appear. Never click your own ads. Do not replace these values with invented IDs; they cannot serve real ads or earn revenue.
- Before an Android production release, create a real AdMob app and ad units, configure the matching App ID/ad-unit IDs, and implement the consent flow required for your audience and regions.

## PDF conversion notes

The expanded PDF tools run locally using PDF.js, jsPDF, JSZip and the qpdf WebAssembly engine (pdfstudio). ImageMate does not upload PDFs or passwords to a conversion server.

- PDF merge, page operations, password encryption/removal, lossless compression and flattening use the local PDF engine.
- PDF-to-Word exports extracted text to DOCX, PDF-to-Excel reconstructs rows from text positions, and PDF-to-PowerPoint places each page as a slide image. These are conversion aids, not exact layout reconstruction; PowerPoint pages are not individually editable.
- HTML-to-PDF and Word-to-PDF currently convert document text and paragraphs. They do not reproduce all CSS, embedded media, tables or advanced Word layout.
- The Edit and Fill & Sign tools add visible text or a typed signature/date stamp. They do not modify existing PDF text or create a certificate-based digital signature.
- Split-by-size uses approximate page sizes and cannot guarantee every result will be below the target for complex PDFs.
- Password tools require the correct password. ImageMate cannot recover forgotten passwords.

## Workflow-based tool organization

The All Tools screen groups the 37 utilities by the job users are trying to complete:

- **PDF essentials:** image-to-PDF, PDF-to-image, merge and alternate/mix.
- **Organize & split:** reorder, extract/delete pages, split by count, bookmarks, half, approximate size or text.
- **Edit & sign:** add text, typed signature/date stamp, watermark and new fillable forms.
- **Security & optimize:** password protect/unlock, lossless compression and flattening.
- **PDF conversion:** PDF-to-Excel, PDF-to-PowerPoint, PDF-to-Word, HTML-to-PDF and Word-to-PDF.
- **Text & OCR:** extract selectable PDF text and recognize text in images.
- **Image tools:** convert, compress, resize, target size, ID photos, metadata, signatures, crop, background removal and photo editing.

Categories can be filtered directly and the search indexes task aliases (for example, “join” finds Merge PDFs, “password” finds Protect/Unlock, and “pages” finds page-management tools).

## Open-source PDF stack and design references

ImageMate uses established open-source libraries selected for each task instead of copying a server-based application into a mobile web app:

- [Mozilla PDF.js](https://github.com/mozilla/pdf.js) using the pdfjs-dist package — PDF page rendering, preview, page text extraction and text-position reading.
- [pdfstudio](https://github.com/fayazara/pdfstudio) — qpdf compiled to WebAssembly for PDF-aware merge, collate, split/extract, page deletion, password encryption/decryption, compression, watermarking and flattening. These operations preserve PDF structure rather than rasterizing source pages.
- [jsPDF](https://github.com/parallax/jsPDF) — create new PDFs, form-field documents and text-overlay assets.
- [JSZip](https://github.com/Stuk/jszip) — package multi-output operations into one ZIP download.
- [Tesseract.js](https://github.com/naptha/tesseract.js) — on-device OCR workflow.
- [Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) — open-source product feature reference for grouping common PDF tasks; its server and desktop architecture is not copied into the client-only workflow.

Existing dependencies are reused to keep the app smaller and avoid adding overlapping PDF engines unnecessarily. Review each dependency's upstream licence and notices before distributing modified builds. ImageMate keeps its own UI and branding.