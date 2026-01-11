import type { UILanguage } from '../types';

/**
 * Translation strings interface
 */
export interface TranslationStrings {
  // App
  appTitle: string;
  version: string;
  
  // Buttons
  vim: string;
  toc: string;
  hidePreview: string;
  showPreview: string;
  insertImage: string;
  importFile: string;
  importUrl: string;
  export: string;
  exportMarkdown: string;
  currentFile: string;
  settings: string;
  lightMode: string;
  darkMode: string;
  open: string;
  save: string;
  newFile: string;
  untitled: string;
  
  // Settings
  title: string;
  author: string;
  language: string;
  uiLanguage: string;
  coverImage: string;
  noCover: string;
  theme: string;
  themeClassic: string;
  themeModern: string;
  themeTechnical: string;
  themeNovel: string;
  themeAcademic: string;
  themeCustom: string;
  importCss: string;
  exportCss: string;
  customCssLoaded: string;
  tocDepth: string;
  tocDepthNone: string;
  
  // Import Modal
  importFromUrl: string;
  enterMarkdownUrl: string;
  supportedUrls: string;
  qiitaArticle: string;
  githubAuto: string;
  directMd: string;
  cancel: string;
  import: string;
  importing: string;
  
  // Status messages
  generating: string;
  generationComplete: string;
  error: string;
  projectSaved: string;
  projectLoaded: string;
  filesImported: string;
  importComplete: string;
  importError: string;
  loadError: string;
  invalidProject: string;
  fileOpened: string;
  fileSaved: string;
  imageAdded: string;
  
  // PDF Font Settings
  pdfFontSettings: string;
  pdfFontDescription: string;
  pdfFontRegular: string;
  pdfFontBold: string;
  pdfFontNotSet: string;
  pdfFontUpload: string;
  pdfFontDelete: string;
  pdfFontDownloadHint: string;
  pdfFontSaved: string;
  pdfFontDeleted: string;
  
  // Footer
  files: string;
  characters: string;
  
  // Sample content
  sampleChapter: string;
  sampleTitle: string;
  sampleIntro: string;
  sampleFeatures: string;
  sampleFeature1: string;
  sampleFeature2: string;
  sampleFeature3: string;
  sampleFeature4: string;
  sampleFeature5: string;
  sampleFeature6: string;
  sampleFeature7: string;
  sampleFeature8: string;
  sampleTableTitle: string;
  sampleTableH1: string;
  sampleTableH2: string;
  sampleTableH3: string;
  sampleTableR1C1: string;
  sampleTableR1C2: string;
  sampleTableR2C1: string;
  sampleTableR2C2: string;
  sampleTableR3C1: string;
  sampleTableR3C2: string;
  sampleTableR4C1: string;
  sampleTableR4C2: string;
  sampleMermaidTitle: string;
  sampleMermaid1: string;
  sampleMermaid2: string;
  sampleMermaid3: string;
  sampleMermaid4: string;
  sampleMermaid5: string;
  sampleCodeTitle: string;
  sampleParagraph: string;
  sampleFootnote: string;
  
  // File names
  defaultFileName: string;
  
  // Languages
  langJa: string;
  langEn: string;
  langZh: string;
  langEs: string;
  langKo: string;
  
  // Import dialog
  selectFiles: string;
  supportedFormats: string;
  or: string;
  
  // Conflict warning
  warning: string;
  conflictMessage: string;
  continueButton: string;
  
  // New chapter
  newChapter: string;
  writeContentHere: string;
  
  // Templates
  addTemplate: string;
  templateColophon: string;
  templatePreface: string;
  templateChapterTitle: string;
  templateBibliography: string;
  colophonTitle: string;
  colophonBookTitle: string;
  colophonAuthor: string;
  colophonPublisher: string;
  colophonPublishDate: string;
  colophonCopyright: string;
  colophonEbookCode: string;
  colophonOriginalEdition: string;
  colophonRestrictions: string;
}

/**
 * English translations
 */
