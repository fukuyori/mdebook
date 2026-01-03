/**
 * PDF Export with pdfmake
 * Features: Page numbers, TOC with internal links, Japanese font support
 */

import { loadPdfFonts } from './storage';

// pdfmake CDN URLs
const PDFMAKE_CDN = {
  pdfmake: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js',
  vfs: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.min.js',
};

// pdfmake script loaded flag
let pdfMakeScriptsLoaded = false;

/**
 * Remove emojis and other unsupported characters from text
 * Keeps basic Latin, CJK, punctuation, and common symbols
 */
function removeEmojis(text: string): string {
  // Remove emojis and other symbols that fonts typically don't support
  // This regex matches most emoji ranges
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu, '');
}

/**
 * Load script from URL
 */
function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load: ${url}`));
    document.head.appendChild(script);
  });
}

/**
 * Initialize pdfmake with fonts from IndexedDB
 * Note: Fonts are loaded fresh each time to pick up any changes
 */
async function initPdfMake(): Promise<any> {
  try {
    console.log('Initializing pdfmake...');
    
    // Check if pdfMake is already available (loaded via script tag)
    let pdfMake = (window as any).pdfMake;
    
    if (!pdfMake || !pdfMakeScriptsLoaded) {
      // Load from CDN
      console.log('Loading pdfmake from CDN...');
      await loadScript(PDFMAKE_CDN.pdfmake);
      await loadScript(PDFMAKE_CDN.vfs);
      
      // Wait for scripts to initialize
      await new Promise(r => setTimeout(r, 200));
      
      pdfMake = (window as any).pdfMake;
      pdfMakeScriptsLoaded = true;
    }
    
    if (!pdfMake) {
      throw new Error('pdfMake not available');
    }
    
    console.log('pdfMake loaded:', typeof pdfMake.createPdf);

    // Load Japanese fonts from IndexedDB (always reload to pick up changes)
    try {
      console.log('Loading fonts from IndexedDB...');
      const fonts = await loadPdfFonts();
      
      if (fonts.regular) {
        console.log('Japanese font found:', fonts.regular.name);
        
        pdfMake.vfs = pdfMake.vfs || {};
        pdfMake.vfs['JapaneseFont-Regular.ttf'] = fonts.regular.data;
        
        if (fonts.bold) {
          pdfMake.vfs['JapaneseFont-Bold.ttf'] = fonts.bold.data;
        } else {
          // Use regular for bold if bold not uploaded
          pdfMake.vfs['JapaneseFont-Bold.ttf'] = fonts.regular.data;
        }

        pdfMake.fonts = {
          ...pdfMake.fonts,
          Roboto: {
            normal: 'Roboto-Regular.ttf',
            bold: 'Roboto-Medium.ttf',
            italics: 'Roboto-Italic.ttf',
            bolditalics: 'Roboto-MediumItalic.ttf'
          },
          JapaneseFont: {
            normal: 'JapaneseFont-Regular.ttf',
            bold: 'JapaneseFont-Bold.ttf',
            italics: 'JapaneseFont-Regular.ttf',
            bolditalics: 'JapaneseFont-Bold.ttf',
          },
        };

        console.log('Japanese fonts configured successfully');
      } else {
        console.log('No Japanese fonts in IndexedDB, using Roboto (Japanese may not display)');
        // Reset JapaneseFont if previously set
        if (pdfMake.fonts?.JapaneseFont) {
          delete pdfMake.fonts.JapaneseFont;
        }
      }
    } catch (fontError) {
      console.warn('Failed to load fonts from IndexedDB:', fontError);
    }

    return pdfMake;
    
  } catch (error) {
    console.error('pdfMake initialization failed:', error);
    throw error;
  }
}

/**
 * Parse Markdown to pdfmake content
 */
interface ParsedChapter {
  title: string;
  content: any[];
  level: number;
  isChapterTitlePage?: boolean;  // 章扉ページ
  isColophon?: boolean;          // 奥付ページ
}

/**
 * Detect special page types
 */
function detectSpecialPage(markdown: string, fileName?: string): { isChapterTitlePage: boolean; isColophon: boolean } {
  // Chapter title page detection:
  // 1. Has <div class="chapter-title-page">
  // 2. Or starts with # 第N章 or # Chapter N pattern and has ## subtitle
  const hasDivTag = markdown.includes('<div class="chapter-title-page">') || 
                    markdown.includes('class="chapter-title-page"');
  
  // Pattern: # 第N章 or # Chapter N followed by ## subtitle
  const chapterPattern = /^#\s*(第\d+章|Chapter\s+\d+|제\d+장|第\d+章)\s*$/m;
  const hasChapterHeading = chapterPattern.test(markdown);
  const hasSubtitle = /^##\s+.+$/m.test(markdown);
  const isChapterTitlePage = hasDivTag || (hasChapterHeading && hasSubtitle);
  
  // Colophon detection
  const isColophon = /^#\s*(奥付|Colophon|版权页|Colofón|판권)/m.test(markdown);
  
  return { isChapterTitlePage, isColophon };
}

function parseMarkdownToPdfContent(
  markdown: string,
  chapterIndex: number,
  tocDepth: number = 2
): ParsedChapter {
  // Remove emojis from the entire markdown before processing
  const cleanedMarkdown = removeEmojis(markdown);
  
  // Detect special page types
  const { isChapterTitlePage, isColophon } = detectSpecialPage(cleanedMarkdown);
  
  // Remove HTML div tags for chapter title page
  const processedMarkdown = cleanedMarkdown
    .replace(/<div[^>]*class="chapter-title-page"[^>]*>/gi, '')
    .replace(/<\/div>/gi, '');
  
  const lines = processedMarkdown.split('\n');
  const content: any[] = [];
  let title = `Chapter ${chapterIndex + 1}`;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';
  let inList = false;
  let listItems: any[] = [];
  let listType: 'ul' | 'ol' = 'ul';

  const flushList = () => {
    if (listItems.length > 0) {
      if (listType === 'ul') {
        content.push({ ul: listItems, margin: [0, 5, 0, 10] });
      } else {
        content.push({ ol: listItems, margin: [0, 5, 0, 10] });
      }
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block handling - check for ``` at start of line (with optional language)
    if (line.trimStart().startsWith('```')) {
      if (inCodeBlock) {
        // End code block - wrap in table for background
        const codeText = codeBlockContent.join('\n');
        content.push({
          table: {
            widths: ['*'],
            body: [[
              {
                text: codeText,
                font: 'Roboto',  // Use Roboto for code (monospace-like)
                fontSize: 9,
                preserveLeadingSpaces: true,
                lineHeight: 1.2,
                margin: [8, 8, 8, 8],
              }
            ]],
          },
          layout: {
            fillColor: () => '#f5f5f5',
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#e0e0e0',
            vLineColor: () => '#e0e0e0',
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0,
          },
          margin: [0, 8, 0, 12],
        });
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start code block
        flushList();
        codeBlockLang = line.trimStart().slice(3).trim();
        inCodeBlock = true;
      }
      continue;
    }

    // Skip everything inside code block
    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushList();
      continue;
    }

    // Headers
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);
    const h4Match = line.match(/^####\s+(.+)$/);

    if (h1Match) {
      flushList();
      title = h1Match[1];
      // H1 is added as tocItem in the caller
      continue;
    }

    if (h2Match) {
      flushList();
      content.push({
        text: h2Match[1],
        style: 'h2',
        // Don't add to TOC if this is a chapter title page (will be combined with h1)
        tocItem: !isChapterTitlePage && tocDepth >= 2,
        tocMargin: [10, 0, 0, 0],
      } as any);
      continue;
    }

    if (h3Match) {
      flushList();
      content.push({
        text: h3Match[1],
        style: 'h3',
        tocItem: !isChapterTitlePage && tocDepth >= 3,
        tocMargin: [20, 0, 0, 0],
      } as any);
      continue;
    }

    if (h4Match) {
      flushList();
      content.push({ text: h4Match[1], style: 'h4' });
      continue;
    }

    // Lists
    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    const olMatch = line.match(/^\d+\.\s+(.+)$/);

    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        flushList();
        listType = 'ul';
        inList = true;
      }
      listItems.push({ text: parseInlineMarkdown(ulMatch[1]), style: 'listItem' });
      continue;
    }

    if (olMatch) {
      if (!inList || listType !== 'ol') {
        flushList();
        listType = 'ol';
        inList = true;
      }
      listItems.push({ text: parseInlineMarkdown(olMatch[1]), style: 'listItem' });
      continue;
    }

    // Blockquote - collect consecutive lines
    const blockquoteMatch = line.match(/^>\s*(.*)$/);
    if (blockquoteMatch) {
      flushList();
      
      // Collect all consecutive blockquote lines
      const blockquoteLines: string[] = [blockquoteMatch[1] || ''];
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];
        const nextMatch = nextLine.match(/^>\s*(.*)$/);
        if (nextMatch) {
          blockquoteLines.push(nextMatch[1] || '');
          j++;
        } else {
          break;
        }
      }
      
      // Skip the lines we've consumed
      i = j - 1;
      
      // Join with newline for proper line breaks
      content.push({
        text: blockquoteLines.join('\n'),
        style: 'blockquote',
        preserveLeadingSpaces: true,
      });
      continue;
    }

    // Table detection (starts with |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList();
      
      // Collect all table rows
      const tableRows: string[] = [line];
      let j = i + 1;
      while (j < lines.length && lines[j].trim().startsWith('|') && lines[j].trim().endsWith('|')) {
        tableRows.push(lines[j]);
        j++;
      }
      
      // Skip past the table in main loop
      i = j - 1;
      
      if (tableRows.length >= 2) {
        // Parse table
        const parseTableRow = (row: string): string[] => {
          return row
            .split('|')
            .slice(1, -1) // Remove empty first and last
            .map(cell => cell.trim());
        };
        
        const headerCells = parseTableRow(tableRows[0]);
        
        // Check if second row is separator (contains ---)
        const isSeparator = tableRows[1].includes('---');
        const dataStartIndex = isSeparator ? 2 : 1;
        
        // Build pdfmake table
        const tableBody: any[][] = [];
        
        // Header row
        tableBody.push(headerCells.map(cell => ({
          text: parseInlineMarkdown(cell),
          bold: true,
          fillColor: '#f0f0f0',
        })));
        
        // Data rows
        for (let k = dataStartIndex; k < tableRows.length; k++) {
          const cells = parseTableRow(tableRows[k]);
          // Ensure same number of columns as header
          while (cells.length < headerCells.length) {
            cells.push('');
          }
          tableBody.push(cells.map(cell => ({
            text: parseInlineMarkdown(cell),
          })));
        }
        
        if (tableBody.length > 0) {
          content.push({
            table: {
              headerRows: 1,
              widths: headerCells.map(() => '*'),
              body: tableBody,
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => '#cccccc',
              vLineColor: () => '#cccccc',
              paddingLeft: () => 5,
              paddingRight: () => 5,
              paddingTop: () => 3,
              paddingBottom: () => 3,
            },
            margin: [0, 5, 0, 10],
          });
        }
      }
      continue;
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      flushList();
      content.push({
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }],
        margin: [0, 10, 0, 10],
      });
      continue;
    }

    // Regular paragraph
    flushList();
    content.push({
      text: parseInlineMarkdown(line),
      style: 'paragraph',
    });
  }

  flushList();

  return { title, content, level: 1, isChapterTitlePage, isColophon };
}

