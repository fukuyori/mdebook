/**
 * Project file operations (ZIP-based .mdebook format)
 */
import type { EditorFile, BookMetadata, UILanguage, ProjectImage, ProjectManifest, ProjectData } from '../types';

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
          description: 'MDebook Project or Markdown',
          accept: {
            'application/x-mdebook': ['.mdebook'],
            'text/markdown': ['.md'],
          },
        },
      ],
    });
    
    const file = await handle.getFile();
    const isProject = file.name.endsWith('.mdebook');
    
    let data: ProjectData | null;
    if (isProject) {
      const buffer = await file.arrayBuffer();
      data = await loadProjectFromZip(buffer);
    } else {
      const content = await file.text();
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
    input.accept = '.mdebook,.md';
    
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      const isProject = file.name.endsWith('.mdebook');
      
      try {
        if (isProject) {
          const buffer = await file.arrayBuffer();
          const data = await loadProjectFromZip(buffer);
          resolve(data);
        } else {
          const content = await file.text();
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
 * Add image to project from File
 */
export async function addImageFromFile(file: File): Promise<ProjectImage> {
  const data = await file.arrayBuffer();
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    name: file.name,
    data,
    mimeType: file.type || getMimeType(file.name),
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
