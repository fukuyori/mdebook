/**
 * Project file operations (ZIP-based .mdebook format)
 */
import type { EditorFile, BookMetadata, UILanguage, BookLanguage, ProjectImage, ProjectManifest, ProjectData } from '../types';
import { readFileWithEncoding } from './encoding';

// Declare JSZip (loaded via CDN)
declare const JSZip: {
  new(): JSZipInstance;
  loadAsync(data: ArrayBuffer | Blob): Promise<JSZipInstance>;
};

interface JSZipInstance {
  file(name: string, data: string | ArrayBuffer | Uint8Array, options?: { binary?: boolean }): this;
  folder(name: string): JSZipInstance | null;
  files: Record<string, JSZipFile>;
  generateAsync(options: { type: string; compression?: string }): Promise<Blob | ArrayBuffer>;
}

interface JSZipFile {
  name: string;
  dir: boolean;
  async(type: 'string'): Promise<string>;
  async(type: 'arraybuffer'): Promise<ArrayBuffer>;
  async(type: 'uint8array'): Promise<Uint8Array>;
}

// Declare FileSaver (loaded via CDN)
declare function saveAs(blob: Blob, filename: string): void;

/**
 * Extract referenced image names from markdown files
 */
export function getReferencedImages(files: EditorFile[]): Set<string> {
  const referenced = new Set<string>();
  // Match ![alt](images/filename) pattern
  const regex = /!\[[^\]]*\]\(images\/([^)\s]+)\)/g;
  
  for (const file of files) {
    let match;
    // Reset regex lastIndex for each file
    regex.lastIndex = 0;
    while ((match = regex.exec(file.content)) !== null) {
      referenced.add(match[1]);
    }
  }
  return referenced;
}

/**
 * Filter images to only include those referenced in markdown files or used as cover
 */
