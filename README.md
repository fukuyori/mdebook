# MDebook

A browser-based Markdown eBook editor with VIM keybindings, multi-language support, and export to EPUB/PDF/HTML/Markdown.

**Version: 0.8.1**

**[🇯🇵 日本語版はこちら](README.ja.md)**

## ✨ Features

### Editor
- **VIM Keybindings** - Full VIM mode with `:w`, `:q`, `:e` commands
- **CodeMirror 6** - Modern editor with syntax highlighting
- **Live Preview** - Real-time Markdown preview with bidirectional scroll sync
- **Multi-file Support** - Manage multiple chapters with drag-and-drop reordering

### Import & Export
- **Export Formats**: EPUB, PDF (pdfmake), HTML, Markdown (ZIP)
- **Import**: Local files, URLs (Qiita, GitHub auto-conversion)
- **Project Format**: `.mdebook` (ZIP-based) for saving/loading projects with images

### PDF Export (New in v0.8.1)
- **Japanese Font Support** - Upload custom TTF/OTF fonts (stored in IndexedDB)
- **Table of Contents** - Auto-generated with internal links
- **Page Numbers** - Header with title, footer with page numbers
- **Theme CSS Support** - Line height, letter spacing from EPUB theme
- **Tables, Links, Formatting** - Full Markdown support
- **Chapter Title Pages** - Combined TOC entry (e.g., "Chapter 1 Introduction")
- **Colophon** - Special formatting for publication info
- **Emoji Handling** - Auto-removed in PDF (preserved in EPUB/HTML)

### EPUB Themes
- **5 Preset Themes**: Classic, Modern, Technical, Novel, Academic
- **Custom CSS Import**: Use your own CSS for EPUB styling
- **CSS Export**: Export any theme CSS for customization
- **Kindle-optimized**: All themes follow Amazon Kindle Publishing Guidelines 2025

### Book Structure Templates
- **Colophon (奥付)**: Auto-placed at end, publication info template
- **Preface (はじめに)**: Auto-placed at beginning
- **Chapter Title Page (章扉)**: Decorative chapter openers with epigraphs
- **Bibliography (参考文献)**: Citation format templates

### Admonitions (Callout Blocks)
```markdown
:::note
This is a note.
:::

:::warning Warning Title
This is a warning message.
:::
```
Supported types: `note`, `warning`, `tip`, `info`, `caution`, `important`

### Markdown Features
- Tables (GFM)
- Code blocks with syntax highlighting
- Mermaid diagrams (PNG conversion for EPUB)
- Footnotes
- Image embedding (paste, drag-drop, file picker)
- **Image/Mermaid Size Attributes**: `{width=50% align=center}` syntax

### User Experience
- **5 Languages**: English, 日本語, 简体中文, Español, 한국어
- **Dark/Light Theme**
- **Auto-save** with IndexedDB session management
- **Keyboard Shortcuts**: `Ctrl+\`` for VIM toggle

## 🚀 Quick Start

### Online Demo

Try MDebook instantly in your browser:

