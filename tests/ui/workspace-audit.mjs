// Browser audit for tool workspaces (UI_IMPLEMENTATION_RUNBOOK.md Stage 4).
// Uploads a generated PNG, runs the representative image, PDF and OCR tools, and checks
// that processing produces a downloaded file. Same requirements as home-audit.mjs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
const BASE = process.env.BASE_URL || 'http://localhost:4173/';
const CHROME = process.env.CHROME_PATH;
const { pathToFileURL } = await import('node:url');
let puppeteer;
try { puppeteer = (await import(process.env.PUPPETEER_CORE_ENTRY ? pathToFileURL(process.env.PUPPETEER_CORE_ENTRY).href : 'puppeteer-core')).default; }
catch { console.error('Install puppeteer-core, or set PUPPETEER_CORE_ENTRY (see home-audit.mjs).'); process.exit(2); }
if (!CHROME) { console.error('Set CHROME_PATH to a Chromium binary.'); process.exit(2); }

// Generate a valid 64x48 RGB PNG in a temp directory (no binary fixtures in the repo).
function makePng(file, w = 64, h = 48) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = (x * 4) & 255; raw[o + 1] = (y * 5) & 255; raw[o + 2] = 160; }
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'imagemate-ui-'));
const sample = path.join(work, 'sample.png');
const downloads = path.join(work, 'downloads');
fs.mkdirSync(downloads);
makePng(sample);

const failures = [];
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); if (!ok) failures.push(name); };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });

async function runTool(tool, label) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewport({ width: 390, height: 844 });
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads, eventsEnabled: false }).catch(() => {});
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.evaluate(t => document.querySelector(`[data-tool="${t}"]`).click(), tool);
  await new Promise(r => setTimeout(r, 500));
  const before = new Set(fs.readdirSync(downloads));
  const input = await page.$('#file');
  check(`${label}: upload control present`, !!input);
  await input.uploadFile(sample);
  await new Promise(r => setTimeout(r, 800));
  const queued = await page.evaluate(() => document.querySelector('#queue')?.textContent.trim().length > 0 || document.querySelectorAll('#queue > *').length > 0);
  check(`${label}: uploaded file appears in queue`, queued);
  const procBtn = await page.$('#process');
  check(`${label}: process button enabled`, !!procBtn && !(await procBtn.evaluate(b => b.disabled)));
  if (procBtn) await procBtn.click();
  if (tool === 'ocr') {
    // OCR returns text in #ocr-output (not a file). The engine downloads from a CDN on first use,
    // so offline it must fail with a clear message instead of hanging.
    const dialogs = [];
    page.on('dialog', async d => { dialogs.push(d.message()); await d.dismiss(); });
    for (let i = 0; i < 90; i++) {
      await new Promise(r => setTimeout(r, 500));
      const text = await page.evaluate(() => document.querySelector('#ocr-output')?.textContent.trim() || '');
      if (text.length > 0 || dialogs.length > 0) break;
    }
    const text = await page.evaluate(() => document.querySelector('#ocr-output')?.textContent.trim() || '');
    if (text) check(`${label}: returns extracted text`, true, text.slice(0, 40));
    else check(`${label}: fails with a clear message, not a hang`, dialogs.some(m => /OCR engine could not load/.test(m)), dialogs[0] || 'no message');
    check(`${label}: no unhandled page errors besides the blocked engine load`, errors.every(e => /importScripts|NetworkError/.test(e)), errors.slice(0, 2).join('; ') || 'none');
    await page.close();
    return;
  }
  let produced = [];
  for (let i = 0; i < 60 && produced.length === 0; i++) {
    await new Promise(r => setTimeout(r, 500));
    produced = fs.readdirSync(downloads).filter(f => !before.has(f) && !f.endsWith('.crdownload'));
  }
  check(`${label}: processing produced a download`, produced.length > 0, produced.join(', ') || 'none');
  if (produced.length) check(`${label}: download is non-empty`, fs.statSync(path.join(downloads, produced[0])).size > 0);
  check(`${label}: no page errors`, errors.length === 0, errors.slice(0, 2).join('; ') || 'none');
  await page.close();
}

await runTool('compress', 'Compress (image)');
await runTool('pdf', 'Image to PDF');
await runTool('ocr', 'OCR text');

await browser.close();
fs.rmSync(work, { recursive: true, force: true });
console.log(failures.length ? `\n${failures.length} check(s) failed.` : '\nAll checks passed.');
process.exit(failures.length ? 1 : 0);
