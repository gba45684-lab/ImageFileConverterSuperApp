import { initNativeAds, maybeShowTestInterstitial } from './ads.js';
import { downloadLatestAndroidUpdate, installDownloadedAndroidUpdate, hasDownloadedAndroidUpdate, notifyAndroidUpdate, requestAndroidNotificationPermission, isNativeAndroid, saveProcessedFile } from './updater.js';
import packageJson from '../package.json';
import './style.css';

const app=document.querySelector('#app');
const UPDATE_API='https://api.github.com/repos/gba45684-lab/ImageFileConverterSuperApp/releases/latest';
const UPDATE_APK='https://github.com/gba45684-lab/ImageFileConverterSuperApp/releases/latest/download/ImageMate.apk';
let latestUpdateUrl=UPDATE_APK;
const APP_VERSION=packageJson.version;
let updateCheckInFlight=false;
let updateMonitorStarted=false;
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
  ['background','✦','Background Remover','Remove simple backgrounds'],
  ['pdfmerge','⊞','Merge PDFs','Combine multiple PDFs into one'],
  ['editor','✧','Image Editor','Brightness, contrast & rotate']
];
const S={tool:'convert',files:[],format:'image/webp',quality:.88,width:'',height:'',target:100,pdfFormat:'image/png',pdfScale:1.5,rotation:0,brightness:0,contrast:0,dark:localStorage.getItem('imagemate-dark')==='1',view:'tools'};

const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const label=t=>t==='application/pdf'?'PDF':t==='image/jpeg'?'JPG':t==='image/png'?'PNG':t==='image/webp'?'WebP':t==='image/avif'?'AVIF':t==='image/heic'?'HEIC':t==='image/heif'?'HEIF':'Image';
const size=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';

