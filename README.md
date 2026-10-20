# Orbit 🪐

**A minimalist personal bookmark and knowledge organizer.**
A quiet place to keep useful links (study material, YouTube tutorials, interview prep, recipes, travel ideas), organised into collections and subgroups, tagged, and searchable.

Orbit is a small learning project built with **React + Vite**, **Node.js + Express**, **SQLite**, **Docker / Docker Compose** and **GitHub Actions**.

> 📘 The full beginner-friendly explanation of every part of the project is in **[`Orbit_Project_Guide.docx`](Orbit_Project_Guide.docx)**.

---

## Features

- **Dashboard** — greeting, prominent search, pinned quick-access websites, collection cards with pixel-art covers, friendly first-time empty state.
- **Collections** — create, edit, delete; required name, optional description, choice of 10 pixel-art covers (all drawn in code, no image files or external URLs).
- **Subgroups** — one level inside a collection (e.g. *YouTube Videos*, *Reading Material*); create, rename, delete. Deleting a subgroup keeps its links as “Unsorted”.
- **Bookmarks** — title, URL, optional note, collection, optional subgroup, optional tags; add, edit, delete (with confirmation), open in a new tab, copy link.
- **URL validation** in the browser **and** the API: only `http://` / `https://`; duplicates are detected after normalisation (`http://www.Example.com/docs/` = `https://example.com/docs`).
- **Tags** — reusable across collections, created and removed automatically; click a tag to filter.
- **Search & filters** — search title, URL and note; filter by collection, subgroup and tag; all combine; one “Clear filters” button.
- **Quick access** — up to 8 pinned shortcuts (YouTube, GitHub, Notion…), independent of collections; add, edit, pin/unpin, remove.
- Responsive layout, keyboard focus styles, labelled controls, native `<dialog>` modals.

Out of scope on purpose: accounts/login, cloud sync, scraping, favicons or previews from the internet, image uploads, deeper nesting.

## Project structure

```
orbit-bookmark-organizer/
├── backend/                  Express REST API + SQLite
│   ├── src/
│   │   ├── server.js         entry point: reads env vars, opens DB, starts listening
│   │   ├── app.js            builds the Express app, routes, error handler
│   │   ├── db.js             opens SQLite, schema + migrations (PRAGMA user_version)
│   │   ├── validation.js     input checks, URL normalisation, HttpError
│   │   └── routes/           collections, subgroups, bookmarks, tags, shortcuts
│   ├── tests/                Vitest + Supertest (in-memory database)
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/                 React + Vite single-page app
│   ├── src/
│   │   ├── App.jsx           state, data loading, dialogs
│   │   ├── components/       Sidebar, Dashboard, CollectionPage, forms, ...
│   │   ├── art/              pixel-art sprites (text) and cover scenes
│   │   ├── lib/              api.js (fetch wrapper), text helpers + tests
│   │   └── styles.css        all styling, palette in CSS variables
│   ├── nginx.conf            serves the build, proxies /api to the backend
│   ├── Dockerfile            multi-stage: Node builds, nginx serves
│   └── .dockerignore
├── compose.yaml              runs both containers + the named volume
├── .github/workflows/ci.yml  test → Docker build & smoke test → publish to GHCR
├── Orbit_Project_Guide.docx  the detailed project guide
└── .env.example              optional settings for running the backend without Docker
```

## Run with Docker (recommended)

