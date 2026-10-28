# Foclyra

Distraction-free study app for YouTube playlists. Paste a playlist, watch without ads or recommendations, take timestamped notes, and track your progress.

## Features

- **Cinema watch page**: clean player with theater mode and a collapsible lecture list
- **Timestamped notes**: click a timestamp to jump to that moment, export as Markdown
- **Pomodoro timer**: floating focus timer that stays on across pages
- **Progress tracking**: resume where you left off, mark lectures done
- **Local-first**: data is stored in your browser (IndexedDB), works offline
- **Optional cloud sync**: sign in to sync across devices (Supabase)

## Tech Stack

React 19, Vite, Tailwind CSS, Dexie.js, Zustand, Supabase

## Getting Started

Requires Node.js 18+.

```bash
git clone https://github.com/ssiddiquiii/focusflow.git
cd focusflow
npm install
cp .env.example .env   # optional, add your keys
npm run dev
```

Open http://localhost:5173

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run tests |

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` / `K` | Play / Pause |
| `J` / `L` | Seek -10s / +10s |
| `M` | Mute |
| `F` | Fullscreen |
| `N` / `P` | Next / Previous lecture |
| `S` | Toggle lecture list |
| `Ctrl/Cmd + K` | Command palette |
