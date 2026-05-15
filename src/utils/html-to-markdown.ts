/**
 * HTML to Markdown conversion using Turndown (loaded via CDN).
 */
import { readFileWithEncoding } from './encoding';
import { addImageFromUrl, addImageFromFile } from './project';
import type { ProjectImage } from '../types';

declare const TurndownService: {
  new (options?: Record<string, unknown>): {
    use(plugin: unknown): void;
    addRule(name: string, rule: Record<string, unknown>): void;
    turndown(input: string | HTMLElement): string;
  };
};

declare const turndownPluginGfm: {
  gfm: unknown;
  tables: unknown;
  strikethrough: unknown;
  taskListItems: unknown;
} | undefined;

/**
 * Detect whether a fetched body looks like HTML rather than Markdown.
 * Used after fetch when the URL does not end with .md.
 */
export function looksLikeHtml(content: string, contentType?: string | null): boolean {
  if (contentType && /text\/html|application\/xhtml/i.test(contentType)) {
    return true;
  }
  const head = content.slice(0, 4096).toLowerCase();
  if (/<!doctype\s+html/.test(head)) return true;
  if (/<html[\s>]/.test(head)) return true;
  // Multiple HTML tags strongly suggests HTML
  const tagMatches = head.match(/<(html|head|body|div|article|section|main|nav|header|footer|p|h[1-6])\b/g);
  return !!(tagMatches && tagMatches.length >= 3);
}

/**
 * Detect Firefox/Chrome "view-source" pages saved to disk.
 * Their body is `<body id="viewsource">` containing escaped HTML wrapped in
 * <span> elements. The textContent of that body is the original HTML source.
 */
function isViewSourceDocument(doc: Document): boolean {
  const body = doc.body;
  if (!body) return false;
  if (body.id === 'viewsource') return true;
  // Some browsers use a class instead
  if (body.classList && body.classList.contains('viewsource')) return true;
  // Fallback: stylesheet reference to viewsource.css
  return !!doc.querySelector('link[href*="viewsource.css"]');
}

/**
 * Extract main article content from a full HTML document.
 * Falls back to <body> or the whole document if no obvious main region exists.
 */
function extractMainContent(html: string): { fragment: string; title: string } {
  const parser = new DOMParser();
  let doc = parser.parseFromString(html, 'text/html');

  // If this is a browser "view-source" page, the real HTML lives as escaped
  // text inside the body. Recover it and re-parse.
  if (isViewSourceDocument(doc)) {
    const recovered = doc.body?.textContent ?? '';
    if (recovered.trim()) {
      doc = parser.parseFromString(recovered, 'text/html');
    }
  }

  // Strip noise
  doc.querySelectorAll('script, style, noscript, iframe, svg, form, button').forEach(el => el.remove());
  // Strip common chrome
  doc.querySelectorAll('nav, header, footer, aside, .sidebar, .navigation, .header, .footer, .ads, .advertisement, [role="navigation"], [role="banner"], [role="contentinfo"]').forEach(el => el.remove());

  // Flatten <picture><source><img></picture> down to a bare <img>, so wrapping
  // links don't end up containing block-level children that Turndown formats
  // across multiple lines (which breaks the [ ... ](href) syntax).
  doc.querySelectorAll('picture').forEach(pic => {
    const img = pic.querySelector('img');
    if (img) pic.replaceWith(img);
    else pic.remove();
  });

  // For <a> elements whose only meaningful content is an <img>, drop the
  // wrapping link entirely. Reasons:
  //   - Markdown's `[![alt](src)](href)` syntax is technically valid but
  //     renders as visual `[` `]` noise in editor previews.
  //   - For ebook/document output the wrapping link (avatar→profile,
  //     thumbnail→full size, etc.) is usually redundant or unwanted.
  doc.querySelectorAll('a').forEach(a => {
    const img = a.querySelector('img');
    if (!img) return;
    const text = (a.textContent || '').replace(/\s+/g, '');
    const imgAlt = (img.getAttribute('alt') || '').replace(/\s+/g, '');
    // Skip if the link also has meaningful text beyond the image's alt.
    if (text && text !== imgAlt) return;
    a.replaceWith(img);
  });

  const title = (doc.querySelector('title')?.textContent || '').trim();

  // Pick the most likely main content node
  const candidates = [
    'article',
    'main',
    '[role="main"]',
    '#content',
    '.content',
    '.post',
    '.entry-content',
    '.article-body',
    '.markdown-body',
  ];

  let mainEl: Element | null = null;
  for (const sel of candidates) {
    const el = doc.querySelector(sel);
    if (el && el.textContent && el.textContent.trim().length > 200) {
      mainEl = el;
      break;
    }
  }

  if (!mainEl) {
    mainEl = doc.body || doc.documentElement;
  }

  return { fragment: mainEl ? mainEl.innerHTML : html, title };
}

/**
 * Convert an HTML document or fragment into Markdown.
 * Requires Turndown to be loaded on `window`. Throws if not available.
 */
