# MDebook Tutorial

This tutorial will guide you through the basic usage of MDebook, a browser-based Markdown eBook editor.

**👉 [Launch MDebook](https://fukuyori.github.io/mdebook/dist/mdebook.html)**

## Table of Contents

1. [Getting Started](#getting-started)
2. [Editor Basics](#editor-basics)
3. [VIM Mode](#vim-mode)
4. [Managing Files](#managing-files)
5. [Working with Images](#working-with-images)
6. [Import & Export](#import--export)
7. [Project Management](#project-management)
8. [Tips & Tricks](#tips--tricks)

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
│  MDebook v0.3    [Toolbar Icons]              [Language ▼]  │
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

## Import & Export

### Export Formats

**EPUB**
- Standard eBook format
- Compatible with Kindle, Apple Books, etc.
- Supports cover image (set in Settings panel)
- Click Export → EPUB

**PDF**
- Opens browser print dialog
- Use "Save as PDF" option
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
  │   ├── 01-chapter1.md
  │   └── 02-chapter2.md
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
  - All chapters (Markdown)
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
2. **Reorder freely**: Drag tabs to reorganize structure
3. **Use VIM**: Master `:w` and `:e` for quick file operations
4. **Preview often**: Toggle preview to check formatting
5. **Export early**: Test EPUB export to catch issues

### Best Practices

- Use descriptive file names (they become chapter titles in exports)
- Keep images reasonably sized for eBook compatibility
- Save regularly with `:w`
- Use `.mdebook` format for projects with images

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

---

## Getting Help

- [GitHub Issues](https://github.com/fukuyori/mdebook/issues)
- [README](../README.md)

---

Happy writing! 📚
