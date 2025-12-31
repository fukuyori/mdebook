import { useReducer, useRef, useCallback } from 'react';
import type {
  VimMode,
  VimState,
  VimAction,
  PendingCharCommand,
  IMonacoEditor,
  EditorPosition,
} from '../types';
import {
  getPosition,
  getLineContent,
  getLineCount,
  setPosition,
  findNextWord,
  findWordEndForward,
  findWordStart,
  findFirstNonWhitespace,
  findMatchingBracket,
  findCharInLine,
  indentLine,
  deleteRange,
  yankRange,
  getScrollAmount,
  isVisualMode,
  getTextObject,
  findPrevWordEnd,
} from '../utils/vim-helpers';

// Initial VIM state
const initialState: VimState = {
  mode: 'NORMAL',
  command: '',
  keyBuffer: '',
  count: '',
  register: { '"': '', lines: false },
  marks: {},
  macros: {},
  recordingMacro: null,
  macroKeys: [],
  lastSearch: { pattern: '', direction: 1 },
  lastFindChar: { char: '', type: 'f', direction: 1 },
  visualStart: null,
  lastEdit: null,
  pendingChar: null,
  replaceMode: false,
};

// VIM state reducer
function vimReducer(state: VimState, action: VimAction): VimState {
  switch (action.type) {
    case 'SET_MODE': return { ...state, mode: action.payload };
    case 'SET_COMMAND': return { ...state, command: action.payload };
    case 'SET_KEY_BUFFER': return { ...state, keyBuffer: action.payload };
    case 'SET_COUNT': return { ...state, count: action.payload };
    case 'SET_REGISTER': return { ...state, register: action.payload };
    case 'SET_MARK': return { ...state, marks: { ...state.marks, [action.payload.key]: action.payload.mark } };
    case 'SET_MACRO': return { ...state, macros: { ...state.macros, [action.payload.key]: action.payload.keys } };
    case 'SET_RECORDING_MACRO': return { ...state, recordingMacro: action.payload };
    case 'ADD_MACRO_KEY': return { ...state, macroKeys: [...state.macroKeys, action.payload] };
    case 'CLEAR_MACRO_KEYS': return { ...state, macroKeys: [] };
    case 'SET_LAST_SEARCH': return { ...state, lastSearch: action.payload };
    case 'SET_LAST_FIND_CHAR': return { ...state, lastFindChar: action.payload };
    case 'SET_VISUAL_START': return { ...state, visualStart: action.payload };
    case 'SET_LAST_EDIT': return { ...state, lastEdit: action.payload };
    case 'UPDATE_LAST_EDIT': return { ...state, lastEdit: state.lastEdit ? { ...state.lastEdit, ...action.payload } : null };
    case 'SET_PENDING_CHAR': return { ...state, pendingChar: action.payload };
    case 'SET_REPLACE_MODE': return { ...state, replaceMode: action.payload };
    case 'RESET': return initialState;
    default: return state;
  }
}

export interface UseVimOptions {
  onModeChange?: (mode: VimMode) => void;
  onCommandChange?: (command: string) => void;
  onMessage?: (message: string, duration?: number) => void;
}

export interface UseVimReturn {
  state: VimState;
  setMode: (mode: VimMode) => void;
  setCommand: (command: string) => void;
  handleKeyDown: (e: KeyboardEvent, editor: IMonacoEditor) => boolean;
  resetState: () => void;
  getCount: () => number;
  peekCount: () => number;
}

interface JumpHistory { positions: EditorPosition[]; index: number; }

