# RhythmicTunes

RhythmicTunes is a full-stack MERN music application for discovering songs, following artists, creating playlists, tracking listening history, and generating recommendations from listening behavior.

## Tech Stack

- MongoDB
- Express.js
- React with Vite
- Node.js
- Mongoose
- TailwindCSS
- Zustand
- Axios
- React Router
- JSON Web Tokens
- bcryptjs
- Multer
- date-fns

## Folder Structure

```text
RhythmicTunes Your Melodic Companion/
  client/
    src/
      api/
      components/
      hooks/
      pages/
      store/
      utils/
  server/
    controllers/
    middleware/
    models/
    routes/
    utils/
    server.js
  package.json
  README.md
```

## Setup Instructions

1. Install root dependencies:

```bash
npm install
```

2. Install server dependencies:

```bash
cd server
npm install
```

3. Install client dependencies:

```bash
cd client
npm install
```

4. Configure server environment variables in `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/rhythmictunes
JWT_SECRET=replace_with_a_strong_secret
```

5. Configure client environment variables in `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

6. Start MongoDB locally.

7. Run the full application from the root:

```bash
npm run dev
```

You can also run each side separately:

```bash
cd server
npm start
```

```bash
cd client
npm run dev
```

## API Endpoints

### Auth

- `POST /api/auth/register` - Register a user and return a JWT.
- `POST /api/auth/login` - Login a user and return a JWT.

### Songs

- `GET /api/songs?page=1&limit=20` - Get paginated songs.
- `GET /api/songs/:id` - Get one song by ID with artist name.
- `GET /api/songs/search?q=` - Search songs by title or genre.
- `GET /api/songs/trending` - Get top 10 most played songs.
- `POST /api/songs` - Create a song. Requires protected admin access.

### Artists

- `GET /api/artists` - Get all artists.
- `GET /api/artists/:id` - Get one artist with songs.
- `POST /api/artists` - Create an artist. Requires authentication.
- `POST /api/artists/:id/follow` - Follow or unfollow an artist. Requires authentication.

### Playlists

- `GET /api/playlists` - Get playlists for the logged-in user.
- `POST /api/playlists` - Create a playlist.
- `GET /api/playlists/:id` - Get a playlist with populated songs.
- `PUT /api/playlists/:id` - Update playlist name or visibility. Owner only.
- `DELETE /api/playlists/:id` - Delete a playlist. Owner only.
- `POST /api/playlists/:id/songs` - Add a song to a playlist. Owner only.
- `DELETE /api/playlists/:id/songs/:songId` - Remove a song from a playlist. Owner only.

### History

- `POST /api/history` - Log a song play. Requires authentication.
- `GET /api/history` - Get the latest 50 listening history entries. Requires authentication.
- `DELETE /api/history` - Clear listening history. Requires authentication.

### Recommendations

- `GET /api/recommendations/history` - Get recommendations from recent listening history. Requires authentication.
- `GET /api/recommendations/trending` - Get globally trending recommendations.
- `GET /api/recommendations/playlist` - Get recommendations from playlist genres. Requires authentication.

### Health

- `GET /api/health` - Check API health.

## Features

- JWT authentication with protected routes.
- Password hashing with bcryptjs.
- Song catalog with search, pagination, trending songs, and artist population.
- Artist browsing, detail pages, and follow/unfollow support.
- Playlist creation, playlist detail view, song add/remove, and playlist deletion.
- Listening history logging from the music player.
- History page with relative timestamps powered by date-fns.
- Recommendation engine based on listening history, trending plays, and playlist genres.
- React dashboard with dark sidebar layout.
- Sticky bottom HTML5 music player with play/pause, previous, next, seek, and volume controls.
- Axios request interceptor for bearer tokens.
- Zustand stores for auth and player state.

## Environment Notes

The app reads configuration from environment variables:

- Server uses `process.env.PORT`, `process.env.MONGO_URI`, and `process.env.JWT_SECRET`.
- Client uses `import.meta.env.VITE_API_URL`.

Do not commit real secrets. Replace the sample `JWT_SECRET` with a strong private value for local development or deployment.
