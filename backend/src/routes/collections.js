import { Router } from 'express';
import { HttpError, optionalText, parseId, requiredText } from '../validation.js';
import { removeUnusedTags } from './tags.js';

// The cover pictures live in the frontend. The backend only stores the
// cover's name, so it checks that the name is one the frontend knows.
export const COVERS = [
  'saturn', 'moon', 'satellite', 'notebook', 'library',
  'kitchen', 'hills', 'sprout', 'screen', 'comet',
];

function readCollection(body) {
  const cover = body.cover ?? 'saturn';
  if (!COVERS.includes(cover)) throw new HttpError(400, 'Please choose one of the available covers.');
  return {
    name: requiredText(body.name, 'Name', 60),
    description: optionalText(body.description, 'Description', 280),
    cover,
  };
}

export function collectionsRouter(db) {
  const router = Router();

  const listCollections = db.prepare(`
    SELECT c.id, c.name, c.description, c.cover, c.created_at AS createdAt,
           (SELECT COUNT(*) FROM bookmarks b WHERE b.collection_id = c.id) AS bookmarkCount
    FROM collections c
    ORDER BY c.name
  `);
  const findCollection = db.prepare(`
    SELECT c.id, c.name, c.description, c.cover, c.created_at AS createdAt,
           (SELECT COUNT(*) FROM bookmarks b WHERE b.collection_id = c.id) AS bookmarkCount
    FROM collections c
    WHERE c.id = ?
  `);
  const listSubgroups = db.prepare(`
    SELECT s.id, s.collection_id AS collectionId, s.name,
           (SELECT COUNT(*) FROM bookmarks b WHERE b.subgroup_id = s.id) AS bookmarkCount
    FROM subgroups s
    ORDER BY s.name
  `);
  const findNameClash = db.prepare('SELECT id FROM collections WHERE name = ? AND id != ?');
  const insertCollection = db.prepare(
    'INSERT INTO collections (name, description, cover) VALUES (@name, @description, @cover)',
  );
  const updateCollection = db.prepare(
    'UPDATE collections SET name = @name, description = @description, cover = @cover WHERE id = @id',
  );
  const deleteCollection = db.prepare('DELETE FROM collections WHERE id = ?');
  const findSubgroupClash = db.prepare('SELECT id FROM subgroups WHERE collection_id = ? AND name = ?');
  const insertSubgroup = db.prepare('INSERT INTO subgroups (collection_id, name) VALUES (?, ?)');
  const findSubgroup = db.prepare(
    'SELECT id, collection_id AS collectionId, name, 0 AS bookmarkCount FROM subgroups WHERE id = ?',
  );

  // Returns one collection together with its subgroups, or throws a 404.
  function getCollection(id) {
    const collection = findCollection.get(id);
    if (!collection) throw new HttpError(404, 'Collection not found.');
    const subgroups = listSubgroups.all().filter((s) => s.collectionId === id);
    return { ...collection, subgroups };
  }

  function checkNameIsFree(name, id = 0) {
    if (findNameClash.get(name, id)) {
      throw new HttpError(409, `You already have a collection called "${name}".`);
    }
  }

  // GET /api/collections — every collection, each with its subgroups.
  router.get('/', (req, res) => {
    const subgroups = listSubgroups.all();
    const collections = listCollections.all().map((collection) => ({
      ...collection,
      subgroups: subgroups.filter((s) => s.collectionId === collection.id),
    }));
    res.json(collections);
  });

  router.get('/:id', (req, res) => {
    res.json(getCollection(parseId(req.params.id, 'Collection')));
  });

  router.post('/', (req, res) => {
    const data = readCollection(req.body);
    checkNameIsFree(data.name);
    const result = insertCollection.run(data);
    res.status(201).json(getCollection(Number(result.lastInsertRowid)));
  });

  router.put('/:id', (req, res) => {
    const id = parseId(req.params.id, 'Collection');
    getCollection(id); // 404 if it does not exist
    const data = readCollection(req.body);
    checkNameIsFree(data.name, id);
    updateCollection.run({ ...data, id });
    res.json(getCollection(id));
  });

  // Deleting a collection also deletes its subgroups and bookmarks,
  // because the tables use ON DELETE CASCADE.
  router.delete('/:id', (req, res) => {
    const id = parseId(req.params.id, 'Collection');
    getCollection(id);
    deleteCollection.run(id);
    removeUnusedTags(db);
    res.status(204).end();
  });

  // POST /api/collections/:id/subgroups — create a subgroup inside a collection.
  router.post('/:id/subgroups', (req, res) => {
    const collectionId = parseId(req.params.id, 'Collection');
    getCollection(collectionId);
    const name = requiredText(req.body.name, 'Subgroup name', 40);
    if (findSubgroupClash.get(collectionId, name)) {
      throw new HttpError(409, `This collection already has a subgroup called "${name}".`);
    }
    const result = insertSubgroup.run(collectionId, name);
    res.status(201).json(findSubgroup.get(result.lastInsertRowid));
  });

  return router;
}
