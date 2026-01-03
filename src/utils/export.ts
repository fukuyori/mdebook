import type { EditorFile, BookMetadata, EpubManifestItem, EpubSpineItem, EpubTocItem, ProjectImage } from '../types';
import { convertToXhtml, processTablesInMarkdown, renderMermaidToSvg, parseMarkdown, type MermaidImageData } from './markdown';
import { EPUB_CONTAINER_XML, EPUB_MIMETYPE } from '../constants';
import { getThemeCss, DEFAULT_THEME_ID, type ThemeId } from '../themes';

// Declare external libraries (loaded via CDN)
interface JSZipFolder {
  file(path: string, content: string | ArrayBuffer): void;
  folder(path: string): JSZipFolder | null;
}

declare const JSZip: new () => {
  file(path: string, content: string | Blob | ArrayBuffer, options?: { compression?: string }): void;
  folder(path: string): JSZipFolder | null;
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
 * Check if a file is a colophon (奥付)
 */
function isColophonFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower === 'colophon.md' || lower === '奥付.md';
}

/**
 * Check if a file is a preface (はじめに)
 */
function isPrefaceFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower === 'preface.md' || lower === 'はじめに.md' || 
         lower === 'introduction.md' || lower === 'foreword.md';
}

/**
 * Check if a file is a bibliography (参考文献)
 */
function isBibliographyFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower === 'bibliography.md' || lower === '参考文献.md' ||
         lower === 'references.md' || lower === 'bibliografia.md' ||
         lower === '참고문헌.md';
}

/**
 * Check if a file is a chapter title page (章扉)
 */
function isChapterTitleFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower.includes('章扉') || 
         lower.includes('-title.md') ||
         lower.includes('扉页') ||
         lower.includes('-portada') ||
         lower.includes('장표지');
}

/**
 * Sort files for EPUB: preface first, colophon last, bibliography before colophon
 */
function sortFilesForEpub(files: EditorFile[]): EditorFile[] {
  const preface: EditorFile[] = [];
  const colophon: EditorFile[] = [];
  const bibliography: EditorFile[] = [];
  const regular: EditorFile[] = [];
  
  for (const file of files) {
    if (isPrefaceFile(file.name)) {
      preface.push(file);
    } else if (isColophonFile(file.name)) {
      colophon.push(file);
    } else if (isBibliographyFile(file.name)) {
      bibliography.push(file);
    } else {
      regular.push(file);
    }
  }
  
  // Order: preface -> regular -> bibliography -> colophon
  return [...preface, ...regular, ...bibliography, ...colophon];
}

/**
 * Generate EPUB file from files and metadata
 */