export function filterReferencedImages(
  files: EditorFile[], 
  images: ProjectImage[],
  coverImageId?: string
): ProjectImage[] {
  const referenced = getReferencedImages(files);
  return images.filter(img => 
    referenced.has(img.name) || img.id === coverImageId
  );
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Create manifest from project data
 * Converts coverImageId to coverImageName for portability
 */
function createManifest(
  files: EditorFile[],
  metadata: BookMetadata,
  uiLang: UILanguage,
  images: ProjectImage[],
  version: string
): ProjectManifest {
  // Convert coverImageId to coverImageName for portability
  let savedMetadata = { ...metadata };
  if (metadata.coverImageId) {
    const coverImage = images.find(img => img.id === metadata.coverImageId);
    if (coverImage) {
      // Store the image name instead of ID (which is regenerated on load)
      savedMetadata = {
        ...metadata,
        coverImageId: coverImage.name, // Store name, not ID
      };
    }
  }
  
  return {
    version,
    metadata: savedMetadata,
    uiLang,
    chapters: files.map(f => f.name),
    images: images.map(img => img.name),
  };
}

/**
 * Check if project has images
 */
export function projectHasImages(images: ProjectImage[]): boolean {
  return images.length > 0;
}

/**
 * Check if project has multiple files
 */
export function projectHasMultipleFiles(files: EditorFile[]): boolean {
  return files.length > 1;
}

/**
 * Determine if project should be saved as .mdebook (ZIP) or .md
 */
export function shouldSaveAsProject(files: EditorFile[], images: ProjectImage[]): boolean {
  return projectHasMultipleFiles(files) || projectHasImages(images);
}

/**
 * Save project as ZIP (.mdebook format)
 */
export async function saveProjectAsZip(
  files: EditorFile[],
  metadata: BookMetadata,
  uiLang: UILanguage,
  images: ProjectImage[],
  version: string
): Promise<Blob> {
  const zip = new JSZip();
  
  // Add .md extension to file names for storage
  const filesWithExt = files.map(f => ({
    ...f,
    name: f.name.endsWith('.md') ? f.name : `${f.name}.md`
  }));
  
  // Create manifest with .md extensions
  const manifest = createManifest(filesWithExt, metadata, uiLang, images, version);
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  
  // Add chapters with .md extension
  const chaptersFolder = zip.folder('chapters');
  if (chaptersFolder) {
    filesWithExt.forEach(file => {
      chaptersFolder.file(file.name, file.content);
    });
  }
  
  // Add images
  const imagesFolder = zip.folder('images');
  if (imagesFolder) {
    images.forEach(img => {
      imagesFolder.file(img.name, img.data, { binary: true });
    });
  }
  
  // Generate ZIP blob
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  return blob as Blob;
}

/**
 * Save single markdown file
 */
export function saveSingleMarkdown(file: EditorFile): Blob {
  return new Blob([file.content], { type: 'text/markdown' });
}

/**
 * Load project from ZIP (.mdebook format)
 */
export async function loadProjectFromZip(data: ArrayBuffer): Promise<ProjectData | null> {
  try {
    const zip = await JSZip.loadAsync(data);
    
    // Read manifest
    const manifestFile = zip.files['manifest.json'];
    if (!manifestFile) {
      console.error('No manifest.json found in project file');
      return null;
    }
    
    const manifestStr = await manifestFile.async('string');
    const manifest: ProjectManifest = JSON.parse(manifestStr);
    
    // Helper to remove .md extension for display
    const removeExtension = (name: string): string => {
      return name.endsWith('.md') ? name.slice(0, -3) : name;
    };
    
    // Read chapters
    const files: EditorFile[] = [];
    for (const chapterName of manifest.chapters) {
      const chapterFile = zip.files[`chapters/${chapterName}`];
      if (chapterFile) {
        const content = await chapterFile.async('string');
        files.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: removeExtension(chapterName),  // Remove .md for display
          content,
        });
      }
    }
    
    // Read images
    const images: ProjectImage[] = [];
    const savedCoverImageName = manifest.metadata.coverImageId; // This is actually the image name
    let newCoverImageId: string | undefined = undefined;
    
    for (const imageName of manifest.images) {
      const imageFile = zip.files[`images/${imageName}`];
      if (imageFile) {
        const imageData = await imageFile.async('arraybuffer');
        const newId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        
        images.push({
          id: newId,
          name: imageName,
          data: imageData,
          mimeType: getMimeType(imageName),
        });
        
        // If this image was the cover, save its new ID
        if (savedCoverImageName && imageName === savedCoverImageName) {
          newCoverImageId = newId;
        }
      }
    }
    
    // Update metadata with new coverImageId
    const updatedMetadata = {
      ...manifest.metadata,
      coverImageId: newCoverImageId,
    };
    
    return {
      version: manifest.version,
      files,
      metadata: updatedMetadata,
      uiLang: manifest.uiLang,
      images,
    };
  } catch (error) {
    console.error('Failed to load project from ZIP:', error);
    return null;
  }
}

/**
 * Load single markdown file
 */
export function loadSingleMarkdown(content: string, filename: string): ProjectData {
  return {
    version: '0.3',
    files: [{
      id: Date.now().toString(),
      name: filename,
      content,
    }],
    metadata: {
      title: filename.replace(/\.md$/, ''),
      author: '',
      language: 'en',
    },
    uiLang: 'en',
    images: [],
  };
}

// File System Access API types
interface FilePickerOptions {
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
  suggestedName?: string;
  multiple?: boolean;
}

type FileSystemFileHandle = {
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
  name: string;
};

interface FileSystemWritableFileStream {
  write(data: Blob | ArrayBuffer | string): Promise<void>;
  close(): Promise<void>;
}

declare function showOpenFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle[]>;
declare function showSaveFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle>;

/**
 * Open file using File System Access API
 * Returns file handle for later overwrite saves
 */
