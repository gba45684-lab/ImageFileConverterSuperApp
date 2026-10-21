import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { jsPDF } from 'jspdf';
const baseUrl=process.env.IMAGEMATE_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
page.setDefaultTimeout(30000);
const pageErrors=[],dialogs=[],downloads=[];
page.on('pageerror',e=>pageErrors.push(e.message));
page.on('dialog',async d=>{dialogs.push({type:d.type(),message:d.message()});if(d.type()==='confirm')await d.accept();else await d.dismiss()});
page.on('download',d=>downloads.push(d));
function makePdf(text){const doc=new jsPDF({unit:'pt',format:[300,220]});doc.setFontSize(22);doc.text(text,24,45);doc.setFontSize(12);doc.text('ImageMate automated smoke test',24,75);return Buffer.from(doc.output('arraybuffer'))}
function fileType(b){
 if(b.length>=8&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return'image/png';
 if(b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255)return'image/jpeg';
 if(b.length>=12&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP')return'image/webp';
 if(b.length>=12&&b.toString('ascii',4,8)==='ftyp'&&['avif','avis'].includes(b.toString('ascii',8,12)))return'image/avif';
 if(b.length>=4&&b.toString('ascii',0,4)==='%PDF')return'application/pdf';
 if(b.length&&!b.subarray(0,Math.min(20,b.length)).includes(0))return'text/plain';
 return'unknown';
}
async function setRange(selector,value){await page.locator(selector).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}))},value)}
try{
 await page.goto(baseUrl,{waitUntil:'networkidle'});
 const dataUrl=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=640;c.height=280;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,640,280);x.fillStyle='#111';x.font='bold 54px Arial';x.fillText('IMAGE MATE',28,105);x.fillText('TEST 123',28,190);x.fillStyle='#2f6fff';x.fillRect(520,24,76,64);return c.toDataURL('image/png')});
 const image=Buffer.from(dataUrl.split(',')[1],'base64'),pdf1=makePdf('First PDF'),pdf2=makePdf('Second PDF');
 const cases=[
 {id:'convert',kind:'image',mime:'image/png',configure:()=>page.locator('#format').selectOption('image/png')},
 {id:'compress',kind:'image',mime:'image/jpeg',configure:()=>setRange('#quality',75)},
 {id:'resize',kind:'image',mime:'image/jpeg',configure:async()=>{await page.locator('#width').fill('320');await page.locator('#height').fill('140')}},
 {id:'target',kind:'image',mime:'image/jpeg',configure:()=>page.locator('#target').selectOption('20')},
 {id:'pdf',kind:'image',mime:'application/pdf'},
 {id:'passport',kind:'image',mime:'image/jpeg',configure:async()=>{await page.locator('#width').fill('413');await page.locator('#height').fill('531')}},
 {id:'pdf2image',kind:'pdf',mime:'image/png',configure:async()=>{await page.locator('#pdfFormat').selectOption('image/png');await page.locator('#pdfScale').selectOption('1')}},
 {id:'exif',kind:'image',mime:'image/png'},
 {id:'signature',kind:'image',mime:'image/jpeg',configure:async()=>{await page.locator('#width').fill('600');await page.locator('#height').fill('200')}},
 {id:'crop',kind:'image',mime:'image/jpeg',configure:async()=>{await page.locator('#width').fill('250');await page.locator('#height').fill('160');await page.locator('#rotation').selectOption('90')}},
 {id:'ocr',kind:'image',mime:'text/plain'},
 {id:'background',kind:'image',mime:'image/png'},
 {id:'pdfmerge',kind:'pdfs',mime:'application/pdf'},
 {id:'editor',kind:'image',mime:'image/jpeg',configure:async()=>{await setRange('#brightness',15);await setRange('#contrast',10);await page.locator('#rotation').selectOption('90')}}
 ];
 const report=[];
 async function catalog(){if(await page.locator('.catalog-tool-row').count()!==14){await page.locator('#tools-btn').click();await page.locator('.catalog-tool-row').first().waitFor()}}
 async function enter(id){await catalog();await page.locator('.catalog-tool-row[data-tool="'+id+'"]').click();await page.locator('#file').waitFor({state:'attached'})}
 async function leaveTool(){await page.locator('#tools-btn').click();await page.locator('.catalog-tool-row').first().waitFor()}
 async function attach(kind){
  if(kind==='pdf')await page.locator('#file').setInputFiles({name:'imagemate-test.pdf',mimeType:'application/pdf',buffer:pdf1});
  else if(kind==='pdfs')await page.locator('#file').setInputFiles([{name:'first.pdf',mimeType:'application/pdf',buffer:pdf1},{name:'second.pdf',mimeType:'application/pdf',buffer:pdf2}]);
  else await page.locator('#file').setInputFiles({name:'imagemate-test.png',mimeType:'image/png',buffer:image});
 }
 async function awaitDownload(n,ms=25000){const end=Date.now()+ms;while(downloads.length<=n&&Date.now()<end)await page.waitForTimeout(100);return downloads.length>n?downloads[downloads.length-1]:null}
 async function checkDownload(d,expected){
  assert.ok(d,'No download was emitted');const p=await d.path();assert.ok(p&&fs.existsSync(p),'Download should be readable');
  const b=fs.readFileSync(p),actual=fileType(b);assert.equal(actual,expected,'Expected '+expected+' bytes, got '+actual);
  if(expected!=='text/plain')assert.ok(b.length>100,'Output bytes too small');
  return{filename:d.suggestedFilename(),bytes:b.length,type:actual};
 }
 await page.locator('#see-all-tools').click();assert.equal(await page.locator('.catalog-tool-row').count(),14);
 for(const item of cases){
  const before=downloads.length;await enter(item.id);if(item.configure)await item.configure();await attach(item.kind);
  assert.equal(await page.locator('#queue .file-row').count(),item.kind==='pdfs'?2:1,item.id+' input queue count');
  await page.locator('#live-preview-stage .live-preview-image, #live-preview-stage .live-preview-canvas').waitFor({state:'visible',timeout:45000});
  if(item.id==='resize'){
    await page.waitForFunction(()=>document.querySelector('#live-preview-meta')?.textContent.includes('320 × 140'));
    await page.locator('#width').fill('400');
    await page.locator('#height').fill('175');
    await page.waitForFunction(()=>document.querySelector('#live-preview-meta')?.textContent.includes('400 × 175'));
    await page.locator('#width').fill('320');
    await page.locator('#height').fill('140');
    await page.waitForFunction(()=>document.querySelector('#live-preview-meta')?.textContent.includes('320 × 140'));
  }
  if(item.id==='editor')await page.waitForFunction(()=>document.querySelector('#live-preview-meta')?.textContent.includes('280 × 640'));
  if(item.id==='ocr'){
   await page.locator('#process').click();await page.locator('#ocr-output').waitFor({state:'visible',timeout:120000});
   const outputText=await page.locator('#ocr-output').inputValue();assert.ok(outputText.trim());assert.match(outputText,/IMAGE|MATE|TEST|123/i,'OCR should recognize the sample text');
   const d=page.waitForEvent('download',{timeout:20000});await page.locator('#download-ocr').click();await d;
  }else{await page.locator('#process').click();await page.locator('.result-card').waitFor({state:'visible'})}
  report.push({tool:item.id,status:'PASS',...(await checkDownload(await awaitDownload(before),item.mime))});await leaveTool();
 }
 for(const fmt of [{value:'image/jpeg',type:'image/jpeg'},{value:'image/webp',type:'image/webp'},{value:'image/avif',type:'image/avif'}]){
  const before=downloads.length,beforeDialogs=dialogs.length;
  await enter('convert');await page.locator('#format').selectOption(fmt.value);await attach('image');await page.locator('#process').click();
  const shown=await page.locator('.result-card').waitFor({state:'visible',timeout:10000}).then(()=>true).catch(()=>false);
  const d=await awaitDownload(before,10000);
  if(d&&shown)report.push({tool:'convert:'+fmt.value,status:'PASS',...(await checkDownload(d,fmt.type))});
  else{
   const messages=dialogs.slice(beforeDialogs).map(x=>x.message);
   assert.equal(fmt.value,'image/avif','Only AVIF may be unavailable');assert.ok(messages.some(s=>/AVIF.*not supported|AVIF encoding is not supported/i.test(s)),'AVIF unsupported should be explained');
   assert.equal(d,null,'Unsupported AVIF must not save a mismatched file');
   report.push({tool:'convert:image/avif',status:'PASS (unsupported encoder reported)',message:messages.at(-1)});
  }
  await leaveTool();
 }
 await page.locator('#settings-btn').click();await page.locator('#open-downloads').click();await page.locator('.download-item').first().waitFor();
 const count=await page.locator('.download-item').count();await page.locator('.remove-history').first().click();await page.waitForFunction(n=>document.querySelectorAll('.download-item').length===n-1,count);
 report.push({tool:'browser history removal',status:'PASS'});
 assert.deepEqual(pageErrors,[],'Uncaught page errors occurred');console.log(JSON.stringify({passed:report.length,report},null,2));
}finally{await browser.close()}