function render(){
  const tool=tools.find(x=>x[0]===S.tool)||tools[0];
  const home=S.view==='tools', task=S.view==='tool', downloads=S.view==='downloads';
  const accept=S.tool==='pdf2image'||S.tool==='pdfmerge'?'application/pdf':'image/*,.heic,.heif';
  const title=task?tool[2]:'All tools';
  const desc=task?tool[3]:'Choose a tool to get started';
  const uploadLabel=(S.tool==='pdf2image'||S.tool==='pdfmerge')?'Choose PDFs':'Choose Images';
  const dropLabel=(S.tool==='pdf2image'||S.tool==='pdfmerge')?'Drop PDF files here':'Drop images here';
  const subLabel=(S.tool==='pdf2image'||S.tool==='pdfmerge')?'PDF files • Multiple pages supported':'JPG, PNG, WebP, AVIF • Batch supported';
  app.innerHTML='<div class="shell '+(S.dark?'dark':'')+'"><header class="topbar"><div class="brand"><div class="logo">IM</div><div><b>ImageMate</b><span>Image & File Converter</span></div></div><div class="top-actions"><button id="theme" class="icon-btn" aria-label="Toggle theme">'+(S.dark?'☀':'☾')+'</button><button id="downloads-tab" class="icon-btn">Downloaded files</button><button class="pro">Remove Ads <small>PRO</small></button><button id="update-btn" class="update-btn" hidden>Update</button></div></header><main>'+
  (home?'<section class="hero"><div><p class="eyebrow">FAST • PRIVATE • BROWSER-BASED</p><h1>Everything you need to<br><em>work with images.</em></h1><p class="sub">Convert, compress, resize and prepare images for forms — without uploading your files.</p></div><div class="hero-badge"><strong>100%</strong><span>local processing</span></div></section><nav class="tool-grid" aria-label="ImageMate tools">'+tools.map(t=>'<button class="tool '+(S.tool===t[0]?'active':'')+'" data-tool="'+t[0]+'"><span>'+t[1]+'</span><b>'+t[2]+'</b><small>'+t[3]+'</small></button>').join('')+'</nav>':'')+
  (task?'<section class="tool-screen-head"><button id="back-home" class="secondary back-btn" type="button">← All tools</button><div><p class="eyebrow">IMAGE TOOL</p><h1>'+title+'</h1><p>'+desc+'</p></div><span class="privacy">🔒 Local processing</span></section>':'')+
  '<section class="workspace"><div class="workspace-head"><div><p class="eyebrow">'+(task?'WORKSPACE':'FILES')+'</p><h2>'+title+'</h2></div><span class="privacy">🔒 Files stay on your device</span></div><div id="drop" class="dropzone"><input id="file" type="file" accept="'+accept+'" multiple hidden><div class="upload-icon">↑</div><h3>'+dropLabel+'</h3><p>or choose files from your device</p><button id="choose" class="primary">'+uploadLabel+'</button><small>'+subLabel+'</small></div><div id="queue"></div><div id="progress-wrap" class="progress-wrap" hidden><div class="progress-top"><b class="progress-text">Processing 0%</b><span>Local</span></div><div class="progress-track"><div class="progress-bar" style="width:0%"></div></div></div><div id="settings"></div><div class="ad-slot"><span>ADVERTISEMENT</span></div></section>'+
  (home?'<section class="feature-row"><div><b>Private by design</b><span>Images are processed in your browser.</span></div><div><b>Batch ready</b><span>Work with multiple images at once.</span></div><div><b>Mobile friendly</b><span>Install as a PWA on Android.</span></div></section>':'')+
  '<footer>© 2026 ImageMate <span>•</span> Free image tools for everyone</footer></main></div>';
  bind(); settings(); queue();
  const dt=document.querySelector('#downloads-tab'); if(dt) dt.onclick=()=>{S.view=downloads?'tools':'downloads'; render()};
  const back=document.querySelector('#back-home'); if(back) back.onclick=()=>{S.view='tools';S.files=[];render()};
  if(downloads) renderDownloads();
  checkForAndroidUpdate(); startUpdateMonitor(); initNativeAds().catch(()=>{});
}
function showInstantUpdatePopup(version, mode='download'){
  if(document.querySelector('#update-popup'))return;
  const installMode=mode==='install';
  const overlay=document.createElement('div');
  overlay.id='update-popup';
  overlay.innerHTML='<div style="position:fixed;inset:0;z-index:99999;background:rgba(7,8,18,.62);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px">'+
    '<div style="width:min(440px,100%);background:var(--card,#fff);color:var(--text,#111);border-radius:24px;padding:26px;box-shadow:0 24px 80px rgba(0,0,0,.35)">'+
    '<div style="font-size:34px;margin-bottom:8px">🚀</div>'+
    '<div style="font-size:12px;font-weight:800;letter-spacing:.12em;opacity:.65">IMAGEMATE UPDATE</div>'+
    '<h2 style="margin:7px 0 8px">New version '+esc(version)+' is available</h2>'+
    '<p style="margin:0 0 20px;line-height:1.55;opacity:.72">'+(installMode?'The update is already downloaded and ready to install.':'A new ImageMate version is ready. Update now to get the latest fixes and features.')+'</p>'+
    '<div style="display:flex;gap:10px;justify-content:flex-end">'+
    '<button id="update-later" class="secondary">Later</button>'+
    '<button id="update-now" class="primary">'+(installMode?'Install now':'Update now')+'</button>'+
    '</div></div></div>';
  document.body.appendChild(overlay);
  const close=()=>overlay.remove();
  document.querySelector('#update-later').onclick=close;
  document.querySelector('#update-now').onclick=async()=>{
    const btn=document.querySelector('#update-now');if(!btn)return;
    btn.disabled=true;btn.textContent=installMode?'Opening installer…':'Downloading…';
    try{
      if(installMode){await installDownloadedAndroidUpdate();return;}
      await downloadLatestAndroidUpdate(latestUpdateUrl);
      btn.textContent='Downloading in background…';
      setTimeout(close,700);
    }catch(e){
      console.error(e);btn.disabled=false;btn.textContent=installMode?'Install now':'Update now';
      alert('Unable to start the update. Please try again.');
    }
  };
  if(navigator.vibrate)navigator.vibrate([250,120,250]);
}
async function checkForAndroidUpdate(){
  if(!isNativeAndroid()||updateCheckInFlight)return;
  updateCheckInFlight=true;
  try{
    const ready=await hasDownloadedAndroidUpdate().catch(()=>({ready:false}));
    const b=document.querySelector('#update-btn');
    if(ready?.ready&&b){
      b.hidden=false;b.disabled=false;b.textContent='Install update';
      b.onclick=async()=>{b.disabled=true;b.textContent='Installing…';try{await installDownloadedAndroidUpdate();}catch(e){console.error(e);b.disabled=false;b.textContent='Install update';}};
      showInstantUpdatePopup('downloaded update','install');
      return;
    }
    const r=await fetch(UPDATE_API+'?imagemate='+Date.now(),{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
    if(!r.ok)return;
    const release=await r.json();
    const latest=String(release.tag_name||'').replace(/^v/i,'');
    const asset=Array.isArray(release.assets)?release.assets.find(a=>a&&a.name==='ImageMate.apk'&&a.browser_download_url):null;
    latestUpdateUrl=asset?.browser_download_url||UPDATE_APK;
    if(!latest||!isNewerVersion(latest,APP_VERSION)||!b)return;
    b.hidden=false;b.disabled=false;b.textContent='Update available';
    showInstantUpdatePopup(latest,'download');
    try{await requestAndroidNotificationPermission();}catch(e){console.debug('Notification permission request skipped',e)}
    try{await notifyAndroidUpdate(latest);}catch(e){console.debug('Update notification skipped',e)}
    b.onclick=async()=>{
      b.disabled=true;b.textContent='Downloading…';
      try{
        await downloadLatestAndroidUpdate(latestUpdateUrl);
        b.textContent='Update downloading…';
        setTimeout(()=>{if(b){b.disabled=false;b.textContent='Update downloading…'}},1500);
      }catch(e){
        console.error(e);b.disabled=false;b.textContent='Update available';
        alert('Unable to start the background download. Please try again.');
      }
    };
  }catch(e){console.debug('ImageMate update check skipped',e)}
  finally{updateCheckInFlight=false}
}
function startUpdateMonitor(){
  if(updateMonitorStarted||!isNativeAndroid())return;
  updateMonitorStarted=true;
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkForAndroidUpdate()});
  setInterval(()=>{if(document.visibilityState==='visible')checkForAndroidUpdate()},60000);
}
function isNewerVersion(latest,current){
  const a=String(latest).split('.').map(n=>parseInt(n,10)||0),b=String(current).split('.').map(n=>parseInt(n,10)||0);
  for(let i=0;i<Math.max(a.length,b.length);i++){if((a[i]||0)>(b[i]||0))return true;if((a[i]||0)<(b[i]||0))return false}
  return false;
}
function bind(){
  if(S.view==='downloads') return;
  document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{S.tool=b.dataset.tool;S.files=[];S.view='tool';render()});
  document.querySelector('#theme').onclick=()=>{S.dark=!S.dark;localStorage.setItem('imagemate-dark',S.dark?'1':'0');render()};
  document.querySelector('#choose').onclick=()=>document.querySelector('#file').click();
  document.querySelector('#file').onchange=e=>load(e.target.files);
  const d=document.querySelector('#drop');
  if(S.tool==='pdf2image'||S.tool==='pdfmerge')d.querySelector('h3').textContent='Drop PDF files here';
  d.addEventListener('dragover',e=>{e.preventDefault();d.classList.add('drag')});
  d.addEventListener('dragleave',()=>d.classList.remove('drag'));
  d.addEventListener('drop',e=>{e.preventDefault();d.classList.remove('drag');load(e.dataTransfer.files)});
}
function isHeic(f){return /\.(heic|heif)$/i.test(f.name)||/image\/(heic|heif)/i.test(f.type)}
function load(list){
  const files=[...list];
  S.files=(S.tool==='pdf2image'||S.tool==='pdfmerge')
    ? files.filter(f=>f.type==='application/pdf'||/\.pdf$/i.test(f.name))
    : files.filter(f=>f.type.startsWith('image/')||isHeic(f));
  queue()
}
function queue(){
  const q=document.querySelector('#queue');if(!q)return;
  q.innerHTML=S.files.map((f,i)=>'<div class="file-row"><div class="thumb">'+((S.tool==='pdf2image'||S.tool==='pdfmerge')?'PDF':'<img src="'+URL.createObjectURL(f)+'">')+'</div><div class="file-meta"><b>'+esc(f.name)+'</b><span>'+label(f.type)+' • '+size(f.size)+'</span></div><button class="remove" data-i="'+i+'">×</button></div>').join('');
  q.querySelectorAll('.remove').forEach(b=>b.onclick=()=>{S.files.splice(+b.dataset.i,1);queue()});
  if(S.files.length){q.insertAdjacentHTML('beforeend','<div class="actionbar"><span><b>'+S.files.length+'</b> '+((S.tool==='pdf2image'||S.tool==='pdfmerge')?'PDF':'file')+(S.files.length>1?'s':'')+' ready</span><button id="clear" class="remove">Clear</button>'+(S.files.length>1&&!['pdf','pdf2image','ocr','exif','background'].includes(S.tool)?'<button id="zip" class="secondary">Download ZIP</button>':'')+'<button id="process" class="primary">'+(S.tool==='ocr'?'Extract Text':(S.tool==='pdf2image'||S.tool==='pdfmerge')?'Convert PDFs':'Process & Download')+'</button></div>');document.querySelector('#clear').onclick=()=>{S.files=[];queue()};const zip=document.querySelector('#zip');if(zip)zip.onclick=processBatchZip;document.querySelector('#process').onclick=process}
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
  if(S.tool==='pdfmerge')h='<div class="info">PDFs are rendered locally and merged into one A4 PDF. Your files never leave this device.</div>';
  if(S.tool==='pdf2image')h='<label>Output format<select id="pdfFormat"><option value="image/png">PNG — lossless</option><option value="image/jpeg">JPG — smaller</option></select></label><label>Render scale<select id="pdfScale"><option value="1">1×</option><option value="1.5" selected>1.5×</option><option value="2">2×</option></select></label><div class="info">Every PDF page becomes a separate image.</div>';
  if(S.tool==='exif')h='<div class="info">The image will be re-encoded as PNG to remove embedded metadata.</div>';
  if(S.tool==='ocr')h='<div class="info">OCR runs locally in your browser. Select an image, then click Extract Text.</div>';
  if(S.tool==='background')h='<div class="info">Removes a simple near-uniform background locally. Best on documents, signatures and product photos.</div>';
  if(S.tool==='editor')h='<label>Brightness <output id="bv">0</output><input id="brightness" type="range" min="-100" max="100" value="0"></label><label>Contrast <output id="cv">0</output><input id="contrast" type="range" min="-100" max="100" value="0"></label><label>Rotation<select id="rotation"><option value="0">0°</option><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label><div class="info">Apply basic corrections locally, then export a clean JPG.</div>';
  if(S.tool==='pdfmerge')h+='<div class="info">Select two or more PDFs to combine them in order.</div>';
  s.innerHTML=h;
  const f=document.querySelector('#format');if(f)f.onchange=e=>S.format=e.target.value;
  const q=document.querySelector('#quality');if(q)q.oninput=e=>{S.quality=e.target.value/100;document.querySelector('#qv').textContent=e.target.value+'%'};
  const w=document.querySelector('#width');if(w)w.oninput=e=>S.width=e.target.value;
  const ht=document.querySelector('#height');if(ht)ht.oninput=e=>S.height=e.target.value;
  const t=document.querySelector('#target');if(t)t.onchange=e=>S.target=+e.target.value;
  const pf=document.querySelector('#pdfFormat');if(pf)pf.onchange=e=>S.pdfFormat=e.target.value;
  const ps=document.querySelector('#pdfScale');if(ps)ps.onchange=e=>S.pdfScale=+e.target.value;
  const rot=document.querySelector('#rotation');if(rot)rot.onchange=e=>S.rotation=+e.target.value;
  const br=document.querySelector('#brightness');if(br)br.oninput=e=>{S.brightness=+e.target.value;const o=document.querySelector('#bv');if(o)o.textContent=e.target.value};
  const co=document.querySelector('#contrast');if(co)co.oninput=e=>{S.contrast=+e.target.value;const o=document.querySelector('#cv');if(o)o.textContent=e.target.value};
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
function history(){try{return JSON.parse(localStorage.getItem('imagemate-history')||'[]')}catch{return[]}}
function addHistory(name,tool,sizeBytes,extra={}){const h=history();h.unshift({name,tool,size:sizeBytes,at:new Date().toISOString(),...extra});localStorage.setItem('imagemate-history',JSON.stringify(h.slice(0,50)))}
async function nativeDownloadedFiles(){if(!isNativeAndroid())return history();try{const r=await ImageMateUpdaterList();return r?.files||[]}catch{return history()}}
async function ImageMateUpdaterList(){return (await import('./updater.js')).listDownloadedFiles()}
async function openDownloadedFile(path){try{await (await import('./updater.js')).openDownloadedFile(path)}catch(e){console.error(e);alert('Unable to open this file.')}}
async function shareDownloadedFile(path){try{await (await import('./updater.js')).shareDownloadedFile(path)}catch(e){console.error(e);alert('Unable to share this file.')}}
async function exportDownloadedFile(path,name,mime){try{await (await import('./updater.js')).exportDownloadedFile(path,name,mime);showResult('File saved','A copy was saved to your device Downloads folder.')}catch(e){console.error(e);alert('Unable to save another copy.')}}
async function renderDownloads(){
  const workspace=document.querySelector('.workspace'); if(!workspace)return;
  workspace.innerHTML='<div class="downloads-head"><div><p class="eyebrow">YOUR FILES</p><h2>Downloaded files</h2><p class="downloads-sub">Open, share or save another copy of files created by ImageMate.</p></div><button id="refresh-downloads" class="secondary">Refresh</button></div><div id="downloaded-list" class="downloaded-list"><div class="empty-downloads">Loading files…</div></div>';
  const list=await nativeDownloadedFiles(); const el=document.querySelector('#downloaded-list'); if(!el)return;
  if(!list.length){el.innerHTML='<div class="empty-downloads"><b>No downloaded files yet</b><span>Processed files will appear here automatically.</span></div>';return}
  el.innerHTML=list.map((f,i)=>'<article class="download-item"><div class="download-icon">↓</div><div class="download-info"><b>'+esc(f.name||('File '+(i+1)))+'</b><span>'+(f.mime?label(f.mime)+' • ':'')+(f.size?size(+f.size)+' • ':'')+(f.at?new Date(f.at).toLocaleString():'')+'</span></div><div class="download-actions"><button class="secondary open-file" data-path="'+esc(f.path)+'">Open</button><button class="secondary share-file" data-path="'+esc(f.path)+'">Share</button><button class="primary save-copy" data-path="'+esc(f.path)+'" data-name="'+esc(f.name||'ImageMate-file')+'" data-mime="'+esc(f.mime||'application/octet-stream')+'">Download again</button></div></article>').join('');
  el.querySelectorAll('.open-file').forEach(b=>b.onclick=()=>openDownloadedFile(b.dataset.path));
  el.querySelectorAll('.share-file').forEach(b=>b.onclick=()=>shareDownloadedFile(b.dataset.path));
  el.querySelectorAll('.save-copy').forEach(b=>b.onclick=()=>exportDownloadedFile(b.dataset.path,b.dataset.name,b.dataset.mime));
  const rb=document.querySelector('#refresh-downloads'); if(rb)rb.onclick=renderDownloads;
}
function setProgress(percent,label='Processing'){const q=document.querySelector('#progress-wrap');if(!q)return;const p=Math.max(0,Math.min(100,Math.round(percent)));const bar=q.querySelector('.progress-bar');const text=q.querySelector('.progress-text');if(bar)bar.style.width=p+'%';if(text)text.textContent=label+' '+p+'%'}
function blobBase64(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]||'');r.onerror=reject;r.readAsDataURL(blob)})}
async function dl(b,n,mime){if(!b)return;const type=mime||b.type||'application/octet-stream';if(isNativeAndroid()){try{const saved=await saveProcessedFile(n,type,await blobBase64(b));addHistory(n,S.tool,b.size,{path:saved?.path||'',mime:type});return}catch(e){console.warn('Native save failed, falling back to browser download',e)}}const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();addHistory(n,S.tool,b.size);setTimeout(()=>URL.revokeObjectURL(u),1500)}
function canvasFor(i,w,h){const c=document.createElement('canvas');c.width=w||i.naturalWidth;c.height=h||i.naturalHeight;c.getContext('2d').drawImage(i,0,0,c.width,c.height);return c}
async function pdf(files){const {jsPDF}=await import('jspdf');const doc=new jsPDF({unit:'mm',format:'a4'});for(let n=0;n<files.length;n++){if(n)doc.addPage();const i=await img(files[n]);const c=canvasFor(i);const maxW=190,maxH=277,scale=Math.min(maxW/c.width,maxH/c.height);const w=c.width*scale,h=c.height*scale;const x=(210-w)/2,y=(297-h)/2;const data=c.toDataURL('image/jpeg',.92);doc.addImage(data,'JPEG',x,y,w,h)}doc.save('imagemate-images.pdf')}
function name(n,e){return n.replace(/\.[^.]+$/,'')+'.'+e}
async function processBatchZip(){if(!S.files.length)return alert('Choose at least one image.');const btn=document.querySelector('#zip');btn.disabled=true;btn.textContent='Creating ZIP…';try{const {default:JSZip}=await import('jszip');const zip=new JSZip();for(const f of S.files){const i=await img(f);let w=i.naturalWidth,h=i.naturalHeight;if(S.tool==='resize'){w=+S.width||w;h=+S.height||Math.round(i.naturalHeight*w/i.naturalWidth)}if(S.tool==='passport'){w=+S.width||413;h=+S.height||531}let type=S.tool==='convert'?S.format:'image/jpeg';let b=await blob(i,type,S.quality,w,h);if(S.tool==='target'){const max=S.target*1024;let lo=.05,hi=.95;for(let x=0;x<10&&b.size>max;x++){const qq=(lo+hi)/2;b=await blob(i,'image/jpeg',qq,w,h);if(b.size>max)hi=qq;else lo=qq}}zip.file(name(f.name,label(type).toLowerCase()),b)}dl(await zip.generateAsync({type:'blob',compression:'DEFLATE'}),'imagemate-'+S.tool+'-batch.zip');await maybeShowTestInterstitial()}catch(e){console.error(e);alert('Could not create the ZIP. Please try fewer or smaller images.')}finally{btn.disabled=false;btn.textContent='Download ZIP'}}
async function process(){
  if(!S.files.length)return alert(S.tool==='pdf2image'?'Choose a PDF first.':'Choose at least one file.');
  const btn=document.querySelector('#process');if(btn){btn.disabled=true;btn.textContent='Processing…'}
  const progress=document.querySelector('#progress-wrap');if(progress)progress.hidden=false;setProgress(0,'Processing');
  try{
    if(S.tool==='pdf'){await pdf(S.files);setProgress(100,'Downloaded');showResult('PDF created','Your PDF has been downloaded and saved to local history.');return}
    if(S.tool==='pdfmerge'){await mergePdfs(S.files);setProgress(100,'Downloaded');showResult('PDFs merged','Your combined PDF has been downloaded.');return}
    if(['pdf2image','ocr','exif','background'].includes(S.tool)){
      for(let n=0;n<S.files.length;n++){await convertSpecial(S.files[n],S.tool);setProgress(((n+1)/S.files.length)*100,'Downloaded')}
      showResult(S.tool==='ocr'?'OCR complete':'Files ready','Your processed files were downloaded and saved to local history.');
      return;
    }
    for(let n=0;n<S.files.length;n++){
      const f=S.files[n];
      const i=await img(f);let w=i.naturalWidth,h=i.naturalHeight;
      if(['resize','signature','passport','crop'].includes(S.tool)){
        w=+S.width||w;
        h=+S.height||(S.tool==='signature'?200:S.tool==='passport'?531:Math.round(i.naturalHeight*w/i.naturalWidth));
      }
      let type=S.tool==='convert'?S.format:'image/jpeg';
      let b=S.tool==='editor'?await editBlob(i,S.brightness,S.contrast,S.rotation):await blob(i,type,S.quality,w,h);
      if(S.tool==='crop'&&S.rotation)b=await rotatedBlob(i,S.rotation,type,S.quality);
      if(S.tool==='target'){
        const max=S.target*1024;let lo=.05,hi=.95;
        for(let x=0;x<10&&b.size>max;x++){const qq=(lo+hi)/2;b=await blob(i,'image/jpeg',qq,w,h);if(b.size>max)hi=qq;else lo=qq}
      }
      await dl(b,name(f.name,label(type).toLowerCase()),type);
      setProgress(((n+1)/S.files.length)*100,'Downloaded');
    }
    localStorage.setItem('imagemate-last-used',new Date().toISOString());
    await maybeShowTestInterstitial();
    setProgress(100,'Downloaded');
    showResult('Files ready','Your processed files have been downloaded and saved to local history.');
  }catch(e){console.error(e);alert('Could not process the selected file(s). '+(e?.message||'Please try another file.'))}
  finally{if(btn){btn.disabled=false;btn.textContent=S.tool==='ocr'?'Extract Text':(S.tool==='pdf2image'||S.tool==='pdfmerge')?'Convert PDFs':'Process & Download'}}
}
async function editBlob(i,brightness,contrast,rotation){
  const swap=rotation%180!==0;
  const c=document.createElement('canvas');
  c.width=swap?i.naturalHeight:i.naturalWidth;c.height=swap?i.naturalWidth:i.naturalHeight;
  const x=c.getContext('2d');
  x.translate(c.width/2,c.height/2);x.rotate(rotation*Math.PI/180);
  x.filter='brightness('+(100+Number(brightness||0))+'%) contrast('+(100+Number(contrast||0))+'%)';
  x.drawImage(i,-i.naturalWidth/2,-i.naturalHeight/2);
  return new Promise(r=>c.toBlob(r,'image/jpeg',.92));
}
async function mergePdfs(files){
  const {getDocument,GlobalWorkerOptions}=await import('pdfjs-dist');
  const {jsPDF}=await import('jspdf');
  GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.mjs',import.meta.url).toString();
  const doc=new jsPDF({unit:'mm',format:'a4'});
  let added=0;
  for(const file of files){
    const source=await getDocument({data:await file.arrayBuffer()}).promise;
    for(let pageNo=1;pageNo<=source.numPages;pageNo++){
      const page=await source.getPage(pageNo);
      const viewport=page.getViewport({scale:1.4});
      const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
      await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
      if(added++)doc.addPage();
      const maxW=190,maxH=277,scale=Math.min(maxW/canvas.width,maxH/canvas.height);
      const w=canvas.width*scale,h=canvas.height*scale;
      doc.addImage(canvas.toDataURL('image/jpeg',.9),'JPEG',(210-w)/2,(297-h)/2,w,h);
    }
  }
  doc.save('imagemate-merged.pdf');
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