export const en: TranslationStrings = {
  // App
  appTitle: 'MDebook',
  version: 'Version',
  
  // Buttons
  vim: 'VIM',
  toc: 'Table of Contents',
  hidePreview: 'Hide Preview',
  showPreview: 'Show Preview',
  insertImage: 'Insert Image',
  importFile: 'Import from File',
  importUrl: 'Import from URL',
  export: 'Export',
  exportMarkdown: 'Markdown (ZIP)',
  currentFile: 'Current File',
  settings: 'Settings',
  lightMode: 'Light Mode',
  darkMode: 'Dark Mode',
  open: 'Open',
  save: 'Save',
  newFile: 'New File',
  untitled: 'Untitled',
  
  // Settings
  title: 'Title',
  author: 'Author',
  language: 'Language',
  uiLanguage: 'UI Language',
  coverImage: 'Cover Image',
  noCover: 'No Cover',
  theme: 'Theme',
  themeClassic: 'Classic',
  themeModern: 'Modern',
  themeTechnical: 'Technical',
  themeNovel: 'Novel',
  themeAcademic: 'Academic',
  themeCustom: 'Custom',
  importCss: 'Import CSS',
  exportCss: 'Export CSS',
  customCssLoaded: 'Custom CSS loaded',
  tocDepth: 'TOC Depth',
  tocDepthNone: 'None',
  
  // Import Modal
  importFromUrl: 'Import from URL',
  enterMarkdownUrl: 'Enter Markdown file URL',
  supportedUrls: 'Supported URLs:',
  qiitaArticle: 'Qiita articles (auto-appends .md)',
  githubAuto: 'GitHub (auto-converts to raw URL)',
  directMd: 'Direct .md file URLs',
  cancel: 'Cancel',
  import: 'Import',
  importing: 'Importing...',
  
  // Status messages
  generating: 'Generating',
  generationComplete: 'generation complete',
  error: 'Error',
  projectSaved: 'Project saved',
  projectLoaded: 'Project loaded',
  filesImported: 'file(s) imported',
  importComplete: 'Import complete',
  importError: 'Import error',
  loadError: 'Load error',
  invalidProject: 'Invalid project file',
  fileOpened: 'File opened',
  fileSaved: 'File saved',
  imageAdded: 'Image added',
  
  // PDF Font Settings
  pdfFontSettings: 'PDF Font Settings',
  pdfFontDescription: 'Upload Japanese fonts (TTF/OTF) for PDF export. Fonts are saved locally.',
  pdfFontRegular: 'Regular',
  pdfFontBold: 'Bold',
  pdfFontNotSet: 'Not set',
  pdfFontUpload: 'Upload',
  pdfFontDelete: 'Delete',
  pdfFontDownloadHint: 'Download Noto Sans JP from Google Fonts',
  pdfFontSaved: 'Font saved',
  pdfFontDeleted: 'Font deleted',
  
  // Footer
  files: 'files',
  characters: 'characters',
  
  // Sample content
  sampleChapter: 'Chapter 1',
  sampleTitle: 'Getting Started',
  sampleIntro: 'This is a sample of the **Markdown eBook Editor**.',
  sampleFeatures: 'Key Features',
  sampleFeature1: 'VIM keybindings for editing',
  sampleFeature2: 'EPUB/PDF export',
  sampleFeature3: 'Multiple file merge',
  sampleFeature4: 'Image embedding',
  sampleFeature5: 'Mermaid diagram support',
  sampleFeature6: 'Footnote creation',
  sampleFeature7: 'Auto-generated table of contents',
  sampleFeature8: 'Table display',
  sampleTableTitle: 'Table Example',
  sampleTableH1: 'Feature',
  sampleTableH2: 'Description',
  sampleTableH3: 'Status',
  sampleTableR1C1: 'VIM Mode',
  sampleTableR1C2: 'Navigate with `hjkl`, insert with `i`',
  sampleTableR2C1: 'EPUB Export',
  sampleTableR2C2: 'Export as eBook format',
  sampleTableR3C1: 'PDF Export',
  sampleTableR3C2: 'Generate printable PDF',
  sampleTableR4C1: 'Mermaid',
  sampleTableR4C2: 'Draw **diagrams**',
  sampleMermaidTitle: 'Mermaid Diagram Example',
  sampleMermaid1: 'Markdown',
  sampleMermaid2: 'Parse',
  sampleMermaid3: 'HTML Convert',
  sampleMermaid4: 'EPUB Gen',
  sampleMermaid5: 'PDF Gen',
  sampleCodeTitle: 'Code Example',
  sampleParagraph: 'This is a regular paragraph. You can use **bold** and *italic* text.',
  sampleFootnote: 'This is a sample footnote. It appears at the bottom of the page.',
  
  // File names
  defaultFileName: 'File',
  
  // Languages
  langJa: 'Japanese',
  langEn: 'English',
  langZh: 'Chinese',
  langEs: 'Spanish',
  langKo: 'Korean',
  
  // Import dialog
  selectFiles: 'Select Files',
  supportedFormats: '.md, .txt, .mdebook supported (multiple)',
  or: 'or',
  
  // Conflict warning
  warning: '⚠️ Warning',
  conflictMessage: 'This project may be being edited in another tab. Do you want to continue?',
  continueButton: 'Continue',
  
  // New chapter
  newChapter: 'New Chapter',
  writeContentHere: 'Write your content here.',
  
  // Templates
  addTemplate: 'Add Template',
  templateColophon: 'Colophon',
  templatePreface: 'Preface',
  templateChapterTitle: 'Chapter Title Page',
  templateBibliography: 'Bibliography',
  colophonTitle: 'Colophon',
  colophonBookTitle: 'Book Title',
  colophonAuthor: 'Author',
  colophonPublisher: 'Publisher',
  colophonPublishDate: 'Publication Date',
  colophonCopyright: 'Copyright',
  colophonEbookCode: 'E-book Code',
  colophonOriginalEdition: 'Original Edition',
  colophonRestrictions: 'Unauthorized reproduction, reprinting, or modification of this book is prohibited.',
};

/**
 * Japanese translations
 */
