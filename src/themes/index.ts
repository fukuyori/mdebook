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
/* Classic Theme - Kindle Compliant */
@charset "UTF-8";

body {
  font-family: Georgia, "Times New Roman", serif;
  color: #333;
  background: #fff;
  margin: 0;
  padding: 0;
}

h1, h2, h3, h4, h5, h6 {
  font-family: Georgia, "Times New Roman", serif;
  font-weight: bold;
  color: #222;
  line-height: 1;
}

h1 {
  font-size: 1.2em;
  text-align: center;
  margin-top: 1.5em;
  margin-bottom: 1em;
  border-bottom: 1px solid #333;
  padding-bottom: 0.3em;
}

h2 {
  font-size: 1.15em;
  text-align: left;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  border-bottom: 1px solid #999;
  padding-bottom: 0.2em;
}

h3 {
  font-size: 1.05em;
  text-align: left;
  margin-top: 1.2em;
  margin-bottom: 0.4em;
}

h4 {
  font-size: 1em;
  text-align: left;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.3em;
}

p {
  margin-bottom: 0;
  margin-top: 0;
  text-indent: 1em;
}

p:first-of-type,
h1 + p, h2 + p, h3 + p, h4 + p {
  text-indent: 0;
}

a { color: #06c; text-decoration: none; }

blockquote {
  margin: 1em 5%;
  padding: 0.5em 2.5%;
  border-left: 3px solid #ccc;
  color: #555;
  font-style: italic;
}

pre, code {
  font-family: "Courier New", Courier, monospace;
  font-size: 0.85em;
}

pre {
  background: #f8f8f8;
  padding: 1em;
  border: 1px solid #ddd;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

code { background: #f0f0f0; padding: 0.1em 0.3em; }
pre code { background: none; padding: 0; }

ul, ol { margin: 0.5em 0 0.5em 5%; padding: 0; }
li { margin-bottom: 0; margin-top: 0; }

table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #999; padding: 0.5em; text-align: left; }
th { background: #f0f0f0; font-weight: bold; }

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
/* Modern Theme - Kindle Compliant */
@charset "UTF-8";

body {
  font-family: "Helvetica Neue", Arial, sans-serif;
  color: #2c3e50;
  background: #fff;
  margin: 0;
  padding: 0;
}

h1, h2, h3, h4, h5, h6 {
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-weight: bold;
  color: #1a252f;
  line-height: 1;
}

h1 {
  font-size: 1.2em;
  text-align: center;
  margin-top: 1.5em;
  margin-bottom: 1em;
  padding-bottom: 0.5em;
  border-bottom: 2px solid #3498db;
}

h2 {
  font-size: 1.15em;
  text-align: left;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: #2980b9;
}

h3 {
  font-size: 1.05em;
  text-align: left;
  margin-top: 1.2em;
  margin-bottom: 0.4em;
  color: #34495e;
}

h4 {
  font-size: 1em;
  text-align: left;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.3em;
}

p { margin-bottom: 0; margin-top: 0.8em; }
a { color: #3498db; text-decoration: none; }

blockquote {
  margin: 1em 5%;
  padding: 0.8em 2.5%;
  background: #f7f9fa;
  border-left: 4px solid #3498db;
  color: #555;
}
blockquote p { margin: 0; }

pre, code { font-family: "SF Mono", Consolas, monospace; font-size: 0.85em; }
pre {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 1em;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}
code { background: #e8f4f8; color: #c0392b; padding: 0.2em 0.4em; }
pre code { background: none; color: inherit; padding: 0; }

ul, ol { margin: 0.8em 0 0.8em 5%; padding: 0; }
li { margin-bottom: 0.3em; margin-top: 0; }

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
/* Technical Theme - Kindle Compliant */
/* Reference: O'Reilly Media style */
@charset "UTF-8";

body {
  font-family: "Noto Serif", Georgia, serif;
  color: #000;
  background: #fff;
  margin: 0;
  padding: 0;
  text-align: left;
}

/* Chapter heading - large with bottom border */
h1 {
  font-family: sans-serif;
  font-size: 1.3em;
  font-weight: bold;
  line-height: 1;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #333;
  text-align: left;
}

/* Section heading - dark red accent */
h2 {
  font-family: sans-serif;
  font-size: 1.2em;
  font-weight: bold;
  line-height: 1;
  color: #8e0012;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  text-align: left;
}

/* Subsection heading */
h3 {
  font-family: sans-serif;
  font-size: 1.1em;
  font-weight: bold;
  line-height: 1;
  margin-top: 1.3em;
  margin-bottom: 0.4em;
  text-align: left;
}

/* Item heading - gray background */
h4 {
  font-family: sans-serif;
  font-size: 1em;
  font-weight: bold;
  line-height: 1;
  background-color: #f0f0f0;
  margin-top: 1.2em;
  margin-bottom: 0.3em;
  padding: 0.3em 1%;
  text-align: left;
}

h5, h6 {
  font-family: sans-serif;
  font-size: 0.95em;
  font-weight: bold;
  color: #555;
  margin-top: 1em;
  margin-bottom: 0.3em;
  text-align: left;
}

/* Body text */
p {
  margin-bottom: 0;
  margin-top: 0.65em;
  margin-left: 5%;
}

h1 + p, h2 + p, h3 + p, h4 + p {
  margin-top: 0.5em;
}

a { color: #8e0012; text-decoration: none; }

blockquote {
  margin: 1em 5%;
  padding: 0.5em 2.5%;
  border: 1px solid #bebebe;
  color: #333;
  font-style: italic;
}

/* Code blocks - light gray background */
pre, code {
  font-family: "Ubuntu Mono", "Consolas", "Liberation Mono", monospace;
  font-size: 0.85em;
}

pre {
  background-color: #f7f7f7;
  border: 1px solid #dcdcdc;
  padding: 0.7em 2%;
  margin: 1em 3.5%;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

code {
  background: #f7f7f7;
  padding: 0.1em 0.3em;
  color: #8e0012;
}

pre code {
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

/* Lists */
ul, ol {
  margin: 0.7em 0 0.7em 9%;
  padding: 0;
}

li {
  margin-bottom: 0.3em;
  margin-top: 0;
}

li > ul, li > ol {
  margin: 0.3em 0 0.3em 5%;
}

/* Tables - academic style with top/bottom borders */
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
.colophon h1 { text-align: center; font-family: "Noto Sans", sans-serif; }
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
  font-family: "Noto Sans", sans-serif;
  font-size: 1em;
  font-weight: normal;
  color: #8e0012;
  margin-bottom: 0.5em;
}
.chapter-title-page h2 {
  font-family: "Noto Sans", sans-serif;
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
  font-family: "Noto Sans", sans-serif;
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
/* Novel Theme - Kindle Compliant */
@charset "UTF-8";

body {
  font-family: "Yu Mincho", Georgia, serif;
  color: #333;
  background: #fff;
  margin: 0;
  padding: 0;
  text-align: left;
  text-indent: 1em;
}

h1, h2, h3, h4, h5, h6 {
  font-family: "Yu Mincho", Georgia, serif;
  font-weight: bold;
  color: #222;
  line-height: 1;
}

h1 {
  font-size: 1.2em;
  text-align: center;
  margin-top: 2em;
  margin-bottom: 1.5em;
}

h2 {
  font-size: 1.1em;
  text-align: left;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  padding-left: 0.5em;
  border-left: 4px solid #8b4513;
}

h3 {
  font-size: 1.05em;
  text-align: left;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
}

h4 {
  font-size: 1em;
  text-align: left;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.3em;
}

p { margin-bottom: 0; margin-top: 0; text-indent: 1em; }
h1 + p, h2 + p, h3 + p, h4 + p { text-indent: 0; }
p.no-indent { text-indent: 0; }
p.scene-break { text-indent: 0; text-align: center; margin: 1.5em 0; }

a { color: #8b4513; text-decoration: none; }

blockquote { margin: 1em 5%; padding: 0; font-style: italic; color: #555; }

pre, code { font-family: "Source Code Pro", monospace; font-size: 0.85em; }
pre {
  background: #f5f5f0;
  padding: 1em;
  border: 1px solid #ddd;
  overflow-x: auto;
  white-space: pre-wrap;
}

ul, ol { margin: 0.8em 0 0.8em 5%; }
li { margin-bottom: 0.3em; margin-top: 0; }

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
/* Academic Theme - Kindle Compliant */
@charset "UTF-8";

body {
  font-family: "Times New Roman", Times, serif;
  color: #000;
  background: #fff;
  margin: 0;
  padding: 0;
}

h1, h2, h3, h4, h5, h6 {
  font-family: "Times New Roman", Times, serif;
  font-weight: bold;
  color: #000;
  line-height: 1;
}

h1 { font-size: 1.2em; text-align: center; margin-top: 1.5em; margin-bottom: 1em; }
h2 { font-size: 1.1em; text-align: left; margin-top: 1.5em; margin-bottom: 0.5em; }
h3 { font-size: 1.05em; text-align: left; font-style: italic; margin-top: 1.2em; margin-bottom: 0.4em; }
h4 { font-size: 1em; text-align: left; font-style: italic; margin-top: 1em; margin-bottom: 0.3em; }

p { margin-bottom: 0; margin-top: 0.8em; text-align: justify; }
a { color: #000; text-decoration: underline; }

.abstract { margin: 1.5em 5%; font-size: 0.95em; }
.abstract-title { font-weight: bold; text-align: center; margin-bottom: 0.5em; }

blockquote { margin: 1em 5%; padding: 0; font-size: 0.95em; }
blockquote p { margin: 0 0 0.5em 0; }

.footnotes { margin-top: 1.5em; padding-top: 0.8em; border-top: 1px solid #000; font-size: 0.85em; }
.footnote { margin-bottom: 0; margin-top: 0.3em; }
.footnote-ref { font-size: 0.75em; vertical-align: super; }

pre, code { font-family: "Courier New", Courier, monospace; font-size: 0.85em; }
pre { background: #f5f5f5; padding: 1em; border: 1px solid #ccc; margin: 1em 0; overflow-x: auto; white-space: pre-wrap; }
code { background: #f5f5f5; padding: 0.1em 0.3em; }
pre code { background: none; padding: 0; }

ul, ol { margin: 0.8em 0 0.8em 5%; }
li { margin-bottom: 0.2em; margin-top: 0; }

table { border-collapse: collapse; width: 100%; margin: 1.5em 0; font-size: 0.95em; }
caption { font-weight: bold; margin-bottom: 0.5em; text-align: left; }
th, td { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 0.5em; text-align: left; }
th { font-weight: bold; border-bottom: 2px solid #000; }

figure { margin: 1.5em 0; text-align: center; }
figcaption { font-size: 0.9em; margin-top: 0.5em; font-style: italic; }

img { max-width: 100%; height: auto; }
hr { border: none; border-top: 1px solid #000; margin: 1.5em 0; }

.bibliography { margin-top: 1.5em; }
.bib-entry { margin-bottom: 0; margin-top: 0.5em; padding-left: 5%; text-indent: -5%; }
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
