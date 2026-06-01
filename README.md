# Click - No-Code App Builder

**Click**は、コードを書かずにウェブアプリを作成・公開できるノーコードアプリビルダーです。ドラッグ＆ドロップの直感的なインターフェースで、誰でも簡単にプロフェッショナルなウェブアプリを構築できます。

> Build web apps visually — no code required.

## Features

- **ドラッグ＆ドロップ エディター** — テキスト、ボタン、画像、入力フォームなどのUIコンポーネントを自由に配置
- **リアルタイム プレビュー** — 編集しながらアプリの見た目をリアルタイムで確認
- **ワンクリック 公開** — 作成したアプリを一瞬でウェブに公開、固有URLを取得
- **マルチページ対応** — 複数ページのアプリを作成可能
- **レスポンシブ デザイン** — モバイルにも対応したレイアウト
- **スタイルカスタマイズ** — 色、サイズ、フォント、余白などを細かく調整
- **Netlify Blobs ストレージ** — アプリデータをサーバーレスで安全に保存

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to launch the builder.

## Project Structure

```
click/
├── app/                    # Next.js App Router pages
│   ├── builder/            # Visual editor
│   ├── preview/            # App preview
│   ├── published/          # Published app viewer
│   └── api/apps/           # Next.js API routes (dev fallback)
├── components/             # React components
├── lib/
│   ├── types.ts            # TypeScript type definitions
│   └── api.ts              # Client-side API helpers
├── netlify/
│   └── functions/          # Netlify serverless functions
│       ├── save-app.ts
│       ├── get-app.ts
│       ├── publish-app.ts
│       └── list-apps.ts
├── public/                 # Static assets
├── netlify.toml            # Netlify configuration
└── .env.local.example      # Environment variable template
```

## Netlify Deployment

### Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [app.netlify.com](https://app.netlify.com) and click **Add new site**
   - Select **Import an existing project** and connect your GitHub repo

3. **Build Settings** (auto-detected from `netlify.toml`)
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Plugin: `@netlify/plugin-nextjs` (added automatically)

4. **Deploy**
   - Click **Deploy site** — Netlify handles the rest

### Environment Variables

Set these in the Netlify dashboard under **Site configuration > Environment variables**:

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your deployed site URL (e.g. `https://my-click.netlify.app`) | Recommended |
| `NEXT_PUBLIC_APP_NAME` | Display name for the app | Optional |

> **Note:** `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN` are automatically injected by Netlify at runtime — you do not need to set them manually in the Netlify dashboard.

### Local Development with Netlify

To run Netlify Functions locally:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Start dev server with functions
netlify dev
```

## Architecture

```
Browser
  │
  ├── Next.js Pages (App Router)
  │     ├── /builder        — Drag-and-drop editor (Zustand state)
  │     ├── /preview        — Live preview iframe
  │     └── /published/[id] — Rendered published app
  │
  ├── lib/api.ts            — Unified client API (tries Netlify, falls back to Next.js)
  │
  ├── Netlify Functions (production)
  │     ├── /.netlify/functions/save-app
  │     ├── /.netlify/functions/get-app
  │     ├── /.netlify/functions/publish-app
  │     └── /.netlify/functions/list-apps
  │
  └── Next.js API Routes (development fallback)
        ├── /api/apps/save
        ├── /api/apps/publish
        └── /api/apps/[id]
```

### Storage

- **Netlify Blobs** — Primary storage on Netlify (zero config, serverless)
  - `apps` store — Draft app saves (`save-app` / `get-app`)
  - `published-apps` store — Published snapshots (`publish-app` / `list-apps`)
- **In-memory Map** — Development fallback when running locally without `netlify dev`

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Drag & Drop:** @dnd-kit
- **State Management:** Zustand
- **Deployment:** Netlify
- **Storage:** Netlify Blobs
- **Language:** TypeScript

## License

MIT
# click
