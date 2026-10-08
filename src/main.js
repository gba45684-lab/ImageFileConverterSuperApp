import { initNativeAds, maybeShowTestInterstitial } from './ads.js';
import { downloadLatestAndroidUpdate, installDownloadedAndroidUpdate, hasDownloadedAndroidUpdate, getAndroidUpdateStatus, notifyAndroidUpdate, requestAndroidNotificationPermission, getAndroidAppVersion, isNativeAndroid, saveProcessedFile } from './updater.js';
import packageJson from '../package.json';
import './style.css';
import { createIcons, icons } from 'lucide';

const app=document.querySelector('#app');
if(isNativeAndroid()) document.documentElement.classList.add('native-android');
const UPDATE_API='https://api.github.com/repos/gba45684-lab/ImageFileConverterSuperApp/releases/latest';
const UPDATE_APK='https://github.com/gba45684-lab/ImageFileConverterSuperApp/releases/latest/download/ImageMate.apk';
let latestUpdateUrl=UPDATE_APK;
const APP_VERSION=packageJson.version;
let runtimeAppVersion=APP_VERSION;
let updateCheckInFlight=false;
let updateMonitorStarted=false;
const UPDATE_AUTO_CHECK_MS=5*60*1000;
const UPDATE_MANUAL_CHECK_MS=10*1000;
let lastUpdateCheckAt=Number(localStorage.getItem('imagemate-last-update-check')||0);
const tools=[
  ['convert','images','Convert Images','JPG, PNG, WebP, AVIF','IMAGE'],
  ['compress','file-down','Compress Images','Reduce file size','IMAGE'],
  ['resize','scan','Resize Images','Dimensions & quality','IMAGE'],
  ['target','target','Target File Size','20 / 50 / 100 / 200 KB','IMAGE'],
  ['pdf','file-text','Image to PDF','Create a PDF locally','DOCUMENT'],
  ['passport','contact-round','Passport & ID Photo','Standard ID photo sizes','PHOTO'],
  ['pdf2image','file-image','PDF to Image','Export PDF pages as PNG or JPG','DOCUMENT'],
  ['exif','shield-check','Remove Metadata','Strip embedded image metadata','PRIVACY'],
  ['signature','pen-line','Signature Resize','Prepare signatures for forms','UTILITY'],
  ['crop','crop','Crop & Rotate','Crop, rotate and export','IMAGE'],
  ['ocr','scan-text','OCR Text','Extract text from images','DOCUMENT'],
  ['background','eraser','Remove Background','Clean simple backgrounds','IMAGE'],
  ['pdfmerge','files','Merge PDFs','Combine multiple PDFs into one','DOCUMENT'],
  ['editor','sliders-horizontal','Photo Editor','Brightness, contrast & rotate','IMAGE']
];
const savedFormat=localStorage.getItem('imagemate-format');
const allowedFormats=['image/webp','image/jpeg','image/png','image/avif'];
const storedQuality=Number(localStorage.getItem('imagemate-quality'));
const safeQuality=Number.isFinite(storedQuality)?Math.min(1,Math.max(.1,storedQuality)):.88;
const S={tool:'convert',files:[],format:allowedFormats.includes(savedFormat)?savedFormat:'image/webp',quality:safeQuality,width:'',height:'',target:100,pdfFormat:'image/png',pdfScale:1.5,rotation:0,brightness:0,contrast:0,dark:localStorage.getItem('imagemate-dark')==='1',view:'tools'};

const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const label=t=>t==='application/pdf'?'PDF':t==='image/jpeg'?'JPG':t==='image/png'?'PNG':t==='image/webp'?'WebP':t==='image/avif'?'AVIF':t==='image/heic'?'HEIC':t==='image/heif'?'HEIF':t==='text/plain'||String(t).startsWith('text/')?'TXT':t==='application/zip'?'ZIP':'Image';
const size=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';

