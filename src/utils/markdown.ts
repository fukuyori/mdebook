import type { EditorFile } from '../types';

// Declare external libraries (loaded via CDN)
declare const marked: {
  parse(markdown: string): string;
};

declare const mermaid: {
  initialize(config: Record<string, unknown>): void;
  render(id: string, code: string): Promise<{ svg: string }>;
};

declare const hljs: {
  highlightElement(element: HTMLElement): void;
  highlightAll(): void;
};

/**
 * Parse markdown to HTML
 */
export function parseMarkdown(markdown: string): string {
  if (typeof marked !== 'undefined') {
    return marked.parse(markdown);
  }
  // Fallback: basic markdown parsing
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

/**
 * Render mermaid diagram to SVG
 */
export async function renderMermaidToSvg(code: string): Promise<string | null> {
  if (typeof mermaid === 'undefined') {
    console.warn('Mermaid library not loaded');
    return null;
  }
  
  try {
    // Clean up the code
    let cleanCode = code.trim();
    if (!cleanCode) return null;
    
    // Remove init directives that might cause issues
    // %%{init: {...}}%% at the start
    cleanCode = cleanCode.replace(/^\s*%%\{init:[\s\S]*?\}%%\s*/i, '');
    
    // Try to render
    const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
    const { svg } = await mermaid.render(id, cleanCode);
    return svg;
  } catch (error) {
    console.error('Mermaid render error:', error);
    // Return null to trigger fallback
    return null;
  }
}

/**
 * Render mermaid diagram to PNG (for EPUB compatibility)
 * Returns base64-encoded PNG data
 */
export async function renderMermaidToPng(code: string, scale: number = 2): Promise<{ base64: string; width: number; height: number } | null> {
  // First render to SVG
  const svg = await renderMermaidToSvg(code);
  if (!svg) return null;
  
  try {
    // Create a temporary container to measure SVG
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.visibility = 'hidden';
    container.innerHTML = svg;
    document.body.appendChild(container);
    
    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      document.body.removeChild(container);
      return null;
    }
    
    // Get dimensions from multiple sources
    let width = 0;
    let height = 0;
    
    // Try viewBox first
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/\s+/);
      if (parts.length >= 4) {
        width = parseFloat(parts[2]) || 0;
        height = parseFloat(parts[3]) || 0;
      }
    }
    
    // Try width/height attributes
    if (width === 0 || height === 0) {
      const widthAttr = svgElement.getAttribute('width');
      const heightAttr = svgElement.getAttribute('height');
      if (widthAttr) width = parseFloat(widthAttr) || 0;
      if (heightAttr) height = parseFloat(heightAttr) || 0;
    }
    
    // Try baseVal
    if (width === 0 || height === 0) {
      if (svgElement.width?.baseVal?.value) width = svgElement.width.baseVal.value;
      if (svgElement.height?.baseVal?.value) height = svgElement.height.baseVal.value;
    }
    
    // Try getBoundingClientRect as last resort
    if (width === 0 || height === 0) {
      const rect = svgElement.getBoundingClientRect();
      if (rect.width > 0) width = rect.width;
      if (rect.height > 0) height = rect.height;
    }
    
    // Default minimum size
    if (width === 0) width = 800;
    if (height === 0) height = 600;
    
    // Ensure minimum readable size (at least 400px wide for EPUB)
    const minWidth = 600;
    if (width < minWidth) {
      const ratio = minWidth / width;
      width = minWidth;
      height = height * ratio;
    }
    
    document.body.removeChild(container);
    
    // Prepare SVG for rendering - ensure it has proper attributes
    let svgForRender = svg;
    
    // Remove external font references (can cause loading issues)
    svgForRender = svgForRender.replace(/@import\s+url\([^)]+\);?/gi, '');
    svgForRender = svgForRender.replace(/@font-face\s*\{[^}]*\}/gi, '');
    
    // Convert foreignObject content to be self-contained
    // Add inline styles to foreignObject elements
    svgForRender = svgForRender.replace(
      /<foreignObject([^>]*)>/gi,
      '<foreignObject$1 xmlns="http://www.w3.org/2000/svg">'
    );
    
    // Ensure div elements inside foreignObject have proper namespace
    svgForRender = svgForRender.replace(
      /<div([^>]*)xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"([^>]*)>/gi,
      '<div$1$2 xmlns="http://www.w3.org/1999/xhtml">'
    );
    
    // Add xmlns if missing
    if (!svgForRender.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgForRender = svgForRender.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    // Add xlink namespace if needed
    if (!svgForRender.includes('xmlns:xlink') && svgForRender.includes('xlink:')) {
      svgForRender = svgForRender.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    
    // Add xhtml namespace for foreignObject content
    if (svgForRender.includes('<foreignObject') && !svgForRender.includes('xmlns:xhtml')) {
      svgForRender = svgForRender.replace('<svg', '<svg xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    }
    
    // Add explicit width/height to SVG for proper rendering
    svgForRender = svgForRender.replace(
      /<svg([^>]*)>/,
      (match, attrs) => {
        // Remove existing width/height that might conflict
        let newAttrs = attrs.replace(/\s*(width|height)="[^"]*"/g, '');
        return `<svg${newAttrs} width="${width}" height="${height}">`;
      }
    );
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    
    // Convert SVG to base64 data URL (more reliable than blob URL)
    const svgBase64 = btoa(unescape(encodeURIComponent(svgForRender)));
    const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;
    
    // Load image and draw to canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const result = await new Promise<{ base64: string; width: number; height: number } | null>((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to PNG base64
        const dataUrl = canvas.toDataURL('image/png');
        // Remove "data:image/png;base64," prefix
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
        resolve({ base64, width: Math.ceil(width), height: Math.ceil(height) });
      };
      
      img.onerror = (e) => {
        console.error('Failed to load SVG as image:', e);
        resolve(null);
      };
      
      img.src = svgDataUrl;
    });
    
    return result;
  } catch (error) {
    console.error('Mermaid PNG render error:', error);
    return null;
  }
}

