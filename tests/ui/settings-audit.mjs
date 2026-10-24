// Browser audit for the Settings screen (UI_IMPLEMENTATION_RUNBOOK.md Stage 3).
// Requirements and env vars are the same as tests/ui/home-audit.mjs.
const BASE = process.env.BASE_URL || 'http://localhost:4173/';
const CHROME = process.env.CHROME_PATH;
const { pathToFileURL } = await import('node:url');
let puppeteer;
try { puppeteer = (await import(process.env.PUPPETEER_CORE_ENTRY ? pathToFileURL(process.env.PUPPETEER_CORE_ENTRY).href : 'puppeteer-core')).default; }
catch { console.error('Install puppeteer-core, or set PUPPETEER_CORE_ENTRY (see home-audit.mjs).'); process.exit(2); }
if (!CHROME) { console.error('Set CHROME_PATH to a Chromium binary.'); process.exit(2); }

const failures = [];
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); if (!ok) failures.push(name); };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const errors = [];
const open = async (page, tab) => { await page.evaluate(t => document.querySelector(`.mobile-bottom-nav [data-mobile-tab="${t}"]`).click(), tab); await new Promise(r => setTimeout(r, 400)); };
const storage = (page, key) => page.evaluate(k => localStorage.getItem(k), key);

// Fresh profile: quality default must be 88%, not the 10% minimum (regression for Number(null) bug).
const fresh = await browser.newPage();
fresh.on('pageerror', e => errors.push(e.message));
await fresh.setViewport({ width: 390, height: 844 });
await fresh.goto(BASE, { waitUntil: 'networkidle0' });
await open(fresh, 'settings');
const defaultQ = await fresh.evaluate(() => document.querySelector('#default-quality').value);
check('new install defaults to 88% quality', defaultQ === '88', `slider=${defaultQ}`);

// Format and quality persist across reload.
await fresh.select('#default-format', 'image/jpeg');
await fresh.evaluate(() => { const q = document.querySelector('#default-quality'); q.value = '60'; q.dispatchEvent(new Event('input')); });
await fresh.reload({ waitUntil: 'networkidle0' });
await open(fresh, 'settings');
const fmt = await fresh.evaluate(() => document.querySelector('#default-format').value);
const qv = await fresh.evaluate(() => document.querySelector('#default-quality').value);
check('format persists after reload', fmt === 'image/jpeg', fmt);
check('quality persists after reload', qv === '60', qv);
check('quality shows live percentage', await fresh.evaluate(() => document.querySelector('#default-quality-value')?.textContent.trim()) === '60%');

// Appearance toggle persists and reflects state.
await fresh.evaluate(() => document.querySelector('[aria-label="Enable dark appearance"]').click());
await new Promise(r => setTimeout(r, 200));
check('appearance toggle stores dark choice', await storage(fresh, 'imagemate-dark') === '1');
await fresh.reload({ waitUntil: 'networkidle0' });
const isDark = await fresh.evaluate(() => document.documentElement.classList.contains('dark') || document.body.classList.contains('dark') || !!document.querySelector('.dark'));
check('dark appearance persists after reload', isDark);

// Automatic updates toggle: state is communicated and stored.
await open(fresh, 'settings');
const autoBefore = await fresh.evaluate(() => document.querySelector('[aria-label="Enable automatic update checks"]').checked);
await fresh.evaluate(() => document.querySelector('[aria-label="Enable automatic update checks"]').click());
await new Promise(r => setTimeout(r, 200));
const autoAfter = await fresh.evaluate(() => document.querySelector('[aria-label="Enable automatic update checks"]').checked);
check('automatic updates toggle changes state', autoBefore !== autoAfter, `${autoBefore} → ${autoAfter}`);
check('automatic updates preference is stored to match the toggle', (await storage(fresh, 'imagemate-auto-update')) === (autoAfter ? '1' : '0'));

// Navigation: Settings → File library → Back, and Home → Settings → Back.
await fresh.evaluate(() => document.querySelector('#open-downloads').click());
await new Promise(r => setTimeout(r, 400));
const onFiles = await fresh.evaluate(() => /Downloaded files/i.test(document.querySelector('h1')?.textContent || ''));
check('Open files opens the file library', onFiles, await fresh.evaluate(() => document.querySelector('h1')?.textContent));
await open(fresh, 'settings');
await fresh.evaluate(() => document.querySelector('#back-settings').click());
await new Promise(r => setTimeout(r, 400));
const backToTools = await fresh.evaluate(() => !!document.querySelector('.tools-catalog') || !!document.querySelector('.editorial-home'));
check('Back from Settings returns to a catalog or Home', backToTools);

check('no page errors', errors.length === 0, errors.join('; ') || 'none');
await browser.close();
console.log(failures.length ? `\n${failures.length} check(s) failed.` : '\nAll checks passed.');
process.exit(failures.length ? 1 : 0);