function render(){
  document.querySelectorAll('#queue img').forEach(imgEl=>{const src=imgEl.currentSrc||imgEl.src;if(src)URL.revokeObjectURL(src)});
  const tool=tools.find(x=>x[0]===S.tool)||tools[0];
  const home=S.view==='tools', task=S.view==='tool', downloads=S.view==='downloads', settingsScreen=S.view==='settings';
  const accept=S.tool==='pdf2image'||S.tool==='pdfmerge'?'application/pdf':'image/*,.heic,.heif';
  const title=task?tool[2]:'All tools';
  const desc=task?tool[3]:'Choose a tool to get started';
  const uploadLabel=(S.tool==='pdf2image'||S.tool==='pdfmerge')?'Choose PDFs':'Choose Images';
  const dropLabel=(S.tool==='pdf2image'||S.tool==='pdfmerge')?'Drop PDF files here':'Drop images here';
  const subLabel=(S.tool==='pdf2image'||S.tool==='pdfmerge')?'PDF files • Multiple pages supported':'JPG, PNG, WebP, AVIF • Batch supported';

  const header='<header class="topbar editorial-topbar"><div class="brand"><button id="brand-home" class="brand-mark" aria-label="ImageMate home"><span>IM</span></button><div class="brand-copy"><b>ImageMate</b><span>Private image & file tools</span></div></div><nav class="top-actions" aria-label="Application navigation"><button id="home-btn" class="nav-btn" title="Home"><i data-lucide="house"></i><span class="nav-text">Home</span></button><button id="theme" class="nav-btn" aria-label="Toggle theme" title="Theme"><i data-lucide="'+(S.dark?'sun':'moon')+'"></i><span class="nav-text">Theme</span></button><button id="settings-btn" class="nav-btn" title="Settings"><i data-lucide="settings-2"></i><span class="nav-text">Settings</span></button><button id="refresh-update-btn" class="nav-btn update-refresh" title="Refresh update check" aria-label="Refresh update check" ' + (isNativeAndroid() ? '' : 'hidden') + '><i data-lucide="refresh-cw"></i><span class="nav-text">Refresh</span></button><button class="pro" title="Remove Ads"><span>Remove Ads</span><small>PRO</small></button><button id="update-btn" class="update-btn" hidden>Update</button></nav></header>';

  let content='';
  if(home){
    content='<section class="editorial-home"><div class="editorial-hero"><p class="editorial-kicker">IMAGE MATE</p><h1>Tools for the paperwork of life.</h1><p>Quiet, precise utilities for everyday documents and images.</p></div><div class="editorial-search"><i data-lucide="search"></i><input id="tool-search" type="search" autocomplete="off" placeholder="Search your utilities…" aria-label="Search utilities"></div><div class="editorial-rule"><span>LOCAL-FIRST</span><i></i></div><div class="editorial-tools-head"><div><span>ALL TOOLS</span><small>14 tools</small></div><span class="editorial-filter-note">Private processing • No upload required</span></div><nav id="tool-grid" class="tool-grid editorial-tool-grid" aria-label="ImageMate tools">'+tools.map(t=>'<button class="tool editorial-tool" data-tool="'+t[0]+'" aria-label="Open '+esc(t[2])+'"><span class="tool-top"><span class="tool-icon"><i data-lucide="'+t[1]+'"></i></span><span class="tool-arrow"><i data-lucide="arrow-up-right"></i></span></span><span class="tool-main"><span class="tool-category">'+t[4]+'</span><b>'+t[2]+'</b><small>'+t[3]+'</small></span></button>').join('')+'</nav><button id="view-all-tools" class="editorial-view-all" type="button"><span>View all 14 tools</span><i data-lucide="arrow-right"></i></button><nav class="editorial-bottom-nav" aria-label="Quick navigation"><button class="active" data-editorial-nav="home"><i data-lucide="house"></i><span>Home</span></button><button data-editorial-nav="recent"><i data-lucide="clock-3"></i><span>Recent</span></button><button data-editorial-nav="settings"><i data-lucide="settings-2"></i><span>Settings</span></button></nav></section>';
  }else if(settingsScreen){
    content='<section class="screen-head"><button id="back-settings" class="secondary back-btn" type="button"><i data-lucide="arrow-left"></i><span>Back</span></button><div><p class="eyebrow">APP PREFERENCES</p><h1>Settings</h1><p>Control ImageMate preferences, file library and app behavior.</p></div><span class="privacy"><i data-lucide="shield-check"></i> Private & local</span></section><section class="settings-screen"><div class="settings-card"><div class="settings-icon"><i data-lucide="folder-down"></i></div><div class="settings-copy"><b>Downloaded files</b><span>Open, share and save another copy of your processed files.</span></div><button id="open-downloads" class="secondary" type="button">File Library</button></div><div class="settings-card settings-stack"><div class="settings-copy"><b>Processing defaults</b><span>These defaults are used when you start a new conversion.</span></div><label>Default image format<select id="default-format"><option value="image/webp" '+(S.format==='image/webp'?'selected':'')+'>WebP — recommended</option><option value="image/jpeg" '+(S.format==='image/jpeg'?'selected':'')+'>JPG</option><option value="image/png" '+(S.format==='image/png'?'selected':'')+'>PNG</option><option value="image/avif" '+(S.format==='image/avif'?'selected':'')+'>AVIF</option></select></label><label>Default quality <output id="default-quality-value">'+Math.round(S.quality*100)+'%</output><input id="default-quality" type="range" min="10" max="100" value="'+Math.round(S.quality*100)+'"></label></div><div class="settings-card"><div class="settings-icon"><i data-lucide="refresh-cw"></i></div><div class="settings-copy"><b>Automatic update checks</b><span>Check for new ImageMate Android versions when the app opens.</span></div><label class="switch"><input id="update-setting" type="checkbox" '+(localStorage.getItem('imagemate-auto-update')!=='0'?'checked':'')+'><span></span></label></div><div class="settings-card settings-about"><div class="settings-copy"><b>Privacy & app information</b><span>ImageMate processes files locally on your device. Version '+esc(runtimeAppVersion||APP_VERSION)+'.</span></div></div></section>';
  }else if(downloads){
    content='<section class="screen-head"><button id="back-home" class="secondary back-btn" type="button"><i data-lucide="arrow-left"></i><span>Home</span></button><div><p class="eyebrow">FILE LIBRARY</p><h1>Downloaded files</h1><p>Open, share or save another copy of files created by ImageMate.</p></div><span class="privacy"><i data-lucide="shield-check"></i> Files stay on your device</span></section><section class="workspace downloads-workspace"><div id="download-library"><div class="empty-downloads">Loading files…</div></div></section>';
  }else{
    content='<section class="screen-head"><button id="back-home" class="secondary back-btn" type="button"><i data-lucide="arrow-left"></i><span>All tools</span></button><div class="screen-title"><p class="eyebrow">DEDICATED TOOL</p><div class="screen-title-row"><span class="screen-title-icon"><i data-lucide="'+tool[1]+'"></i></span><h1>'+title+'</h1></div><p>'+desc+'</p></div><span class="privacy"><i data-lucide="shield-check"></i> Local processing</span></section><section class="workspace"><div class="workspace-head"><div><p class="eyebrow">WORKSPACE</p><h2>'+title+'</h2></div><span class="privacy"><i data-lucide="shield-check"></i> Files stay on your device</span></div><div id="drop" class="dropzone"><input id="file" type="file" accept="'+accept+'" multiple hidden><div class="upload-icon"><i data-lucide="upload-cloud"></i></div><h3>'+dropLabel+'</h3><p>or choose files from your device</p><button id="choose" class="primary"><i data-lucide="folder-open"></i><span>'+uploadLabel+'</span></button><small>'+subLabel+'</small></div><div id="queue"></div><div id="progress-wrap" class="progress-wrap" hidden><div class="progress-top"><b class="progress-text">Processing 0%</b><span>Local</span></div><div class="progress-track"><div class="progress-bar" style="width:0%"></div></div></div><div id="settings"></div><div class="ad-slot"><span>ADVERTISEMENT</span></div></section>';
  }

  app.innerHTML='<div class="shell '+(S.dark?'dark':'')+'">'+header+'<main>'+content+'<footer>© 2026 ImageMate <span>•</span> Private file tools for everyone</footer></main></div>';
  createIcons({ icons, attrs: { 'stroke-width': 1.8 } });
  bind(); settings(); queue();

  const goHome=()=>{S.view='tools';S.files=[];render()};
  const brandHome=document.querySelector('#brand-home');
  if(brandHome)brandHome.onclick=goHome;
  const homeBtn=document.querySelector('#home-btn');
  if(homeBtn) homeBtn.onclick=goHome;
  const settingsBtn=document.querySelector('#settings-btn');
  if(settingsBtn) settingsBtn.onclick=()=>{S.view='settings';S.files=[];render()};
  const refreshUpdate=document.querySelector('#refresh-update-btn');
  if(refreshUpdate) refreshUpdate.onclick=async()=>{
    if(refreshUpdate.disabled)return;
    refreshUpdate.disabled=true;
    refreshUpdate.setAttribute('aria-busy','true');
    refreshUpdate.innerHTML='<i data-lucide="loader-circle"></i><span class="nav-text">Checking…</span>';
    createIcons({icons,attrs:{'stroke-width':1.8}});
    try{
      if(isNativeAndroid()){
        await checkForAndroidUpdate(true);
      }else{
        alert('Update refresh is available in the Android app.');
      }
    }finally{
      refreshUpdate.disabled=false;
      refreshUpdate.removeAttribute('aria-busy');
      refreshUpdate.innerHTML='<i data-lucide="refresh-cw"></i><span class="nav-text">Refresh</span>';
      createIcons({icons,attrs:{'stroke-width':1.8}});
    }
  };
  const openDownloads=document.querySelector('#open-downloads');
  if(openDownloads) openDownloads.onclick=()=>{S.view='downloads';S.files=[];render()};
  const defaultFormat=document.querySelector('#default-format');
  if(defaultFormat) defaultFormat.onchange=e=>{S.format=e.target.value;localStorage.setItem('imagemate-format',S.format)};
  const defaultQuality=document.querySelector('#default-quality');
  if(defaultQuality) defaultQuality.oninput=e=>{S.quality=e.target.value/100;localStorage.setItem('imagemate-quality',String(S.quality));const out=document.querySelector('#default-quality-value');if(out)out.textContent=e.target.value+'%'};
  const updateSetting=document.querySelector('#update-setting');
  if(updateSetting) updateSetting.onchange=e=>localStorage.setItem('imagemate-auto-update',e.target.checked?'1':'0');
  const back=document.querySelector('#back-home');
  if(back) back.onclick=()=>{S.view='tools';S.files=[];render()};
  const backSettings=document.querySelector('#back-settings');
  if(backSettings) backSettings.onclick=()=>{S.view='tools';S.files=[];render()};
  const pro=document.querySelector('.pro');
  if(pro) pro.onclick=()=>alert('ImageMate PRO is coming soon. All core tools are currently available for free.');
  if(downloads) renderDownloads();
  checkForAndroidUpdate(); startUpdateMonitor(); initNativeAds().catch(()=>{});
}
function showInstantUpdatePopup(version, mode='download'){
  if(document.querySelector('#update-popup'))return;
  if(mode==='download'&&localStorage.getItem('imagemate-update-dismissed-version')===String(version))return;
  const installMode=mode==='install';
  const overlay=document.createElement('div');
  overlay.id='update-popup';
  overlay.innerHTML='<div style="position:fixed;inset:0;z-index:99999;background:rgba(7,8,18,.62);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px">'+
    '<div style="width:min(440px,100%);background:var(--editorial-surface,#fff);color:var(--editorial-text,#111);border-radius:24px;padding:26px;box-shadow:0 24px 80px rgba(0,0,0,.35)">'+
    '<div style="font-size:34px;margin-bottom:8px"><i data-lucide="sparkles"></i></div>'+
    '<div style="font-size:12px;font-weight:800;letter-spacing:.12em;opacity:.65">IMAGEMATE UPDATE</div>'+
    '<h2 style="margin:7px 0 8px">New version '+esc(version)+' is available</h2>'+
    '<p id="update-status-text" style="margin:0 0 20px;line-height:1.55;opacity:.72">'+(installMode?'The update is already downloaded and ready to install.':'A new ImageMate version is ready. Update now to download it securely in the background. Tap Install now when the download completes.')+'</p>'+
    '<div style="display:flex;gap:10px;justify-content:flex-end">'+
    '<button id="update-later" class="secondary">Later</button>'+
    '<button id="update-now" class="primary">'+(installMode?'Install now':'Update now')+'</button>'+
    '</div></div></div>';
  document.body.appendChild(overlay);
  createIcons({icons,attrs:{'stroke-width':1.8}});
  const close=()=>{
    if(!installMode)localStorage.setItem('imagemate-update-dismissed-version',String(version));
    overlay.remove();
  };
  document.querySelector('#update-later').onclick=close;
  document.querySelector('#update-now').onclick=async()=>{
    const btn=document.querySelector('#update-now'), statusText=document.querySelector('#update-status-text');if(!btn)return;
    btn.disabled=true;btn.textContent=installMode?'Opening installer…':'Starting download…';
    try{
      if(installMode){
        localStorage.setItem('imagemate-update-installing','1');
        localStorage.setItem('imagemate-update-install-started-at',String(Date.now()));
        const installResult=await installDownloadedAndroidUpdate(version);
        if(installResult?.needsPermission){
          localStorage.removeItem('imagemate-update-installing');
          localStorage.removeItem('imagemate-update-install-started-at');
          btn.disabled=false;
          btn.textContent='Install now';
          if(statusText)statusText.textContent='Allow ImageMate to install unknown apps in Android settings, then tap Install now again.';
          return;
        }
        overlay.remove();
        return;
      }
      await downloadLatestAndroidUpdate(latestUpdateUrl,version);
      btn.textContent='Downloading…';
      if(statusText)statusText.textContent='Downloading the APK in the background. Please keep ImageMate open for automatic installation.';
      const started=Date.now();
      const timer=setInterval(async()=>{
        try{
          const s=await getAndroidUpdateStatus();
          if(s?.status==='complete'){
            clearInterval(timer);
            btn.textContent='Install now';
            btn.disabled=false;
            if(statusText)statusText.textContent='Download complete. Tap Install now to continue.';
            // Do not launch the Android installer automatically. Keep ImageMate open until the user explicitly taps Install now.
          }else if(s?.status==='failed'||s?.status==='error'){
            clearInterval(timer);
            btn.disabled=false;btn.textContent='Retry update';
            if(statusText)statusText.textContent='Download failed. Please tap Retry update.';
          }else if(s?.status==='downloading'&&s.total>0){
            const pct=Math.min(100,Math.round((s.downloaded/s.total)*100));
            btn.textContent='Downloading '+pct+'%';
            if(statusText)statusText.textContent='Downloading ImageMate update… '+pct+'%';
          }else if(Date.now()-started>10*60*1000){
            clearInterval(timer);
            btn.disabled=false;btn.textContent='Retry update';
            if(statusText)statusText.textContent='Download is taking too long. Please retry.';
          }
        }catch(e){}
      },800);
    }catch(e){
      console.error(e);btn.disabled=false;btn.textContent='Retry update';
      if(statusText)statusText.textContent='Unable to start update: '+(e?.message||'Download Manager rejected the request.')+' Tap Retry update.';
    }
  };
  if(navigator.vibrate)navigator.vibrate([250,120,250]);
}
async function checkForAndroidUpdate(force=false){
  if(!isNativeAndroid()||updateCheckInFlight||(!force&&localStorage.getItem('imagemate-auto-update')==='0'))return;
  const now=Date.now();
  const minGap=force?UPDATE_MANUAL_CHECK_MS:UPDATE_AUTO_CHECK_MS;
  if(now-lastUpdateCheckAt<minGap)return;
  lastUpdateCheckAt=now;
  localStorage.setItem('imagemate-last-update-check',String(lastUpdateCheckAt));
  updateCheckInFlight=true;
  try{
    const nativeVersion=await getAndroidAppVersion().catch(()=>({version:APP_VERSION}));
    runtimeAppVersion=String(nativeVersion?.version||APP_VERSION);
    const b=document.querySelector('#update-btn');
    const r=await fetch(UPDATE_API+'?imagemate='+Date.now(),{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
    if(!r.ok)return;
    const release=await r.json();
    const latest=String(release.tag_name||'').replace(/^v/i,'');
    const asset=Array.isArray(release.assets)?release.assets.find(a=>a&&a.name==='ImageMate.apk'&&a.browser_download_url):null;
    if(!latest||!asset){
      if(b){b.hidden=true;b.disabled=false}
      return;
    }
    latestUpdateUrl=asset.browser_download_url;

    const installing=localStorage.getItem('imagemate-update-installing')==='1';
    const installStarted=Number(localStorage.getItem('imagemate-update-install-started-at')||0);
    if(installing){
      if(!isNewerVersion(latest,runtimeAppVersion)||installStarted&&Date.now()-installStarted>30*60*1000){
        localStorage.removeItem('imagemate-update-installing');
        localStorage.removeItem('imagemate-update-install-started-at');
      }else{
        if(b){b.hidden=true;b.disabled=true}
        return;
      }
    }

    if(!isNewerVersion(latest,runtimeAppVersion)){
      localStorage.removeItem('imagemate-update-installing');
      localStorage.removeItem('imagemate-update-install-started-at');
      if(b){b.hidden=true;b.disabled=false}
      return;
    }

    const ready=await hasDownloadedAndroidUpdate(latest).catch(()=>({ready:false}));
    if(ready?.ready&&b){
      b.hidden=false;b.disabled=false;b.textContent='Install update';
      b.onclick=async()=>{
        b.disabled=true;b.textContent='Installing…';
        localStorage.setItem('imagemate-update-installing','1');
        localStorage.setItem('imagemate-update-install-started-at',String(Date.now()));
        try{
          const installResult=await installDownloadedAndroidUpdate(latest);
          if(installResult?.needsPermission){
            localStorage.removeItem('imagemate-update-installing');
            localStorage.removeItem('imagemate-update-install-started-at');
            b.disabled=false;b.textContent='Install update';
            return;
          }
        }catch(e){
          console.error(e);
          localStorage.removeItem('imagemate-update-installing');
          localStorage.removeItem('imagemate-update-install-started-at');
          b.disabled=false;b.textContent='Install update';
        }
      };
      showInstantUpdatePopup(latest,'install');
      return;
    }

    const status=await getAndroidUpdateStatus().catch(()=>({status:'none',downloaded:0,total:0}));
    if(['pending','downloading','paused'].includes(status?.status)){
      if(b){
        b.hidden=false;b.disabled=true;
        const pct=status.total>0?Math.min(100,Math.round((status.downloaded/status.total)*100)):0;
        b.textContent=status.status==='downloading'&&status.total>0?'Downloading '+pct+'%':'Update downloading…';
      }
      return;
    }

    if(b){
      b.hidden=false;b.disabled=false;b.textContent='Update available';
      b.onclick=async()=>{
        b.disabled=true;b.textContent='Downloading…';
        try{
          await downloadLatestAndroidUpdate(latestUpdateUrl,latest);
          localStorage.removeItem('imagemate-update-dismissed-version');
          b.textContent='Update downloading…';
        }catch(e){
          console.error(e);
          b.disabled=false;b.textContent='Update available';
          alert('Unable to start update: '+(e?.message||'Download Manager rejected the request.'));
        }
      };
    }

    if(localStorage.getItem('imagemate-update-dismissed-version')!==latest){
      showInstantUpdatePopup(latest,'download');
    }
    if(localStorage.getItem('imagemate-update-notified-version')!==latest){
      try{
        const notificationPermission=await requestAndroidNotificationPermission();
        if(notificationPermission?.granted===true){
          const notificationResult=await notifyAndroidUpdate(latest);
          if(notificationResult?.notified!==false)localStorage.setItem('imagemate-update-notified-version',latest);
        }
      }catch(e){console.debug('Update notification skipped',e)}
    }
  }catch(e){console.debug('ImageMate update check skipped',e)}
  finally{updateCheckInFlight=false}
}
function startUpdateMonitor(){
  if(updateMonitorStarted||!isNativeAndroid())return;
  updateMonitorStarted=true;
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState!=='visible')return;
    if(localStorage.getItem('imagemate-update-installing')==='1'){
      localStorage.removeItem('imagemate-update-installing');
      localStorage.removeItem('imagemate-update-install-started-at');
    }
    checkForAndroidUpdate();
  });
  setInterval(()=>{if(document.visibilityState==='visible')checkForAndroidUpdate()},60000);
}