/**
 * Create a placeholder image for failed mermaid diagrams
 */
function createMermaidErrorPlaceholder(code: string): { base64: string; width: number; height: number } | null {
  try {
    const width = 600;
    const height = 200;
    
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.scale(2, 2);
    
    // Background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Border
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    
    // Icon (simple diagram icon)
    ctx.fillStyle = '#6c757d';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📊', width / 2, 50);
    
    // Title
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillStyle = '#495057';
    ctx.fillText('Diagram', width / 2, 80);
    
    // Extract diagram type from code
    const firstLine = code.trim().split('\n')[0] || '';
    const diagramType = firstLine.replace(/[^a-zA-Z\s]/g, '').trim().substring(0, 30);
    
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = '#6c757d';
    ctx.fillText(`(${diagramType || 'mermaid'})`, width / 2, 100);
    
    // Note
    ctx.font = '11px Arial, sans-serif';
    ctx.fillStyle = '#adb5bd';
    ctx.fillText('Diagram preview not available in EPUB', width / 2, 140);
    ctx.fillText('View original .md file for full diagram', width / 2, 160);
    
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    
    return { base64, width, height };
  } catch (error) {
    console.error('Failed to create error placeholder:', error);
    return null;
  }
}

/**
 * Process mermaid blocks in HTML
 */
export async function processMermaidBlocks(html: string): Promise<string> {
  const mermaidRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g;
  const blocks: Array<{ match: string; code: string }> = [];
  
  let match;
  while ((match = mermaidRegex.exec(html)) !== null) {
    blocks.push({
      match: match[0],
      code: decodeHtmlEntities(match[1]),
    });
  }
  
  for (const block of blocks) {
    const svg = await renderMermaidToSvg(block.code);
    if (svg) {
      html = html.replace(block.match, `<div class="mermaid-diagram">${svg}</div>`);
    }
  }
  
  return html;
}

/**
 * Decode HTML entities
 */
export function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Parse table alignment from separator row
 */
function parseTableAlignment(separatorRow: string): Array<'left' | 'center' | 'right'> {
  const cells = separatorRow.split('|').filter(c => c.trim());
  return cells.map(cell => {
    const trimmed = cell.trim();
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
    if (trimmed.endsWith(':')) return 'right';
    return 'left';
  });
}

/**
 * Convert markdown table to HTML table
 */
