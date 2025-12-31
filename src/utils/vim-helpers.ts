import type { EditorPosition, EditorRange, TextObjectRange, IMonacoEditor, IMonacoModel } from '../types';
import { BRACKET_PAIRS, CLOSE_TO_OPEN_BRACKETS, QUOTE_CHARS } from '../constants';

/**
 * Get current cursor position
 */
export function getPosition(editor: IMonacoEditor): EditorPosition {
  return editor.getPosition() || { lineNumber: 1, column: 1 };
}

/**
 * Get model from editor
 */
export function getModel(editor: IMonacoEditor): IMonacoModel | null {
  return editor.getModel();
}

/**
 * Get line content
 */
export function getLineContent(editor: IMonacoEditor, lineNumber: number): string {
  const model = getModel(editor);
  return model ? model.getLineContent(lineNumber) : '';
}

/**
 * Get total line count
 */
export function getLineCount(editor: IMonacoEditor): number {
  const model = getModel(editor);
  return model ? model.getLineCount() : 0;
}

/**
 * Set cursor position
 */
export function setPosition(editor: IMonacoEditor, lineNumber: number, column: number): void {
  const pos = { lineNumber, column };
  editor.setPosition(pos);
  editor.revealPosition(pos);
}

/**
 * Find next word start position (w command)
 */
export function findNextWord(col: number, content: string): number | null {
  const rest = content.substring(col - 1);
  const match = rest.match(/^\S*\s+/);
  if (match) {
    return col + match[0].length;
  }
  return null;
}

/**
 * Find word end forward (e command)
 */
export function findWordEndForward(col: number, content: string): number | null {
  if (col >= content.length) return null;
  const rest = content.substring(col);
  const match = rest.match(/^\s*\S+/);
  if (match) {
    return col + match[0].length;
  }
  return null;
}

/**
 * Find previous word end (ge command)
 */
export function findPrevWordEnd(col: number, content: string): number | null {
  if (col <= 1) return null;
  const before = content.substring(0, col - 1);
  const match = before.match(/\S+\s*$/);
  if (match) {
    const wordEnd = before.lastIndexOf(match[0]) + match[0].trimEnd().length;
    if (wordEnd < col - 1) return wordEnd + 1;
  }
  return null;
}

/**
 * Find word start (b command)
 */
export function findWordStart(col: number, content: string): number {
  const before = content.substring(0, col - 1);
  const match = before.match(/\S+\s*$/);
  if (match) {
    return col - match[0].length;
  }
  return 1;
}

/**
 * Find first non-whitespace character in line (^ command)
 */
export function findFirstNonWhitespace(content: string): number {
  const match = content.match(/^\s*/);
  return (match ? match[0].length : 0) + 1;
}

/**
 * Find matching bracket
 */
export function findMatchingBracket(
  editor: IMonacoEditor,
  pos: EditorPosition
): EditorPosition | null {
  const content = getLineContent(editor, pos.lineNumber);
  const char = content[pos.column - 1];
  
  const isOpenBracket = char in BRACKET_PAIRS;
  const isCloseBracket = char in CLOSE_TO_OPEN_BRACKETS;
  
  if (!isOpenBracket && !isCloseBracket) return null;
  
  const model = getModel(editor);
  if (!model) return null;
  
  const searchForward = isOpenBracket;
  const targetChar = isOpenBracket ? BRACKET_PAIRS[char] : CLOSE_TO_OPEN_BRACKETS[char];
  const openChar = isOpenBracket ? char : targetChar;
  const closeChar = isOpenBracket ? targetChar : char;
  
  let depth = 1;
  let line = pos.lineNumber;
  let col = pos.column;
  const lineCount = getLineCount(editor);
  
  if (searchForward) {
    col++;
    while (line <= lineCount && depth > 0) {
      const lineContent = getLineContent(editor, line);
      while (col <= lineContent.length && depth > 0) {
        const c = lineContent[col - 1];
        if (c === openChar) depth++;
        else if (c === closeChar) depth--;
        if (depth > 0) col++;
      }
      if (depth > 0) {
        line++;
        col = 1;
      }
    }
  } else {
    col--;
    while (line >= 1 && depth > 0) {
      const lineContent = getLineContent(editor, line);
      while (col >= 1 && depth > 0) {
        const c = lineContent[col - 1];
        if (c === closeChar) depth++;
        else if (c === openChar) depth--;
        if (depth > 0) col--;
      }
      if (depth > 0) {
        line--;
        const prevContent = line >= 1 ? getLineContent(editor, line) : '';
        col = prevContent.length;
      }
    }
  }
  
  if (depth === 0) {
    return { lineNumber: line, column: col };
  }
  return null;
}

