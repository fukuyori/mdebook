import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { UILanguage, EditorFile, BookMetadata, ExportFormat, ProjectImage } from '../types';
import { getTranslations, getSampleMarkdown, getColophonTemplate, getPrefaceTemplate, getChapterTitleTemplate, getBibliographyTemplate, getSavedLanguage, saveLanguage, LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../i18n/translations';
import { VERSION } from '../constants';
import { PRESET_THEMES, DEFAULT_THEME_ID, getThemeCss, type ThemeId } from '../themes';
import { 
  generateEpub, 
  generatePdf, 
  exportHtml,
  exportMarkdownZip,
  // New project utilities
  isFileSystemAccessSupported,
  shouldSaveAsProject,
  saveProjectAsZip,
  saveSingleMarkdown,
  loadProjectFromZip,
  loadSingleMarkdown,
  openFileWithFSA,
  openFileFallback,
  saveFileWithFSA,
  saveFileWithFSADialog,
  saveFileFallback,
  addImageFromFile,
  createImageObjectUrl,
  filterReferencedImages,
  // Storage utilities
  generateSessionId,
  generateProjectId,
  saveSession,
  loadSession,
  getMostRecentSession,
  isProjectBeingEdited,
  cleanupOldSessions,
} from '../utils';
import CodeMirrorEditor from './CodeMirrorEditor';
import Preview from './Preview';
import Icons from './Icons';

// File System Access API handle type
type FileSystemFileHandle = {
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }>;
  name: string;
};

/**
 * Main application component
 */