function isNewerVersion(latest,current){
  const a=String(latest).split('.').map(n=>parseInt(n,10)||0),b=String(current).split('.').map(n=>parseInt(n,10)||0);
  for(let i=0;i<Math.max(a.length,b.length);i++){if((a[i]||0)>(b[i]||0))return true;if((a[i]||0)<(b[i]||0))return false}
  return false;
}
function bind(){
  const theme=document.querySelector('#theme');
  if(theme)theme.onclick=()=>{S.dark=!S.dark;localStorage.setItem('imagemate-dark',S.dark?'1':'0');render()};
  if(S.view==='downloads'||S.view==='settings') return;
  document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{S.tool=b.dataset.tool;S.files=[];S.view='tool';render()});
  document.querySelectorAll('[data-editorial-nav]').forEach(b=>b.onclick=()=>{const nav=b.dataset.editorialNav;if(nav==='home'){S.view='tools';S.files=[];render()}else if(nav==='recent'){S.view='downloads';S.files=[];render()}else if(nav==='settings'){S.view='settings';S.files=[];render()}});
  const search=document.querySelector('#tool-search');
  if(search)search.oninput=e=>{const q=String(e.target.value||'').trim().toLowerCase();document.querySelectorAll('.editorial-tool').forEach(b=>{b.hidden=!!q&&!b.textContent.toLowerCase().includes(q)})};
  const viewAll=document.querySelector('#view-all-tools');
  if(viewAll)viewAll.onclick=()=>{if(search){search.value='';search.focus();document.querySelectorAll('.editorial-tool').forEach(b=>b.hidden=false)}};
  const choose=document.querySelector('#choose');
  if(choose)choose.onclick=()=>document.querySelector('#file').click();
  const fileInput=document.querySelector('#file');
  if(!fileInput)return;
  fileInput.onchange=e=>load(e.target.files);
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
  q.querySelectorAll('img').forEach(imgEl=>{const src=imgEl.currentSrc||imgEl.src;if(src)URL.revokeObjectURL(src)});
  q.innerHTML=S.files.map((f,i)=>'<div class="file-row"><div class="thumb">'+((S.tool==='pdf2image'||S.tool==='pdfmerge')?'<i data-lucide="file-text"></i>':'<img src="'+URL.createObjectURL(f)+'">')+'</div><div class="file-meta"><b>'+esc(f.name)+'</b><span>'+label(f.type)+' • '+size(f.size)+'</span></div><button class="remove" data-i="'+i+'" aria-label="Remove file"><i data-lucide="x"></i></button></div>').join('');createIcons({icons,attrs:{'stroke-width':1.8}});
  q.querySelectorAll('.remove').forEach(b=>b.onclick=()=>{S.files.splice(+b.dataset.i,1);queue()});
  if(S.files.length){q.insertAdjacentHTML('beforeend','<div class="actionbar"><span><b>'+S.files.length+'</b> '+((S.tool==='pdf2image'||S.tool==='pdfmerge')?'PDF':'file')+(S.files.length>1?'s':'')+' ready</span><button id="clear" class="remove">Clear</button>'+(S.files.length>1&&!['pdf','pdf2image','ocr','exif','background','editor'].includes(S.tool)?'<button id="zip" class="secondary">Download ZIP</button>':'')+'<button id="process" class="primary">'+(S.tool==='ocr'?'Extract Text':(S.tool==='pdf2image'||S.tool==='pdfmerge')?'Convert PDFs':'Process & Download')+'</button></div>');document.querySelector('#clear').onclick=()=>{S.files=[];queue()};const zip=document.querySelector('#zip');if(zip)zip.onclick=processBatchZip;document.querySelector('#process').onclick=process}
}
function settings(){
  const s=document.querySelector('#settings');if(!s)return;let h='';
  if(S.tool==='convert')h='<label>Output format<select id="format"><option value="image/webp" '+(S.format==='image/webp'?'selected':'')+'>WebP — recommended</option><option value="image/jpeg" '+(S.format==='image/jpeg'?'selected':'')+'>JPG</option><option value="image/png" '+(S.format==='image/png'?'selected':'')+'>PNG</option><option value="image/avif" '+(S.format==='image/avif'?'selected':'')+'>AVIF</option></select></label>';
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
function canvasToBlob(canvas,type,quality){
  return new Promise((resolve,reject)=>{
    canvas.toBlob(blobValue=>{
      if(blobValue)resolve(blobValue);
      else reject(new Error(type==='image/avif'?'AVIF is not supported by this browser. Choose WebP, JPG or PNG.':'The browser could not create the requested output file.'));
    },type,quality);
  });
}
function blob(i,type,q,w,h){
  const c=document.createElement('canvas');
  c.width=w||i.naturalWidth;
  c.height=h||i.naturalHeight;
  const ctx=c.getContext('2d');
  if(!ctx)throw new Error('Canvas processing is unavailable in this browser.');
  ctx.drawImage(i,0,0,c.width,c.height);
  return canvasToBlob(c,type,q);
}
function history(){try{return JSON.parse(localStorage.getItem('imagemate-history')||'[]')}catch{return[]}}
function addHistory(name,tool,sizeBytes,extra={}){const h=history();h.unshift({name,tool,size:sizeBytes,at:new Date().toISOString(),...extra});localStorage.setItem('imagemate-history',JSON.stringify(h.slice(0,50)))}
async function nativeDownloadedFiles(){if(!isNativeAndroid())return history();try{const r=await ImageMateUpdaterList();return r?.files||[]}catch{return history()}}
async function ImageMateUpdaterList(){return (await import('./updater.js')).listDownloadedFiles()}
async function openDownloadedFile(path){try{await (await import('./updater.js')).openDownloadedFile(path)}catch(e){console.error(e);const msg=e?.message||e?.errorMessage||'No compatible app is installed for this file type.';alert('Unable to open this file.\\n\\n'+msg)}}
async function shareDownloadedFile(path){try{await (await import('./updater.js')).shareDownloadedFile(path)}catch(e){console.error(e);const msg=e?.message||e?.errorMessage||'No compatible sharing app is available.';alert('Unable to share this file.\\n\\n'+msg)}}
async function exportDownloadedFile(path,name,mime){try{await (await import('./updater.js')).exportDownloadedFile(path,name,mime);showResult('File saved','A copy was saved to your device Downloads folder.')}catch(e){console.error(e);alert('Unable to save another copy.')}}
async function renderDownloads(){
  const workspace=document.querySelector('#download-library'); if(!workspace)return;
  workspace.innerHTML='<div class="downloads-head"><div><p class="eyebrow">YOUR FILES</p><h2>File library</h2><p class="downloads-sub">Open, share or save another copy of files created by ImageMate.</p></div><button id="refresh-downloads" class="secondary">Refresh</button></div><div id="downloaded-list" class="downloaded-list"><div class="empty-downloads">Loading files…</div></div>';
  const list=await nativeDownloadedFiles(); const el=document.querySelector('#downloaded-list'); if(!el)return;
  if(!list.length){el.innerHTML='<div class="empty-downloads"><b>No downloaded files yet</b><span>Processed files will appear here automatically.</span></div>';return}
  const nativeLibrary=isNativeAndroid();
  el.innerHTML=list.map((f,i)=>'<article class="download-item"><div class="download-icon"><i data-lucide="file-check-2"></i></div><div class="download-info"><b>'+esc(f.name||('File '+(i+1)))+'</b><span>'+(f.mime?label(f.mime)+' • ':'')+(f.size?size(+f.size)+' • ':'')+(f.at?new Date(f.at).toLocaleString():'')+'</span></div><div class="download-actions">'+(nativeLibrary?'<button class="secondary open-file" data-path="'+esc(f.path)+'">Open</button><button class="secondary share-file" data-path="'+esc(f.path)+'">Share</button><button class="primary save-copy" data-path="'+esc(f.path)+'" data-name="'+esc(f.name||'ImageMate-file')+'" data-mime="'+esc(f.mime||'application/octet-stream')+'">Download again</button>':'<span class="browser-history-note">Browser download history</span>')+'</div></article>').join('');
  if(nativeLibrary){
    el.querySelectorAll('.open-file').forEach(b=>b.onclick=()=>openDownloadedFile(b.dataset.path));
    el.querySelectorAll('.share-file').forEach(b=>b.onclick=()=>shareDownloadedFile(b.dataset.path));
    el.querySelectorAll('.save-copy').forEach(b=>b.onclick=()=>exportDownloadedFile(b.dataset.path,b.dataset.name,b.dataset.mime));
  }
  const rb=document.querySelector('#refresh-downloads'); if(rb)rb.onclick=renderDownloads;
}
function setProgress(percent,label='Processing'){const q=document.querySelector('#progress-wrap');if(!q)return;const p=Math.max(0,Math.min(100,Math.round(percent)));const bar=q.querySelector('.progress-bar');const text=q.querySelector('.progress-text');if(bar)bar.style.width=p+'%';if(text)text.textContent=label+' '+p+'%'}
function blobBase64(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]||'');r.onerror=reject;r.readAsDataURL(blob)})}
async function dl(b,n,mime){if(!b)return;const type=mime||b.type||'application/octet-stream';if(isNativeAndroid()){try{const saved=await saveProcessedFile(n,type,await blobBase64(b));addHistory(n,S.tool,b.size,{path:saved?.path||'',mime:type});return}catch(e){console.warn('Native save failed, falling back to browser download',e)}}const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();addHistory(n,S.tool,b.size);setTimeout(()=>URL.revokeObjectURL(u),1500)}
function canvasFor(i,w,h){
  const c=document.createElement('canvas');c.width=w||i.naturalWidth;c.height=h||i.naturalHeight;
  const ctx=c.getContext('2d');if(!ctx)throw new Error('Canvas processing is unavailable in this browser.');
  ctx.drawImage(i,0,0,c.width,c.height);return c
}
async function pdf(files){const {jsPDF}=await import('jspdf');const doc=new jsPDF({unit:'mm',format:'a4'});for(let n=0;n<files.length;n++){if(n)doc.addPage();const i=await img(files[n]);const c=canvasFor(i);const maxW=190,maxH=277,scale=Math.min(maxW/c.width,maxH/c.height);const w=c.width*scale,h=c.height*scale;const x=(210-w)/2,y=(297-h)/2;const data=c.toDataURL('image/jpeg',.92);doc.addImage(data,'JPEG',x,y,w,h)}await dl(doc.output('blob'),'imagemate-images.pdf','application/pdf')}
function name(n,e){return n.replace(/\.[^.]+$/,'')+'.'+e}
function toolDimensions(i){
  const width=Number(S.width)||0;
  const height=Number(S.height)||0;
  const presets={passport:[413,531],signature:[600,200]};
  if(presets[S.tool]){
    const [dw,dh]=presets[S.tool];
    if(!width&&!height)return [dw,dh];
    if(width&&!height)return [Math.max(1,Math.round(width)),Math.max(1,Math.round(width*dh/dw))];
    if(height&&!width)return [Math.max(1,Math.round(height*dw/dh)),Math.max(1,Math.round(height))];
    return [Math.max(1,Math.round(width)),Math.max(1,Math.round(height))];
  }
  if(['resize','crop'].includes(S.tool)){
    if(width&&!height)return [Math.max(1,Math.round(width)),Math.max(1,Math.round(i.naturalHeight*width/i.naturalWidth))];
    if(height&&!width)return [Math.max(1,Math.round(i.naturalWidth*height/i.naturalHeight)),Math.max(1,Math.round(height))];
    return [Math.max(1,Math.round(width||i.naturalWidth)),Math.max(1,Math.round(height||i.naturalHeight))];
  }
  return [i.naturalWidth,i.naturalHeight];
}