export function useVim(options: UseVimOptions = {}): UseVimReturn {
  const [state, dispatch] = useReducer(vimReducer, initialState);
  const { onModeChange, onCommandChange, onMessage } = options;
  
  const countRef = useRef('');
  const keyBufferRef = useRef('');
  const operatorRef = useRef<string | null>(null);
  const registerNameRef = useRef<string>('"');
  const jumpHistoryRef = useRef<JumpHistory>({ positions: [], index: -1 });
  const lastMacroRef = useRef<string | null>(null);
  
  const setMode = useCallback((mode: VimMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
    onModeChange?.(mode);
  }, [onModeChange]);
  
  const setCommand = useCallback((command: string) => {
    dispatch({ type: 'SET_COMMAND', payload: command });
    onCommandChange?.(command);
  }, [onCommandChange]);
  
  const getCount = useCallback(() => {
    const c = parseInt(countRef.current) || 1;
    countRef.current = '';
    dispatch({ type: 'SET_COUNT', payload: '' });
    return c;
  }, []);
  
  const peekCount = useCallback(() => parseInt(countRef.current) || 1, []);
  
  const showMessage = useCallback((msg: string, duration?: number) => {
    setCommand(msg);
    onMessage?.(msg, duration);
    if (duration !== undefined) setTimeout(() => setCommand(''), duration);
  }, [setCommand, onMessage]);
  
  const resetState = useCallback(() => {
    dispatch({ type: 'RESET' });
    countRef.current = '';
    keyBufferRef.current = '';
    operatorRef.current = null;
    registerNameRef.current = '"';
  }, []);
  
  const addJump = useCallback((pos: EditorPosition) => {
    const h = jumpHistoryRef.current;
    h.positions = h.positions.slice(0, h.index + 1);
    h.positions.push(pos);
    h.index = h.positions.length - 1;
    if (h.positions.length > 100) { h.positions.shift(); h.index--; }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent, editor: IMonacoEditor): boolean => {
    const key = e.key;
    const ctrl = e.ctrlKey;
    
    console.log('[handleKeyDown] key:', key, 'mode:', state.mode, 'replaceMode:', state.replaceMode);
    
    if (e.isComposing || key === 'Process') {
      if (state.mode !== 'INSERT' && !state.replaceMode) { e.preventDefault(); return true; }
      return false;
    }
    
    // Arrow keys - let Monaco handle them
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      return false;
    }
    
    // INSERT mode
    if (state.mode === 'INSERT') {
      if (key === 'Escape' || (ctrl && key === '[')) {
        e.preventDefault();
        setMode('NORMAL');
        setCommand('');
        editor.updateOptions({ cursorStyle: 'block' });
        const pos = getPosition(editor);
        if (pos.column > 1) setPosition(editor, pos.lineNumber, pos.column - 1);
        dispatch({ type: 'UPDATE_LAST_EDIT', payload: { recording: false } });
        return true;
      }
      return false;
    }
    
    // REPLACE mode
    if (state.replaceMode) {
      if (key === 'Escape' || (ctrl && key === '[')) {
        e.preventDefault();
        dispatch({ type: 'SET_REPLACE_MODE', payload: false });
        setMode('NORMAL');
        editor.updateOptions({ cursorStyle: 'block' });
        return true;
      }
      if (key.length === 1 && !ctrl) {
        e.preventDefault();
        const pos = getPosition(editor);
        const content = getLineContent(editor, pos.lineNumber);
        if (pos.column <= content.length) {
          editor.executeEdits('vim', [{ range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column + 1 }, text: key }]);
          setPosition(editor, pos.lineNumber, pos.column + 1);
        } else {
          editor.trigger('vim', 'type', { text: key });
        }
        return true;
      }
      return false;
    }
    
    // Pending char commands
    if (state.pendingChar) {
      e.preventDefault();
      if (key === 'Escape' || (ctrl && key === '[')) {
        dispatch({ type: 'SET_PENDING_CHAR', payload: null });
        setCommand('');
        operatorRef.current = null;
        registerNameRef.current = '"';
        return true;
      }
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(key)) return true;
      
      const pc = state.pendingChar;
      dispatch({ type: 'SET_PENDING_CHAR', payload: null });
      setCommand('');
      const pos = getPosition(editor);
      const content = getLineContent(editor, pos.lineNumber);
      
      // Register selection
      if (pc === '"') {
        if (/[a-zA-Z0-9"+*]/.test(key)) { registerNameRef.current = key; setCommand(`"${key}`); }
        return true;
      }
      
      // Single char replace
      if (pc === 'r') {
        if (key.length === 1 && pos.column <= content.length) {
          editor.executeEdits('vim', [{ range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column + 1 }, text: key }]);
          dispatch({ type: 'SET_LAST_EDIT', payload: { type: 'replace', char: key } });
        }
        return true;
      }
      
      // Mark set
      if (pc === 'm') {
        if (/[a-zA-Z]/.test(key)) {
          dispatch({ type: 'SET_MARK', payload: { key, mark: { lineNumber: pos.lineNumber, column: pos.column } } });
          showMessage(`Mark '${key}' set`, 1500);
        }
        return true;
      }
      
      // Jump to mark
      if (pc === "'" || pc === '`') {
        if (/[a-zA-Z]/.test(key)) {
          const mark = state.marks[key];
          if (mark) {
            addJump(pos);
            if (pc === "'") {
              const tc = getLineContent(editor, mark.lineNumber);
              setPosition(editor, mark.lineNumber, findFirstNonWhitespace(tc));
            } else {
              setPosition(editor, mark.lineNumber, mark.column);
            }
          } else {
            showMessage(`Mark '${key}' not set`, 1500);
          }
        }
        return true;
      }
      
      // Macro play
      if (pc === '@') {
        if (/[a-zA-Z]/.test(key)) {
          const macro = state.macros[key];
          if (macro && macro.length > 0) {
            lastMacroRef.current = key;
            for (const mk of macro) {
              handleKeyDown(new KeyboardEvent('keydown', { key: mk }), editor);
            }
            showMessage(`Played @${key}`, 1500);
          }
        } else if (key === '@' && lastMacroRef.current) {
          const macro = state.macros[lastMacroRef.current];
          if (macro) for (const mk of macro) handleKeyDown(new KeyboardEvent('keydown', { key: mk }), editor);
        }
        return true;
      }
      
      // Macro record start
      if (pc === 'q') {
        if (/[a-zA-Z]/.test(key)) {
          dispatch({ type: 'SET_RECORDING_MACRO', payload: key });
          dispatch({ type: 'CLEAR_MACRO_KEYS' });
          showMessage(`Recording @${key}...`, 1500);
        }
        return true;
      }
      
      // f/F/t/T
      if (['f', 'F', 't', 'T'].includes(pc)) {
        if (key.length !== 1) return true;
        const dir = (pc === 'f' || pc === 't') ? 1 : -1;
        const till = pc === 't' || pc === 'T';
        dispatch({ type: 'SET_LAST_FIND_CHAR', payload: { char: key, type: pc, direction: dir as 1|-1 } });
        const tc = findCharInLine(content, pos.column, key, dir as 1|-1, till);
        if (tc !== null) {
          if (operatorRef.current) {
            applyOp(editor, operatorRef.current, pos, { lineNumber: pos.lineNumber, column: tc }, dispatch, state, registerNameRef.current, showMessage, setMode);
            operatorRef.current = null;
          } else {
            setPosition(editor, pos.lineNumber, tc);
          }
        }
        return true;
      }
      
      // Text objects (i/a + char)
      if (pc === 'i' || pc === 'a') {
        const inner = pc === 'i';
        const to = getTextObject(editor, key, inner);
        if (to && operatorRef.current) {
          applyOp(editor, operatorRef.current, { lineNumber: to.start.line, column: to.start.col }, { lineNumber: to.end.line, column: to.end.col }, dispatch, state, registerNameRef.current, showMessage, setMode);
          operatorRef.current = null;
          registerNameRef.current = '"';
        }
        return true;
      }
      return true;
    }
    
    if (isVisualMode(state.mode)) return handleVisual(e, editor, state, dispatch, setMode, setCommand, showMessage, getCount, registerNameRef);
    if (state.mode === 'COMMAND') return handleCmd(e, editor, state, dispatch, setMode, setCommand, showMessage, addJump);
    return handleNormal(e, editor, state, dispatch, setMode, setCommand, showMessage, getCount, countRef, keyBufferRef, operatorRef, registerNameRef, jumpHistoryRef, addJump, lastMacroRef);
  }, [state, setMode, setCommand, showMessage, getCount, addJump]);
  
  return { state, setMode, setCommand, handleKeyDown, resetState, getCount, peekCount };
}

