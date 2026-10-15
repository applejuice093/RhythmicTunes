# RhythmicTunes client

React 19 + Vite single-page app for RhythmicTunes. It talks to the Express API
in `../server` through the Axios instance in `src/api/axiosInstance.js`, which
attaches the stored JWT as a bearer token.

## Setup

```bash
cp .env.example .env   # set VITE_API_URL, e.g. http://localhost:5000
npm install
npm run dev            # http://localhost:5173
```

The API must be running for anything beyond the landing page. From the repo
root, `npm run dev` starts both together. See the root
[README](../README.md) and [docs/SETUP.md](../docs/SETUP.md).

## Scripts

| Command           | What it does |
| ----------------- | ------------ |
| `npm run dev`     | Vite dev server with hot reload |
| `npm run build`   | Production build into `dist/` (git-ignored) |
| `npm run preview` | Serve the production build locally |
| `npm run lint`    | ESLint |

## Where things live

- `src/App.jsx`: routes, plus `ProtectedRoute` / `AdminRoute` guards.
- `src/pages/`: one component per route (dashboard, explore, search,
  playlists, artists, history, activity, profile, admin, ...).
- `src/components/`: app layout, sidebar, navbar, song cards, favorite button
  and the persistent `MusicPlayer`.
- `src/store/`: Zustand stores for auth (`authStore`), playback queue and
  state (`playerStore`) and audio-reactive visuals (`audioReactiveStore`).
- `src/context/ThemeContext.jsx`: theme colors derived from the current
  song's cover art.
- `src/hooks/useDominantColor.js`: extracts accent colors from cover art.