export const ja: TranslationStrings = {
  // App
  appTitle: 'MDebook',
  version: 'バージョン',
  
  // Buttons
  vim: 'VIM',
  toc: '目次',
  hidePreview: 'プレビューを隠す',
  showPreview: 'プレビューを表示',
  insertImage: '画像を挿入',
  importFile: 'ファイルからインポート',
  importUrl: 'URLからインポート',
  export: 'エクスポート',
  exportMarkdown: 'Markdown (ZIP)',
  currentFile: '現在のファイル',
  settings: '設定',
  lightMode: 'ライトモード',
  darkMode: 'ダークモード',
  open: '開く',
  save: '保存',
  newFile: '新規ファイル',
  untitled: '無題',
  
  // Settings
  title: 'タイトル',
  author: '著者',
  language: '言語',
  uiLanguage: 'UI言語',
  coverImage: '表紙画像',
  noCover: '表紙なし',
  theme: 'テーマ',
  themeClassic: 'クラシック',
  themeModern: 'モダン',
  themeTechnical: 'テクニカル',
  themeNovel: '小説',
  themeAcademic: 'アカデミック',
  themeCustom: 'カスタム',
  importCss: 'CSSインポート',
  exportCss: 'CSSエクスポート',
  customCssLoaded: 'カスタムCSS読込完了',
  tocDepth: '目次深度',
  tocDepthNone: 'なし',
  
  // Import Modal
  importFromUrl: 'URLからインポート',
  enterMarkdownUrl: 'MarkdownファイルのURLを入力',
  supportedUrls: '対応するURL:',
  qiitaArticle: 'Qiita記事 (.mdを自動追加)',
  githubAuto: 'GitHub (rawに自動変換)',
  directMd: '直接の.mdファイルURL',
  cancel: 'キャンセル',
  import: 'インポート',
  importing: 'インポート中...',
  
  // Status messages
  generating: '生成中',
  generationComplete: '生成が完了しました',
  error: 'エラー',
  projectSaved: 'プロジェクトを保存しました',
  projectLoaded: 'プロジェクトを読み込みました',
  filesImported: 'ファイルをインポートしました',
  importComplete: 'インポートが完了しました',
  importError: 'インポートエラー',
  loadError: '読み込みエラー',
  invalidProject: '無効なプロジェクトファイル',
  fileOpened: 'ファイルを開きました',
  fileSaved: 'ファイルを保存しました',
  imageAdded: '画像を追加しました',
  
  // PDF Font Settings
  pdfFontSettings: 'PDF用フォント設定',
  pdfFontDescription: 'PDF出力用の日本語フォント（TTF/OTF）をアップロードしてください。フォントはローカルに保存されます。',
  pdfFontRegular: '標準',
  pdfFontBold: '太字',
  pdfFontNotSet: '未設定',
  pdfFontUpload: 'アップロード',
  pdfFontDelete: '削除',
  pdfFontDownloadHint: 'Google FontsからNoto Sans JPをダウンロード',
  pdfFontSaved: 'フォントを保存しました',
  pdfFontDeleted: 'フォントを削除しました',
  
  // Footer
  files: 'ファイル',
  characters: '文字',
  
  // Sample content
  sampleChapter: '第1章',
  sampleTitle: 'はじめに',
  sampleIntro: 'これは**Markdown電子書籍エディタ**のサンプルです。',
  sampleFeatures: '基本的な機能',
  sampleFeature1: 'VIMキーバインドでの編集',
  sampleFeature2: 'EPUB/PDF出力',
  sampleFeature3: '複数ファイルの結合',
  sampleFeature4: '画像埋め込み',
  sampleFeature5: 'Mermaid図の挿入',
  sampleFeature6: '脚注作成',
  sampleFeature7: '目次自動生成',
  sampleFeature8: 'テーブル表示',
  sampleTableTitle: 'テーブル例',
  sampleTableH1: '機能',
  sampleTableH2: '説明',
  sampleTableH3: '状態',
  sampleTableR1C1: 'VIMモード',
  sampleTableR1C2: '`hjkl`で移動、`i`で挿入',
  sampleTableR2C1: 'EPUB出力',
  sampleTableR2C2: '電子書籍形式で出力',
  sampleTableR3C1: 'PDF出力',
  sampleTableR3C2: '印刷可能なPDFを生成',
  sampleTableR4C1: 'Mermaid',
  sampleTableR4C2: '**図**を描画',
  sampleMermaidTitle: 'Mermaid図の例',
  sampleMermaid1: 'Markdown',
  sampleMermaid2: 'パース',
  sampleMermaid3: 'HTML変換',
  sampleMermaid4: 'EPUB生成',
  sampleMermaid5: 'PDF生成',
  sampleCodeTitle: 'コード例',
  sampleParagraph: 'これは通常の段落です。**太字**や*斜体*が使えます。',
  sampleFootnote: 'これはサンプルの脚注です。ページの下部に表示されます。',
  
  // File names
  defaultFileName: 'ファイル',
  
  // Languages
  langJa: '日本語',
  langEn: '英語',
  langZh: '中国語',
  langEs: 'スペイン語',
  langKo: '韓国語',
  
  // Import dialog
  selectFiles: 'ファイルを選択',
  supportedFormats: '.md, .txt, .mdebook 対応（複数可）',
  or: 'または',
  
  // Conflict warning
  warning: '⚠️ 警告',
  conflictMessage: 'このプロジェクトは別のタブで編集中の可能性があります。続行しますか？',
  continueButton: '続行',
  
  // New chapter
  newChapter: '新しい章',
  writeContentHere: 'ここに内容を書いてください。',
  
  // Templates
  addTemplate: 'テンプレート追加',
  templateColophon: '奥付',
  templatePreface: 'はじめに',
  templateChapterTitle: '章扉',
  templateBibliography: '参考文献',
  colophonTitle: '奥付',
  colophonBookTitle: '書名',
  colophonAuthor: '著者',
  colophonPublisher: '発行',
  colophonPublishDate: '発行日',
  colophonCopyright: '著作権',
  colophonEbookCode: '電子出版コード',
  colophonOriginalEdition: '底本',
  colophonRestrictions: '本書の無断複製、転載、改ざんを禁じます。',
};

/**
 * Chinese (Simplified) translations
 */