export function convertTableToHtml(tableMarkdown: string): string {
  const rows = tableMarkdown.trim().split('\n').filter(row => row.trim());
  if (rows.length < 2) return tableMarkdown;
  
  // Find separator row
  const separatorIdx = rows.findIndex(row => 
    /^\|[\s\-:]+\|$/.test(row.replace(/[^|\-:\s]/g, ''))
  );
  
  if (separatorIdx < 1) return tableMarkdown;
  
  const alignments = parseTableAlignment(rows[separatorIdx]);
  const headerRows = rows.slice(0, separatorIdx);
  const bodyRows = rows.slice(separatorIdx + 1);
  
  const parseRow = (row: string): string[] => {
    return row.split('|').slice(1, -1).map(cell => cell.trim());
  };
  
  let html = '<table class="markdown-table">\n<thead>\n';
  
  for (const row of headerRows) {
    html += '<tr>';
    const cells = parseRow(row);
    cells.forEach((cell, i) => {
      const align = alignments[i] || 'left';
      html += `<th style="text-align:${align}">${parseMarkdown(cell)}</th>`;
    });
    html += '</tr>\n';
  }
  
  html += '</thead>\n<tbody>\n';
  
  for (const row of bodyRows) {
    html += '<tr>';
    const cells = parseRow(row);
    cells.forEach((cell, i) => {
      const align = alignments[i] || 'left';
      html += `<td style="text-align:${align}">${parseMarkdown(cell)}</td>`;
    });
    html += '</tr>\n';
  }
  
  html += '</tbody>\n</table>';
  return html;
}

/**
 * Process tables in markdown
 */
export function processTablesInMarkdown(content: string): string {
  const tableRegex = /(?:^|\n)((?:\|[^\n]+\|\r?\n)+)/g;
  return content.replace(tableRegex, (_match, tableContent) => {
    return '\n' + convertTableToHtml(tableContent);
  });
}

/**
 * Process admonition/callout blocks (:::note, :::warning, :::tip, etc.)
 */
export function processAdmonitions(content: string): string {
  // Match :::type followed by content until :::
  const admonitionRegex = /:::(note|warning|tip|info|caution|important)(?:\s+(.+?))?\n([\s\S]*?):::/gi;
  
  return content.replace(admonitionRegex, (_, type, title, body) => {
    const normalizedType = type.toLowerCase();
    const displayTitle = title?.trim() || getDefaultAdmonitionTitle(normalizedType);
    const icon = getAdmonitionIcon(normalizedType);
    
    return `<div class="admonition admonition-${normalizedType}">
<p class="admonition-title">${icon} ${displayTitle}</p>
<div class="admonition-content">

${body.trim()}

</div>
</div>`;
  });
}

/**
 * Get default title for admonition type
 */
function getDefaultAdmonitionTitle(type: string): string {
  const titles: Record<string, string> = {
    note: 'Note',
    warning: 'Warning',
    tip: 'Tip',
    info: 'Info',
    caution: 'Caution',
    important: 'Important',
  };
  return titles[type] || 'Note';
}

/**
 * Get icon for admonition type
 */
function getAdmonitionIcon(type: string): string {
  const icons: Record<string, string> = {
    note: '📝',
    warning: '⚠️',
    tip: '💡',
    info: 'ℹ️',
    caution: '🔥',
    important: '❗',
  };
  return icons[type] || '📝';
}

/**
 * Mermaid image data for EPUB embedding
 */
export interface MermaidImageData {
  id: string;
  base64: string;
}

/**
 * Convert markdown to XHTML for EPUB
 * Returns XHTML content and any generated mermaid images
 */
