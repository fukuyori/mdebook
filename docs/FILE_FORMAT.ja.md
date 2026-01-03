# MDebook ファイル形式仕様

**バージョン: 1.0**  
**最終更新: 2025-01-03**

## 概要

MDebookは2つのファイル形式でプロジェクトを保存します：

| 形式 | 拡張子 | 用途 |
|------|--------|------|
| **MDebookプロジェクト** | `.mdebook` | 複数ファイル、または画像を含むプロジェクト |
| **単一Markdown** | `.md` | 画像のない単一ファイル |

`.mdebook`形式はMarkdownファイル、画像、マニフェストファイルを含むZIPアーカイブです。

---

## .mdebook形式

### 構造

```
project.mdebook (ZIPアーカイブ)
├── manifest.json          # プロジェクトメタデータとファイルリスト
├── chapters/              # Markdownファイルディレクトリ
│   ├── Chapter1.md
│   ├── Chapter2.md
│   └── ...
└── images/                # 画像ディレクトリ
    ├── image1.png
    ├── photo.jpg
    └── ...
```

### manifest.json

マニフェストファイルにはプロジェクトメタデータと含まれるすべてのファイルのリストが含まれます。

```json
{
  "version": "0.8.1",
  "metadata": {
    "title": "本のタイトル",
    "author": "著者名",
    "language": "ja",
    "coverImageId": "cover.jpg",
    "themeId": "technical",
    "customCss": "/* オプションのカスタムCSS */",
    "tocDepth": 2
  },
  "uiLang": "ja",
  "chapters": [
    "Chapter1.md",
    "Chapter2.md",
    "Appendix.md"
  ],
  "images": [
    "cover.jpg",
    "diagram1.png",
    "photo.jpg"
  ]
}
```

### マニフェストフィールド

#### ルートフィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `version` | string | はい | ファイルを作成したMDebookバージョン |
| `metadata` | object | はい | 書籍メタデータ |
| `uiLang` | string | はい | 保存時のUI言語 (`en`, `ja`, `zh`, `es`, `ko`) |
| `chapters` | string[] | はい | 章ファイル名の順序付きリスト |
| `images` | string[] | はい | 画像ファイル名のリスト |

#### メタデータフィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `title` | string | はい | 本のタイトル |
| `author` | string | はい | 著者名 |
| `language` | string | はい | 本の言語コード (`en`, `ja`, `zh`, `es`, `ko`) |
| `coverImageId` | string | いいえ | 表紙画像ファイル名 (images/内) |
| `themeId` | string | いいえ | EPUBテーマID (`classic`, `modern`, `technical`, `novel`, `academic`, `custom`) |
| `customCss` | string | いいえ | EPUBエクスポート用カスタムCSS |
| `tocDepth` | number | いいえ | 目次の深さ (0-3)、デフォルト: 2 |

### chapters/ ディレクトリ

UTF-8エンコーディングのMarkdownファイルを格納します。

**ファイル命名規則:**
- ファイルは`.md`拡張子で保存
- 順序はmanifest.jsonの`chapters`配列で決定
- ファイル名はすべてのOSで有効であること

**表示動作:**
- MDebookのUIでは`.md`拡張子なしでファイル名を表示
- 読み込み時、表示名から`.md`拡張子を除去
- 保存時、`.md`拡張子がなければ追加

### images/ ディレクトリ

Markdownコンテンツで参照される画像ファイルを格納します。

**サポート形式:**
| 形式 | MIMEタイプ | 拡張子 |
|------|-----------|--------|
| PNG | image/png | .png |
| JPEG | image/jpeg | .jpg, .jpeg |
| GIF | image/gif | .gif |
| WebP | image/webp | .webp |
| SVG | image/svg+xml | .svg |
| BMP | image/bmp | .bmp |

**Markdown内での画像参照:**
```markdown
![代替テキスト](images/filename.png)
```

**画像クリーンアップ:**
- 手動保存時、参照されていない画像は削除
- 表紙画像はコンテンツで参照されていなくても常に保持

---

## 単一Markdown形式 (.md)

画像のないシンプルなプロジェクトでは、MDebookは単一の`.md`ファイルとして保存できます。

**特徴:**
- 標準UTF-8エンコードMarkdown
- メタデータなし（タイトルはファイル名から派生）
- 画像サポートなし
- 任意のMarkdownエディタと互換

**使用条件:**
- 単一ファイルプロジェクト
- プロジェクトに画像がない
- ユーザーが明示的に`.md`で保存

---

## ファイル操作

### 保存形式の決定

MDebookはプロジェクト内容に基づいて自動的に形式を選択します：

```
if (files.length > 1 || images.length > 0) {
    // .mdebookとして保存
} else {
    // .mdとして保存
}
```

### ファイル読み込み

MDebookは両方の形式を受け付けます：

1. **`.mdebook`ファイル**: この仕様に従って展開・解析
2. **`.md`ファイル**: デフォルトメタデータで単一ファイルプロジェクトとして読み込み

### 画像ID処理

画像は実行時に一意のIDで識別されますが、ファイル名で保存されます：

- **保存時**: `coverImageId`には画像ファイル名を保存（実行時IDではない）
- **読み込み時**: 新しいIDを生成、`coverImageId`はファイル名から解決

これにより異なるセッションやコンピュータ間での移植性が確保されます。

---

## 圧縮

`.mdebook` ZIPアーカイブはファイルサイズ削減のためDEFLATE圧縮を使用します。

---

## MIMEタイプ

| 形式 | MIMEタイプ |
|------|-----------|
| .mdebook | application/x-mdebook |
| .md | text/markdown |

---

## バージョン履歴

| バージョン | 変更内容 |
|-----------|---------|
| 0.4.4以降 | 保存される章ファイルに`.md`拡張子を追加 |
| 0.4.1以降 | メタデータに`tocDepth`を追加 |
| 0.4.0以降 | メタデータに`themeId`と`customCss`を追加 |
| 0.3.x | 画像サポート追加、`coverImageId` |
| 0.2.x | 初期ZIPベース形式 |

---

## 例

### 完全なmanifest.json

```json
{
  "version": "0.8.1",
  "metadata": {
    "title": "プログラミング入門",
    "author": "山田太郎",
    "language": "ja",
    "coverImageId": "cover.png",
    "themeId": "technical",
    "tocDepth": 3
  },
  "uiLang": "ja",
  "chapters": [
    "00-はじめに.md",
    "01-導入.md",
    "02-変数.md",
    "03-制御フロー.md",
    "99-奥付.md"
  ],
  "images": [
    "cover.png",
    "fig1-architecture.png",
    "fig2-flowchart.png"
  ]
}
```

### 最小のmanifest.json

```json
{
  "version": "0.8.1",
  "metadata": {
    "title": "メモ",
    "author": "",
    "language": "ja"
  },
  "uiLang": "ja",
  "chapters": [
    "notes.md"
  ],
  "images": []
}
```

---

## 実装メモ

### 開発者向け

1. **ZIPライブラリ**: クロスプラットフォーム互換性のためJSZipなどを使用
2. **エンコーディング**: すべてのテキストファイルはUTF-8
3. **パス区切り**: ZIPパスでは常にスラッシュ(`/`)を使用
4. **後方互換性**: オプションフィールドの欠落を適切に処理
5. **前方互換性**: マニフェスト内の不明なフィールドは無視

### セキュリティ考慮事項

- パストラバーサル攻撃を防ぐためファイル名を検証
- メモリ枯渇を防ぐため最大ファイルサイズを制限
- 信頼できないソースから読み込む際は画像ファイル名をサニタイズ