export async function openFileWithFSA(): Promise<{ handle: FileSystemFileHandle; data: ProjectData } | null> {
  if (!isFileSystemAccessSupported()) {
    return null;
  }
  
  try {
    const [handle] = await showOpenFilePicker({
      types: [
        {
          description: 'MDebook Project, mdvim, or Markdown',
          accept: {
            'application/x-mdebook': ['.mdebook'],
            'application/x-mdvim': ['.mdvim'],
            'text/markdown': ['.md'],
          },
        },
      ],
    });
    
    const file = await handle.getFile();
    const isProject = file.name.endsWith('.mdebook');
    const isMdvim = file.name.toLowerCase().endsWith('.mdvim');
    
    let data: ProjectData | null;
    if (isProject) {
      const buffer = await file.arrayBuffer();
      data = await loadProjectFromZip(buffer);
    } else if (isMdvim) {
      const buffer = await file.arrayBuffer();
      data = await loadMdvimFile(buffer, file.name);
    } else {
      const content = await readFileWithEncoding(file);
      data = loadSingleMarkdown(content, file.name);
    }
    
    if (!data) return null;
    
    return { handle, data };
  } catch (error) {
    // User cancelled or error
    if ((error as Error).name !== 'AbortError') {
      console.error('Failed to open file:', error);
    }
    return null;
  }
}

/**
 * Open file using fallback method (input element)
 */
export function openFileFallback(): Promise<ProjectData | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mdebook,.mdvim,.md';
    
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      const isProject = file.name.endsWith('.mdebook');
      const isMdvim = file.name.toLowerCase().endsWith('.mdvim');
      
      try {
        if (isProject) {
          const buffer = await file.arrayBuffer();
          const data = await loadProjectFromZip(buffer);
          resolve(data);
        } else if (isMdvim) {
          const buffer = await file.arrayBuffer();
          const data = await loadMdvimFile(buffer, file.name);
          resolve(data);
        } else {
          const content = await readFileWithEncoding(file);
          const data = loadSingleMarkdown(content, file.name);
          resolve(data);
        }
      } catch (error) {
        console.error('Failed to load file:', error);
        resolve(null);
      }
    };
    
    input.click();
  });
}

/**
 * Save file using File System Access API with overwrite
 */
export async function saveFileWithFSA(
  handle: FileSystemFileHandle,
  blob: Blob
): Promise<boolean> {
  if (!isFileSystemAccessSupported()) {
    return false;
  }
  
  try {
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (error) {
    console.error('Failed to save file:', error);
    return false;
  }
}

/**
 * Save file using File System Access API with dialog
 */
export async function saveFileWithFSADialog(
  blob: Blob,
  suggestedName: string,
  isProject: boolean
): Promise<FileSystemFileHandle | null> {
  if (!isFileSystemAccessSupported()) {
    return null;
  }
  
  try {
    const options = {
      suggestedName,
      excludeAcceptAllOption: true,
      types: isProject
        ? [{ description: 'MDebook Project', accept: { 'application/x-mdebook': ['.mdebook'] } }]
        : [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handle = await showSaveFilePicker(options as any);
    
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    
    return handle;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Failed to save file:', error);
    }
    return null;
  }
}

/**
 * Save file using fallback method (download)
 */
export function saveFileFallback(blob: Blob, filename: string): void {
  saveAs(blob, filename);
}

/**
 * Generate short hash from data
 */
async function generateShortHash(data: ArrayBuffer): Promise<string> {
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Take first 4 bytes (8 hex chars)
    return hashArray.slice(0, 4).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback: use random string
    return Math.random().toString(36).substr(2, 8);
  }
}

/**
 * Sanitize filename for safe storage
 * Removes special characters, keeps alphanumeric, underscore, hyphen
 */
function sanitizeFilename(name: string): string {
  // Remove extension
  const baseName = name.replace(/\.[^.]+$/, '');
  // Replace spaces and special chars with underscore
  const sanitized = baseName
    .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  // Limit length
  return sanitized.substring(0, 20) || 'image';
}

/**
 * Get file extension from filename or mime type
 */
function getExtension(filename: string, mimeType: string): string {
  // Try from filename first
  const extMatch = filename.match(/\.([^.]+)$/);
  if (extMatch) {
    return extMatch[1].toLowerCase();
  }
  // Fallback to mime type
  const mimeExtensions: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  };
  return mimeExtensions[mimeType] || 'png';
}

