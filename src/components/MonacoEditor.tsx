import React, { useEffect, useRef, useState } from 'react';
import type { MonacoEditorProps, IMonacoEditor, IMonaco, VimMode, EditorPosition } from '../types';
import { useVim } from '../hooks';
import { EDITOR_DEFAULTS, VIM_DARK_THEME, VIM_LIGHT_THEME, VIM_MODE_COLORS, MONACO_CDN } from '../constants';

// Declare global require for Monaco loader
declare const require: {
  config(options: { paths: Record<string, string> }): void;
  (deps: string[], callback: (monaco: IMonaco) => void): void;
};

/**
 * Monaco Editor with VIM keybindings
 */
export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  isDark = true,
  vimEnabled = true,
  language = 'markdown',
  fontSize = EDITOR_DEFAULTS.fontSize,
  tabSize = EDITOR_DEFAULTS.tabSize,
  wordWrap = EDITOR_DEFAULTS.wordWrap,
  lineNumbers = EDITOR_DEFAULTS.lineNumbers,
  minimap = EDITOR_DEFAULTS.minimap,
  readOnly = false,
  className = '',
  onMount,
  onModeChange,
  onCursorChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<IMonacoEditor | null>(null);
  const monacoRef = useRef<IMonaco | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<EditorPosition>({ lineNumber: 1, column: 1 });
  const [currentMode, setCurrentMode] = useState<VimMode>('NORMAL');
  const [currentCommand, setCurrentCommand] = useState('');
  
  // Ref to track current vimEnabled state for use in event handlers
  const vimEnabledRef = useRef(vimEnabled);
  useEffect(() => {
    vimEnabledRef.current = vimEnabled;
  }, [vimEnabled]);
  
  // VIM hook
  const vim = useVim({
    onModeChange: (mode) => {
      console.log('[MonacoEditor] onModeChange:', mode);
      setCurrentMode(mode);
      onModeChange?.(mode);
    },
    onCommandChange: (cmd) => {
      console.log('[MonacoEditor] onCommandChange:', cmd);
      setCurrentCommand(cmd);
    },
    onMessage: (msg, _duration) => {
      // Messages can be shown in UI
      console.log('VIM:', msg);
    },
  });
  
  // Ref for vim handler
  const vimRef = useRef(vim);
  useEffect(() => {
    vimRef.current = vim;
  }, [vim]);
  
  // Flag to track if VIM is currently executing an edit
  const vimEditingRef = useRef(false);
  
  // Track if we're updating from props to prevent loops
  const isUpdatingFromProps = useRef(false);
  
  // Store global key handler reference for cleanup
  const globalKeyHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);
  
  // Initialize Monaco Editor
  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;
    
    // Configure Monaco loader
    require.config({
      paths: { 'vs': MONACO_CDN.base },
    });
    
    require(['vs/editor/editor.main'], (monaco: IMonaco) => {
      if (!containerRef.current || editorRef.current) return;
      
      monacoRef.current = monaco;
      
      // Define themes
      monaco.editor.defineTheme('vim-dark', VIM_DARK_THEME);
      monaco.editor.defineTheme('vim-light', VIM_LIGHT_THEME);
      
      // Create editor
      const editor = monaco.editor.create(containerRef.current, {
        value,
        language,
        theme: isDark ? 'vim-dark' : 'vim-light',
        fontSize,
        tabSize,
        wordWrap,
        lineNumbers,
        minimap: { enabled: minimap },
        readOnly,
        automaticLayout: true,
        cursorStyle: vimEnabled ? 'block' : 'line',
        cursorBlinking: 'blink',
        scrollBeyondLastLine: false,
        renderWhitespace: 'selection',
        contextmenu: true,
        lineHeight: 1.6,
      });
      
      editorRef.current = editor;
      
      // Content change handler
      editor.onDidChangeModelContent((e) => {
        // Skip if update came from props
        if (isUpdatingFromProps.current) return;
        
        // Skip undo logic if VIM is editing (dd, x, p, etc.)
        if (vimEditingRef.current) {
          const newValue = editor.getValue();
          onChange(newValue);
          
          // Record changes for dot command
          if (e.changes?.length > 0 && !e.isUndoing && !e.isRedoing) {
            const change = e.changes[0];
            const lastEdit = vimRef.current.state.lastEdit;
            if (change.text && lastEdit?.recording) {
              lastEdit.insertedText = (lastEdit.insertedText || '') + change.text;
            }
          }
          return;
        }
        
        // Check if we should undo (typed in non-INSERT mode by Monaco, not VIM)
        if (vimEnabledRef.current && !e.isUndoing && !e.isRedoing) {
          const mode = vimRef.current.state.mode;
          const replaceMode = vimRef.current.state.replaceMode;
          const isInsertMode = mode === 'INSERT' || replaceMode;
          
          // If not in insert mode and text was added (not a VIM operation)
          if (!isInsertMode && e.changes?.length > 0) {
            const change = e.changes[0];
            // Single character insertion that's not from VIM operations
            if (change.text.length === 1 && change.text !== '\n' && !change.text.startsWith(' ')) {
              console.log('[onDidChangeModelContent] Undoing non-INSERT mode input:', change.text);
              // Undo the typed character
              setTimeout(() => {
                editor.trigger('vim', 'undo', {});
              }, 0);
              return;
            }
          }
        }
        
        const newValue = editor.getValue();
        onChange(newValue);
        
        // Record changes for dot command
        if (e.changes?.length > 0 && !e.isUndoing && !e.isRedoing) {
          const change = e.changes[0];
          const lastEdit = vimRef.current.state.lastEdit;
          if (change.text && lastEdit?.recording) {
            lastEdit.insertedText = (lastEdit.insertedText || '') + change.text;
          }
        }
      });
      
      // Cursor change handler
      editor.onDidChangeCursorPosition((e) => {
        setCursorPosition(e.position);
        onCursorChange?.(e.position);
      });
      
      // Global keydown handler at capture phase (intercepts before Monaco)
      const globalKeyHandler = (e: KeyboardEvent) => {
        console.log('[GLOBAL] keydown:', e.key, 'vimEnabled:', vimEnabledRef.current);
        
        if (!vimEnabledRef.current) return;
        if (!editorRef.current) return;
        
        // Check if editor has focus
        const activeElement = document.activeElement;
        const editorDom = editorRef.current.getDomNode();
        const hasFocus = editorDom?.contains(activeElement);
        console.log('[GLOBAL] hasFocus:', hasFocus, 'activeElement:', activeElement?.tagName);
        
        if (!hasFocus) return;
        
        // Mark that VIM is handling this - any edits are from VIM commands
        vimEditingRef.current = true;
        
        const handled = vimRef.current.handleKeyDown(e, editorRef.current);
        console.log('[GLOBAL] handled:', handled);
        
        // Reset the flag after a short delay to allow edits to complete
        setTimeout(() => {
          vimEditingRef.current = false;
        }, 10);
        
        if (handled) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      };
      
      // Store handler reference for cleanup
      globalKeyHandlerRef.current = globalKeyHandler;
      
      // Add handler at document level with capture phase
      document.addEventListener('keydown', globalKeyHandler, true);
      
      // IME composition handlers
      const domNode = editor.getDomNode();
      if (domNode) {
        domNode.addEventListener('compositionstart', () => {
          if (vimEnabledRef.current && vimRef.current.state.mode !== 'INSERT' && !vimRef.current.state.replaceMode) {
            // Block IME in non-insert modes
          }
        });
        
        domNode.addEventListener('compositionend', () => {
          if (vimEnabledRef.current && vimRef.current.state.mode !== 'INSERT' && !vimRef.current.state.replaceMode) {
            // Undo any composed text
            editor.trigger('vim', 'undo', {});
          }
        });
      }
      
      setIsLoaded(true);
      onMount?.(editor, monaco);
    });
    
    return () => {
      // Remove global handler
      if (globalKeyHandlerRef.current) {
        document.removeEventListener('keydown', globalKeyHandlerRef.current, true);
        globalKeyHandlerRef.current = null;
      }
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []); // Only run once on mount
  
  // Update theme when isDark changes
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      monacoRef.current.editor.setTheme(isDark ? 'vim-dark' : 'vim-light');
    }
  }, [isDark]);
  
  // Update cursor style when vimEnabled changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        cursorStyle: vimEnabled ? 'block' : 'line',
      });
    }
  }, [vimEnabled]);
  
  // Update cursor style based on VIM mode
  useEffect(() => {
    if (editorRef.current && vimEnabled) {
      editorRef.current.updateOptions({
        cursorStyle: currentMode === 'INSERT' ? 'line' : 
                     vim.state.replaceMode ? 'underline' : 'block',
      });
    }
  }, [currentMode, vim.state.replaceMode, vimEnabled]);
  
  // Reset VIM state when disabled
  useEffect(() => {
    if (!vimEnabled) {
      vim.resetState();
      setCurrentMode('NORMAL');
      setCurrentCommand('');
      if (editorRef.current) {
        editorRef.current.updateOptions({
          cursorStyle: 'line',
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vimEnabled]);
  
  // Update value when prop changes (external updates)
  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      if (value !== currentValue) {
        isUpdatingFromProps.current = true;
        editorRef.current.setValue(value);
        isUpdatingFromProps.current = false;
      }
    }
  }, [value]);
  
  // Get mode color
  const getModeColor = (mode: VimMode): string => {
    return VIM_MODE_COLORS[mode] || VIM_MODE_COLORS.NORMAL;
  };
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Editor container */}
      <div ref={containerRef} className="flex-1" />
      
      {/* VIM status bar */}
      {vimEnabled && isLoaded && (
        <div className={`flex items-center justify-between px-3 py-1 text-xs font-mono ${
          isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
        }`}>
          <div className="flex items-center gap-3">
            {/* Mode indicator */}
            <span className={`px-2 py-0.5 rounded text-white font-bold ${getModeColor(currentMode)}`}>
              {currentMode}
            </span>
            
            {/* Recording indicator */}
            {vim.state.recordingMacro && (
              <span className="text-red-500 animate-pulse">
                Recording @{vim.state.recordingMacro}
              </span>
            )}
            
            {/* Command buffer */}
            {currentCommand && (
              <span className="text-yellow-500">{currentCommand}</span>
            )}
          </div>
          
          {/* Position info */}
          <div className="flex items-center gap-4">
            <span>{cursorPosition.lineNumber}:{cursorPosition.column}</span>
            <span>{editorRef.current?.getModel()?.getLineCount() || 0} lines</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonacoEditor;