function applyOp(editor: IMonacoEditor, op: string, start: EditorPosition, end: EditorPosition, dispatch: React.Dispatch<VimAction>, state: VimState, regName: string, showMsg: (m:string,d?:number)=>void, setMode: (m:VimMode)=>void): void {
  if (start.lineNumber > end.lineNumber || (start.lineNumber === end.lineNumber && start.column > end.column)) [start, end] = [end, start];
  if (op === 'd' || op === 'c') {
    const { text, lines } = yankRange(editor, start.lineNumber, start.column, end.lineNumber, end.column);
    dispatch({ type: 'SET_REGISTER', payload: { ...state.register, [regName]: text, lines } });
    deleteRange(editor, start.lineNumber, start.column, end.lineNumber, end.column);
    setPosition(editor, start.lineNumber, start.column);
    if (op === 'c') { setMode('INSERT'); editor.updateOptions({ cursorStyle: 'line' }); }
    dispatch({ type: 'SET_LAST_EDIT', payload: { type: op === 'd' ? 'delete' : 'change' } });
  } else if (op === 'y') {
    const { text, lines } = yankRange(editor, start.lineNumber, start.column, end.lineNumber, end.column);
    dispatch({ type: 'SET_REGISTER', payload: { ...state.register, [regName]: text, lines } });
    showMsg('Yanked', 1500);
  } else if (op === '>' || op === '<') {
    for (let i = Math.min(start.lineNumber, end.lineNumber); i <= Math.max(start.lineNumber, end.lineNumber); i++) indentLine(editor, i, op === '>' ? 1 : -1);
  }
}

function handleVisual(e: KeyboardEvent, editor: IMonacoEditor, state: VimState, dispatch: React.Dispatch<VimAction>, setMode: (m:VimMode)=>void, setCommand: (c:string)=>void, showMsg: (m:string,d?:number)=>void, getCount: ()=>number, regRef: React.MutableRefObject<string>): boolean {
  e.preventDefault();
  const key = e.key, ctrl = e.ctrlKey;
  const pos = getPosition(editor);
  const content = getLineContent(editor, pos.lineNumber);
  const lc = getLineCount(editor);
  const cnt = getCount();
  
  if (key === 'Escape' || (ctrl && key === '[')) {
    setMode('NORMAL'); setCommand('');
    editor.setSelection({ startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column });
    return true;
  }
  
  if (key === '"') { dispatch({ type: 'SET_PENDING_CHAR', payload: '"' }); setCommand('"'); return true; }
  
  let np = { lineNumber: pos.lineNumber, column: pos.column };
  switch (key) {
    case 'h': np.column = Math.max(1, pos.column - cnt); break;
    case 'l': np.column = Math.min(content.length + 1, pos.column + cnt); break;
    case 'j': np.lineNumber = Math.min(lc, pos.lineNumber + cnt); break;
    case 'k': np.lineNumber = Math.max(1, pos.lineNumber - cnt); break;
    case '0': np.column = 1; break;
    case '^': np.column = findFirstNonWhitespace(content); break;
    case '$': np.column = content.length + 1; break;
    case 'w': { const n = findNextWord(pos.column, content); if (n) np.column = n; break; }
    case 'b': np.column = findWordStart(pos.column, content); break;
    case 'e': { const n = findWordEndForward(pos.column, content); if (n) np.column = n; break; }
    case 'G': np.lineNumber = lc; np.column = 1; break;
    case 'd': case 'x': {
      const sel = editor.getSelection();
      if (sel) {
        const { text, lines } = yankRange(editor, sel.startLineNumber, sel.startColumn, sel.endLineNumber, sel.endColumn);
        dispatch({ type: 'SET_REGISTER', payload: { ...state.register, [regRef.current]: text, lines } });
        deleteRange(editor, sel.startLineNumber, sel.startColumn, sel.endLineNumber, sel.endColumn);
      }
      setMode('NORMAL'); regRef.current = '"';
      dispatch({ type: 'SET_LAST_EDIT', payload: { type: 'delete' } });
      return true;
    }
    case 'c': {
      const sel = editor.getSelection();
      if (sel) {
        const { text, lines } = yankRange(editor, sel.startLineNumber, sel.startColumn, sel.endLineNumber, sel.endColumn);
        dispatch({ type: 'SET_REGISTER', payload: { ...state.register, [regRef.current]: text, lines } });
        deleteRange(editor, sel.startLineNumber, sel.startColumn, sel.endLineNumber, sel.endColumn);
      }
      setMode('INSERT'); editor.updateOptions({ cursorStyle: 'line' }); regRef.current = '"';
      return true;
    }
    case 'y': {
      const sel = editor.getSelection();
      if (sel) {
        const { text, lines } = yankRange(editor, sel.startLineNumber, sel.startColumn, sel.endLineNumber, sel.endColumn);
        dispatch({ type: 'SET_REGISTER', payload: { ...state.register, [regRef.current]: text, lines } });
        showMsg('Yanked', 1500);
      }
      setMode('NORMAL');
      editor.setSelection({ startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column });
      regRef.current = '"';
      return true;
    }
    case '>': case '<': {
      const sel = editor.getSelection();
      if (sel) {
        const sl = Math.min(sel.startLineNumber, sel.endLineNumber);
        const el = Math.max(sel.startLineNumber, sel.endLineNumber);
        for (let i = sl; i <= el; i++) indentLine(editor, i, key === '>' ? 1 : -1);
        showMsg(`${el - sl + 1} lines ${key === '>' ? 'indented' : 'outdented'}`, 1500);
      }
      setMode('NORMAL');
      return true;
    }
    case 'o': {
      const st = state.visualStart;
      if (st) {
        dispatch({ type: 'SET_VISUAL_START', payload: { lineNumber: pos.lineNumber, column: pos.column } });
        np = { lineNumber: st.lineNumber, column: st.column };
      }
      break;
    }
  }
  
  editor.setPosition(np);
  editor.revealPosition(np);
  const st = state.visualStart;
  if (st) {
    if (state.mode === 'VISUAL_LINE') {
      const sl = Math.min(st.lineNumber, np.lineNumber), el = Math.max(st.lineNumber, np.lineNumber);
      editor.setSelection({ startLineNumber: sl, startColumn: 1, endLineNumber: el, endColumn: getLineContent(editor, el).length + 1 });
    } else {
      if (np.lineNumber < st.lineNumber || (np.lineNumber === st.lineNumber && np.column < st.column)) {
        editor.setSelection({ startLineNumber: np.lineNumber, startColumn: np.column, endLineNumber: st.lineNumber, endColumn: st.column + 1 });
      } else {
        editor.setSelection({ startLineNumber: st.lineNumber, startColumn: st.column, endLineNumber: np.lineNumber, endColumn: np.column });
      }
    }
  }
  return true;
}

