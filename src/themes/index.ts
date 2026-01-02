/**
 * EPUB Theme definitions
 * Based on Amazon Kindle Publishing Guidelines 2025.1
 * References:
 * - Classic/Novel/Academic: General publishing standards
 * - Modern: Business book conventions
 * - Technical: O'Reilly Media style (Building Medallion Architectures)
 */

export type ThemeId = 'classic' | 'modern' | 'technical' | 'novel' | 'academic' | 'custom';

export interface EpubTheme {
  id: ThemeId;
  name: string;
  description: string;
  css: string;
}

const classicCss = `
/* Classic Theme - Kindle Optimized */
@charset "UTF-8";

/* ==========================================================================
   1. 基本設定 (Reset & Base)
   ========================================================================== */
html {
  font-size: 100%;
}

body {
  margin: 0;
  padding: 0;
  line-height: 1.7;
  text-align: justify;
  word-wrap: break-word;
}

/* ==========================================================================
   2. 見出し (Headings)
   ========================================================================== */
h1 {
  font-size: 1.6em;
  font-weight: bold;
  text-align: center;
  margin: 3em 0 2em 0;
  border-bottom: 1px solid #333;
  padding-bottom: 0.3em;
  page-break-before: always;
}

h2 {
  font-size: 1.3em;
  font-weight: bold;
  margin: 2em 0 1em 0;
  border-bottom: 1px solid #999;
  padding-bottom: 0.2em;
}

h3 {
  font-size: 1.1em;
  font-weight: bold;
  margin: 1.5em 0 0.8em 0;
}

h4 {
  font-size: 1em;
  font-weight: bold;
  margin: 1.2em 0 0.3em 0;
}

/* ==========================================================================
   3. 本文・段落 (Paragraphs)
   ========================================================================== */
p {
  margin: 0;
  padding: 0;
  text-indent: 1em;
}

p.no-indent {
  text-indent: 0;
}

h1 + p, h2 + p, h3 + p, h4 + p {
  text-indent: 0;
}

a { color: #06c; text-decoration: none; }

blockquote {
  margin: 1em 2em;
  padding: 0.5em 1em;
  border-left: 3px solid #ccc;
  color: #555;
  font-style: italic;
}

/* ==========================================================================
   4. リスト (Lists)
   ========================================================================== */
ul, ol {
  margin: 1em 0 1em 2em;
}

li {
  margin: 0.5em 0;
}

/* ==========================================================================
   5. コード (Code Blocks)
   ========================================================================== */
/* インラインコード */
code {
  font-family: monospace;
  font-size: 0.9em;
  background-color: #f0f0f0;
  padding: 0.1em 0.3em;
}

/* コードブロック */
pre {
  font-family: monospace;
  font-size: 0.9em;
  background-color: #f0f0f0;
  display: block;
  white-space: pre-wrap;
  padding: 1em;
  margin: 1em 0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* コードブロック内のcode要素（リセット） */
pre code {
  font-size: inherit;
  background: none;
  padding: 0;
}

/* ==========================================================================
   6. テーブル (Tables)
   ========================================================================== */
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #999; padding: 0.5em; text-align: left; }
th { background: #f0f0f0; font-weight: bold; }

/* ==========================================================================
   7. 画像 (Images)
   ========================================================================== */
img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
hr { border: none; border-top: 1px solid #ccc; margin: 2em 0; }

.footnote { font-size: 0.85em; color: #666; }
sup { font-size: 0.75em; vertical-align: super; }

/* Mermaid diagrams */
.mermaid {
  text-align: center;
  margin: 1.5em 0;
  page-break-inside: avoid;
}
.mermaid img {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  height: auto;
}

/* Colophon (奥付) */
.colophon { page-break-before: always; margin-top: 3em; }
.colophon h1 { text-align: center; border-bottom: none; }
.colophon hr { border: none; border-top: 1px solid #999; margin: 1.5em 0; }
.colophon table { width: auto; margin: 1em auto; border: none; }
.colophon th, .colophon td { border: none; padding: 0.3em 1em; }
.colophon th { text-align: right; font-weight: normal; color: #666; }
.colophon td { text-align: left; }

/* Chapter Title Page (章扉) */
.chapter-title-page {
  page-break-before: always;
  page-break-after: always;
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  padding: 2em;
}
.chapter-title-page h1 {
  font-size: 1.2em;
  font-weight: normal;
  color: #666;
  margin-bottom: 0.5em;
  border-bottom: none;
}
.chapter-title-page h2 {
  font-size: 1.8em;
  font-weight: bold;
  margin-bottom: 2em;
}
.chapter-title-page blockquote {
  font-style: italic;
  border-left: none;
  padding: 0;
  margin: 2em auto;
  max-width: 80%;
  color: #555;
}

/* Admonitions (補足欄) */
.admonition {
  margin: 1.5em 0;
  padding: 1em;
  border-left: 4px solid #666;
  background: #f9f9f9;
  page-break-inside: avoid;
}
.admonition-title {
  font-weight: bold;
  margin: 0 0 0.5em 0;
}
.admonition-content { margin: 0; }
.admonition-content p { margin: 0.5em 0; }
.admonition-note { border-left-color: #2196f3; background: #e3f2fd; }
.admonition-warning { border-left-color: #ff9800; background: #fff3e0; }
.admonition-tip { border-left-color: #4caf50; background: #e8f5e9; }
.admonition-info { border-left-color: #00bcd4; background: #e0f7fa; }
.admonition-caution { border-left-color: #f44336; background: #ffebee; }
.admonition-important { border-left-color: #9c27b0; background: #f3e5f5; }
`;

