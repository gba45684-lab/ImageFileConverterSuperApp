import { initNativeAds, isAndroidNative, maybeShowTestInterstitial, maybeShowTestAppOpen } from './ads.js';
import { initWebAds } from './web-ads.js';
import { downloadLatestAndroidUpdate, installDownloadedAndroidUpdate, hasDownloadedAndroidUpdate, getAndroidUpdateStatus, notifyAndroidUpdate, requestAndroidNotificationPermission, getAndroidAppVersion, isNativeAndroid, saveProcessedFile } from './updater.js';
import packageJson from '../package.json';
import './style.css';
import './design-refresh.css';
import './catalog-refresh.css';
import './settings-refresh.css';
import './workspace-refresh.css';
import './results-refresh.css';
import './responsive-a11y-refresh.css';
import { createIcons, icons } from 'lucide';
import { initGitHubOta } from './ota.js';
import { runPdfTool, PDF_SUITE_TOOLS, PDF_SUITE_PDF_INPUTS } from './pdf-suite.js';

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
  ['pdfalternate','shuffle','Alternate & Mix PDFs','Interleave pages from multiple PDFs','DOCUMENT'],
  ['pdforganize','list-ordered','Organize PDF Pages','Reorder pages in a PDF','DOCUMENT'],
  ['pdfextract','files','Extract PDF Pages','Save selected pages','DOCUMENT'],
  ['pdfsplitpages','scissors','Split PDF by Pages','Split into page groups','DOCUMENT'],
  ['pdfsplitbookmarks','bookmark','Split by Bookmarks','Split at PDF bookmark sections','DOCUMENT'],
  ['pdfsplithalf','columns-2','Split PDF in Half','Create first and second halves','DOCUMENT'],
  ['pdfsplitsize','file-archive','Split PDF by Size','Make smaller page groups','DOCUMENT'],
  ['pdfsplittext','search','Split PDF by Text','Separate pages matching text','DOCUMENT'],
  ['pdfedit','file-pen-line','Edit PDF — Add Text','Place new text over selected pages','DOCUMENT'],
  ['pdfsign','signature','Fill & Sign PDF','Add typed signature and date','DOCUMENT'],
  ['pdfforms','form-input','Create Fillable Form','Generate a PDF with interactive fields','DOCUMENT'],
  ['pdfdelete','file-minus','Delete PDF Pages','Remove selected pages','DOCUMENT'],
  ['pdfcompress','file-down','Compress PDF','Lossless document compression','DOCUMENT'],
  ['pdfprotect','lock-keyhole','Protect PDF','Encrypt with an opening password','DOCUMENT'],
  ['pdfunlock','lock-keyhole-open','Unlock PDF','Remove password after verification','DOCUMENT'],
  ['pdfwatermark','stamp','Watermark PDF','Stamp text across PDF pages','DOCUMENT'],
  ['pdfflatten','layers','Flatten PDF','Flatten form and annotation appearances','DOCUMENT'],
  ['pdfexcel','file-spreadsheet','PDF to Excel','Extract PDF text into spreadsheet rows','DOCUMENT'],
  ['pdfppt','presentation','PDF to PowerPoint','Create one visual slide per PDF page','DOCUMENT'],
  ['pdftext','file-text','PDF to Text','Extract selectable PDF text','DOCUMENT'],
  ['pdftoword','file-type','PDF to Word','Export extracted text as DOCX','DOCUMENT'],
  ['htmltopdf','file-code','HTML to PDF','Convert HTML text content to PDF','DOCUMENT'],
  ['wordtopdf','file-output','Word to PDF','Convert DOCX text content to PDF','DOCUMENT'],
  ['editor','sliders-horizontal','Photo Editor','Brightness, contrast & rotate','IMAGE']
];
const catalogGroups=[{"id":"pdf-core","label":"PDF essentials","title":"PDF essentials","description":"Merge, mix, create PDFs from images, or export PDF pages as images.","tools":["pdf","pdf2image","pdfmerge","pdfalternate"]},{"id":"pdf-organize","label":"Organize & split","title":"Organize & split","description":"Reorder pages, extract or remove pages, and split long documents into smaller files.","tools":["pdforganize","pdfextract","pdfdelete","pdfsplitpages","pdfsplitbookmarks","pdfsplithalf","pdfsplitsize","pdfsplittext"]},{"id":"pdf-edit","label":"Edit & sign","title":"Edit & sign","description":"Add text or a typed signature, apply watermarks, and create fillable forms.","tools":["pdfedit","pdfsign","pdfforms","pdfwatermark"]},{"id":"pdf-secure","label":"Security & optimize","title":"Security & optimize","description":"Protect or unlock documents, compress PDFs, and flatten form and annotation appearances.","tools":["pdfprotect","pdfunlock","pdfcompress","pdfflatten"]},{"id":"pdf-convert","label":"PDF conversion","title":"PDF conversion","description":"Move content between PDF, Word, Excel, PowerPoint and HTML.","tools":["pdfexcel","pdfppt","pdftoword","htmltopdf","wordtopdf"]},{"id":"text","label":"Text & OCR","title":"Text & OCR","description":"Extract selectable text from PDFs or recognize text inside images.","tools":["pdftext","ocr"]},{"id":"image","label":"Image tools","title":"Image tools","description":"Convert, compress, resize, crop, edit and prepare photos, signatures and images.","tools":["convert","compress","resize","target","passport","exif","signature","crop","background","editor"]}];
const catalogGroupByTool={"pdf":"pdf-core","pdf2image":"pdf-core","pdfmerge":"pdf-core","pdfalternate":"pdf-core","pdforganize":"pdf-organize","pdfextract":"pdf-organize","pdfdelete":"pdf-organize","pdfsplitpages":"pdf-organize","pdfsplitbookmarks":"pdf-organize","pdfsplithalf":"pdf-organize","pdfsplitsize":"pdf-organize","pdfsplittext":"pdf-organize","pdfedit":"pdf-edit","pdfsign":"pdf-edit","pdfforms":"pdf-edit","pdfwatermark":"pdf-edit","pdfprotect":"pdf-secure","pdfunlock":"pdf-secure","pdfcompress":"pdf-secure","pdfflatten":"pdf-secure","pdfexcel":"pdf-convert","pdfppt":"pdf-convert","pdftoword":"pdf-convert","htmltopdf":"pdf-convert","wordtopdf":"pdf-convert","pdftext":"text","ocr":"text","convert":"image","compress":"image","resize":"image","target":"image","passport":"image","exif":"image","signature":"image","crop":"image","background":"image","editor":"image"};
const catalogCategoryButtons=[{id:'All',label:'All tools'},...catalogGroups.map(group=>({id:group.id,label:group.label}))];
const catalogSearchAliases={
  pdf:'make pdf from images photo to pdf jpg to pdf',pdf2image:'export pdf pages as png jpg image',pdfmerge:'join combine concatenate pdf documents',
  pdfalternate:'collate interleave alternating pages two-sided scan',pdforganize:'reorder rearrange sort page sequence',pdfextract:'save selected pages excerpt',
  pdfdelete:'remove delete unwanted pages',pdfsplitpages:'separate page count chunks',pdfsplitbookmarks:'split chapters outline bookmarks',
  pdfsplithalf:'divide document into two halves',pdfsplitsize:'split file size limit mb',pdfsplittext:'separate search matching text pages',
  pdfedit:'annotate add text markup',pdfsign:'typed signature date stamp sign',pdfforms:'fillable form fields form builder',
  pdfwatermark:'stamp confidential overlay',pdfprotect:'encrypt password lock secure',pdfunlock:'decrypt remove password locked pdf',
  pdfcompress:'reduce size optimize lossless',pdfflatten:'flatten annotations interactive form fields',
  pdfexcel:'spreadsheet xlsx table extract',pdfppt:'slides presentation pptx',pdftext:'extract searchable selectable text txt',
  pdftoword:'docx word document export',htmltopdf:'web page html to pdf',wordtopdf:'docx word to pdf',
  ocr:'recognize text from image photo scan',exif:'strip metadata privacy location camera',signature:'resize signature image for forms',
  passport:'id picture photo dimensions',target:'target file size kb',background:'remove erase image background',crop:'crop rotate image',
  editor:'brightness contrast photo editing',convert:'image format transform jpg png webp avif',compress:'reduce image file size optimize',resize:'image dimensions scale'
};
const toolById=Object.fromEntries(tools.map(tool=>[tool[0],tool]));
const savedFormat=localStorage.getItem('imagemate-format');
const allowedFormats=['image/webp','image/jpeg','image/png','image/avif'];
const storedQuality=Number(localStorage.getItem('imagemate-quality'));
const safeQuality=Number.isFinite(storedQuality)?Math.min(1,Math.max(.1,storedQuality)):.88;
const S={tool:'convert',files:[],format:allowedFormats.includes(savedFormat)?savedFormat:'image/webp',quality:safeQuality,width:'',height:'',target:100,pdfFormat:'image/png',pdfScale:1.5,rotation:0,brightness:0,contrast:0,previewIndex:0,dark:localStorage.getItem('imagemate-dark')==='1',catalogCategory:'All',mobileTab:'home',view:'tools'};

const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const label=t=>t==='application/pdf'?'PDF':t==='image/jpeg'?'JPG':t==='image/png'?'PNG':t==='image/webp'?'WebP':t==='image/avif'?'AVIF':t==='image/heic'?'HEIC':t==='image/heif'?'HEIF':t==='text/plain'||String(t).startsWith('text/')?'TXT':t==='application/zip'?'ZIP':'Image';
const size=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';
function catalogToolMarkup(t){
  const category=catalogGroupByTool[t[0]]||'other';
  const group=catalogGroups.find(item=>item.id===category);
  return '<button type="button" class="catalog-tool-row" data-tool="'+t[0]+'" data-category="'+category+'" data-search="'+esc([t[0],group?.label||'',t[2],t[3],catalogSearchAliases[t[0]]||''].join(' '))+'"><span class="catalog-tool-icon"><i data-lucide="'+t[1]+'"></i></span><span class="catalog-tool-copy"><small>'+esc(group?.label||'TOOL')+'</small><b>'+esc(t[2])+'</b><span>'+esc(t[3])+'</span></span><i class="catalog-chevron" data-lucide="chevron-right"></i></button>';
}
function catalogGroupMarkup(group){
  const subset=group.tools.map(id=>toolById[id]).filter(Boolean);
  return '<section class="catalog-group" data-catalog-group="'+group.id+'"><header class="catalog-group-head"><div><p class="catalog-group-kicker">WORKFLOW</p><h2>'+esc(group.title)+'</h2><p>'+esc(group.description)+'</p></div><span class="catalog-group-count">'+subset.length+' tools</span></header><div class="catalog-tool-list">'+subset.map(catalogToolMarkup).join('')+'</div></section>';
}

