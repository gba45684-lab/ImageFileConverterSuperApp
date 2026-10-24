// Browser audit for the Tools catalog (UI_IMPLEMENTATION_RUNBOOK.md Stage 2).
// Usage and requirements are the same as tests/ui/home-audit.mjs.
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
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({ width: 390, height: 844 });
await page.goto(BASE, { waitUntil: 'networkidle0' });
const openTools = async () => { await page.evaluate(() => document.querySelector('.mobile-bottom-nav [data-mobile-tab="tools"]').click()); await new Promise(r => setTimeout(r, 400)); };
const visibleRows = () => page.evaluate(() => [...document.querySelectorAll('.catalog-tool-row')].filter(b => !b.hidden).length);
const chip = c => page.evaluate(c => document.querySelector(`[data-tool-category="${c}"]`).click(), c);
const search = q => page.evaluate(q => { const i = document.querySelector('#catalog-search'); i.value = q; i.dispatchEvent(new Event('input')); }, q);

await openTools();
const chips = await page.evaluate(() => [...document.querySelectorAll('[data-tool-category]')].map(b => b.textContent.trim()));
check('chips are All / Image / Document / Other', JSON.stringify(chips) === JSON.stringify(['All', 'Image', 'Document', 'Other']), chips.join(' / '));
const total = await page.evaluate(() => document.querySelectorAll('.catalog-tool-row').length);
const counts = {};
for (const c of ['All', 'image', 'document', 'other']) { await chip(c); counts[c] = await visibleRows(); }
check('All shows every tool row', counts.All === total, `${counts.All} of ${total}`);
check('category counts add up to total', counts.image + counts.document + counts.other === total, JSON.stringify(counts));
await chip('image'); await search('pdf');
check('category and search combine', await visibleRows() === 0, `Image + "pdf" → ${await visibleRows()} rows`);
const emptyShown = await page.evaluate(() => !document.querySelector('#catalog-empty').hidden);
check('empty state shown when no match', emptyShown);
await search(''); await chip('All');
const rowTool = await page.evaluate(() => document.querySelector('.catalog-tool-row:not([hidden])').dataset.tool);
await page.evaluate(() => document.querySelector('.catalog-tool-row:not([hidden])').click());
await new Promise(r => setTimeout(r, 400));
const opened = await page.evaluate(() => document.querySelector('h1, h2')?.textContent || '');
check('tapping a row opens its tool', opened.length > 0 && !/PDF & image tools/.test(opened), `${rowTool} → "${opened.slice(0, 40)}"`);
check('no page errors or console errors', errors.length === 0, errors.join('; ') || 'none');
await browser.close();
console.log(failures.length ? `\n${failures.length} check(s) failed.` : '\nAll checks passed.');
process.exit(failures.length ? 1 : 0);