/**
 * Find character in line (f/F/t/T commands)
 */
export function findCharInLine(
  content: string,
  col: number,
  char: string,
  direction: 1 | -1,
  till: boolean
): number | null {
  if (direction === 1) {
    const idx = content.indexOf(char, col);
    if (idx >= 0) {
      return till ? idx : idx + 1;
    }
  } else {
    const idx = content.lastIndexOf(char, col - 2);
    if (idx >= 0) {
      return till ? idx + 2 : idx + 1;
    }
  }
  return null;
}

/**
 * Get word under cursor
 */
export function getWordUnderCursor(editor: IMonacoEditor): string {
  const pos = getPosition(editor);
  const content = getLineContent(editor, pos.lineNumber);
  
  let start = pos.column - 1;
  let end = pos.column - 1;
  
  // Find word boundaries
  while (start > 0 && /\w/.test(content[start - 1])) start--;
  while (end < content.length && /\w/.test(content[end])) end++;
  
  return content.substring(start, end);
}

/**
 * Get text object range
 */
export function getTextObject(
  editor: IMonacoEditor,
  char: string,
  inner: boolean
): TextObjectRange | null {
  const pos = getPosition(editor);
  const content = getLineContent(editor, pos.lineNumber);
  const col = pos.column - 1;
  
  // Word text object
  if (char === 'w' || char === 'W') {
    const pattern = char === 'w' ? /\w/ : /\S/;
    let start = col;
    let end = col;
    
    // Extend to word boundaries
    while (start > 0 && pattern.test(content[start - 1])) start--;
    while (end < content.length && pattern.test(content[end])) end++;
    
    if (inner) {
      return {
        start: { line: pos.lineNumber, col: start + 1 },
        end: { line: pos.lineNumber, col: end + 1 },
      };
    } else {
      // Include trailing whitespace for 'aw'
      while (end < content.length && /\s/.test(content[end])) end++;
      return {
        start: { line: pos.lineNumber, col: start + 1 },
        end: { line: pos.lineNumber, col: end + 1 },
      };
    }
  }
  
  // Quote text objects
  if (QUOTE_CHARS.includes(char)) {
    const firstIdx = content.indexOf(char);
    const lastIdx = content.lastIndexOf(char);
    
    if (firstIdx !== -1 && lastIdx > firstIdx) {
      if (inner) {
        return {
          start: { line: pos.lineNumber, col: firstIdx + 2 },
          end: { line: pos.lineNumber, col: lastIdx + 1 },
        };
      } else {
        return {
          start: { line: pos.lineNumber, col: firstIdx + 1 },
          end: { line: pos.lineNumber, col: lastIdx + 2 },
        };
      }
    }
    return null;
  }
  
  // Bracket text objects
  const bracketPairs: Record<string, [string, string]> = {
    '(': ['(', ')'],
    ')': ['(', ')'],
    '[': ['[', ']'],
    ']': ['[', ']'],
    '{': ['{', '}'],
    '}': ['{', '}'],
    '<': ['<', '>'],
    '>': ['<', '>'],
  };
  
  if (char in bracketPairs) {
    const [open, close] = bracketPairs[char];
    
    // Find opening bracket
    let depth = 0;
    let openPos: EditorPosition | null = null;
    
    for (let i = col; i >= 0; i--) {
      if (content[i] === close) depth++;
      else if (content[i] === open) {
        if (depth === 0) {
          openPos = { lineNumber: pos.lineNumber, column: i + 1 };
          break;
        }
        depth--;
      }
    }
    
    if (!openPos) return null;
    
    // Find closing bracket
    depth = 0;
    let closePos: EditorPosition | null = null;
    
    for (let i = openPos.column - 1; i < content.length; i++) {
      if (content[i] === open) depth++;
      else if (content[i] === close) {
        depth--;
        if (depth === 0) {
          closePos = { lineNumber: pos.lineNumber, column: i + 1 };
          break;
        }
      }
    }
    
    if (!closePos) return null;
    
    if (inner) {
      return {
        start: { line: openPos.lineNumber, col: openPos.column + 1 },
        end: { line: closePos.lineNumber, col: closePos.column },
      };
    } else {
      return {
        start: { line: openPos.lineNumber, col: openPos.column },
        end: { line: closePos.lineNumber, col: closePos.column + 1 },
      };
    }
  }
  
  return null;
}