function render(){
  document.querySelectorAll('#queue img').forEach(imgEl=>{const src=imgEl.currentSrc||imgEl.src;if(src)URL.revokeObjectURL(src)});
  const tool=tools.find(x=>x[0]===S.tool)||tools[0];
  const home=S.view==='tools', task=S.view==='tool', toolsScreen=S.view==='catalog', downloads=S.view==='downloads', settingsScreen=S.view==='settings';
  const accept=(S.tool==='pdf2image'||S.tool==='pdfmerge'||PDF_SUITE_PDF_INPUTS.includes(S.tool))?'application/pdf,.pdf':S.tool==='htmltopdf'?'text/html,.html,.htm':S.tool==='wordtopdf'?'.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document':S.tool==='pdfforms'?'':'image/*,.heic,.heif';
  const title=task?tool[2]:'All tools';
  const desc=task?tool[3]:'Choose a tool to get started';
  const documentTool=S.tool==='pdf2image'||S.tool==='pdfmerge'||PDF_SUITE_PDF_INPUTS.includes(S.tool)||S.tool==='htmltopdf'||S.tool==='wordtopdf'||S.tool==='pdfforms';
  const uploadLabel=documentTool?(S.tool==='htmltopdf'?'Choose HTML file':S.tool==='wordtopdf'?'Choose DOCX file':S.tool==='pdfforms'?'No upload required':'Choose PDFs'):'Choose Images';
  const dropLabel=documentTool?(S.tool==='htmltopdf'?'Drop an HTML file here':S.tool==='wordtopdf'?'Drop a Word DOCX here':S.tool==='pdfforms'?'Create a fillable form from scratch':'Drop PDF files here'):'Drop images here';
  const subLabel=documentTool?(S.tool==='htmltopdf'?'HTML / HTM file • Processed locally':S.tool==='wordtopdf'?'Word .docx file • Text and paragraphs supported':S.tool==='pdfforms'?'Configure fields below, then create the PDF':'PDF files • Multiple pages supported'):'JPG, PNG, WebP, AVIF • Batch supported';

  const header='<header class="topbar editorial-topbar"><div class="brand"><button id="brand-home" class="brand-mark" aria-label="ImageMate home"><svg class="imagemate-mark" viewBox="0 0 76 64" aria-hidden="true"><circle class="im-mark-dot" cx="15" cy="13" r="5.4"></circle><path class="im-mark-stem" d="M15 25V48"></path><path class="im-mark-m" d="M30 48V29C30 24 34 23 37 27L44 36L52 27C55 23 59 25 59 30V48"></path></svg></button><div class="brand-copy"><b class="brand-wordmark"><span class="brand-word-image">Image</span><span class="brand-word-mate">Mate</span></b><span>Private PDF & image tools</span></div></div><nav class="top-actions" aria-label="Application navigation"><button id="home-btn" class="nav-btn '+(home?'active':'')+'" title="Home" '+(home?'aria-current="page"':'')+'><i data-lucide="house"></i><span class="nav-text">Home</span></button><button id="tools-btn" class="nav-btn '+((toolsScreen||task)?'active':'')+'" title="All tools" '+((toolsScreen||task)?'aria-current="page"':'')+'><i data-lucide="grid-2x2"></i><span class="nav-text">Tools</span></button><button id="settings-btn" class="nav-btn '+(settingsScreen?'active':'')+'" title="Settings" '+(settingsScreen?'aria-current="page"':'')+'><i data-lucide="settings"></i><span class="nav-text">Settings</span></button><button id="refresh-update-btn" class="nav-btn update-refresh" title="Refresh update check" aria-label="Refresh update check" ' + (isNativeAndroid() ? '' : 'hidden') + '><i data-lucide="refresh-cw"></i><span class="nav-text">Refresh</span></button><button id="update-btn" class="update-btn" hidden>Update</button></nav></header>';

  let content='';
  if(home){
    content='<section class="editorial-home"><div class="editorial-hero"><h1 id="home-hero-title" class="home-hero-copy">Tools for the paperwork of life.</h1><p id="home-hero-copy" class="home-hero-copy" aria-live="polite">Quick. Simple. Powerful.</p><div class="hero-art" aria-hidden="true"><div class="hero-art-orbit"></div><div class="hero-image hero-image-back"><svg viewBox="0 0 120 120"><rect x="8" y="8" width="104" height="104" rx="18" fill="#e0e7ff"/><circle cx="80" cy="39" r="11" fill="#818cf8"/><path d="M18 91 45 57 64 76 78 61 105 92v10H18Z" fill="#6366f1"/></svg></div><div class="hero-image hero-image-mid"><svg viewBox="0 0 120 120"><rect x="8" y="8" width="104" height="104" rx="18" fill="#cffafe"/><circle cx="82" cy="37" r="10" fill="#14b8a6"/><path d="M18 91 43 59 61 76 79 58 105 91v11H18Z" fill="#0d9488"/></svg></div><div class="hero-image hero-image-front"><svg viewBox="0 0 120 120"><rect x="8" y="8" width="104" height="104" rx="18" fill="#fff"/><rect x="19" y="19" width="82" height="82" rx="13" fill="#eef2ff"/><circle cx="76" cy="43" r="9" fill="#f59e0b"/><path d="M25 86 48 56 63 73 75 61 96 86v7H25Z" fill="#6366f1"/></svg></div></div></div><nav class="hero-pagination" role="group" aria-label="Home highlights"><button type="button" class="hero-page-dot active" data-hero-slide="0" aria-label="Highlight 1 of 4" aria-pressed="true"><span></span></button><button type="button" class="hero-page-dot" data-hero-slide="1" aria-label="Highlight 2 of 4" aria-pressed="false"><span></span></button><button type="button" class="hero-page-dot" data-hero-slide="2" aria-label="Highlight 3 of 4" aria-pressed="false"><span></span></button><button type="button" class="hero-page-dot" data-hero-slide="3" aria-label="Highlight 4 of 4" aria-pressed="false"><span></span></button></nav><div class="editorial-tools-head"><div><span id="home-tools-label">Popular Tools</span></div><button id="see-all-tools" class="editorial-view-all" type="button" aria-label="See all tools">See All <i data-lucide="arrow-up-right"></i></button></div><nav id="tool-grid" class="tool-grid editorial-tool-grid" aria-label="Popular Tools"><button class="tool editorial-tool" data-tool-index="0" data-tool="pdf" aria-label="Open Image to PDF" ><span class="tool-top"><span class="tool-icon"><i data-lucide="file-text"></i></span><span class="tool-arrow"><i data-lucide="arrow-up-right"></i></span></span><span class="tool-main"><span class="tool-category">DOCUMENT</span><b>Image to PDF</b><small>Create a PDF locally</small></span></button><button class="tool editorial-tool" data-tool-index="1" data-tool="pdf2image" aria-label="Open PDF to Image"><span class="tool-top"><span class="tool-icon"><i data-lucide="file-image"></i></span><span class="tool-arrow"><i data-lucide="arrow-up-right"></i></span></span><span class="tool-main"><span class="tool-category">CONVERT</span><b>PDF to Image</b><small>Export PDF pages as images</small></span></button><button class="tool editorial-tool" data-tool-index="2" data-tool="compress" aria-label="Open Compress Image"><span class="tool-top"><span class="tool-icon"><i data-lucide="minimize-2"></i></span><span class="tool-arrow"><i data-lucide="arrow-up-right"></i></span></span><span class="tool-main"><span class="tool-category">IMAGE</span><b>Compress</b><small>Reduce image file size</small></span></button><button class="tool editorial-tool" data-tool-index="3" data-tool="resize" aria-label="Open Resize Image"><span class="tool-top"><span class="tool-icon"><i data-lucide="maximize-2"></i></span><span class="tool-arrow"><i data-lucide="arrow-up-right"></i></span></span><span class="tool-main"><span class="tool-category">IMAGE</span><b>Resize</b><small>Adjust image dimensions</small></span></button><button class="tool editorial-tool" data-tool-index="4" data-tool="convert" aria-label="Open Convert Image"><span class="tool-top"><span class="tool-icon"><i data-lucide="refresh-cw"></i></span><span class="tool-arrow"><i data-lucide="arrow-up-right"></i></span></span><span class="tool-main"><span class="tool-category">CONVERT</span><b>Convert</b><small>Convert between image formats</small></span></button><button type="button" class="tool editorial-tool editorial-tool-more" data-tool-index="5" data-open-catalog="true" aria-label="See all tools"><span class="tool-top"><span class="tool-icon"><i data-lucide="ellipsis"></i></span><span class="tool-arrow"><i data-lucide="arrow-up-right"></i></span></span><span class="tool-main"><span class="tool-category">EXPLORE</span><b>More Tools</b><small>Explore all utilities</small></span></button><button class="tool editorial-tool" data-tool-index="6" data-tool="target" aria-label="Open Target File Size" hidden><span class="tool-top"><span class="tool-icon"><i data-lucide="target"></i></span><span class="tool-arrow"><i data-lucide="arrow-up-right"></i></span></span><span class="tool-main"><span class="tool-category">IMAGE</span><b>Target File Size</b><small>20 / 50 / 100 / 200 KB</small></span></button><button class="tool editorial-tool" data-tool-index="7" data-tool="passport" aria-label="Open Passport &amp; ID Photo" hidden><span class="tool-top"><span class="tool-icon"><i data-lucide="contact-round"></i></span><span class="tool-arrow"><i data-lucide="arrow-up-right"></i></span></span><span class="tool-main"><span class="tool-category">PHOTO</span><b>Passport &amp; ID Photo</b><small>Standard ID photo sizes</small></span></button><button class="tool editorial-tool" data-tool-index="8" data-tool="exif" aria-label="Open Remove Metadata" hidden><span class="tool-top"><span class="tool-icon"><i data-lucide="shield-check"></i></span><span class="tool-arrow"><i data-lucide="arrow-up-right"></i></span></span><span class="tool-main"><span class="tool-category">PRIVACY</span><b>Remove Metadata</b><small>Strip embedded image metadata</small></span></button><button class="tool editorial-tool" data-tool-index="9" data-tool="signature" aria-label="Open Signature Resize" hidden><span class="tool-top"><span class="tool-icon"><i data-lucide="pen-line"></i></span><span class="tool-arrow"><i data-lucide="arrow-up-right"></i></span></span><span class="tool-main"><span class="tool-category">UTILITY</span><b>Signature Resize</b><small>Prepare signatures for forms</small></span></button><button class="tool editorial-tool" data-tool-index="10" data-tool="background" aria-label="Open Remove Background" hidden><span class="tool-top"><span class="tool-icon"><i data-lucide="eraser"></i></span><span class="tool-arrow"><i data-lucide="arrow-up-right"></i></span></span><span class="tool-main"><span class="tool-category">IMAGE</span><b>Remove Background</b><small>Clean simple backgrounds</small></span></button><button class="tool editorial-tool" data-tool-index="11" data-tool="ocr" aria-label="Open OCR Text" hidden><span class="tool-top"><span class="tool-icon"><i data-lucide="scan-text"></i></span><span class="tool-arrow"><i data-lucide="arrow-up-right"></i></span></span><span class="tool-main"><span class="tool-category">DOCUMENT</span><b>OCR Text</b><small>Extract text from images</small></span></button><button class="tool editorial-tool" data-tool-index="12" data-tool="pdfmerge" aria-label="Open Merge PDFs" hidden><span class="tool-top"><span class="tool-icon"><i data-lucide="files"></i></span><span class="tool-arrow"><i data-lucide="arrow-up-right"></i></span></span><span class="tool-main"><span class="tool-category">DOCUMENT</span><b>Merge PDFs</b><small>Combine multiple PDFs into one</small></span></button><button class="tool editorial-tool" data-tool-index="13" data-tool="editor" aria-label="Open Photo Editor" hidden><span class="tool-top"><span class="tool-icon"><i data-lucide="sliders-horizontal"></i></span><span class="tool-arrow"><i data-lucide="arrow-up-right"></i></span></span><span class="tool-main"><span class="tool-category">IMAGE</span><b>Photo Editor</b><small>Brightness, contrast &amp; rotate</small></span></button></nav><p id="tool-empty" class="tool-empty" hidden>No tools match your search. Try another term.</p></section>';
  }else if(toolsScreen){
    content='<section class="screen-head catalog-head"><button id="back-home" class="secondary back-btn" type="button"><i data-lucide="arrow-left"></i><span>Home</span></button><div class="catalog-heading"><p class="eyebrow">IMAGEMATE / WORKSPACE</p><h1>PDF & image tools</h1><p>Choose a workflow: organize pages, sign and secure PDFs, convert documents, or prepare images.</p></div><span class="privacy"><i data-lucide="shield-check"></i> Local processing</span></section><section class="tools-catalog"><div class="catalog-toolbar"><div class="catalog-categories" role="group" aria-label="Filter tools by workflow category">'+catalogCategoryButtons.map(category=>'<button type="button" data-tool-category="'+category.id+'" class="'+(S.catalogCategory===category.id?'active':'')+'" aria-pressed="'+(S.catalogCategory===category.id?'true':'false')+'">'+esc(category.label)+'</button>').join('')+'</div><label class="catalog-search editorial-search" for="catalog-search"><i data-lucide="search"></i><input id="catalog-search" type="search" autocomplete="off" placeholder="Search by tool, format or task…" aria-label="Search all tools"></label></div><div id="catalog-groups">'+catalogGroups.map(catalogGroupMarkup).join('')+'</div><p id="catalog-empty" class="tool-empty" hidden>No tools match this workflow or search. Try another category or keyword.</p><div class="catalog-footnote"><i data-lucide="shield-check"></i><span>Private by design · supported processing stays on this device</span></div></section>';
  }else if(settingsScreen){
    content='<section class="screen-head settings-page-head"><button id="back-settings" class="secondary back-btn" type="button" aria-label="Back to tools"><i data-lucide="arrow-left"></i><span>Back</span></button><div class="settings-heading"><p class="eyebrow editorial-kicker">IMAGEMATE / PREFERENCES</p><h1>Settings</h1><p>Personalise your tools, appearance and update preferences.</p></div><span class="privacy"><i data-lucide="shield-check"></i> Private & local</span></section><section class="settings-screen" aria-label="App settings"><div class="settings-card settings-stack settings-card-processing"><div class="settings-icon"><i data-lucide="sliders-horizontal"></i></div><div class="settings-copy"><b>Processing defaults</b><span>Choose the format and quality used when a new image conversion starts.</span></div><label for="default-format">Default image format<select id="default-format"><option value="image/webp" '+(S.format==='image/webp'?'selected':'')+'>WebP — recommended</option><option value="image/jpeg" '+(S.format==='image/jpeg'?'selected':'')+'>JPG</option><option value="image/png" '+(S.format==='image/png'?'selected':'')+'>PNG</option><option value="image/avif" '+(S.format==='image/avif'?'selected':'')+'>AVIF</option></select></label><label for="default-quality">Default image quality <output id="default-quality-value">'+Math.round(S.quality*100)+'%</output><input id="default-quality" aria-label="Default image quality" type="range" min="10" max="100" value="'+Math.round(S.quality*100)+'"></label></div><div class="settings-card settings-card-appearance"><div class="settings-icon"><i data-lucide="'+(S.dark?'moon':'sun')+'"></i></div><div class="settings-copy"><b>Appearance</b><span>Choose the look that is comfortable for you.</span></div><label class="switch settings-theme-switch" aria-label="Dark appearance"><input id="settings-theme-toggle" type="checkbox" role="switch" aria-label="Enable dark appearance" '+(S.dark?'checked':'')+'><span></span></label></div><div class="settings-card settings-card-updates"><div class="settings-icon"><i data-lucide="refresh-cw"></i></div><div class="settings-copy"><b>Automatic updates</b><span>Allow ImageMate to check for newer Android versions in the background.</span></div><label class="switch" aria-label="Automatic update checks"><input id="update-setting" type="checkbox" role="switch" aria-label="Enable automatic update checks" '+(localStorage.getItem('imagemate-auto-update')!=='0'?'checked':'')+'><span></span></label></div><div class="settings-card settings-card-check-updates"><div class="settings-icon"><i data-lucide="cloud-download"></i></div><div class="settings-copy"><b>Check for updates</b><span>Run a manual update check when connected to the internet.</span></div><button id="settings-check-updates" class="secondary settings-action" type="button"><span>Check now</span><i data-lucide="arrow-up-right"></i></button></div><div class="settings-card settings-card-library"><div class="settings-icon"><i data-lucide="folder-down"></i></div><div class="settings-copy"><b>File library</b><span>Open, share or save another copy of files created by ImageMate.</span></div><button id="open-downloads" class="secondary settings-action" type="button"><span>Open files</span><i data-lucide="arrow-up-right"></i></button></div><div class="settings-card settings-card-about"><div class="settings-icon"><i data-lucide="shield-check"></i></div><div class="settings-copy"><b>About ImageMate</b><span>Supported workflows process files locally. Your files are not uploaded by these tools.</span></div><span class="settings-version">v'+esc(runtimeAppVersion||APP_VERSION)+'</span><button id="settings-about-details" class="secondary settings-action" type="button"><span>Privacy &amp; version</span><i data-lucide="arrow-up-right"></i></button></div></section>';
  }else if(downloads){
    content='<section class="screen-head"><button id="back-home" class="secondary back-btn" type="button"><i data-lucide="arrow-left"></i><span>Home</span></button><div><p class="eyebrow">FILE LIBRARY</p><h1>Downloaded files</h1><p>Open, share or save another copy of files created by ImageMate.</p></div><span class="privacy"><i data-lucide="shield-check"></i> Files stay on your device</span></section><section class="workspace downloads-workspace"><div id="download-library"><div class="empty-downloads">Loading files…</div></div></section>';
  }else{
    content='<section class="screen-head"><button id="back-home" class="secondary back-btn" type="button"><i data-lucide="arrow-left"></i><span>All tools</span></button><div class="screen-title"><p class="eyebrow">DEDICATED TOOL</p><div class="screen-title-row"><span class="screen-title-icon"><i data-lucide="'+tool[1]+'"></i></span><h1>'+title+'</h1></div><p>'+desc+'</p></div><span class="privacy"><i data-lucide="shield-check"></i> Local processing</span></section><section class="workspace"><div class="workspace-head"><p class="eyebrow">WORKSPACE</p></div><div id="drop" class="dropzone '+(S.tool==='pdfforms'?'form-builder-no-upload':'')+'"><input id="file" type="file" accept="'+accept+'" multiple hidden><div class="upload-icon"><i data-lucide="upload-cloud"></i></div><h3>'+dropLabel+'</h3><p>or choose files from your device</p><button id="choose" class="primary"><i data-lucide="folder-open"></i><span>'+uploadLabel+'</span></button><small>'+subLabel+'</small></div><div id="queue"></div><div id="progress-wrap" class="progress-wrap" hidden><div class="progress-top"><b class="progress-text">Processing 0%</b><span>Local</span></div><div class="progress-track"><div class="progress-bar" style="width:0%"></div></div></div><div id="settings"></div><section id="live-preview" class="live-preview" aria-label="Live file preview"><div class="live-preview-heading"><div><p class="eyebrow">LIVE PREVIEW</p><h2 id="live-preview-title">Preview your changes</h2><p id="live-preview-status" aria-live="polite">Choose a file to see an on-device preview. No file is downloaded until you process it.</p></div><label class="live-preview-picker" for="preview-file">Preview file<select id="preview-file" hidden></select></label></div><div id="live-preview-stage" class="live-preview-stage"><div class="live-preview-empty"><span class="live-preview-empty-icon"><i data-lucide="eye"></i></span><b>Your preview will appear here</b><span>Select an image or PDF to begin.</span></div></div><div id="live-preview-meta" class="live-preview-meta" aria-live="polite"></div><p class="live-preview-footnote"><i data-lucide="shield-check"></i> Preview is processed locally on this device.</p></section></section>';
  }

  const mobileActive=settingsScreen?'settings':downloads?'files':(task||toolsScreen)?'tools':(S.mobileTab==='tools'?'tools':'home');
  const mobileNav='<nav class="mobile-bottom-nav" aria-label="Primary navigation"><button type="button" data-mobile-tab="home" class="'+(mobileActive==='home'?'active':'')+'" '+(mobileActive==='home'?'aria-current="page"':'')+'><i data-lucide="house"></i><span>Home</span></button><button type="button" data-mobile-tab="tools" class="'+(mobileActive==='tools'?'active':'')+'" '+(mobileActive==='tools'?'aria-current="page"':'')+'><i data-lucide="grid-2x2"></i><span>Tools</span></button><button type="button" data-mobile-tab="files" class="'+(mobileActive==='files'?'active':'')+'" '+(mobileActive==='files'?'aria-current="page"':'')+'><i data-lucide="folder"></i><span>Files</span></button><button type="button" data-mobile-tab="settings" class="'+(mobileActive==='settings'?'active':'')+'" '+(mobileActive==='settings'?'aria-current="page"':'')+'><i data-lucide="settings-2"></i><span>Settings</span></button></nav>';
  // Android uses native AdMob; web uses a responsive AdSense slot or a clearly labelled setup preview.
  const webAdSlot=isAndroidNative()?'':'<aside class="web-ad-slot" data-web-ad-slot aria-label="Advertisement"></aside>';
  app.innerHTML='<div class="shell '+(S.dark?'dark':'')+'">'+header+webAdSlot+'<main>'+content+'<footer>© 2026 ImageMate <span>•</span> Private file tools for everyone</footer></main>'+mobileNav+'</div>';
  createIcons({ icons, attrs: { 'stroke-width': 1.8 } });
  bind(); settings(); queue();

  const goHome=()=>{S.view='tools';S.mobileTab='home';S.files=[];render();window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})};
  const brandHome=document.querySelector('#brand-home');
  if(brandHome)brandHome.onclick=goHome;
  const homeBtn=document.querySelector('#home-btn');
  if(homeBtn) homeBtn.onclick=goHome;
  const toolsBtn=document.querySelector('#tools-btn');
  if(toolsBtn) toolsBtn.onclick=()=>{S.view='catalog';S.mobileTab='tools';S.catalogCategory='All';S.files=[];render();window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})};
  const settingsBtn=document.querySelector('#settings-btn');
  if(settingsBtn) settingsBtn.onclick=()=>{S.view='settings';S.mobileTab='settings';S.files=[];render()};
  const openCatalog=()=>{
    S.view='catalog';S.mobileTab='tools';S.catalogCategory='All';S.files=[];
    render();
    window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  };
  const moreToolsCard=document.querySelector('[data-open-catalog]');
  if(moreToolsCard)moreToolsCard.onclick=openCatalog;
  const seeAllTools=document.querySelector('#see-all-tools');
  if(seeAllTools) seeAllTools.onclick=()=>{S.view='catalog';S.mobileTab='tools';S.catalogCategory='All';S.files=[];render();window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})};
  const refreshUpdate=document.querySelector('#refresh-update-btn');
  if(refreshUpdate) refreshUpdate.onclick=async()=>{
    if(refreshUpdate.disabled)return;
    refreshUpdate.disabled=true;
    refreshUpdate.setAttribute('aria-busy','true');
    refreshUpdate.innerHTML='<i data-lucide="loader-circle"></i><span class="nav-text">Checking…</span>';
    createIcons({icons,attrs:{'stroke-width':1.8}});
    try{
      if(isNativeAndroid()){
        const [apkResult] = await Promise.all([
          checkForAndroidUpdate(true),
          initGitHubOta({ force: true })
        ]);
        if(apkResult==='current') alert('ImageMate is up to date. The web-update check has also completed.');
        else if(apkResult==='failed'||apkResult==='unavailable') alert('Could not verify the latest update. Check your internet connection and try again.');
        else if(apkResult==='disabled') alert('Automatic updates are disabled. Manual update check was not run.');
        else if(apkResult==='checking') alert('An update check is already running. Please wait a moment.');
        else if(apkResult==='recently-checked') alert('You just checked for updates. Please try again in a few seconds.');
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
  document.querySelectorAll('[data-mobile-tab]').forEach(button=>button.onclick=()=>{
    const tab=button.dataset.mobileTab;
    const behavior=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
    S.files=[];
    if(tab==='home'){S.view='tools';S.mobileTab='home';render();window.scrollTo({top:0,behavior});return}
    if(tab==='tools'){S.view='catalog';S.mobileTab='tools';S.catalogCategory='All';render();window.scrollTo({top:0,behavior});return}
    if(tab==='files'){S.view='downloads';S.mobileTab='files';render();return}
    if(tab==='settings'){S.view='settings';S.mobileTab='settings';render()}
  });
  const openDownloads=document.querySelector('#open-downloads');
  if(openDownloads) openDownloads.onclick=()=>{S.view='downloads';S.mobileTab='files';S.files=[];render()};
  const defaultFormat=document.querySelector('#default-format');
  if(defaultFormat) defaultFormat.onchange=e=>{S.format=e.target.value;localStorage.setItem('imagemate-format',S.format)};
  const defaultQuality=document.querySelector('#default-quality');
  if(defaultQuality) defaultQuality.oninput=e=>{S.quality=e.target.value/100;localStorage.setItem('imagemate-quality',String(S.quality));const out=document.querySelector('#default-quality-value');if(out)out.textContent=e.target.value+'%'};
  const settingsThemeToggle=document.querySelector('#settings-theme-toggle');
  if(settingsThemeToggle) settingsThemeToggle.onchange=e=>{S.dark=e.target.checked;localStorage.setItem('imagemate-dark',S.dark?'1':'0');render()};
  const settingsCheckUpdates=document.querySelector('#settings-check-updates');
  if(settingsCheckUpdates) settingsCheckUpdates.onclick=()=>{const refreshButton=document.querySelector('#refresh-update-btn');if(refreshButton)refreshButton.click();else alert('Update refresh is available in the Android app.')};
  const aboutDetails=document.querySelector('#settings-about-details');
  if(aboutDetails) aboutDetails.onclick=()=>{
    const existing=document.querySelector('#imagemate-about-dialog');
    if(existing){existing.remove();return}
    const dialog=document.createElement('dialog');
    dialog.id='imagemate-about-dialog';
    dialog.className='imagemate-about-dialog';
    dialog.setAttribute('aria-labelledby','imagemate-about-title');
    dialog.innerHTML='<div class="about-dialog-head"><span class="about-dialog-icon"><i data-lucide="shield-check"></i></span><button type="button" class="about-dialog-close" aria-label="Close about dialog"><i data-lucide="x"></i></button></div><p class="eyebrow">PRIVATE BY DESIGN</p><h2 id="imagemate-about-title">About ImageMate</h2><p class="about-dialog-copy">ImageMate processes supported files directly on your device. This app does not upload your selected files to a server for its local tools.</p><div class="about-version-row"><span>App version</span><strong>v'+esc(runtimeAppVersion||APP_VERSION)+'</strong></div><div class="about-version-row"><span>Update channel</span><strong>GitHub Releases + OTA</strong></div><button type="button" class="primary about-dialog-done">Done</button>';
    document.body.appendChild(dialog);
    createIcons({icons,attrs:{'stroke-width':1.8}});
    const close=()=>{if(dialog.open)dialog.close();dialog.remove()};
    dialog.querySelector('.about-dialog-close').onclick=close;
    dialog.querySelector('.about-dialog-done').onclick=close;
    dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
    dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
    dialog.showModal();
  };
  const updateSetting=document.querySelector('#update-setting');
  if(updateSetting) updateSetting.onchange=async e=>{
    const enabled=e.target.checked;
    localStorage.setItem('imagemate-auto-update',enabled?'1':'0');
    if(enabled && isNativeAndroid()){
      // Start a fresh OTA check immediately when the user enables automatic updates.
      await Promise.all([
        checkForAndroidUpdate(true),
        initGitHubOta({ force: true })
      ]);
    }
  };
  const back=document.querySelector('#back-home');
  if(back) back.onclick=()=>{S.files=[];if(toolsScreen||downloads){S.view='tools';S.mobileTab='home'}else if(task&&S.returnView==='catalog'){S.view='catalog';S.mobileTab='tools'}else{S.view='tools';S.mobileTab='home'}render()};
  const backSettings=document.querySelector('#back-settings');
  if(backSettings) backSettings.onclick=()=>{S.view='tools';S.mobileTab='home';S.files=[];render()};
  if(downloads) renderDownloads();
  checkForAndroidUpdate(); startUpdateMonitor();
  if(isAndroidNative()) initNativeAds().then(async result=>{if(!result.shown)console.warn('[ImageMate ads] Banner not visible:',result.reason||'unknown reason'); else { await new Promise(resolve=>setTimeout(resolve, 1200)); await maybeShowTestAppOpen(); }});
  else initWebAds().catch(error=>console.warn('[ImageMate ads] Website ad setup failed:',error));
}
function showInstantUpdatePopup(version, mode='download'){
  const existingPopup=document.querySelector('#update-popup');
  if(existingPopup){
    if(mode==='install'&&typeof existingPopup.promoteToInstall==='function')existingPopup.promoteToInstall();
    return;
  }
  if(mode==='download'&&localStorage.getItem('imagemate-update-dismissed-version')===String(version))return;
  let installMode = mode === 'install';
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
  // Keep the UI label and the action state in sync. The button may transition
  // from a background download to installation while this popup stays mounted.
  overlay.promoteToInstall=()=>{
    installMode=true;
    const installButton=overlay.querySelector('#update-now');
    const installStatus=overlay.querySelector('#update-status-text');
    if(installButton){installButton.disabled=false;installButton.textContent='Install now';}
    if(installStatus)installStatus.textContent='The update is downloaded and ready to install. Tap Install now to open the Android installer.';
  };
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
        // Keep the update dialog mounted behind Android's installer. If installation
        // is cancelled or rejected, the user returns to a visible retry action.
        btn.disabled=false;
        btn.textContent='Try install again';
        if(statusText)statusText.textContent='Android installer opened. If installation does not complete, return here and tap Try install again. The update remains available.';
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
            overlay.promoteToInstall();
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
      console.error(e);
      btn.disabled=false;
      btn.textContent=installMode?'Try install again':'Retry update';
      if(statusText){
        const reason=String(e?.message||e||'Could not open the Android installer.');
        statusText.textContent=installMode
          ? 'Android could not open the installer: '+reason+'. Your downloaded APK is kept. Tap Try install again, or use the completed-download notification.'
          : 'Unable to start update: '+reason+'. Tap Retry update.';
      }
    }
  };
  if(navigator.vibrate)navigator.vibrate([250,120,250]);
}
async function checkForAndroidUpdate(force=false){
  if(!isNativeAndroid())return 'unsupported';
  if(updateCheckInFlight)return 'checking';
  if(!force&&localStorage.getItem('imagemate-auto-update')==='0')return 'disabled';
  const now=Date.now();
  const minGap=force?UPDATE_MANUAL_CHECK_MS:UPDATE_AUTO_CHECK_MS;
  if(!force&&now-lastUpdateCheckAt<minGap)return 'recently-checked';
  lastUpdateCheckAt=now;
  localStorage.setItem('imagemate-last-update-check',String(lastUpdateCheckAt));
  updateCheckInFlight=true;
  try{
    const nativeVersion=await getAndroidAppVersion().catch(()=>({version:APP_VERSION}));
    runtimeAppVersion=String(nativeVersion?.version||APP_VERSION);
    const b=document.querySelector('#update-btn');
    const r=await fetch(UPDATE_API+'?imagemate='+Date.now(),{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
    if(!r.ok)return 'failed';
    const release=await r.json();
    const latest=String(release.tag_name||'').replace(/^v/i,'');
    const asset=Array.isArray(release.assets)?release.assets.find(a=>a&&a.name==='ImageMate.apk'&&a.browser_download_url):null;
    if(!latest||!asset){
      if(b){b.hidden=true;b.disabled=false}
      return 'unavailable';
    }
    latestUpdateUrl=asset.browser_download_url;

    const installing=localStorage.getItem('imagemate-update-installing')==='1';
    const installStarted=Number(localStorage.getItem('imagemate-update-install-started-at')||0);
    if(installing){
      if(!isNewerVersion(latest,runtimeAppVersion)||installStarted&&Date.now()-installStarted>30*60*1000){
        localStorage.removeItem('imagemate-update-installing');
        localStorage.removeItem('imagemate-update-install-started-at');
      }else{
        // Never strand users without an update action if the installer was cancelled,
        // rejected by Android, or the app resumed after the installer closed.
        localStorage.removeItem('imagemate-update-installing');
        localStorage.removeItem('imagemate-update-install-started-at');
      }
    }

    if(!isNewerVersion(latest,runtimeAppVersion)){
      localStorage.removeItem('imagemate-update-installing');
      localStorage.removeItem('imagemate-update-install-started-at');
      if(b){b.hidden=true;b.disabled=false}
      return 'current';
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
          const reason=String(e?.message||e||'Could not start the Android installer.');
          alert(reason.includes('Signing key mismatch')
            ? 'This update has a different signing key. Android cannot update this installation in place. Back up important files, uninstall ImageMate, then install the stable signed APK manually.'
            : reason);
        }
      };
      showInstantUpdatePopup(latest,'install');
      return 'available';
    }

    const status=await getAndroidUpdateStatus().catch(()=>({status:'none',downloaded:0,total:0}));
    if(['pending','downloading','paused'].includes(status?.status)){
      if(b){
        b.hidden=false;b.disabled=true;
        const pct=status.total>0?Math.min(100,Math.round((status.downloaded/status.total)*100)):0;
        b.textContent=status.status==='downloading'&&status.total>0?'Downloading '+pct+'%':'Update downloading…';
      }
      return 'downloading';
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
    return 'available';
  }catch(e){console.debug('ImageMate update check skipped',e);return 'failed'}
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
    // Re-check immediately on return from Android's package installer. This makes
    // Update available / Install update reappear after a failed or cancelled install.
    checkForAndroidUpdate(true);
  });
  window.addEventListener('pageshow',()=>{
    if(localStorage.getItem('imagemate-update-installing')==='1'){
      localStorage.removeItem('imagemate-update-installing');
      localStorage.removeItem('imagemate-update-install-started-at');
    }
    if(document.visibilityState==='visible')checkForAndroidUpdate(true);
  });
  setInterval(()=>{if(document.visibilityState==='visible')checkForAndroidUpdate()},60000);
}

