/**
 * VIM Mode types
 */
export type VimMode = 'NORMAL' | 'INSERT' | 'VISUAL' | 'VISUAL_LINE' | 'COMMAND' | 'REPLACE';

/**
 * VIM Register for yank/paste
 */
export interface VimRegister {
  '"': string;
  lines: boolean;
  [key: string]: string | boolean;
}

/**
 * VIM Mark position
 */
export interface VimMark {
  lineNumber: number;
  column: number;
}

/**
 * Collection of marks
 */
export type VimMarks = Record<string, VimMark>;

/**
 * Collection of macros (key -> array of key strings)
 */
export type VimMacros = Record<string, string[]>;

/**
 * Search state for / and ? commands
 */
export interface SearchState {
  pattern: string;
  direction: 1 | -1;
}

/**
 * Find char state for f/F/t/T commands
 */
export interface FindCharState {
  char: string;
  type: string;
  direction: 1 | -1;
}

/**
 * Visual mode start position
 */
export interface VisualStart {
  lineNumber: number;
  column: number;
}

/**
 * Last edit for dot command repetition
 */
export interface LastEdit {
  type: string;
  count?: number;
  char?: string;
  direction?: number;
  insertedText?: string;
  replacedText?: string;
  startPos?: EditorPosition;
  endPos?: EditorPosition;
  recording?: boolean;
}

/**
 * Pending char command type
 */
export type PendingCharCommand = 'r' | 'f' | 'F' | 't' | 'T' | 'm' | "'" | '`' | '@' | '"' | 'q' | 'i' | 'a' | null;

/**
 * Text object characters
 */
export type TextObjectChar = 'w' | 'W' | '"' | "'" | '`' | '(' | ')' | '[' | ']' | '{' | '}' | '<' | '>';

/**
 * Text object range result
 */
export interface TextObjectRange {
  start: { line: number; col: number };
  end: { line: number; col: number };
}

/**
 * Editor position (line and column)
 */
export interface EditorPosition {
  lineNumber: number;
  column: number;
}

/**
 * Editor range (start and end positions)
 */
export interface EditorRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

/**
 * Complete VIM state
 */
export interface VimState {
  mode: VimMode;
  command: string;
  keyBuffer: string;
  count: string;
  register: VimRegister;
  marks: VimMarks;
  macros: VimMacros;
  recordingMacro: string | null;
  macroKeys: string[];
  lastSearch: SearchState;
  lastFindChar: FindCharState;
  visualStart: VisualStart | null;
  lastEdit: LastEdit | null;
  pendingChar: PendingCharCommand;
  replaceMode: boolean;
}

/**
 * VIM state action types
 */
export type VimAction =
  | { type: 'SET_MODE'; payload: VimMode }
  | { type: 'SET_COMMAND'; payload: string }
  | { type: 'SET_KEY_BUFFER'; payload: string }
  | { type: 'SET_COUNT'; payload: string }
  | { type: 'SET_REGISTER'; payload: VimRegister }
  | { type: 'SET_MARK'; payload: { key: string; mark: VimMark } }
  | { type: 'SET_MACRO'; payload: { key: string; keys: string[] } }
  | { type: 'SET_RECORDING_MACRO'; payload: string | null }
  | { type: 'ADD_MACRO_KEY'; payload: string }
  | { type: 'CLEAR_MACRO_KEYS' }
  | { type: 'SET_LAST_SEARCH'; payload: SearchState }
  | { type: 'SET_LAST_FIND_CHAR'; payload: FindCharState }
  | { type: 'SET_VISUAL_START'; payload: VisualStart | null }
  | { type: 'SET_LAST_EDIT'; payload: LastEdit | null }
  | { type: 'UPDATE_LAST_EDIT'; payload: Partial<LastEdit> }
  | { type: 'SET_PENDING_CHAR'; payload: PendingCharCommand }
  | { type: 'SET_REPLACE_MODE'; payload: boolean }
  | { type: 'RESET' };
