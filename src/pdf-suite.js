import { jsPDF } from 'jspdf';

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
let toolkitPromise;

async function toolkit() {
  if (!toolkitPromise) {
    toolkitPromise = import('pdfstudio').then(({ createPdfToolkit }) => createPdfToolkit());
  }
  return toolkitPromise;
}
const baseName = file => (file?.name || 'document.pdf').replace(/\.[^.]+$/, '');
const xml = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const toPdf = (bytes, name) => ({ name, blob: new Blob([bytes], { type: PDF_MIME }) });
const textFile = (text, name, mime = 'text/plain;charset=utf-8') => ({ name, blob: new Blob([text], { type: mime }) });
const bytesFile = (bytes, name, mime) => ({ name, blob: new Blob([bytes], { type: mime }) });
async function pdfJs(file, password = '') {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
  return getDocument({ data: new Uint8Array(await file.arrayBuffer()), ...(password ? { password } : {}) }).promise;
}
async function readPdfPages(file, password = '') {
  const doc = await pdfJs(file, password);
  const pages = [];
  for (let number = 1; number <= doc.numPages; number++) {
    const page = await doc.getPage(number);
    const content = await page.getTextContent();
    const items = content.items.filter(item => typeof item.str === 'string' && item.str.trim()).map(item => ({
      text: item.str,
      x: Number(item.transform?.[4] || 0),
      y: Number(item.transform?.[5] || 0),
      width: Number(item.width || 0)
    }));
    pages.push({ number, text: items.map(item => item.text).join(' '), items, page });
  }
  return { doc, pages };
}
function splitRange(pages) {
  const value = String(pages || '').trim();
  if (!value || !/^[\d\s,;:rxz-]+$/i.test(value)) throw new Error('Enter page numbers or ranges such as 1-3,5. You can use z for the last page.');
  return value.replace(/;/g, ',').replace(/\s+/g, '');
}
async function saveFromToolkit(bytes, name) { return toPdf(bytes, name); }