function handleCmd(e: KeyboardEvent, editor: IMonacoEditor, state: VimState, dispatch: React.Dispatch<VimAction>, setMode: (m:VimMode)=>void, setCommand: (c:string)=>void, showMsg: (m:string,d?:number)=>void, addJump: (p:EditorPosition)=>void): boolean {
  e.preventDefault();
  const key = e.key;
  console.log('[handleCmd] key:', key, 'command:', state.command);
  
  if (key === 'Escape') { setMode('NORMAL'); setCommand(''); return true; }
  if (key === 'Enter') {
    const cmd = state.command.substring(1);
    const ct = state.command[0];
    if (ct === ':') execCmd(cmd, editor, dispatch, showMsg);
    else if (ct === '/' || ct === '?') {
      const dir = ct === '/' ? 1 : -1;
      dispatch({ type: 'SET_LAST_SEARCH', payload: { pattern: cmd, direction: dir as 1|-1 } });
      if (cmd) { const pos = getPosition(editor); addJump(pos); searchMove(editor, cmd, dir as 1|-1, pos, showMsg); }
    }
    setMode('NORMAL'); setCommand('');
    return true;
  }
  if (key === 'Backspace') {
    if (state.command.length > 1) setCommand(state.command.slice(0, -1));
    else { setMode('NORMAL'); setCommand(''); }
    return true;
  }
  if (key.length === 1) setCommand(state.command + key);
  return true;
}

function searchMove(editor: IMonacoEditor, pattern: string, dir: 1|-1, from: EditorPosition, showMsg: (m:string,d?:number)=>void): boolean {
  const model = editor.getModel();
  if (!model) return false;
  try {
    const regex = new RegExp(pattern, 'gi');
    const text = model.getValue();
    const matches: {index:number}[] = [];
    let m;
    while ((m = regex.exec(text)) !== null) matches.push({ index: m.index });
    if (matches.length === 0) { showMsg(`Not found: ${pattern}`, 2000); return false; }
    const off = model.getOffsetAt(from);
    let tgt: {index:number}|null = null;
    if (dir === 1) {
      for (const x of matches) if (x.index > off) { tgt = x; break; }
      if (!tgt) { tgt = matches[0]; showMsg('Search wrapped', 1500); }
    } else {
      for (let i = matches.length - 1; i >= 0; i--) if (matches[i].index < off) { tgt = matches[i]; break; }
      if (!tgt) { tgt = matches[matches.length - 1]; showMsg('Search wrapped', 1500); }
    }
    if (tgt) { const p = model.getPositionAt(tgt.index); setPosition(editor, p.lineNumber, p.column); return true; }
  } catch { showMsg(`Invalid: ${pattern}`, 2000); }
  return false;
}

function execCmd(cmd: string, editor: IMonacoEditor, _d: React.Dispatch<VimAction>, showMsg: (m:string,d?:number)=>void): void {
  if (cmd === 'w' || cmd === 'write' || cmd === 'wq' || cmd === 'x') { showMsg('Use Ctrl+S', 1500); return; }
  if (cmd === 'q' || cmd === 'quit') { showMsg('Use browser tab', 1500); return; }
  const sm = cmd.match(/^s\/(.+?)\/(.*)\/([gi]*)$/);
  if (sm) {
    try {
      const re = new RegExp(sm[1], sm[3] || 'g');
      const pos = getPosition(editor);
      const lc = getLineContent(editor, pos.lineNumber);
      const nc = lc.replace(re, sm[2]);
      editor.executeEdits('vim', [{ range: { startLineNumber: pos.lineNumber, startColumn: 1, endLineNumber: pos.lineNumber, endColumn: lc.length + 1 }, text: nc }]);
      showMsg('Replaced', 1500);
    } catch { showMsg('Invalid pattern', 2000); }
    return;
  }
  const gm = cmd.match(/^%s\/(.+?)\/(.*)\/([gi]*)$/);
  if (gm) {
    try {
      const re = new RegExp(gm[1], (gm[3] || '') + 'g');
      const model = editor.getModel();
      if (model) {
        const txt = model.getValue();
        const nt = txt.replace(re, gm[2]);
        editor.executeEdits('vim', [{ range: model.getFullModelRange(), text: nt }]);
        showMsg('Replaced all', 1500);
      }
    } catch { showMsg('Invalid pattern', 2000); }
    return;
  }
  const ln = parseInt(cmd);
  if (!isNaN(ln) && ln > 0) { setPosition(editor, Math.min(ln, getLineCount(editor)), 1); return; }
  showMsg(`Unknown: ${cmd}`, 2000);
}

