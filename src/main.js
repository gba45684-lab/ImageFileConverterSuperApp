import { initNativeAds, maybeShowTestInterstitial } from './ads.js';
import { installLatestAndroidUpdate, notifyAndroidUpdate, isNativeAndroid } from './updater.js';
import packageJson from '../package.json';
import './style.css';

const app=document.querySelector('#app');
const UPDATE_API='https://api.github.com/repos/gba45684-lab/ImageFileConverterSuperApp/releases/latest';
const UPDATE_APK='https://github.com/gba45684-lab/ImageFileConverterSuperApp/releases/latest/download/ImageMate.apk';
const APP_VERSION=packageJson.version;
const tools=[
  ['convert','⇄','Convert','JPG, PNG, WebP, AVIF'],
  ['compress','◒','Compress','Reduce image size'],
  ['resize','↗','Resize','Dimensions & quality'],
  ['target','⌁','Target KB','20 / 50 / 100 / 200 KB'],
  ['pdf','▣','Image to PDF','Create a PDF locally'],
  ['passport','▦','Photo Size','Passport & ID sizes'],
  ['pdf2image','▤','PDF to Image','Export PDF pages as PNG or JPG'],
  ['exif','◎','Metadata Cleaner','Strip image metadata'],
  ['signature','✎','Signature Resize','Prepare signatures for forms'],
  ['crop','⌗','Crop & Rotate','Crop, rotate and export'],
  ['ocr','T','OCR Text','Extract text from images'],
  ['background','✦','Background Remover','Remove simple backgrounds']
];
const S={tool:'convert',files:[],format:'image/webp',quality:.88,width:'',height:'',target:100,pdfFormat:'image/png',pdfScale:1.5,rotation:0,dark:localStorage.getItem('imagemate-dark')==='1'};

const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const label=t=>t==='application/pdf'?'PDF':t==='image/jpeg'?'JPG':t==='image/png'?'PNG':t==='image/webp'?'WebP':t==='image/avif'?'AVIF':t==='image/heic'?'HEIC':t==='image/heif'?'HEIF':'Image';
const size=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';