export const zh: TranslationStrings = {
  // App
  appTitle: 'MDebook',
  version: '版本',
  
  // Buttons
  vim: 'VIM',
  toc: '目录',
  hidePreview: '隐藏预览',
  showPreview: '显示预览',
  insertImage: '插入图片',
  importFile: '从文件导入',
  importUrl: '从URL导入',
  export: '导出',
  exportMarkdown: 'Markdown (ZIP)',
  currentFile: '当前文件',
  settings: '设置',
  lightMode: '浅色模式',
  darkMode: '深色模式',
  open: '打开',
  save: '保存',
  newFile: '新建文件',
  untitled: '未命名',
  
  // Settings
  title: '标题',
  author: '作者',
  language: '语言',
  uiLanguage: 'UI语言',
  coverImage: '封面图片',
  noCover: '无封面',
  theme: '主题',
  themeClassic: '经典',
  themeModern: '现代',
  themeTechnical: '技术',
  themeNovel: '小说',
  themeAcademic: '学术',
  themeCustom: '自定义',
  importCss: '导入CSS',
  exportCss: '导出CSS',
  customCssLoaded: '自定义CSS已加载',
  tocDepth: '目录深度',
  tocDepthNone: '无',
  
  // Import Modal
  importFromUrl: '从URL导入',
  enterMarkdownUrl: '输入Markdown文件的URL',
  supportedUrls: '支持的URL：',
  qiitaArticle: 'Qiita文章（自动添加.md）',
  githubAuto: 'GitHub（自动转换为raw）',
  directMd: '直接的.md文件URL',
  cancel: '取消',
  import: '导入',
  importing: '导入中...',
  
  // Status messages
  generating: '生成中',
  generationComplete: '生成完成',
  error: '错误',
  projectSaved: '项目已保存',
  projectLoaded: '项目已加载',
  filesImported: '个文件已导入',
  importComplete: '导入完成',
  importError: '导入错误',
  loadError: '加载错误',
  invalidProject: '无效的项目文件',
  fileOpened: '文件已打开',
  fileSaved: '文件已保存',
  imageAdded: '图片已添加',
  
  // PDF Font Settings
  pdfFontSettings: 'PDF字体设置',
  pdfFontDescription: '上传日文/中文字体（TTF/OTF）用于PDF导出。字体保存在本地。',
  pdfFontRegular: '常规',
  pdfFontBold: '粗体',
  pdfFontNotSet: '未设置',
  pdfFontUpload: '上传',
  pdfFontDelete: '删除',
  pdfFontDownloadHint: '从Google Fonts下载Noto Sans',
  pdfFontSaved: '字体已保存',
  pdfFontDeleted: '字体已删除',
  
  // Footer
  files: '文件',
  characters: '字符',
  
  // Sample content
  sampleChapter: '第1章',
  sampleTitle: '简介',
  sampleIntro: '这是**Markdown电子书编辑器**的示例。',
  sampleFeatures: '基本功能',
  sampleFeature1: 'VIM键绑定编辑',
  sampleFeature2: 'EPUB/PDF输出',
  sampleFeature3: '多文件合并',
  sampleFeature4: '图片嵌入',
  sampleFeature5: 'Mermaid图表插入',
  sampleFeature6: '脚注创建',
  sampleFeature7: '目录自动生成',
  sampleFeature8: '表格显示',
  sampleTableTitle: '表格示例',
  sampleTableH1: '功能',
  sampleTableH2: '说明',
  sampleTableH3: '状态',
  sampleTableR1C1: 'VIM模式',
  sampleTableR1C2: '用`hjkl`移动，用`i`插入',
  sampleTableR2C1: 'EPUB输出',
  sampleTableR2C2: '电子书格式输出',
  sampleTableR3C1: 'PDF输出',
  sampleTableR3C2: '生成可打印的PDF',
  sampleTableR4C1: 'Mermaid',
  sampleTableR4C2: '绘制**图表**',
  sampleMermaidTitle: 'Mermaid图表示例',
  sampleMermaid1: 'Markdown',
  sampleMermaid2: '解析',
  sampleMermaid3: 'HTML转换',
  sampleMermaid4: 'EPUB生成',
  sampleMermaid5: 'PDF生成',
  sampleCodeTitle: '代码示例',
  sampleParagraph: '这是一个普通段落。可以使用**粗体**和*斜体*。',
  sampleFootnote: '这是示例脚注。它显示在页面底部。',
  
  // File names
  defaultFileName: '文件',
  
  // Languages
  langJa: '日语',
  langEn: '英语',
  langZh: '中文',
  langEs: '西班牙语',
  langKo: '韩语',
  
  // Import dialog
  selectFiles: '选择文件',
  supportedFormats: '支持 .md, .txt, .mdebook（可多选）',
  or: '或',
  
  // Conflict warning
  warning: '⚠️ 警告',
  conflictMessage: '此项目可能正在另一个标签页中编辑。是否继续？',
  continueButton: '继续',
  
  // New chapter
  newChapter: '新章节',
  writeContentHere: '在此输入内容。',
  
  // Templates
  addTemplate: '添加模板',
  templateColophon: '版权页',
  templatePreface: '前言',
  templateChapterTitle: '章节扉页',
  templateBibliography: '参考文献',
  colophonTitle: '版权页',
  colophonBookTitle: '书名',
  colophonAuthor: '作者',
  colophonPublisher: '出版',
  colophonPublishDate: '出版日期',
  colophonCopyright: '版权',
  colophonEbookCode: '电子出版代码',
  colophonOriginalEdition: '底本',
  colophonRestrictions: '未经许可，禁止复制、转载或篡改本书。',
};

/**
 * Spanish translations
 */
