import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const updater=readFileSync(new URL('../src/updater.js',import.meta.url),'utf8');
const android=readFileSync(new URL('../.github/workflows/android.yml',import.meta.url),'utf8');
const visual=readFileSync(new URL('../.github/workflows/ui-visual-check.yml',import.meta.url),'utf8');
test('all 14 tools remain registered',()=>{
 const def=main.match(/const tools=\[([\s\S]*?)\];/);assert.ok(def,'tools array is required');
 const ids=[...def[1].matchAll(/^\s*\['([^']+)'/gm)].map(m=>m[1]);
 assert.deepEqual(ids,['convert','compress','resize','target','pdf','passport','pdf2image','exif','signature','crop','ocr','background','pdfmerge','editor']);
});
test('all tool implementation routes remain present',()=>{
 assert.match(main,/async function process\(\)/);
 for(const id of ['pdf','pdfmerge','pdf2image','ocr','exif','background','convert','compress','resize','target','passport','signature','crop','editor'])assert.ok(main.includes("'"+id+"'"),'Missing '+id);
 assert.match(main,/async function mergePdfs\(files\)/);assert.match(main,/async function convertSpecial\(file,kind\)/);
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
 assert.match(visual,/name: Exercise all 14 tool processing workflows/);assert.match(visual,/run: node tests\/tool-smoke\.mjs/);
});