function render(){
  const tool=tools.find(x=>x[0]===S.tool)||tools[0];
  app.innerHTML='<div class="shell '+(S.dark?'dark':'')+'"><header class="topbar"><div class="brand"><div class="logo">IM</div><div><b>ImageMate</b><span>Image & File Converter</span></div></div><div class="top-actions"><button id="theme" class="icon-btn">'+(S.dark?'☀':'☾')+'</button><button class="pro">Remove Ads <small>PRO</small></button><button id="update-btn" class="update-btn" hidden>Update</button></div></header><main><section class="hero"><div><p class="eyebrow">FAST • PRIVATE • BROWSER-BASED</p><h1>Everything you need to<br><em>work with images.</em></h1><p class="sub">Convert, compress, resize and prepare images for forms — without uploading your files.</p></div><div class="hero-badge"><strong>100%</strong><span>local processing</span></div></section><nav class="tool-grid">'+tools.map(t=>'<button class="tool '+(S.tool===t[0]?'active':'')+'" data-tool="'+t[0]+'"><span>'+t[1]+'</span><b>'+t[2]+'</b><small>'+t[3]+'</small></button>').join('')+'</nav><section class="workspace"><div class="workspace-head"><div><p class="eyebrow">WORKSPACE</p><h2>'+tool[2]+'</h2></div><span class="privacy">🔒 Files stay on your device</span></div><div id="drop" class="dropzone"><input id="file" type="file" accept="'+(S.tool==='pdf2image'?'application/pdf':'image/*,.heic,.heif')+'" multiple hidden><div class="upload-icon">↑</div><h3>Drop images here</h3><p>or choose files from your device</p><button id="choose" class="primary">Choose Images</button><small>JPG, PNG, WebP, AVIF • Batch supported</small></div><div id="queue"></div><div id="settings"></div><div class="ad-slot"><span>ADVERTISEMENT</span></div></section><section class="feature-row"><div><b>Private by design</b><span>Images are processed in your browser.</span></div><div><b>Batch ready</b><span>Work with multiple images at once.</span></div><div><b>Mobile friendly</b><span>Install as a PWA on Android.</span></div></section></main><footer>© 2026 ImageMate <span>•</span> Free image tools for everyone</footer></div>';
  bind(); settings(); queue();
  checkForAndroidUpdate();
}
async function checkForAndroidUpdate(){
  if(!isNativeAndroid())return;
  try{
    const r=await fetch(UPDATE_API,{headers:{Accept:'application/vnd.github+json'}});
    if(!r.ok)return;
    const release=await r.json();
    const latest=String(release.tag_name||'').replace(/^v/i,'');
    if(!latest||!isNewerVersion(latest,APP_VERSION))return;
    const b=document.querySelector('#update-btn');
    if(!b)return;
    b.hidden=false;b.textContent='Update available';\n    try{await notifyAndroidUpdate(latest)}catch(e){console.debug('Update notification skipped',e)}\n    b.onclick=async()=>{
      b.disabled=true;b.textContent='Downloading…';
      try{await installLatestAndroidUpdate(UPDATE_APK);b.textContent='Installing…'}
      catch(e){console.error(e);b.disabled=false;b.textContent='Update available';alert('Unable to start the update. Please try again.');}
    };
  }catch(e){console.debug('ImageMate update check skipped',e)}
}
function isNewerVersion(latest,current){
  const a=String(latest).split('.').map(n=>parseInt(n,10)||0),b=String(current).split('.').map(n=>parseInt(n,10)||0);
  for(let i=0;i<Math.max(a.length,b.length);i++){if((a[i]||0)>(b[i]||0))return true;if((a[i]||0)<(b[i]||0))return false}
  return false;
}
function bind(){
  document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{S.tool=b.dataset.tool;S.files=[];render()});
  document.querySelector('#theme').onclick=()=>{S.dark=!S.dark;localStorage.setItem('imagemate-dark',S.dark?'1':'0');render()};
  document.querySelector('#choose').onclick=()=>document.querySelector('#file').click();
  document.querySelector('#file').onchange=e=>load(e.target.files);
  const d=document.querySelector('#drop');
  if(S.tool==='pdf2image')d.querySelector('h3').textContent='Drop a PDF here';
  d.addEventListener('dragover',e=>{e.preventDefault();d.classList.add('drag')});
  d.addEventListener('dragleave',()=>d.classList.remove('drag'));
  d.addEventListener('drop',e=>{e.preventDefault();d.classList.remove('drag');load(e.dataTransfer.files)});
}
function isHeic(f){return /\.(heic|heif)$/i.test(f.name)||/image\/(heic|heif)/i.test(f.type)}
function load(list){
  const files=[...list];
  S.files=S.tool==='pdf2image'
    ? files.filter(f=>f.type==='application/pdf'||/\\.pdf$/i.test(f.name))
    : files.filter(f=>f.type.startsWith('image/')||isHeic(f));
  queue()
}
function queue(){
  const q=document.querySelector('#queue');if(!q)return;
  q.innerHTML=S.files.map((f,i)=>'<div class="file-row"><div class="thumb">'+(S.tool==='pdf2image'?'PDF':'<img src="'+URL.createObjectURL(f)+'">')+'</div><div class="file-meta"><b>'+esc(f.name)+'</b><span>'+label(f.type)+' • '+size(f.size)+'</span></div><button class="remove" data-i="'+i+'">×</button></div>').join('');
  q.querySelectorAll('.remove').forEach(b=>b.onclick=()=>{S.files.splice(+b.dataset.i,1);queue()});
  if(S.files.length){q.insertAdjacentHTML('beforeend','<div class="actionbar"><span><b>'+S.files.length+'</b> '+(S.tool==='pdf2image'?'PDF':'file')+(S.files.length>1?'s':'')+' ready</span><button id="clear" class="remove">Clear</button>'+(S.files.length>1&&!['pdf','pdf2image','ocr','exif','background'].includes(S.tool)?'<button id="zip" class="secondary">Download ZIP</button>':'')+'<button id="process" class="primary">'+(S.tool==='ocr'?'Extract Text':S.tool==='pdf2image'?'Convert Pages':'Process & Download')+'</button></div>');document.querySelector('#clear').onclick=()=>{S.files=[];queue()};const zip=document.querySelector('#zip');if(zip)zip.onclick=processBatchZip;document.querySelector('#process').onclick=process}
}
function settings(){
  const s=document.querySelector('#settings');if(!s)return;let h='';
  if(S.tool==='convert')h='<label>Output format<select id="format"><option value="image/webp">WebP — recommended</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/avif">AVIF</option></select></label>';
  if(['compress','target','resize','passport','signature','crop'].includes(S.tool)){
    if(['resize','passport','signature','crop'].includes(S.tool))h+='<label>Width (px)<input id="width" type="number" placeholder="'+(S.tool==='passport'?'413':S.tool==='signature'?'600':'Original')+'"></label><label>Height (px)<input id="height" type="number" placeholder="'+(S.tool==='passport'?'531':S.tool==='signature'?'200':'Auto')+'"></label>';
    if(!['passport','signature'].includes(S.tool))h+='<label>Quality <output id="qv">'+Math.round(S.quality*100)+'%</output><input id="quality" type="range" min="10" max="100" value="'+S.quality*100+'"></label>';
    if(S.tool==='target')h+='<label>Target size<select id="target"><option>20</option><option>50</option><option selected>100</option><option>200</option></select> KB</label>';
    if(S.tool==='crop')h+='<label>Rotation<select id="rotation"><option value="0">0°</option><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label>';
  }
  if(S.tool==='pdf')h='<div class="info">Images are placed on A4 pages and downloaded as one PDF. Everything stays on this device.</div>';
  if(S.tool==='pdf2image')h='<label>Output format<select id="pdfFormat"><option value="image/png">PNG — lossless</option><option value="image/jpeg">JPG — smaller</option></select></label><label>Render scale<select id="pdfScale"><option value="1">1×</option><option value="1.5" selected>1.5×</option><option value="2">2×</option></select></label><div class="info">Every PDF page becomes a separate image.</div>';
  if(S.tool==='exif')h='<div class="info">The image will be re-encoded as PNG to remove embedded metadata.</div>';
  if(S.tool==='ocr')h='<div class="info">OCR runs locally in your browser. Select an image, then click Extract Text.</div>';
  if(S.tool==='background')h='<div class="info">Removes a simple near-uniform background locally. Best on documents, signatures and product photos.</div>';
  s.innerHTML=h;
  const f=document.querySelector('#format');if(f)f.onchange=e=>S.format=e.target.value;
  const q=document.querySelector('#quality');if(q)q.oninput=e=>{S.quality=e.target.value/100;document.querySelector('#qv').textContent=e.target.value+'%'};
  const w=document.querySelector('#width');if(w)w.oninput=e=>S.width=e.target.value;
  const ht=document.querySelector('#height');if(ht)ht.oninput=e=>S.height=e.target.value;
  const t=document.querySelector('#target');if(t)t.onchange=e=>S.target=+e.target.value;
  const pf=document.querySelector('#pdfFormat');if(pf)pf.onchange=e=>S.pdfFormat=e.target.value;
  const ps=document.querySelector('#pdfScale');if(ps)ps.onchange=e=>S.pdfScale=+e.target.value;
  const rot=document.querySelector('#rotation');if(rot)rot.onchange=e=>S.rotation=+e.target.value;
}
async function normalizeImageFile(file){
  if(!isHeic(file))return file;
  const {default:heic2any}=await import('heic2any');
  const out=await heic2any({blob:file,toType:'image/png',quality:1});
  return Array.isArray(out)?out[0]:out;
}
async function img(file){
  const source=await normalizeImageFile(file);
  return new Promise((ok,no)=>{const i=new Image();i.onload=()=>{URL.revokeObjectURL(i.src);ok(i)};i.onerror=no;i.src=URL.createObjectURL(source)})
}
function blob(i,type,q,w,h){const c=document.createElement('canvas');c.width=w||i.naturalWidth;c.height=h||i.naturalHeight;c.getContext('2d').drawImage(i,0,0,c.width,c.height);return new Promise(r=>c.toBlob(r,type,q))}
function dl(b,n){const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)}
function canvasFor(i,w,h){const c=document.createElement('canvas');c.width=w||i.naturalWidth;c.height=h||i.naturalHeight;c.getContext('2d').drawImage(i,0,0,c.width,c.height);return c}
async function pdf(files){const {jsPDF}=await import('jspdf');const doc=new jsPDF({unit:'mm',format:'a4'});for(let n=0;n<files.length;n++){if(n)doc.addPage();const i=await img(files[n]);const c=canvasFor(i);const maxW=190,maxH=277,scale=Math.min(maxW/c.width,maxH/c.height);const w=c.width*scale,h=c.height*scale;const x=(210-w)/2,y=(297-h)/2;const data=c.toDataURL('image/jpeg',.92);doc.addImage(data,'JPEG',x,y,w,h)}doc.save('imagemate-images.pdf')}
function name(n,e){return n.replace(/\.[^.]+$/,'')+'.'+e}
async function processBatchZip(){if(!S.files.length)return alert('Choose at least one image.');const btn=document.querySelector('#zip');btn.disabled=true;btn.textContent='Creating ZIP…';try{const {default:JSZip}=await import('jszip');const zip=new JSZip();for(const f of S.files){const i=await img(f);let w=i.naturalWidth,h=i.naturalHeight;if(S.tool==='resize'){w=+S.width||w;h=+S.height||Math.round(i.naturalHeight*w/i.naturalWidth)}if(S.tool==='passport'){w=+S.width||413;h=+S.height||531}let type=S.tool==='convert'?S.format:'image/jpeg';let b=await blob(i,type,S.quality,w,h);if(S.tool==='target'){const max=S.target*1024;let lo=.05,hi=.95;for(let x=0;x<10&&b.size>max;x++){const qq=(lo+hi)/2;b=await blob(i,'image/jpeg',qq,w,h);if(b.size>max)hi=qq;else lo=qq}}zip.file(name(f.name,label(type).toLowerCase()),b)}dl(await zip.generateAsync({type:'blob',compression:'DEFLATE'}),'imagemate-'+S.tool+'-batch.zip');await maybeShowTestInterstitial()}catch(e){console.error(e);alert('Could not create the ZIP. Please try fewer or smaller images.')}finally{btn.disabled=false;btn.textContent='Download ZIP'}}
async function process(){
  if(!S.files.length)return alert(S.tool==='pdf2image'?'Choose a PDF first.':'Choose at least one file.');
  const btn=document.querySelector('#process');if(btn){btn.disabled=true;btn.textContent='Processing…'}
  try{
    if(S.tool==='pdf'){await pdf(S.files);showResult('PDF created','Your PDF has been downloaded.');return}
    if(['pdf2image','ocr','exif','background'].includes(S.tool)){
      for(const f of S.files)await convertSpecial(f,S.tool);
      return;
    }
    for(const f of S.files){
      const i=await img(f);let w=i.naturalWidth,h=i.naturalHeight;
      if(['resize','signature','passport','crop'].includes(S.tool)){
        w=+S.width||w;
        h=+S.height||(S.tool==='signature'?200:S.tool==='passport'?531:Math.round(i.naturalHeight*w/i.naturalWidth));
      }
      let type=S.tool==='convert'?S.format:'image/jpeg';
      let b=await blob(i,type,S.quality,w,h);
      if(S.tool==='crop'&&S.rotation)b=await rotatedBlob(i,S.rotation,type,S.quality);
      if(S.tool==='target'){
        const max=S.target*1024;let lo=.05,hi=.95;
        for(let x=0;x<10&&b.size>max;x++){const qq=(lo+hi)/2;b=await blob(i,'image/jpeg',qq,w,h);if(b.size>max)hi=qq;else lo=qq}
      }
      dl(b,name(f.name,label(type).toLowerCase()));
    }
    localStorage.setItem('imagemate-last-used',new Date().toISOString());
    await maybeShowTestInterstitial();
    showResult('Files ready','Your processed files have been downloaded.');
  }catch(e){console.error(e);alert('Could not process the selected file(s). '+(e?.message||'Please try another file.'))}
  finally{if(btn){btn.disabled=false;btn.textContent=S.tool==='ocr'?'Extract Text':S.tool==='pdf2image'?'Convert Pages':'Process & Download'}}
}
function rotatedBlob(i,deg,type,q){
  const swap=deg%180!==0,c=document.createElement('canvas');c.width=swap?i.naturalHeight:i.naturalWidth;c.height=swap?i.naturalWidth:i.naturalHeight;
  const x=c.getContext('2d');x.translate(c.width/2,c.height/2);x.rotate(deg*Math.PI/180);x.drawImage(i,-i.naturalWidth/2,-i.naturalHeight/2);
  return new Promise(r=>c.toBlob(r,type,q));
}
function showResult(title,body){
  const old=document.querySelector('.result-card');if(old)old.remove();
  document.querySelector('.workspace').insertAdjacentHTML('beforeend','<div class="result-card"><div class="result-head"><b>'+esc(title)+'</b><span class="success">✓ Done</span></div><div class="result-body">'+body+'</div></div>');
}
async function convertSpecial(file,kind){
  if(!file)return;
  if(kind==='pdf2image'){
    const {getDocument,GlobalWorkerOptions}=await import('pdfjs-dist');
    GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.mjs',import.meta.url).toString();
    const doc=await getDocument({data:await file.arrayBuffer()}).promise;
    for(let pageNo=1;pageNo<=doc.numPages;pageNo++){
      const page=await doc.getPage(pageNo),viewport=page.getViewport({scale:S.pdfScale});
      const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
      await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
      const out=await new Promise(r=>canvas.toBlob(r,S.pdfFormat,S.pdfFormat==='image/jpeg'?.92:undefined));
      dl(out,file.name.replace(/\.pdf$/i,'')+'-page-'+pageNo+'.'+(S.pdfFormat==='image/png'?'png':'jpg'));
    }
    showResult('PDF converted','Downloaded '+doc.numPages+' page image'+(doc.numPages===1?'':'s')+'.');
    return;
  }
  if(kind==='ocr'){
    const {createWorker}=await import('tesseract.js');
    const worker=await createWorker('eng');
    try{
      const result=await worker.recognize(await normalizeImageFile(file));
      const text=result.data.text.trim();
      showResult('OCR result','<textarea id="ocr-output" rows="12">'+esc(text||'No text detected.')+'</textarea><div class="result-actions"><button class="secondary" id="download-ocr">Download TXT</button></div>');
      document.querySelector('#download-ocr').onclick=()=>dl(new Blob([text||'No text detected.'],{type:'text/plain;charset=utf-8'}),file.name.replace(/\.[^.]+$/,'')+'-ocr.txt');
    }finally{await worker.terminate()}
    return;
  }
  if(kind==='exif'){
    const i=await img(file),out=await new Promise(r=>canvasFor(i).toBlob(r,'image/png'));
    dl(out,file.name.replace(/\.[^.]+$/,'')+'-clean.png');
    showResult('Metadata removed','A clean PNG copy was downloaded without the original embedded metadata.');
    return;
  }
  if(kind==='background'){
    const i=await img(file),c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;
    const x=c.getContext('2d');x.drawImage(i,0,0);const d=x.getImageData(0,0,c.width,c.height),p=d.data;
    const samples=[];for(const [xx,yy] of [[0,0],[c.width-1,0],[0,c.height-1],[c.width-1,c.height-1]]){const n=(yy*c.width+xx)*4;samples.push([p[n],p[n+1],p[n+2]])}
    const bg=samples.reduce((a,b)=>a.map((v,j)=>v+b[j]/samples.length),[0,0,0]);
    for(let n=0;n<p.length;n+=4){const dist=Math.abs(p[n]-bg[0])+Math.abs(p[n+1]-bg[1])+Math.abs(p[n+2]-bg[2]);if(dist<42)p[n+3]=0}
    x.putImageData(d,0,0);const out=await new Promise(r=>c.toBlob(r,'image/png'));
    dl(out,file.name.replace(/\.[^.]+$/,'')+'-background-removed.png');
    showResult('Background removed','A transparent PNG was downloaded. Best results come from simple, uniform backgrounds.');
  }
}

render();
