# RhythmicTunes

RhythmicTunes is a full-stack MERN music app. Listeners can browse and search a
song catalog, follow artists, like songs, build playlists, and play everything
through a persistent bottom player. Every play is logged, and that listening
history powers recommendations and a personal activity dashboard. Admins
manage the catalog (with audio/cover uploads) and user accounts from an
in-app admin page.

## Tech stack

| Layer    | Tools |
| -------- | ----- |
| Client   | React 19, Vite, React Router, Zustand, Axios, Tailwind CSS 4, Framer Motion, Recharts, date-fns |
| Server   | Node.js, Express 5, Mongoose 9, JSON Web Tokens, bcryptjs, Multer |
| Database | MongoDB |
| External | iTunes Search API for catalog search outside the local library (no API key needed) |

## Features

- **Accounts**: register/login with JWT auth (7-day tokens), bcrypt-hashed
  passwords, profile and password updates.
- **Catalog**: paginated song list, search by title or genre, song detail
  pages, trending songs by play count.
- **Artists**: artist list and detail pages with their songs, plus follow/unfollow.
- **Library**: liked songs and playlists (create, rename, public/private,
  add/remove songs, delete). Private playlists are visible only to their owner.
- **Player**: sticky HTML5 player with play/pause, previous/next, seek and
  volume; plays are logged to listening history.
- **Recommendations**: based on genres from recent history, genres in your
  playlists, and songs trending over the last 7 days.
- **Analytics**: total plays, listening time, most-played artist/genre, top
  genres, and global trends.
- **Admin**: add/delete songs with audio and cover uploads, create users,
  grant/revoke admin, delete users.

## Project structure

```text
RhythmicTunes/
├── package.json            # root scripts that drive client + server
├── docs/SETUP.md           # local MongoDB + first-run guide
├── client/                 # React + Vite single-page app
│   ├── .env.example
│   ├── public/
│   └── src/
│       ├── api/            # Axios instance (adds the bearer token)
│       ├── assets/
│       ├── components/     # layout, sidebar, navbar, player, cards
│       ├── context/        # theme provider
│       ├── hooks/          # useDominantColor (cover-art colors)
│       ├── pages/          # one component per route
│       ├── store/          # Zustand stores: auth, player, audio-reactive
│       ├── utils/
│       ├── App.jsx         # routes + protected/admin route guards
│       └── main.jsx
└── server/                 # Express REST API
    ├── .env.example
    ├── config/             # required env var checks
    ├── controllers/        # request handlers per resource
    ├── middleware/         # auth (protect/optionalAuth/adminOnly), uploads, errors
    ├── models/             # Mongoose schemas: User, Artist, Song, Playlist, ListeningHistory
    ├── routes/             # Express routers mounted under /api
    ├── services/           # analytics aggregations, iTunes search
    ├── utils/              # recommendation engine, validation, username helpers
    ├── test/               # node:test unit tests
    ├── uploads/            # uploaded audio and cover images (served statically)
    ├── seed.js             # demo artists, songs and listening history
    └── server.js           # app entry point
```

## Getting started

Prerequisites: **Node.js 20.19+** (required by Vite 8) and **MongoDB** running
locally or a MongoDB Atlas connection string. See [docs/SETUP.md](docs/SETUP.md)
for installing and running MongoDB.

```bash
# 1. Install root, server and client dependencies
npm run install:all

# 2. Create env files from the templates and edit the values
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. (Optional) load demo artists and songs
npm run seed

# 4. Start the API (with nodemon) and the Vite dev server together
npm run dev
```

The client runs at <http://localhost:5173> and the API at
<http://localhost:5000> (check with `GET /api/health`).

### Environment variables

| File          | Variable       | Required | Description |
| ------------- | -------------- | -------- | ----------- |
| `server/.env` | `MONGO_URI`    | yes      | MongoDB connection string |
| `server/.env` | `JWT_SECRET`   | yes      | Secret used to sign JWTs; use a long random value |
| `server/.env` | `PORT`         | no       | API port (default `5000`) |
| `client/.env` | `VITE_API_URL` | yes      | Base URL of the API, e.g. `http://localhost:5000` |

The server refuses to start and names the missing variable if `MONGO_URI` or
`JWT_SECRET` is not set. Never commit real `.env` files; they are git-ignored.

### Scripts

Run from the repository root:

| Command               | What it does |
| --------------------- | ------------ |
| `npm run install:all` | Install root, server and client dependencies |
| `npm run dev`         | Run API (nodemon) and client (Vite) together |
| `npm run dev:server`  | Run only the API with auto-reload |
| `npm run dev:client`  | Run only the Vite dev server |
| `npm start`           | Run the API with plain `node` |
| `npm run seed`        | Replace artists, songs and history with demo data |
| `npm run build`       | Production build of the client into `client/dist` |
| `npm run lint`        | Lint the client with ESLint |
| `npm test`            | Run server unit tests (`node --test`) |

