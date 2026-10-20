import { Router } from 'express';
import { HttpError, parseId, requiredText } from '../validation.js';

// Subgroups are created through POST /api/collections/:id/subgroups
// (see collections.js). This router renames and deletes them.
export function subgroupsRouter(db) {
  const router = Router();

  const findSubgroup = db.prepare(`
    SELECT s.id, s.collection_id AS collectionId, s.name,
           (SELECT COUNT(*) FROM bookmarks b WHERE b.subgroup_id = s.id) AS bookmarkCount
    FROM subgroups s
    WHERE s.id = ?
  `);
  const findNameClash = db.prepare(
    'SELECT id FROM subgroups WHERE collection_id = ? AND name = ? AND id != ?',
  );
  const renameSubgroup = db.prepare('UPDATE subgroups SET name = ? WHERE id = ?');
  const deleteSubgroup = db.prepare('DELETE FROM subgroups WHERE id = ?');

  function getSubgroup(id) {
    const subgroup = findSubgroup.get(id);
    if (!subgroup) throw new HttpError(404, 'Subgroup not found.');
    return subgroup;
  }

  router.put('/:id', (req, res) => {
    const id = parseId(req.params.id, 'Subgroup');
    const subgroup = getSubgroup(id);
    const name = requiredText(req.body.name, 'Subgroup name', 40);
    if (findNameClash.get(subgroup.collectionId, name, id)) {
      throw new HttpError(409, `This collection already has a subgroup called "${name}".`);
    }
    renameSubgroup.run(name, id);
    res.json(getSubgroup(id));
  });

  // The bookmarks in a deleted subgroup stay in the collection
  // (the foreign key uses ON DELETE SET NULL).
  router.delete('/:id', (req, res) => {
    const id = parseId(req.params.id, 'Subgroup');
    getSubgroup(id);
    deleteSubgroup.run(id);
    res.status(204).end();
  });

  return router;
}