function isNewerVersion(latest,current){
  const a=String(latest).split('.').map(n=>parseInt(n,10)||0),b=String(current).split('.').map(n=>parseInt(n,10)||0);
  for(let i=0;i<Math.max(a.length,b.length);i++){if((a[i]||0)>(b[i]||0))return true;if((a[i]||0)<(b[i]||0))return false}
  return false;
}
function bind(){
  if(S.view==='downloads'||S.view==='settings') return;
  document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{
    S.returnView=S.view==='catalog'?'catalog':'tools';S.tool=b.dataset.tool;S.files=[];S.view='tool';S.mobileTab='tools';
    render();
    window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  });
  const heroSlides=[
    {title:'Your PDF workspace, built for everyday tasks.',copy:'Merge, split, convert and organize documents.'},
    {title:'Move from PDF to the format you need.',copy:'Create Word, Excel, PowerPoint, text and image outputs.'},
    {title:'Organize documents without the busywork.',copy:'Reorder pages, extract sections, sign and protect PDFs.'},
    {title:'Private by design.',copy:'Supported conversions and PDF operations run locally.'}
  ];
  document.querySelectorAll('[data-hero-slide]').forEach(button=>button.onclick=()=>{
    const index=Number(button.dataset.heroSlide);
    const slide=heroSlides[index];if(!slide)return;
    const hero=document.querySelector('.editorial-hero');
    const title=document.querySelector('#home-hero-title');
    const copy=document.querySelector('#home-hero-copy');
    if(!title||!copy)return;
    hero?.classList.add('is-changing');
    title.classList.remove('hero-slide-animate');
    copy.classList.remove('hero-slide-animate');
    requestAnimationFrame(()=>{
      title.textContent=slide.title;
      copy.textContent=slide.copy;
      document.querySelectorAll('[data-hero-slide]').forEach(dot=>{
        const active=Number(dot.dataset.heroSlide)===index;
        dot.classList.toggle('active',active);
        dot.setAttribute('aria-pressed',active?'true':'false');
      });
      /* Restart the full 2-second transition on every manual slide change. */
      void title.offsetWidth;
      title.classList.add('hero-slide-animate');
      copy.classList.add('hero-slide-animate');
      hero?.classList.remove('is-changing');
      window.setTimeout(()=>{
        title.classList.remove('hero-slide-animate');
        copy.classList.remove('hero-slide-animate');
      },2000);
    });
  });
  const catalogSearch=document.querySelector('#catalog-search');
  const applyCatalogFilter=()=>{
    const q=String(catalogSearch?.value||'').trim().toLowerCase();
    const category=S.catalogCategory||'All';let visible=0;
    document.querySelectorAll('.catalog-tool-row').forEach(b=>{
      const categoryMatch=category==='All'||b.dataset.category===category;
      const groupTitle=b.closest('.catalog-group')?.querySelector('.catalog-group-head')?.textContent||'';
      const queryMatch=!q||(b.textContent+' '+(b.dataset.search||'')+' '+groupTitle).toLowerCase().includes(q);
      b.hidden=!(categoryMatch&&queryMatch);if(!b.hidden)visible++;
    });
    document.querySelectorAll('.catalog-group').forEach(group=>{
      group.hidden=![...group.querySelectorAll('.catalog-tool-row')].some(button=>!button.hidden);
    });
    const empty=document.querySelector('#catalog-empty');if(empty)empty.hidden=visible>0;
  };
  if(catalogSearch)catalogSearch.oninput=applyCatalogFilter;
  document.querySelectorAll('[data-tool-category]').forEach(button=>button.onclick=()=>{
    S.catalogCategory=button.dataset.toolCategory;
    document.querySelectorAll('[data-tool-category]').forEach(item=>{
      const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',active?'true':'false');
    });
    applyCatalogFilter();
  });
  const choose=document.querySelector('#choose');
  const fileInput=document.querySelector('#file');
  if(choose&&fileInput)choose.onclick=()=>{fileInput.value='';fileInput.click()};
  if(!fileInput)return;
  fileInput.onchange=e=>{load(e.target.files);fileInput.value=''};
  const d=document.querySelector('#drop');
  if(S.tool==='pdf2image'||S.tool==='pdfmerge')d.querySelector('h3').textContent='Drop PDF files here';
  d.addEventListener('dragover',e=>{e.preventDefault();d.classList.add('drag')});
  d.addEventListener('dragleave',()=>d.classList.remove('drag'));
  d.addEventListener('drop',e=>{e.preventDefault();d.classList.remove('drag');load(e.dataTransfer.files)});
}