**👉 [Launch MDebook](https://fukuyori.github.io/mdebook/dist/mdebook.html)**

No installation required - just open and start writing!

### Build from Source

```bash
# Clone repository
git clone https://github.com/fukuyori/mdebook.git
cd mdebook

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Generate standalone HTML
node build-html.cjs
```

## 📖 Documentation

- [Tutorial (English)](docs/tutorial.md)
- [チュートリアル (日本語)](docs/tutorial.ja.md)

## 📄 PDF Export

### Japanese Font Setup

1. Download fonts from [Google Fonts - Noto Sans JP](https://fonts.google.com/noto/specimen/Noto+Sans+JP)
2. Open Settings (gear icon)
3. Scroll to "PDF Font Settings"
4. Upload Regular font (required) and Bold font (optional)
5. Fonts are stored in IndexedDB (persists across sessions)

### PDF Features

| Feature | Support |
|---------|---------|
| Headings (h1-h4) | ✅ Styled with TOC links |
| Tables | ✅ With borders and header styling |
| Code blocks | ✅ Monospace with background |
| Lists (ul/ol) | ✅ Nested supported |
| Links | ✅ Clickable with underline |
| Bold/Italic | ✅ Inline formatting |
| Blockquotes | ✅ Indented with styling |
| Horizontal rules | ✅ Gray line |
| Chapter title pages | ✅ Combined TOC entry |
| Colophon | ✅ Excluded from TOC |
| Emojis | ⚠️ Auto-removed (font limitation) |
| Images | ❌ Not supported |
| Mermaid | ❌ Not supported |

### TOC Depth Setting

The TOC Depth setting affects both EPUB and PDF:
- **0**: No table of contents
- **1**: H1 only
- **2**: H1 + H2 (default)
- **3**: H1 + H2 + H3

## 🎨 EPUB Themes

### Preset Themes

| Theme | Description | Best For |
|-------|-------------|----------|
| **Classic** | Traditional serif design | Literature, general books |
| **Modern** | Clean sans-serif with blue accents | Business books |
| **Technical** | O'Reilly-style with dark red headings | Technical documentation |
| **Novel** | Reading-optimized with scene breaks | Fiction |
| **Academic** | Scholarly style with justified text | Academic papers |

### Kindle-Optimized CSS

All themes are optimized for Kindle devices:

```css
/* Base settings */
html { font-size: 100%; }
body {
  margin: 0;
  padding: 0;
  line-height: 1.7;           /* Readable line spacing */
  text-align: justify;         /* Standard e-book alignment */
  word-wrap: break-word;       /* Prevent long word overflow */
}

/* Headings */
h1 { font-size: 1.6em; page-break-before: always; }
h2 { font-size: 1.3em; }
h3 { font-size: 1.1em; }

/* Code - separated to prevent font-size accumulation */
code { font-size: 0.9em; }
pre { font-size: 0.9em; }
pre code { font-size: inherit; }  /* Reset nested code */
```

### Custom CSS

1. Click **↓ CSS** to export a theme as starting point
2. Edit the CSS file to customize styles
3. Click **↑ CSS** to import your custom CSS
4. Theme automatically switches to "Custom"

## 📑 Book Structure

### Template Menu

Click "Add Template" to insert pre-formatted templates:

| Template | File Name | Position |
|----------|-----------|----------|
| 📋 Colophon | `colophon.md` / `奥付.md` | End (auto) |
| 📖 Preface | `preface.md` / `はじめに.md` | Beginning (auto) |
| 📑 Chapter Title | `章扉N.md` | After current tab |
| 📚 Bibliography | `bibliography.md` / `参考文献.md` | Before colophon (auto) |

### Chapter Title Pages

Chapter title pages are automatically detected and formatted:
- In TOC: Combined as "第1章 章タイトル" format
- In PDF: Centered title with optional epigraph

Detection patterns:
- `<div class="chapter-title-page">` wrapper
- Or `# 第N章` followed by `## Subtitle`

### EPUB File Order
Files are automatically sorted for EPUB export:
1. Preface/Introduction
2. Regular chapters (original order)
3. Bibliography/References
4. Colophon

## 🎮 VIM Commands

| Command | Description |
|---------|-------------|
| `i`, `a`, `o` | Enter INSERT mode |
| `Esc` | Return to NORMAL mode |
| `v`, `V` | VISUAL mode |
| `hjkl` | Cursor movement |
| `y`, `yy` | Yank (copy) |
| `d`, `dd` | Delete (cut) |
| `p`, `P` | Paste |
| `"*y` | Copy to system clipboard |
| `"*p` | Paste from system clipboard |
| `"+y` | Copy to system clipboard (alias) |
| `"+p` | Paste from system clipboard (alias) |
| `:w` | Save (overwrite if file handle exists) |
| `:w!` | Save with dialog |
| `:w filename` | Save as filename |
| `:e filename` | Open/create file |
| `:q` | Close current file |
| `:wq` | Save and close |
| `:imp` | Open import dialog |
| `:imp URL` | Import from URL |

## 📁 Project Structure

```
mdebook/
├── src/
│   ├── components/     # React components
│   ├── utils/          # Utility functions
│   │   ├── export.ts   # EPUB/HTML export
│   │   ├── pdf-export.ts # PDF export (pdfmake)
│   │   └── storage.ts  # IndexedDB operations
│   ├── i18n/           # Translations
│   ├── types/          # TypeScript types
│   ├── hooks/          # React hooks
│   ├── themes/         # EPUB theme definitions
│   └── constants/      # Constants
├── dist/               # Build output
└── docs/               # Documentation
```

## 🔧 Technology Stack

- **Frontend**: React 18, TypeScript
- **Editor**: CodeMirror 6 with @replit/codemirror-vim
- **Styling**: Tailwind CSS
- **Build**: Vite
- **Export**: JSZip, FileSaver.js, Mermaid, pdfmake

## 📦 Export Formats

### EPUB
Standard eBook format compatible with most e-readers. Supports cover image, custom themes, and Mermaid diagram conversion.

### PDF
Native PDF generation with pdfmake. Supports Japanese fonts, tables, code blocks, and auto-generated TOC.

### HTML
Standalone HTML file with embedded styles.

### Markdown (ZIP)
```
book-markdown.zip
├── metadata.json
├── chapters/
│   ├── chapter1.md
│   └── chapter2.md
└── images/
    └── image1.png
```

### .mdebook Project Format
```
project.mdebook (ZIP)
├── manifest.json
├── chapters/
│   ├── chapter1.md      # With .md extension
│   └── chapter2.md
└── images/
    └── cover.png
```

📄 **[File Format Specification](docs/FILE_FORMAT.md)** - Detailed technical documentation

## 🌐 Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome/Edge | ✅ Full support (File System Access API) |
| Firefox | ✅ Supported (fallback file handling) |
| Safari | ✅ Supported (fallback file handling) |

**Note**: IndexedDB (for font storage) may be restricted in `file://` protocol on some browsers. Use a local server or Chrome for best results.

## 📝 Changelog

### v0.6.0
- **EPUB Embedded Images**:
  - Project images referenced from Markdown are included inside the EPUB file
  - External `https://...` and `data:image/...` images are embedded when the browser can fetch them
  - EPUB image references and manifest entries are generated for bundled images
- **Dependency Security Updates**:
  - Updated Vite, Vitest, React plugin, and TypeScript ESLint dependencies
  - `npm audit` reports 0 vulnerabilities

### v0.5.5
- **Image & Mermaid Size Attributes**:
  - Specify image size with attribute syntax: `![alt](image.png){width=50%}`
  - Size attributes for Mermaid diagrams: `` ```mermaid {width=70% align=center} ``
  - Supported attributes: `width`, `height`, `max-width`, `max-height`, `align`
  - Applied in preview, EPUB, and HTML export
- **Auto Encoding Detection**:
  - Automatically detects Shift_JIS, EUC-JP, ISO-2022-JP (JIS) files
  - Import non-UTF-8 text files without character corruption
  - Normalizes line endings to LF
- **VIM System Clipboard Support**:
  - `"*y` / `"*yy` - Copy to system clipboard
  - `"*p` / `"*P` - Paste from system clipboard
  - `"+` register also supported

### v0.5.2
- **Ruby (Furigana) Support**:
  - Aozora Bunko format: `｜漢字《かんじ》` or `漢字《かんじ》`
  - Preview: Displays as HTML ruby tags
  - EPUB: Full ruby support with `<ruby>` tags
  - PDF: Falls back to parentheses format `漢字(かんじ)`
- **VIM Marks Persistence**:
  - Local marks (a-z) are now preserved when switching between files
  - Use `ma` to set mark, `` `a `` or `'a` to jump back
  - `:marks` to view all marks in current file
- **UI Improvements**:
  - `:` key on file tab list now enters VIM command mode (focuses editor)
  - New files are now created empty (no placeholder text)

### v0.5.1
- **VIM Mode IME Enhancement**:
  - Support IME input for `f`/`F`/`t`/`T` character search commands
  - Support IME input for `r` single character replace
  - Support IME input in `/` and `?` search commands
  - Support IME input in `:s/pattern/replacement/` substitute command
  - Block IME input in normal/visual mode (prevents accidental input)
- **VIM Mode Page Scroll Fix**:
  - `Ctrl+f`/`Ctrl+b` now scroll screen while maintaining cursor's relative position
  - Proper VIM-like behavior with 2-line overlap for context

### v0.5.0
- **VIM :e Command Enhancement**:
  - `:e filename` - Clear project and create new file with specified name
  - `:e! filename` - Same as `:e` (force create)
  - `:e` (no argument) - Open file dialog (existing behavior)
- **mdvim Format Support**:
  - Import `.mdvim` files (drag & drop, file picker, or Open dialog)
  - Support both ZIP archive and plain text Markdown formats
  - Export current file as `.mdvim` format
  - Automatic image extraction and embedding
  - Metadata preservation (title, author, language)
  - Duplicate file/image name handling (adds suffix like "filename (1)")

### v0.4.6
- **Documentation**:
  - Added file format specification (FILE_FORMAT.md)

### v0.4.5
- **VIM Mode Stability Fix**:
  - Fixed input issues in INSERT mode caused by editor recreation on theme/font changes
  - Implemented Compartment-based dynamic reconfiguration for theme and font size
  - VIM state (mode, command buffer) now preserved during theme switching
  - Improved VIM listener setup with retry logic
- **PDF Export Enhancement**:
  - Blockquotes now preserve line breaks (each `>` line on separate line)
  - Chapter title epigraphs display with proper line breaks

### v0.4.4
- **PDF Export Enhancement**:
  - Full pdfmake integration with Japanese font support
  - Upload custom TTF/OTF fonts (stored in IndexedDB)
  - Table support with borders and header styling
  - Links, italic, horizontal rules support
  - Code blocks with background color and monospace font
  - Theme CSS reflected (line height, letter spacing, text alignment)
  - Auto emoji removal (fonts don't support emojis)
  - Chapter title pages: Combined TOC entry (e.g., "第1章 章タイトル")
  - Colophon: Special formatting, excluded from TOC
- **EPUB Enhancement**:
  - Chapter title pages: Combined TOC entry
  - Code block headings excluded from TOC
- **Project Format**:
  - Markdown files saved with `.md` extension in `.mdebook`
  - Tab display without extension

### v0.4.3
- **Kindle-optimized CSS**: All 5 themes rewritten following Kindle Publishing Guidelines 2025
  - `html { font-size: 100%; }` for respecting user font settings
  - `body { line-height: 1.7; text-align: justify; word-wrap: break-word; }`
  - Headings: h1=1.6em, h2=1.3em, h3=1.1em with `page-break-before: always` on h1
  - Code blocks: Separated `code` and `pre` definitions to prevent font-size accumulation
- **Removed specific font-family declarations**: Uses generic families for e-reader compatibility

### v0.4.2
- Chapter title page inserted after current active tab
- Chapter title pages combined in TOC
- Removed body font-size from all themes

### v0.4.1
- Book structure templates: Colophon, Preface, Chapter Title Page, Bibliography
- Admonition blocks (:::note, :::warning, :::tip, etc.)
- Automatic file ordering for EPUB
- Cover image persistence fix
- Mermaid PNG conversion for EPUB

### v0.4.0
- Added 5 EPUB preset themes
- Custom CSS import/export
- Kindle Publishing Guidelines compliance
- Hierarchical table of contents

### v0.3.x
- EPUB cover image support
- .mdebook project format
- Image management
- URL/Qiita import

## 📄 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- [CodeMirror](https://codemirror.net/)
- [@replit/codemirror-vim](https://github.com/replit/codemirror-vim)
- [Marked](https://marked.js.org/)
- [Mermaid](https://mermaid.js.org/)
- [JSZip](https://stuk.github.io/jszip/)
- [pdfmake](http://pdfmake.org/)
