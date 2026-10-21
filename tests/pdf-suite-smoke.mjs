import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

const baseUrl = process.env.IMAGEMATE_BASE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
page.setDefaultTimeout(30000);
const dialogs = [];
let lastDownloadedBytes = null;
page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
page.on('pageerror', error => { throw error; });

function makePdf(texts = ['ALPHA MATCH', 'BETA OTHER', 'GAMMA OTHER'], withBookmarks = false) {
  const doc = new jsPDF({ unit: 'pt', format: [300, 220] });
  texts.forEach((text, index) => {
    if (index) doc.addPage();
    doc.setFontSize(22);
    doc.text(text, 24, 45);
    doc.setFontSize(12);
    doc.text('ImageMate PDF-suite test page ' + (index + 1), 24, 75);
  });
  if (withBookmarks && doc.outline) {
    doc.outline.add(null, 'Beginning', { pageNumber: 1 });
    doc.outline.add(null, 'Later section', { pageNumber: 2 });
  }
  return Buffer.from(doc.output('arraybuffer'));
}
function filePayload(name, mimeType, buffer) { return { name, mimeType, buffer }; }
async function buildDocx() {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>DOCX TEST CONTENT</w:t></w:r></w:p><w:sectPr/></w:body></w:document>');
  return zip.generateAsync({ type: 'nodebuffer' });
}
async function openTool(id) {
  if (await page.locator('.catalog-tool-row').count() !== 37) {
    await page.locator('#tools-btn').click();
    await page.locator('.catalog-tool-row').first().waitFor();
  }
  await page.locator('.catalog-tool-row[data-tool="' + id + '"]').click();
  await page.locator('#file').waitFor({ state: 'attached' });
  if (id === 'pdfforms') await page.locator('#process').waitFor({ state: 'visible' });
}
async function attachPdfs(buffers = [pdfMulti]) {
  await page.locator('#file').setInputFiles(buffers.map((buffer, index) => filePayload(index ? 'source-' + (index + 1) + '.pdf' : 'source.pdf', 'application/pdf', buffer)));
}
async function runTool(id, files, configure, expected) {
  const priorDialogCount = dialogs.length;
  await openTool(id);
  if (files === 'form') {
    // Form-builder creates a new document and does not require a source file.
  } else if (Array.isArray(files)) {
    await page.locator('#file').setInputFiles(files);
  } else {
    await page.locator('#file').setInputFiles(filePayload('source.pdf', 'application/pdf', files || pdfMulti));
  }
  if (configure) await configure();
  const before = dialogs.length;
  const downloadPromise = page.waitForEvent('download', { timeout: 90000 });
  await page.locator('#process').click();
  const download = await downloadPromise;
  await page.locator('.result-card').waitFor({ state: 'visible', timeout: 30000 });
  assert.equal(dialogs.length, before, id + ' showed an error dialog: ' + dialogs.slice(priorDialogCount).join(' | '));
  const path = await download.path();
  assert.ok(path && fs.existsSync(path), id + ' did not create a readable download');
  const bytes = fs.readFileSync(path);
  lastDownloadedBytes = bytes;
  const filename = download.suggestedFilename();
  if (expected === 'pdf') assert.ok(bytes.length > 4 && bytes.subarray(0, 4).toString() === '%PDF', id + ' output is not a PDF: ' + filename);
  else if (expected === 'zip' || expected === 'docx' || expected === 'xlsx' || expected === 'pptx') {
    const zip = await JSZip.loadAsync(bytes);
    if (expected === 'zip') assert.ok(Object.keys(zip.files).some(name => name.endsWith('.pdf')), id + ' ZIP has no PDF outputs');
    if (expected === 'docx') assert.ok(zip.file('word/document.xml'), 'DOCX output missing Word document XML');
    if (expected === 'xlsx') assert.ok(zip.file('xl/worksheets/sheet1.xml'), 'XLSX output missing worksheet XML');
    if (expected === 'pptx') assert.ok(zip.file('ppt/slides/slide1.xml'), 'PPTX output missing slide XML');
  } else if (expected === 'txt') assert.match(bytes.toString('utf8'), /ALPHA MATCH/i, 'Text output did not contain expected text');
  await page.locator('#tools-btn').click();
  await page.locator('.catalog-tool-row').first().waitFor();
  return { id, filename, bytes: bytes.length, expected };
}