/**
 * Parse inline Markdown (bold, italic, code, links)
 */
function parseInlineMarkdown(text: string): any[] | string {
  // Combined regex for bold, italic, code, and links
  // Order matters: ** before *, links before plain text
  const combinedRegex = /(\*\*(.+?)\*\*)|(\*([^*]+?)\*)|(`([^`]+?)`)|(\[([^\]]+?)\]\(([^)]+?)\))/g;
  
  // Check if there are any inline elements
  if (!combinedRegex.test(text)) {
    return text;
  }
  
  // Reset regex
  combinedRegex.lastIndex = 0;
  
  let lastIndex = 0;
  const segments: any[] = [];
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // Bold **text**
      segments.push({ text: match[2], bold: true });
    } else if (match[4]) {
      // Italic *text*
      segments.push({ text: match[4], italics: true });
    } else if (match[6]) {
      // Inline code `text` - use Roboto for monospace-like appearance
      segments.push({ 
        text: ` ${match[6]} `, 
        font: 'Roboto',
        fontSize: 9,
        background: '#f0f0f0',
      });
    } else if (match[8] && match[9]) {
      // Link [text](url)
      segments.push({ text: match[8], link: match[9], style: 'link' });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }

  return segments.length === 1 && typeof segments[0] === 'string' ? segments[0] : segments;
}

/**
 * PDF style settings extracted from CSS
 */
interface PdfStyleSettings {
  body: {
    lineHeight: number;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    letterSpacing?: number;
  };
  h1: { fontSize: number; color?: string; };
  h2: { fontSize: number; color?: string; };
  h3: { fontSize: number; color?: string; };
  h4: { fontSize: number; color?: string; };
  p: { textIndent?: number; };
  code: { fontSize: number; background?: string; };
  blockquote: { background?: string; color?: string; };
  link: { color: string; };
}

/**
 * Parse CSS and extract PDF-relevant styles
 */
function parseCssForPdf(css: string): PdfStyleSettings {
  const defaults: PdfStyleSettings = {
    body: { lineHeight: 1.4, textAlign: 'justify' },  // pdfmake uses different scale
    h1: { fontSize: 20 },
    h2: { fontSize: 16 },
    h3: { fontSize: 13 },
    h4: { fontSize: 11 },
    p: { textIndent: 10 },
    code: { fontSize: 9, background: '#f5f5f5' },
    blockquote: { color: '#555555' },
    link: { color: '#0066cc' },
  };

  if (!css) return defaults;

  // Helper to extract property value from CSS block
  const extractValue = (block: string, property: string): string | null => {
    const regex = new RegExp(`${property}\\s*:\\s*([^;]+)`, 'i');
    const match = block.match(regex);
    return match ? match[1].trim() : null;
  };

  // Helper to parse em/px values to pt (base 10pt)
  const parseSize = (value: string | null, basePt: number = 10): number | null => {
    if (!value) return null;
    const emMatch = value.match(/^([\d.]+)\s*em$/);
    if (emMatch) return Math.round(parseFloat(emMatch[1]) * basePt);
    const pxMatch = value.match(/^([\d.]+)\s*px$/);
    if (pxMatch) return Math.round(parseFloat(pxMatch[1]) * 0.75); // px to pt
    const ptMatch = value.match(/^([\d.]+)\s*pt$/);
    if (ptMatch) return Math.round(parseFloat(ptMatch[1]));
    return null;
  };

  // Helper to parse line-height (CSS 1.7 -> pdfmake ~1.3-1.4)
  const parseLineHeight = (value: string | null): number | null => {
    if (!value) return null;
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0 && num < 5) {
      // Convert CSS line-height to pdfmake (pdfmake spacing is tighter)
      // CSS 1.7 roughly equals pdfmake 1.3-1.4
      return Math.max(1.0, num * 0.8);
    }
    return null;
  };

  // Helper to parse letter-spacing to characterSpacing
  const parseLetterSpacing = (value: string | null): number | null => {
    if (!value || value === 'normal') return null;
    const emMatch = value.match(/^([\d.]+)\s*em$/);
    if (emMatch) return parseFloat(emMatch[1]) * 10; // rough conversion
    const pxMatch = value.match(/^([\d.]+)\s*px$/);
    if (pxMatch) return parseFloat(pxMatch[1]) * 0.75;
    return null;
  };

  // Extract body styles
  const bodyMatch = css.match(/body\s*\{([^}]+)\}/i);
  if (bodyMatch) {
    const block = bodyMatch[1];
    const lh = parseLineHeight(extractValue(block, 'line-height'));
    if (lh) defaults.body.lineHeight = lh;
    
    const ta = extractValue(block, 'text-align');
    if (ta && ['left', 'center', 'right', 'justify'].includes(ta)) {
      defaults.body.textAlign = ta as any;
    }
    
    const ls = parseLetterSpacing(extractValue(block, 'letter-spacing'));
    if (ls) defaults.body.letterSpacing = ls;
  }

  // Extract heading styles
  const headings = ['h1', 'h2', 'h3', 'h4'] as const;
  const defaultSizes = { h1: 20, h2: 16, h3: 13, h4: 11 };
  
  for (const h of headings) {
    const hMatch = css.match(new RegExp(`${h}\\s*\\{([^}]+)\\}`, 'i'));
    if (hMatch) {
      const block = hMatch[1];
      const fs = parseSize(extractValue(block, 'font-size'), defaultSizes[h]);
      if (fs) defaults[h].fontSize = fs;
      
      const color = extractValue(block, 'color');
      if (color && color.startsWith('#')) defaults[h].color = color;
    }
  }

  // Extract paragraph text-indent
  const pMatch = css.match(/(?:^|\n|\s)p\s*\{([^}]+)\}/i);
  if (pMatch) {
    const indent = extractValue(pMatch[1], 'text-indent');
    if (indent) {
      const emMatch = indent.match(/^([\d.]+)\s*em$/);
      if (emMatch) defaults.p.textIndent = Math.round(parseFloat(emMatch[1]) * 10);
    }
  }

  // Extract code/pre styles
  const preMatch = css.match(/pre\s*\{([^}]+)\}/i);
  if (preMatch) {
    const block = preMatch[1];
    const fs = parseSize(extractValue(block, 'font-size'));
    if (fs) defaults.code.fontSize = fs;
    
    const bg = extractValue(block, 'background(?:-color)?');
    if (bg && bg.startsWith('#')) defaults.code.background = bg;
  }

  // Extract blockquote styles
  const bqMatch = css.match(/blockquote\s*\{([^}]+)\}/i);
  if (bqMatch) {
    const block = bqMatch[1];
    const bg = extractValue(block, 'background(?:-color)?');
    if (bg && bg.startsWith('#')) defaults.blockquote.background = bg;
    
    const color = extractValue(block, 'color');
    if (color && color.startsWith('#')) defaults.blockquote.color = color;
  }

  // Extract link color
  const aMatch = css.match(/a\s*\{([^}]+)\}/i);
  if (aMatch) {
    const color = extractValue(aMatch[1], 'color');
    if (color && color.startsWith('#')) defaults.link.color = color;
  }

  return defaults;
}

/**
 * Export to PDF
 */
export async function exportToPdf(
  files: Array<{ name: string; content: string }>,
  metadata: {
    title: string;
    author: string;
    tocDepth?: number;
    css?: string;
  },
  onProgress?: (message: string) => void
): Promise<void> {
  const progress = onProgress || console.log;
  const tocDepth = metadata.tocDepth ?? 2;
  
  // Parse CSS to extract PDF styles
  const pdfStyles = parseCssForPdf(metadata.css || '');
  console.log('PDF styles from CSS:', pdfStyles);

  progress('Initializing PDF generator...');
  const pdf = await initPdfMake();

  progress('Processing chapters...');

  const content: any[] = [];
  
  // Clean title and author from emojis
  const cleanTitle = removeEmojis(metadata.title || 'Untitled');
  const cleanAuthor = removeEmojis(metadata.author || '');

  // Cover page
  content.push({
    text: cleanTitle,
    style: 'coverTitle',
    alignment: 'center',
    margin: [0, 200, 0, 20],
  });

  if (cleanAuthor) {
    content.push({
      text: cleanAuthor,
      style: 'coverAuthor',
      alignment: 'center',
      margin: [0, 20, 0, 0],
    });
  }

  content.push({ text: '', pageBreak: 'after' });

  // Table of Contents (skip if tocDepth is 0)
  if (tocDepth > 0) {
    content.push({
      text: '目次',
      style: 'tocHeader',
      margin: [0, 0, 0, 20],
    });

    content.push({
      toc: {
        title: { text: '' },
        numberStyle: 'tocNumber',
      },
      margin: [0, 0, 0, 20],
    });

    content.push({ text: '', pageBreak: 'after' });
  }

  // Chapters
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    progress(`Processing: ${file.name}`);

    const parsed = parseMarkdownToPdfContent(file.content, i, tocDepth);

    if (parsed.isChapterTitlePage) {
      // Chapter title page (章扉) - centered, larger text, vertical centering
      // Find subtitle (h2) for combined TOC entry
      const h2Content = parsed.content.find((c: any) => c.style === 'h2');
      
      const tocTitle = h2Content 
        ? `${parsed.title} ${typeof h2Content.text === 'string' ? h2Content.text : h2Content.text?.[0] || ''}`
        : parsed.title;
      
      // Hidden element for TOC entry with combined text
      content.push({
        text: tocTitle,
        fontSize: 0.1,  // Nearly invisible
        color: '#ffffff',
        tocItem: tocDepth >= 1,
        pageBreak: i > 0 ? 'before' : undefined,
      } as any);
      
      // Display chapter number prominently
      content.push({
        text: parsed.title,
        style: 'chapterTitlePage',
        tocItem: false,
      });
      
      // Add subtitle (h2) separately for display
      if (h2Content) {
        const subtitleText = typeof h2Content.text === 'string' ? h2Content.text : h2Content.text?.[0] || '';
        content.push({
          text: subtitleText,
          style: 'chapterSubtitle',
          alignment: 'center',
          tocItem: false,
        });
      }
      
      // Add blockquote if present
      const bqContent = parsed.content.find((c: any) => c.style === 'blockquote');
      if (bqContent) {
        content.push({
          text: bqContent.text,
          style: 'chapterEpigraph',
          alignment: 'center',
          margin: [40, 40, 40, 0],
          preserveLeadingSpaces: true,
        });
      }
      
      // Page break after chapter title page
      content.push({ text: '', pageBreak: 'after' });
      
      // Add remaining content (after --- separator) - exclude h2 from TOC
      const hrIndex = parsed.content.findIndex((c: any) => c.canvas);
      if (hrIndex >= 0) {
        // Filter out h2 tocItem for remaining content after separator
        const remainingContent = parsed.content.slice(hrIndex + 1).map((c: any) => {
          if (c.style === 'h2' || c.style === 'h3') {
            return { ...c, tocItem: tocDepth >= (c.style === 'h2' ? 2 : 3) };
          }
          return c;
        });
        content.push(...remainingContent);
      }
    } else if (parsed.isColophon) {
      // Colophon (奥付) - special formatting
      content.push({
        text: parsed.title,
        style: 'colophonTitle',
        tocItem: false,  // Don't include in TOC
        pageBreak: 'before',
      } as any);
      
      // Add colophon content
      content.push(...parsed.content);
    } else {
      // Regular chapter
      content.push({
        text: parsed.title,
        style: 'h1',
        tocItem: tocDepth >= 1,
        pageBreak: i > 0 ? 'before' : undefined,
      } as any);

      // Chapter content
      content.push(...parsed.content);
    }
  }

  progress('Generating PDF...');

  const docDefinition: any = {
    content,

    defaultStyle: {
      font: 'JapaneseFont',
      fontSize: 10,
      lineHeight: pdfStyles.body.lineHeight,
      characterSpacing: pdfStyles.body.letterSpacing,
    },

    styles: {
      coverTitle: {
        fontSize: 28,
        bold: true,
      },
      coverAuthor: {
        fontSize: 14,
      },
      tocHeader: {
        fontSize: 18,
        bold: true,
      },
      tocNumber: {
        italics: true,
      },
      h1: {
        fontSize: pdfStyles.h1.fontSize,
        bold: true,
        color: pdfStyles.h1.color,
        margin: [0, 20, 0, 10],
      },
      h2: {
        fontSize: pdfStyles.h2.fontSize,
        bold: true,
        color: pdfStyles.h2.color,
        margin: [0, 15, 0, 8],
      },
      h3: {
        fontSize: pdfStyles.h3.fontSize,
        bold: true,
        color: pdfStyles.h3.color,
        margin: [0, 12, 0, 6],
      },
      h4: {
        fontSize: pdfStyles.h4.fontSize,
        bold: true,
        color: pdfStyles.h4.color,
        margin: [0, 10, 0, 5],
      },
      paragraph: {
        margin: [pdfStyles.p.textIndent || 0, 0, 0, 8],
        alignment: pdfStyles.body.textAlign,
      },
      code: {
        fontSize: pdfStyles.code.fontSize,
        background: pdfStyles.code.background,
        margin: [0, 5, 0, 10],
        preserveLeadingSpaces: true,
      },
      inlineCode: {
        fontSize: pdfStyles.code.fontSize,
        background: pdfStyles.code.background || '#f0f0f0',
      },
      blockquote: {
        italics: true,
        margin: [20, 5, 20, 5],
        color: pdfStyles.blockquote.color,
        fillColor: pdfStyles.blockquote.background,
      },
      listItem: {
        margin: [0, 2, 0, 2],
      },
      link: {
        color: pdfStyles.link.color,
        decoration: 'underline',
      },
      // Chapter title page (章扉) styles
      chapterTitlePage: {
        fontSize: 24,
        bold: true,
        alignment: 'center',
        margin: [0, 150, 0, 30],
      },
      chapterSubtitle: {
        fontSize: 16,
        alignment: 'center',
        margin: [0, 10, 0, 20],
      },
      chapterEpigraph: {
        fontSize: 11,
        italics: true,
        alignment: 'center',
        color: '#666666',
        margin: [40, 30, 40, 0],
      },
      // Colophon (奥付) styles
      colophonTitle: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 40, 0, 30],
      },
    },

    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],

    header: (currentPage: number, pageCount: number) => {
      if (currentPage <= 2) return null; // Skip cover and TOC
      return {
        text: cleanTitle,
        alignment: 'center',
        margin: [40, 20, 40, 0],
        fontSize: 9,
        color: '#888888',
      };
    },

    footer: (currentPage: number, pageCount: number) => {
      if (currentPage <= 1) return null; // Skip cover
      return {
        text: `${currentPage} / ${pageCount}`,
        alignment: 'center',
        margin: [0, 20, 0, 0],
        fontSize: 9,
      };
    },
  };

  // Check if JapaneseFont is available, otherwise use Roboto
  if (!pdf.fonts?.JapaneseFont) {
    console.log('Using Roboto font (Japanese may not display correctly)');
    docDefinition.defaultStyle!.font = 'Roboto';
  }

  progress('Creating PDF file...');

  return new Promise((resolve, reject) => {
    try {
      // pdfmake CDN version uses pdfMake.createPdf()
      const pdfDoc = pdf.createPdf(docDefinition);
      pdfDoc.download(`${cleanTitle || 'book'}.pdf`, () => {
        progress('PDF download started');
        resolve();
      });
    } catch (error) {
      console.error('PDF creation error:', error);
      reject(error);
    }
  });
}

/**
 * Check if PDF export is available
 */
export function isPdfExportAvailable(): boolean {
  return true; // pdfmake works in all modern browsers
}
