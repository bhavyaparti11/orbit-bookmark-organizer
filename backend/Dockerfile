# ---------------------------------------------------------------
# Backend image: Node.js + Express + SQLite (better-sqlite3)
# Build:  docker build -t orbit-backend ./backend
# ---------------------------------------------------------------

# 1. Start from the official Node.js 22 image (Debian "bookworm", slim variant).
FROM node:22-bookworm-slim

# 2. Runtime settings. DATABASE_PATH points into /app/data, the folder
#    that Docker Compose mounts as a named volume.
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=/app/data/orbit.db

WORKDIR /app

# 3. Install dependencies first. This layer is cached and only re-runs
#    when package.json or package-lock.json change.
#    --omit=dev skips the test tools (Vitest, Supertest).
#    better-sqlite3 downloads a ready-made Linux binary while installing,
#    so the image needs no Python or C++ compiler.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 4. Copy the application code.
COPY src ./src

# 4b. Version information. GitHub Actions passes these in as build arguments
#     (e.g. APP_VERSION=sha-1a2b3c4); a local build is just "local".
#     ENV keeps them available when the container runs.
ARG APP_VERSION=local
ARG BUILD_DATE=""
ENV APP_VERSION=${APP_VERSION}     BUILD_DATE=${BUILD_DATE}

# 5. Run as the unprivileged "node" user (it comes with the image) and make
#    sure it owns the data folder where SQLite writes its file.
RUN mkdir -p /app/data && chown node:node /app/data
USER node

# 6. Documentation only: the API listens on port 3000 inside the container.
EXPOSE 3000

# 7. Docker checks the health endpoint every 15 seconds.
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