function isHeic(f){return /\.(heic|heif)$/i.test(f.name)||/image\/(heic|heif)/i.test(f.type)}
function load(list){
  const files=[...list];
  if(S.tool==='pdf2image'||S.tool==='pdfmerge'||PDF_SUITE_PDF_INPUTS.includes(S.tool)){
    S.files=files.filter(f=>f.type==='application/pdf'||/\.pdf$/i.test(f.name));
  }else if(S.tool==='htmltopdf'){
    S.files=files.filter(f=>f.type==='text/html'||/\.html?$/i.test(f.name));
  }else if(S.tool==='wordtopdf'){
    S.files=files.filter(f=>f.type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'||/\.docx$/i.test(f.name));
  }else{
    S.files=files.filter(f=>f.type.startsWith('image/')||isHeic(f));
  }
  S.previewIndex=0;
  queue()
}
function queue(){
  const q=document.querySelector('#queue');if(!q)return;
  const documentInput=S.tool==='pdf2image'||S.tool==='pdfmerge'||PDF_SUITE_PDF_INPUTS.includes(S.tool)||S.tool==='htmltopdf'||S.tool==='wordtopdf';
  q.querySelectorAll('img').forEach(imgEl=>{const src=imgEl.currentSrc||imgEl.src;if(src)URL.revokeObjectURL(src)});
  q.innerHTML=S.files.map((f,i)=>'<div class="file-row"><div class="thumb">'+(documentInput?'<i data-lucide="file-text"></i>':'<img src="'+URL.createObjectURL(f)+'">')+'</div><div class="file-meta"><b>'+esc(f.name)+'</b><span>'+label(f.type)+' • '+size(f.size)+'</span></div><button class="remove" data-i="'+i+'" aria-label="Remove file"><i data-lucide="x"></i></button></div>').join('');createIcons({icons,attrs:{'stroke-width':1.8}});
  q.querySelectorAll('.remove').forEach(b=>b.onclick=()=>{S.files.splice(+b.dataset.i,1);queue()});
  if(S.files.length||S.tool==='pdfforms'){const formOnly=S.tool==='pdfforms';q.insertAdjacentHTML('beforeend','<div class="actionbar"><span>'+(formOnly?'Create an interactive PDF form':('<b>'+S.files.length+'</b> '+((S.tool==='pdf2image'||S.tool==='pdfmerge'||PDF_SUITE_PDF_INPUTS.includes(S.tool))?'PDF':S.tool==='htmltopdf'?'HTML':S.tool==='wordtopdf'?'DOCX':'file')+(S.files.length>1?'s':'')+' ready'))+'</span>'+(formOnly?'':'<button id="clear" class="remove">Clear</button>')+(S.files.length>1&&!['pdf','pdf2image','pdfmerge','ocr','exif','background','editor',...PDF_SUITE_TOOLS].includes(S.tool)?'<button id="zip" class="secondary">Download ZIP</button>':'')+'<button id="process" class="primary">'+(S.tool==='ocr'?'Extract Text':(S.tool==='pdf2image'||S.tool==='pdfmerge')?'Convert PDFs':'Process & Download')+'</button></div>');const clear=document.querySelector('#clear');if(clear)clear.onclick=()=>{S.files=[];queue()};const zip=document.querySelector('#zip');if(zip)zip.onclick=processBatchZip;document.querySelector('#process').onclick=process}
  S.previewIndex=Math.max(0,Math.min(S.previewIndex||0,S.files.length-1));
  scheduleLivePreview();
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
  if(S.tool==='pdfmerge')h+='<div class="info">Select two or more PDFs to combine them. Text and vector content are preserved.</div>';
  const field=(label,id,key,value,type='text',placeholder='')=>'<label>'+label+'<input id="'+id+'" data-pdf-opt="'+key+'" type="'+type+'" value="'+esc(value)+'" placeholder="'+esc(placeholder)+'"></label>';
  const info=message=>'<div class="info">'+message+'</div>';
  if(S.tool==='pdfalternate')h+=info('Select two or more PDFs. Pages are interleaved in their original order.');
  if(S.tool==='pdforganize')h+=field('Page order (example: 1,3,2,4)','pdf-page-order','pageOrder','1-z','text','1,3,2')+info('Rearrange the page sequence. Use page numbers or ranges like 1,3,5-7. Pages not listed will not be included.');
  if(['pdfextract','pdfdelete'].includes(S.tool))h+=field(S.tool==='pdfdelete'?'Pages to delete':'Pages to extract','pdf-pages','pages',S.tool==='pdfdelete'?'2':'1-3')+info('Use page numbers or ranges, for example 1-3,5. The original file remains unchanged.');
  if(S.tool==='pdfsplitpages')h+=field('Pages per output PDF','pdf-pages-per-file','pagesPerFile','1','number','1')+info('The results are bundled into one ZIP file.');
  if(S.tool==='pdfsplitsize')h+=field('Approximate max size per PDF (MB)','pdf-max-mb','maxMb','5','number','5')+info('Page groups are estimated from single-page PDF sizes. Complex PDFs may exceed the chosen size.');
  if(S.tool==='pdfsplittext')h+=field('Text to find','pdf-match-text','matchText','','text','Enter a word or phrase')+info('Creates a PDF of matching pages and, when applicable, another PDF with the remaining pages.');
  if(S.tool==='pdfedit')h+=field('Text to place on the PDF','pdf-annotation-text','annotationText','','text','Enter the text to add')+field('Page(s)','pdf-pages','pages','1')+field('Font size','pdf-font-size','fontSize','18','number','18')+info('Adds an overlay; it does not change existing PDF text.');
  if(S.tool==='pdfsign')h+=field('Name / typed signature','pdf-signature-name','signatureName','','text','Full name')+field('Date','pdf-signature-date','signatureDate',new Date().toLocaleDateString())+field('Page(s)','pdf-pages','pages','1')+info('Adds a typed signature and date stamp. It is not a certificate-based digital signature.');
  if(S.tool==='pdfforms')h+=field('Form title','pdf-form-title','formTitle','Fillable Form')+'<label>Field labels (one per line or comma-separated)<textarea id="pdf-form-labels" data-pdf-opt="formLabels" rows="5">Name, Email, Date, Comments</textarea></label>'+info('Creates a new PDF containing interactive text fields.');
  if(S.tool==='pdfcompress')h+=info('Uses lossless PDF stream/object compression where supported; already-optimized PDFs may not get smaller.');
  if(S.tool==='pdfprotect')h+=field('Open password (min. 6 characters)','pdf-password','password','','password','Choose a strong password')+field('Confirm password','pdf-confirm-password','confirmPassword','','password','Repeat password')+field('Owner password (optional)','pdf-owner-password','ownerPassword','','password','Leave blank to reuse open password')+info('Applies real PDF encryption locally. If you lose the password, ImageMate cannot recover it.');
  if(S.tool==='pdfunlock')h+=field('Current PDF password','pdf-password','password','','password','Enter the existing password')+info('Only removes encryption after the correct password is provided. It cannot recover forgotten passwords.');
  if(S.tool==='pdfwatermark')h+=field('Watermark text','pdf-watermark-text','watermarkText','CONFIDENTIAL')+field('Angle (degrees)','pdf-watermark-angle','watermarkAngle','-35','number','-35')+field('Font size','pdf-font-size','fontSize','28','number','28');
  if(['pdftext','pdftoword','pdfexcel','pdfppt','pdfsplitbookmarks'].includes(S.tool))h+=field('PDF password (if protected)','pdf-password','password','','password','Optional');
  if(S.tool==='pdftext')h+=info('Extracts selectable text. Scanned pages may need OCR first.');
  if(S.tool==='pdftoword')h+=info('Exports extracted text to DOCX. Original page layout and graphics are not preserved.');
  if(S.tool==='pdfexcel')h+=info('Reconstructs rows and columns using text positions; complex tables may need cleanup in Excel.');
  if(S.tool==='pdfppt')h+=info('Each PDF page becomes a slide image. The slide appearance is preserved, but its text and objects are not individually editable.');
  if(S.tool==='htmltopdf')h+=info('Creates a text-focused PDF from the HTML document. Advanced CSS, remote images and interactive content are not reproduced.');
  if(S.tool==='wordtopdf')h+=info('Converts .docx paragraphs and text locally. Complex Word formatting, tables and embedded images are not preserved.');
  if(S.tool==='pdfedit')h+=info('Choose one page or a page range. Text will be stamped on top of the existing PDF page.');
  if(['pdf','pdfmerge','pdfalternate','pdforganize','pdfextract','pdfsplitpages','pdfsplitbookmarks','pdfsplithalf','pdfsplitsize','pdfsplittext','pdfedit','pdfsign','pdfdelete','pdfcompress','pdfprotect','pdfunlock','pdfwatermark','pdfflatten','pdfexcel','pdfppt','pdftext','pdftoword'].includes(S.tool))h+=info('PDF processing stays on this device.');
  s.innerHTML=h;
  const f=document.querySelector('#format');if(f)f.onchange=e=>{S.format=e.target.value;scheduleLivePreview()};
  const q=document.querySelector('#quality');if(q)q.oninput=e=>{S.quality=e.target.value/100;document.querySelector('#qv').textContent=e.target.value+'%';scheduleLivePreview()};
  const w=document.querySelector('#width');if(w)w.oninput=e=>{S.width=e.target.value;scheduleLivePreview()};
  const ht=document.querySelector('#height');if(ht)ht.oninput=e=>{S.height=e.target.value;scheduleLivePreview()};
  const t=document.querySelector('#target');if(t)t.onchange=e=>{S.target=+e.target.value;scheduleLivePreview()};
  const pf=document.querySelector('#pdfFormat');if(pf)pf.onchange=e=>{S.pdfFormat=e.target.value;scheduleLivePreview()};
  const ps=document.querySelector('#pdfScale');if(ps)ps.onchange=e=>{S.pdfScale=+e.target.value;scheduleLivePreview()};
  const rot=document.querySelector('#rotation');if(rot)rot.onchange=e=>{S.rotation=+e.target.value;scheduleLivePreview()};
  const br=document.querySelector('#brightness');if(br)br.oninput=e=>{S.brightness=+e.target.value;const o=document.querySelector('#bv');if(o)o.textContent=e.target.value;scheduleLivePreview()};
  const co=document.querySelector('#contrast');if(co)co.oninput=e=>{S.contrast=+e.target.value;const o=document.querySelector('#cv');if(o)o.textContent=e.target.value;scheduleLivePreview()};
  s.querySelectorAll('[data-pdf-opt]').forEach(el=>el.addEventListener(el.tagName==='SELECT'?'change':'input',()=>scheduleLivePreview()));
}
let livePreviewTimer=0;
let livePreviewRevision=0;

function scheduleLivePreview(delay=180){
  if(livePreviewTimer)clearTimeout(livePreviewTimer);
  const revision=++livePreviewRevision;
  livePreviewTimer=setTimeout(()=>{livePreviewTimer=0;updateLivePreview(revision)},delay);
}

function setLivePreviewMeta(items){
  const meta=document.querySelector('#live-preview-meta');
  if(!meta)return;
  meta.innerHTML=items.filter(Boolean).map(item=>'<span class="live-preview-chip">'+esc(item)+'</span>').join('');
}

function showLivePreviewElement(element){
  const stage=document.querySelector('#live-preview-stage');
  if(stage)stage.replaceChildren(element);
}

function makePreviewImage(blob,alt){
  const image=document.createElement('img');
  const url=URL.createObjectURL(blob);
  image.className='live-preview-image';
  image.alt=alt;
  image.onload=()=>URL.revokeObjectURL(url);
  image.onerror=()=>URL.revokeObjectURL(url);
  image.src=url;
  return image;
}

async function renderPdfPreviewPage(file,scale=1.2){
  const {getDocument,GlobalWorkerOptions}=await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.mjs',import.meta.url).toString();
  const documentProxy=await getDocument({data:await file.arrayBuffer()}).promise;
  const page=await documentProxy.getPage(1);
  const viewport=page.getViewport({scale});
  const canvas=document.createElement('canvas');
  canvas.className='live-preview-canvas';
  canvas.width=Math.max(1,Math.ceil(viewport.width));
  canvas.height=Math.max(1,Math.ceil(viewport.height));
  const context=canvas.getContext('2d');
  if(!context)throw new Error('Canvas preview is unavailable in this browser.');
  await page.render({canvasContext:context,viewport}).promise;
  return {canvas,pages:documentProxy.numPages,width:canvas.width,height:canvas.height};
}

async function backgroundBlob(image){
  const canvas=document.createElement('canvas');
  canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
  const context=canvas.getContext('2d');
  if(!context)throw new Error('Canvas processing is unavailable in this browser.');
  context.drawImage(image,0,0);
  const data=context.getImageData(0,0,canvas.width,canvas.height),pixels=data.data;
  const samples=[];
  for(const [x,y] of [[0,0],[canvas.width-1,0],[0,canvas.height-1],[canvas.width-1,canvas.height-1]]){
    const offset=(y*canvas.width+x)*4;samples.push([pixels[offset],pixels[offset+1],pixels[offset+2]]);
  }
  const background=samples.reduce((sum,pixel)=>sum.map((value,index)=>value+pixel[index]/samples.length),[0,0,0]);
  for(let offset=0;offset<pixels.length;offset+=4){
    const distance=Math.abs(pixels[offset]-background[0])+Math.abs(pixels[offset+1]-background[1])+Math.abs(pixels[offset+2]-background[2]);
    if(distance<42)pixels[offset+3]=0;
  }
  context.putImageData(data,0,0);
  return canvasToBlob(canvas,'image/png');
}

async function updateLivePreview(revision){
  const stage=document.querySelector('#live-preview-stage');
  const status=document.querySelector('#live-preview-status');
  const picker=document.querySelector('#preview-file');
  if(!stage||!status)return;
  const tool=S.tool;
  if(!S.files.length){
    stage.innerHTML='<div class="live-preview-empty"><span class="live-preview-empty-icon"><i data-lucide="eye"></i></span><b>Your preview will appear here</b><span>Select an image or PDF to begin.</span></div>';
    createIcons({icons,attrs:{'stroke-width':1.8}});
    setLivePreviewMeta([]);
    status.textContent='Choose a file to see an on-device preview. No file is downloaded until you process it.';
    if(picker)picker.hidden=true;
    return;
  }

  const isWholePdfOutput=tool==='pdf'||tool==='pdfmerge';
  const multiFilePreview=S.files.length>1&&!isWholePdfOutput;
  const previewIndex=multiFilePreview?Math.max(0,Math.min(Number(S.previewIndex)||0,S.files.length-1)):0;
  const file=S.files[previewIndex];
  if(picker){
    picker.hidden=!multiFilePreview;
    picker.innerHTML=multiFilePreview?S.files.map((item,index)=>'<option value="'+index+'">'+esc(item.name||('File '+(index+1)))+'</option>').join(''):'';
    picker.value=String(previewIndex);
    picker.onchange=()=>{S.previewIndex=Number(picker.value)||0;scheduleLivePreview(0)};
  }
  status.textContent='Updating live preview locally…';
  setLivePreviewMeta([]);
  try{
    if(PDF_SUITE_PDF_INPUTS.includes(tool)){
      const rendered=await renderPdfPreviewPage(file,0.9);
      if(revision!==livePreviewRevision)return;
      if(['pdfwatermark','pdfedit','pdfsign'].includes(tool)){
        const context=rendered.canvas.getContext('2d');
        const opt=id=>document.querySelector('[data-pdf-opt="'+id+'"]')?.value||'';
        let text=tool==='pdfwatermark'?opt('watermarkText'):tool==='pdfsign'?[opt('signatureName'),opt('signatureDate')].filter(Boolean).join(' • '):opt('annotationText');
        if(text&&context){context.save();context.globalAlpha=0.6;context.fillStyle='#777';context.textAlign='center';context.font='bold '+Math.max(12,Number(opt('fontSize')||24))+'px sans-serif';context.translate(rendered.canvas.width/2,rendered.canvas.height/2);if(tool==='pdfwatermark')context.rotate((Number(opt('watermarkAngle')||-35))*Math.PI/180);context.fillText(text.slice(0,140),0,0,rendered.canvas.width*0.8);context.restore();}
      }
      showLivePreviewElement(rendered.canvas);
      status.textContent=['pdfwatermark','pdfedit','pdfsign'].includes(tool)?'Preview includes an approximate overlay. Press Process & Download to create the actual PDF.':'Source PDF page preview. Choose settings, then press Process & Download to generate the output.';
      setLivePreviewMeta(['Source: PDF',rendered.width+' × '+rendered.height+' px','Page 1 of '+rendered.pages,S.files.length+' input file'+(S.files.length===1?'':'s')]);
      return;
    }
    if(tool==='htmltopdf'||tool==='wordtopdf'){
      const stage=document.querySelector('#live-preview-stage');
      if(stage)stage.innerHTML='<div class="live-preview-empty"><span class="live-preview-empty-icon"><i data-lucide="file-text"></i></span><b>'+esc(file.name||'Selected document')+'</b><span>The document will be converted locally when you process it.</span></div>';
      createIcons({icons,attrs:{'stroke-width':1.8}});
      status.textContent='Source document selected. Output will be generated locally.';
      setLivePreviewMeta(['Input: '+(tool==='htmltopdf'?'HTML':'DOCX'),size(file.size)]);
      return;
    }
    if(tool==='pdf'||tool==='pdfmerge'){
      const output=tool==='pdf'?await pdf(S.files,false):await mergePdfs(S.files,false);
      const rendered=await renderPdfPreviewPage(output,1.2);
      if(revision!==livePreviewRevision)return;
      showLivePreviewElement(rendered.canvas);
      status.textContent=tool==='pdf'?'Previewing page 1 of the PDF that will be created.':'Previewing page 1 of the merged PDF.';
      setLivePreviewMeta(['Output: PDF','A4 page','Page 1 of '+rendered.pages,size(output.size),S.files.length+' input file'+(S.files.length===1?'':'s')]);
      return;
    }
    if(tool==='pdf2image'){
      const rendered=await renderPdfPreviewPage(file,S.pdfScale);
      const output=await canvasToBlob(rendered.canvas,S.pdfFormat,S.pdfFormat==='image/jpeg'?.92:undefined);
      if(revision!==livePreviewRevision)return;
      showLivePreviewElement(rendered.canvas);
      status.textContent='Previewing page 1 of '+rendered.pages+' from '+(file.name||'the selected PDF')+'.';
      setLivePreviewMeta(['Output: '+label(output.type),rendered.width+' × '+rendered.height+' px',size(output.size),'Scale: '+S.pdfScale+'×']);
      return;
    }

    const image=await img(file);
    let output,width,height;
    if(tool==='editor'){
      output=await editBlob(image,S.brightness,S.contrast,S.rotation);
    }else if(tool==='crop'){
      [width,height]=toolDimensions(image);
      output=await cropBlob(image,width,height,S.rotation,'image/jpeg',S.quality);
    }else if(tool==='background'){
      output=await backgroundBlob(image);
    }else if(tool==='exif'||tool==='ocr'){
      output=await canvasToBlob(canvasFor(image),'image/png');
    }else if(tool==='target'){
      [width,height]=toolDimensions(image);
      output=await targetSizeBlob(image,S.target*1024,width,height);
    }else{
      [width,height]=toolDimensions(image);
      const type=tool==='convert'?S.format:'image/jpeg';
      output=await blob(image,type,S.quality,width,height);
    }
    if(revision!==livePreviewRevision)return;
    const previewImage=await img(output);
    if(revision!==livePreviewRevision)return;
    showLivePreviewElement(makePreviewImage(output,'Live preview of '+(file.name||'the selected file')));
    const items=['Output: '+label(output.type),previewImage.naturalWidth+' × '+previewImage.naturalHeight+' px',size(output.size)];
    if(tool==='target')items.push('Target: '+S.target+' KB');
    if(tool==='background')items.push('Transparent PNG preview');
    if(tool==='exif')items.push('Metadata stripped by re-encoding');
    if(multiFilePreview)items.push('File '+(previewIndex+1)+' of '+S.files.length);
    status.textContent=tool==='ocr'?'Source image preview. Recognised text appears after you choose Extract Text.':'Preview refreshes as you change settings. Processing has not started yet.';
    setLivePreviewMeta(items);
  }catch(error){
    if(revision!==livePreviewRevision)return;
    stage.innerHTML='<div class="live-preview-error"><b>Preview unavailable</b><span>'+esc(error?.message||'This file cannot be previewed in the browser.')+'</span></div>';
    setLivePreviewMeta([]);
    status.textContent='Change the settings or try another file. Your original file has not been changed.';
  }
}

async function normalizeImageFile(file){
  if(!isHeic(file))return file;
  const {default:heic2any}=await import('heic2any');
  const out=await heic2any({blob:file,toType:'image/png',quality:1});
  return Array.isArray(out)?out[0]:out;
}
async function img(file){
  const source=await normalizeImageFile(file);
  return new Promise((ok,no)=>{
    const i=new Image();
    const url=URL.createObjectURL(source);
    i.onload=()=>{URL.revokeObjectURL(url);ok(i)};
    i.onerror=()=>{URL.revokeObjectURL(url);no(new Error('The selected image could not be decoded.'))};
    i.src=url;
  })
}
function canvasToBlob(canvas,type,quality){
  return new Promise((resolve,reject)=>{
    canvas.toBlob(blobValue=>{
      if(!blobValue){
        reject(new Error(type==='image/avif'?'AVIF is not supported by this browser. Choose WebP, JPG or PNG.':'The browser could not create the requested output file.'));
        return;
      }
      if(blobValue.type!==type){
        reject(new Error(type==='image/avif'?'AVIF encoding is not supported by this browser. Choose WebP, JPG or PNG.':'The browser returned '+(blobValue.type||'an unknown format')+' instead of '+type+'. Choose another output format.'));
        return;
      }
      resolve(blobValue);
    },type,quality);
  });
}
function blob(i,type,q,w,h){
  const c=document.createElement('canvas');
  c.width=w||i.naturalWidth;
  c.height=h||i.naturalHeight;
  const ctx=c.getContext('2d');
  if(!ctx)throw new Error('Canvas processing is unavailable in this browser.');
  if(type==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height)}
  ctx.drawImage(i,0,0,c.width,c.height);
  return canvasToBlob(c,type,q);
}
function history(){try{return JSON.parse(localStorage.getItem('imagemate-history')||'[]')}catch{return[]}}
function addHistory(name,tool,sizeBytes,extra={}){const h=history();h.unshift({name,tool,size:sizeBytes,at:new Date().toISOString(),...extra});localStorage.setItem('imagemate-history',JSON.stringify(h.slice(0,50)))}
async function nativeDownloadedFiles(){if(!isNativeAndroid())return history();try{const r=await ImageMateUpdaterList();return r?.files||[]}catch{return history()}}
async function ImageMateUpdaterList(){return (await import('./updater.js')).listDownloadedFiles()}
async function openDownloadedFile(path){try{await (await import('./updater.js')).openDownloadedFile(path)}catch(e){console.error(e);const msg=e?.message||e?.errorMessage||'No compatible app is installed for this file type.';alert('Unable to open this file.\\n\\n'+msg)}}
async function deleteNativeDownloadedFile(path,name){
  if(!confirm('Permanently delete "'+name+'" from this device? This cannot be undone.'))return;
  try{
    const result=await (await import('./updater.js')).deleteDownloadedFile(path);
    if(!result?.deleted)throw new Error('The file was not deleted.');
    await renderDownloads();
  }catch(e){
    console.error(e);
    const msg=e?.message||e?.errorMessage||'Storage error';
    alert('Unable to delete this file.\\n\\n'+msg);
  }
}
function removeBrowserHistory(index,name){
  if(!confirm('Remove "'+name+'" from ImageMate history? The downloaded file in your browser or Downloads folder will not be deleted.'))return;
  const entries=history(),position=Number(index);
  if(!Number.isInteger(position)||position<0||position>=entries.length)return;
  entries.splice(position,1);
  localStorage.setItem('imagemate-history',JSON.stringify(entries));
  renderDownloads();
}
async function shareDownloadedFile(path){try{await (await import('./updater.js')).shareDownloadedFile(path)}catch(e){console.error(e);const msg=e?.message||e?.errorMessage||'No compatible sharing app is available.';alert('Unable to share this file.\\n\\n'+msg)}}
async function exportDownloadedFile(path,name,mime){
  try{
    await (await import('./updater.js')).exportDownloadedFile(path,name,mime);
    showResult('File saved','A copy was saved to your device Downloads folder.');
  }catch(e){
    console.error(e);
    const msg=e?.message||e?.errorMessage||'Storage error';
    alert('Unable to save another copy.\\n\\n'+msg);
  }
}
async function renderDownloads(){
  const workspace=document.querySelector('#download-library');if(!workspace)return;
  workspace.innerHTML='<div class="downloads-head"><div><p class="eyebrow">YOUR FILES</p><h2>File library</h2><p class="downloads-sub">Delete saved files on Android, or remove browser history entries on the web.</p></div><button id="refresh-downloads" class="secondary">Refresh</button></div><div id="downloaded-list" class="downloaded-list"><div class="empty-downloads">Loading files…</div></div>';
  const list=await nativeDownloadedFiles();const el=document.querySelector('#downloaded-list');if(!el)return;
  if(!list.length){el.innerHTML='<div class="empty-downloads"><b>No downloaded files yet</b><span>Processed files will appear here automatically.</span></div>';return}
  const nativeLibrary=isNativeAndroid();
  el.innerHTML=list.map((f,i)=>'<article class="download-item"><div class="download-icon"><i data-lucide="file-check-2"></i></div><div class="download-info"><b>'+esc(f.name||('File '+(i+1)))+'</b><span>'+(f.mime?label(f.mime)+' • ':'')+(f.size?size(+f.size)+' • ':'')+(f.at?new Date(f.at).toLocaleString():'')+'</span></div><div class="download-actions">'+(nativeLibrary?'<button class="secondary open-file" data-path="'+esc(f.path)+'">Open</button><button class="secondary share-file" data-path="'+esc(f.path)+'">Share</button><button class="primary save-copy" data-path="'+esc(f.path)+'" data-name="'+esc(f.name||'ImageMate-file')+'" data-mime="'+esc(f.mime||'application/octet-stream')+'">Download again</button><button class="secondary delete-file" data-path="'+esc(f.path)+'" data-name="'+esc(f.name||'ImageMate-file')+'" aria-label="Delete '+esc(f.name||'file')+'">Delete</button>':'<span class="browser-history-note">Browser download history — the browser does not allow sites to delete downloaded files</span><button class="secondary remove-history" data-index="'+i+'" data-name="'+esc(f.name||('File '+(i+1)))+'">Remove history</button>')+'</div></article>').join('');
  if(nativeLibrary){
    el.querySelectorAll('.open-file').forEach(b=>b.onclick=()=>openDownloadedFile(b.dataset.path));
    el.querySelectorAll('.share-file').forEach(b=>b.onclick=()=>shareDownloadedFile(b.dataset.path));
    el.querySelectorAll('.save-copy').forEach(b=>b.onclick=()=>exportDownloadedFile(b.dataset.path,b.dataset.name,b.dataset.mime));
    el.querySelectorAll('.delete-file').forEach(b=>b.onclick=()=>deleteNativeDownloadedFile(b.dataset.path,b.dataset.name));
  }else{
    el.querySelectorAll('.remove-history').forEach(b=>b.onclick=()=>removeBrowserHistory(b.dataset.index,b.dataset.name));
  }
  const rb=document.querySelector('#refresh-downloads');if(rb)rb.onclick=renderDownloads;
}
function setProgress(percent,label='Processing'){const q=document.querySelector('#progress-wrap');if(!q)return;const p=Math.max(0,Math.min(100,Math.round(percent)));const bar=q.querySelector('.progress-bar');const text=q.querySelector('.progress-text');if(bar)bar.style.width=p+'%';if(text)text.textContent=label+' '+p+'%'}
function blobBase64(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]||'');r.onerror=reject;r.readAsDataURL(blob)})}
async function dl(b,n,mime){if(!b)return;const type=mime||b.type||'application/octet-stream';if(isNativeAndroid()){try{const saved=await saveProcessedFile(n,type,await blobBase64(b));addHistory(n,S.tool,b.size,{path:saved?.path||'',mime:type});return}catch(e){console.warn('Native save failed, falling back to browser download',e)}}const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();addHistory(n,S.tool,b.size);setTimeout(()=>URL.revokeObjectURL(u),1500)}
function canvasFor(i,w,h,fillWhite=false){
  const c=document.createElement('canvas');c.width=w||i.naturalWidth;c.height=h||i.naturalHeight;
  const ctx=c.getContext('2d');if(!ctx)throw new Error('Canvas processing is unavailable in this browser.');
  if(fillWhite){ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height)}
  ctx.drawImage(i,0,0,c.width,c.height);return c
}
async function pdf(files,download=true){
  const {jsPDF}=await import('jspdf');
  const doc=new jsPDF({unit:'mm',format:'a4'});
  for(let n=0;n<files.length;n++){
    if(n)doc.addPage();
    const image=await img(files[n]);
    const fit=Math.min(1,1800/image.naturalWidth,2600/image.naturalHeight);
    const canvas=canvasFor(image,Math.max(1,Math.round(image.naturalWidth*fit)),Math.max(1,Math.round(image.naturalHeight*fit)),true);
    const maxW=190,maxH=277,scale=Math.min(maxW/canvas.width,maxH/canvas.height);
    const width=canvas.width*scale,height=canvas.height*scale;
    const x=(210-width)/2,y=(297-height)/2;
    doc.addImage(canvas.toDataURL('image/jpeg',.92),'JPEG',x,y,width,height);
  }
  const output=doc.output('blob');
  if(download)await dl(output,'imagemate-images.pdf','application/pdf');
  return output;
}
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