/**
 * Indent or outdent a line
 */
export function indentLine(
  editor: IMonacoEditor,
  lineNumber: number,
  direction: 1 | -1,
  tabSize: number = 2
): void {
  const content = getLineContent(editor, lineNumber);
  const spaces = ' '.repeat(tabSize);
  let newContent: string;
  
  if (direction > 0) {
    newContent = spaces + content;
  } else {
    if (content.startsWith(spaces)) {
      newContent = content.substring(tabSize);
    } else if (content.startsWith('\t')) {
      newContent = content.substring(1);
    } else {
      newContent = content.replace(/^ +/, '');
    }
  }
  
  const range: EditorRange = {
    startLineNumber: lineNumber,
    startColumn: 1,
    endLineNumber: lineNumber,
    endColumn: content.length + 1,
  };
  
  editor.executeEdits('vim', [{ range, text: newContent }]);
}

/**
 * Delete range in editor
 */
export function deleteRange(
  editor: IMonacoEditor,
  startLine: number,
  startCol: number,
  endLine: number,
  endCol: number
): void {
  const model = getModel(editor);
  if (!model) return;
  
  // Adjust for line deletion
  if (startCol === 1 && endCol === 1 && endLine > startLine) {
    const prevLineLength = startLine > 1 ? getLineContent(editor, startLine - 1).length : 0;
    if (startLine > 1) {
      startLine--;
      startCol = prevLineLength + 1;
    }
  }
  
  const range: EditorRange = {
    startLineNumber: startLine,
    startColumn: startCol,
    endLineNumber: endLine,
    endColumn: endCol,
  };
  
  editor.executeEdits('vim', [{ range, text: '' }]);
}

/**
 * Yank (copy) range to register
 */
export function yankRange(
  editor: IMonacoEditor,
  startLine: number,
  startCol: number,
  endLine: number,
  endCol: number
): { text: string; lines: boolean } {
  const model = getModel(editor);
  if (!model) return { text: '', lines: false };
  
  const range: EditorRange = {
    startLineNumber: startLine,
    startColumn: startCol,
    endLineNumber: endLine,
    endColumn: endCol,
  };
  
  const text = model.getValueInRange(range);
  const lines = startCol === 1 && (endCol === 1 || endCol > getLineContent(editor, endLine).length);
  
  return { text, lines };
}

/**
 * Calculate scroll amount for page movements
 */
export function getScrollAmount(editor: IMonacoEditor, fraction: number = 1): number {
  const visibleRanges = editor.getVisibleRanges();
  if (visibleRanges.length === 0) return 20;
  
  const range = visibleRanges[0];
  const visibleLines = range.endLineNumber - range.startLineNumber;
  return Math.max(1, Math.floor(visibleLines * fraction));
}

/**
 * Check if character is a bracket
 */
export function isBracket(char: string): boolean {
  return char in BRACKET_PAIRS || char in CLOSE_TO_OPEN_BRACKETS;
}

/**
 * Check if in visual mode
 */
export function isVisualMode(mode: string): boolean {
  return mode === 'VISUAL' || mode === 'VISUAL_LINE';
}