function handleNormal(e: KeyboardEvent, editor: IMonacoEditor, state: VimState, dispatch: React.Dispatch<VimAction>, setMode: (m:VimMode)=>void, setCommand: (c:string)=>void, showMsg: (m:string,d?:number)=>void, getCount: ()=>number, countRef: React.MutableRefObject<string>, kbRef: React.MutableRefObject<string>, opRef: React.MutableRefObject<string|null>, regRef: React.MutableRefObject<string>, jhRef: React.MutableRefObject<JumpHistory>, addJump: (p:EditorPosition)=>void, lmRef: React.MutableRefObject<string|null>): boolean {
  const key = e.key, ctrl = e.ctrlKey;
  
  console.log('[handleNormal] key:', key, 'kbRef:', kbRef.current, 'opRef:', opRef.current);
  
  // Count
  if (/^[0-9]$/.test(key) && !(key === '0' && countRef.current === '' && !opRef.current)) {
    countRef.current += key;
    dispatch({ type: 'SET_COUNT', payload: countRef.current });
    setCommand((opRef.current || '') + countRef.current);
    e.preventDefault();
    return true;
  }
  e.preventDefault();
  
  const pos = getPosition(editor);
  const content = getLineContent(editor, pos.lineNumber);
  const lc = getLineCount(editor);
  const cnt = getCount();
  
  // Macro recording
  if (key === 'q') {
    if (state.recordingMacro) {
      dispatch({ type: 'SET_MACRO', payload: { key: state.recordingMacro, keys: state.macroKeys } });
      dispatch({ type: 'SET_RECORDING_MACRO', payload: null });
      dispatch({ type: 'CLEAR_MACRO_KEYS' });
      showMsg(`Recorded @${state.recordingMacro}`, 1500);
    } else {
      dispatch({ type: 'SET_PENDING_CHAR', payload: 'q' as PendingCharCommand });
      setCommand('q');
    }
    return true;
  }
  if (state.recordingMacro && key !== 'q') dispatch({ type: 'ADD_MACRO_KEY', payload: key });
  
  // Register
  if (key === '"') { dispatch({ type: 'SET_PENDING_CHAR', payload: '"' }); setCommand('"'); return true; }
  
  // Dot repeat
  if (key === '.') {
    const le = state.lastEdit;
    if (le) {
      if (le.type === 'replace' && le.char && pos.column <= content.length) {
        editor.executeEdits('vim', [{ range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column + 1 }, text: le.char }]);
      } else if (le.type === 'deleteLine') {
        for (let i = 0; i < (le.count || 1); i++) {
          const cl = getPosition(editor).lineNumber;
          if (cl <= getLineCount(editor)) {
            const lcc = getLineContent(editor, cl);
            deleteRange(editor, cl, 1, cl, lcc.length + 2);
          }
        }
      } else if (le.type === 'insert' && le.insertedText) {
        editor.trigger('vim', 'type', { text: le.insertedText });
      }
    }
    return true;
  }
  
  // Jump history
  if (ctrl && key === 'o') {
    const h = jhRef.current;
    if (h.index > 0) { h.index--; const p = h.positions[h.index]; setPosition(editor, p.lineNumber, p.column); }
    return true;
  }
  if (ctrl && key === 'i') {
    const h = jhRef.current;
    if (h.index < h.positions.length - 1) { h.index++; const p = h.positions[h.index]; setPosition(editor, p.lineNumber, p.column); }
    return true;
  }
  
  // Search n/N
  if (key === 'n' || key === 'N') {
    const s = state.lastSearch;
    if (s.pattern) {
      const d = key === 'n' ? s.direction : (s.direction * -1) as 1|-1;
      addJump(pos);
      searchMove(editor, s.pattern, d, pos, showMsg);
    }
    return true;
  }
  
  // Repeat find ; ,
  if (key === ';' || key === ',') {
    const l = state.lastFindChar;
    if (l.char) {
      const d = key === ';' ? l.direction : (l.direction * -1) as 1|-1;
      const till = l.type === 't' || l.type === 'T';
      const tc = findCharInLine(content, pos.column, l.char, d, till);
      if (tc !== null) setPosition(editor, pos.lineNumber, tc);
    }
    return true;
  }
  
  // Basic movement
  switch (key) {
    case 'h': setPosition(editor, pos.lineNumber, Math.max(1, pos.column - cnt)); return true;
    case 'l': setPosition(editor, pos.lineNumber, Math.min(content.length, pos.column + cnt)); return true;
    case 'j': setPosition(editor, Math.min(lc, pos.lineNumber + cnt), pos.column); return true;
    case 'k': setPosition(editor, Math.max(1, pos.lineNumber - cnt), pos.column); return true;
    case '0': setPosition(editor, pos.lineNumber, 1); return true;
    case '^': setPosition(editor, pos.lineNumber, findFirstNonWhitespace(content)); return true;
    case '$': setPosition(editor, pos.lineNumber, Math.max(1, content.length)); return true;
  }
  
  // Word motion
  if (key === 'w') {
    if (opRef.current) {
      let ec = pos.column;
      for (let i = 0; i < cnt; i++) { const n = findNextWord(ec, content); if (n) ec = n; else ec = content.length + 1; }
      applyOp(editor, opRef.current, pos, { lineNumber: pos.lineNumber, column: ec }, dispatch, state, regRef.current, showMsg, setMode);
      opRef.current = null; regRef.current = '"'; kbRef.current = ''; setCommand('');
      return true;
    }
    let nc = pos.column;
    for (let i = 0; i < cnt; i++) { const n = findNextWord(nc, content); if (n) nc = n; else if (pos.lineNumber < lc) { setPosition(editor, pos.lineNumber + 1, 1); return true; } }
    setPosition(editor, pos.lineNumber, nc);
    return true;
  }
  if (key === 'e') {
    // Check for ge first
    if (kbRef.current === 'g') {
      kbRef.current = ''; setCommand('');
      let nc = pos.column;
      for (let i = 0; i < cnt; i++) { const p = findPrevWordEnd(nc, content); if (p) nc = p; }
      setPosition(editor, pos.lineNumber, nc);
      return true;
    }
    if (opRef.current) {
      let ec = pos.column;
      for (let i = 0; i < cnt; i++) { const n = findWordEndForward(ec, content); if (n) ec = n; }
      applyOp(editor, opRef.current, pos, { lineNumber: pos.lineNumber, column: ec + 1 }, dispatch, state, regRef.current, showMsg, setMode);
      opRef.current = null; regRef.current = '"'; kbRef.current = ''; setCommand('');
      return true;
    }
    let nc = pos.column;
    for (let i = 0; i < cnt; i++) { const n = findWordEndForward(nc, content); if (n) nc = n; }
    setPosition(editor, pos.lineNumber, nc);
    return true;
  }
  if (key === 'b') {
    if (opRef.current) {
      let sc = pos.column;
      for (let i = 0; i < cnt; i++) sc = findWordStart(sc, content);
      applyOp(editor, opRef.current, { lineNumber: pos.lineNumber, column: sc }, pos, dispatch, state, regRef.current, showMsg, setMode);
      opRef.current = null; regRef.current = '"'; kbRef.current = ''; setCommand('');
      return true;
    }
    let nc = pos.column;
    for (let i = 0; i < cnt; i++) nc = findWordStart(nc, content);
    setPosition(editor, pos.lineNumber, nc);
    return true;
  }
  
  // H M L
  if (key === 'H' || key === 'M' || key === 'L') {
    const vr = editor.getVisibleRanges();
    if (vr.length > 0) {
      addJump(pos);
      let tl = vr[0].startLineNumber;
      if (key === 'M') tl = Math.floor((vr[0].startLineNumber + vr[0].endLineNumber) / 2);
      else if (key === 'L') tl = vr[0].endLineNumber;
      setPosition(editor, tl, findFirstNonWhitespace(getLineContent(editor, tl)));
    }
    return true;
  }
  
  // Insert mode entries
  if (key === 'i') {
    if (opRef.current) { dispatch({ type: 'SET_PENDING_CHAR', payload: 'i' as PendingCharCommand }); setCommand(opRef.current + 'i'); return true; }
    setMode('INSERT'); editor.updateOptions({ cursorStyle: 'line' });
    dispatch({ type: 'SET_LAST_EDIT', payload: { type: 'insert', recording: true, insertedText: '' } });
    return true;
  }
  if (key === 'I') {
    setPosition(editor, pos.lineNumber, findFirstNonWhitespace(content));
    setMode('INSERT'); editor.updateOptions({ cursorStyle: 'line' });
    dispatch({ type: 'SET_LAST_EDIT', payload: { type: 'insert', recording: true, insertedText: '' } });
    return true;
  }
  if (key === 'a') {
    if (opRef.current) { dispatch({ type: 'SET_PENDING_CHAR', payload: 'a' as PendingCharCommand }); setCommand(opRef.current + 'a'); return true; }
    setPosition(editor, pos.lineNumber, Math.min(content.length + 1, pos.column + 1));
    setMode('INSERT'); editor.updateOptions({ cursorStyle: 'line' });
    dispatch({ type: 'SET_LAST_EDIT', payload: { type: 'insert', recording: true, insertedText: '' } });
    return true;
  }
  if (key === 'A') {
    setPosition(editor, pos.lineNumber, content.length + 1);
    setMode('INSERT'); editor.updateOptions({ cursorStyle: 'line' });
    dispatch({ type: 'SET_LAST_EDIT', payload: { type: 'insert', recording: true, insertedText: '' } });
    return true;
  }
  if (key === 'o') {
    editor.executeEdits('vim', [{ range: { startLineNumber: pos.lineNumber, startColumn: content.length + 1, endLineNumber: pos.lineNumber, endColumn: content.length + 1 }, text: '\n' }]);
    setPosition(editor, pos.lineNumber + 1, 1);
    setMode('INSERT'); editor.updateOptions({ cursorStyle: 'line' });
    dispatch({ type: 'SET_LAST_EDIT', payload: { type: 'insert', recording: true, insertedText: '' } });
    return true;
  }
  if (key === 'O') {
    editor.executeEdits('vim', [{ range: { startLineNumber: pos.lineNumber, startColumn: 1, endLineNumber: pos.lineNumber, endColumn: 1 }, text: '\n' }]);
    setPosition(editor, pos.lineNumber, 1);
    setMode('INSERT'); editor.updateOptions({ cursorStyle: 'line' });
    dispatch({ type: 'SET_LAST_EDIT', payload: { type: 'insert', recording: true, insertedText: '' } });
    return true;
  }
  
  // Visual modes
  if (key === 'v') {
    setMode('VISUAL');
    dispatch({ type: 'SET_VISUAL_START', payload: { lineNumber: pos.lineNumber, column: pos.column } });
    editor.setSelection({ startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column + 1 });
    return true;
  }
  if (key === 'V') {
    setMode('VISUAL_LINE');
    dispatch({ type: 'SET_VISUAL_START', payload: { lineNumber: pos.lineNumber, column: 1 } });
    editor.setSelection({ startLineNumber: pos.lineNumber, startColumn: 1, endLineNumber: pos.lineNumber, endColumn: content.length + 1 });
    return true;
  }
  
  // Delete x X s S
  if (key === 'x') {
    if (pos.column <= content.length) {
      const { text } = yankRange(editor, pos.lineNumber, pos.column, pos.lineNumber, pos.column + 1);
      dispatch({ type: 'SET_REGISTER', payload: { ...state.register, [regRef.current]: text, lines: false } });
      deleteRange(editor, pos.lineNumber, pos.column, pos.lineNumber, pos.column + 1);
      dispatch({ type: 'SET_LAST_EDIT', payload: { type: 'delete', count: 1 } });
    }
    regRef.current = '"';
    return true;
  }
  if (key === 'X') {
    if (pos.column > 1) {
      const { text } = yankRange(editor, pos.lineNumber, pos.column - 1, pos.lineNumber, pos.column);
      dispatch({ type: 'SET_REGISTER', payload: { ...state.register, [regRef.current]: text, lines: false } });
      deleteRange(editor, pos.lineNumber, pos.column - 1, pos.lineNumber, pos.column);
      setPosition(editor, pos.lineNumber, pos.column - 1);
      dispatch({ type: 'SET_LAST_EDIT', payload: { type: 'delete', count: 1 } });
    }
    regRef.current = '"';
    return true;
  }
  if (key === 's') {
    if (pos.column <= content.length) deleteRange(editor, pos.lineNumber, pos.column, pos.lineNumber, pos.column + 1);
    setMode('INSERT'); editor.updateOptions({ cursorStyle: 'line' });
    return true;
  }
  if (key === 'S') {
    editor.executeEdits('vim', [{ range: { startLineNumber: pos.lineNumber, startColumn: 1, endLineNumber: pos.lineNumber, endColumn: content.length + 1 }, text: '' }]);
    setPosition(editor, pos.lineNumber, 1);
    setMode('INSERT'); editor.updateOptions({ cursorStyle: 'line' });
    return true;
  }
  
  // Commands
  if (key === ':') { console.log('[handleNormal] : pressed, entering COMMAND mode'); setMode('COMMAND'); setCommand(':'); return true; }
  if (key === '/') { console.log('[handleNormal] / pressed, entering COMMAND mode'); setMode('COMMAND'); setCommand('/'); return true; }
  if (key === '?') { console.log('[handleNormal] ? pressed, entering COMMAND mode'); setMode('COMMAND'); setCommand('?'); return true; }
  
  // Pending char
  if (['r', 'f', 'F', 't', 'T'].includes(key)) { dispatch({ type: 'SET_PENDING_CHAR', payload: key as PendingCharCommand }); setCommand(key); return true; }
  if (key === 'm') { dispatch({ type: 'SET_PENDING_CHAR', payload: 'm' as PendingCharCommand }); setCommand('m'); return true; }
  if (key === "'" || key === '`') { dispatch({ type: 'SET_PENDING_CHAR', payload: key as PendingCharCommand }); setCommand(key); return true; }
  if (key === '@') { dispatch({ type: 'SET_PENDING_CHAR', payload: '@' as PendingCharCommand }); setCommand('@'); return true; }
  if (key === 'R') { dispatch({ type: 'SET_REPLACE_MODE', payload: true }); setMode('REPLACE'); editor.updateOptions({ cursorStyle: 'underline' }); return true; }
  
  // Operators
  if (['d', 'y', 'c', '>', '<'].includes(key)) {
    console.log('[handleNormal] Operator:', key, 'kbRef:', kbRef.current);
    if (kbRef.current === key) {
      console.log('[handleNormal] Double operator:', key + key);
      kbRef.current = ''; opRef.current = null; setCommand('');
      if (key === 'd') {
        // dd - delete current line
        const sl = pos.lineNumber;
        const el = Math.min(lc, pos.lineNumber + cnt - 1);
        
        // Yank the lines first
        let yt = '';
        for (let i = sl; i <= el; i++) yt += getLineContent(editor, i) + '\n';
        dispatch({ type: 'SET_REGISTER', payload: { ...state.register, [regRef.current]: yt, lines: true } });
        
        // Delete the lines
        if (lc === 1) {
          // Only one line - just clear content
          editor.executeEdits('vim', [{
            range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: getLineContent(editor, 1).length + 1 },
            text: '',
          }]);
        } else if (el < lc) {
          // Not the last line - delete from start of first line to start of line after last
          editor.executeEdits('vim', [{
            range: { startLineNumber: sl, startColumn: 1, endLineNumber: el + 1, endColumn: 1 },
            text: '',
          }]);
        } else {
          // Deleting the last line(s) - delete from end of previous line to end of last line
          const prevLineContent = sl > 1 ? getLineContent(editor, sl - 1) : '';
          editor.executeEdits('vim', [{
            range: { 
              startLineNumber: sl > 1 ? sl - 1 : 1, 
              startColumn: sl > 1 ? prevLineContent.length + 1 : 1, 
              endLineNumber: el, 
              endColumn: getLineContent(editor, el).length + 1 
            },
            text: '',
          }]);
        }
        
        dispatch({ type: 'SET_LAST_EDIT', payload: { type: 'deleteLine', count: cnt } });
        regRef.current = '"';
        console.log('[handleNormal] dd completed');
        return true;
      }
      if (key === 'y') {
        let yt = '';
        for (let i = 0; i < cnt && pos.lineNumber + i <= lc; i++) yt += getLineContent(editor, pos.lineNumber + i) + '\n';
        dispatch({ type: 'SET_REGISTER', payload: { ...state.register, [regRef.current]: yt, lines: true } });
        showMsg(`Yanked ${cnt} line(s)`, 1500);
        regRef.current = '"';
        return true;
      }
      if (key === 'c') {
        const { text } = yankRange(editor, pos.lineNumber, 1, pos.lineNumber, content.length + 1);
        dispatch({ type: 'SET_REGISTER', payload: { ...state.register, [regRef.current]: text, lines: false } });
        editor.executeEdits('vim', [{ range: { startLineNumber: pos.lineNumber, startColumn: 1, endLineNumber: pos.lineNumber, endColumn: content.length + 1 }, text: '' }]);
        setPosition(editor, pos.lineNumber, 1);
        setMode('INSERT'); editor.updateOptions({ cursorStyle: 'line' });
        regRef.current = '"';
        return true;
      }
      if (key === '>' || key === '<') {
        for (let i = 0; i < cnt; i++) { const ln = pos.lineNumber + i; if (ln <= lc) indentLine(editor, ln, key === '>' ? 1 : -1); }
        return true;
      }
    }
    kbRef.current = key; opRef.current = key; setCommand(key);
    console.log('[handleNormal] Set kbRef to:', key);
    return true;
  }
  
  // gg
  if (key === 'g' && kbRef.current === 'g') { kbRef.current = ''; setCommand(''); addJump(pos); setPosition(editor, 1, 1); return true; }
  if (key === 'g') { kbRef.current = 'g'; setCommand('g'); return true; }
  
  // G
  if (key === 'G') {
    addJump(pos);
    if (countRef.current) { const tl = parseInt(countRef.current) || lc; setPosition(editor, Math.min(tl, lc), 1); }
    else setPosition(editor, lc, 1);
    return true;
  }
  
  // Paste
  if (key === 'p') {
    const rVal = state.register[regRef.current] || state.register['"'];
    const r = typeof rVal === 'string' ? rVal : '';
    if (r) {
      if (state.register.lines) {
        editor.executeEdits('vim', [{ range: { startLineNumber: pos.lineNumber, startColumn: content.length + 1, endLineNumber: pos.lineNumber, endColumn: content.length + 1 }, text: '\n' + r.replace(/\n$/, '') }]);
        setPosition(editor, pos.lineNumber + 1, findFirstNonWhitespace(r.split('\n')[0] || ''));
      } else {
        editor.executeEdits('vim', [{ range: { startLineNumber: pos.lineNumber, startColumn: pos.column + 1, endLineNumber: pos.lineNumber, endColumn: pos.column + 1 }, text: r }]);
      }
    }
    regRef.current = '"';
    return true;
  }
  if (key === 'P') {
    const rVal = state.register[regRef.current] || state.register['"'];
    const r = typeof rVal === 'string' ? rVal : '';
    if (r) {
      if (state.register.lines) {
        editor.executeEdits('vim', [{ range: { startLineNumber: pos.lineNumber, startColumn: 1, endLineNumber: pos.lineNumber, endColumn: 1 }, text: r.replace(/\n$/, '') + '\n' }]);
        setPosition(editor, pos.lineNumber, findFirstNonWhitespace(r.split('\n')[0] || ''));
      } else {
        editor.executeEdits('vim', [{ range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column }, text: r }]);
      }
    }
    regRef.current = '"';
    return true;
  }
  
  // Undo Redo
  if (key === 'u') { editor.trigger('vim', 'undo', {}); return true; }
  if (ctrl && key === 'r') { editor.trigger('vim', 'redo', {}); return true; }
  
  // %
  if (key === '%') { const m = findMatchingBracket(editor, pos); if (m) { addJump(pos); setPosition(editor, m.lineNumber, m.column); } return true; }
  
  // Page movements
  if (ctrl && key === 'f') { setPosition(editor, Math.min(lc, pos.lineNumber + getScrollAmount(editor)), pos.column); return true; }
  if (ctrl && key === 'b') { setPosition(editor, Math.max(1, pos.lineNumber - getScrollAmount(editor)), pos.column); return true; }
  if (ctrl && key === 'd') { setPosition(editor, Math.min(lc, pos.lineNumber + getScrollAmount(editor, 0.5)), pos.column); return true; }
  if (ctrl && key === 'u') { setPosition(editor, Math.max(1, pos.lineNumber - getScrollAmount(editor, 0.5)), pos.column); return true; }
  
  // J join
  if (key === 'J') {
    if (pos.lineNumber < lc) {
      const nl = getLineContent(editor, pos.lineNumber + 1).trimStart();
      editor.executeEdits('vim', [{ range: { startLineNumber: pos.lineNumber, startColumn: content.length + 1, endLineNumber: pos.lineNumber + 1, endColumn: getLineContent(editor, pos.lineNumber + 1).length + 1 }, text: ' ' + nl }]);
    }
    return true;
  }
  
  // Clear buffer
  if (kbRef.current && !['g', 'd', 'y', 'c', '>', '<'].includes(key)) { 
    kbRef.current = ''; opRef.current = null; setCommand(''); 
  }
  return true;
}

export default useVim;
