import { Router } from 'express';
import {
  HttpError,
  normalizeUrl,
  optionalText,
  parseId,
  parseTags,
  requiredText,
} from '../validation.js';
import { removeUnusedTags, setBookmarkTags } from './tags.js';

// One SELECT used by every bookmark query. The tags of each bookmark are
// collected into a JSON array, e.g. '["Docker","beginner"]'.
const SELECT_BOOKMARKS = `
  SELECT b.id, b.title, b.url, b.description,
         b.collection_id AS collectionId, c.name AS collectionName,
         b.subgroup_id   AS subgroupId,   s.name AS subgroupName,
         b.created_at AS createdAt, b.updated_at AS updatedAt,
         (SELECT json_group_array(name) FROM (
            SELECT t.name FROM bookmark_tags bt JOIN tags t ON t.id = bt.tag_id
            WHERE bt.bookmark_id = b.id ORDER BY t.name
         )) AS tags
  FROM bookmarks b
  JOIN collections c    ON c.id = b.collection_id
  LEFT JOIN subgroups s ON s.id = b.subgroup_id
`;

function toBookmark(row) {
  return { ...row, tags: JSON.parse(row.tags) };
}

// Escapes % and _ so that a search for "100%" means the literal text "100%".
function likePattern(text) {
  return `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function bookmarksRouter(db) {
  const router = Router();

  const findBookmark = db.prepare(`${SELECT_BOOKMARKS} WHERE b.id = ?`);
  const findCollection = db.prepare('SELECT id FROM collections WHERE id = ?');
  const findSubgroup = db.prepare('SELECT id, collection_id AS collectionId FROM subgroups WHERE id = ?');
  const findDuplicate = db.prepare(`
    SELECT b.title, c.name AS collectionName
    FROM bookmarks b JOIN collections c ON c.id = b.collection_id
    WHERE b.url_key = ? AND b.id != ?
  `);
  const insertBookmark = db.prepare(`
    INSERT INTO bookmarks (collection_id, subgroup_id, title, url, url_key, description)
    VALUES (@collectionId, @subgroupId, @title, @url, @urlKey, @description)
  `);
  const updateBookmark = db.prepare(`
    UPDATE bookmarks
    SET collection_id = @collectionId, subgroup_id = @subgroupId, title = @title,
        url = @url, url_key = @urlKey, description = @description,
        updated_at = datetime('now')
    WHERE id = @id
  `);
  const deleteBookmark = db.prepare('DELETE FROM bookmarks WHERE id = ?');

  function getBookmark(id) {
    const row = findBookmark.get(id);
    if (!row) throw new HttpError(404, 'Bookmark not found.');
    return toBookmark(row);
  }

  // Validates the request body and returns clean data ready for SQL.
  function readBookmark(body, id = 0) {
    const { url, key } = normalizeUrl(body.url);
    const data = {
      title: requiredText(body.title, 'Title', 200),
      url,
      urlKey: key,
      description: optionalText(body.description, 'Description', 1000),
      collectionId: parseId(body.collectionId, 'Collection'),
      subgroupId: parseId(body.subgroupId, 'Subgroup', { optional: true }),
      tags: parseTags(body.tags),
    };

    if (!findCollection.get(data.collectionId)) {
      throw new HttpError(400, 'Please choose an existing collection.');
    }
    if (data.subgroupId !== null) {
      const subgroup = findSubgroup.get(data.subgroupId);
      if (!subgroup || subgroup.collectionId !== data.collectionId) {
        throw new HttpError(400, 'That subgroup does not belong to the chosen collection.');
      }
    }

    const duplicate = findDuplicate.get(data.urlKey, id);
    if (duplicate) {
      throw new HttpError(
        409,
        `This link is already saved as "${duplicate.title}" in ${duplicate.collectionName}.`,
      );
    }
    return data;
  }

  // GET /api/bookmarks?q=docker&collectionId=1&subgroupId=2&tag=beginner
  // Every filter is optional and they can be combined.
  // subgroupId=none means "bookmarks that are not in any subgroup".
  router.get('/', (req, res) => {
    const conditions = [];
    const params = {};
    const { q, collectionId, subgroupId, tag } = req.query;

    if (typeof q === 'string' && q.trim()) {
      conditions.push(
        "(b.title LIKE @q ESCAPE '\\' OR b.url LIKE @q ESCAPE '\\' OR b.description LIKE @q ESCAPE '\\')",
      );
      params.q = likePattern(q.trim());
    }
    if (collectionId) {
      conditions.push('b.collection_id = @collectionId');
      params.collectionId = parseId(collectionId, 'Collection');
    }
    if (subgroupId === 'none') {
      conditions.push('b.subgroup_id IS NULL');
    } else if (subgroupId) {
      conditions.push('b.subgroup_id = @subgroupId');
      params.subgroupId = parseId(subgroupId, 'Subgroup');
    }
    if (typeof tag === 'string' && tag.trim()) {
      conditions.push(`EXISTS (
        SELECT 1 FROM bookmark_tags bt JOIN tags t ON t.id = bt.tag_id
        WHERE bt.bookmark_id = b.id AND t.name = @tag
      )`);
      params.tag = tag.trim();
    }

    // Only fixed pieces of SQL are joined together here. Every value typed
    // by the user is passed separately as a parameter (@q, @tag, ...).
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db
      .prepare(`${SELECT_BOOKMARKS} ${where} ORDER BY b.created_at DESC, b.id DESC`)
      .all(params);
    res.json(rows.map(toBookmark));
  });

  router.get('/:id', (req, res) => {
    res.json(getBookmark(parseId(req.params.id, 'Bookmark')));
  });

  router.post('/', (req, res) => {
    const data = readBookmark(req.body);
    // A transaction: the bookmark and its tags are saved together, or not at all.
    const id = db.transaction(() => {
      const result = insertBookmark.run(data);
      const newId = Number(result.lastInsertRowid);
      setBookmarkTags(db, newId, data.tags);
      return newId;
    })();
    res.status(201).json(getBookmark(id));
  });

  router.put('/:id', (req, res) => {
    const id = parseId(req.params.id, 'Bookmark');
    getBookmark(id);
    const data = readBookmark(req.body, id);
    db.transaction(() => {
      updateBookmark.run({ ...data, id });
      setBookmarkTags(db, id, data.tags);
    })();
    res.json(getBookmark(id));
  });

  router.delete('/:id', (req, res) => {
    const id = parseId(req.params.id, 'Bookmark');
    getBookmark(id);
    deleteBookmark.run(id);
    removeUnusedTags(db);
    res.status(204).end();
  });

  return router;
}
