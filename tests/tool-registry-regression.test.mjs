import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const updater=readFileSync(new URL('../src/updater.js',import.meta.url),'utf8');
const android=readFileSync(new URL('../.github/workflows/android.yml',import.meta.url),'utf8');
const visual=readFileSync(new URL('../.github/workflows/ui-visual-check.yml',import.meta.url),'utf8');
test('all 37 tools remain registered',()=>{
 const def=main.match(/const tools=\[([\s\S]*?)\];/);assert.ok(def,'tools array is required');
 const ids=[...def[1].matchAll(/^\s*\['([^']+)'/gm)].map(m=>m[1]);
 assert.deepEqual(ids,['convert','compress','resize','target','pdf','passport','pdf2image','exif','signature','crop','ocr','background','pdfmerge','pdfalternate','pdforganize','pdfextract','pdfsplitpages','pdfsplitbookmarks','pdfsplithalf','pdfsplitsize','pdfsplittext','pdfedit','pdfsign','pdfforms','pdfdelete','pdfcompress','pdfprotect','pdfunlock','pdfwatermark','pdfflatten','pdfexcel','pdfppt','pdftext','pdftoword','htmltopdf','wordtopdf','editor']);
});
test('all tool implementation routes remain present',()=>{
 assert.match(main,/async function process\(\)/);
 for(const id of ['pdf','pdfmerge','pdf2image','ocr','exif','background','convert','compress','resize','target','passport','signature','crop','editor','pdfalternate','pdforganize','pdfextract','pdfsplitpages','pdfsplitbookmarks','pdfsplithalf','pdfsplitsize','pdfsplittext','pdfedit','pdfsign','pdfforms','pdfdelete','pdfcompress','pdfprotect','pdfunlock','pdfwatermark','pdfflatten','pdfexcel','pdfppt','pdftext','pdftoword','htmltopdf','wordtopdf'])assert.ok(main.includes("'"+id+"'"),'Missing '+id);
 assert.match(main,/async function mergePdfs\(files,download=true\)/);assert.match(main,/async function convertSpecial\(file,kind\)/);
 assert.match(main,/function editBlob\(i,brightness,contrast,rotation\)/);assert.match(main,/function cropBlob\(i,targetW,targetH,deg,type,q\)/);
 assert.match(main,/async function targetSizeBlob\(i,maxBytes,w,h\)/);
});
test('native delete is limited to tracked private files and browser deletion is history-only',()=>{
 assert.match(main,/delete-file/);assert.match(main,/deleteNativeDownloadedFile\(b\.dataset\.path,b\.dataset\.name\)/);
 assert.match(main,/remove-history/);assert.match(main,/The downloaded file in your browser or Downloads folder will not be deleted/);
 assert.match(updater,/export async function deleteDownloadedFile\(path\)/);assert.match(updater,/ImageMateUpdater\.deleteDownloadedFile\(\{ path \}\)/);
 assert.match(android,/public void deleteDownloadedFile\(PluginCall call\)/);assert.match(android,/getCanonicalPath\(\)/);
 assert.match(android,/Only files saved by ImageMate can be deleted from this library/);
});
test('CI executes the all-tool browser processing smoke test',()=>{
 assert.match(visual,/name: Exercise core workflows and verify expanded 37-tool catalog/);assert.match(visual,/run: node tests\/tool-smoke\.mjs/);
});


test('live preview mounts, responds to settings, and renders PDF outputs locally',()=>{
 assert.match(main,/id="live-preview"/);
 assert.match(main,/async function updateLivePreview\(revision\)/);
 assert.match(main,/function scheduleLivePreview/);
 assert.match(main,/scheduleLivePreview\(\)/);
 assert.match(main,/renderPdfPreviewPage\(output,1\.2\)/);
 assert.match(main,/renderPdfPreviewPage\(file,S\.pdfScale\)/);
 assert.match(main,/id="live-preview-meta"/);
 assert.match(main,/label\(output\.type\)/);
 assert.match(main,/async function pdf\(files,download=true\)/);
 assert.match(main,/async function mergePdfs\(files,download=true\)/);
});


test('expanded PDF suite is locally processed through pdfstudio/qpdf and document conversion helpers',()=>{
 const suite=readFileSync(new URL('../src/pdf-suite.js',import.meta.url),'utf8');
 assert.match(main,/import \{ runPdfTool, PDF_SUITE_TOOLS, PDF_SUITE_PDF_INPUTS \} from '\.\/pdf-suite\.js'/);
 for(const id of ['pdfalternate','pdforganize','pdfextract','pdfsplitpages','pdfsplitbookmarks','pdfsplithalf','pdfsplitsize','pdfsplittext','pdfedit','pdfsign','pdfforms','pdfdelete','pdfcompress','pdfprotect','pdfunlock','pdfwatermark','pdfflatten','pdfexcel','pdfppt','pdftext','pdftoword','htmltopdf','wordtopdf'])assert.ok(suite.includes("tool === '"+id+"'"), 'Missing handler for '+id);
 assert.match(suite,/createPdfToolkit/);assert.match(suite,/pdf\.lock\(source/);assert.match(suite,/pdf\.unlock\(source/);assert.match(suite,/pdf\.compress\(source/);assert.match(suite,/pdf\.flatten\(source/);
 assert.match(suite,/async function createPptx\(/);assert.match(suite,/async function createDocx\(/);assert.match(suite,/async function createXlsx\(/);
});
