import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { oneDark } from '@codemirror/theme-one-dark';
import { vim, getCM, Vim } from '@replit/codemirror-vim';
import type { VimMode, EditorPosition } from '../types';

// Light theme
const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#333333',
  },
  '.cm-content': {
    caretColor: '#333333',
  },
  '.cm-cursor': {
    borderLeftColor: '#333333',
  },
  '.cm-activeLine': {
    backgroundColor: '#f5f5f5',
  },
  '.cm-gutters': {
    backgroundColor: '#f8f8f8',
    color: '#999999',
    borderRight: '1px solid #e0e0e0',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#e8e8e8',
  },
}, { dark: false });

// VIM mode colors
const VIM_MODE_COLORS: Record<string, string> = {
  'normal': 'bg-green-600',
  'insert': 'bg-blue-600',
  'visual': 'bg-purple-600',
  'replace': 'bg-red-600',
};

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  isDark?: boolean;
  vimEnabled?: boolean;
  fontSize?: number;
  className?: string;
  onModeChange?: (mode: VimMode) => void;
  onCursorChange?: (pos: EditorPosition) => void;
  onScroll?: (scrollRatio: number) => void;
  scrollToRef?: React.MutableRefObject<((ratio: number) => void) | null>;
  focusRef?: React.MutableRefObject<(() => void) | null>;
  // VIM command callbacks
  onVimEdit?: (arg?: string) => void;  // :e [file/url]
  onVimWrite?: (arg?: string) => void; // :w [filename]
  onVimWriteForce?: () => void;        // :w!
  onVimQuit?: () => void;              // :q
  onVimImport?: (arg?: string) => void; // :imp [file/url]
  // Image handling
  onImageAdd?: (file: File) => Promise<string | null>; // Returns image reference string or null
}