async function targetSizeBlob(i,maxBytes,w,h){
  let width=Math.max(1,Math.round(w||i.naturalWidth));
  let height=Math.max(1,Math.round(h||i.naturalHeight));
  let best=null;
  for(let pass=0;pass<8;pass++){
    const minimum=await blob(i,'image/jpeg',.02,width,height);
    if(minimum.size<=maxBytes){
      best=minimum;
      let lo=.02,hi=.95;
      for(let step=0;step<9;step++){
        const qq=(lo+hi)/2;
        const candidate=await blob(i,'image/jpeg',qq,width,height);
        if(candidate.size<=maxBytes){best=candidate;lo=qq}else hi=qq;
      }
      return best;
    }
    width=Math.max(1,Math.round(width*.72));
    height=Math.max(1,Math.round(height*.72));
  }
  return best||await blob(i,'image/jpeg',.02,width,height);
}

async function processBatchZip(){
  if(!S.files.length)return alert('Choose at least one image.');
  if(S.tool==='pdf'||S.tool==='pdf2image'||S.tool==='pdfmerge')return alert('Batch ZIP is not available for this tool.');
  const btn=document.querySelector('#zip');if(!btn)return;
  btn.disabled=true;btn.textContent='Creating ZIP…';try{const {default:JSZip}=await import('jszip');const zip=new JSZip();for(const f of S.files){const i=await img(f);const [w,h]=toolDimensions(i);let type=S.tool==='convert'?S.format:'image/jpeg';let b=S.tool==='crop'?await cropBlob(i,w,h,S.rotation,type,S.quality):await blob(i,type,S.quality,w,h);if(S.tool==='target')b=await targetSizeBlob(i,S.target*1024,w,h);zip.file(name(f.name,label(type).toLowerCase()),b)}dl(await zip.generateAsync({type:'blob',compression:'DEFLATE'}),'imagemate-'+S.tool+'-batch.zip');await maybeShowTestInterstitial()}catch(e){console.error(e);alert('Could not create the ZIP. Please try fewer or smaller images.')}finally{btn.disabled=false;btn.textContent='Download ZIP'}}