export async function convertToXhtml(
  markdown: string,
  title: string,
  options?: {
    stylesheetHref?: string;  // External CSS file reference
    mermaidAsPng?: boolean;   // Convert mermaid to PNG for EPUB compatibility
    bodyClass?: string;       // Additional class for body element
  }
): Promise<{ xhtml: string; mermaidImages: MermaidImageData[] }> {
  // Normalize line endings
  const normalizedMarkdown = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Process mermaid blocks first
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
  const mermaidBlocks: Array<{ original: string; code: string }> = [];
  let match;
  
  while ((match = mermaidRegex.exec(normalizedMarkdown)) !== null) {
    mermaidBlocks.push({
      original: match[0],
      code: match[1],
    });
  }
  
  // Replace mermaid blocks with SVGs or PNGs
  let processedMarkdown = normalizedMarkdown;
  const mermaidImages: MermaidImageData[] = [];
  
  for (let i = 0; i < mermaidBlocks.length; i++) {
    const block = mermaidBlocks[i];
    
    if (options?.mermaidAsPng) {
      // Render as PNG for EPUB
      const pngResult = await renderMermaidToPng(block.code);
      if (pngResult) {
        const imageId = `mermaid-${Date.now()}-${i}`;
        mermaidImages.push({ id: imageId, base64: pngResult.base64 });
        // Include width for proper display (height auto-scales)
        processedMarkdown = processedMarkdown.replace(
          block.original,
          `<div class="mermaid"><img src="images/${imageId}.png" alt="Diagram" style="width:100%;max-width:${pngResult.width}px;height:auto;"/></div>`
        );
      } else {
        // Fallback: create error placeholder image
        const errorPlaceholder = createMermaidErrorPlaceholder(block.code);
        if (errorPlaceholder) {
          const imageId = `mermaid-error-${Date.now()}-${i}`;
          mermaidImages.push({ id: imageId, base64: errorPlaceholder.base64 });
          processedMarkdown = processedMarkdown.replace(
            block.original,
            `<div class="mermaid"><img src="images/${imageId}.png" alt="Diagram (render error)" style="width:100%;max-width:${errorPlaceholder.width}px;height:auto;"/></div>`
          );
        } else {
          // Last resort: styled code block
          processedMarkdown = processedMarkdown.replace(
            block.original,
            `<div class="mermaid-error"><p><strong>[Diagram]</strong></p><pre><code>${escapeHtml(block.code.substring(0, 200))}${block.code.length > 200 ? '...' : ''}</code></pre></div>`
          );
        }
      }
    } else {
      // Render as SVG (for preview/HTML export)
      const svg = await renderMermaidToSvg(block.code);
      if (svg) {
        processedMarkdown = processedMarkdown.replace(
          block.original,
          `<div class="mermaid">${svg}</div>`
        );
      }
    }
  }
  
  // Process admonitions (:::note, :::warning, etc.)
  processedMarkdown = processAdmonitions(processedMarkdown);
  
  // Process tables
  processedMarkdown = processTablesInMarkdown(processedMarkdown);
  
  // Parse to HTML
  let html = parseMarkdown(processedMarkdown);
  
  // Style section: use external CSS if provided, otherwise use inline styles
  const styleSection = options?.stylesheetHref
    ? `<link rel="stylesheet" type="text/css" href="${options.stylesheetHref}"/>`
    : `<style>
    body { font-family: serif; line-height: 1.6; margin: 2em; }
    h1, h2, h3 { margin-top: 1.5em; }
    code { font-family: monospace; background: #f4f4f4; padding: 0.2em 0.4em; }
    pre { background: #f4f4f4; padding: 1em; overflow-x: auto; }
    blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 1em; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #ddd; padding: 0.5em; }
    th { background: #f4f4f4; }
    .mermaid { text-align: center; margin: 1em 0; }
    .mermaid img { max-width: 100%; height: auto; }
    .footnotes { font-size: 0.9em; border-top: 1px solid #ccc; margin-top: 2em; padding-top: 1em; }
  </style>`;
  
  // Wrap in XHTML document
  const bodyClass = options?.bodyClass ? ` class="${options.bodyClass}"` : '';
  const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(title)}</title>
  ${styleSection}
</head>
<body${bodyClass}>
${html}
</body>
</html>`;
  
  return { xhtml, mermaidImages };
}

/**
 * Generate table of contents from files
 */
export function generateToc(files: EditorFile[]): Array<{ level: number; text: string; id: string }> {
  const toc: Array<{ level: number; text: string; id: string }> = [];
  
  files.forEach((file, fileIdx) => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;
    let headingIdx = 0;
    
    while ((match = headingRegex.exec(file.content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = `file-${fileIdx}-heading-${headingIdx}`;
      
      toc.push({ level, text, id });
      headingIdx++;
    }
  });
  
  return toc;
}

/**
 * Apply syntax highlighting to code blocks
 */
export function highlightCodeBlocks(container: HTMLElement): void {
  if (typeof hljs !== 'undefined') {
    container.querySelectorAll('pre code').forEach((block) => {
      // Skip mermaid blocks - they will be rendered as diagrams
      if (block.classList.contains('language-mermaid')) {
        return;
      }
      hljs.highlightElement(block as HTMLElement);
    });
  }
}

/**
 * Initialize mermaid diagrams in container
 */
export async function initializeMermaidDiagrams(container: HTMLElement): Promise<void> {
  if (typeof mermaid === 'undefined') return;
  
  const diagrams = container.querySelectorAll('.language-mermaid');
  for (const diagram of diagrams) {
    let code = diagram.textContent || '';
    // Clean up the code: trim whitespace, decode HTML entities
    code = decodeHtmlEntities(code.trim());
    
    // Skip empty code blocks
    if (!code) continue;
    
    try {
      const svg = await renderMermaidToSvg(code);
      if (svg && diagram.parentElement) {
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-diagram';
        wrapper.innerHTML = svg;
        diagram.parentElement.replaceWith(wrapper);
      }
    } catch (error) {
      console.warn('Mermaid diagram failed to render:', error);
    }
  }
}