const pdfMulti = makePdf(['ALPHA MATCH', 'BETA OTHER', 'GAMMA OTHER'], true);
const pdfA = makePdf(['FRONT PAGE A']);
const pdfB = makePdf(['FRONT PAGE B']);
const docxBytes = await buildDocx();
const tests = [];
let protectedBytes = null;

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.locator('#see-all-tools').click();
  assert.equal(await page.locator('.catalog-tool-row').count(), 37, 'All 37 tools should be listed');

  tests.push(await runTool('pdfalternate', [filePayload('front-a.pdf','application/pdf',pdfA), filePayload('front-b.pdf','application/pdf',pdfB)], null, 'pdf'));
  tests.push(await runTool('pdforganize', pdfMulti, async()=>page.locator('[data-pdf-opt="pageOrder"]').fill('3,1,2'), 'pdf'));
  tests.push(await runTool('pdfextract', pdfMulti, async()=>page.locator('[data-pdf-opt="pages"]').fill('1,3'), 'pdf'));
  tests.push(await runTool('pdfsplitpages', pdfMulti, async()=>page.locator('[data-pdf-opt="pagesPerFile"]').fill('1'), 'zip'));
  tests.push(await runTool('pdfsplitbookmarks', pdfMulti, null, 'zip'));
  tests.push(await runTool('pdfsplithalf', pdfMulti, null, 'zip'));
  tests.push(await runTool('pdfsplitsize', pdfMulti, async()=>page.locator('[data-pdf-opt="maxMb"]').fill('0.25'), 'pdf'));
  tests.push(await runTool('pdfsplittext', pdfMulti, async()=>page.locator('[data-pdf-opt="matchText"]').fill('ALPHA MATCH'), 'zip'));
  tests.push(await runTool('pdfedit', pdfMulti, async()=>{await page.locator('[data-pdf-opt="annotationText"]').fill('Reviewed by QA');await page.locator('[data-pdf-opt="pages"]').fill('1');}, 'pdf'));
  tests.push(await runTool('pdfsign', pdfMulti, async()=>{await page.locator('[data-pdf-opt="signatureName"]').fill('QA Signer');await page.locator('[data-pdf-opt="pages"]').fill('1');}, 'pdf'));
  tests.push(await runTool('pdfforms', 'form', async()=>page.locator('[data-pdf-opt="formLabels"]').fill('Full name,Email,Notes'), 'pdf'));
  tests.push(await runTool('pdfdelete', pdfMulti, async()=>page.locator('[data-pdf-opt="pages"]').fill('2'), 'pdf'));
  tests.push(await runTool('pdfcompress', pdfMulti, null, 'pdf'));

  tests.push(await runTool('pdfprotect', pdfMulti, async()=>{
    await page.locator('[data-pdf-opt="password"]').fill('test-password-2026');
    await page.locator('[data-pdf-opt="confirmPassword"]').fill('test-password-2026');
  }, 'pdf'));
  protectedBytes = lastDownloadedBytes;
  assert.ok(protectedBytes?.subarray(0, 4).toString() === '%PDF', 'Protected PDF should be valid PDF bytes');
  tests.push(await runTool('pdfunlock', filePayload('source-protected.pdf','application/pdf',protectedBytes), async()=>page.locator('[data-pdf-opt="password"]').fill('test-password-2026'), 'pdf'));
  tests.push(await runTool('pdfwatermark', pdfMulti, async()=>page.locator('[data-pdf-opt="watermarkText"]').fill('CONFIDENTIAL'), 'pdf'));
  tests.push(await runTool('pdfflatten', pdfMulti, null, 'pdf'));
  tests.push(await runTool('pdfexcel', pdfMulti, null, 'xlsx'));
  tests.push(await runTool('pdfppt', pdfMulti, null, 'pptx'));
  tests.push(await runTool('pdftext', pdfMulti, null, 'txt'));
  tests.push(await runTool('pdftoword', pdfMulti, null, 'docx'));
  tests.push(await runTool('htmltopdf', [filePayload('sample.html','text/html',Buffer.from('<!doctype html><title>HTML QA</title><h1>HTML conversion</h1><p>LOCAL HTML BODY</p>'))], null, 'pdf'));
  tests.push(await runTool('wordtopdf', [filePayload('sample.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',docxBytes)], null, 'pdf'));

  console.log(JSON.stringify({ passed: tests.length, total: 23, results: tests }, null, 2));
} finally {
  await browser.close();
}
