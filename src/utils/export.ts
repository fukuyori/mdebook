import type { EditorFile, BookMetadata, EpubManifestItem, EpubSpineItem, EpubTocItem, ProjectImage } from '../types';
import { convertToXhtml, processTablesInMarkdown, renderMermaidToSvg, parseMarkdown } from './markdown';
import { EPUB_CONTAINER_XML, EPUB_MIMETYPE } from '../constants';

// Declare external libraries (loaded via CDN)
declare const JSZip: new () => {
  file(path: string, content: string | Blob | ArrayBuffer, options?: { compression?: string }): void;
  folder(path: string): { file(path: string, content: string | ArrayBuffer): void } | null;
  generateAsync(options: { type: string; mimeType?: string }): Promise<Blob>;
};

declare function saveAs(blob: Blob, filename: string): void;

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  };
  return mimeToExt[mimeType] || '.bin';
}

/**
 * Export as Markdown ZIP file
 */
export async function exportMarkdownZip(
  files: EditorFile[],
  metadata: BookMetadata,
  images: ProjectImage[],
  onProgress?: (status: string) => void
): Promise<void> {
  onProgress?.('Generating Markdown ZIP...');
  
  const zip = new JSZip();
  
  // Create folders
  const chaptersFolder = zip.folder('chapters');
  const imagesFolder = zip.folder('images');
  
  if (!chaptersFolder || !imagesFolder) {
    throw new Error('Failed to create ZIP folders');
  }
  
  // Build image ID to filename mapping
  const imageFilenames: Record<string, string> = {};
  for (const image of images) {
    const ext = getExtensionFromMimeType(image.mimeType);
    const filename = `${image.id}${ext}`;
    imageFilenames[image.id] = filename;
  }
  
  // Process and add chapters
  const chapterFilenames: string[] = [];
  
  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx];
    const paddedIdx = String(idx + 1).padStart(2, '0');
    const baseName = file.name.replace(/\.md$/i, '');
    const chapterFilename = `${paddedIdx}-${baseName}.md`;
    
    onProgress?.(`Processing ${file.name}...`);
    
    // Convert image references from images/{id} to ../images/{id}.ext
    let content = file.content;
    for (const [imageId, filename] of Object.entries(imageFilenames)) {
      // Match both ![alt](images/{id}) and ![alt](images/{id} "title")
      const regex = new RegExp(`(!\\[[^\\]]*\\]\\()images/${imageId}(\\s*(?:"[^"]*")?\\))`, 'g');
      content = content.replace(regex, `$1../images/${filename}$2`);
    }
    
    chaptersFolder.file(chapterFilename, content);
    chapterFilenames.push(chapterFilename);
  }
  
  // Add images
  for (const image of images) {
    const filename = imageFilenames[image.id];
    onProgress?.(`Adding image ${image.name}...`);
    imagesFolder.file(filename, image.data);
  }
  
  // Create metadata.json
  const metadataJson = {
    title: metadata.title,
    author: metadata.author,
    language: metadata.language,
    exportedAt: new Date().toISOString(),
    chapters: chapterFilenames,
  };
  zip.file('metadata.json', JSON.stringify(metadataJson, null, 2));
  
  // Generate and save
  onProgress?.('Finalizing ZIP...');
  const blob = await zip.generateAsync({ type: 'blob' });
  
  const filename = `${metadata.title || 'book'}-markdown.zip`;
  saveAs(blob, filename);
  
  onProgress?.('Markdown ZIP export complete');
}

/**
 * Generate EPUB file from files and metadata
 */
export async function generateEpub(
  files: EditorFile[],
  metadata: BookMetadata,
  onProgress?: (status: string) => void
): Promise<void> {
  onProgress?.('Generating EPUB...');
  
  const zip = new JSZip();
  
  // Add mimetype (must be first and uncompressed)
  zip.file('mimetype', EPUB_MIMETYPE, { compression: 'STORE' } as never);
  
  // Add container.xml
  const metaInf = zip.folder('META-INF');
  metaInf?.file('container.xml', EPUB_CONTAINER_XML);
  
  // Process chapters
  const manifestItems: EpubManifestItem[] = [];
  const spineItems: EpubSpineItem[] = [];
  const tocItems: EpubTocItem[] = [];
  
  const oebps = zip.folder('OEBPS');
  
  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx];
    const id = `chapter${idx}`;
    const filename = `${id}.xhtml`;
    
    onProgress?.(`Processing ${file.name}...`);
    
    const xhtml = await convertToXhtml(file.content, file.name);
    oebps?.file(filename, xhtml);
    
    manifestItems.push({
      id,
      href: filename,
      mediaType: 'application/xhtml+xml',
    });
    
    spineItems.push({ idref: id });
    tocItems.push({ title: file.name.replace(/\.md$/, ''), href: filename });
  }
  
  // Generate UUID
  const uuid = 'urn:uuid:' + crypto.randomUUID();
  
  // Create content.opf
  const contentOpf = generateContentOpf(metadata, uuid, manifestItems, spineItems);
  oebps?.file('content.opf', contentOpf);
  
  // Create toc.ncx
  const tocNcx = generateTocNcx(metadata, uuid, tocItems);
  oebps?.file('toc.ncx', tocNcx);
  
  // Create nav.xhtml
  const navXhtml = generateNavXhtml(tocItems);
  oebps?.file('nav.xhtml', navXhtml);
  
  // Generate and save
  onProgress?.('Finalizing EPUB...');
  const blob = await zip.generateAsync({ type: 'blob', mimeType: EPUB_MIMETYPE });
  
  const filename = `${metadata.title || 'book'}.epub`;
  saveAs(blob, filename);
  
  onProgress?.('EPUB generation complete');
}