async function processPdfSuite(){
  const btn=document.querySelector('#process');
  if(btn){btn.disabled=true;btn.textContent='Processing PDF…'}
  const wrap=document.querySelector('#progress-wrap');if(wrap)wrap.hidden=false;setProgress(3,'Processing locally');
  try{
    const options={};
    document.querySelectorAll('#settings [data-pdf-opt]').forEach(el=>{options[el.dataset.pdfOpt]=el.value});
    const outputs=await runPdfTool(S.tool,S.files,options);
    if(!Array.isArray(outputs)||!outputs.length)throw new Error('No output was produced.');
    let finalBlob,finalName,finalMime;
    if(outputs.length===1){finalBlob=outputs[0].blob;finalName=outputs[0].name;finalMime=finalBlob.type||'application/octet-stream'}
    else{
      const {default:JSZip}=await import('jszip');const zip=new JSZip();
      outputs.forEach(output=>zip.file(output.name,output.blob));
      finalBlob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:5}});
      finalName='imagemate-'+S.tool+'-results.zip';finalMime='application/zip';
    }
    await dl(finalBlob,finalName,finalMime);setProgress(100,'Complete');
    const tool=tools.find(item=>item[0]===S.tool);
    showResult('PDF tool complete','Your output is ready: <b>'+esc(finalName)+'</b>. '+outputs.length+' output file'+(outputs.length===1?'':'s')+' created. Files were processed on this device.');
  }catch(error){
    console.error(error);setProgress(0,'Could not finish');
    alert('Could not process this PDF. '+(error?.message||'Please check the file and settings, then try again.'));
  }finally{if(btn){btn.disabled=false;btn.textContent='Process & Download'}}
}
async function process(){
  if(PDF_SUITE_TOOLS.includes(S.tool)){if(!S.files.length&&S.tool!=='pdfforms')return alert(S.tool==='htmltopdf'?'Choose an HTML file.':S.tool==='wordtopdf'?'Choose a DOCX file.':'Choose at least one PDF.');return processPdfSuite()}
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
      if(S.tool==='target')b=await targetSizeBlob(i,S.target*1024,w,h);
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
  if(!x)throw new Error('Canvas processing is unavailable in this browser.');
  x.translate(c.width/2,c.height/2);x.rotate(rotation*Math.PI/180);
  x.filter='brightness('+(100+Number(brightness||0))+'%) contrast('+(100+Number(contrast||0))+'%)';
  x.fillStyle='#fff';x.fillRect(-c.width/2,-c.height/2,c.width,c.height);
  x.drawImage(i,-i.naturalWidth/2,-i.naturalHeight/2);
  return canvasToBlob(c,'image/jpeg',.92);
}
async function mergePdfs(files,download=true){
  const {createPdfToolkit}=await import('pdfstudio');
  const pdf=await createPdfToolkit();
  const output=await pdf.merge(files);
  const result=new Blob([output],{type:'application/pdf'});
  if(download)await dl(result,'imagemate-merged.pdf','application/pdf');
  return result;
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
  const x=c.getContext('2d'); if(!x)throw new Error('Canvas processing is unavailable in this browser.');
  x.translate(w/2,h/2); x.rotate(angle*Math.PI/180);
  if(type==='image/jpeg'){x.fillStyle='#fff';x.fillRect(-w/2,-h/2,w,h)}
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
    const i=await img(file),out=await backgroundBlob(i);
    await dl(out,file.name.replace(/\.[^.]+$/,'')+'-background-removed.png','image/png');
  }
}

render();
initGitHubOta();
