# MDebook

ブラウザベースのMarkdown電子書籍エディタ。VIMキーバインド、多言語対応、EPUB/PDF/HTML/Markdownへのエクスポート機能を搭載。

**[🇺🇸 English Version](README.md)**

## ✨ 機能

### エディタ
- **VIMキーバインド** - `:w`、`:q`、`:e`コマンド対応のフルVIMモード
- **CodeMirror 6** - シンタックスハイライト付きモダンエディタ
- **ライブプレビュー** - 双方向スクロール同期付きリアルタイムプレビュー
- **マルチファイル対応** - ドラッグ&ドロップで章の並び替え

### インポート & エクスポート
- **エクスポート形式**: EPUB、PDF、HTML、Markdown (ZIP)
- **インポート**: ローカルファイル、URL（Qiita、GitHub自動変換）
- **プロジェクト形式**: `.mdebook`（ZIPベース）で画像付きプロジェクトの保存・読み込み

### Markdown機能
- テーブル（GFM）
- シンタックスハイライト付きコードブロック
- Mermaidダイアグラム
- 脚注
- 画像埋め込み（ペースト、ドラッグ&ドロップ、ファイル選択）

### ユーザー体験
- **5言語対応**: English、日本語、简体中文、Español、한국어
- **ダーク/ライトテーマ**
- **自動保存** - IndexedDBによるセッション管理
- **キーボードショートカット**: `Ctrl+\`` でVIMトグル

## 🚀 クイックスタート

### オンラインデモ

ブラウザで今すぐMDebookを試す：

**👉 [MDebookを起動](https://fukuyori.github.io/mdebook/dist/mdebook.html)**

インストール不要 - 開いてすぐに執筆開始！

### ソースからビルド

```bash
# リポジトリをクローン
git clone https://github.com/fukuyori/mdebook.git
cd mdebook

# 依存関係をインストール
npm install

# 開発サーバー
npm run dev

# プロダクションビルド
npm run build

# スタンドアロンHTMLを生成
node build-html.cjs
```

## 📖 ドキュメント

- [Tutorial (English)](docs/tutorial.md)
- [チュートリアル (日本語)](docs/tutorial.ja.md)

## 🎮 VIMコマンド

| コマンド | 説明 |
|---------|------|
| `i`, `a`, `o` | INSERTモードに入る |
| `Esc` | NORMALモードに戻る |
| `v`, `V` | VISUALモード |
| `hjkl` | カーソル移動 |
| `:w` | 保存（ファイルハンドルがあれば上書き） |
| `:w!` | ダイアログで保存 |
| `:w ファイル名` | 名前を付けて保存 |
| `:e ファイル名` | ファイルを開く/作成 |
| `:q` | 現在のファイルを閉じる |
| `:wq` | 保存して閉じる |
| `:imp` | インポートダイアログを開く |
| `:imp URL` | URLからインポート |

## 📁 プロジェクト構成

```
mdebook/
├── src/
│   ├── components/     # Reactコンポーネント
│   ├── utils/          # ユーティリティ関数
│   ├── i18n/           # 翻訳ファイル
│   ├── types/          # TypeScript型定義
│   ├── hooks/          # Reactフック
│   └── constants/      # 定数
├── dist/               # ビルド出力
└── docs/               # ドキュメント
```

## 🔧 技術スタック

- **フロントエンド**: React 18、TypeScript
- **エディタ**: CodeMirror 6 + @replit/codemirror-vim
- **スタイリング**: Tailwind CSS
- **ビルド**: Vite
- **エクスポート**: JSZip、FileSaver.js、Mermaid

## 📦 エクスポート形式

### EPUB
ほとんどの電子書籍リーダーと互換性のある標準的な電子書籍形式。

### PDF
ブラウザの印刷ダイアログを開いてPDFを生成。

### HTML
スタイル埋め込みのスタンドアロンHTMLファイル。

### Markdown (ZIP)
```
book-markdown.zip
├── metadata.json
├── chapters/
│   ├── 01-chapter1.md
│   └── 02-chapter2.md
└── images/
    └── image1.png
```

## 🌐 ブラウザ互換性

| ブラウザ | サポート |
|---------|---------|
| Chrome/Edge | ✅ フルサポート（File System Access API） |
| Firefox | ✅ サポート（フォールバックファイル処理） |
| Safari | ✅ サポート（フォールバックファイル処理） |

## 📄 ライセンス

MIT License

## 🤝 コントリビュート

コントリビューションを歓迎します！お気軽にPull Requestを送ってください。

## 🙏 謝辞

- [CodeMirror](https://codemirror.net/)
- [@replit/codemirror-vim](https://github.com/replit/codemirror-vim)
- [Marked](https://marked.js.org/)
- [Mermaid](https://mermaid.js.org/)
- [JSZip](https://stuk.github.io/jszip/)