const modernCss = `
/* Modern Theme - Kindle Optimized */
@charset "UTF-8";

/* ==========================================================================
   1. 基本設定 (Reset & Base)
   ========================================================================== */
html {
  font-size: 100%;
}

body {
  margin: 0;
  padding: 0;
  line-height: 1.7;
  text-align: justify;
  word-wrap: break-word;
}

/* ==========================================================================
   2. 見出し (Headings)
   ========================================================================== */
h1 {
  font-family: sans-serif;
  font-size: 1.6em;
  font-weight: bold;
  text-align: center;
  margin: 3em 0 2em 0;
  padding-bottom: 0.5em;
  border-bottom: 2px solid #3498db;
  page-break-before: always;
}

h2 {
  font-family: sans-serif;
  font-size: 1.3em;
  font-weight: bold;
  color: #2980b9;
  margin: 2em 0 1em 0;
}

h3 {
  font-family: sans-serif;
  font-size: 1.1em;
  font-weight: bold;
  color: #34495e;
  margin: 1.5em 0 0.8em 0;
}

h4 {
  font-family: sans-serif;
  font-size: 1em;
  font-weight: bold;
  margin: 1.2em 0 0.3em 0;
}

/* ==========================================================================
   3. 本文・段落 (Paragraphs)
   ========================================================================== */
p {
  margin: 0;
  padding: 0;
  text-indent: 1em;
}

p.no-indent {
  text-indent: 0;
}

h1 + p, h2 + p, h3 + p, h4 + p {
  text-indent: 0;
}

a { color: #3498db; text-decoration: none; }

blockquote {
  margin: 1em 2em;
  padding: 0.8em 1em;
  background: #f7f9fa;
  border-left: 4px solid #3498db;
  color: #555;
}
blockquote p { margin: 0; text-indent: 0; }

/* ==========================================================================
   4. リスト (Lists)
   ========================================================================== */
ul, ol {
  margin: 1em 0 1em 2em;
}

li {
  margin: 0.5em 0;
}

/* ==========================================================================
   5. コード (Code Blocks)
   ========================================================================== */
/* インラインコード */
code {
  font-family: monospace;
  font-size: 0.9em;
  background: #e8f4f8;
  color: #c0392b;
  padding: 0.2em 0.4em;
}

/* コードブロック */
pre {
  font-family: monospace;
  font-size: 0.9em;
  display: block;
  background: #2c3e50;
  color: #ecf0f1;
  white-space: pre-wrap;
  padding: 1em;
  margin: 1em 0;
  border-radius: 4px;
}

/* コードブロック内のcode要素（リセット） */
pre code {
  font-size: inherit;
  background: none;
  color: inherit;
  padding: 0;
}

/* ==========================================================================
   6. テーブル (Tables)
   ========================================================================== */
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #bdc3c7; padding: 0.5em; text-align: left; }
th { background: #3498db; color: #fff; font-weight: bold; }
tr:nth-child(even) { background: #f7f9fa; }

img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
hr { border: none; height: 2px; background: #3498db; margin: 2em 0; }

.note { padding: 0.8em 2.5%; margin: 1em 0; background: #e8f4f8; border-left: 4px solid #3498db; }
.warning { padding: 0.8em 2.5%; margin: 1em 0; background: #fdf2e9; border-left: 4px solid #e67e22; }

/* Mermaid diagrams */
.mermaid {
  text-align: center;
  margin: 1.5em 0;
  page-break-inside: avoid;
}
.mermaid img {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  height: auto;
}

/* Colophon (奥付) */
.colophon { page-break-before: always; margin-top: 3em; }
.colophon h1 { text-align: center; }
.colophon hr { border: none; height: 2px; background: #3498db; margin: 1.5em 0; }
.colophon table { width: auto; margin: 1em auto; border: none; }
.colophon th, .colophon td { border: none; padding: 0.3em 1em; }
.colophon th { text-align: right; font-weight: normal; color: #7f8c8d; }
.colophon td { text-align: left; }

/* Chapter Title Page (章扉) */
.chapter-title-page {
  page-break-before: always;
  page-break-after: always;
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  padding: 2em;
}
.chapter-title-page h1 {
  font-size: 1em;
  font-weight: 300;
  color: #3498db;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 0.5em;
}
.chapter-title-page h2 {
  font-size: 2em;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2em;
}
.chapter-title-page blockquote {
  font-style: italic;
  border-left: none;
  padding: 0;
  margin: 2em auto;
  max-width: 80%;
  color: #7f8c8d;
}

/* Admonitions (補足欄) */
.admonition {
  margin: 1.5em 0;
  padding: 1em 1.5em;
  border-radius: 4px;
  border-left: 4px solid #3498db;
  background: #f8f9fa;
  page-break-inside: avoid;
}
.admonition-title {
  font-weight: 600;
  margin: 0 0 0.5em 0;
  color: #2c3e50;
}
.admonition-content { margin: 0; }
.admonition-content p { margin: 0.5em 0; }
.admonition-note { border-left-color: #3498db; background: #ebf5fb; }
.admonition-warning { border-left-color: #f39c12; background: #fef9e7; }
.admonition-tip { border-left-color: #27ae60; background: #eafaf1; }
.admonition-info { border-left-color: #17a2b8; background: #e8f6f8; }
.admonition-caution { border-left-color: #e74c3c; background: #fdedec; }
.admonition-important { border-left-color: #9b59b6; background: #f5eef8; }
`;

