// Browser audit for the Home screen (UI_UX_GUIDELINES.md / UI_IMPLEMENTATION_RUNBOOK.md Stage 1).
//
// Usage:
//   npm run build && npx vite preview --port 4173 --strictPort &
//   CHROME_PATH=/path/to/chrome [PUPPETEER_CORE_ENTRY=/path/to/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js] node tests/ui/home-audit.mjs
// Requires a Chromium binary and the `puppeteer-core` package available to Node. It is
// intentionally NOT listed in package.json, because UI_UX_GUIDELINES.md bans new
// dependencies for visual-only changes. Exits non-zero if any check fails.

const BASE = process.env.BASE_URL || 'http://localhost:4173/';
const CHROME = process.env.CHROME_PATH;
const { pathToFileURL } = await import('node:url');
let puppeteer;
try { puppeteer = (await import(process.env.PUPPETEER_CORE_ENTRY ? pathToFileURL(process.env.PUPPETEER_CORE_ENTRY).href : 'puppeteer-core')).default; }
catch { console.error('Install puppeteer-core, or set PUPPETEER_CORE_ENTRY to its ESM entry file (see header).'); process.exit(2); }
if (!CHROME) { console.error('Set CHROME_PATH to a Chromium binary.'); process.exit(2); }

const failures = [];
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); if (!ok) failures.push(name); };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const errors = [];

for (const [w, h] of [[320, 640], [360, 740], [390, 844], [768, 1024], [1440, 1000]]) {
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push(`${w}px: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`${w}px console: ${m.text()}`); });
  await page.setViewport({ width: w, height: h });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  const r = await page.evaluate(() => {
    const controls = [...document.querySelectorAll('button, a[href]')].filter(b => b.offsetParent !== null);
    return {
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      unnamed: controls.filter(b => !(b.getAttribute('aria-label') || b.textContent.trim() || b.title)).length,
      under44: controls.filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); }).map(b => (b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 30)),
    };
  });
  check(`${w}px: no horizontal overflow`, !r.overflow);
  check(`${w}px: all controls have accessible names`, r.unnamed === 0, `${r.unnamed} unnamed`);
  check(`${w}px: controls at least 44x44px`, r.under44.length === 0, r.under44.join(', ') || 'none under');
  await page.close();
}

const kp = await browser.newPage();
await kp.setViewport({ width: 390, height: 844 });
await kp.goto(BASE, { waitUntil: 'networkidle0' });
await kp.keyboard.press('Tab');
const focus = await kp.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0; });
check('keyboard focus is visible', focus);

const rm = await browser.newPage();
await rm.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await rm.setViewport({ width: 390, height: 844 });
await rm.goto(BASE, { waitUntil: 'networkidle0' });
const anim = await rm.evaluate(() => { const t = document.querySelector('.editorial-tool'); return t ? getComputedStyle(t).animationName : 'none'; });
check('reduced motion disables card entrance animation', anim === 'none', `animation-name: ${anim}`);

const home = await browser.newPage();
await home.setViewport({ width: 390, height: 844 });
await home.goto(BASE, { waitUntil: 'networkidle0' });
const six = await home.evaluate(() => [...document.querySelectorAll('#tool-grid .editorial-tool:not([hidden])')].map(b => b.querySelector('b')?.textContent.trim()));
check('six Popular Tools cards in contract order', JSON.stringify(six) === JSON.stringify(['Image to PDF', 'PDF to Image', 'Compress', 'Resize', 'Convert', 'More Tools']), six.join(' | '));
await home.click('[data-hero-slide="2"]');
const hero = await home.evaluate(() => document.querySelector('#home-hero-title').textContent);
check('page indicator changes hero text', hero === 'Make every image lighter.', hero);

check('no page errors or console errors', errors.length === 0, errors.join('; ') || 'none');
await browser.close();
console.log(failures.length ? `\n${failures.length} check(s) failed.` : '\nAll checks passed.');
process.exit(failures.length ? 1 : 0);
