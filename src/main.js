import './style.css';

const app=document.querySelector('#app');
const tools=[
  ['convert','⇄','Convert','JPG, PNG, WebP, AVIF'],
  ['compress','◒','Compress','Reduce image size'],
  ['resize','↗','Resize','Dimensions & quality'],
  ['target','⌁','Target KB','20 / 50 / 100 / 200 KB'],
  ['pdf','▣','Image to PDF','Create a PDF locally'],
  ['passport','▦','Photo Size','Passport & ID sizes']
];
const S={tool:'convert',files:[],format:'image/webp',quality:.88,width:'',height:'',target:100,dark:false};

const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const label=t=>t==='image/jpeg'?'JPG':t==='image/png'?'PNG':t==='image/webp'?'WebP':t==='image/avif'?'AVIF':'Image';
const size=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';

function render(){
  const tool=tools.find(x=>x[0]===S.tool);
  app.innerHTML='<div class="shell '+(S.dark?'dark':'')+'"><header class="topbar"><div class="brand"><div class="logo">IM</div><div><b>ImageMate</b><span>Image & File Converter</span></div></div><div class="top-actions"><button id="theme" class="icon-btn">'+(S.dark?'☀':'☾')+'</button><button class="pro">Remove Ads <small>PRO</small></button></div></header><main><section class="hero"><div><p class="eyebrow">FAST • PRIVATE • BROWSER-BASED</p><h1>Everything you need to<br><em>work with images.</em></h1><p class="sub">Convert, compress, resize and prepare images for forms — without uploading your files.</p></div><div class="hero-badge"><strong>100%</strong><span>local processing</span></div></section><nav class="tool-grid">'+tools.map(t=>'<button class="tool '+(S.tool===t[0]?'active':'')+'" data-tool="'+t[0]+'"><span>'+t[1]+'</span><b>'+t[2]+'</b><small>'+t[3]+'</small></button>').join('')+'</nav><section class="workspace"><div class="workspace-head"><div><p class="eyebrow">WORKSPACE</p><h2>'+tool[2]+'</h2></div><span class="privacy">🔒 Files stay on your device</span></div><div id="drop" class="dropzone"><input id="file" type="file" accept="image/*" multiple hidden><div class="upload-icon">↑</div><h3>Drop images here</h3><p>or choose files from your device</p><button id="choose" class="primary">Choose Images</button><small>JPG, PNG, WebP, AVIF • Batch supported</small></div><div id="queue"></div><div id="settings"></div><div class="ad-slot"><span>ADVERTISEMENT</span></div></section><section class="feature-row"><div><b>Private by design</b><span>Images are processed in your browser.</span></div><div><b>Batch ready</b><span>Work with multiple images at once.</span></div><div><b>Mobile friendly</b><span>Install as a PWA on Android.</span></div></section></main><footer>© 2026 ImageMate <span>•</span> Free image tools for everyone</footer></div>';
  bind(); settings(); queue();
}
function bind(){
  document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{S.tool=b.dataset.tool;S.files=[];render()});
  document.querySelector('#theme').onclick=()=>{S.dark=!S.dark;render()};
  document.querySelector('#choose').onclick=()=>document.querySelector('#file').click();
  document.querySelector('#file').onchange=e=>load(e.target.files);
  const d=document.querySelector('#drop');
  d.addEventListener('dragover',e=>{e.preventDefault();d.classList.add('drag')});
  d.addEventListener('dragleave',()=>d.classList.remove('drag'));
  d.addEventListener('drop',e=>{e.preventDefault();d.classList.remove('drag');load(e.dataTransfer.files)});
}
function load(list){S.files=[...list].filter(f=>f.type.startsWith('image/'));queue()}
function queue(){
  const q=document.querySelector('#queue');if(!q)return;
  q.innerHTML=S.files.map((f,i)=>'<div class="file-row"><div class="thumb"><img src="'+URL.createObjectURL(f)+'"></div><div class="file-meta"><b>'+esc(f.name)+'</b><span>'+label(f.type)+' • '+size(f.size)+'</span></div><button class="remove" data-i="'+i+'">×</button></div>').join('');
  q.querySelectorAll('.remove').forEach(b=>b.onclick=()=>{S.files.splice(+b.dataset.i,1);queue()});
  if(S.files.length){q.insertAdjacentHTML('beforeend','<div class="actionbar"><span><b>'+S.files.length+'</b> image'+(S.files.length>1?'s':'')+' ready</span><button id="process" class="primary">Process & Download</button></div>');document.querySelector('#process').onclick=process}
}
function settings(){
  const s=document.querySelector('#settings');let h='';
  if(S.tool==='convert')h='<label>Output format<select id="format"><option value="image/webp">WebP — recommended</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/avif">AVIF</option></select></label>';
  if(['compress','target','resize','passport'].includes(S.tool)){
    if(S.tool==='resize'||S.tool==='passport')h+='<label>Width (px)<input id="width" type="number" placeholder="'+(S.tool==='passport'?'413':'Original')+'"></label><label>Height (px)<input id="height" type="number" placeholder="'+(S.tool==='passport'?'531':'Auto')+'"></label>';
    if(S.tool!=='passport')h+='<label>Quality <output id="qv">'+Math.round(S.quality*100)+'%</output><input id="quality" type="range" min="10" max="100" value="'+S.quality*100+'"></label>';
    if(S.tool==='target')h+='<label>Target size<select id="target"><option>20</option><option>50</option><option selected>100</option><option>200</option></select> KB</label>';
  }
  if(S.tool==='pdf')h='<div class="info">Images will be placed on A4 pages and downloaded as a PDF. Processing stays local.</div>';
  s.innerHTML=h;
  const f=document.querySelector('#format');if(f)f.onchange=e=>S.format=e.target.value;
  const q=document.querySelector('#quality');if(q)q.oninput=e=>{S.quality=e.target.value/100;document.querySelector('#qv').textContent=e.target.value+'%'};
  const w=document.querySelector('#width');if(w)w.oninput=e=>S.width=e.target.value;
  const ht=document.querySelector('#height');if(ht)ht.oninput=e=>S.height=e.target.value;
  const t=document.querySelector('#target');if(t)t.onchange=e=>S.target=+e.target.value;
}
function img(file){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=URL.createObjectURL(file)})}
function blob(i,type,q,w,h){const c=document.createElement('canvas');c.width=w||i.naturalWidth;c.height=h||i.naturalHeight;c.getContext('2d').drawImage(i,0,0,c.width,c.height);return new Promise(r=>c.toBlob(r,type,q))}
function dl(b,n){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}
function name(n,e){return n.replace(/\.[^.]+$/,'')+'.'+e}
async function process(){
  if(!S.files.length)return alert('Choose at least one image.');
  const btn=document.querySelector('#process');btn.disabled=true;btn.textContent='Processing…';
  try{
    for(const f of S.files){
      const i=await img(f);let w=i.naturalWidth,h=i.naturalHeight;
      if(S.tool==='resize'){w=+S.width||w;h=+S.height||Math.round(i.naturalHeight*w/i.naturalWidth)}
      if(S.tool==='passport'){w=+S.width||413;h=+S.height||531}
      if(S.tool==='pdf'){alert('PDF export is enabled in the next build; image conversion is ready now.');break}
      let type=S.tool==='convert'?S.format:'image/jpeg';let b=await blob(i,type,S.quality,w,h);
      if(S.tool==='target'){const max=S.target*1024;let lo=.05,hi=.95;for(let x=0;x<8&&b.size>max;x++){const qq=(lo+hi)/2;b=await blob(i,'image/jpeg',qq,w,h);if(b.size>max)hi=qq;else lo=qq}}
      dl(b,name(f.name,label(type).toLowerCase()));
    }
  }finally{btn.disabled=false;btn.textContent='Process & Download'}
}
render();