export function htmlToMarkdown(html: string): { markdown: string; title: string } {
  if (typeof TurndownService === 'undefined') {
    throw new Error('Turndown library is not available');
  }

  const { fragment, title } = extractMainContent(html);

  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    fence: '```',
    linkStyle: 'inlined',
  });

  // GFM plugin: tables, strikethrough, task lists
  if (typeof turndownPluginGfm !== 'undefined' && turndownPluginGfm.gfm) {
    service.use(turndownPluginGfm.gfm);
  }

  // Preserve language hint on fenced code blocks (e.g. <pre><code class="language-js">)
  service.addRule('fencedCodeWithLang', {
    filter: (node: HTMLElement) => {
      return node.nodeName === 'PRE' && !!node.firstChild && (node.firstChild as HTMLElement).nodeName === 'CODE';
    },
    replacement: (_content: string, node: HTMLElement) => {
      const code = node.firstChild as HTMLElement;
      const className = code.getAttribute('class') || '';
      const langMatch = className.match(/(?:language|lang)-([\w+-]+)/);
      const lang = langMatch ? langMatch[1] : '';
      const text = code.textContent || '';
      return `\n\n\`\`\`${lang}\n${text.replace(/\n+$/, '')}\n\`\`\`\n\n`;
    },
  });

  let markdown = service.turndown(fragment).trim();

  // Prepend the page title as H1 if not already present
  if (title && !/^#\s+/m.test(markdown.split('\n').slice(0, 3).join('\n'))) {
    markdown = `# ${title}\n\n${markdown}`;
  }

  return { markdown, title };
}

/**
 * Whether a file looks like an HTML document based on its extension.
 */
export function isHtmlFileName(name: string): boolean {
  return /\.x?html?$/i.test(name);
}

/**
 * Dedup a candidate filename against a set of already-taken names by
 * appending "_1", "_2", ... before the extension. Underscore (not " (N)") is
 * used so the resulting name never contains spaces or parentheses, which
 * would otherwise break Markdown's `![alt](url)` syntax.
 */
function uniquifyName(candidate: string, taken: Set<string>): string {
  if (!taken.has(candidate)) {
    taken.add(candidate);
    return candidate;
  }
  const lastDot = candidate.lastIndexOf('.');
  const base = lastDot > 0 ? candidate.substring(0, lastDot) : candidate;
  const ext = lastDot > 0 ? candidate.substring(lastDot) : '';
  let i = 1;
  let name = `${base}_${i}${ext}`;
  while (taken.has(name)) {
    i++;
    name = `${base}_${i}${ext}`;
  }
  taken.add(name);
  return name;
}

/**
 * Format an `images/<name>` reference safely for Markdown. When the name
 * contains characters that break the `![alt](url)` syntax (spaces, parens,
 * angle brackets), wrap the URL in `<…>` per CommonMark.
 */
function formatImageUrl(name: string): string {
  const url = `images/${name}`;
  if (/[\s()<>]/.test(name)) return `<${url}>`;
  return url;
}

/**
 * Scan a Markdown string for image references and download each remote image
 * (absolute http/https URLs, or relative URLs resolved against `baseUrl`).
 * Returns the rewritten Markdown (with `images/<filename>` references) and the
 * list of newly created ProjectImage entries.
 *
 * `existingImageNames` is used to avoid name collisions with images already in
 * the project. The same source URL appearing multiple times is fetched once.
 */
/**
 * Look up a relative URL in a map of locally-supplied files (e.g. dragged in
 * along with an HTML file). Tries a few key variants: as-is, percent-decoded,
 * basename only, and a fallback scan by File.name when there is no folder
 * structure in the map.
 */
function findLocalFile(localFiles: Map<string, File>, urlPath: string): File | null {
  const decode = (s: string) => { try { return decodeURI(s); } catch { return s; } };
  const decodeComp = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };

  const normalized = urlPath.replace(/^\.\//, '');
  const keys = new Set<string>([
    urlPath,
    normalized,
    decode(urlPath),
    decode(normalized),
    decodeComp(urlPath),
    decodeComp(normalized),
  ]);
  for (const k of keys) {
    const f = localFiles.get(k);
    if (f) return f;
  }

  // Try basename match against either the map key OR each File's own name.
  const targetBase = decodeComp(normalized.split('/').pop() || '');
  if (!targetBase) return null;
  for (const [key, file] of localFiles) {
    if (file.name === targetBase) return file;
    const keyBase = key.split('/').pop() || '';
    if (keyBase === targetBase) return file;
    if (decode(keyBase) === targetBase) return file;
  }
  return null;
}

