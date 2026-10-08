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
