import React, { useEffect, useRef, useState } from 'react';
import { parseMarkdown, highlightCodeBlocks, initializeMermaidDiagramsWithAttributes, convertRubyToHtml, processImageAttributes, parseMediaAttributes, mediaAttributesToStyle } from '../utils';
import { PREVIEW_DEBOUNCE_MS } from '../constants';

/**
 * Preview component props
 */
export interface PreviewProps {
  content: string;
  isDark?: boolean;
  className?: string;
  onScroll?: (scrollRatio: number) => void;
  scrollToRef?: React.MutableRefObject<((ratio: number) => void) | null>;
  imageUrls?: Map<string, string>; // Map of image name to object URL
}

/**
 * Process mermaid blocks with attribute support for preview
 * Uses unique text markers that survive markdown parsing
 */
function processMermaidWithAttributes(content: string): { processed: string; blocks: Map<string, { code: string; style: string }> } {
  const blocks = new Map<string, { code: string; style: string }>();
  let counter = 0;
  
  // Match: ```mermaid or ```mermaid {attrs}
  const mermaidRegex = /```mermaid(?:\s*\{([^}]+)\})?\n([\s\S]*?)```/g;
  
  const processed = content.replace(mermaidRegex, (match, attrStr, code) => {
    const attrs = parseMediaAttributes(attrStr);
    const styles: string[] = [];
    
    if (attrs.width) styles.push(`width:${attrs.width}`);
    if (attrs.maxWidth) styles.push(`max-width:${attrs.maxWidth}`);
    if (attrs.height) styles.push(`height:${attrs.height}`);
    if (attrs.maxHeight) styles.push(`max-height:${attrs.maxHeight}`);
    if (attrs.align === 'center') styles.push('margin-left:auto', 'margin-right:auto');
    else if (attrs.align === 'right') styles.push('margin-left:auto', 'margin-right:0');
    
    const id = `mermaid-block-${counter++}`;
    blocks.set(id, { code: code.trim(), style: styles.join(';') });
    
    // Use a unique marker that won't be modified by markdown parser
    // Format: <!--MERMAID:id:style-->
    const encodedStyle = encodeURIComponent(styles.join(';'));
    return `\n\n<!--MERMAID_PLACEHOLDER:${id}:${encodedStyle}-->\n\n`;
  });
  
  return { processed, blocks };
}

/**
 * Replace mermaid placeholders with actual placeholder divs after markdown parsing
 */
function replaceMermaidPlaceholders(html: string): string {
  // Replace HTML comment markers with actual div placeholders
  // Pattern: <!--MERMAID_PLACEHOLDER:id:encodedStyle-->
  // encodedStyle is URL-encoded (contains letters, numbers, %, and some special chars)
  return html.replace(
    /<!--MERMAID_PLACEHOLDER:([\w-]+):([A-Za-z0-9%.-]*)-->/g,
    (match, id, encodedStyle) => {
      const style = decodeURIComponent(encodedStyle || '');
      return `<div class="mermaid-placeholder" data-mermaid-id="${id}" data-mermaid-style="${style}"></div>`;
    }
  );
}

/**
 * Markdown preview component with syntax highlighting and Mermaid support
 */