function pdfTextStamp(text, opts = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const fontSize = Math.max(8, Math.min(46, Number(opts.fontSize) || 24));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontSize);
  doc.setTextColor(150, 150, 150);
  const value = String(text || '').slice(0, 500);
  const angle = Math.max(-90, Math.min(90, Number(opts.angle ?? -35)));
  doc.text(value, pageWidth / 2, pageHeight / 2, { align: 'center', angle, maxWidth: pageWidth * 0.8 });
  return doc.output('blob');
}
async function pdfPagesToText(file, password = '') {
  const { pages } = await readPdfPages(file, password);
  return pages.map(p => '===== Page ' + p.number + ' =====\n' + p.text).join('\n\n');
}
function docxXmlFromParagraphs(paragraphs) {
  const runs = paragraphs.map(text => '<w:p><w:r><w:t xml:space="preserve">' + xml(text || ' ') + '</w:t></w:r></w:p>').join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + runs +
    '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>';
}
async function createDocx(paragraphs, name) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', docxXmlFromParagraphs(paragraphs));
  return bytesFile(await zip.generateAsync({ type: 'uint8array' }), name, DOCX_MIME);
}
async function createXlsx(rows, name) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const letters = index => { let n = index + 1, out = ''; while (n) { const r = (n - 1) % 26; out = String.fromCharCode(65 + r) + out; n = Math.floor((n - 1) / 26); } return out; };
  const sheetRows = rows.map((row, ri) => '<row r="' + (ri + 1) + '">' + row.map((cell, ci) => '<c r="' + letters(ci) + (ri + 1) + '" t="inlineStr"><is><t xml:space="preserve">' + xml(cell) + '</t></is></c>').join('') + '</row>').join('');
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.file('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="PDF Extract" sheetId="1" r:id="rId1"/></sheets></workbook>');
  zip.file('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
  zip.file('xl/worksheets/sheet1.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + sheetRows + '</sheetData></worksheet>');
  return bytesFile(await zip.generateAsync({ type: 'uint8array' }), name, XLSX_MIME);
}
async function createPptx(file, outputName, password = '') {
  const { default: JSZip } = await import('jszip');
  const { doc, pages } = await readPdfPages(file, password);
  if (doc.numPages > 120) throw new Error('For performance, export at most 120 PDF pages to PowerPoint at a time.');
  const zip = new JSZip();
  const relNS = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const slideIds = pages.map((p, i) => '<p:sldId id="' + (256 + i) + '" r:id="rId' + (i + 2) + '"/>').join('');
  const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>' + pages.map((p, i) => '<Override PartName="/ppt/slides/slide' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>').join('') + '</Types>';
  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + relNS + '"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>');
  zip.file('ppt/presentation.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>' + slideIds + '</p:sldIdLst><p:sldSz cx="9144000" cy="5143500" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>');
  zip.file('ppt/_rels/presentation.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + relNS + '"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>' + pages.map((p, i) => '<Relationship Id="rId' + (i + 2) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide' + (i + 1) + '.xml"/>').join('') + '</Relationships>');
  zip.file('ppt/slideMasters/slideMaster1.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:sldMaster>');
  zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + relNS + '"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>');
  zip.file('ppt/slideLayouts/slideLayout1.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>');
  zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + relNS + '"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>');
  zip.file('ppt/theme/theme1.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="ImageMate"><a:themeElements><a:clrScheme name="ImageMate"><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="ImageMate"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme><a:fmtScheme name="ImageMate"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:themeElements></a:theme>');
  for (const entry of pages) {
    const pageNo = entry.number;
    const page = entry.page;
    const viewport = page.getViewport({ scale: Math.min(1.6, 1500 / page.getViewport({ scale: 1 }).width, 900 / page.getViewport({ scale: 1 }).height) });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable for PowerPoint conversion.');
    await page.render({ canvasContext: ctx, viewport }).promise;
    const png = await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Unable to render PDF page ' + pageNo)), 'image/png'));
    zip.file('ppt/media/image' + pageNo + '.png', png);
    zip.file('ppt/slides/slide' + pageNo + '.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr><p:pic><p:nvPicPr><p:cNvPr id="2" name="PDF page ' + pageNo + '"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="5143500"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>');
    zip.file('ppt/slides/_rels/slide' + pageNo + '.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + relNS + '"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image' + pageNo + '.png"/></Relationships>');
  }
  return bytesFile(await zip.generateAsync({ type: 'uint8array' }), outputName, PPTX_MIME);
}
async function extractDocxText(file) {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(file);
  const part = zip.file('word/document.xml');
  if (!part) throw new Error('This does not look like a DOCX file. Use a modern .docx document; legacy .doc files are not supported.');
  const content = await part.async('text');
  const paragraphs = [...content.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)].map(m => [...m[1].matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map(t => {
    const holder = document.createElement('textarea'); holder.innerHTML = t[1]; return holder.value;
  }).join(''));
  return paragraphs.filter((p, i) => p.trim() || i === 0);
}
async function htmlFileToPdf(file) {
  const markup = await file.text();
  const docHtml = new DOMParser().parseFromString(markup, 'text/html');
  docHtml.querySelectorAll('script,style,template,noscript').forEach(el => el.remove());
  const title = docHtml.title || baseName(file);
  const textContent = (docHtml.body?.innerText || docHtml.body?.textContent || '').split('\n').map(s => s.trim()).filter(Boolean);
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.text(title, 48, 56, { maxWidth: 500 });
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
  let y = 84;
  for (const paragraph of textContent) {
    const lines = pdf.splitTextToSize(paragraph, 500);
    if (y + lines.length * 13 > 780) { pdf.addPage(); y = 48; }
    pdf.text(lines, 48, y); y += lines.length * 13 + 8;
  }
  return { name: baseName(file) + '.pdf', blob: pdf.output('blob') };
}
async function wordFileToPdf(file) {
  const paragraphs = await extractDocxText(file);
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11);
  let y = 48;
  for (const paragraph of paragraphs) {
    const lines = pdf.splitTextToSize(paragraph || ' ', 500);
    if (y + lines.length * 15 > 780) { pdf.addPage(); y = 48; }
    pdf.text(lines, 48, y); y += lines.length * 15 + 5;
  }
  return { name: baseName(file) + '.pdf', blob: pdf.output('blob') };
}
async function pdfToSpreadsheet(file, password = '') {
  const { pages } = await readPdfPages(file, password);
  const rows = [['Page', 'Text']];
  for (const page of pages) {
    const lines = new Map();
    for (const item of page.items) {
      const y = Math.round(item.y / 3) * 3;
      const group = lines.get(y) || [];
      group.push(item); lines.set(y, group);
    }
    for (const [, items] of [...lines.entries()].sort((a, b) => b[0] - a[0])) {
      items.sort((a, b) => a.x - b.x);
      const cells = [];
      let cellText = '', previous = null;
      for (const item of items) {
        if (previous && item.x - (previous.x + previous.width) > 24 && cellText) { cells.push(cellText.trim()); cellText = ''; }
        cellText += (cellText && !/\s$/.test(cellText) ? ' ' : '') + item.text;
        previous = item;
      }
      if (cellText.trim()) cells.push(cellText.trim());
      rows.push([String(page.number), ...cells.slice(0, 20)]);
    }
  }
  return createXlsx(rows, baseName(file) + '.xlsx');
}