export const es: TranslationStrings = {
  // App
  appTitle: 'MDebook',
  version: 'Versión',
  
  // Buttons
  vim: 'VIM',
  toc: 'Índice',
  hidePreview: 'Ocultar vista previa',
  showPreview: 'Mostrar vista previa',
  insertImage: 'Insertar imagen',
  importFile: 'Importar desde archivo',
  importUrl: 'Importar desde URL',
  export: 'Exportar',
  exportMarkdown: 'Markdown (ZIP)',
  currentFile: 'Archivo actual',
  settings: 'Configuración',
  lightMode: 'Modo claro',
  darkMode: 'Modo oscuro',
  open: 'Abrir',
  save: 'Guardar',
  newFile: 'Nuevo archivo',
  untitled: 'Sin título',
  
  // Settings
  title: 'Título',
  author: 'Autor',
  language: 'Idioma',
  uiLanguage: 'Idioma de UI',
  coverImage: 'Imagen de portada',
  noCover: 'Sin portada',
  theme: 'Tema',
  themeClassic: 'Clásico',
  themeModern: 'Moderno',
  themeTechnical: 'Técnico',
  themeNovel: 'Novela',
  themeAcademic: 'Académico',
  themeCustom: 'Personalizado',
  importCss: 'Importar CSS',
  exportCss: 'Exportar CSS',
  customCssLoaded: 'CSS personalizado cargado',
  tocDepth: 'Profundidad del índice',
  tocDepthNone: 'Ninguno',
  
  // Import Modal
  importFromUrl: 'Importar desde URL',
  enterMarkdownUrl: 'Ingrese la URL del archivo Markdown',
  supportedUrls: 'URLs compatibles:',
  qiitaArticle: 'Artículo de Qiita (agrega .md automáticamente)',
  githubAuto: 'GitHub (convierte a raw automáticamente)',
  directMd: 'URL directa de archivo .md',
  cancel: 'Cancelar',
  import: 'Importar',
  importing: 'Importando...',
  
  // Status messages
  generating: 'Generando',
  generationComplete: 'Generación completada',
  error: 'Error',
  projectSaved: 'Proyecto guardado',
  projectLoaded: 'Proyecto cargado',
  filesImported: 'archivos importados',
  importComplete: 'Importación completada',
  importError: 'Error de importación',
  loadError: 'Error de carga',
  invalidProject: 'Archivo de proyecto inválido',
  fileOpened: 'Archivo abierto',
  fileSaved: 'Archivo guardado',
  imageAdded: 'Imagen agregada',
  
  // PDF Font Settings
  pdfFontSettings: 'Configuración de fuentes PDF',
  pdfFontDescription: 'Suba fuentes (TTF/OTF) para la exportación PDF. Las fuentes se guardan localmente.',
  pdfFontRegular: 'Normal',
  pdfFontBold: 'Negrita',
  pdfFontNotSet: 'No configurado',
  pdfFontUpload: 'Subir',
  pdfFontDelete: 'Eliminar',
  pdfFontDownloadHint: 'Descargar Noto Sans de Google Fonts',
  pdfFontSaved: 'Fuente guardada',
  pdfFontDeleted: 'Fuente eliminada',
  
  // Footer
  files: 'archivos',
  characters: 'caracteres',
  
  // Sample content
  sampleChapter: 'Capítulo 1',
  sampleTitle: 'Introducción',
  sampleIntro: 'Este es un ejemplo del **Editor de libros electrónicos Markdown**.',
  sampleFeatures: 'Funciones básicas',
  sampleFeature1: 'Edición con atajos VIM',
  sampleFeature2: 'Exportación EPUB/PDF',
  sampleFeature3: 'Combinación de múltiples archivos',
  sampleFeature4: 'Incrustación de imágenes',
  sampleFeature5: 'Inserción de diagramas Mermaid',
  sampleFeature6: 'Creación de notas al pie',
  sampleFeature7: 'Generación automática de índice',
  sampleFeature8: 'Visualización de tablas',
  sampleTableTitle: 'Ejemplo de tabla',
  sampleTableH1: 'Función',
  sampleTableH2: 'Descripción',
  sampleTableH3: 'Estado',
  sampleTableR1C1: 'Modo VIM',
  sampleTableR1C2: 'Navegar con `hjkl`, insertar con `i`',
  sampleTableR2C1: 'Exportar EPUB',
  sampleTableR2C2: 'Exportar en formato de libro electrónico',
  sampleTableR3C1: 'Exportar PDF',
  sampleTableR3C2: 'Generar PDF imprimible',
  sampleTableR4C1: 'Mermaid',
  sampleTableR4C2: 'Dibujar **diagramas**',
  sampleMermaidTitle: 'Ejemplo de diagrama Mermaid',
  sampleMermaid1: 'Markdown',
  sampleMermaid2: 'Analizar',
  sampleMermaid3: 'Convertir HTML',
  sampleMermaid4: 'Generar EPUB',
  sampleMermaid5: 'Generar PDF',
  sampleCodeTitle: 'Ejemplo de código',
  sampleParagraph: 'Este es un párrafo normal. Puede usar texto en **negrita** y *cursiva*.',
  sampleFootnote: 'Esta es una nota al pie de ejemplo. Aparece en la parte inferior de la página.',
  
  // File names
  defaultFileName: 'Archivo',
  
  // Languages
  langJa: 'Japonés',
  langEn: 'Inglés',
  langZh: 'Chino',
  langEs: 'Español',
  langKo: 'Coreano',
  
  // Import dialog
  selectFiles: 'Seleccionar archivos',
  supportedFormats: '.md, .txt, .mdebook compatible (múltiple)',
  or: 'o',
  
  // Conflict warning
  warning: '⚠️ Advertencia',
  conflictMessage: 'Este proyecto puede estar siendo editado en otra pestaña. ¿Desea continuar?',
  continueButton: 'Continuar',
  
  // New chapter
  newChapter: 'Nuevo capítulo',
  writeContentHere: 'Escriba su contenido aquí.',
  
  // Templates
  addTemplate: 'Agregar plantilla',
  templateColophon: 'Colofón',
  templatePreface: 'Prefacio',
  templateChapterTitle: 'Portada de capítulo',
  templateBibliography: 'Bibliografía',
  colophonTitle: 'Colofón',
  colophonBookTitle: 'Título',
  colophonAuthor: 'Autor',
  colophonPublisher: 'Editorial',
  colophonPublishDate: 'Fecha de publicación',
  colophonCopyright: 'Derechos de autor',
  colophonEbookCode: 'Código de libro electrónico',
  colophonOriginalEdition: 'Edición original',
  colophonRestrictions: 'Se prohíbe la reproducción, redistribución o modificación no autorizada de este libro.',
};

