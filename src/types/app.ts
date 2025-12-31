/**
 * UI Language codes
 */
export type UILanguage = 'en' | 'ja' | 'zh' | 'es' | 'ko';

/**
 * Book language codes (same as UI languages)
 */
export type BookLanguage = 'en' | 'ja' | 'zh' | 'es' | 'ko';

/**
 * Image stored in project
 */
export interface ProjectImage {
  id: string;
  name: string;
  data: ArrayBuffer;
  mimeType: string;
}

/**
 * File in the editor
 */
export interface EditorFile {
  id: string;
  name: string;
  content: string;
}

/**
 * Book metadata
 */
export interface BookMetadata {
  title: string;
  author: string;
  language: BookLanguage;
}

/**
 * Project data for save/load
 */
export interface ProjectData {
  version: string;
  files: EditorFile[];
  metadata: BookMetadata;
  uiLang: UILanguage;
  images: ProjectImage[];
}

/**
 * Manifest file in .mdebook ZIP
 */
export interface ProjectManifest {
  version: string;
  metadata: BookMetadata;
  uiLang: UILanguage;
  chapters: string[];  // file names in chapters/
  images: string[];    // file names in images/
}

/**
 * Export format types
 */
export type ExportFormat = 'epub' | 'pdf' | 'html' | 'markdown';

/**
 * Application state
 */
export interface AppState {
  files: EditorFile[];
  activeFileId: string;
  showPreview: boolean;
  isDark: boolean;
  showToc: boolean;
  vimEnabled: boolean;
  metadata: BookMetadata;
  showSettings: boolean;
  exportStatus: string;
  showImportModal: boolean;
  importUrl: string;
  importLoading: boolean;
  uiLang: UILanguage;
}

/**
 * Table of Contents item
 */
export interface TocItem {
  level: number;
  text: string;
  id: string;
}

/**
 * EPUB manifest item
 */
export interface EpubManifestItem {
  id: string;
  href: string;
  mediaType: string;
}

/**
 * EPUB spine item
 */
export interface EpubSpineItem {
  idref: string;
}

/**
 * EPUB TOC item
 */
export interface EpubTocItem {
  title: string;
  href: string;
}