const requiresPdf = new Set([
  'pdfalternate','pdforganize','pdfextract','pdfsplitpages','pdfsplitbookmarks','pdfsplithalf',
  'pdfsplitsize','pdfsplittext','pdfedit','pdfsign','pdfdelete','pdfcompress','pdfprotect',
  'pdfunlock','pdfwatermark','pdfflatten','pdfexcel','pdfppt','pdftext','pdftoword'
]);

export async function runPdfTool(tool, files = [], options = {}) {
  const pdf = await toolkit();
  const source = files[0];
  const stem = baseName(source);
  if (requiresPdf.has(tool) && !source) throw new Error('Choose a PDF file first.');
  if (['pdfalternate','pdfmerge'].includes(tool) && files.length < 2) throw new Error('Choose at least two PDF files.');
  if (tool === 'pdfalternate') {
    const output = await pdf.collate(files);
    return [await saveFromToolkit(output, 'imagemate-alternate-mix.pdf')];
  }
  if (tool === 'pdfmerge') {
    const output = await pdf.merge(files);
    return [await saveFromToolkit(output, 'imagemate-merged.pdf')];
  }
  if (tool === 'pdforganize') {
    const output = await pdf.merge([{ data: source, pages: splitRange(options.pageOrder) }]);
    return [await saveFromToolkit(output, stem + '-organized.pdf')];
  }
  if (tool === 'pdfextract') {
    const output = await pdf.extractPages(source, { pages: splitRange(options.pages) });
    return [await saveFromToolkit(output, stem + '-extracted-pages.pdf')];
  }
  if (tool === 'pdfsplitpages') {
    const perFile = Math.max(1, Math.min(500, Number(options.pagesPerFile) || 1));
    const outputs = await pdf.split(source, { pagesPerFile: perFile });
    return outputs.map((bytes, i) => toPdf(bytes, stem + '-part-' + String(i + 1).padStart(2, '0') + '.pdf'));
  }
  if (tool === 'pdfsplitbookmarks') {
    const { doc, pages } = await readPdfPages(source, options.password || '');
    const outline = await doc.getOutline();
    if (!outline?.length) throw new Error('No PDF bookmarks were found. Try Split by Pages or Extract Pages instead.');
    const items = [];
    async function flattenOutline(nodes) {
      for (const item of nodes || []) {
        if (item.dest) {
          try {
            const dest = Array.isArray(item.dest) ? item.dest : await doc.getDestination(item.dest);
            if (dest?.[0]) items.push({ title: item.title || 'Section', page: await doc.getPageIndex(dest[0]) + 1 });
          } catch { /* Ignore invalid outline targets */ }
        }
        if (item.items?.length) await flattenOutline(item.items);
      }
    }
    await flattenOutline(outline);
    const anchors = [...new Map(items.sort((a, b) => a.page - b.page).map(x => [x.page, x])).values()];
    if (!anchors.length) throw new Error('The bookmarks do not point to readable pages.');
    return Promise.all(anchors.map(async (item, i) => {
      const end = (anchors[i + 1]?.page || pages.length + 1) - 1;
      const bytes = await pdf.extractPages(source, { pages: item.page + '-' + end });
      return toPdf(bytes, stem + '-' + String(item.title).replace(/[^a-z0-9_-]+/gi, '-').slice(0, 40) + '.pdf');
    }));
  }
  if (tool === 'pdfsplithalf') {
    const count = await pdf.pageCount(source);
    if (count < 2) throw new Error('At least two pages are needed to split a PDF in half.');
    const mid = Math.floor(count / 2);
    const a = await pdf.extractPages(source, { pages: '1-' + mid });
    const b = await pdf.extractPages(source, { pages: (mid + 1) + '-' + count });
    return [toPdf(a, stem + '-first-half.pdf'), toPdf(b, stem + '-second-half.pdf')];
  }
  if (tool === 'pdfsplitsize') {
    const limit = Math.max(0.25, Math.min(100, Number(options.maxMb) || 5)) * 1024 * 1024;
    const count = await pdf.pageCount(source);
    const output = [];
    let bucket = [], estimatedBytes = 0;
    for (let page = 1; page <= count; page++) {
      const bytes = await pdf.extractPages(source, { pages: String(page) });
      const blob = new Blob([bytes]);
      if (bucket.length && estimatedBytes + blob.size > limit) {
        output.push(await pdf.merge(bucket));
        bucket = []; estimatedBytes = 0;
      }
      bucket.push(blob); estimatedBytes += blob.size;
      if (blob.size > limit) output.push(...(bucket.length === 1 ? [bytes] : [])), bucket = [], estimatedBytes = 0;
    }
    if (bucket.length) output.push(await pdf.merge(bucket));
    if (!output.length) throw new Error('No output pages were created.');
    return output.map((bytes, i) => toPdf(bytes, stem + '-size-part-' + (i + 1) + '.pdf'));
  }
  if (tool === 'pdfsplittext') {
    const phrase = String(options.matchText || '').trim();
    if (!phrase) throw new Error('Enter text to search for before splitting.');
    const { pages } = await readPdfPages(source, options.password || '');
    const match = pages.filter(page => page.text.toLocaleLowerCase().includes(phrase.toLocaleLowerCase())).map(p => p.number);
    const rest = pages.filter(page => !match.includes(page.number)).map(p => p.number);
    if (!match.length) throw new Error('No pages contain that text. Check spelling or try a shorter phrase.');
    const outputs = [await pdf.extractPages(source, { pages: match.join(',') })];
    const names = [stem + '-matching-pages.pdf'];
    if (rest.length) { outputs.push(await pdf.extractPages(source, { pages: rest.join(',') })); names.push(stem + '-other-pages.pdf'); }
    return outputs.map((bytes, i) => toPdf(bytes, names[i]));
  }
  if (tool === 'pdfedit' || tool === 'pdfsign' || tool === 'pdfwatermark') {
    const text = tool === 'pdfwatermark' ? String(options.watermarkText || 'CONFIDENTIAL') :
      tool === 'pdfsign' ? [String(options.signatureName || 'Signed'), String(options.signatureDate || new Date().toLocaleDateString())].filter(Boolean).join('  •  ') :
      String(options.annotationText || '').trim();
    if (!text) throw new Error(tool === 'pdfedit' ? 'Enter text to add to the PDF.' : 'Enter the watermark or signature text.');
    const stamp = pdfTextStamp(text, { fontSize: options.fontSize, angle: tool === 'pdfwatermark' ? options.watermarkAngle ?? -35 : 0 });
    const config = tool === 'pdfwatermark' ? { repeat: 1 } : { to: splitRange(options.pages || '1'), repeat: 1 };
    const output = await pdf.watermark(source, stamp, config);
    return [await saveFromToolkit(output, stem + (tool === 'pdfwatermark' ? '-watermarked.pdf' : tool === 'pdfsign' ? '-signed.pdf' : '-annotated.pdf'))];
  }
  if (tool === 'pdfdelete') {
    const output = await pdf.deletePages(source, { pages: splitRange(options.pages) });
    return [await saveFromToolkit(output, stem + '-pages-removed.pdf')];
  }
  if (tool === 'pdfcompress') {
    const output = await pdf.compress(source);
    return [await saveFromToolkit(output, stem + '-compressed.pdf')];
  }
  if (tool === 'pdfprotect') {
    const userPassword = String(options.password || '');
    const ownerPassword = String(options.ownerPassword || userPassword);
    if (userPassword.length < 6) throw new Error('Use a password of at least 6 characters.');
    if (options.confirmPassword !== userPassword) throw new Error('The password confirmation does not match.');
    const output = await pdf.lock(source, { userPassword, ownerPassword, keyLength: 256, permissions: { print: 'full', modify: 'none', extract: false } });
    return [await saveFromToolkit(output, stem + '-protected.pdf')];
  }
  if (tool === 'pdfunlock') {
    const password = String(options.password || '');
    if (!password) throw new Error('Enter the PDF password to remove protection.');
    const output = await pdf.unlock(source, { password });
    return [await saveFromToolkit(output, stem + '-unlocked.pdf')];
  }
  if (tool === 'pdfflatten') {
    const output = await pdf.flatten(source);
    return [await saveFromToolkit(output, stem + '-flattened.pdf')];
  }
  if (tool === 'pdftext') {
    return [textFile(await pdfPagesToText(source, options.password || ''), stem + '.txt')];
  }
  if (tool === 'pdftoword') {
    const { pages } = await readPdfPages(source, options.password || '');
    const paragraphs = [];
    for (const page of pages) { paragraphs.push('Page ' + page.number); paragraphs.push(...page.text.split(/\n+/).filter(Boolean)); paragraphs.push(''); }
    return [await createDocx(paragraphs, stem + '.docx')];
  }
  if (tool === 'pdfexcel') return [await pdfToSpreadsheet(source, options.password || '')];
  if (tool === 'pdfppt') return [await createPptx(source, stem + '.pptx', options.password || '')];
  if (tool === 'htmltopdf') {
    if (!files[0]) throw new Error('Choose an .html or .htm file first.');
    return [await htmlFileToPdf(files[0])];
  }
  if (tool === 'wordtopdf') {
    if (!files[0]) throw new Error('Choose a .docx Word file first.');
    return [await wordFileToPdf(files[0])];
  }
  if (tool === 'pdfforms') {
    const labels = String(options.formLabels || 'Name,Email,Date,Comments').split(/[\n,;]+/).map(s => s.trim()).filter(Boolean).slice(0, 18);
    if (!labels.length) throw new Error('Add at least one form field label.');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text(String(options.formTitle || 'Fillable Form').slice(0, 100), 20, 22);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    if (!doc.AcroFormTextField) throw new Error('Interactive PDF form fields are unavailable in this build. Please update ImageMate and try again.');
    for (let i = 0; i < labels.length; i++) {
      if (i && i % 12 === 0) doc.addPage();
      const y = 35 + (i % 12) * 21;
      doc.text(labels[i].slice(0, 100), 20, y);
      const field = new doc.AcroFormTextField();
      field.fieldName = 'field_' + (i + 1) + '_' + labels[i].replace(/[^a-z0-9]+/gi, '_').slice(0, 24);
      field.Rect = [20, y + 2, 170, 10];
      field.fontSize = 10;
      doc.addField(field);
    }
    return [{ name: 'imagemate-fillable-form.pdf', blob: doc.output('blob') }];
  }
  throw new Error('This PDF tool is not available yet: ' + tool);
}

export const PDF_SUITE_TOOLS = [
  'pdfalternate','pdforganize','pdfextract','pdfsplitpages','pdfsplitbookmarks','pdfsplithalf',
  'pdfsplitsize','pdfsplittext','pdfedit','pdfsign','pdfforms','pdfdelete','pdfcompress',
  'pdfprotect','pdfunlock','pdfwatermark','pdfflatten','pdfexcel','pdfppt','pdftext','pdftoword',
  'htmltopdf','wordtopdf'
];
export const PDF_SUITE_PDF_INPUTS = [...requiresPdf];
