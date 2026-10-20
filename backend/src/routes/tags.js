import { Router } from 'express';

// Tags are created automatically when a bookmark uses them, and removed
// automatically when no bookmark uses them any more. So the only tag
// endpoint needed is a list (used for the tag filter and suggestions).
export function tagsRouter(db) {
  const router = Router();

  const listTags = db.prepare(`
    SELECT t.name, COUNT(bt.bookmark_id) AS count
    FROM tags t
    JOIN bookmark_tags bt ON bt.tag_id = t.id
    GROUP BY t.id
    ORDER BY t.name
  `);

  router.get('/', (req, res) => {
    res.json(listTags.all());
  });

  return router;
}

export function removeUnusedTags(db) {
  db.prepare('DELETE FROM tags WHERE id NOT IN (SELECT tag_id FROM bookmark_tags)').run();
}

// Replaces all tags of one bookmark with the given list of names.
export function setBookmarkTags(db, bookmarkId, tagNames) {
  db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?').run(bookmarkId);

  const insertTag = db.prepare('INSERT INTO tags (name) VALUES (?) ON CONFLICT (name) DO NOTHING');
  const findTag = db.prepare('SELECT id FROM tags WHERE name = ?');
  const linkTag = db.prepare('INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)');

  for (const name of tagNames) {
    insertTag.run(name);
    linkTag.run(bookmarkId, findTag.get(name).id);
  }
  removeUnusedTags(db);
}