const technicalCss = `
/* Technical Theme - Kindle Optimized */
/* Reference: O'Reilly Media style */
@charset "UTF-8";

/* ==========================================================================
   1. 基本設定 (Reset & Base)
   ========================================================================== */
html {
  font-size: 100%;
}

body {
  margin: 0;
  padding: 0;
  line-height: 1.7;
  text-align: justify;
  word-wrap: break-word;
}

/* ==========================================================================
   2. 見出し (Headings)
   ========================================================================== */
h1 {
  font-family: sans-serif;
  font-size: 1.6em;
  font-weight: bold;
  text-align: center;
  margin: 3em 0 2em 0;
  page-break-before: always;
}

h2 {
  font-family: sans-serif;
  font-size: 1.3em;
  font-weight: bold;
  color: #333;
  margin: 2em 0 1em 0;
  padding-left: 0.5em;
  border-left: 0.3em solid #8e0012;
  border-bottom: 1px solid #ccc;
}

h3 {
  font-family: sans-serif;
  font-size: 1.1em;
  font-weight: bold;
  margin: 1.5em 0 0.8em 0;
}

h4 {
  font-family: sans-serif;
  font-size: 1em;
  font-weight: bold;
  background-color: #f0f0f0;
  margin: 1.2em 0 0.3em 0;
  padding: 0.3em 0.5em;
}

h5, h6 {
  font-family: sans-serif;
  font-size: 0.95em;
  font-weight: bold;
  color: #555;
  margin: 1em 0 0.3em 0;
}

/* ==========================================================================
   3. 本文・段落 (Paragraphs)
   ========================================================================== */
p {
  margin: 0;
  padding: 0;
  text-indent: 1em;
}

p.no-indent {
  text-indent: 0;
}

h1 + p, h2 + p, h3 + p, h4 + p {
  text-indent: 0;
}

a { color: #8e0012; text-decoration: none; }

blockquote {
  margin: 1em 2em;
  padding: 0.5em 1em;
  border: 1px solid #bebebe;
  color: #333;
  font-style: italic;
}

/* ==========================================================================
   4. リスト (Lists)
   ========================================================================== */
ul, ol {
  margin: 1em 0 1em 2em;
}

li {
  margin: 0.5em 0;
}

/* ==========================================================================
   5. コード (Code Blocks)
   ========================================================================== */
/* インラインコード */
code {
  font-family: monospace;
  font-size: 0.9em;
  background-color: #f0f0f0;
  padding: 0.1em 0.3em;
  color: #8e0012;
}

/* コードブロック */
pre {
  font-family: monospace;
  font-size: 0.9em;
  background-color: #f0f0f0;
  display: block;
  white-space: pre-wrap;
  padding: 1em;
  margin: 1em 0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* コードブロック内のcode要素（リセット） */
pre code {
  font-size: inherit;
  background: none;
  padding: 0;
  color: inherit;
}

/* Syntax highlighting colors */
.keyword { color: #006699; font-weight: bold; }
.string { color: #cc3300; }
.comment { color: #767676; }
.number { color: #aa0000; }
.function { color: #330099; font-weight: bold; }

/* ==========================================================================
   6. テーブル (Tables)
   ========================================================================== */
table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-size: 0.95em;
}

th, td {
  border-top: 1px solid #9d9d9d;
  border-bottom: 1px solid #9d9d9d;
  padding: 0.6em 1.5%;
  text-align: left;
  vertical-align: top;
}

th {
  font-family: sans-serif;
  font-weight: bold;
  background-color: #f1f6fc;
  border-bottom: 1px solid #9d9d9d;
}

tr:nth-child(even) td {
  background-color: #fafafa;
}

caption {
  font-style: italic;
  text-align: left;
  margin-bottom: 0.5em;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}

hr {
  border: none;
  border-top: 1px solid #333;
  margin: 2.5em 0 1em;
}

/* Note/Tip/Warning boxes */
.note, .tip {
  border: 1px solid #bebebe;
  margin: 1.5em 3.5%;
  padding: 0.5em 2%;
  font-size: 0.9em;
}

.warning {
  border: 1px solid #bc8f8f;
  margin: 1.5em 3.5%;
  padding: 0.5em 2%;
  font-size: 0.9em;
}

.note-title, .tip-title, .warning-title {
  font-family: sans-serif;
  font-weight: bold;
  color: #8e0012;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.3em;
}

/* Figure captions */
figcaption, .caption {
  font-style: italic;
  font-size: 0.9em;
  text-align: left;
  margin-top: 0.5em;
}

/* Footnotes */
.footnote {
  font-size: 0.85em;
  border-top: 1px solid #333;
  margin-top: 2em;
  padding-top: 0.5em;
}

.footnote-ref {
  font-family: sans-serif;
  font-size: 0.75em;
  color: #8e0012;
  vertical-align: super;
}

/* Keyboard shortcuts */
kbd {
  font-family: monospace;
  background: #f0f0f0;
  border: 1px solid #dcdcdc;
  padding: 0.1em 0.4em;
  font-size: 0.9em;
}

/* File paths and inline code emphasis */
.filename, .filepath {
  font-family: monospace;
  font-style: italic;
  color: #8e0012;
}

/* Mermaid diagrams */
.mermaid {
  text-align: center;
  margin: 1.5em 0;
  page-break-inside: avoid;
  background: #fafafa;
  padding: 1em;
  border: 1px solid #ddd;
}
.mermaid img {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  height: auto;
}

/* Colophon (奥付) */
.colophon { page-break-before: always; margin-top: 3em; }
.colophon h1 { text-align: center; font-family: sans-serif; }
.colophon hr { border: none; border-top: 1px solid #8e0012; margin: 1.5em 0; }
.colophon table { width: auto; margin: 1em auto; border: none; }
.colophon th, .colophon td { border: none; padding: 0.3em 1em; }
.colophon th { text-align: right; font-weight: normal; color: #666; }
.colophon td { text-align: left; }

/* Chapter Title Page (章扉) */
.chapter-title-page {
  page-break-before: always;
  page-break-after: always;
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  padding: 2em;
  background: #fafafa;
}
.chapter-title-page h1 {
  font-family: sans-serif;
  font-size: 1em;
  font-weight: normal;
  color: #8e0012;
  margin-bottom: 0.5em;
}
.chapter-title-page h2 {
  font-family: sans-serif;
  font-size: 1.6em;
  font-weight: bold;
  color: #000;
  margin-bottom: 2em;
}
.chapter-title-page blockquote {
  font-style: italic;
  border-left: none;
  padding: 0;
  margin: 2em auto;
  max-width: 80%;
  color: #666;
  background: none;
}

/* Admonitions (補足欄) - O'Reilly Style */
.admonition {
  margin: 1.5em 0;
  padding: 1em;
  border: 1px solid #ddd;
  background: #fafafa;
  page-break-inside: avoid;
}
.admonition-title {
  font-family: sans-serif;
  font-weight: bold;
  font-size: 0.9em;
  margin: 0 0 0.5em 0;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #ddd;
}
.admonition-content { margin: 0; font-size: 0.95em; }
.admonition-content p { margin: 0.5em 0; }
.admonition-note { border-color: #2196f3; }
.admonition-note .admonition-title { color: #1565c0; }
.admonition-warning { border-color: #ff9800; background: #fff8e1; }
.admonition-warning .admonition-title { color: #e65100; }
.admonition-tip { border-color: #4caf50; }
.admonition-tip .admonition-title { color: #2e7d32; }
.admonition-info { border-color: #00bcd4; }
.admonition-info .admonition-title { color: #00838f; }
.admonition-caution { border-color: #f44336; background: #ffebee; }
.admonition-caution .admonition-title { color: #c62828; }
.admonition-important { border-color: #8e0012; background: #fce4ec; }
.admonition-important .admonition-title { color: #8e0012; }
`;