export const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  value,
  onChange,
  isDark = true,
  vimEnabled = true,
  fontSize = 14,
  className = '',
  onModeChange,
  onCursorChange,
  onScroll,
  scrollToRef,
  focusRef,
  onVimEdit,
  onVimWrite,
  onVimWriteForce,
  onVimQuit,
  onVimImport,
  onImageAdd,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const [currentMode, setCurrentMode] = useState<string>('normal');
  const [cursorPosition, setCursorPosition] = useState<EditorPosition>({ lineNumber: 1, column: 1 });
  const [vimCommand, setVimCommand] = useState<string>('');
  const isUpdatingRef = useRef(false);
  const isScrollingRef = useRef(false);
  
  // Refs for VIM command callbacks (to avoid stale closures)
  const onVimEditRef = useRef(onVimEdit);
  const onVimWriteRef = useRef(onVimWrite);
  const onVimWriteForceRef = useRef(onVimWriteForce);
  const onVimQuitRef = useRef(onVimQuit);
  const onVimImportRef = useRef(onVimImport);
  const onImageAddRef = useRef(onImageAdd);
  const onModeChangeRef = useRef(onModeChange);
  
  useEffect(() => {
    onVimEditRef.current = onVimEdit;
    onVimWriteRef.current = onVimWrite;
    onVimWriteForceRef.current = onVimWriteForce;
    onVimQuitRef.current = onVimQuit;
    onVimImportRef.current = onVimImport;
    onImageAddRef.current = onImageAdd;
    onModeChangeRef.current = onModeChange;
  }, [onVimEdit, onVimWrite, onVimWriteForce, onVimQuit, onVimImport, onImageAdd, onModeChange]);
  
  // Ref for image handler (to avoid stale closures in domEventHandlers)
  const handleImageFileRef = useRef<((file: File) => Promise<void>) | null>(null);
  
  // Handle image file (from paste or drop)
  const handleImageFile = useCallback(async (file: File) => {
    if (!onImageAddRef.current || !editorRef.current) return;
    
    const imageRef = await onImageAddRef.current(file);
    if (imageRef) {
      // Insert at cursor position
      const view = editorRef.current;
      const pos = view.state.selection.main.head;
      const insert = `\n${imageRef}\n`;
      
      view.dispatch({
        changes: { from: pos, insert },
        selection: { anchor: pos + insert.length },
      });
    }
  }, []);
  
  // Keep ref updated
  useEffect(() => {
    handleImageFileRef.current = handleImageFile;
  }, [handleImageFile]);
  
  // Define custom VIM commands (only once)
  useEffect(() => {
    // :e [file/url] - edit/open file
    Vim.defineEx('e', 'e', (_cm: unknown, params: { args?: string[] }) => {
      const arg = params.args?.join(' ');
      onVimEditRef.current?.(arg);
    });
    
    Vim.defineEx('edit', 'edit', (_cm: unknown, params: { args?: string[] }) => {
      const arg = params.args?.join(' ');
      onVimEditRef.current?.(arg);
    });
    
    // :w [filename] - write/save file (shows dialog)
    Vim.defineEx('w', 'w', (_cm: unknown, params: { args?: string[] }) => {
      // Check if command was called with bang (:w!)
      // VIM stores this in the command line, we detect by checking for empty args
      const arg = params.args?.join(' ');
      onVimWriteRef.current?.(arg);
    });
    
    // :w! - force write (overwrite without dialog)
    Vim.defineEx('w!', 'w!', () => {
      onVimWriteForceRef.current?.();
    });
    
    Vim.defineEx('write', 'write', (_cm: unknown, params: { args?: string[] }) => {
      const arg = params.args?.join(' ');
      onVimWriteRef.current?.(arg);
    });
    
    Vim.defineEx('write!', 'write!', () => {
      onVimWriteForceRef.current?.();
    });
    
    // :q - quit (close tab)
    Vim.defineEx('q', 'q', () => {
      onVimQuitRef.current?.();
    });
    
    Vim.defineEx('quit', 'quit', () => {
      onVimQuitRef.current?.();
    });
    
    // :wq - write and quit
    Vim.defineEx('wq', 'wq', () => {
      onVimWriteRef.current?.();
      setTimeout(() => onVimQuitRef.current?.(), 100);
    });
    
    // :wq! - force write and quit
    Vim.defineEx('wq!', 'wq!', () => {
      onVimWriteForceRef.current?.();
      setTimeout(() => onVimQuitRef.current?.(), 100);
    });
    
    // :imp [file/url] - import file
    Vim.defineEx('imp', 'imp', (_cm: unknown, params: { args?: string[] }) => {
      const arg = params.args?.join(' ');
      onVimImportRef.current?.(arg);
    });
    
    Vim.defineEx('import', 'import', (_cm: unknown, params: { args?: string[] }) => {
      const arg = params.args?.join(' ');
      onVimImportRef.current?.(arg);
    });
  }, []);
  
  // Register scroll function to ref
  useEffect(() => {
    if (scrollToRef) {
      scrollToRef.current = (ratio: number) => {
        if (!editorRef.current) return;
        isScrollingRef.current = true;
        const scroller = editorRef.current.scrollDOM;
        const scrollHeight = scroller.scrollHeight - scroller.clientHeight;
        scroller.scrollTop = ratio * scrollHeight;
        setTimeout(() => { isScrollingRef.current = false; }, 50);
      };
    }
    return () => {
      if (scrollToRef) scrollToRef.current = null;
    };
  }, [scrollToRef]);
  
  // Register focus function to ref
  useEffect(() => {
    if (focusRef) {
      focusRef.current = () => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      };
    }
    return () => {
      if (focusRef) focusRef.current = null;
    };
  }, [focusRef]);

  // Convert VIM mode string to VimMode type
  const toVimMode = (mode: string): VimMode => {
    const modeMap: Record<string, VimMode> = {
      'normal': 'NORMAL',
      'insert': 'INSERT',
      'visual': 'VISUAL',
      'replace': 'REPLACE',
    };
    return modeMap[mode.toLowerCase()] || 'NORMAL';
  };

  // Create extensions based on props
  const createExtensions = useCallback((): Extension[] => {
    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        indentWithTab,
      ]),
      markdown(),
      EditorView.lineWrapping,
      EditorView.theme({
        '&': {
          fontSize: `${fontSize}px`,
          height: '100%',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
          lineHeight: '1.6',
        },
        '.cm-content': {
          padding: '8px 0',
        },
      }),
      // Theme
      isDark ? oneDark : lightTheme,
      // Update listener for content changes
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isUpdatingRef.current) {
          const newValue = update.state.doc.toString();
          onChange(newValue);
        }
        
        // Update cursor position
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        const newPos = {
          lineNumber: line.number,
          column: pos - line.from + 1,
        };
        setCursorPosition(newPos);
        onCursorChange?.(newPos);
      }),
      // Scroll event handler
      EditorView.domEventHandlers({
        scroll: (event, view) => {
          if (isScrollingRef.current) return;
          
          const scroller = view.scrollDOM;
          const scrollTop = scroller.scrollTop;
          const scrollHeight = scroller.scrollHeight - scroller.clientHeight;
          
          if (scrollHeight > 0) {
            const ratio = scrollTop / scrollHeight;
            onScroll?.(ratio);
          }
        },
        paste: (event) => {
          const items = event.clipboardData?.items;
          if (!items) return false;
          
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file && handleImageFileRef.current) {
                handleImageFileRef.current(file);
              }
              return true;
            }
          }
          return false;
        },
        drop: (event) => {
          const files = event.dataTransfer?.files;
          if (!files || files.length === 0) return false;
          
          // Only handle image files in the editor
          // Document files (markdown, etc.) will be handled by the global drop handler
          const imageFiles: File[] = [];
          
          for (const file of Array.from(files)) {
            if (file.type.startsWith('image/')) {
              imageFiles.push(file);
            }
          }
          
          // Handle image files
          if (imageFiles.length > 0 && handleImageFileRef.current) {
            event.preventDefault();
            for (const file of imageFiles) {
              handleImageFileRef.current(file);
            }
            return true;
          }
          
          // Let other files bubble up to global handler
          return false;
        },
        dragover: (event) => {
          if (event.dataTransfer?.types.includes('Files')) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            return true;
          }
          return false;
        },
      }),
    ];

    // Add VIM extension if enabled
    if (vimEnabled) {
      extensions.unshift(vim());
    }

    return extensions;
  }, [isDark, vimEnabled, fontSize, onChange, onCursorChange, onScroll]);

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up existing editor
    if (editorRef.current) {
      editorRef.current.destroy();
    }

    const state = EditorState.create({
      doc: value,
      extensions: createExtensions(),
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    editorRef.current = view;

    // Set up VIM event listeners
    if (vimEnabled) {
      // getCM might return null immediately after view creation
      // Try with a small delay to allow VIM extension to initialize
      const setupVimListeners = () => {
        const cm = getCM(view);
        if (cm) {
          // Listen for mode changes
          cm.on('vim-mode-change', (event: { mode: string; subMode?: string }) => {
            const mode = event.subMode ? `${event.mode} ${event.subMode}` : event.mode;
            setCurrentMode(mode);
            onModeChangeRef.current?.(toVimMode(mode));
          });
          
          // Listen for command line updates
          cm.on('vim-command-update', (command: string) => {
            setVimCommand(command);
          });
        }
      };
      
      // Try immediately
      setupVimListeners();
      
      // Also try with delay in case VIM extension needs time to initialize
      setTimeout(setupVimListeners, 100);
    }

    return () => {
      view.destroy();
      editorRef.current = null;
    };
  }, [vimEnabled]); // Recreate when vimEnabled changes

  // Update extensions when theme or fontSize changes
  useEffect(() => {
    if (!editorRef.current) return;

    const newState = EditorState.create({
      doc: editorRef.current.state.doc,
      extensions: createExtensions(),
    });

    editorRef.current.setState(newState);
  }, [isDark, fontSize, createExtensions]);

  // Update content when value prop changes
  useEffect(() => {
    if (!editorRef.current) return;
    
    const currentValue = editorRef.current.state.doc.toString();
    if (value !== currentValue) {
      isUpdatingRef.current = true;
      editorRef.current.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      });
      isUpdatingRef.current = false;
    }
  }, [value]);

  // Get mode color
  const getModeColor = (mode: string): string => {
    return VIM_MODE_COLORS[mode.toLowerCase()] || VIM_MODE_COLORS.normal;
  };

  // Get line count
  const getLineCount = (): number => {
    return editorRef.current?.state.doc.lines || 0;
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Editor container */}
      <div ref={containerRef} className="flex-1 overflow-hidden" />
      
      {/* VIM status bar */}
      {vimEnabled && (
        <div className={`flex items-center justify-between px-3 py-1 text-xs font-mono ${
          isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
        }`}>
          <div className="flex items-center gap-3">
            {/* Mode indicator */}
            <span className={`px-2 py-0.5 rounded text-white font-bold ${getModeColor(currentMode)}`}>
              {currentMode.toUpperCase()}
            </span>
            
            {/* Command buffer */}
            {vimCommand && (
              <span className="text-yellow-500">{vimCommand}</span>
            )}
          </div>
          
          {/* Position info */}
          <div className="flex items-center gap-4">
            <span>{cursorPosition.lineNumber}:{cursorPosition.column}</span>
            <span>{getLineCount()} lines</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeMirrorEditor;