export async function downloadInlineImages(
  markdown: string,
  options: {
    baseUrl?: string;
    existingImageNames?: Set<string>;
    localFiles?: Map<string, File>;
    onProgress?: (done: number, total: number) => void;
    concurrency?: number;
  } = {}
): Promise<{ markdown: string; images: ProjectImage[]; failed: string[] }> {
  const taken = new Set(options.existingImageNames ?? []);
  const baseUrl = options.baseUrl;
  const localFiles = options.localFiles;
  const concurrency = Math.max(1, options.concurrency ?? 4);

  // Match ![alt](url) or ![alt](url "title"). URL has no spaces or ')'.
  const imageRegex = /!\[([^\]]*)\]\(\s*(<[^>]+>|[^)\s]+)(\s+"[^"]*")?\s*\)/g;

  // For each unique source URL, decide how to load it:
  //   - 'remote'      → fetch via addImageFromUrl
  //   - 'local'       → resolved against localFiles
  //   - 'skip'        → intentionally leave as-is (data: URL, already images/)
  //   - 'unresolved'  → couldn't resolve a relative URL — counts toward `failed`
  //                     so the caller can prompt the user to supply the folder
  type Plan =
    | { kind: 'remote'; resolved: string }
    | { kind: 'local'; file: File }
    | { kind: 'skip' }
    | { kind: 'unresolved' };

  const seenUrls = new Map<string, Plan>();
  const matches = [...markdown.matchAll(imageRegex)];
  for (const m of matches) {
    let url = m[2];
    if (url.startsWith('<') && url.endsWith('>')) url = url.slice(1, -1);
    if (seenUrls.has(url)) continue;

    if (/^data:/i.test(url)) {
      seenUrls.set(url, { kind: 'skip' });
      continue;
    }
    // Already-resolved project image (from a prior import pass)
    if (url.startsWith('images/')) {
      seenUrls.set(url, { kind: 'skip' });
      continue;
    }
    if (/^https?:\/\//i.test(url)) {
      seenUrls.set(url, { kind: 'remote', resolved: url });
      continue;
    }
    if (/^\/\//.test(url)) {
      seenUrls.set(url, { kind: 'remote', resolved: `https:${url}` });
      continue;
    }
    // Relative URL: prefer a locally-supplied file, otherwise resolve against baseUrl.
    if (localFiles) {
      const f = findLocalFile(localFiles, url);
      if (f) {
        seenUrls.set(url, { kind: 'local', file: f });
        continue;
      }
    }
    if (baseUrl) {
      try { seenUrls.set(url, { kind: 'remote', resolved: new URL(url, baseUrl).toString() }); continue; } catch { /* fall through */ }
    }
    // Relative URL with no localFiles match and no baseUrl → can't be loaded.
    seenUrls.set(url, { kind: 'unresolved' });
  }

  const work: Array<{ original: string; plan: Plan }> = [];
  const failed: string[] = [];
  for (const [original, plan] of seenUrls) {
    if (plan.kind === 'skip') continue;
    if (plan.kind === 'unresolved') { failed.push(original); continue; }
    work.push({ original, plan });
  }

  const total = work.length;
  const newImages: ProjectImage[] = [];
  const replacements = new Map<string, string>(); // original URL -> assigned filename
  let done = 0;
  options.onProgress?.(0, total);

  // Parallel processing with a small concurrency cap to avoid hammering proxies.
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, total) }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= work.length) return;
      const { original, plan } = work[idx];
      let image: ProjectImage | null = null;
      try {
        if (plan.kind === 'remote') {
          image = await addImageFromUrl(plan.resolved);
        } else if (plan.kind === 'local') {
          image = await addImageFromFile(plan.file);
        }
      } catch {
        image = null;
      }
      if (image) {
        image.name = uniquifyName(image.name, taken);
        newImages.push(image);
        replacements.set(original, image.name);
      } else {
        failed.push(plan.kind === 'remote' ? plan.resolved : original);
      }
      done++;
      options.onProgress?.(done, total);
    }
  });
  await Promise.all(workers);

  if (replacements.size === 0) {
    return { markdown, images: [], failed };
  }

  const rewritten = markdown.replace(imageRegex, (full, alt: string, url: string, title?: string) => {
    let key = url;
    if (key.startsWith('<') && key.endsWith('>')) key = key.slice(1, -1);
    const newName = replacements.get(key);
    if (!newName) return full;
    return `![${alt}](${formatImageUrl(newName)}${title ?? ''})`;
  });

  return { markdown: rewritten, images: newImages, failed };
}

/**
 * Read a text file. If it is HTML (by extension or by sniffing the content),
 * convert it to Markdown and rename to `.md`. Otherwise return as-is.
 *
 * The `wasHtml` flag tells the caller whether to follow up with
 * `downloadInlineImages` to fetch any remote images referenced in the result.
 */
export async function readTextFileAsMarkdown(
  file: File
): Promise<{ name: string; content: string; wasHtml: boolean }> {
  const raw = await readFileWithEncoding(file);
  const isHtml = isHtmlFileName(file.name) || looksLikeHtml(raw, file.type || null);
  if (!isHtml) {
    return { name: file.name, content: raw, wasHtml: false };
  }
  const { markdown, title } = htmlToMarkdown(raw);
  const safeTitle = title.replace(/[\\/:*?"<>|\r\n\t]+/g, '').trim();
  const base = safeTitle || file.name.replace(/\.[a-z0-9]+$/i, '') || 'imported';
  return { name: `${base}.md`, content: markdown, wasHtml: true };
}
