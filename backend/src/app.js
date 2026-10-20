// Builds the Express application. The database is passed in, so the real
// server can use the file on disk and the tests can use a temporary one.
// `version` and `buildDate` describe which build of Orbit is running; they
// are reported by the health check.

import express from 'express';
import { bookmarksRouter } from './routes/bookmarks.js';
import { collectionsRouter } from './routes/collections.js';
import { shortcutsRouter } from './routes/shortcuts.js';
import { subgroupsRouter } from './routes/subgroups.js';
import { tagsRouter } from './routes/tags.js';

export function createApp(db, { version = 'dev', buildDate = '' } = {}) {
  const app = express();

  // Read JSON request bodies into req.body.
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (req, res) => {
    db.prepare('SELECT 1').get(); // fails (and returns 500) if the database is unreachable
    res.json({ status: 'ok', version, buildDate });
  });

  app.use('/api/collections', collectionsRouter(db));
  app.use('/api/subgroups', subgroupsRouter(db));
  app.use('/api/bookmarks', bookmarksRouter(db));
  app.use('/api/tags', tagsRouter(db));
  app.use('/api/shortcuts', shortcutsRouter(db));

  // Any other /api address does not exist.
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found.' });
  });

  // Error handler: Express sends every thrown error here (it has 4 arguments).
  app.use((err, req, res, next) => {
    if (err.status && err.status < 500) {
      // Our own HttpErrors, and Express's "the JSON body is broken" error.
      const message = err.type === 'entity.parse.failed' ? 'The request body is not valid JSON.' : err.message;
      return res.status(err.status).json({ error: message });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  });

  return app;
}