const novelCss = `
/* Novel Theme - Kindle Optimized */
@charset "UTF-8";

/* ==========================================================================
   1. 基本設定 (Reset & Base)
   ========================================================================== */
html {
  font-size: 100%;
}

body {
  margin: 0;
  padding: 0;
  line-height: 1.7;
  text-align: justify;
  word-wrap: break-word;
}

/* ==========================================================================
   2. 見出し (Headings)
   ========================================================================== */
h1 {
  font-size: 1.6em;
  font-weight: bold;
  text-align: center;
  margin: 3em 0 2em 0;
  page-break-before: always;
}

h2 {
  font-size: 1.3em;
  font-weight: bold;
  margin: 2em 0 1em 0;
  padding-left: 0.5em;
  border-left: 4px solid #8b4513;
}

h3 {
  font-size: 1.1em;
  font-weight: bold;
  margin: 1.5em 0 0.8em 0;
}

h4 {
  font-size: 1em;
  font-weight: bold;
  margin: 1.2em 0 0.3em 0;
}

/* ==========================================================================
   3. 本文・段落 (Paragraphs)
   ========================================================================== */
p {
  margin: 0;
  padding: 0;
  text-indent: 1em;
}

p.no-indent {
  text-indent: 0;
}

h1 + p, h2 + p, h3 + p, h4 + p {
  text-indent: 0;
}

p.scene-break { text-indent: 0; text-align: center; margin: 1.5em 0; }

a { color: #8b4513; text-decoration: none; }

blockquote { margin: 1em 2em; padding: 0; font-style: italic; color: #555; }

/* ==========================================================================
   4. リスト (Lists)
   ========================================================================== */
ul, ol {
  margin: 1em 0 1em 2em;
}

li {
  margin: 0.5em 0;
}

/* ==========================================================================
   5. コード (Code Blocks)
   ========================================================================== */
/* インラインコード */
code {
  font-family: monospace;
  font-size: 0.9em;
  background-color: #f5f5f0;
  padding: 0.1em 0.3em;
}

/* コードブロック */
pre {
  font-family: monospace;
  font-size: 0.9em;
  background-color: #f5f5f0;
  display: block;
  white-space: pre-wrap;
  padding: 1em;
  margin: 1em 0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* コードブロック内のcode要素（リセット） */
pre code {
  font-size: inherit;
  background: none;
  padding: 0;
}

/* ==========================================================================
   6. 画像・その他 (Images & Misc)
   ========================================================================== */
img { max-width: 100%; height: auto; display: block; margin: 1.5em auto; }

hr { border: none; text-align: center; margin: 1.5em 0; }
hr::before { content: "* * *"; color: #999; letter-spacing: 0.5em; }

.chapter-opening { margin-top: 3em; margin-bottom: 2em; text-align: center; }
.chapter-number { font-size: 0.9em; color: #666; letter-spacing: 0.3em; }
.author-note { font-size: 0.9em; color: #666; border-top: 1px solid #ccc; margin-top: 2em; padding-top: 0.8em; }

/* Mermaid diagrams */
.mermaid {
  text-align: center;
  margin: 1.5em 0;
  page-break-inside: avoid;
}
.mermaid img {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  height: auto;
}

/* Colophon (奥付) */
.colophon { page-break-before: always; margin-top: 3em; text-indent: 0; }
.colophon h1 { text-align: center; }
.colophon hr { border: none; text-align: center; margin: 1.5em 0; }
.colophon hr::before { content: "* * *"; color: #999; letter-spacing: 0.5em; }
.colophon table { width: auto; margin: 1em auto; border: none; }
.colophon th, .colophon td { border: none; padding: 0.3em 1em; text-indent: 0; }
.colophon th { text-align: right; font-weight: normal; color: #666; }
.colophon td { text-align: left; }

/* Chapter Title Page (章扉) */
.chapter-title-page {
  page-break-before: always;
  page-break-after: always;
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  text-indent: 0;
  padding: 2em;
}
.chapter-title-page h1 {
  font-size: 1.1em;
  font-weight: normal;
  color: #666;
  margin-bottom: 0.5em;
}
.chapter-title-page h2 {
  font-size: 1.6em;
  font-weight: bold;
  margin-bottom: 2em;
}
.chapter-title-page blockquote {
  font-style: italic;
  border-left: none;
  padding: 0;
  margin: 2em auto;
  max-width: 80%;
  color: #666;
  text-indent: 0;
}

/* Admonitions (補足欄) */
.admonition {
  margin: 1.5em 0;
  padding: 1em;
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  text-indent: 0;
  page-break-inside: avoid;
}
.admonition-title {
  font-weight: bold;
  margin: 0 0 0.5em 0;
  text-indent: 0;
}
.admonition-content { margin: 0; text-indent: 0; }
.admonition-content p { margin: 0.5em 0; text-indent: 0; }
.admonition-note .admonition-title { color: #333; }
.admonition-warning .admonition-title { color: #8b4513; }
.admonition-tip .admonition-title { color: #2e8b57; }
.admonition-info .admonition-title { color: #4682b4; }
.admonition-caution .admonition-title { color: #cd5c5c; }
.admonition-important .admonition-title { color: #800080; }
`;

