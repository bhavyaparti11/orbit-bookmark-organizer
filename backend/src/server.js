// Entry point: opens the database and starts listening for HTTP requests.
//
// Settings come from environment variables so that the same code works on
// your computer and inside Docker:
//   PORT           — default 3000
//   DATABASE_PATH  — default ./data/orbit.db (Docker sets /app/data/orbit.db)
//   APP_VERSION    — which build this is, e.g. sha-1a2b3c4 (set in the Docker image)
//   BUILD_DATE     — when the image was built

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { openDatabase } from './db.js';

const backendDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const port = Number(process.env.PORT) || 3000;
const databasePath = process.env.DATABASE_PATH || path.join(backendDir, 'data', 'orbit.db');

const db = openDatabase(databasePath);
const version = process.env.APP_VERSION || 'dev';
const buildDate = process.env.BUILD_DATE || '';

const server = createApp(db, { version, buildDate }).listen(port, () => {
  console.log(`Orbit API ${version} listening on http://localhost:${port} (database: ${databasePath})`);
});

// `docker compose stop` sends SIGTERM. Close the database cleanly before exiting.
function shutDown(signal) {
  console.log(`${signal} received, shutting down.`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
