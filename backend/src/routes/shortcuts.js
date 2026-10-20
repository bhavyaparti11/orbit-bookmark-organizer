import { Router } from 'express';
import { HttpError, normalizeUrl, parseId, requiredText } from '../validation.js';

// Keeps the quick-access row on the dashboard tidy.
export const MAX_PINNED = 8;

export function shortcutsRouter(db) {
  const router = Router();

  const SELECT = 'SELECT id, name, url, pinned, created_at AS createdAt FROM shortcuts';
  const listShortcuts = db.prepare(`${SELECT} ORDER BY pinned DESC, created_at, id`);
  const findShortcut = db.prepare(`${SELECT} WHERE id = ?`);
  const findDuplicate = db.prepare('SELECT name FROM shortcuts WHERE url_key = ? AND id != ?');
  const countPinned = db.prepare('SELECT COUNT(*) AS count FROM shortcuts WHERE pinned = 1 AND id != ?');
  const insertShortcut = db.prepare(
    'INSERT INTO shortcuts (name, url, url_key, pinned) VALUES (@name, @url, @urlKey, @pinned)',
  );
  const updateShortcut = db.prepare(
    'UPDATE shortcuts SET name = @name, url = @url, url_key = @urlKey, pinned = @pinned WHERE id = @id',
  );
  const deleteShortcut = db.prepare('DELETE FROM shortcuts WHERE id = ?');

  // SQLite has no true/false type, so pinned is stored as 1 or 0.
  const toShortcut = (row) => ({ ...row, pinned: row.pinned === 1 });

  function getShortcut(id) {
    const row = findShortcut.get(id);
    if (!row) throw new HttpError(404, 'Shortcut not found.');
    return toShortcut(row);
  }

  function readShortcut(body, id = 0) {
    const { url, key } = normalizeUrl(body.url);
    const data = {
      name: requiredText(body.name, 'Name', 24),
      url,
      urlKey: key,
      pinned: body.pinned === false ? 0 : 1,
    };
    const duplicate = findDuplicate.get(key, id);
    if (duplicate) throw new HttpError(409, `You already have a shortcut to this site ("${duplicate.name}").`);
    if (data.pinned && countPinned.get(id).count >= MAX_PINNED) {
      throw new HttpError(409, `You can pin up to ${MAX_PINNED} shortcuts. Unpin one first.`);
    }
    return data;
  }

  router.get('/', (req, res) => {
    res.json(listShortcuts.all().map(toShortcut));
  });

  router.post('/', (req, res) => {
    const result = insertShortcut.run(readShortcut(req.body));
    res.status(201).json(getShortcut(result.lastInsertRowid));
  });

  router.put('/:id', (req, res) => {
    const id = parseId(req.params.id, 'Shortcut');
    getShortcut(id);
    updateShortcut.run({ ...readShortcut(req.body, id), id });
    res.json(getShortcut(id));
  });

  router.delete('/:id', (req, res) => {
    const id = parseId(req.params.id, 'Shortcut');
    getShortcut(id);
    deleteShortcut.run(id);
    res.status(204).end();
  });

  return router;
}