/**
 * Korean translations
 */
export const ko: TranslationStrings = {
  // App
  appTitle: 'MDebook',
  version: '버전',
  
  // Buttons
  vim: 'VIM',
  toc: '목차',
  hidePreview: '미리보기 숨기기',
  showPreview: '미리보기 표시',
  insertImage: '이미지 삽입',
  importFile: '파일에서 가져오기',
  importUrl: 'URL에서 가져오기',
  export: '내보내기',
  exportMarkdown: 'Markdown (ZIP)',
  currentFile: '현재 파일',
  settings: '설정',
  lightMode: '라이트 모드',
  darkMode: '다크 모드',
  open: '열기',
  save: '저장',
  newFile: '새 파일',
  untitled: '제목 없음',
  
  // Settings
  title: '제목',
  author: '저자',
  language: '언어',
  uiLanguage: 'UI 언어',
  coverImage: '표지 이미지',
  noCover: '표지 없음',
  theme: '테마',
  themeClassic: '클래식',
  themeModern: '모던',
  themeTechnical: '테크니컬',
  themeNovel: '소설',
  themeAcademic: '학술',
  themeCustom: '사용자 정의',
  importCss: 'CSS 가져오기',
  exportCss: 'CSS 내보내기',
  customCssLoaded: '사용자 정의 CSS 로드됨',
  tocDepth: '목차 깊이',
  tocDepthNone: '없음',
  
  // Import Modal
  importFromUrl: 'URL에서 가져오기',
  enterMarkdownUrl: 'Markdown 파일 URL을 입력하세요',
  supportedUrls: '지원되는 URL:',
  qiitaArticle: 'Qiita 글 (.md 자동 추가)',
  githubAuto: 'GitHub (raw로 자동 변환)',
  directMd: '직접 .md 파일 URL',
  cancel: '취소',
  import: '가져오기',
  importing: '가져오는 중...',
  
  // Status messages
  generating: '생성 중',
  generationComplete: '생성 완료',
  error: '오류',
  projectSaved: '프로젝트가 저장되었습니다',
  projectLoaded: '프로젝트가 로드되었습니다',
  filesImported: '개 파일을 가져왔습니다',
  importComplete: '가져오기 완료',
  importError: '가져오기 오류',
  loadError: '로드 오류',
  invalidProject: '잘못된 프로젝트 파일',
  fileOpened: '파일이 열렸습니다',
  fileSaved: '파일이 저장되었습니다',
  imageAdded: '이미지가 추가되었습니다',
  
  // PDF Font Settings
  pdfFontSettings: 'PDF 글꼴 설정',
  pdfFontDescription: 'PDF 내보내기용 글꼴(TTF/OTF)을 업로드하세요. 글꼴은 로컬에 저장됩니다.',
  pdfFontRegular: '보통',
  pdfFontBold: '굵게',
  pdfFontNotSet: '설정되지 않음',
  pdfFontUpload: '업로드',
  pdfFontDelete: '삭제',
  pdfFontDownloadHint: 'Google Fonts에서 Noto Sans 다운로드',
  pdfFontSaved: '글꼴이 저장되었습니다',
  pdfFontDeleted: '글꼴이 삭제되었습니다',
  
  // Footer
  files: '파일',
  characters: '글자',
  
  // Sample content
  sampleChapter: '제1장',
  sampleTitle: '소개',
  sampleIntro: '이것은 **Markdown 전자책 편집기**의 샘플입니다.',
  sampleFeatures: '기본 기능',
  sampleFeature1: 'VIM 키 바인딩 편집',
  sampleFeature2: 'EPUB/PDF 출력',
  sampleFeature3: '여러 파일 병합',
  sampleFeature4: '이미지 삽입',
  sampleFeature5: 'Mermaid 다이어그램 삽입',
  sampleFeature6: '각주 생성',
  sampleFeature7: '목차 자동 생성',
  sampleFeature8: '표 표시',
  sampleTableTitle: '표 예시',
  sampleTableH1: '기능',
  sampleTableH2: '설명',
  sampleTableH3: '상태',
  sampleTableR1C1: 'VIM 모드',
  sampleTableR1C2: '`hjkl`로 이동, `i`로 입력',
  sampleTableR2C1: 'EPUB 출력',
  sampleTableR2C2: '전자책 형식으로 출력',
  sampleTableR3C1: 'PDF 출력',
  sampleTableR3C2: '인쇄 가능한 PDF 생성',
  sampleTableR4C1: 'Mermaid',
  sampleTableR4C2: '**다이어그램** 그리기',
  sampleMermaidTitle: 'Mermaid 다이어그램 예시',
  sampleMermaid1: 'Markdown',
  sampleMermaid2: '파싱',
  sampleMermaid3: 'HTML 변환',
  sampleMermaid4: 'EPUB 생성',
  sampleMermaid5: 'PDF 생성',
  sampleCodeTitle: '코드 예시',
  sampleParagraph: '이것은 일반 문단입니다. **굵게**와 *기울임*을 사용할 수 있습니다.',
  sampleFootnote: '이것은 샘플 각주입니다. 페이지 하단에 표시됩니다.',
  
  // File names
  defaultFileName: '파일',
  
  // Languages
  langJa: '일본어',
  langEn: '영어',
  langZh: '중국어',
  langEs: '스페인어',
  langKo: '한국어',
  
  // Import dialog
  selectFiles: '파일 선택',
  supportedFormats: '.md, .txt, .mdebook 지원 (다중 선택 가능)',
  or: '또는',
  
  // Conflict warning
  warning: '⚠️ 경고',
  conflictMessage: '이 프로젝트가 다른 탭에서 편집 중일 수 있습니다. 계속하시겠습니까?',
  continueButton: '계속',
  
  // New chapter
  newChapter: '새 장',
  writeContentHere: '여기에 내용을 입력하세요.',
  
  // Templates
  addTemplate: '템플릿 추가',
  templateColophon: '판권',
  templatePreface: '서문',
  templateChapterTitle: '장 표지',
  templateBibliography: '참고문헌',
  colophonTitle: '판권',
  colophonBookTitle: '서명',
  colophonAuthor: '저자',
  colophonPublisher: '발행',
  colophonPublishDate: '발행일',
  colophonCopyright: '저작권',
  colophonEbookCode: '전자출판코드',
  colophonOriginalEdition: '원본',
  colophonRestrictions: '이 책의 무단 복제, 전재, 변조를 금합니다.',
};

