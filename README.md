# Orbit 🪐

A calm, personal place to keep useful links (videos, articles, recipes, travel ideas), organised into collections, tagged and searchable.

Orbit runs on your own computer. Your bookmarks stay private to you.

---

## Use Orbit

### 1. Install Docker Desktop

Download it from https://www.docker.com/products/docker-desktop/, install it and open it.
Wait until it says **Engine running**.

### 2. Download Orbit

Open **PowerShell** (Windows) or **Terminal** (Mac) and copy-paste:

**Windows**
```powershell
mkdir $HOME\orbit
cd $HOME\orbit
curl.exe -o compose.yaml https://raw.githubusercontent.com/bhavyaparti11/orbit-bookmark-organizer/main/compose.ghcr.yaml
```

**Mac**
```bash
mkdir ~/orbit
cd ~/orbit
curl -o compose.yaml https://raw.githubusercontent.com/bhavyaparti11/orbit-bookmark-organizer/main/compose.ghcr.yaml
```

### 3. Start Orbit

```bash
docker compose pull
docker compose up -d
```

Open **http://localhost:8080** in your browser. 🎉

### Everyday commands

Run these from your `orbit` folder (`cd $HOME\orbit` on Windows, `cd ~/orbit` on Mac):

| I want to… | Command |
|---|---|
| Stop Orbit | `docker compose down` |
| Start it again | `docker compose up -d` |
| Get the newest version | `docker compose pull` then `docker compose up -d` |

Your bookmarks are kept when you stop, restart or update Orbit.

> ⚠️ Never run `docker compose down -v`. The `-v` deletes all your bookmarks.

**Page won't open?** Make sure Docker Desktop says *Engine running*, then run `docker compose up -d` again.

---

## For developers

**Built with:** React + Vite (frontend), Node.js + Express (API), SQLite (database), Docker Compose, GitHub Actions.

### Run from the source code

```bash
git clone https://github.com/bhavyaparti11/orbit-bookmark-organizer.git
cd orbit-bookmark-organizer
docker compose up --build -d
```

Open http://localhost:8080. After changing code, run `docker compose up --build -d` again.

### Run without Docker

Needs Node.js 22. Use two terminals:

```bash
cd backend && npm install && npm run dev     # API on http://localhost:3000
cd frontend && npm install && npm run dev    # app on http://localhost:5173
```

### Tests

```bash
cd backend && npm test
cd frontend && npm test
```

### How updates reach users

Every push to `main` runs `.github/workflows/ci.yml`:

1. Runs the tests and builds the app.
2. Builds the Docker images and checks the app starts.
3. Publishes the images to GitHub Container Registry (`ghcr.io/bhavyaparti11/orbit-backend` and `orbit-frontend`).

When all three steps are green, users get the new version with `docker compose pull` and `docker compose up -d`.

### Project layout

```
backend/              Express API + SQLite (src/, tests/, Dockerfile)
frontend/             React app (src/, nginx.conf, Dockerfile)
compose.yaml          builds and runs Orbit from the source code
compose.ghcr.yaml     runs Orbit from the published images
.github/workflows/    CI/CD pipeline
```
