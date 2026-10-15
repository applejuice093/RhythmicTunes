# Local setup

This guide walks through running RhythmicTunes on your machine from scratch,
including MongoDB. For an overview of the project and the API, see the
[README](../README.md).

## 1. Install Node.js

Use Node.js **20.19 or newer** (Vite 8 requires it). Check with:

```bash
node -v
```

## 2. Run MongoDB

Pick one of the options below. All of them end with a connection string for
`MONGO_URI`.

### Option A: Docker (quickest)

```bash
docker run -d --name rhythmictunes-mongo -p 27017:27017 -v rhythmictunes-data:/data/db mongo:7
```

`MONGO_URI=mongodb://127.0.0.1:27017/rhythmictunes`

Stop/start it later with `docker stop rhythmictunes-mongo` and
`docker start rhythmictunes-mongo`.

### Option B: MongoDB Community Server

- **macOS (Homebrew)**:
  ```bash
  brew tap mongodb/brew
  brew install mongodb-community
  brew services start mongodb-community
  ```
- **Windows**: install MongoDB Community Server from
  <https://www.mongodb.com/try/download/community> and keep the
  "Install as a Service" option checked.
- **Linux**: follow the official guide for your distribution at
  <https://www.mongodb.com/docs/manual/administration/install-on-linux/>, then
  `sudo systemctl start mongod`.

`MONGO_URI=mongodb://127.0.0.1:27017/rhythmictunes`

> Prefer `127.0.0.1` over `localhost`: on recent Node versions `localhost` may
> resolve to IPv6 (`::1`), which a default MongoDB install doesn't listen on.

### Option C: MongoDB Atlas (cloud)

Create a free cluster at <https://www.mongodb.com/atlas>, add a database
user, allow your IP under **Network Access**, then copy the driver connection
string, e.g.:

`MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/rhythmictunes`

## 3. Configure environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env`:

- `MONGO_URI`: from step 2.
- `JWT_SECRET`: a long random string. Generate one with
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- `PORT`: optional, defaults to `5000`.

`client/.env` only needs `VITE_API_URL`, which must point at the API
(`http://localhost:5000` by default). Restart `npm run dev` after editing it,
since Vite reads env files at startup.

## 4. Install and run

```bash
npm run install:all
npm run dev
```

Open <http://localhost:5173> and register an account.

## 5. Load demo data (optional)

```bash
npm run seed
```

This **deletes** existing artists, songs and listening history, then inserts
10 demo artists and 32 songs (streamed from public sample URLs). If at least
one user exists, it also generates a week of listening history for that user
so the dashboard, analytics and recommendations have data. Register first,
then seed, to get the full experience.

## 6. Make yourself an admin

There is no public way to become an admin. Promote your account directly in
MongoDB (with `mongosh` or MongoDB Compass):

```javascript
use rhythmictunes
db.users.updateOne({ email: "you@example.com" }, { $set: { isAdmin: true } })
```

Log out and back in; the **Admin** page then lets you upload songs and
manage other users.

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `Missing required environment variable(s): ...` | Create `server/.env` from the example and fill in the named values. |
| `MongoDB connection error: connect ECONNREFUSED` | MongoDB isn't running, or `MONGO_URI` points at the wrong host/port. |
| Client requests hit `localhost:5173/api/...` and 404 | `VITE_API_URL` is missing from `client/.env`; add it and restart Vite. |
| `401 Not authorized, token expired.` | Tokens last 7 days; log in again. |
| Upload fails with `413` | Audio is limited to 50 MB and covers to 10 MB. |

## Running tests

```bash
npm test
```

Server unit tests use Node's built-in `node:test` runner and don't need a
database.