/**
 * All translations
 */
export const translations: Record<UILanguage, TranslationStrings> = {
  en,
  ja,
  zh,
  es,
  ko,
};

/**
 * Supported language codes
 */
export const SUPPORTED_LANGUAGES: UILanguage[] = ['en', 'ja', 'zh', 'es', 'ko'];

/**
 * Language display names (in their own language)
 */
export const LANGUAGE_NAMES: Record<UILanguage, string> = {
  en: 'English',
  ja: '日本語',
  zh: '简体中文',
  es: 'Español',
  ko: '한국어',
};

/**
 * LocalStorage key for language preference
 */
const LANGUAGE_STORAGE_KEY = 'mdebook-language';

/**
 * Detect browser language and map to supported language
 */
export function detectBrowserLanguage(): UILanguage {
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  const langCode = browserLang.split('-')[0].toLowerCase();
  
  // Map browser language to supported language
  if (langCode === 'ja') return 'ja';
  if (langCode === 'zh') return 'zh';
  if (langCode === 'es') return 'es';
  if (langCode === 'ko') return 'ko';
  
  return 'en'; // Default to English
}

/**
 * Get saved language preference or detect from browser
 */
export function getSavedLanguage(): UILanguage {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved as UILanguage)) {
      return saved as UILanguage;
    }
  } catch (e) {
    // localStorage not available
  }
  return detectBrowserLanguage();
}

/**
 * Save language preference
 */
export function saveLanguage(lang: UILanguage): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (e) {
    // localStorage not available
  }
}

/**
 * Get translation strings for a language
 */
export function getTranslations(lang: UILanguage): TranslationStrings {
  return translations[lang] || translations.en;
}

/**
 * Get sample markdown content
 */
export function getSampleMarkdown(t: TranslationStrings): string {
  return `# ${t.sampleChapter} ${t.sampleTitle}

${t.sampleIntro}

## ${t.sampleFeatures}

- ${t.sampleFeature1}
- ${t.sampleFeature2}
- ${t.sampleFeature3}
- ${t.sampleFeature4}
- ${t.sampleFeature5}
- ${t.sampleFeature6}[^1]
- ${t.sampleFeature7}
- ${t.sampleFeature8}

## ${t.sampleTableTitle}

| ${t.sampleTableH1} | ${t.sampleTableH2} | ${t.sampleTableH3} |
|--------|-------------|--------|
| ${t.sampleTableR1C1} | ${t.sampleTableR1C2} | ✅ |
| ${t.sampleTableR2C1} | ${t.sampleTableR2C2} | ✅ |
| ${t.sampleTableR3C1} | ${t.sampleTableR3C2} | ✅ |
| ${t.sampleTableR4C1} | ${t.sampleTableR4C2} | ✅ |

## ${t.sampleMermaidTitle}

\`\`\`mermaid
graph LR
    A[Markdown] --> B[Parser]
    B --> C[HTML]
    C --> D[EPUB]
    C --> E[PDF]
\`\`\`

## ${t.sampleCodeTitle}

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

${t.sampleParagraph}

[^1]: ${t.sampleFootnote}
`;
}

/**
 * Get colophon template markdown
 */