const academicCss = `
/* Academic Theme - Kindle Optimized */
@charset "UTF-8";

/* ==========================================================================
   1. 基本設定 (Reset & Base)
   ========================================================================== */
html {
  font-size: 100%;
}

body {
  margin: 0;
  padding: 0;
  line-height: 1.7;
  text-align: justify;
  word-wrap: break-word;
}

/* ==========================================================================
   2. 見出し (Headings)
   ========================================================================== */
h1 {
  font-size: 1.6em;
  font-weight: bold;
  text-align: center;
  margin: 3em 0 2em 0;
  page-break-before: always;
}

h2 {
  font-size: 1.3em;
  font-weight: bold;
  margin: 2em 0 1em 0;
}

h3 {
  font-size: 1.1em;
  font-weight: bold;
  font-style: italic;
  margin: 1.5em 0 0.8em 0;
}

h4 {
  font-size: 1em;
  font-weight: bold;
  font-style: italic;
  margin: 1.2em 0 0.3em 0;
}

/* ==========================================================================
   3. 本文・段落 (Paragraphs)
   ========================================================================== */
p {
  margin: 0;
  padding: 0;
  text-indent: 1em;
}

p.no-indent {
  text-indent: 0;
}

h1 + p, h2 + p, h3 + p, h4 + p {
  text-indent: 0;
}

a { color: #000; text-decoration: underline; }

.abstract { margin: 1.5em 2em; font-size: 0.95em; }
.abstract-title { font-weight: bold; text-align: center; margin-bottom: 0.5em; }

blockquote { margin: 1em 2em; padding: 0; font-size: 0.95em; }
blockquote p { margin: 0 0 0.5em 0; text-indent: 0; }

.footnotes { margin-top: 1.5em; padding-top: 0.8em; border-top: 1px solid #000; font-size: 0.85em; }
.footnote { margin-bottom: 0; margin-top: 0.3em; }
.footnote-ref { font-size: 0.75em; vertical-align: super; }

/* ==========================================================================
   4. リスト (Lists)
   ========================================================================== */
ul, ol {
  margin: 1em 0 1em 2em;
}

li {
  margin: 0.5em 0;
}

/* ==========================================================================
   5. コード (Code Blocks)
   ========================================================================== */
/* インラインコード */
code {
  font-family: monospace;
  font-size: 0.9em;
  background-color: #f5f5f5;
  padding: 0.1em 0.3em;
}

/* コードブロック */
pre {
  font-family: monospace;
  font-size: 0.9em;
  background-color: #f5f5f5;
  display: block;
  white-space: pre-wrap;
  padding: 1em;
  margin: 1em 0;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* コードブロック内のcode要素（リセット） */
pre code {
  font-size: inherit;
  background: none;
  padding: 0;
}

/* ==========================================================================
   6. テーブル (Tables)
   ========================================================================== */
table { border-collapse: collapse; width: 100%; margin: 1.5em 0; font-size: 0.95em; }
caption { font-weight: bold; margin-bottom: 0.5em; text-align: left; }
th, td { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 0.5em; text-align: left; }
th { font-weight: bold; border-bottom: 2px solid #000; }

/* ==========================================================================
   7. 画像・その他 (Images & Misc)
   ========================================================================== */
figure { margin: 1.5em 0; text-align: center; }
figcaption { font-size: 0.9em; margin-top: 0.5em; font-style: italic; }

img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
hr { border: none; border-top: 1px solid #000; margin: 1.5em 0; }

.bibliography { margin-top: 1.5em; }
.bib-entry { margin-bottom: 0; margin-top: 0.5em; padding-left: 2em; text-indent: -2em; }
.keywords { margin: 1em 0; font-size: 0.95em; }
.keywords-label { font-weight: bold; }

/* Mermaid diagrams */
.mermaid {
  text-align: center;
  margin: 1.5em 0;
  page-break-inside: avoid;
}
.mermaid img {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  height: auto;
}

/* Colophon (奥付) */
.colophon { page-break-before: always; margin-top: 3em; }
.colophon h1 { text-align: center; }
.colophon hr { border: none; border-top: 1px solid #000; margin: 1.5em 0; }
.colophon table { width: auto; margin: 1em auto; border: none; }
.colophon th, .colophon td { border: none; padding: 0.3em 1em; }
.colophon th { text-align: right; font-weight: normal; }
.colophon td { text-align: left; }

/* Chapter Title Page (章扉) */
.chapter-title-page {
  page-break-before: always;
  page-break-after: always;
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  padding: 2em;
}
.chapter-title-page h1 {
  font-size: 1em;
  font-weight: normal;
  margin-bottom: 0.5em;
}
.chapter-title-page h2 {
  font-size: 1.4em;
  font-weight: bold;
  margin-bottom: 2em;
}
.chapter-title-page blockquote {
  font-style: italic;
  border-left: none;
  padding: 0;
  margin: 2em auto;
  max-width: 80%;
}

/* Admonitions (補足欄) */
.admonition {
  margin: 1.5em 0;
  padding: 1em;
  border: 1px solid #000;
  page-break-inside: avoid;
}
.admonition-title {
  font-weight: bold;
  font-variant: small-caps;
  margin: 0 0 0.5em 0;
}
.admonition-content { margin: 0; }
.admonition-content p { margin: 0.5em 0; }
.admonition-note { border-width: 1px; }
.admonition-warning { border-width: 2px; }
.admonition-tip { border-style: dashed; }
.admonition-info { border-style: dotted; }
.admonition-caution { border-width: 2px; border-style: double; }
.admonition-important { border-width: 3px; }
`;

export const PRESET_THEMES: EpubTheme[] = [
  { id: 'classic', name: 'Classic', description: 'Traditional serif design for literature and general books', css: classicCss.trim() },
  { id: 'modern', name: 'Modern', description: 'Clean sans-serif design for business books', css: modernCss.trim() },
  { id: 'technical', name: 'Technical', description: 'O\'Reilly style for technical documentation', css: technicalCss.trim() },
  { id: 'novel', name: 'Novel', description: 'Reading-optimized design for fiction', css: novelCss.trim() },
  { id: 'academic', name: 'Academic', description: 'Scholarly design for academic works', css: academicCss.trim() },
];

export function getThemeById(id: ThemeId): EpubTheme | undefined {
  return PRESET_THEMES.find(theme => theme.id === id);
}

export function getThemeCss(id: ThemeId): string {
  const theme = getThemeById(id);
  return theme?.css || PRESET_THEMES[0].css;
}

export const DEFAULT_THEME_ID: ThemeId = 'classic';