> `npm run seed` deletes all existing artists, songs and listening history
> before inserting demo data. User accounts are kept.

## API reference

All endpoints are under `/api`. "Auth" means the request needs an
`Authorization: Bearer <token>` header; "Admin" also requires `isAdmin`.
Errors are returned as JSON: `{ "message": "..." }`.

### Auth — `/api/auth`

| Method | Path        | Access | Description |
| ------ | ----------- | ------ | ----------- |
| POST   | `/register` | Public | Create an account (`name`, `email`, `password` ≥ 6 chars, optional `username`); returns `{ token, user }` |
| POST   | `/login`    | Public | Log in with `email` + `password`; returns `{ token, user }` |
| GET    | `/me`       | Auth   | Current user |

### Songs — `/api/songs`

| Method | Path               | Access | Description |
| ------ | ------------------ | ------ | ----------- |
| GET    | `/?page=&limit=`   | Public | Paginated songs (limit ≤ 100) |
| GET    | `/search?q=`       | Public | Search by title or genre |
| GET    | `/external-search?q=` | Auth | Search the iTunes catalog |
| GET    | `/trending`        | Public | Top 10 songs by all-time plays |
| GET    | `/liked`           | Auth   | Your liked songs |
| POST   | `/:id/like`        | Auth   | Like a song |
| DELETE | `/:id/like`        | Auth   | Unlike a song |
| GET    | `/:id`             | Public | One song with artist name |
| POST   | `/`                | Admin  | Create a song (`title`, `artistId`, `duration`, `fileUrl`, ...) |
| DELETE | `/:id`             | Admin  | Delete a song and remove it from playlists, likes and history |
| POST   | `/upload/audio`    | Admin  | Multipart field `audio` (≤ 50 MB); returns `fileUrl` |
| POST   | `/upload/cover`    | Admin  | Multipart field `cover` (≤ 10 MB); returns `coverUrl` |

### Artists — `/api/artists`

| Method | Path          | Access | Description |
| ------ | ------------- | ------ | ----------- |
| GET    | `/`           | Public | All artists |
| GET    | `/:id`        | Public | Artist with songs; includes `isFollowing` when a token is sent |
| POST   | `/`           | Auth   | Create an artist |
| POST   | `/:id/follow` | Auth   | Toggle follow/unfollow |

### Playlists — `/api/playlists`

| Method | Path                 | Access | Description |
| ------ | -------------------- | ------ | ----------- |
| GET    | `/`                  | Auth   | Your playlists |
| POST   | `/`                  | Auth   | Create (`playlistName`, `isPublic`) |
| GET    | `/:id`               | Public / owner | Public playlists, or your own private ones |
| PUT    | `/:id`               | Owner  | Rename or change visibility |
| DELETE | `/:id`               | Owner  | Delete |
| POST   | `/:id/songs`         | Owner  | Add a song (`songId`) |
| DELETE | `/:id/songs/:songId` | Owner  | Remove a song |

### History, recommendations and analytics

| Method | Path                            | Access | Description |
| ------ | ------------------------------- | ------ | ----------- |
| POST   | `/api/history`                  | Auth   | Log a play (`songId`) |
| GET    | `/api/history`                  | Auth   | Latest 50 plays |
| DELETE | `/api/history`                  | Auth   | Clear your history |
| GET    | `/api/recommendations/history`  | Auth   | Songs in genres you've played recently |
| GET    | `/api/recommendations/playlist` | Auth   | Songs in genres from your playlists |
| GET    | `/api/recommendations/trending` | Public | Most played in the last 7 days |
| GET    | `/api/analytics/me`             | Auth   | Plays, listening time, top artist and genre |
| GET    | `/api/analytics/genres`         | Auth   | Your top 5 genres |
| GET    | `/api/analytics/trends`         | Public | Global top songs, genres and artists |

### Users — `/api/users`

| Method | Path               | Access | Description |
| ------ | ------------------ | ------ | ----------- |
| GET    | `/`                | Admin  | List users |
| POST   | `/`                | Admin  | Create a user |
| PUT    | `/update-profile`  | Auth   | Update your `username` / `email` |
| PUT    | `/change-password` | Auth   | Change password (`oldPassword`, `newPassword`) |
| PUT    | `/:id/admin`       | Admin  | Toggle another user's admin flag |
| DELETE | `/:id`             | Admin  | Delete another user |

### Health

`GET /api/health` returns `{ "status": "ok" }`.

## How recommendations work

`server/utils/recommendationEngine.js` keeps things simple and explainable:

- **History-based**: collect the genres of your 30 most recent plays and
  suggest the 10 most recently added songs in those genres that you haven't
  played.
- **Playlist-based**: same idea, using the genres of songs already in your
  playlists and excluding those songs.
- **Trending**: aggregate plays from the last 7 days and return the top 10.

## License

[MIT](LICENSE)