export const Preview: React.FC<PreviewProps> = ({
  content,
  isDark = true,
  className = '',
  onScroll,
  scrollToRef,
  imageUrls,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState('');
  const debounceRef = useRef<NodeJS.Timeout>();
  const isScrollingRef = useRef(false);
  const mermaidBlocksRef = useRef<Map<string, { code: string; style: string }>>(new Map());
  
  // Register scroll function to ref
  useEffect(() => {
    if (scrollToRef) {
      scrollToRef.current = (ratio: number) => {
        if (!containerRef.current) return;
        isScrollingRef.current = true;
        const container = containerRef.current;
        const scrollHeight = container.scrollHeight - container.clientHeight;
        container.scrollTop = ratio * scrollHeight;
        setTimeout(() => { isScrollingRef.current = false; }, 50);
      };
    }
    return () => {
      if (scrollToRef) scrollToRef.current = null;
    };
  }, [scrollToRef]);
  
  // Replace image paths with object URLs
  const replaceImageUrls = (htmlContent: string): string => {
    if (!imageUrls || imageUrls.size === 0) return htmlContent;
    
    // Replace images/filename.ext with object URLs
    return htmlContent.replace(
      /src="images\/([^"]+)"/g,
      (match, filename) => {
        const url = imageUrls.get(filename);
        if (url) {
          return `src="${url}"`;
        }
        return match;
      }
    );
  };
  
  // Parse markdown with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      // Process mermaid blocks first and extract attributes
      const { processed: mermaidProcessed, blocks } = processMermaidWithAttributes(content);
      mermaidBlocksRef.current = blocks;
      
      // Process image attributes
      let processed = processImageAttributes(mermaidProcessed);
      // Convert ruby notation
      processed = convertRubyToHtml(processed);
      // Parse markdown
      let parsed = parseMarkdown(processed);
      // Replace mermaid placeholders (HTML comments -> div elements)
      parsed = replaceMermaidPlaceholders(parsed);
      // Replace image URLs
      parsed = replaceImageUrls(parsed);
      setHtml(parsed);
    }, PREVIEW_DEBOUNCE_MS);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, imageUrls]);
  
  // Apply syntax highlighting and render Mermaid diagrams
  useEffect(() => {
    if (containerRef.current && html) {
      highlightCodeBlocks(containerRef.current);
      initializeMermaidDiagramsWithAttributes(containerRef.current, mermaidBlocksRef.current);
    }
  }, [html]);

  // Handle scroll event
  const handleScroll = () => {
    if (isScrollingRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    
    if (scrollHeight > 0) {
      const ratio = scrollTop / scrollHeight;
      onScroll?.(ratio);
    }
  };
  
  return (
    <div
      ref={containerRef}
      className={`preview-container prose ${isDark ? 'prose-dark' : 'prose-light'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      onScroll={handleScroll}
    />
  );
};

/**
 * Preview styles (to be included in main CSS)
 */
export const previewStyles = `
  .preview-container {
    padding: 1.5rem;
    overflow-y: auto;
    height: 100%;
  }
  
  .prose-dark {
    color: #e0e0e0;
    background: #1a1a1a;
  }
  
  .prose-light {
    color: #1a1a1a;
    background: #ffffff;
  }
  
  .prose h1 {
    font-size: 1.875rem;
    font-weight: bold;
    margin: 2rem 0 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid currentColor;
    opacity: 0.9;
  }
  
  .prose h2 {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 1.5rem 0 0.75rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid currentColor;
    opacity: 0.7;
  }
  
  .prose h3 {
    font-size: 1.25rem;
    font-weight: bold;
    margin: 1.25rem 0 0.5rem;
  }
  
  .prose p {
    margin: 0.75rem 0;
    line-height: 1.7;
  }
  
  .prose ul, .prose ol {
    margin: 1rem 0;
    padding-left: 1.5rem;
  }
  
  .prose li {
    margin: 0.25rem 0;
  }
  
  .prose pre {
    margin: 1rem 0;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
  }
  
  .prose-dark pre {
    background: #2d2d2d;
  }
  
  .prose-light pre {
    background: #f4f4f4;
  }
  
  .prose code {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 0.9em;
    padding: 0.15em 0.3em;
    border-radius: 0.25rem;
  }
  
  .prose-dark code {
    background: #2d2d2d;
  }
  
  .prose-light code {
    background: #f0f0f0;
  }
  
  .prose pre code {
    background: none;
    padding: 0;
  }
  
  .prose blockquote {
    margin: 1rem 0;
    padding: 0.5rem 1rem;
    border-left: 4px solid;
    opacity: 0.8;
  }
  
  .prose-dark blockquote {
    border-color: #4a4a4a;
    background: #2a2a2a;
  }
  
  .prose-light blockquote {
    border-color: #ddd;
    background: #f9f9f9;
  }
  
  .prose table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
  }
  
  .prose th, .prose td {
    border: 1px solid;
    padding: 0.5rem 0.75rem;
    text-align: left;
  }
  
  .prose-dark th, .prose-dark td {
    border-color: #4a4a4a;
  }
  
  .prose-light th, .prose-light td {
    border-color: #ddd;
  }
  
  .prose th {
    font-weight: bold;
  }
  
  .prose-dark th {
    background: #2d2d2d;
  }
  
  .prose-light th {
    background: #f4f4f4;
  }
  
  .prose hr {
    margin: 2rem 0;
    border: none;
    border-top: 1px solid currentColor;
    opacity: 0.3;
  }
  
  .prose a {
    text-decoration: none;
  }
  
  .prose-dark a {
    color: #6db3f2;
  }
  
  .prose-light a {
    color: #0066cc;
  }
  
  .prose a:hover {
    text-decoration: underline;
  }
  
  .prose img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 1rem 0;
  }
  
  .prose .mermaid-diagram {
    text-align: center;
    margin: 1.5rem 0;
  }
  
  .prose .mermaid-diagram svg {
    max-width: 100%;
  }
  
  .prose .footnotes {
    font-size: 0.875rem;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid currentColor;
    opacity: 0.8;
  }
`;

export default Preview;