/**
 * Generate content.opf XML
 */
function generateContentOpf(
  metadata: BookMetadata,
  uuid: string,
  manifestItems: EpubManifestItem[],
  spineItems: EpubSpineItem[]
): string {
  const manifestXml = manifestItems
    .map(item => `    <item id="${item.id}" href="${item.href}" media-type="${item.mediaType}"/>`)
    .join('\n');
  
  const spineXml = spineItems
    .map(item => `    <itemref idref="${item.idref}"/>`)
    .join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">${uuid}</dc:identifier>
    <dc:title>${escapeXml(metadata.title)}</dc:title>
    <dc:creator>${escapeXml(metadata.author)}</dc:creator>
    <dc:language>${metadata.language}</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
${manifestXml}
  </manifest>
  <spine toc="ncx">
${spineXml}
  </spine>
</package>`;
}

/**
 * Generate toc.ncx XML
 */
function generateTocNcx(
  metadata: BookMetadata,
  uuid: string,
  tocItems: EpubTocItem[]
): string {
  const navPoints = tocItems
    .map((item, idx) => `    <navPoint id="navpoint-${idx + 1}" playOrder="${idx + 1}">
      <navLabel><text>${escapeXml(item.title)}</text></navLabel>
      <content src="${item.href}"/>
    </navPoint>`)
    .join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(metadata.title)}</text></docTitle>
  <navMap>
${navPoints}
  </navMap>
</ncx>`;
}

/**
 * Generate nav.xhtml
 */