export const App: React.FC = () => {
  // Session management
  const [sessionId] = useState(() => {
    // Try to get existing session ID from sessionStorage
    const existing = sessionStorage.getItem('mdebook_session_id');
    if (existing) return existing;
    const newId = generateSessionId();
    sessionStorage.setItem('mdebook_session_id', newId);
    return newId;
  });
  const [projectId, setProjectId] = useState(() => generateProjectId());
  const [isInitialized, setIsInitialized] = useState(false);
  
  // File handle for overwrite saves
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);
  
  // UI state - load saved language or detect from browser
  const [uiLang, setUiLang] = useState<UILanguage>(getSavedLanguage);
  const t = getTranslations(uiLang);
  
  // Handler for language change - saves to localStorage
  const handleLanguageChange = useCallback((lang: UILanguage) => {
    setUiLang(lang);
    saveLanguage(lang);
  }, []);
  
  // Files state
  const [files, setFiles] = useState<EditorFile[]>(() => [
    { id: '1', name: 'Chapter1.md', content: getSampleMarkdown(t) },
  ]);
  const [activeFileId, setActiveFileId] = useState('1');
  
  // Images state
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  
  // File tab editing state
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [dragOverFileId, setDragOverFileId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after'>('before');
  
  // UI toggles
  const [showPreview, setShowPreview] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [_showToc, _setShowToc] = useState(false);
  const [vimEnabled, setVimEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [pendingProjectData, setPendingProjectData] = useState<{
    files: EditorFile[];
    metadata: BookMetadata;
    uiLang: UILanguage;
    images: ProjectImage[];
    projectId: string;
  } | null>(null);
  
  // Metadata
  const [metadata, setMetadata] = useState<BookMetadata>({
    title: 'My eBook',
    author: 'Author',
    language: 'en',
  });
  
  // Status
  const [exportStatus, setExportStatus] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  
  // Scroll sync
  const scrollSourceRef = useRef<'editor' | 'preview' | null>(null);
  const editorScrollRef = useRef<((ratio: number) => void) | null>(null);
  const previewScrollRef = useRef<((ratio: number) => void) | null>(null);
  
  // Editor focus
  const editorFocusRef = useRef<(() => void) | null>(null);
  
  // Focus editor helper
  const focusEditor = useCallback(() => {
    // Small delay to allow UI to update first
    setTimeout(() => {
      editorFocusRef.current?.();
    }, 10);
  }, []);
  
  // Auto-save timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get active file
  const activeFile = files.find(f => f.id === activeFileId);
  
  // Initialize: load session data or most recent project
  useEffect(() => {
    const initialize = async () => {
      // Clean up old sessions
      await cleanupOldSessions(7);
      
      // Try to load existing session
      const sessionData = await loadSession(sessionId);
      
      if (sessionData) {
        // Restore session (uiLang is NOT restored - managed via localStorage)
        setFiles(sessionData.files);
        setMetadata(sessionData.metadata);
        setImages(sessionData.images);
        setProjectId(sessionData.projectId);
        setActiveFileId(sessionData.files[0]?.id || '1');
      } else {
        // Try to get most recent session as a copy
        const recentData = await getMostRecentSession();
        if (recentData) {
          // Check if this project is being edited elsewhere
          const isEditing = await isProjectBeingEdited(recentData.projectId, sessionId);
          if (isEditing) {
            // Show warning but still load
            setPendingProjectData({
              files: recentData.files,
              metadata: recentData.metadata,
              uiLang: recentData.uiLang, // Kept for compatibility
              images: recentData.images,
              projectId: recentData.projectId,
            });
            setShowConflictWarning(true);
          } else {
            // Restore session (uiLang is NOT restored - managed via localStorage)
            setFiles(recentData.files);
            setMetadata(recentData.metadata);
            setImages(recentData.images);
            setProjectId(recentData.projectId);
            setActiveFileId(recentData.files[0]?.id || '1');
          }
        }
      }
      
      setIsInitialized(true);
    };
    
    initialize();
  }, [sessionId]);
  
  // Auto-save effect
  useEffect(() => {
    if (!isInitialized) return;
    
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Set new timer for auto-save (5 seconds after last change)
    autoSaveTimerRef.current = setTimeout(() => {
      saveSession(sessionId, projectId, files, metadata, uiLang, images);
    }, 5000);
    
    // Also save immediately on beforeunload
    const handleBeforeUnload = () => {
      saveSession(sessionId, projectId, files, metadata, uiLang, images);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isInitialized, sessionId, projectId, files, metadata, uiLang, images]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+` to toggle VIM mode
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setVimEnabled(prev => !prev);
        focusEditor();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusEditor]);
  
  // Create and manage image object URLs (name -> URL map for preview)
  useEffect(() => {
    const newUrls = new Map<string, string>();
    const oldUrlValues: string[] = [];
    
    // Collect old URLs for cleanup
    imageUrls.forEach(url => oldUrlValues.push(url));
    
    // Create new URLs keyed by image name
    images.forEach(img => {
      // Check if we already have a URL for this image
      const existingUrl = imageUrls.get(img.name);
      if (existingUrl) {
        newUrls.set(img.name, existingUrl);
      } else {
        newUrls.set(img.name, createImageObjectUrl(img));
      }
    });
    
    // Revoke old URLs that are no longer in use
    oldUrlValues.forEach(url => {
      let stillInUse = false;
      newUrls.forEach(newUrl => {
        if (newUrl === url) stillInUse = true;
      });
      if (!stillInUse) {
        URL.revokeObjectURL(url);
      }
    });
    
    setImageUrls(newUrls);
    
    // Cleanup on unmount
    return () => {
      newUrls.forEach(url => URL.revokeObjectURL(url));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);
  
  // Handle editor scroll - sync to preview
  const handleEditorScroll = useCallback((ratio: number) => {
    if (scrollSourceRef.current === 'preview') return;
    scrollSourceRef.current = 'editor';
    previewScrollRef.current?.(ratio);
    setTimeout(() => { scrollSourceRef.current = null; }, 50);
  }, []);
  
  // Handle preview scroll - sync to editor
  const handlePreviewScroll = useCallback((ratio: number) => {
    if (scrollSourceRef.current === 'editor') return;
    scrollSourceRef.current = 'preview';
    editorScrollRef.current?.(ratio);
    setTimeout(() => { scrollSourceRef.current = null; }, 50);
  }, []);
  
  // Update file content
  const updateFileContent = useCallback((content: string) => {
    setFiles(prev => prev.map(f =>
      f.id === activeFileId ? { ...f, content } : f
    ));
  }, [activeFileId]);
  
  // Add new file
  const addNewFile = useCallback(() => {
    const newId = Date.now().toString();
    const newFile: EditorFile = {
      id: newId,
      name: `${t.defaultFileName}${files.length + 1}.md`,
      content: `# ${t.newChapter}\n\n${t.writeContentHere}`,
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newId);
  }, [files.length, t.defaultFileName, t.newChapter, t.writeContentHere]);
  
  // Add colophon template
  const addColophonTemplate = useCallback(() => {
    // Check if colophon already exists
    const hasColophon = files.some(f => 
      f.name.toLowerCase() === 'colophon.md' || f.name === '奥付.md'
    );
    if (hasColophon) {
      alert(uiLang === 'ja' ? '奥付ファイルは既に存在します' : 'Colophon file already exists');
      return;
    }
    
    const newId = Date.now().toString();
    const fileName = uiLang === 'ja' ? '奥付.md' : 'colophon.md';
    const newFile: EditorFile = {
      id: newId,
      name: fileName,
      content: getColophonTemplate(t, { title: metadata.title, author: metadata.author }),
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newId);
  }, [files, uiLang, t, metadata.title, metadata.author]);
  
  // Add preface template
  const addPrefaceTemplate = useCallback(() => {
    const newId = Date.now().toString();
    const fileName = uiLang === 'ja' ? 'はじめに.md' : 'preface.md';
    const newFile: EditorFile = {
      id: newId,
      name: fileName,
      content: getPrefaceTemplate(t),
    };
    // Insert at beginning
    setFiles(prev => [newFile, ...prev]);
    setActiveFileId(newId);
  }, [uiLang, t]);
  
  // Add chapter title page template
  const addChapterTitleTemplate = useCallback(() => {
    // Count existing chapter title pages to determine chapter number
    const chapterTitleCount = files.filter(f => 
      f.name.match(/^(chapter|章扉|제|capítulo|第)/i) && f.content.includes('chapter-title-page')
    ).length;
    const chapterNumber = chapterTitleCount + 1;
    
    const newId = Date.now().toString();
    const fileNames: Record<string, string> = {
      ja: `章扉${chapterNumber}.md`,
      en: `chapter${chapterNumber}-title.md`,
      zh: `第${chapterNumber}章扉页.md`,
      es: `capitulo${chapterNumber}-portada.md`,
      ko: `제${chapterNumber}장표지.md`,
    };
    const fileName = fileNames[uiLang] || fileNames.en;
    
    const newFile: EditorFile = {
      id: newId,
      name: fileName,
      content: getChapterTitleTemplate(uiLang, chapterNumber),
    };
    
    // Insert after current active file
    setFiles(prev => {
      const activeIndex = prev.findIndex(f => f.id === activeFileId);
      const insertIndex = activeIndex >= 0 ? activeIndex + 1 : prev.length;
      const newFiles = [...prev];
      newFiles.splice(insertIndex, 0, newFile);
      return newFiles;
    });
    setActiveFileId(newId);
  }, [files, uiLang, activeFileId]);
  
  // Add bibliography template
  const addBibliographyTemplate = useCallback(() => {
    // Check if bibliography already exists
    const hasBibliography = files.some(f => 
      f.name.toLowerCase() === 'bibliography.md' || 
      f.name === '参考文献.md' ||
      f.name === '참고문헌.md'
    );
    if (hasBibliography) {
      alert(uiLang === 'ja' ? '参考文献ファイルは既に存在します' : 'Bibliography file already exists');
      return;
    }
    
    const newId = Date.now().toString();
    const fileNames: Record<string, string> = {
      ja: '参考文献.md',
      en: 'bibliography.md',
      zh: '参考文献.md',
      es: 'bibliografia.md',
      ko: '참고문헌.md',
    };
    const fileName = fileNames[uiLang] || fileNames.en;
    
    const newFile: EditorFile = {
      id: newId,
      name: fileName,
      content: getBibliographyTemplate(uiLang),
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newId);
  }, [files, uiLang]);
  
  // Template menu state
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  
  // Delete file
  const deleteFile = useCallback((id: string) => {
    if (files.length <= 1) return;
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);
    if (activeFileId === id) {
      setActiveFileId(newFiles[0].id);
    }
  }, [files, activeFileId]);
  
  // Rename file
  const renameFile = useCallback((id: string, newName: string) => {
    if (!newName.trim()) return;
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, name: newName.trim() } : f
    ));
  }, []);
  
  // Start editing file name
  const startEditingFileName = useCallback((file: EditorFile) => {
    setEditingFileId(file.id);
    setEditingFileName(file.name);
  }, []);
  
  // Finish editing file name
  const finishEditingFileName = useCallback(() => {
    if (editingFileId && editingFileName.trim()) {
      renameFile(editingFileId, editingFileName);
    }
    setEditingFileId(null);
    setEditingFileName('');
  }, [editingFileId, editingFileName, renameFile]);
  
  // Apply project data (used after conflict warning confirmation and drag/drop)
  const applyProjectData = useCallback((data: {
    files: EditorFile[];
    metadata: BookMetadata;
    uiLang: UILanguage; // Kept for compatibility but not applied to UI
    images: ProjectImage[];
    projectId: string;
  }) => {
    setFiles(data.files);
    setMetadata(data.metadata);
    // Note: uiLang is NOT applied here - UI language is managed separately via localStorage
    setImages(data.images);
    setProjectId(data.projectId);
    setActiveFileId(data.files[0]?.id || '1');
    fileHandleRef.current = null; // Clear file handle for new project
  }, []);
  
  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, fileId: string) => {
    setDraggedFileId(fileId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);
  
  // Handle drag over (for both internal reorder and external file drop)
  const handleDragOver = useCallback((e: React.DragEvent, fileId: string) => {
    e.preventDefault();
    
    // Determine if drop should be before or after this tab
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'before' : 'after';
    
    // Check if it's an external file drop
    const hasFiles = e.dataTransfer.types.includes('Files');
    
    if (hasFiles && !draggedFileId) {
      // External file drop
      e.dataTransfer.dropEffect = 'copy';
      setDragOverFileId(fileId);
      setDragOverPosition(position);
    } else if (draggedFileId && fileId !== draggedFileId) {
      // Internal reorder
      e.dataTransfer.dropEffect = 'move';
      setDragOverFileId(fileId);
      setDragOverPosition(position);
    }
  }, [draggedFileId]);
  
  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setDragOverFileId(null);
  }, []);
  
  // Handle drop - reorder files or import external files at position
  const handleDrop = useCallback(async (e: React.DragEvent, targetFileId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent global drop handler
    
    // Determine insert position based on mouse position
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertAfter = e.clientY >= midY;
    
    // Check for external files first
    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    
    if (droppedFiles.length > 0 && !draggedFileId) {
      // External file drop - import at this position
      const targetIndex = files.findIndex(f => f.id === targetFileId);
      const insertIndex = insertAfter ? targetIndex + 1 : targetIndex;
      
      // Check if any .mdebook file is dropped - if so, open it (replace project)
      const projectFile = droppedFiles.find(f => f.name.endsWith('.mdebook'));
      if (projectFile) {
        try {
          const buffer = await projectFile.arrayBuffer();
          const projectData = await loadProjectFromZip(buffer);
          if (projectData) {
            const newProjectId = generateProjectId();
            applyProjectData({
              files: projectData.files,
              metadata: projectData.metadata,
              uiLang: projectData.uiLang,
              images: projectData.images,
              projectId: newProjectId,
            });
            fileHandleRef.current = null;
            setExportStatus(t.projectLoaded);
            setTimeout(() => setExportStatus(''), 2000);
            focusEditor();
          }
        } catch (error) {
          console.error('Failed to open project:', error);
        }
        setDragOverFileId(null);
        return;
      }
      
      // Filter for markdown/text files
      const markdownFiles = droppedFiles.filter(f => 
        f.name.endsWith('.md') ||
        f.name.endsWith('.markdown') ||
        f.name.endsWith('.txt')
      );
      
      if (markdownFiles.length > 0) {
        const importedFiles: EditorFile[] = [];
        
        for (const file of markdownFiles) {
          const content = await file.text();
          const newId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
          importedFiles.push({ id: newId, name: file.name, content });
        }
        
        if (importedFiles.length > 0) {
          // Insert at the target position
          setFiles(prev => {
            const newFiles = [...prev];
            const finalIndex = insertIndex >= 0 ? Math.min(insertIndex, newFiles.length) : newFiles.length;
            newFiles.splice(finalIndex, 0, ...importedFiles);
            return newFiles;
          });
          setActiveFileId(importedFiles[0].id);
          setExportStatus(`${importedFiles.length} ${t.filesImported}`);
          setTimeout(() => setExportStatus(''), 2000);
          focusEditor();
        }
      }
      
      setDragOverFileId(null);
      return;
    }
    
    // Internal reorder
    if (!draggedFileId || draggedFileId === targetFileId) {
      setDraggedFileId(null);
      setDragOverFileId(null);
      return;
    }
    
    setFiles(prev => {
      const draggedIndex = prev.findIndex(f => f.id === draggedFileId);
      const targetIndex = prev.findIndex(f => f.id === targetFileId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      
      const newFiles = [...prev];
      const [draggedFile] = newFiles.splice(draggedIndex, 1);
      
      // Calculate insert position (after removing dragged item)
      let insertIdx = targetIndex;
      if (insertAfter) {
        insertIdx = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
      } else {
        insertIdx = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
      }
      
      newFiles.splice(insertIdx, 0, draggedFile);
      return newFiles;
    });
    
    setDraggedFileId(null);
    setDragOverFileId(null);
  }, [draggedFileId, files, t.filesImported, t.projectLoaded, focusEditor, applyProjectData]);
  
  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedFileId(null);
    setDragOverFileId(null);
  }, []);
  
  // Open file/project from disk (replaces existing data)
  const handleOpen = useCallback(async () => {
    if (isFileSystemAccessSupported()) {
      const result = await openFileWithFSA();
      if (result) {
        // Check for conflict
        const newProjectId = generateProjectId();
        const isEditing = await isProjectBeingEdited(newProjectId, sessionId);
        
        if (isEditing) {
          setPendingProjectData({
            files: result.data.files,
            metadata: result.data.metadata,
            uiLang: result.data.uiLang,
            images: result.data.images,
            projectId: newProjectId,
          });
          setShowConflictWarning(true);
        } else {
          applyProjectData({
            files: result.data.files,
            metadata: result.data.metadata,
            uiLang: result.data.uiLang,
            images: result.data.images,
            projectId: newProjectId,
          });
          fileHandleRef.current = result.handle as FileSystemFileHandle;
          setExportStatus(t.fileOpened);
          setTimeout(() => setExportStatus(''), 2000);
        }
      }
    } else {
      // Fallback for unsupported browsers
      const result = await openFileFallback();
      if (result) {
        const newProjectId = generateProjectId();
        applyProjectData({
          files: result.files,
          metadata: result.metadata,
          uiLang: result.uiLang,
          images: result.images,
          projectId: newProjectId,
        });
        setExportStatus(t.fileOpened);
        setTimeout(() => setExportStatus(''), 2000);
      }
    }
  }, [sessionId, applyProjectData, t.fileOpened]);
  
  // Save project/file (always shows dialog)
  const handleSave = useCallback(async (suggestedName?: string) => {
    // Filter out unreferenced images before saving (keep cover image)
    const usedImages = filterReferencedImages(files, images, metadata.coverImageId);
    
    const isProject = shouldSaveAsProject(files, usedImages);
    const defaultName = isProject 
      ? `${metadata.title || 'project'}.mdebook`
      : files[0]?.name || 'document.md';
    const filename = suggestedName || defaultName;
    
    // Create blob
    let blob: Blob;
    if (isProject) {
      blob = await saveProjectAsZip(files, metadata, uiLang, usedImages, VERSION);
    } else {
      blob = saveSingleMarkdown(files[0]);
    }
    
    // Show save dialog or use fallback
    if (isFileSystemAccessSupported()) {
      const handle = await saveFileWithFSADialog(blob, filename, isProject);
      if (handle) {
        fileHandleRef.current = handle;
        setExportStatus(t.projectSaved);
        setTimeout(() => setExportStatus(''), 2000);
      }
    } else {
      saveFileFallback(blob, filename);
      setExportStatus(t.projectSaved);
      setTimeout(() => setExportStatus(''), 2000);
    }
  }, [files, images, metadata, uiLang, t.projectSaved]);
  
  // Save project/file with overwrite (no dialog if handle exists)
  const handleSaveOverwrite = useCallback(async () => {
    // Filter out unreferenced images before saving (keep cover image)
    const usedImages = filterReferencedImages(files, images, metadata.coverImageId);
    
    const isProject = shouldSaveAsProject(files, usedImages);
    const defaultName = isProject 
      ? `${metadata.title || 'project'}.mdebook`
      : files[0]?.name || 'document.md';
    
    // Create blob
    let blob: Blob;
    if (isProject) {
      blob = await saveProjectAsZip(files, metadata, uiLang, usedImages, VERSION);
    } else {
      blob = saveSingleMarkdown(files[0]);
    }
    
    // If we have a file handle, overwrite without dialog
    if (fileHandleRef.current) {
      const success = await saveFileWithFSA(fileHandleRef.current, blob);
      if (success) {
        setExportStatus(t.projectSaved);
        setTimeout(() => setExportStatus(''), 2000);
        return;
      }
    }
    
    // No handle - show dialog
    if (isFileSystemAccessSupported()) {
      const handle = await saveFileWithFSADialog(blob, defaultName, isProject);
      if (handle) {
        fileHandleRef.current = handle;
        setExportStatus(t.projectSaved);
        setTimeout(() => setExportStatus(''), 2000);
      }
    } else {
      saveFileFallback(blob, defaultName);
      setExportStatus(t.projectSaved);
      setTimeout(() => setExportStatus(''), 2000);
    }
  }, [files, images, metadata, uiLang, t.projectSaved]);
  
  // Import files from local (adds to existing project)
  const handleImportFromFiles = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt,.markdown,.mdebook';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const selectedFiles = Array.from(target.files || []);
      
      const importedFiles: EditorFile[] = [];
      const importedImages: ProjectImage[] = [];
      
      for (const file of selectedFiles) {
        if (file.name.endsWith('.mdebook')) {
          // Import from project file
          try {
            const buffer = await file.arrayBuffer();
            const projectData = await loadProjectFromZip(buffer);
            if (projectData) {
              // Add files with new IDs
              for (const f of projectData.files) {
                importedFiles.push({
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                  name: f.name,
                  content: f.content,
                });
              }
              // Add images with new IDs
              for (const img of projectData.images) {
                importedImages.push({
                  ...img,
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                });
              }
            }
          } catch (error) {
            console.error('Failed to import project:', error);
          }
        } else {
          // Import markdown file
          const content = await file.text();
          const newId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
          importedFiles.push({ id: newId, name: file.name, content });
        }
      }
      
      if (importedFiles.length > 0) {
        // Insert after currently active file
        setFiles(prev => {
          const activeIndex = prev.findIndex(f => f.id === activeFileId);
          const insertIndex = activeIndex >= 0 ? activeIndex + 1 : prev.length;
          const newFiles = [...prev];
          newFiles.splice(insertIndex, 0, ...importedFiles);
          return newFiles;
        });
        setActiveFileId(importedFiles[0].id);
      }
      if (importedImages.length > 0) {
        setImages(prev => [...prev, ...importedImages]);
      }
      
      if (importedFiles.length > 0 || importedImages.length > 0) {
        setShowImportModal(false);
        setExportStatus(`${importedFiles.length} ${t.filesImported}`);
        setTimeout(() => setExportStatus(''), 2000);
      }
    };
    
    input.click();
  }, [t.filesImported, activeFileId]);
  
  // Handle dropped files globally (from drag & drop anywhere in the app)
  const handleGlobalDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    
    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    if (droppedFiles.length === 0) return;
    
    // Check if any .mdebook file is dropped - if so, open it (replace project)
    const projectFile = droppedFiles.find(f => f.name.endsWith('.mdebook'));
    if (projectFile) {
      try {
        const buffer = await projectFile.arrayBuffer();
        const projectData = await loadProjectFromZip(buffer);
        if (projectData) {
          const newProjectId = generateProjectId();
          applyProjectData({
            files: projectData.files,
            metadata: projectData.metadata,
            uiLang: projectData.uiLang,
            images: projectData.images,
            projectId: newProjectId,
          });
          fileHandleRef.current = null; // Clear handle since we opened from drop
          setExportStatus(t.projectLoaded);
          setTimeout(() => setExportStatus(''), 2000);
          focusEditor();
        }
      } catch (error) {
        console.error('Failed to open project:', error);
      }
      return;
    }
    
    // Filter for markdown/text files only
    const markdownFiles = droppedFiles.filter(f => 
      f.name.endsWith('.md') ||
      f.name.endsWith('.markdown') ||
      f.name.endsWith('.txt')
    );
    
    if (markdownFiles.length === 0) return;
    
    // Import markdown files
    const importedFiles: EditorFile[] = [];
    
    for (const file of markdownFiles) {
      const content = await file.text();
      const newId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      importedFiles.push({ id: newId, name: file.name, content });
    }
    
    if (importedFiles.length > 0) {
      // Insert after currently active file
      setFiles(prev => {
        const activeIndex = prev.findIndex(f => f.id === activeFileId);
        const insertIndex = activeIndex >= 0 ? activeIndex + 1 : prev.length;
        const newFiles = [...prev];
        newFiles.splice(insertIndex, 0, ...importedFiles);
        return newFiles;
      });
      setActiveFileId(importedFiles[0].id);
      setExportStatus(`${importedFiles.length} ${t.filesImported}`);
      setTimeout(() => setExportStatus(''), 2000);
      focusEditor();
    }
  }, [t.filesImported, t.projectLoaded, focusEditor, applyProjectData, activeFileId]);
  
  // Handle drag over globally
  const handleGlobalDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer?.types.includes('Files')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);
  
  // Import from URL (adds to existing project)
  const handleImportFromUrl = useCallback(async (url?: string) => {
    const targetUrl = url || importUrl.trim();
    if (!targetUrl) return;
    
    setImportLoading(true);
    try {
      let processedUrl = targetUrl;
      
      // Convert Qiita URLs
      if (processedUrl.includes('qiita.com') && !processedUrl.endsWith('.md')) {
        processedUrl += '.md';
      }
      
      // Convert GitHub URLs to raw
      if (processedUrl.includes('github.com') && !processedUrl.includes('raw.githubusercontent.com')) {
        processedUrl = processedUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      }
      
      // Try direct fetch first, then fallback to CORS proxies
      let response: Response | null = null;
      let content = '';
      
      // Direct fetch (works for GitHub raw, etc.)
      try {
        response = await fetch(processedUrl);
        if (response.ok) {
          content = await response.text();
        }
      } catch {
        // Direct fetch failed, try proxies
      }
      
      // If direct fetch failed, try CORS proxies
      if (!content) {
        const corsProxies = [
          (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
          (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        ];
        
        for (const getProxyUrl of corsProxies) {
          try {
            const proxyUrl = getProxyUrl(processedUrl);
            response = await fetch(proxyUrl);
            if (response.ok) {
              content = await response.text();
              break;
            }
          } catch {
            // Try next proxy
          }
        }
      }
      
      if (!content) {
        throw new Error('Failed to fetch URL (all proxies failed)');
      }
      
      const fileName = processedUrl.split('/').pop() || 'imported.md';
      
      const newId = Date.now().toString();
      const newFile: EditorFile = { id: newId, name: fileName, content };
      
      // Insert after currently active file
      setFiles(prev => {
        const activeIndex = prev.findIndex(f => f.id === activeFileId);
        const insertIndex = activeIndex >= 0 ? activeIndex + 1 : prev.length;
        const newFiles = [...prev];
        newFiles.splice(insertIndex, 0, newFile);
        return newFiles;
      });
      setActiveFileId(newId);
      
      setShowImportModal(false);
      setImportUrl('');
      setExportStatus(t.importComplete);
      setTimeout(() => setExportStatus(''), 2000);
    } catch (error) {
      setExportStatus(`${t.importError}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setExportStatus(''), 3000);
    } finally {
      setImportLoading(false);
    }
  }, [importUrl, t.importComplete, t.importError, activeFileId]);
  
  // Add image to project (returns image reference for insertion)
  const handleImageAdd = useCallback(async (file: File): Promise<string | null> => {
    try {
      const image = await addImageFromFile(file);
      setImages(prev => [...prev, image]);
      setExportStatus(t.imageAdded);
      setTimeout(() => setExportStatus(''), 2000);
      return `![${image.name}](images/${image.name})`;
    } catch (error) {
      console.error('Failed to add image:', error);
      return null;
    }
  }, [t.imageAdded]);
  
  // Add image via file picker
  const handleAddImageFromPicker = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const imageRef = await handleImageAdd(file);
        if (imageRef && activeFile) {
          // Append to end of content
          updateFileContent(activeFile.content + '\n\n' + imageRef);
        }
      }
    };
    input.click();
  }, [handleImageAdd, activeFile, updateFileContent]);
  
  // VIM :e command handler
  const handleVimEdit = useCallback((arg?: string) => {
    // :e always opens file/project dialog (replaces current project)
    handleOpen();
  }, [handleOpen]);
  
  // VIM :imp command handler
  const handleVimImport = useCallback((arg?: string) => {
    if (!arg) {
      // :imp with no argument - show import dialog
      setShowImportModal(true);
    } else if (arg.startsWith('http://') || arg.startsWith('https://')) {
      // :imp URL - import from URL
      handleImportFromUrl(arg);
    } else {
      // :imp filename - show dialog (browser can't access filesystem directly)
      setShowImportModal(true);
    }
  }, [handleImportFromUrl]);
  
  // VIM :w command handler (always shows dialog)
  const handleVimWrite = useCallback((arg?: string) => {
    if (arg) {
      // :w filename - save with dialog, suggested name
      handleSave(arg);
    } else {
      // :w with no argument - show dialog
      handleSave();
    }
  }, [handleSave]);
  
  // VIM :w! command handler (overwrite without dialog)
  const handleVimWriteForce = useCallback(() => {
    handleSaveOverwrite();
  }, [handleSaveOverwrite]);
  
  // VIM :q command handler
  const handleVimQuit = useCallback(() => {
    if (activeFile && files.length > 1) {
      deleteFile(activeFile.id);
    }
  }, [activeFile, files.length, deleteFile]);
  
  // Export handler
  const handleExport = useCallback(async (format: ExportFormat) => {
    try {
      switch (format) {
        case 'epub':
          await generateEpub(files, metadata, images, setExportStatus);
          break;
        case 'pdf':
          await generatePdf(files, metadata, isDark, setExportStatus);
          break;
        case 'html':
          await exportHtml(files, metadata, isDark, setExportStatus);
          break;
        case 'markdown':
          await exportMarkdownZip(files, metadata, images, setExportStatus);
          break;
      }
    } catch (error) {
      setExportStatus(`${t.error}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setTimeout(() => setExportStatus(''), 3000);
  }, [files, metadata, isDark, images, t.error]);
  
  // Calculate total characters
  const totalChars = files.reduce((sum, f) => sum + f.content.length, 0);
  
  // Get image URL for markdown preview
  const getImageUrl = useCallback((imageName: string): string => {
    const image = images.find(img => img.name === imageName);
    if (image) {
      return imageUrls.get(image.id) || '';
    }
    return '';
  }, [images, imageUrls]);
  
  return (
    <div 
      className={`h-screen flex flex-col ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}
      onDrop={handleGlobalDrop}
      onDragOver={handleGlobalDragOver}
    >
      {/* Header */}
      <header className={`flex items-center justify-between px-4 py-2 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Icons.Book size={20} />
            {t.appTitle}
            <span className="text-xs opacity-60">v{VERSION}</span>
          </h1>
        </div>
        
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          {/* VIM toggle */}
          <button
            onClick={() => { setVimEnabled(!vimEnabled); focusEditor(); }}
            className={`px-2 py-1 rounded text-sm ${
              vimEnabled
                ? 'bg-green-600 text-white'
                : isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}
            title="Ctrl+`"
          >
            {t.vim}
          </button>
          
          {/* Open */}
          <button
            onClick={() => { handleOpen(); focusEditor(); }}
            className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title={t.open}
          >
            <Icons.Folder size={16} />
          </button>
          
          {/* Save */}
          <button
            onClick={() => { handleSave(); focusEditor(); }}
            className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title={t.save}
          >
            <Icons.Save size={16} />
          </button>
          
          {/* Import */}
          <button
            onClick={() => setShowImportModal(true)}
            className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title={t.importFile}
          >
            <Icons.Download size={16} />
          </button>
          
          {/* Export menu */}
          <div className="relative group">
            <button className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title={t.export}>
              <Icons.Upload size={16} />
            </button>
            <div className={`absolute right-0 top-full mt-1 py-1 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <button onClick={() => { handleExport('epub'); focusEditor(); }} className={`block w-full px-4 py-2 text-left text-sm ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                EPUB
              </button>
              <button onClick={() => { handleExport('pdf'); focusEditor(); }} className={`block w-full px-4 py-2 text-left text-sm ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                PDF
              </button>
              <button onClick={() => { handleExport('html'); focusEditor(); }} className={`block w-full px-4 py-2 text-left text-sm ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                HTML
              </button>
              <button onClick={() => { handleExport('markdown'); focusEditor(); }} className={`block w-full px-4 py-2 text-left text-sm ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                {t.exportMarkdown}
              </button>
            </div>
          </div>
          
          {/* Image */}
          <button
            onClick={handleAddImageFromPicker}
            className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title={t.insertImage}
          >
            <Icons.Image size={16} />
          </button>
          
          {/* Preview toggle */}
          <button
            onClick={() => { setShowPreview(!showPreview); focusEditor(); }}
            className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title={showPreview ? t.hidePreview : t.showPreview}
          >
            {showPreview ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
          </button>
          
          {/* Theme toggle */}
          <button
            onClick={() => { setIsDark(!isDark); focusEditor(); }}
            className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title={isDark ? t.lightMode : t.darkMode}
          >
            {isDark ? <Icons.Sun size={16} /> : <Icons.Moon size={16} />}
          </button>
          
          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title={t.settings}
          >
            <Icons.Settings size={16} />
          </button>
          
          {/* Language */}
          <select
            value={uiLang}
            onChange={(e) => { handleLanguageChange(e.target.value as UILanguage); focusEditor(); }}
            className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{LANGUAGE_NAMES[lang]}</option>
            ))}
          </select>
        </div>
      </header>
      
      {/* Settings panel */}
      {showSettings && (
        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-6 flex-wrap">
            <label className="flex items-center gap-2">
              <span className="text-sm">{t.title}:</span>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border`}
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm">{t.author}:</span>
              <input
                type="text"
                value={metadata.author}
                onChange={(e) => setMetadata(prev => ({ ...prev, author: e.target.value }))}
                className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border`}
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm">{t.language}:</span>
              <select
                value={metadata.language}
                onChange={(e) => setMetadata(prev => ({ ...prev, language: e.target.value as UILanguage }))}
                className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border`}
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{LANGUAGE_NAMES[lang]}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm">{t.coverImage}:</span>
              <select
                value={metadata.coverImageId || ''}
                onChange={(e) => setMetadata(prev => ({ ...prev, coverImageId: e.target.value || undefined }))}
                className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border`}
              >
                <option value="">{t.noCover}</option>
                {images.map(img => (
                  <option key={img.id} value={img.id}>{img.name}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm">{t.theme}:</span>
              <select
                value={metadata.themeId || DEFAULT_THEME_ID}
                onChange={(e) => setMetadata(prev => ({ ...prev, themeId: e.target.value as ThemeId }))}
                className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border`}
              >
                {PRESET_THEMES.map(theme => (
                  <option key={theme.id} value={theme.id}>
                    {theme.id === 'classic' ? t.themeClassic :
                     theme.id === 'modern' ? t.themeModern :
                     theme.id === 'technical' ? t.themeTechnical :
                     theme.id === 'novel' ? t.themeNovel :
                     theme.id === 'academic' ? t.themeAcademic :
                     theme.name}
                  </option>
                ))}
                <option value="custom">{t.themeCustom}{metadata.customCss ? ' ✓' : ''}</option>
              </select>
              {/* CSS Import button */}
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.css,text/css';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const text = await file.text();
                      setMetadata(prev => ({ ...prev, customCss: text, themeId: 'custom' }));
                      setExportStatus(t.customCssLoaded);
                      setTimeout(() => setExportStatus(''), 2000);
                    }
                  };
                  input.click();
                }}
                className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                title={t.importCss}
              >
                ↑ CSS
              </button>
              {/* CSS Export button */}
              <button
                onClick={() => {
                  const themeId = (metadata.themeId || DEFAULT_THEME_ID) as ThemeId;
                  const css = themeId === 'custom' && metadata.customCss 
                    ? metadata.customCss 
                    : getThemeCss(themeId);
                  const blob = new Blob([css], { type: 'text/css' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `theme-${themeId}.css`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                title={t.exportCss}
              >
                ↓ CSS
              </button>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm">{t.tocDepth}:</span>
              <select
                value={metadata.tocDepth ?? 2}
                onChange={(e) => setMetadata(prev => ({ ...prev, tocDepth: parseInt(e.target.value) }))}
                className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border`}
              >
                <option value={0}>{t.tocDepthNone}</option>
                <option value={1}>h1</option>
                <option value={2}>h1-h2</option>
                <option value={3}>h1-h3</option>
              </select>
            </label>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Vertical file tabs on the left */}
        <div className={`w-48 flex-shrink-0 flex flex-col border-r ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex-1 overflow-y-auto py-2">
            {files.map(file => (
              <div
                key={file.id}
                draggable={editingFileId !== file.id}
                onDragStart={(e) => handleDragStart(e, file.id)}
                onDragOver={(e) => handleDragOver(e, file.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, file.id)}
                onDragEnd={handleDragEnd}
                onClick={(e) => {
                  if (editingFileId !== file.id) {
                    setActiveFileId(file.id);
                    // Don't focus editor on single click - wait to see if it's a double click
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startEditingFileName(file);
                }}
                className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 cursor-pointer transition-all ${
                  file.id === activeFileId
                    ? isDark ? 'bg-gray-700 border-l-2 border-blue-500' : 'bg-gray-200 border-l-2 border-blue-500'
                    : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                } ${
                  dragOverFileId === file.id && draggedFileId !== file.id
                    ? dragOverPosition === 'before'
                      ? isDark ? 'border-t-2 border-blue-400' : 'border-t-2 border-blue-500'
                      : isDark ? 'border-b-2 border-blue-400' : 'border-b-2 border-blue-500'
                    : ''
                } ${
                  draggedFileId === file.id ? 'opacity-50' : ''
                }`}
              >
                <Icons.File size={14} className="flex-shrink-0" />
                {editingFileId === file.id ? (
                  <input
                    type="text"
                    value={editingFileName}
                    onChange={(e) => setEditingFileName(e.target.value)}
                    onBlur={finishEditingFileName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishEditingFileName();
                      if (e.key === 'Escape') {
                        setEditingFileId(null);
                        setEditingFileName('');
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className={`flex-1 px-1 text-sm outline-none border rounded ${
                      isDark ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'
                    }`}
                  />
                ) : (
                  <span className="truncate flex-1">{file.name}</span>
                )}
                {files.length > 1 && editingFileId !== file.id && (
                  <span
                    onClick={(e) => { e.stopPropagation(); deleteFile(file.id); focusEditor(); }}
                    className="opacity-50 hover:opacity-100 flex-shrink-0"
                  >
                    <Icons.X size={12} />
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {/* New file buttons */}
          <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => { addNewFile(); focusEditor(); }}
              className={`w-full px-3 py-2 text-sm flex items-center gap-2 ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title={t.newFile}
            >
              <Icons.Plus size={14} />
              {t.newFile}
            </button>
            
            {/* Template menu */}
            <div className="relative">
              <button
                onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                className={`w-full px-3 py-2 text-sm flex items-center gap-2 border-t ${
                  isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'
                }`}
                title={t.addTemplate}
              >
                <Icons.File size={14} />
                {t.addTemplate}
                <span className="ml-auto text-xs">▼</span>
              </button>
              
              {showTemplateMenu && (
                <div className={`absolute bottom-full left-0 w-full shadow-lg z-50 ${
                  isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                  <button
                    onClick={() => { addColophonTemplate(); setShowTemplateMenu(false); focusEditor(); }}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    📋 {t.templateColophon}
                  </button>
                  <button
                    onClick={() => { addPrefaceTemplate(); setShowTemplateMenu(false); focusEditor(); }}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 border-t ${
                      isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    📖 {t.templatePreface}
                  </button>
                  <button
                    onClick={() => { addChapterTitleTemplate(); setShowTemplateMenu(false); focusEditor(); }}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 border-t ${
                      isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    📑 {t.templateChapterTitle}
                  </button>
                  <button
                    onClick={() => { addBibliographyTemplate(); setShowTemplateMenu(false); focusEditor(); }}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 border-t ${
                      isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    📚 {t.templateBibliography}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Editor */}
        <div className={`flex-1 min-w-0 h-full border-r ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          {activeFile && (
            <CodeMirrorEditor
              value={activeFile.content}
              onChange={updateFileContent}
              isDark={isDark}
              vimEnabled={vimEnabled}
              onScroll={handleEditorScroll}
              scrollToRef={editorScrollRef}
              focusRef={editorFocusRef}
              onVimEdit={handleVimEdit}
              onVimWrite={handleVimWrite}
              onVimWriteForce={handleVimWriteForce}
              onVimQuit={handleVimQuit}
              onVimImport={handleVimImport}
              onImageAdd={handleImageAdd}
            />
          )}
        </div>
        
        {/* Preview */}
        {showPreview && (
          <div className="flex-1 min-w-0 h-full" onClick={focusEditor}>
            <Preview
              content={activeFile?.content || ''}
              isDark={isDark}
              onScroll={handlePreviewScroll}
              scrollToRef={previewScrollRef}
              imageUrls={imageUrls}
            />
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className={`flex items-center justify-between px-4 py-1 text-xs border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center gap-4">
          <span>{files.length} {t.files}</span>
          <span>{totalChars.toLocaleString()} {t.characters}</span>
        </div>
        {exportStatus && (
          <span className="text-yellow-500">{exportStatus}</span>
        )}
      </footer>
      
      {/* Import URL Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-96 p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-lg font-bold mb-4">{t.importFile}</h2>
            
            {/* File selection */}
            <div className="mb-4">
              <button
                onClick={() => { handleImportFromFiles(); }}
                className={`w-full px-4 py-3 rounded border-2 border-dashed flex items-center justify-center gap-2 ${
                  isDark 
                    ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <Icons.Folder size={20} />
                <span>{t.selectFiles}</span>
              </button>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t.supportedFormats}
              </p>
            </div>
            
            {/* Divider */}
            <div className={`flex items-center gap-3 mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className={`flex-1 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <span className="text-sm">{t.or}</span>
              <div className={`flex-1 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
            </div>
            
            {/* URL input */}
            <div className="mb-4">
              <input
                type="text"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder={t.enterMarkdownUrl}
                className={`w-full px-3 py-2 rounded ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && importUrl.trim()) {
                    handleImportFromUrl();
                  }
                }}
              />
              <div className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <p>{t.supportedUrls}</p>
                <ul className="list-disc list-inside mt-1">
                  <li>{t.qiitaArticle}</li>
                  <li>{t.githubAuto}</li>
                  <li>{t.directMd}</li>
                </ul>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowImportModal(false); setImportUrl(''); focusEditor(); }}
                className={`px-4 py-2 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {t.cancel}
              </button>
              <button
                onClick={() => handleImportFromUrl()}
                disabled={importLoading || !importUrl.trim()}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {importLoading ? t.importing : t.import}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Conflict Warning Modal */}
      {showConflictWarning && pendingProjectData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-96 p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-lg font-bold mb-4 text-yellow-500">
              {t.warning}
            </h2>
            <p className="mb-4">
              {t.conflictMessage}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowConflictWarning(false);
                  setPendingProjectData(null);
                  focusEditor();
                }}
                className={`px-4 py-2 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  if (pendingProjectData) {
                    applyProjectData(pendingProjectData);
                  }
                  setShowConflictWarning(false);
                  setPendingProjectData(null);
                  focusEditor();
                }}
                className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700"
              >
                {t.continueButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
