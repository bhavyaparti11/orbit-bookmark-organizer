# ---------------------------------------------------------------
# Frontend image, built in two stages:
#   Stage 1 ("build") uses Node.js to turn the React code into static files.
#   Stage 2 copies only those files into a small nginx web server image.
# Node.js and node_modules are NOT part of the final image.
# Build:  docker build -t orbit-frontend ./frontend
# ---------------------------------------------------------------

# ---- Stage 1: build the static files ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Stage 2: serve them with nginx ----
FROM nginx:1.28-alpine

# Our nginx settings: serve the React app and forward /api to the backend.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