function generateNavXhtml(tocItems: EpubTocItem[]): string {
  const navItems = tocItems
    .map(item => `        <li><a href="${item.href}">${escapeXml(item.title)}</a></li>`)
    .join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="UTF-8"/>
  <title>Table of Contents</title>
</head>
<body>
  <nav epub:type="toc">
    <h1>Table of Contents</h1>
    <ol>
${navItems}
    </ol>
  </nav>
</body>
</html>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate PDF by opening print dialog
 */
export async function generatePdf(
  files: EditorFile[],
  metadata: BookMetadata,
  isDark: boolean,
  onProgress?: (status: string) => void
): Promise<void> {
  onProgress?.('Preparing PDF...');
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups.');
  }
  
  const processedContents: string[] = [];
  
  for (const file of files) {
    onProgress?.(`Processing ${file.name}...`);
    
    let content = file.content;
    
    // Process mermaid diagrams
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
    const mermaidBlocks: Array<{ original: string; code: string }> = [];
    let match;
    
    while ((match = mermaidRegex.exec(content)) !== null) {
      mermaidBlocks.push({ original: match[0], code: match[1] });
    }
    
    for (const block of mermaidBlocks) {
      const svg = await renderMermaidToSvg(block.code);
      if (svg) {
        content = content.replace(block.original, `<div class="mermaid">${svg}</div>`);
      }
    }
    
    // Process tables
    content = processTablesInMarkdown(content);
    
    // Parse markdown
    const html = parseMarkdown(content);
    processedContents.push(html);
  }
  
  const allContent = processedContents.join('<hr class="page-break"/>');
  
  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeXml(metadata.title)}</title>
  <style>
    @media print {
      .page-break { page-break-after: always; }
    }
    body {
      font-family: 'Georgia', serif;
      line-height: 1.8;
      max-width: 800px;
      margin: 0 auto;
      padding: 2em;
      color: ${isDark ? '#1a1a1a' : '#1a1a1a'};
      background: white;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    h1 { font-size: 2em; border-bottom: 2px solid #333; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #666; padding-bottom: 0.2em; }
    code {
      font-family: 'Consolas', 'Monaco', monospace;
      background: #f4f4f4;
      padding: 0.2em 0.4em;
      border-radius: 3px;
    }
    pre {
      background: #f4f4f4;
      padding: 1em;
      overflow-x: auto;
      border-radius: 5px;
    }
    pre code {
      background: none;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #ccc;
      margin: 1em 0;
      padding: 0.5em 1em;
      color: #666;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.75em;
      text-align: left;
    }
    th {
      background: #f4f4f4;
      font-weight: bold;
    }
    .mermaid {
      text-align: center;
      margin: 1.5em 0;
    }
    .mermaid svg {
      max-width: 100%;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    .page-break {
      border: none;
      page-break-after: always;
    }
  </style>
</head>
<body>
  ${allContent}
</body>
</html>
  `);
  
  printWindow.document.close();
  
  // Wait for content to load, then print
  setTimeout(() => {
    onProgress?.('Opening print dialog...');
    printWindow.print();
  }, 500);
}

/**
 * Export as standalone HTML file
 */
export async function exportHtml(
  files: EditorFile[],
  metadata: BookMetadata,
  isDark: boolean,
  onProgress?: (status: string) => void
): Promise<void> {
  onProgress?.('Generating HTML...');
  
  const processedContents: string[] = [];
  
  for (const file of files) {
    let content = file.content;
    
    // Process mermaid diagrams
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
    const mermaidBlocks: Array<{ original: string; code: string }> = [];
    let match;
    
    while ((match = mermaidRegex.exec(content)) !== null) {
      mermaidBlocks.push({ original: match[0], code: match[1] });
    }
    
    for (const block of mermaidBlocks) {
      const svg = await renderMermaidToSvg(block.code);
      if (svg) {
        content = content.replace(block.original, `<div class="mermaid">${svg}</div>`);
      }
    }
    
    // Process tables
    content = processTablesInMarkdown(content);
    
    // Parse markdown
    const html = parseMarkdown(content);
    processedContents.push(`<section class="chapter"><h1 class="chapter-title">${escapeXml(file.name)}</h1>${html}</section>`);
  }
  
  const allContent = processedContents.join('\n<hr class="chapter-break"/>\n');
  
  const htmlDoc = `<!DOCTYPE html>
<html lang="${metadata.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="author" content="${escapeXml(metadata.author)}">
  <title>${escapeXml(metadata.title)}</title>
  <style>
    :root {
      --bg: ${isDark ? '#1a1a1a' : '#ffffff'};
      --fg: ${isDark ? '#e0e0e0' : '#1a1a1a'};
      --code-bg: ${isDark ? '#2d2d2d' : '#f4f4f4'};
      --border: ${isDark ? '#444' : '#ddd'};
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.8;
      max-width: 800px;
      margin: 0 auto;
      padding: 2em;
      background: var(--bg);
      color: var(--fg);
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-family: 'Helvetica Neue', Arial, sans-serif;
    }
    h1 { font-size: 2em; border-bottom: 2px solid var(--fg); padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid var(--border); padding-bottom: 0.2em; }
    code {
      font-family: 'Consolas', 'Monaco', monospace;
      background: var(--code-bg);
      padding: 0.2em 0.4em;
      border-radius: 3px;
    }
    pre {
      background: var(--code-bg);
      padding: 1em;
      overflow-x: auto;
      border-radius: 5px;
    }
    pre code { background: none; padding: 0; }
    blockquote {
      border-left: 4px solid var(--border);
      margin: 1em 0;
      padding: 0.5em 1em;
      opacity: 0.8;
    }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid var(--border); padding: 0.75em; text-align: left; }
    th { background: var(--code-bg); font-weight: bold; }
    .mermaid { text-align: center; margin: 1.5em 0; }
    .mermaid svg { max-width: 100%; }
    img { max-width: 100%; height: auto; }
    .chapter-break { border: none; height: 2em; }
    .chapter-title { margin-top: 2em; }
    a { color: ${isDark ? '#6db3f2' : '#0066cc'}; }
    @media print {
      body { background: white; color: black; }
      .chapter-break { page-break-after: always; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeXml(metadata.title)}</h1>
    <p><em>by ${escapeXml(metadata.author)}</em></p>
  </header>
  <main>
    ${allContent}
  </main>
</body>
</html>`;
  
  const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${metadata.title || 'book'}.html`);
  
  onProgress?.('HTML export complete');
}

/**
 * Save project to JSON file
 */
export function saveProject(
  files: EditorFile[],
  metadata: BookMetadata,
  uiLang: string,
  version: string
): void {
  const projectData = {
    version,
    files,
    metadata,
    uiLang,
  };
  
  const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
  saveAs(blob, `${metadata.title || 'project'}.mdebook`);
}

/**
 * Load project from JSON file
 */
export function parseProjectFile(content: string): {
  files: EditorFile[];
  metadata: BookMetadata;
  uiLang: string;
} | null {
  try {
    const data = JSON.parse(content);
    
    if (!data.files || !Array.isArray(data.files)) {
      return null;
    }
    
    return {
      files: data.files,
      metadata: data.metadata || { title: 'Untitled', author: '', language: 'en' },
      uiLang: data.uiLang || 'en',
    };
  } catch {
    return null;
  }
}