/**
 * Add image to project from File
 * Uses hybrid naming: basename_hash.ext
 */
export async function addImageFromFile(file: File, isPasted: boolean = false): Promise<ProjectImage> {
  const data = await file.arrayBuffer();
  const hash = await generateShortHash(data);
  const mimeType = file.type || getMimeType(file.name);
  const ext = getExtension(file.name, mimeType);
  
  // Generate name: originalname_hash.ext or pasted_hash.ext
  let baseName: string;
  if (isPasted) {
    baseName = 'pasted';
  } else {
    baseName = sanitizeFilename(file.name);
  }
  
  const name = `${baseName}_${hash}.${ext}`;
  
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    name,
    data,
    mimeType,
  };
}

/**
 * Add image to project from URL
 */
export async function addImageFromUrl(url: string): Promise<ProjectImage | null> {
  try {
    let data: ArrayBuffer | null = null;
    
    // Try direct fetch first
    try {
      const response = await fetch(url);
      if (response.ok) {
        data = await response.arrayBuffer();
      }
    } catch {
      // Direct fetch failed, try proxies
    }
    
    // If direct fetch failed, try CORS proxies
    if (!data) {
      const corsProxies = [
        (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      ];
      
      for (const getProxyUrl of corsProxies) {
        try {
          const proxyUrl = getProxyUrl(url);
          const response = await fetch(proxyUrl);
          if (response.ok) {
            data = await response.arrayBuffer();
            break;
          }
        } catch {
          // Try next proxy
        }
      }
    }
    
    if (!data) {
      throw new Error('Failed to fetch image (all proxies failed)');
    }
    
    const filename = url.split('/').pop() || 'image.png';
    
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: filename,
      data,
      mimeType: getMimeType(filename),
    };
  } catch (error) {
    console.error('Failed to fetch image from URL:', error);
    return null;
  }
}

/**
 * Create object URL for image preview
 */
