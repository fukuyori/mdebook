# MDebook File Format Specification

**Version: 1.0**  
**Last Updated: 2025-01-03**

## Overview

MDebook uses two file formats for saving projects:

| Format | Extension | Use Case |
|--------|-----------|----------|
| **MDebook Project** | `.mdebook` | Multiple files or projects with images |
| **Single Markdown** | `.md` | Single file without images |

The `.mdebook` format is a ZIP archive containing Markdown files, images, and a manifest file.

---

## .mdebook Format

### Structure

```
project.mdebook (ZIP archive)
├── manifest.json          # Project metadata and file list
├── chapters/              # Markdown files directory
│   ├── Chapter1.md
│   ├── Chapter2.md
│   └── ...
└── images/                # Images directory
    ├── image1.png
    ├── photo.jpg
    └── ...
```

### manifest.json

The manifest file contains project metadata and lists all included files.

```json
{
  "version": "0.8.1",
  "metadata": {
    "title": "Book Title",
    "author": "Author Name",
    "language": "ja",
    "coverImageId": "cover.jpg",
    "themeId": "technical",
    "customCss": "/* optional custom CSS */",
    "tocDepth": 2
  },
  "uiLang": "ja",
  "chapters": [
    "Chapter1.md",
    "Chapter2.md",
    "Appendix.md"
  ],
  "images": [
    "cover.jpg",
    "diagram1.png",
    "photo.jpg"
  ]
}
```

### Manifest Fields

#### Root Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | MDebook version that created the file |
| `metadata` | object | Yes | Book metadata |
| `uiLang` | string | Yes | UI language when saved (`en`, `ja`, `zh`, `es`, `ko`) |
| `chapters` | string[] | Yes | Ordered list of chapter filenames |
| `images` | string[] | Yes | List of image filenames |

#### Metadata Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Book title |
| `author` | string | Yes | Author name |
| `language` | string | Yes | Book language code (`en`, `ja`, `zh`, `es`, `ko`) |
| `coverImageId` | string | No | Cover image filename (from images/) |
| `themeId` | string | No | EPUB theme ID (`classic`, `modern`, `technical`, `novel`, `academic`, `custom`) |
| `customCss` | string | No | Custom CSS for EPUB export |
| `tocDepth` | number | No | TOC depth (0-3), default: 2 |

### chapters/ Directory

Contains Markdown files in UTF-8 encoding.

**File Naming Rules:**
- Files are stored with `.md` extension
- Order is determined by the `chapters` array in manifest.json
- Filenames should be valid across all operating systems

**Display Behavior:**
- MDebook displays filenames without the `.md` extension in the UI
- When loading, `.md` extension is stripped from display names
- When saving, `.md` extension is added if not present

### images/ Directory

Contains image files referenced in Markdown content.

**Supported Formats:**
| Format | MIME Type | Extension |
|--------|-----------|-----------|
| PNG | image/png | .png |
| JPEG | image/jpeg | .jpg, .jpeg |
| GIF | image/gif | .gif |
| WebP | image/webp | .webp |
| SVG | image/svg+xml | .svg |
| BMP | image/bmp | .bmp |

**Image References in Markdown:**
```markdown
![Alt text](images/filename.png)
```

**Image Cleanup:**
- When manually saving, unreferenced images are removed
- Cover image is always preserved even if not referenced in content

---

## Single Markdown Format (.md)

For simple projects without images, MDebook can save as a single `.md` file.

**Characteristics:**
- Standard UTF-8 encoded Markdown
- No embedded metadata (title derived from filename)
- No image support
- Compatible with any Markdown editor

**When Used:**
- Single file projects
- No images in the project
- User explicitly saves as `.md`

---

## File Operations

### Determining Save Format

MDebook automatically chooses the format based on project contents:

```
if (files.length > 1 || images.length > 0) {
    // Save as .mdebook
} else {
    // Save as .md
}
```

### Loading Files

MDebook accepts both formats:

1. **`.mdebook` files**: Extracted and parsed according to this spec
2. **`.md` files**: Loaded as single-file project with default metadata

### Image ID Handling

Images are identified by a unique ID at runtime, but stored by filename:

- **On Save**: `coverImageId` stores the image filename (not runtime ID)
- **On Load**: New IDs are generated, `coverImageId` is resolved from filename

This ensures portability across different sessions and computers.

---

## Compression

The `.mdebook` ZIP archive uses DEFLATE compression for reduced file size.

---

## MIME Type

| Format | MIME Type |
|--------|-----------|
| .mdebook | application/x-mdebook |
| .md | text/markdown |

---

## Version History

| Version | Changes |
|---------|---------|
| 0.4.4+ | Added `.md` extension to stored chapter files |
| 0.4.1+ | Added `tocDepth` to metadata |
| 0.4.0+ | Added `themeId` and `customCss` to metadata |
| 0.3.x | Added image support, `coverImageId` |
| 0.2.x | Initial ZIP-based format |

---

## Example

### Complete manifest.json

```json
{
  "version": "0.8.1",
  "metadata": {
    "title": "Introduction to Programming",
    "author": "John Doe",
    "language": "en",
    "coverImageId": "cover.png",
    "themeId": "technical",
    "tocDepth": 3
  },
  "uiLang": "en",
  "chapters": [
    "00-Preface.md",
    "01-Introduction.md",
    "02-Variables.md",
    "03-Control-Flow.md",
    "99-Colophon.md"
  ],
  "images": [
    "cover.png",
    "fig1-architecture.png",
    "fig2-flowchart.png"
  ]
}
```

### Minimal manifest.json

```json
{
  "version": "0.8.1",
  "metadata": {
    "title": "My Notes",
    "author": "",
    "language": "en"
  },
  "uiLang": "en",
  "chapters": [
    "notes.md"
  ],
  "images": []
}
```

---

## Implementation Notes

### For Developers

1. **ZIP Library**: Use JSZip or similar for cross-platform compatibility
2. **Encoding**: All text files must be UTF-8
3. **Path Separators**: Always use forward slash (`/`) in ZIP paths
4. **Backward Compatibility**: Handle missing optional fields gracefully
5. **Forward Compatibility**: Ignore unknown fields in manifest

### Security Considerations

- Validate filenames to prevent path traversal attacks
- Limit maximum file sizes to prevent memory exhaustion
- Sanitize image filenames when loading from untrusted sources
