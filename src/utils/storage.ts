/**
 * IndexedDB storage for auto-save and session management
 */
import type { EditorFile, BookMetadata, UILanguage, ProjectImage } from '../types';

const DB_NAME = 'mdebook';
const DB_VERSION = 2;  // Updated for fonts store

/**
 * Session data stored in IndexedDB
 */
export interface SessionData {
  sessionId: string;
  projectId: string;
  lastActive: number;
  files: EditorFile[];
  metadata: BookMetadata;
  uiLang: UILanguage;
  images: SerializedImage[];
}

/**
 * Serialized image (ArrayBuffer -> Base64 for IndexedDB)
 */
interface SerializedImage {
  id: string;
  name: string;
  data: string;  // Base64
  mimeType: string;
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate unique project ID
 */
export function generateProjectId(): string {
  return 'project_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Serialize images for storage
 */
function serializeImages(images: ProjectImage[]): SerializedImage[] {
  return images.map(img => ({
    id: img.id,
    name: img.name,
    data: arrayBufferToBase64(img.data),
    mimeType: img.mimeType,
  }));
}

/**
 * Deserialize images from storage
 */
function deserializeImages(images: SerializedImage[]): ProjectImage[] {
  return images.map(img => ({
    id: img.id,
    name: img.name,
    data: base64ToArrayBuffer(img.data),
    mimeType: img.mimeType,
  }));
}

/**
 * Open IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create sessions store
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionsStore = db.createObjectStore('sessions', { keyPath: 'sessionId' });
        sessionsStore.createIndex('projectId', 'projectId', { unique: false });
        sessionsStore.createIndex('lastActive', 'lastActive', { unique: false });
      }
      
      // Create fonts store (added in version 2)
      if (!db.objectStoreNames.contains('fonts')) {
        db.createObjectStore('fonts', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Save session data
 */
export async function saveSession(
  sessionId: string,
  projectId: string,
  files: EditorFile[],
  metadata: BookMetadata,
  uiLang: UILanguage,
  images: ProjectImage[]
): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');
    
    const sessionData: SessionData = {
      sessionId,
      projectId,
      lastActive: Date.now(),
      files,
      metadata,
      uiLang,
      images: serializeImages(images),
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(sessionData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
  } catch (error) {
    console.error('Failed to save session:', error);
  }
}

/**
 * Load session data by session ID
 */
export async function loadSession(sessionId: string): Promise<{
  projectId: string;
  files: EditorFile[];
  metadata: BookMetadata;
  uiLang: UILanguage;
  images: ProjectImage[];
} | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');
    
    const result = await new Promise<SessionData | undefined>((resolve, reject) => {
      const request = store.get(sessionId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    
    if (!result) return null;
    
    return {
      projectId: result.projectId,
      files: result.files,
      metadata: result.metadata,
      uiLang: result.uiLang,
      images: deserializeImages(result.images),
    };
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

/**
 * Get most recent session (for new tabs without existing session)
 */
export async function getMostRecentSession(): Promise<{
  projectId: string;
  files: EditorFile[];
  metadata: BookMetadata;
  uiLang: UILanguage;
  images: ProjectImage[];
} | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');
    const index = store.index('lastActive');
    
    const result = await new Promise<SessionData | undefined>((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          resolve(cursor.value);
        } else {
          resolve(undefined);
        }
      };
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    
    if (!result) return null;
    
    return {
      projectId: generateProjectId(), // New project ID for the copy
      files: result.files.map(f => ({ ...f, id: generateSessionId() })),
      metadata: { ...result.metadata },
      uiLang: result.uiLang,
      images: deserializeImages(result.images).map(img => ({ ...img, id: generateSessionId() })),
    };
  } catch (error) {
    console.error('Failed to get most recent session:', error);
    return null;
  }
}

/**
 * Check if a project is being edited in another session
 * Returns true if another session is actively editing the same project
 */
export async function isProjectBeingEdited(
  projectId: string,
  currentSessionId: string,
  timeoutMs: number = 5 * 60 * 1000 // 5 minutes
): Promise<boolean> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');
    const index = store.index('projectId');
    
    const now = Date.now();
    
    const result = await new Promise<boolean>((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(projectId));
      let foundActive = false;
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const session: SessionData = cursor.value;
          // Check if it's a different session and recently active
          if (session.sessionId !== currentSessionId && 
              (now - session.lastActive) < timeoutMs) {
            foundActive = true;
          }
          cursor.continue();
        } else {
          resolve(foundActive);
        }
      };
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    return result;
  } catch (error) {
    console.error('Failed to check project editing status:', error);
    return false;
  }
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(sessionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
  } catch (error) {
    console.error('Failed to delete session:', error);
  }
}

/**
 * Clean up old sessions (older than specified days)
 */
export async function cleanupOldSessions(daysOld: number = 7): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');
    const index = store.index('lastActive');
    
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.upperBound(cutoff));
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
    
    db.close();
  } catch (error) {
    console.error('Failed to cleanup old sessions:', error);
  }
}

// ============================================
// PDF Font Storage
// ============================================

/**
 * Font data stored in IndexedDB
 */
export interface StoredFont {
  id: string;           // 'pdf-font-regular' | 'pdf-font-bold'
  name: string;         // Original filename
  data: string;         // Base64 encoded font data
  mimeType: string;     // 'font/ttf' | 'font/otf'
  uploadedAt: number;   // Timestamp
}

/**
 * Save font to IndexedDB
 */
export async function savePdfFont(
  fontType: 'regular' | 'bold',
  file: File
): Promise<void> {
  try {
    const db = await openDatabase();
    
    // Read file as Base64
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    
    const transaction = db.transaction(['fonts'], 'readwrite');
    const store = transaction.objectStore('fonts');
    
    const fontData: StoredFont = {
      id: `pdf-font-${fontType}`,
      name: file.name,
      data,
      mimeType: file.type || 'font/ttf',
      uploadedAt: Date.now(),
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(fontData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    console.log(`Font saved: ${fontType} - ${file.name}`);
  } catch (error) {
    console.error('Failed to save font:', error);
    throw error;
  }
}

/**
 * Load font from IndexedDB
 */
export async function loadPdfFont(
  fontType: 'regular' | 'bold'
): Promise<StoredFont | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['fonts'], 'readonly');
    const store = transaction.objectStore('fonts');
    
    const result = await new Promise<StoredFont | null>((resolve, reject) => {
      const request = store.get(`pdf-font-${fontType}`);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    return result;
  } catch (error) {
    console.error('Failed to load font:', error);
    return null;
  }
}

/**
 * Load both fonts from IndexedDB
 */
export async function loadPdfFonts(): Promise<{
  regular: StoredFont | null;
  bold: StoredFont | null;
}> {
  const [regular, bold] = await Promise.all([
    loadPdfFont('regular'),
    loadPdfFont('bold'),
  ]);
  return { regular, bold };
}

/**
 * Delete font from IndexedDB
 */
export async function deletePdfFont(fontType: 'regular' | 'bold'): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['fonts'], 'readwrite');
    const store = transaction.objectStore('fonts');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(`pdf-font-${fontType}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
  } catch (error) {
    console.error('Failed to delete font:', error);
  }
}

/**
 * Check if PDF fonts are configured
 */
export async function hasPdfFonts(): Promise<boolean> {
  const fonts = await loadPdfFonts();
  return fonts.regular !== null;
}