export function getColophonTemplate(t: TranslationStrings, metadata?: { title?: string; author?: string }): string {
  const today = new Date();
  const year = today.getFullYear();
  const dateStr = `${year}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const title = metadata?.title || '{{title}}';
  const author = metadata?.author || '{{author}}';
  
  return `# ${t.colophonTitle}

---

## ${title}

| | |
|---|---|
| ${t.colophonBookTitle} | ${title} |
| ${t.colophonAuthor} | ${author} |
| ${t.colophonPublisher} | |
| ${t.colophonPublishDate} | ${dateStr} |

---

© ${year} ${author}

${t.colophonRestrictions}

<!-- ${t.colophonEbookCode}: -->
<!-- ${t.colophonOriginalEdition}: -->
`;
}

/**
 * Get preface template markdown
 */
export function getPrefaceTemplate(t: TranslationStrings): string {
  return `# ${t.templatePreface}

${t.writeContentHere}
`;
}

/**
 * Get chapter title page template markdown
 */
export function getChapterTitleTemplate(lang: UILanguage, chapterNumber?: number): string {
  const num = chapterNumber || 1;
  
  const templates: Record<UILanguage, string> = {
    ja: `<div class="chapter-title-page">

# 第${num}章

## 章タイトルをここに入力

> "引用文（任意）"
> — 著者名

</div>

---

<!-- 本文をここから書き始めてください -->
`,
    en: `<div class="chapter-title-page">

# Chapter ${num}

## Enter Chapter Title Here

> "Optional quotation"
> — Author Name

</div>

---

<!-- Start writing your content here -->
`,
    zh: `<div class="chapter-title-page">

# 第${num}章

## 在此输入章节标题

> "引用（可选）"
> — 作者名

</div>

---

<!-- 从这里开始写正文 -->
`,
    es: `<div class="chapter-title-page">

# Capítulo ${num}

## Ingrese el título del capítulo aquí

> "Cita opcional"
> — Nombre del autor

</div>

---

<!-- Comience a escribir su contenido aquí -->
`,
    ko: `<div class="chapter-title-page">

# 제${num}장

## 여기에 장 제목을 입력하세요

> "인용문 (선택 사항)"
> — 저자명

</div>

---

<!-- 여기서부터 본문을 작성하세요 -->
`,
  };
  
  return templates[lang] || templates.en;
}

/**
 * Get bibliography template markdown
 */
export function getBibliographyTemplate(lang: UILanguage): string {
  const templates: Record<UILanguage, string> = {
    ja: `# 参考文献

## 書籍

[1] 著者名 (出版年). *書籍タイトル*. 出版社.

[2] 著者名 (出版年). *書籍タイトル* (第2版). 出版社.

## 論文・記事

[3] 著者名 (発表年). 論文タイトル. *ジャーナル名*, 巻(号), ページ範囲.

[4] 著者名 (発表年). 記事タイトル. *雑誌名*, ページ範囲.

## Webサイト

[5] 著者名またはサイト名 (閲覧年). ページタイトル. URL (閲覧日: YYYY年MM月DD日)

<!-- 
参考文献の書式例:

書籍:
[N] 山田太郎 (2024). *プログラミングの基礎*. 技術出版社.

論文:
[N] 田中花子, 鈴木一郎 (2023). 機械学習の応用. *情報処理学会誌*, 64(3), 123-145.

Webサイト:
[N] MDN Web Docs (2024). JavaScript ガイド. https://developer.mozilla.org/ja/ (閲覧日: 2024年1月1日)
-->
`,
    en: `# Bibliography

## Books

[1] Author Name (Year). *Book Title*. Publisher.

[2] Author Name (Year). *Book Title* (2nd ed.). Publisher.

## Journal Articles

[3] Author Name (Year). Article Title. *Journal Name*, Volume(Issue), Page Range.

[4] Author Name (Year). Article Title. *Magazine Name*, Page Range.

## Websites

[5] Author or Site Name (Year). Page Title. URL (Accessed: Month DD, YYYY)

<!-- 
Bibliography format examples:

Book:
[N] Smith, J. (2024). *Introduction to Programming*. Tech Publisher.

Journal Article:
[N] Johnson, A., & Williams, B. (2023). Machine Learning Applications. *Journal of Computer Science*, 64(3), 123-145.

Website:
[N] MDN Web Docs (2024). JavaScript Guide. https://developer.mozilla.org/en-US/ (Accessed: January 1, 2024)
-->
`,
    zh: `# 参考文献

## 书籍

[1] 作者名 (出版年). *书名*. 出版社.

[2] 作者名 (出版年). *书名* (第2版). 出版社.

## 论文

[3] 作者名 (发表年). 论文标题. *期刊名*, 卷(期), 页码范围.

[4] 作者名 (发表年). 文章标题. *杂志名*, 页码范围.

## 网站

[5] 作者或网站名 (访问年). 页面标题. URL (访问日期: YYYY年MM月DD日)

<!-- 
参考文献格式示例:

书籍:
[N] 张三 (2024). *编程基础*. 技术出版社.

论文:
[N] 李四, 王五 (2023). 机器学习应用. *计算机科学杂志*, 64(3), 123-145.

网站:
[N] MDN Web Docs (2024). JavaScript 指南. https://developer.mozilla.org/zh-CN/ (访问日期: 2024年1月1日)
-->
`,
    es: `# Bibliografía

## Libros

[1] Nombre del Autor (Año). *Título del Libro*. Editorial.

[2] Nombre del Autor (Año). *Título del Libro* (2ª ed.). Editorial.

## Artículos de Revistas

[3] Nombre del Autor (Año). Título del Artículo. *Nombre de la Revista*, Volumen(Número), Rango de Páginas.

[4] Nombre del Autor (Año). Título del Artículo. *Nombre de la Revista*, Rango de Páginas.

## Sitios Web

[5] Autor o Nombre del Sitio (Año). Título de la Página. URL (Consultado: DD de Mes de YYYY)

<!-- 
Ejemplos de formato de bibliografía:

Libro:
[N] García, J. (2024). *Introducción a la Programación*. Editorial Técnica.

Artículo:
[N] López, A., & Martínez, B. (2023). Aplicaciones de Aprendizaje Automático. *Revista de Informática*, 64(3), 123-145.

Sitio web:
[N] MDN Web Docs (2024). Guía de JavaScript. https://developer.mozilla.org/es/ (Consultado: 1 de enero de 2024)
-->
`,
    ko: `# 참고문헌

## 도서

[1] 저자명 (출판년도). *책 제목*. 출판사.

[2] 저자명 (출판년도). *책 제목* (제2판). 출판사.

## 논문

[3] 저자명 (발표년도). 논문 제목. *학술지명*, 권(호), 페이지 범위.

[4] 저자명 (발표년도). 기사 제목. *잡지명*, 페이지 범위.

## 웹사이트

[5] 저자 또는 사이트명 (접속년도). 페이지 제목. URL (접속일: YYYY년 MM월 DD일)

<!-- 
참고문헌 형식 예시:

도서:
[N] 김철수 (2024). *프로그래밍 기초*. 기술출판사.

논문:
[N] 이영희, 박민수 (2023). 머신러닝 응용. *컴퓨터과학저널*, 64(3), 123-145.

웹사이트:
[N] MDN Web Docs (2024). JavaScript 가이드. https://developer.mozilla.org/ko/ (접속일: 2024년 1월 1일)
-->
`,
  };
  
  return templates[lang] || templates.en;
}
