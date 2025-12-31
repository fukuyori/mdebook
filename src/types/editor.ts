import type { EditorPosition, EditorRange } from './vim';

/**
 * Monaco Editor interface (minimal subset)
 */
export interface IMonacoEditor {
  getPosition(): EditorPosition | null;
  setPosition(position: EditorPosition): void;
  getModel(): IMonacoModel | null;
  getValue(): string;
  setValue(value: string): void;
  executeEdits(source: string, edits: IMonacoEdit[]): void;
  trigger(source: string, handlerId: string, payload?: unknown): void;
  updateOptions(options: Record<string, unknown>): void;
  getSelection(): EditorRange | null;
  setSelection(range: EditorRange): void;
  revealPosition(position: EditorPosition): void;
  revealLineInCenter(lineNumber: number): void;
  revealLineAtTop(lineNumber: number): void;
  revealLineNearBottom(lineNumber: number): void;
  getVisibleRanges(): EditorRange[];
  getLayoutInfo(): { height: number; width: number };
  getOption(option: number): unknown;
  getDomNode(): HTMLElement | null;
  onKeyDown(handler: (e: IMonacoKeyboardEvent) => void): IDisposable;
  onDidChangeModelContent(handler: (e: IMonacoContentChangeEvent) => void): IDisposable;
  onDidChangeCursorPosition(handler: (e: IMonacoCursorEvent) => void): IDisposable;
  focus(): void;
  dispose(): void;
}

/**
 * Monaco Model interface
 */
export interface IMonacoModel {
  getLineContent(lineNumber: number): string;
  getLineCount(): number;
  getValue(): string;
  getValueInRange(range: EditorRange): string;
  getFullModelRange(): EditorRange;
  getOffsetAt(position: EditorPosition): number;
  getPositionAt(offset: number): EditorPosition;
}

/**
 * Monaco Edit operation
 */
export interface IMonacoEdit {
  range: EditorRange;
  text: string;
}

/**
 * Monaco Keyboard Event
 */
export interface IMonacoKeyboardEvent {
  browserEvent: KeyboardEvent;
  preventDefault(): void;
  stopPropagation(): void;
}

/**
 * Monaco Content Change Event
 */
export interface IMonacoContentChangeEvent {
  changes: Array<{
    text: string;
    range: EditorRange;
  }>;
  isUndoing: boolean;
  isRedoing: boolean;
}

/**
 * Monaco Cursor Event
 */
export interface IMonacoCursorEvent {
  position: EditorPosition;
}

/**
 * Disposable interface
 */
export interface IDisposable {
  dispose(): void;
}

/**
 * Monaco namespace interface
 */
export interface IMonaco {
  editor: {
    create(container: HTMLElement, options: Record<string, unknown>): IMonacoEditor;
    defineTheme(name: string, theme: Record<string, unknown>): void;
    setTheme(name: string): void;
    EditorOption: {
      minimap: number;
      lineHeight: number;
    };
  };
}

/**
 * Monaco Editor component props
 */
export interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  isDark?: boolean;
  vimEnabled?: boolean;
  language?: string;
  fontSize?: number;
  tabSize?: number;
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  minimap?: boolean;
  readOnly?: boolean;
  className?: string;
  onMount?: (editor: IMonacoEditor, monaco: IMonaco) => void;
  onModeChange?: (mode: string) => void;
  onCursorChange?: (position: EditorPosition) => void;
}