export function createImageObjectUrl(image: ProjectImage): string {
  const blob = new Blob([image.data], { type: image.mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Revoke object URL
 */
export function revokeImageObjectUrl(url: string): void {
  URL.revokeObjectURL(url);
}

// ============================================================================
// mdvim Format Support
// ============================================================================

/**
 * mdvim manifest format
 */
interface MdvimManifest {
  version: string;
  app: 'mdvim';
  created: string;
  metadata?: {
    title?: string;
    author?: string;
    language?: string;
  };
  content?: string;
  images?: string[];
}

/**
 * Check if ArrayBuffer contains a ZIP file (starts with PK signature)
 */
function isZipFile(data: ArrayBuffer): boolean {
  const arr = new Uint8Array(data);
  // ZIP files start with PK (0x50 0x4B)
  return arr.length >= 2 && arr[0] === 0x50 && arr[1] === 0x4B;
}

/**
 * Load mdvim file and convert to MDebook format
 * Supports both ZIP archive format and plain text Markdown format
 * @param data - ArrayBuffer of the .mdvim file
 * @param filename - Original filename for fallback title
 * @returns ProjectData or null if failed
 */
export async function loadMdvimFile(data: ArrayBuffer, filename: string): Promise<ProjectData | null> {
  try {
    const title = filename.replace(/\.mdvim$/i, '');
    
    // Check if it's a ZIP file or plain text
    if (!isZipFile(data)) {
      // Plain text Markdown file with .mdvim extension
      const decoder = new TextDecoder('utf-8');
      const content = decoder.decode(data);
      
      return {
        version: '0.8.0',
        files: [{
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: title,
          content,
        }],
        metadata: {
          title,
          author: '',
          language: 'ja',
        },
        uiLang: 'ja',
        images: [],
      };
    }
    
    // ZIP archive format
    const zip = await JSZip.loadAsync(data);
    
    // Read manifest.json
    const manifestFile = zip.files['manifest.json'];
    let manifest: MdvimManifest | null = null;
    
    if (manifestFile) {
      const manifestStr = await manifestFile.async('string');
      manifest = JSON.parse(manifestStr);
    }
    
    // Determine content file name
    const contentFileName = manifest?.content || 'content.md';
    
    // Read content
    const contentFile = zip.files[contentFileName];
    if (!contentFile) {
      console.error(`Content file not found: ${contentFileName}`);
      return null;
    }
    const content = await contentFile.async('string');
    
    // Extract metadata
    const metaTitle = manifest?.metadata?.title || title;
    const author = manifest?.metadata?.author || '';
    const language = (manifest?.metadata?.language as BookLanguage) || 'ja';
    
    // Read images
    const images: ProjectImage[] = [];
    const imageNames = manifest?.images || [];
    
    // If manifest doesn't list images, scan the images/ folder
    if (imageNames.length === 0) {
      for (const [path, entry] of Object.entries(zip.files)) {
        if (path.startsWith('images/') && !entry.dir) {
          const name = path.replace('images/', '');
          if (name) imageNames.push(name);
        }
      }
    }
    
    // Load each image
    for (const imageName of imageNames) {
      const imagePath = `images/${imageName}`;
      const imageFile = zip.files[imagePath];
      if (imageFile && !imageFile.dir) {
        const imageData = await imageFile.async('arraybuffer');
        images.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: imageName,
          data: imageData,
          mimeType: getMimeType(imageName),
        });
      }
    }
    
    // Create single file from content
    const files: EditorFile[] = [{
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: metaTitle,
      content,
    }];
    
    return {
      version: manifest?.version || '0.8.0',
      files,
      metadata: {
        title: metaTitle,
        author,
        language,
      },
      uiLang: language as UILanguage,
      images,
    };
  } catch (error) {
    console.error('Failed to load mdvim file:', error);
    return null;
  }
}

/**
 * Export single chapter to mdvim format
 * @param file - The chapter to export
 * @param metadata - Book metadata
 * @param allImages - All project images
 * @returns Blob of the .mdvim file
 */
export async function exportToMdvim(
  file: EditorFile,
  metadata: BookMetadata,
  allImages: ProjectImage[]
): Promise<Blob> {
  const zip = new JSZip();
  
  // Find images referenced in this file
  const referencedImageNames = new Set<string>();
  const imageRegex = /!\[[^\]]*\]\(images\/([^)\s]+)\)/g;
  let match;
  while ((match = imageRegex.exec(file.content)) !== null) {
    referencedImageNames.add(match[1]);
  }
  
  // Filter to only referenced images
  const images = allImages.filter(img => referencedImageNames.has(img.name));
  
  // Create manifest
  const manifest: MdvimManifest = {
    version: '0.8.1',
    app: 'mdvim',
    created: new Date().toISOString(),
    metadata: {
      title: file.name || metadata.title,
      author: metadata.author,
      language: metadata.language,
    },
    content: 'content.md',
    images: images.map(img => img.name),
  };
  
  // Add manifest
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  
  // Add content
  zip.file('content.md', file.content);
  
  // Add images
  const imagesFolder = zip.folder('images');
  if (imagesFolder) {
    for (const img of images) {
      imagesFolder.file(img.name, img.data, { binary: true });
    }
  }
  
  // Generate ZIP
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  return blob as Blob;
}

/**
 * Check if file is mdvim format
 */
export function isMdvimFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.mdvim');
}
