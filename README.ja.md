# MDebook

VIMキーバインド、多言語対応、EPUB/PDF/HTML/Markdownエクスポート機能を備えたブラウザベースのMarkdown電子書籍エディタ。

**バージョン: 0.4.0**

**[🇬🇧 English version](README.md)**

## ✨ 機能

### エディタ
- **VIMキーバインド** - `:w`, `:q`, `:e` コマンド対応のフルVIMモード
- **CodeMirror 6** - シンタックスハイライト付きモダンエディタ
- **ライブプレビュー** - 双方向スクロール同期のリアルタイムMarkdownプレビュー
- **マルチファイル対応** - ドラッグ&ドロップで並び替え可能な複数チャプター管理

### インポート & エクスポート
- **エクスポート形式**: EPUB, PDF, HTML, Markdown (ZIP)
- **インポート**: ローカルファイル、URL（Qiita、GitHub自動変換）
- **プロジェクト形式**: `.mdebook`（ZIPベース）で画像付きプロジェクトを保存/読み込み

### EPUBテーマ (v0.4.0)
- **5つのプリセットテーマ**: クラシック、モダン、テクニカル、小説、アカデミック
- **カスタムCSSインポート**: 独自のCSSでEPUBスタイリング
- **CSSエクスポート**: テーマCSSをカスタマイズ用にエクスポート
- **Kindle準拠**: すべてのテーマがAmazon Kindleパブリッシングガイドラインに準拠

### Markdown機能
- テーブル（GFM）
- シンタックスハイライト付きコードブロック
- Mermaidダイアグラム
- 脚注
- 画像埋め込み（ペースト、ドラッグ&ドロップ、ファイル選択）

### ユーザーエクスペリエンス
- **5言語対応**: English, 日本語, 简体中文, Español, 한국어
- **ダーク/ライトテーマ**
- **自動保存** - IndexedDBセッション管理
- **キーボードショートカット**: `Ctrl+\`` でVIM切替

## 🚀 クイックスタート

### オンラインデモ

ブラウザで今すぐMDebookを試す：

**👉 [MDebook を起動](https://fukuyori.github.io/mdebook/dist/mdebook.html)**

インストール不要 - 開いてすぐに書き始められます！

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

## 🎨 EPUBテーマ

### プリセットテーマ

| テーマ | 説明 | 用途 |
|--------|------|------|
| **クラシック** | 伝統的なセリフ体デザイン | 文学、一般書籍 |
| **モダン** | 青いアクセントのサンセリフ体 | ビジネス書 |
| **テクニカル** | ダークレッド見出しのオライリー風 | 技術ドキュメント |
| **小説** | シーン区切り対応の読書最適化 | フィクション |
| **アカデミック** | 両端揃えの学術スタイル | 学術論文 |

### カスタムCSS

1. **↓ CSS** をクリックしてテーマを開始点としてエクスポート
2. CSSファイルを編集してスタイルをカスタマイズ
3. **↑ CSS** をクリックしてカスタムCSSをインポート
4. テーマが自動的に「カスタム」に切り替わる

すべてのテーマはKindle準拠：
- 本文テキスト: 1em（必須デフォルト）
- line-height指定なし（ユーザー設定を尊重）
- 見出し: 1.0em - 1.3em（控えめなサイズ）
- マージン: パーセント指定

## 🎮 VIMコマンド

| コマンド | 説明 |
|----------|------|
| `i`, `a`, `o` | INSERTモードに入る |
| `Esc` | NORMALモードに戻る |
| `v`, `V` | VISUALモード |
| `hjkl` | カーソル移動 |
| `:w` | 保存（ファイルハンドルがあれば上書き） |
| `:w!` | ダイアログで保存 |
| `:w filename` | 名前を付けて保存 |
| `:e filename` | ファイルを開く/作成 |
| `:q` | 現在のファイルを閉じる |
| `:wq` | 保存して閉じる |
| `:imp` | インポートダイアログを開く |
| `:imp URL` | URLからインポート |

## 📁 プロジェクト構造

```
mdebook/
├── src/
│   ├── components/     # Reactコンポーネント
│   ├── utils/          # ユーティリティ関数
│   ├── i18n/           # 翻訳
│   ├── types/          # TypeScript型定義
│   ├── hooks/          # Reactフック
│   ├── themes/         # EPUBテーマ定義
│   └── constants/      # 定数
├── dist/               # ビルド出力
└── docs/               # ドキュメント
```

## 🔧 技術スタック

- **フロントエンド**: React 18, TypeScript
- **エディタ**: CodeMirror 6 + @replit/codemirror-vim
- **スタイリング**: Tailwind CSS
- **ビルド**: Vite
- **エクスポート**: JSZip, FileSaver.js, Mermaid

## 📦 エクスポート形式

### EPUB
ほとんどの電子書籍リーダーと互換性のある標準的な電子書籍形式。表紙画像とカスタムテーマをサポート。

### PDF
ブラウザの印刷ダイアログを開いてPDFを生成。

### HTML
スタイルを埋め込んだスタンドアロンHTMLファイル。

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
|----------|----------|
| Chrome/Edge | ✅ フルサポート（File System Access API） |
| Firefox | ✅ サポート（フォールバックファイル処理） |
| Safari | ✅ サポート（フォールバックファイル処理） |

## 📝 変更履歴

### v0.4.0
- 5つのEPUBプリセットテーマを追加（クラシック、モダン、テクニカル、小説、アカデミック）
- EPUB用カスタムCSSインポート/エクスポート
- Kindleパブリッシングガイドライン準拠
- オライリー風テクニカルテーマ

### v0.3.2
- EPUB表紙画像サポート
- タブ名変更バグ修正
- バージョン統一

### v0.3.1
- CORSプロキシフォールバック
- ドラッグ&ドロップタブ位置指定

### v0.3.0
- .mdebookプロジェクト形式
- 画像管理
- URL/Qiitaインポート

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

コントリビューションを歓迎します！お気軽にプルリクエストを送ってください。

## 🙏 謝辞

- [CodeMirror](https://codemirror.net/)
- [@replit/codemirror-vim](https://github.com/replit/codemirror-vim)
- [Marked](https://marked.js.org/)
- [Mermaid](https://mermaid.js.org/)
- [JSZip](https://stuk.github.io/jszip/)
