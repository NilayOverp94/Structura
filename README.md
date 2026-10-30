# Structura

<p align="center">
  <strong>Understand Any Codebase. Start Contributing With Confidence.</strong>
</p>

<p align="center">
  <a href="https://structura-eosin.vercel.app"><strong>🌐 Live Deployment: https://structura-eosin.vercel.app</strong></a>
</p>

<p align="center">
  AI-powered software architecture explorer, repository intelligence engine, and codebase onboarding assistant.
</p>

---

## 🚀 Overview

**Structura** is an open-source developer productivity platform that allows engineers, contributors, and team members to paste any GitHub repository URL and receive an intelligent, interactive architectural explanation of the entire codebase.

Instead of spending hours manually tracing files, imports, and execution flows, developers can explore interactive component dependency graphs, receive grounded AI explanations for every file, ask questions directly to the codebase with verifiable source citations, and follow tailored contributor onboarding roadmaps.

---

## 🎨 Visual Identity & Brand System

- **Primary**: `#3B82F6` (Electric Blue)
- **Secondary**: `#8B5CF6` (Vibrant Purple / Violet)
- **Background (Dark)**: `#0F172A` (Rich Dark Slate / Navy)
- **Text**: `#64748B` (Muted Slate)
- **Border / Elements**: `#E2E8F0` (Light) & `#334155` (Dark)
- **Dual Theme**: Seamless one-click switching between Dark (`#0F172A`) and Light theme modes.

---

## ✨ Core Features

1. **Interactive Architecture Explorer**: React Flow-powered interactive node graphs with zoom, pan, minimap, component search, and detail inspectors.
2. **File-by-File Intelligence**: Split-pane directory tree viewer with line numbers, code highlighting, and AST symbol extraction.
3. **Ask Your Codebase (RAG)**: Conversational assistant grounded in repository source code with line-range citations.
4. **Dependency & Framework Intelligence**: Manifest parsing (`package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`) categorized by architectural role.
5. **Contributor Learning Roadmap**: Structured 4-phase onboarding path with interactive step completion and progress tracking.
6. **Bug & Feature Locator**: Natural language locator performing hybrid vector search to pinpoint starting files for bugs or features.
7. **Demonstration Mode**: Built-in sample repository (`structura-core`) for instant testing.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript 5 (Strict Mode, ES2022)
- **Styling**: Tailwind CSS with custom design tokens
- **Interactive Graphing**: React Flow (`reactflow`)
- **AI / Embeddings**: Google Gemini API (`gemini-1.5-flash`, `text-embedding-004`)
- **Database & Auth**: Supabase PostgreSQL + `pgvector`
- **Testing**: Vitest (`vitest`)

---

## 📦 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/NilayOverp94/Structura.git
cd Structura
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy the template file:
```bash
cp .env.example .env.local
```
Fill in your credentials in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GITHUB_TOKEN` (Personal Access Token)
- `GEMINI_API_KEY` (Google AI Studio)
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### 4. Run database migrations
Execute `supabase/migrations/20240101000000_initial_schema.sql` in your Supabase SQL Editor.

### 5. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Testing

Run unit tests:
```bash
npm test
```

Run TypeScript verification:
```bash
npx tsc --noEmit
```

Run production build:
```bash
npm run build
```

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
