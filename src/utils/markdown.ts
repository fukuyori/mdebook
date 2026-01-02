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
  if (typeof mermaid === 'undefined') return null;
  
  try {
    // Clean up the code
    const cleanCode = code.trim();
    if (!cleanCode) return null;
    
    const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
    const { svg } = await mermaid.render(id, cleanCode);
    return svg;
  } catch (error) {
    console.error('Mermaid render error:', error);
    console.error('Code was:', JSON.stringify(code));
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
 * Convert markdown to XHTML for EPUB
 */
export async function convertToXhtml(
  markdown: string,
  title: string,
  options?: {
    stylesheetHref?: string;  // External CSS file reference
  }
): Promise<string> {
  // Process mermaid blocks first
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
  const mermaidBlocks: Array<{ original: string; code: string }> = [];
  let match;
  
  while ((match = mermaidRegex.exec(markdown)) !== null) {
    mermaidBlocks.push({
      original: match[0],
      code: match[1],
    });
  }
  
  // Replace mermaid blocks with SVGs
  let processedMarkdown = markdown;
  for (const block of mermaidBlocks) {
    const svg = await renderMermaidToSvg(block.code);
    if (svg) {
      processedMarkdown = processedMarkdown.replace(
        block.original,
        `<div class="mermaid">${svg}</div>`
      );
    }
  }
  
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
    .footnotes { font-size: 0.9em; border-top: 1px solid #ccc; margin-top: 2em; padding-top: 1em; }
  </style>`;
  
  // Wrap in XHTML document
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(title)}</title>
  ${styleSection}
</head>
<body>
${html}
</body>
</html>`;
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
