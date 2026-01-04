import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { EditorState, Extension, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { oneDark } from '@codemirror/theme-one-dark';
import { vim, getCM, Vim } from '@replit/codemirror-vim';
import type { VimMode, EditorPosition } from '../types';

// Type for CodeMirror adapter used by VIM
interface CodeMirrorLike {
  cm6: EditorView;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
}

// Compartments for dynamic reconfiguration
const themeCompartment = new Compartment();
const fontCompartment = new Compartment();

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
  onVimEditForce?: (arg?: string) => void;  // :e! [file] - force edit (discard changes)
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
  onVimEditForce,
  onVimWrite,
  onVimWriteForce,
  onVimQuit,
  onVimImport,
  onImageAdd,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const [currentMode, setCurrentMode] = useState<string>('normal');
  const currentModeRef = useRef<string>('normal');
  const [cursorPosition, setCursorPosition] = useState<EditorPosition>({ lineNumber: 1, column: 1 });
  const [vimCommand, setVimCommand] = useState<string>('');
  const isUpdatingRef = useRef(false);
  const isScrollingRef = useRef(false);
  
  // Track VIM state for IME handling
  const vimStateRef = useRef<{
    waitingForChar: boolean;  // f, F, t, T, r waiting for character input
    inCommandLine: boolean;   // :, /, ? command line mode
  }>({
    waitingForChar: false,
    inCommandLine: false,
  });
  
  // Keep currentModeRef in sync with currentMode
  useEffect(() => {
    currentModeRef.current = currentMode;
  }, [currentMode]);
  
  // Refs for VIM command callbacks (to avoid stale closures)
  const onVimEditRef = useRef(onVimEdit);
  const onVimEditForceRef = useRef(onVimEditForce);
  const onVimWriteRef = useRef(onVimWrite);
  const onVimWriteForceRef = useRef(onVimWriteForce);
  const onVimQuitRef = useRef(onVimQuit);
  const onVimImportRef = useRef(onVimImport);
  const onImageAddRef = useRef(onImageAdd);
  const onModeChangeRef = useRef(onModeChange);
  const vimEnabledRef = useRef(vimEnabled);
  
  useEffect(() => {
    onVimEditRef.current = onVimEdit;
    onVimEditForceRef.current = onVimEditForce;
    onVimWriteRef.current = onVimWrite;
    onVimWriteForceRef.current = onVimWriteForce;
    onVimQuitRef.current = onVimQuit;
    onVimImportRef.current = onVimImport;
    onImageAddRef.current = onImageAdd;
    onModeChangeRef.current = onModeChange;
    vimEnabledRef.current = vimEnabled;
  }, [onVimEdit, onVimEditForce, onVimWrite, onVimWriteForce, onVimQuit, onVimImport, onImageAdd, onModeChange, vimEnabled]);
  
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
    // Custom page scroll actions that maintain cursor's screen position
    // This is closer to true VIM behavior where Ctrl+f/Ctrl+b scroll the view
    // while keeping the cursor at the same relative screen position
    Vim.defineAction('scrollPageDown', (cm: CodeMirrorLike) => {
      const view = cm.cm6 as EditorView;
      if (!view) return;
      
      const scrollDOM = view.scrollDOM;
      const pageHeight = scrollDOM.clientHeight;
      const currentScrollTop = scrollDOM.scrollTop;
      const maxScroll = scrollDOM.scrollHeight - scrollDOM.clientHeight;
      
      // Calculate new scroll position (1 page down, minus 2 lines for context)
      const lineHeight = view.defaultLineHeight;
      const scrollAmount = pageHeight - (lineHeight * 2);
      const newScrollTop = Math.min(currentScrollTop + scrollAmount, maxScroll);
      
      // Scroll the view
      scrollDOM.scrollTop = newScrollTop;
      
      // Move cursor to keep it visible (move down by scroll amount in lines)
      const scrolledLines = Math.round(scrollAmount / lineHeight);
      const state = view.state;
      const cursorPos = state.selection.main.head;
      const currentLine = state.doc.lineAt(cursorPos);
      const targetLineNum = Math.min(currentLine.number + scrolledLines, state.doc.lines);
      const targetLine = state.doc.line(targetLineNum);
      const newPos = Math.min(targetLine.from + (cursorPos - currentLine.from), targetLine.to);
      
      view.dispatch({
        selection: { anchor: newPos },
        scrollIntoView: false,
      });
    });
    
    Vim.defineAction('scrollPageUp', (cm: CodeMirrorLike) => {
      const view = cm.cm6 as EditorView;
      if (!view) return;
      
      const scrollDOM = view.scrollDOM;
      const pageHeight = scrollDOM.clientHeight;
      const currentScrollTop = scrollDOM.scrollTop;
      
      // Calculate new scroll position (1 page up, minus 2 lines for context)
      const lineHeight = view.defaultLineHeight;
      const scrollAmount = pageHeight - (lineHeight * 2);
      const newScrollTop = Math.max(currentScrollTop - scrollAmount, 0);
      
      // Scroll the view
      scrollDOM.scrollTop = newScrollTop;
      
      // Move cursor to keep it visible (move up by scroll amount in lines)
      const scrolledLines = Math.round(scrollAmount / lineHeight);
      const state = view.state;
      const cursorPos = state.selection.main.head;
      const currentLine = state.doc.lineAt(cursorPos);
      const targetLineNum = Math.max(currentLine.number - scrolledLines, 1);
      const targetLine = state.doc.line(targetLineNum);
      const newPos = Math.min(targetLine.from + (cursorPos - currentLine.from), targetLine.to);
      
      view.dispatch({
        selection: { anchor: newPos },
        scrollIntoView: false,
      });
    });
    
    // Map Ctrl+f and Ctrl+b to custom actions
    Vim.mapCommand('<C-f>', 'action', 'scrollPageDown', {}, { context: 'normal' });
    Vim.mapCommand('<C-b>', 'action', 'scrollPageUp', {}, { context: 'normal' });
    Vim.mapCommand('<PageDown>', 'action', 'scrollPageDown', {}, { context: 'normal' });
    Vim.mapCommand('<PageUp>', 'action', 'scrollPageUp', {}, { context: 'normal' });
    
    // :e [file/url] - edit/open file or create new
    Vim.defineEx('e', 'e', (_cm: unknown, params: { args?: string[] }) => {
      const arg = params.args?.join(' ');
      onVimEditRef.current?.(arg);
    });
    
    Vim.defineEx('edit', 'edit', (_cm: unknown, params: { args?: string[] }) => {
      const arg = params.args?.join(' ');
      onVimEditRef.current?.(arg);
    });
    
    // :e! [file] - force edit (discard unsaved changes)
    Vim.defineEx('e!', 'e!', (_cm: unknown, params: { args?: string[] }) => {
      const arg = params.args?.join(' ');
      onVimEditForceRef.current?.(arg);
    });
    
    Vim.defineEx('edit!', 'edit!', (_cm: unknown, params: { args?: string[] }) => {
      const arg = params.args?.join(' ');
      onVimEditForceRef.current?.(arg);
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

  // Refs for callbacks used in extensions (to avoid recreating extensions)
  const onChangeRef = useRef(onChange);
  const onCursorChangeRef2 = useRef(onCursorChange);
  const onScrollRef = useRef(onScroll);
  
  useEffect(() => {
    onChangeRef.current = onChange;
    onCursorChangeRef2.current = onCursorChange;
    onScrollRef.current = onScroll;
  }, [onChange, onCursorChange, onScroll]);
  
  // Create font theme
  const createFontTheme = useCallback(() => {
    return EditorView.theme({
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
    });
  }, [fontSize]);
  
  // Create extensions based on props - memoized to prevent unnecessary recreations
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
        // Only include searchKeymap when VIM is disabled
        // VIM mode has its own Ctrl+f (page down) and / (search) bindings
        ...(vimEnabled ? [] : searchKeymap),
        indentWithTab,
      ]),
      markdown(),
      EditorView.lineWrapping,
      // Use compartments for dynamic reconfiguration
      fontCompartment.of(createFontTheme()),
      themeCompartment.of(isDark ? oneDark : lightTheme),
      // Update listener for content changes
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isUpdatingRef.current) {
          const newValue = update.state.doc.toString();
          onChangeRef.current(newValue);
        }
        
        // Update cursor position
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        const newPos = {
          lineNumber: line.number,
          column: pos - line.from + 1,
        };
        setCursorPosition(newPos);
        onCursorChangeRef2.current?.(newPos);
      }),
      // Scroll event handler
      EditorView.domEventHandlers({
        // Handle IME input based on VIM state
        compositionstart: (event) => {
          // In VIM mode, check if IME should be allowed
          if (vimEnabledRef.current) {
            const mode = currentModeRef.current;
            const vimState = vimStateRef.current;
            
            // Allow composition in these cases:
            // 1. Insert mode
            // 2. Replace mode
            // 3. Waiting for character (f, F, t, T, r commands)
            // 4. Command line mode (/, ?, :)
            const allowIME = 
              mode.includes('insert') || 
              mode.includes('replace') ||
              vimState.waitingForChar ||
              vimState.inCommandLine;
            
            if (!allowIME) {
              event.preventDefault();
              return true;
            }
          }
          return false;
        },
        scroll: (event, view) => {
          if (isScrollingRef.current) return;
          
          const scroller = view.scrollDOM;
          const scrollTop = scroller.scrollTop;
          const scrollHeight = scroller.scrollHeight - scroller.clientHeight;
          
          if (scrollHeight > 0) {
            const ratio = scrollTop / scrollHeight;
            onScrollRef.current?.(ratio);
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
  }, [vimEnabled, isDark, createFontTheme]); // Only recreate when vim or initial theme changes

  // Initialize editor - only recreate when vimEnabled changes
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
      let listenerSetupAttempts = 0;
      const maxAttempts = 5;
      
      const setupVimListeners = () => {
        const cm = getCM(view);
        if (cm) {
          // Listen for mode changes
          cm.on('vim-mode-change', (event: { mode: string; subMode?: string }) => {
            const mode = event.subMode ? `${event.mode} ${event.subMode}` : event.mode;
            setCurrentMode(mode);
            onModeChangeRef.current?.(toVimMode(mode));
            
            // Reset waiting state on mode change
            vimStateRef.current.waitingForChar = false;
            // Check if entering command line mode
            vimStateRef.current.inCommandLine = mode === 'normal' && event.subMode === 'cmdline';
          });
          
          // Listen for command line updates
          cm.on('vim-command-update', (command: string) => {
            setVimCommand(command);
            // Detect command line mode from command prefix
            const inCmdLine = command.startsWith(':') || 
                              command.startsWith('/') || 
                              command.startsWith('?');
            vimStateRef.current.inCommandLine = inCmdLine;
          });
          
          // Listen for keypress to detect f/F/t/T/r commands
          cm.on('vim-keypress', (key: string) => {
            // Check if this is a character-waiting command
            const waitingCommands = ['f', 'F', 't', 'T', 'r'];
            if (waitingCommands.includes(key)) {
              vimStateRef.current.waitingForChar = true;
            } else {
              // Any other key resets the waiting state
              vimStateRef.current.waitingForChar = false;
            }
          });
          
          return true;
        }
        return false;
      };
      
      // Try immediately
      if (!setupVimListeners()) {
        // Retry with increasing delay if VIM extension needs time to initialize
        const retrySetup = () => {
          listenerSetupAttempts++;
          if (listenerSetupAttempts < maxAttempts && !setupVimListeners()) {
            setTimeout(retrySetup, 50 * listenerSetupAttempts);
          }
        };
        setTimeout(retrySetup, 50);
      }
    }

    return () => {
      view.destroy();
      editorRef.current = null;
    };
  }, [vimEnabled]); // Only recreate when vimEnabled changes

  // Update theme when isDark changes - use compartment reconfigure
  useEffect(() => {
    if (!editorRef.current) return;
    
    // Use compartment reconfigure - this preserves VIM state and cursor position
    editorRef.current.dispatch({
      effects: themeCompartment.reconfigure(isDark ? oneDark : lightTheme),
    });
  }, [isDark]);
  
  // Update font size when fontSize changes - use compartment reconfigure
  useEffect(() => {
    if (!editorRef.current) return;
    
    editorRef.current.dispatch({
      effects: fontCompartment.reconfigure(createFontTheme()),
    });
  }, [fontSize, createFontTheme]);

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