async function processBatchZip(){if(!S.files.length)return alert('Choose at least one image.');const btn=document.querySelector('#zip');btn.disabled=true;btn.textContent='Creating ZIP…';try{const {default:JSZip}=await import('jszip');const zip=new JSZip();for(const f of S.files){const i=await img(f);const [w,h]=toolDimensions(i);let type=S.tool==='convert'?S.format:'image/jpeg';let b=S.tool==='crop'?await cropBlob(i,w,h,S.rotation,type,S.quality):await blob(i,type,S.quality,w,h);if(S.tool==='target'){const max=S.target*1024;let lo=.05,hi=.95;for(let x=0;x<10&&b.size>max;x++){const qq=(lo+hi)/2;b=await blob(i,'image/jpeg',qq,w,h);if(b.size>max)hi=qq;else lo=qq}}zip.file(name(f.name,label(type).toLowerCase()),b)}dl(await zip.generateAsync({type:'blob',compression:'DEFLATE'}),'imagemate-'+S.tool+'-batch.zip');await maybeShowTestInterstitial()}catch(e){console.error(e);alert('Could not create the ZIP. Please try fewer or smaller images.')}finally{btn.disabled=false;btn.textContent='Download ZIP'}}
async function process(){
  if(!S.files.length)return alert((S.tool==='pdf2image'||S.tool==='pdfmerge')?'Choose at least one PDF.':'Choose at least one file.');
  const btn=document.querySelector('#process');if(btn){btn.disabled=true;btn.textContent='Processing…'}
  const progress=document.querySelector('#progress-wrap');if(progress)progress.hidden=false;setProgress(0,'Processing');
  try{
    if(S.tool==='pdf'){await pdf(S.files);setProgress(100,'Downloaded');showResult('PDF created','Your PDF has been downloaded and saved to local history.');return}
    if(S.tool==='pdfmerge'){await mergePdfs(S.files);setProgress(100,'Downloaded');showResult('PDFs merged','Your combined PDF has been downloaded.');return}
    if(['pdf2image','ocr','exif','background'].includes(S.tool)){
      const ocrResults=[];
      for(let n=0;n<S.files.length;n++){
        const result=await convertSpecial(S.files[n],S.tool);
        if(S.tool==='ocr'&&result&&typeof result.text==='string')ocrResults.push(result);
        setProgress(((n+1)/S.files.length)*100,'Downloaded');
      }
      if(S.tool==='ocr'){
        const combinedText=ocrResults.map(x=>'===== '+x.name+' =====\n'+(x.text.trim()||'No text detected.')).join('\n\n');
        showResult('OCR complete','<textarea id="ocr-output" rows="12">'+esc(combinedText||'No text detected.')+'</textarea><div class="result-actions"><button class="secondary" id="download-ocr">Download TXT</button></div>');
        const downloadOcr=document.querySelector('#download-ocr');
        if(downloadOcr)downloadOcr.onclick=()=>dl(new Blob([combinedText||'No text detected.'],{type:'text/plain;charset=utf-8'}),S.files.length===1?S.files[0].name.replace(/\.[^.]+$/,'')+'-ocr.txt':'imagemate-ocr.txt','text/plain;charset=utf-8');
      }else{
        showResult('Files ready','Your processed files were downloaded and saved to local history.');
      }
      return;
    }
    for(let n=0;n<S.files.length;n++){
      const f=S.files[n];
      const i=await img(f);
      const [w,h]=toolDimensions(i);
      let type=S.tool==='convert'?S.format:'image/jpeg';
      let b;
      if(S.tool==='editor') b=await editBlob(i,S.brightness,S.contrast,S.rotation);
      else if(S.tool==='crop') b=await cropBlob(i,w,h,S.rotation,type,S.quality);
      else b=await blob(i,type,S.quality,w,h);
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
  return canvasToBlob(c,'image/jpeg',.92);
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
  await dl(doc.output('blob'),'imagemate-merged.pdf','application/pdf');
}

function rotatedBlob(i,deg,type,q){
  const swap=deg%180!==0,c=document.createElement('canvas');c.width=swap?i.naturalHeight:i.naturalWidth;c.height=swap?i.naturalWidth:i.naturalHeight;
  const x=c.getContext('2d');x.translate(c.width/2,c.height/2);x.rotate(deg*Math.PI/180);x.drawImage(i,-i.naturalWidth/2,-i.naturalHeight/2);
  return canvasToBlob(c,type,q);
}
function cropBlob(i,targetW,targetH,deg,type,q){
  const angle=((Number(deg)||0)%360+360)%360, swap=angle===90||angle===270;
  const rw=swap?i.naturalHeight:i.naturalWidth, rh=swap?i.naturalWidth:i.naturalHeight;
  let w=Number(targetW)||rw, h=Number(targetH)||Math.round(w*rh/rw);
  if(!targetW&&targetH) { h=Number(targetH); w=Math.round(h*rw/rh); }
  w=Math.max(1,Math.round(w)); h=Math.max(1,Math.round(h));
  const scale=Math.max(w/rw,h/rh);
  const drawW=i.naturalWidth*scale, drawH=i.naturalHeight*scale;
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const x=c.getContext('2d'); x.translate(w/2,h/2); x.rotate(angle*Math.PI/180);
  x.drawImage(i,-drawW/2,-drawH/2,drawW,drawH);
  return canvasToBlob(c,type,q);
}
function showResult(title,body){
  const old=document.querySelector('.result-card');if(old)old.remove();
  const workspace=document.querySelector('.workspace');
  if(!workspace)return;
  workspace.insertAdjacentHTML('beforeend','<div class="result-card"><div class="result-head"><b>'+esc(title)+'</b><span class="success"><i data-lucide="circle-check"></i> Done</span></div><div class="result-body">'+body+'</div></div>');
  createIcons({icons,attrs:{'stroke-width':1.8}});
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
      const out=await canvasToBlob(canvas,S.pdfFormat,S.pdfFormat==='image/jpeg'?.92:undefined);
      await dl(out,file.name.replace(/\.pdf$/i,'')+'-page-'+pageNo+'.'+(S.pdfFormat==='image/png'?'png':'jpg'),S.pdfFormat);
    }
    return;
  }
  if(kind==='ocr'){
    const {createWorker}=await import('tesseract.js');
    const worker=await createWorker('eng');
    try{
      const result=await worker.recognize(await normalizeImageFile(file));
      const text=result.data.text.trim();
      return {name:file.name,text};
    }finally{await worker.terminate()}
  }
  if(kind==='exif'){
    const i=await img(file),out=await canvasToBlob(canvasFor(i),'image/png');
    await dl(out,file.name.replace(/\.[^.]+$/,'')+'-clean.png','image/png');
    return;
  }
  if(kind==='background'){
    const i=await img(file),c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;
    const x=c.getContext('2d');x.drawImage(i,0,0);const d=x.getImageData(0,0,c.width,c.height),p=d.data;
    const samples=[];for(const [xx,yy] of [[0,0],[c.width-1,0],[0,c.height-1],[c.width-1,c.height-1]]){const n=(yy*c.width+xx)*4;samples.push([p[n],p[n+1],p[n+2]])}
    const bg=samples.reduce((a,b)=>a.map((v,j)=>v+b[j]/samples.length),[0,0,0]);
    for(let n=0;n<p.length;n+=4){const dist=Math.abs(p[n]-bg[0])+Math.abs(p[n+1]-bg[1])+Math.abs(p[n+2]-bg[2]);if(dist<42)p[n+3]=0}
    x.putImageData(d,0,0);const out=await canvasToBlob(c,'image/png');
    await dl(out,file.name.replace(/\.[^.]+$/,'')+'-background-removed.png','image/png');
  }
}

render();
