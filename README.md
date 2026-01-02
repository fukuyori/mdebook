# MDebook

A browser-based Markdown eBook editor with VIM keybindings, multi-language support, and export to EPUB/PDF/HTML/Markdown.

**Version: 0.4.2**

**[🇯🇵 日本語版はこちら](README.ja.md)**

## ✨ Features

### Editor
- **VIM Keybindings** - Full VIM mode with `:w`, `:q`, `:e` commands
- **CodeMirror 6** - Modern editor with syntax highlighting
- **Live Preview** - Real-time Markdown preview with bidirectional scroll sync
- **Multi-file Support** - Manage multiple chapters with drag-and-drop reordering

### Import & Export
- **Export Formats**: EPUB, PDF, HTML, Markdown (ZIP)
- **Import**: Local files, URLs (Qiita, GitHub auto-conversion)
- **Project Format**: `.mdebook` (ZIP-based) for saving/loading projects with images

### EPUB Themes
- **5 Preset Themes**: Classic, Modern, Technical, Novel, Academic
- **Custom CSS Import**: Use your own CSS for EPUB styling
- **CSS Export**: Export any theme CSS for customization
- **Kindle-compliant**: All themes follow Amazon Kindle Publishing Guidelines

### Book Structure Templates (v0.4.1)
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

## 🎨 EPUB Themes

### Preset Themes

| Theme | Description | Best For |
|-------|-------------|----------|
| **Classic** | Traditional serif design | Literature, general books |
| **Modern** | Clean sans-serif with blue accents | Business books |
| **Technical** | O'Reilly-style with dark red headings | Technical documentation |
| **Novel** | Reading-optimized with scene breaks | Fiction |
| **Academic** | Scholarly style with justified text | Academic papers |

### Custom CSS

1. Click **↓ CSS** to export a theme as starting point
2. Edit the CSS file to customize styles
3. Click **↑ CSS** to import your custom CSS
4. Theme automatically switches to "Custom"

All themes are Kindle-compliant:
- Body text: 1em (required default)
- No forced line-height (respects user settings)
- Headings: 1.0em - 1.3em (conservative sizing)
- Margins: percentage-based

## 📑 Book Structure

### Template Menu

Click "Add Template" to insert pre-formatted templates:

| Template | File Name | Position |
|----------|-----------|----------|
| 📋 Colophon | `colophon.md` / `奥付.md` | End (auto) |
| 📖 Preface | `preface.md` / `はじめに.md` | Beginning (auto) |
| 📑 Chapter Title | `章扉N.md` | Manual |
| 📚 Bibliography | `bibliography.md` / `参考文献.md` | Before colophon (auto) |

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
- **Export**: JSZip, FileSaver.js, Mermaid

## 📦 Export Formats

### EPUB
Standard eBook format compatible with most e-readers. Supports cover image, custom themes, and Mermaid diagram conversion.

### PDF
Opens browser print dialog for PDF generation.

### HTML
Standalone HTML file with embedded styles.

### Markdown (ZIP)
```
book-markdown.zip
├── metadata.json
├── chapters/
│   ├── 01-chapter1.md
│   └── 02-chapter2.md
└── images/
    └── image1.png
```

## 🌐 Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome/Edge | ✅ Full support (File System Access API) |
| Firefox | ✅ Supported (fallback file handling) |
| Safari | ✅ Supported (fallback file handling) |

## 📝 Changelog

### v0.4.2
- Chapter title page inserted after current active tab
- Chapter title pages combined in TOC (e.g., "Chapter 1 Introduction")
- Removed body font-size from all themes for better e-reader compatibility

### v0.4.1
- Book structure templates: Colophon, Preface, Chapter Title Page, Bibliography
- Admonition blocks (:::note, :::warning, :::tip, etc.)
- Automatic file ordering for EPUB (preface first, colophon last)
- Cover image persistence fix
- Mermaid PNG conversion for EPUB compatibility

### v0.4.0
- Added 5 EPUB preset themes (Classic, Modern, Technical, Novel, Academic)
- Custom CSS import/export for EPUB
- Kindle Publishing Guidelines compliance
- Hierarchical table of contents

### v0.3.2
- EPUB cover image support
- Tab rename bug fix
- Version unification

### v0.3.1
- CORS proxy fallback
- Drag-drop tab positioning

### v0.3.0
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
