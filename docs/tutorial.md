# MDebook Tutorial

This tutorial will guide you through the basic usage of MDebook, a browser-based Markdown eBook editor.

**Version: 0.4.4**

**👉 [Launch MDebook](https://fukuyori.github.io/mdebook/dist/mdebook.html)**

## Table of Contents

1. [Getting Started](#getting-started)
2. [Editor Basics](#editor-basics)
3. [VIM Mode](#vim-mode)
4. [Managing Files](#managing-files)
5. [Working with Images](#working-with-images)
6. [Book Structure Templates](#book-structure-templates)
7. [EPUB Themes](#epub-themes)
8. [PDF Export](#pdf-export)
9. [Import & Export](#import--export)
10. [Project Management](#project-management)
11. [Tips & Tricks](#tips--tricks)

---

## Getting Started

### Opening MDebook

**Online (Recommended):**
- Visit [https://fukuyori.github.io/mdebook/dist/mdebook.html](https://fukuyori.github.io/mdebook/dist/mdebook.html)

**Offline:**
1. Download `mdebook.html` from the releases page
2. Open the file in your browser (Chrome, Edge, or Firefox recommended)

The editor will load with a sample document.

### Interface Overview

```
┌─────────────────────────────────────────────────────────────┐
│  MDebook v0.4.4  [Toolbar Icons]              [Language ▼]  │
├─────────┬───────────────────────┬───────────────────────────┤
│         │                       │                           │
│  File   │      Editor           │      Preview              │
│  Tabs   │                       │                           │
│         │                       │                           │
├─────────┴───────────────────────┴───────────────────────────┤
│  [VIM Mode: NORMAL]           [Line:Col]        [Lines]     │
├─────────────────────────────────────────────────────────────┤
│  [Files: N]  [Characters: N]                    [Status]    │
└─────────────────────────────────────────────────────────────┘
```

---

## Editor Basics

### Writing Markdown

MDebook supports standard Markdown plus extensions:

```markdown
# Heading 1
## Heading 2

**Bold** and *italic* text

- Bullet list
- Another item

1. Numbered list
2. Second item

> Blockquote

`inline code`

​```javascript
// Code block with syntax highlighting
function hello() {
  console.log("Hello!");
}
​```

| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |

[Link](https://example.com)

![Image](images/photo.png)

Footnote reference[^1]

[^1]: Footnote content
```

### Mermaid Diagrams

Create diagrams using Mermaid syntax:

```markdown
​```mermaid
graph LR
    A[Start] --> B[Process]
    B --> C[End]
​```
```

### Admonitions (Callout Blocks)

```markdown
:::note
This is a note.
:::

:::warning Warning Title
This is a warning message.
:::

:::tip
This is a helpful tip!
:::
```

Supported types: `note`, `warning`, `tip`, `info`, `caution`, `important`

### Live Preview

- The preview pane updates in real-time as you type
- Scroll sync: scrolling in the editor syncs with the preview (and vice versa)
- Toggle preview visibility with the eye icon in the toolbar

---

## VIM Mode

MDebook features full VIM keybindings for efficient editing.

### Mode Indicator

The status bar shows the current VIM mode:
- **NORMAL** (blue) - Navigation and commands
- **INSERT** (green) - Text input
- **VISUAL** (purple) - Text selection
- **REPLACE** (red) - Overwrite mode

### Basic Navigation (NORMAL mode)

| Key | Action |
|-----|--------|
| `h` | Move left |
| `j` | Move down |
| `k` | Move up |
| `l` | Move right |
| `w` | Next word |
| `b` | Previous word |
| `0` | Start of line |
| `$` | End of line |
| `gg` | Start of file |
| `G` | End of file |

### Entering INSERT Mode

| Key | Action |
|-----|--------|
| `i` | Insert before cursor |
| `a` | Insert after cursor |
| `I` | Insert at line start |
| `A` | Insert at line end |
| `o` | New line below |
| `O` | New line above |

### Editing Commands

| Key | Action |
|-----|--------|
| `dd` | Delete line |
| `yy` | Yank (copy) line |
| `p` | Paste after cursor |
| `P` | Paste before cursor |
| `u` | Undo |
| `Ctrl+r` | Redo |
| `x` | Delete character |
| `r` | Replace character |

### Ex Commands

| Command | Action |
|---------|--------|
| `:w` | Save (overwrite) |
| `:w!` | Save with dialog |
| `:w filename` | Save as |
| `:e filename` | Open/create file |
| `:q` | Close file |
| `:wq` | Save and close |
| `:imp` | Import dialog |
| `:imp URL` | Import from URL |

### Disabling VIM Mode

- Click the **VIM** button in the toolbar
- Or press `Ctrl+\`` to toggle

---

## Managing Files

### Creating New Files

1. Click the **+** button at the bottom of the file tabs
2. Or use `:e newfile.md` in VIM command mode

### Renaming Files

1. Double-click on a file tab
2. Type the new name
3. Press Enter to confirm (or Escape to cancel)

### Reordering Files

- Drag and drop file tabs to reorder chapters
- The order is preserved when exporting

### Deleting Files

- Click the **×** button on the file tab
- Note: You cannot delete the last remaining file

### Importing Files

**From local files:**
1. Click the folder icon in the toolbar
2. Or drag and drop `.md` files onto the app
3. Files are inserted after the currently active tab

**From URLs:**
1. Use `:imp URL` or click the folder icon
2. Supported URLs:
   - Qiita articles (`.md` auto-added)
   - GitHub files (auto-converted to raw)
   - Direct `.md` URLs

---

## Working with Images

### Adding Images

**Method 1: Paste from clipboard**
1. Copy an image to your clipboard
2. Paste in the editor (`Ctrl+V`)
3. The image is embedded and markdown reference is inserted

**Method 2: Drag and drop**
1. Drag an image file onto the editor area
2. The image is added to the project

**Method 3: File picker**
1. Click the image icon in the toolbar
2. Select an image file

### Image Storage

- Images are stored within the project
- Referenced as `![alt](images/image-id)`
- Automatically included when saving as `.mdebook`
- Unreferenced images are cleaned up on manual save

---

## Book Structure Templates

MDebook provides templates for common book elements.

### Adding Templates

1. Click **"+ Template"** button in the toolbar
2. Select from available templates:
   - 📋 Colophon (奥付)
   - 📖 Preface (はじめに)
   - 📑 Chapter Title Page (章扉)
   - 📚 Bibliography (参考文献)

### Template Types

| Template | Description | Auto-Position |
|----------|-------------|---------------|
| **Colophon** | Publication info (title, author, date, copyright) | End of book |
| **Preface** | Introduction/foreword | Beginning of book |
| **Chapter Title Page** | Decorative chapter opener with epigraph | After current tab |
| **Bibliography** | Reference list | Before colophon |

### Chapter Title Page Format

```markdown
<div class="chapter-title-page">

# Chapter 1

## Chapter Title Here

> "Optional quotation"
> — Author Name

</div>

---

<!-- Start your content here -->
```

**TOC Behavior:**
- In EPUB/PDF table of contents: "Chapter 1 Chapter Title Here" (combined)
- Original chapter number and subtitle displayed separately on the page

---

## EPUB Themes

### Preset Themes

| Theme | Description | Best For |
|-------|-------------|----------|
| **Classic** | Traditional serif design with subtle borders | Literature, general books |
| **Modern** | Clean sans-serif with blue accents | Business books |
| **Technical** | O'Reilly-style with dark red headings | Technical documentation |
| **Novel** | Reading-optimized with scene breaks | Fiction |
| **Academic** | Scholarly style with justified text | Academic papers |

### Selecting a Theme

1. Click the gear icon to open Settings
2. Find the **Theme** dropdown
3. Select your preferred theme
4. Theme is applied when exporting to EPUB

### Using Custom CSS

**Exporting a theme (as starting point):**
1. Select a theme from the dropdown
2. Click the **↓ CSS** button
3. A CSS file is downloaded

**Importing custom CSS:**
1. Edit your CSS file
2. Click the **↑ CSS** button
3. Select your CSS file
4. Theme automatically switches to "Custom"
5. "Custom ✓" indicates custom CSS is loaded

### Kindle-Optimized CSS

All preset themes follow Amazon Kindle Publishing Guidelines 2025:

```css
html { font-size: 100%; }
body {
  margin: 0;
  padding: 0;
  line-height: 1.7;
  text-align: justify;
  word-wrap: break-word;
}

h1 { font-size: 1.6em; page-break-before: always; }
h2 { font-size: 1.3em; }
h3 { font-size: 1.1em; }

code { font-size: 0.9em; }
pre { font-size: 0.9em; }
pre code { font-size: inherit; }
```

---

## PDF Export

MDebook v0.4.4 features native PDF generation with pdfmake.

### Japanese Font Setup

1. Download fonts from [Google Fonts - Noto Sans JP](https://fonts.google.com/noto/specimen/Noto+Sans+JP)
2. Open Settings (gear icon)
3. Scroll to **"PDF Font Settings"**
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

Controls table of contents depth for both EPUB and PDF:
- **0**: No table of contents
- **1**: H1 only
- **2**: H1 + H2 (default)
- **3**: H1 + H2 + H3

### Theme CSS in PDF

PDF export respects EPUB theme settings:
- Line height
- Letter spacing
- Text alignment
- Heading colors and sizes

---

## Import & Export

### Export Formats

**EPUB**
- Standard eBook format
- Compatible with Kindle, Apple Books, etc.
- Supports cover image (set in Settings panel)
- Applies selected theme
- Mermaid diagrams converted to PNG
- Click Export → EPUB

**PDF**
- Native PDF with pdfmake
- Japanese font support (upload in Settings)
- Auto-generated TOC with links
- Header with title, footer with page numbers
- Click Export → PDF

**HTML**
- Standalone HTML file with embedded styles
- Preserves dark/light theme setting
- Click Export → HTML

**Markdown (ZIP)**
- Exports all chapters and images
- Structure:
  ```
  book-markdown.zip
  ├── metadata.json
  ├── chapters/
  │   ├── chapter1.md
  │   └── chapter2.md
  └── images/
      └── image.png
  ```
- Click Export → Markdown (ZIP)

### Importing Projects

**From `.mdebook` file:**
1. Click Open (folder icon)
2. Select a `.mdebook` file
3. Or drag and drop onto the app

**From Markdown files:**
1. Use the import dialog
2. Or drag and drop `.md` files

---

## Project Management

### Saving Projects

**Quick Save (`:w`)**
- Overwrites the current file if opened via File System Access API
- Otherwise, opens save dialog

**Save with Dialog (`:w!`)**
- Always opens the save dialog

**Project Format**
- `.mdebook` files contain:
  - All chapters (Markdown with .md extension)
  - Embedded images
  - Metadata (title, author, language)
  - UI settings

### Auto-Save

- Sessions are automatically saved to IndexedDB
- Restored when reopening the browser
- Each browser tab has its own session

### Settings Panel

Click the gear icon to access:
- **Title**: Book title (used in exports)
- **Author**: Author name
- **Language**: Book language (for EPUB metadata)
- **Cover Image**: Select from project images (for EPUB)
- **Theme**: Select EPUB theme or use custom CSS
- **TOC Depth**: Table of contents depth (0-3)
- **PDF Font Settings**: Upload Japanese fonts

---

## Tips & Tricks

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+\`` | Toggle VIM mode |
| `Esc` | Return to NORMAL mode / Close dialogs |

### URL Import Tips

```
# Qiita article
https://qiita.com/username/items/article-id

# GitHub file
https://github.com/user/repo/blob/main/file.md

# Raw URL
https://example.com/document.md
```

### Efficient Workflow

1. **Start with outline**: Create multiple files for chapters
2. **Use templates**: Add chapter title pages for professional look
3. **Reorder freely**: Drag tabs to reorganize structure
4. **Use VIM**: Master `:w` and `:e` for quick file operations
5. **Preview often**: Toggle preview to check formatting
6. **Choose theme early**: Select appropriate EPUB theme before writing
7. **Test exports**: Export to EPUB/PDF early to catch issues

### Best Practices

- Use descriptive file names (they become chapter titles in exports)
- Keep images reasonably sized for eBook compatibility
- Save regularly with `:w`
- Use `.mdebook` format for projects with images
- Export CSS to customize themes
- Upload Japanese fonts before PDF export

---

## Troubleshooting

### Preview Not Updating

- Check if preview is visible (eye icon)
- Try toggling VIM mode off and on

### Images Not Showing

- Ensure images are in the project (not external URLs)
- Check the image path format: `![alt](images/id)`

### Save Not Working

- Chrome/Edge: Should work with File System Access API
- Firefox/Safari: Will always show download dialog

### VIM Mode Issues

- Press `Esc` multiple times to ensure you're in NORMAL mode
- Check the mode indicator in the status bar

### Theme Not Applied

- Themes only apply to EPUB/PDF export, not the preview pane
- Check that you've selected a theme in Settings
- For custom CSS, ensure the file was loaded (shows "Custom ✓")

### PDF Export Issues

- **Japanese text not showing**: Upload fonts in Settings → PDF Font Settings
- **Fonts not persisting**: Use Chrome for best IndexedDB support
- **Emojis showing as boxes**: Emojis are auto-removed in PDF

### IndexedDB Issues

- `file://` protocol may restrict IndexedDB in some browsers
- Use Chrome or run a local server for best results

---

## Getting Help

- [GitHub Issues](https://github.com/fukuyori/mdebook/issues)
- [README](../README.md)

---

Happy writing! 📚