export async function generateEpub(
  files: EditorFile[],
  metadata: BookMetadata,
  images: ProjectImage[],
  onProgress?: (status: string) => void
): Promise<void> {
  onProgress?.('Generating EPUB...');
  
  // Sort files: preface first, colophon last
  const sortedFiles = sortFilesForEpub(files);
  
  const zip = new JSZip();
  
  // Add mimetype (must be first and uncompressed)
  zip.file('mimetype', EPUB_MIMETYPE, { compression: 'STORE' } as never);
  
  // Add container.xml
  const metaInf = zip.folder('META-INF');
  metaInf?.file('container.xml', EPUB_CONTAINER_XML);
  
  // Process chapters
  const manifestItems: EpubManifestItem[] = [];
  const spineItems: EpubSpineItem[] = [];
  
  const oebps = zip.folder('OEBPS');
  
  // Get theme CSS and add to EPUB
  // If custom theme is selected and customCss exists, use it; otherwise use preset theme
  const themeId = (metadata.themeId || DEFAULT_THEME_ID) as ThemeId;
  const themeCss = (themeId === 'custom' && metadata.customCss) 
    ? metadata.customCss 
    : getThemeCss(themeId);
  const stylesFolder = oebps?.folder('styles');
  stylesFolder?.file('theme.css', themeCss);
  
  // Add CSS to manifest
  manifestItems.push({
    id: 'theme-css',
    href: 'styles/theme.css',
    mediaType: 'text/css',
  });
  
  // Find cover image
  const coverImage = metadata.coverImageId 
    ? images.find(img => img.id === metadata.coverImageId)
    : undefined;
  
  // Add cover image and cover page if cover exists
  if (coverImage && oebps) {
    const coverExt = getExtensionFromMimeType(coverImage.mimeType);
    const coverFilename = `cover${coverExt}`;
    
    // Add cover image file
    const imagesFolder = oebps.folder('images');
    imagesFolder?.file(coverFilename, coverImage.data);
    
    // Add cover image to manifest
    manifestItems.push({
      id: 'cover-image',
      href: `images/${coverFilename}`,
      mediaType: coverImage.mimeType,
    });
    
    // Create cover page XHTML (with theme CSS reference)
    const coverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="UTF-8"/>
  <title>Cover</title>
  <link rel="stylesheet" type="text/css" href="styles/theme.css"/>
  <style>
    body { margin: 0; padding: 0; text-align: center; }
    img { max-width: 100%; max-height: 100%; }
  </style>
</head>
<body>
  <img src="images/${coverFilename}" alt="Cover"/>
</body>
</html>`;
    
    oebps.file('cover.xhtml', coverXhtml);
    
    manifestItems.push({
      id: 'cover',
      href: 'cover.xhtml',
      mediaType: 'application/xhtml+xml',
    });
    
    spineItems.push({ idref: 'cover' });
  }
  
  // Collect all headings first for TOC page generation
  const tocDepth = metadata.tocDepth ?? 2;
  const allTocItems: EpubTocItem[] = [];
  
  // Only generate TOC if tocDepth > 0
  if (tocDepth > 0) {
    for (let idx = 0; idx < sortedFiles.length; idx++) {
      const file = sortedFiles[idx];
      const chapterFilename = `chapter${idx}.xhtml`;
      const headings = extractHeadings(file.content, tocDepth);
      
      if (headings.length > 0) {
        const chapterItem: EpubTocItem = {
          title: headings[0].title,
          href: `${chapterFilename}#${headings[0].id}`,
          level: 1,
          children: headings.slice(1).map(h => ({
            title: h.title,
            href: `${chapterFilename}#${h.id}`,
            level: h.level,
          })),
        };
        allTocItems.push(chapterItem);
      } else {
        allTocItems.push({
          title: file.name.replace(/\.md$/, ''),
          href: chapterFilename,
          level: 1,
        });
      }
    }
    
    // Create TOC page (本文内目次ページ)
    const tocTitle = getTocTitle(metadata.language);
    const tocPageXhtml = generateTocPageXhtml(allTocItems, tocTitle, 'styles/theme.css');
    oebps?.file('toc-page.xhtml', tocPageXhtml);
    
    manifestItems.push({
      id: 'toc-page',
      href: 'toc-page.xhtml',
      mediaType: 'application/xhtml+xml',
    });
    
    spineItems.push({ idref: 'toc-page' });
  }
  
  // Collect all mermaid images for EPUB
  const allMermaidImages: MermaidImageData[] = [];
  
  for (let idx = 0; idx < sortedFiles.length; idx++) {
    const file = sortedFiles[idx];
    const id = `chapter${idx}`;
    const filename = `${id}.xhtml`;
    
    onProgress?.(`Processing ${file.name}...`);
    
    // Determine body class based on file type
    const bodyClass = isColophonFile(file.name) ? 'colophon' : undefined;
    
    // Generate XHTML with external CSS reference and PNG mermaid diagrams
    const { xhtml, mermaidImages } = await convertToXhtml(file.content, file.name, {
      stylesheetHref: 'styles/theme.css',
      mermaidAsPng: true,  // Use PNG for EPUB compatibility
      bodyClass,
    });
    oebps?.file(filename, xhtml);
    
    // Collect mermaid images
    allMermaidImages.push(...mermaidImages);
    
    manifestItems.push({
      id,
      href: filename,
      mediaType: 'application/xhtml+xml',
    });
    
    spineItems.push({ idref: id });
  }
  
  // Add mermaid images to EPUB
  const imagesFolder = oebps?.folder('images');
  for (const mermaidImg of allMermaidImages) {
    // Convert base64 to ArrayBuffer
    const binaryString = atob(mermaidImg.base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    imagesFolder?.file(`${mermaidImg.id}.png`, bytes.buffer);
    
    manifestItems.push({
      id: mermaidImg.id,
      href: `images/${mermaidImg.id}.png`,
      mediaType: 'image/png',
    });
  }
  
  // Use allTocItems for nav.xhtml and toc.ncx
  const tocItems = allTocItems;
  
  // Generate UUID
  const uuid = 'urn:uuid:' + crypto.randomUUID();
  
  // Create content.opf (with cover image reference if exists)
  const contentOpf = generateContentOpf(metadata, uuid, manifestItems, spineItems, !!coverImage);
  oebps?.file('content.opf', contentOpf);
  
  // Create toc.ncx and nav.xhtml
  if (tocDepth > 0) {
    const tocNcx = generateTocNcx(metadata, uuid, tocItems);
    oebps?.file('toc.ncx', tocNcx);
    
    // Create nav.xhtml (with theme CSS and localized title)
    const navXhtml = generateNavXhtml(tocItems, 'styles/theme.css', metadata.language);
    oebps?.file('nav.xhtml', navXhtml);
  } else {
    // Minimal nav.xhtml for EPUB3 compliance (required even without TOC)
    const minimalNavXhtml = generateMinimalNavXhtml(metadata.language);
    oebps?.file('nav.xhtml', minimalNavXhtml);
    
    // Minimal toc.ncx
    const minimalTocNcx = generateMinimalTocNcx(metadata, uuid);
    oebps?.file('toc.ncx', minimalTocNcx);
  }
  
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
  spineItems: EpubSpineItem[],
  hasCover: boolean = false
): string {
  const manifestXml = manifestItems
    .map(item => {
      const props = item.id === 'cover-image' ? ' properties="cover-image"' : '';
      return `    <item id="${item.id}" href="${item.href}" media-type="${item.mediaType}"${props}/>`;
    })
    .join('\n');
  
  const spineXml = spineItems
    .map(item => `    <itemref idref="${item.idref}"/>`)
    .join('\n');
  
  const coverMeta = hasCover ? '\n    <meta name="cover" content="cover-image"/>' : '';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">${uuid}</dc:identifier>
    <dc:title>${escapeXml(metadata.title)}</dc:title>
    <dc:creator>${escapeXml(metadata.author)}</dc:creator>
    <dc:language>${metadata.language}</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta>${coverMeta}
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
 * Generate toc.ncx XML (hierarchical)
 */
function generateTocNcx(
  metadata: BookMetadata,
  uuid: string,
  tocItems: EpubTocItem[]
): string {
  let playOrder = 0;
  
  function generateNavPoints(items: EpubTocItem[], indent: string = '    '): string {
    return items.map(item => {
      playOrder++;
      const childNavPoints = item.children && item.children.length > 0
        ? `\n${generateNavPoints(item.children, indent + '  ')}\n${indent}`
        : '';
      return `${indent}<navPoint id="navpoint-${playOrder}" playOrder="${playOrder}">
${indent}  <navLabel><text>${escapeXml(item.title)}</text></navLabel>
${indent}  <content src="${item.href}"/>${childNavPoints}
${indent}</navPoint>`;
    }).join('\n');
  }
  
  const navPoints = generateNavPoints(tocItems);
  const maxDepth = getMaxDepth(tocItems);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uuid}"/>
    <meta name="dtb:depth" content="${maxDepth}"/>
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
 * Get maximum depth of TOC tree
 */
function getMaxDepth(items: EpubTocItem[], currentDepth: number = 1): number {
  let maxDepth = currentDepth;
  for (const item of items) {
    if (item.children && item.children.length > 0) {
      const childDepth = getMaxDepth(item.children, currentDepth + 1);
      if (childDepth > maxDepth) {
        maxDepth = childDepth;
      }
    }
  }
  return maxDepth;
}

/**
 * Generate nav.xhtml (hierarchical)
 */
function generateNavXhtml(tocItems: EpubTocItem[], stylesheetHref?: string, language?: string): string {
  function generateNavItems(items: EpubTocItem[], indent: string = '        '): string {
    return items.map(item => {
      const hasChildren = item.children && item.children.length > 0;
      if (hasChildren) {
        return `${indent}<li>
${indent}  <a href="${item.href}">${escapeXml(item.title)}</a>
${indent}  <ol>
${generateNavItems(item.children!, indent + '    ')}
${indent}  </ol>
${indent}</li>`;
      } else {
        return `${indent}<li><a href="${item.href}">${escapeXml(item.title)}</a></li>`;
      }
    }).join('\n');
  }
  
  const navItems = generateNavItems(tocItems);
  
  const styleLink = stylesheetHref 
    ? `\n  <link rel="stylesheet" type="text/css" href="${stylesheetHref}"/>`
    : '';
  
  // Localized TOC title
  const tocTitle = getTocTitle(language);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="UTF-8"/>
  <title>${tocTitle}</title>${styleLink}
</head>
<body>
  <nav epub:type="toc">
    <h1>${tocTitle}</h1>
    <ol>
${navItems}
    </ol>
  </nav>
</body>
</html>`;
}

/**
 * Get localized TOC title
 */
function getTocTitle(language?: string): string {
  const titles: Record<string, string> = {
    en: 'Table of Contents',
    ja: '目次',
    zh: '目录',
    es: 'Índice',
    ko: '목차',
  };
  return titles[language || 'en'] || titles.en;
}

/**
 * Generate TOC page XHTML (本文内目次ページ)
 */
function generateTocPageXhtml(tocItems: EpubTocItem[], title: string, stylesheetHref?: string): string {
  function generateTocList(items: EpubTocItem[], indent: string = '    '): string {
    return items.map(item => {
      const hasChildren = item.children && item.children.length > 0;
      if (hasChildren) {
        return `${indent}<li>
${indent}  <a href="${item.href}">${escapeXml(item.title)}</a>
${indent}  <ol>
${generateTocList(item.children!, indent + '    ')}
${indent}  </ol>
${indent}</li>`;
      } else {
        return `${indent}<li><a href="${item.href}">${escapeXml(item.title)}</a></li>`;
      }
    }).join('\n');
  }
  
  const tocList = generateTocList(tocItems);
  
  const styleLink = stylesheetHref 
    ? `\n  <link rel="stylesheet" type="text/css" href="${stylesheetHref}"/>`
    : '';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeXml(title)}</title>${styleLink}
  <style>
    .toc-page { margin: 1em 5%; }
    .toc-page h1 { text-align: center; margin-bottom: 1.5em; }
    .toc-page ol { list-style-type: none; padding-left: 0; }
    .toc-page ol ol { padding-left: 1.5em; margin-top: 0.3em; }
    .toc-page li { margin: 0.5em 0; }
    .toc-page a { text-decoration: none; color: inherit; }
  </style>
</head>
<body>
  <section class="toc-page" epub:type="toc">
    <h1>${escapeXml(title)}</h1>
    <ol>
${tocList}
    </ol>
  </section>
</body>
</html>`;
}

/**
 * Generate minimal nav.xhtml (for EPUB3 compliance when TOC is disabled)
 */
function generateMinimalNavXhtml(language?: string): string {
  const tocTitle = getTocTitle(language);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="UTF-8"/>
  <title>${tocTitle}</title>
</head>
<body>
  <nav epub:type="toc">
    <h1>${tocTitle}</h1>
    <ol>
      <li><a href="chapter0.xhtml">Start</a></li>
    </ol>
  </nav>
</body>
</html>`;
}

/**
 * Generate minimal toc.ncx (for EPUB2 compatibility when TOC is disabled)
 */
function generateMinimalTocNcx(metadata: BookMetadata, uuid: string): string {
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
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>Start</text></navLabel>
      <content src="chapter0.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;
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
 * Heading info for TOC
 */
interface HeadingInfo {
  title: string;
  level: number;
  id: string;
}

/**
 * Detect if content is a chapter title page
 */
function isChapterTitlePage(content: string): boolean {
  // Check for div tag
  const hasDivTag = content.includes('<div class="chapter-title-page">') || 
                    content.includes('class="chapter-title-page"');
  
  // Pattern: # 第N章 or # Chapter N (with possible trailing spaces)
  const chapterPattern = /^#\s+(第\d+章|Chapter\s+\d+|제\d+장)\s*$/m;
  const hasChapterHeading = chapterPattern.test(content);
  const hasSubtitle = /^##\s+.+$/m.test(content);
  
  return hasDivTag || (hasChapterHeading && hasSubtitle);
}

/**
 * Extract headings from Markdown content
 * Handles chapter title pages with HTML wrappers
 */
function extractHeadings(content: string, maxDepth: number = 2): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  const lines = content.split('\n');
  
  // Track used IDs to ensure uniqueness
  const usedIds = new Map<string, number>();
  
  // Check if this is a chapter title page
  const isChapterTitle = isChapterTitlePage(content);
  
  // For chapter title pages, we need at least depth 2 to get h2 for combining
  const effectiveMaxDepth = isChapterTitle ? Math.max(maxDepth, 2) : maxDepth;
  
  // Track if we're inside a code block
  let inCodeBlock = false;
  
  for (const line of lines) {
    // Check for code block markers
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    
    // Skip headings inside code blocks
    if (inCodeBlock) continue;
    
    // Match ATX headings (# style)
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      if (level <= effectiveMaxDepth) {
        let title = match[2].trim();
        // Remove trailing # if present
        title = title.replace(/\s+#+\s*$/, '');
        
        // Generate ID from title
        let id = generateHeadingId(title);
        
        // Ensure ID uniqueness
        const count = usedIds.get(id) || 0;
        if (count > 0) {
          id = `${id}-${count}`;
        }
        usedIds.set(id.replace(/-\d+$/, ''), count + 1);
        
        headings.push({ title, level, id });
      }
    }
  }
  
  // For chapter title pages, combine H1 and H2 into a single meaningful title
  // e.g., "第1章" + "データ構造の基礎" -> "第1章 データ構造の基礎"
  if (isChapterTitle && headings.length >= 2) {
    const h1 = headings.find(h => h.level === 1);
    const h2 = headings.find(h => h.level === 2);
    if (h1 && h2) {
      // Create combined title for TOC
      h1.title = `${h1.title} ${h2.title}`;
      // Remove the H2 from headings to avoid duplication in TOC
      const h2Index = headings.indexOf(h2);
      if (h2Index > -1) {
        headings.splice(h2Index, 1);
      }
    }
  }
  
  return headings;
}

/**
 * Generate heading ID from title (same logic as markdown.ts)
 */
function generateHeadingId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\s-]/g, '') // Keep alphanumeric, Japanese, spaces, hyphens
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
    || 'heading';
}

/**
 * Generate PDF by opening print dialog
 */
export async function generatePdf(
  files: EditorFile[],
  metadata: BookMetadata,
  isDark: boolean,
  onProgress?: (status: string) => void,
  css?: string
): Promise<void> {
  onProgress?.('Initializing PDF generator...');
  
  // Dynamic import of pdf-export module
  const { exportToPdf } = await import('./pdf-export');
  
  // Convert EditorFile[] to the format expected by exportToPdf
  const pdfFiles = files.map(f => ({
    name: f.name,
    content: f.content,
  }));
  
  await exportToPdf(pdfFiles, {
    title: metadata.title || 'Untitled',
    author: metadata.author || '',
    tocDepth: metadata.tocDepth ?? 2,
    css: css || metadata.customCss,
  }, onProgress);
}

/**
 * Generate PDF using browser print dialog (legacy method)
 */
export async function generatePdfLegacy(
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