Prerequisite: [Docker Desktop](https://www.docker.com/products/docker-desktop/) running.

```bash
docker compose up --build
```

Open **http://localhost:8080**. Stop with `Ctrl+C`.

| Task | Command |
|---|---|
| Start in the background | `docker compose up --build -d` |
| See what is running | `docker compose ps` |
| Follow the logs | `docker compose logs -f` (or `docker compose logs -f backend`) |
| Stop (containers removed, **data kept**) | `docker compose down` |
| Restart one service | `docker compose restart backend` |
| Rebuild after changing code | `docker compose up --build -d` |
| Look at the data volume | `docker volume inspect orbit_orbit-data` |
| Back up the database | `docker compose cp backend:/app/data/orbit.db ./orbit-backup.db` |

**Check that data persists:** add a collection, run `docker compose down`, then `docker compose up -d` and refresh — it is still there. The SQLite file lives in the named volume `orbit_orbit-data`, not inside the container.

> ⚠️ **Destructive:** `docker compose down -v` (or `docker volume rm orbit_orbit-data`) deletes the volume and **all your saved bookmarks**. Back up first.

How it fits together:

```
 your browser ──► localhost:8080 ──► [frontend container: nginx]
                                        │  /            → React files
                                        │  /api/...     → http://backend:3000
                                        ▼
                                     [backend container: Express] ──► /app/data/orbit.db
                                                                        (named volume orbit-data)
```

Only port 8080 is published (and only on `127.0.0.1`); the backend is reachable only inside the Compose network.

## Run without Docker (development)

Prerequisite: Node.js 22+.

```bash
# terminal 1 — API on http://localhost:3000 (database: backend/data/orbit.db)
cd backend
npm install
npm run dev

# terminal 2 — React dev server on http://localhost:5173 (proxies /api to :3000)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Optional settings: see `.env.example` (`PORT`, `DATABASE_PATH`).

## Tests

```bash
cd backend  && npm test     # 37 API + validation tests (Vitest + Supertest)
cd frontend && npm test     # 24 tests: URL/tag helpers, pixel-art and cover data
```

Backend tests use a fresh **in-memory** SQLite database per test, so they never touch your real data.

## API

All responses are JSON. Errors look like `{ "error": "message" }` with status 400 (invalid input), 404 (not found) or 409 (duplicate / limit reached).

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | health check |
| GET / POST | `/api/collections` | list (with subgroups and counts) / create |
| GET / PUT / DELETE | `/api/collections/:id` | read / update / delete (cascades) |
| POST | `/api/collections/:id/subgroups` | create a subgroup |
| PUT / DELETE | `/api/subgroups/:id` | rename / delete |
| GET | `/api/bookmarks?q=&collectionId=&subgroupId=&tag=` | list, search and filter (`subgroupId=none` = unsorted) |
| POST | `/api/bookmarks` | create |
| GET / PUT / DELETE | `/api/bookmarks/:id` | read / update / delete |
| GET | `/api/tags` | tags in use, with counts |
| GET / POST | `/api/shortcuts` | list / create (max 8 pinned) |
| PUT / DELETE | `/api/shortcuts/:id` | update (incl. pin/unpin) / delete |

## CI/CD (GitHub Actions)

`.github/workflows/ci.yml` runs on pushes and pull requests to `main`:

1. **test** — `npm ci`, backend tests, frontend tests, frontend build (Node 22).
2. **docker** — `docker compose build`, start the stack, smoke-test `/api/health`, the page and a create/read through nginx.
3. **publish** — only on pushes to `main`: pushes `ghcr.io/<owner>/orbit-backend` and `ghcr.io/<owner>/orbit-frontend` tagged `sha-<commit>` and `latest`, using the built-in `GITHUB_TOKEN` (no secrets to configure).

The app never depends on GHCR — `docker compose up --build` always builds locally. To run the published images instead, replace `build:` with `image: ghcr.io/<owner>/orbit-backend:latest` (and the frontend equivalent). If the packages are private, run `docker login ghcr.io` first.

## Publish this repository to GitHub

The local repository is already initialised on `main` with a first commit. With the [GitHub CLI](https://cli.github.com/):

```bash
winget install --id GitHub.cli     # once (Windows)
gh auth login                      # once, in the browser
gh repo create orbit-bookmark-organizer --private --source . --remote origin --push
```

Or create an empty repository named `orbit-bookmark-organizer` on github.com (no README), then:

```bash
git remote add origin https://github.com/<your-username>/orbit-bookmark-organizer.git
git push -u origin main
```

After the first push, open the **Actions** tab to watch the pipeline. Published images appear under your profile → **Packages**.

## Troubleshooting

| Problem | Fix |
|---|---|
| `port is already allocated` for 8080 | Another program uses 8080. Change `"127.0.0.1:8080:80"` to e.g. `"127.0.0.1:8081:80"` in `compose.yaml`. |
| Page says “Orbit cannot reach its server” | `docker compose ps` — is the backend `healthy`? Check `docker compose logs backend`. In dev mode, start the backend (`npm run dev` in `backend/`). |
| `Cannot connect to the Docker daemon` | Start Docker Desktop and wait until it says “running”. |
| Code changes don’t show in Docker | Rebuild: `docker compose up --build -d`. |
| `npm install` fails building `better-sqlite3` | Use Node.js 22 LTS (prebuilt binaries are downloaded for it). |
