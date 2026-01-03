/**
 * Application version
 */
export const VERSION = '0.4.7';

/**
 * Default editor settings
 */
export const EDITOR_DEFAULTS = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on' as const,
  lineNumbers: 'on' as const,
  minimap: false,
};

/**
 * VIM dark theme for Monaco
 */
export const VIM_DARK_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955' },
    { token: 'keyword', foreground: '569CD6' },
    { token: 'string', foreground: 'CE9178' },
  ],
  colors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    'editorCursor.foreground': '#ffffff',
    'editor.lineHighlightBackground': '#2d2d2d',
    'editor.selectionBackground': '#264f78',
  },
};

/**
 * VIM light theme for Monaco
 */
export const VIM_LIGHT_THEME = {
  base: 'vs' as const,
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#ffffff',
    'editorCursor.foreground': '#000000',
    'editor.lineHighlightBackground': '#f0f0f0',
  },
};

/**
 * Bracket pairs for matching
 */
export const BRACKET_PAIRS: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '<': '>',
};

/**
 * Close brackets to open brackets
 */
export const CLOSE_TO_OPEN_BRACKETS: Record<string, string> = {
  ')': '(',
  ']': '[',
  '}': '{',
  '>': '<',
};

/**
 * Quote pairs for text objects
 */
export const QUOTE_CHARS = ['"', "'", '`'];

/**
 * EPUB MIME type
 */
export const EPUB_MIMETYPE = 'application/epub+zip';

/**
 * EPUB container XML
 */
export const EPUB_CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

/**
 * Default Mermaid configuration
 */
export const MERMAID_CONFIG = {
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
};

/**
 * Debounce delay for preview updates (ms)
 */
export const PREVIEW_DEBOUNCE_MS = 300;

/**
 * Status message display duration (ms)
 */
export const STATUS_MESSAGE_DURATION = 1500;

/**
 * VIM mode colors for status bar
 */
export const VIM_MODE_COLORS: Record<string, string> = {
  NORMAL: 'bg-blue-600',
  INSERT: 'bg-green-600',
  VISUAL: 'bg-purple-600',
  VISUAL_LINE: 'bg-purple-600',
  COMMAND: 'bg-amber-600',
  REPLACE: 'bg-red-600',
};

/**
 * Monaco Editor CDN URLs
 */
export const MONACO_CDN = {
  loader: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js',
  base: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs',
};

/**
 * External library CDN URLs
 */
export const CDN_URLS = {
  mermaid: 'https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.6.1/mermaid.min.js',
  jszip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  fileSaver: 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
  marked: 'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  highlightJs: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js',
};
