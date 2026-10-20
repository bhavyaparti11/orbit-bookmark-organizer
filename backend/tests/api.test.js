// API tests. Each test gets a brand-new in-memory SQLite database,
// so the tests never touch your real data and never affect each other.

import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { openDatabase } from '../src/db.js';

let db;
let api;

beforeEach(() => {
  db = openDatabase(':memory:');
  api = request(createApp(db));
});

afterEach(() => {
  db.close();
});

// Small helpers that create data and check it was created.
async function createCollection(fields = {}) {
  const res = await api.post('/api/collections').send({ name: 'Computer Networks', ...fields });
  expect(res.status).toBe(201);
  return res.body;
}

async function createSubgroup(collectionId, name) {
  const res = await api.post(`/api/collections/${collectionId}/subgroups`).send({ name });
  expect(res.status).toBe(201);
  return res.body;
}

async function createBookmark(fields) {
  const res = await api.post('/api/bookmarks').send(fields);
  expect(res.status).toBe(201);
  return res.body;
}

describe('health check', () => {
  it('reports that the API and database are working', async () => {
    const res = await api.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns a JSON 404 for unknown API addresses', async () => {
    const res = await api.get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeTruthy();
  });
});

describe('collections', () => {
  it('creates a collection and lists it with its subgroups', async () => {
    const created = await createCollection({ description: 'OSI, TCP/IP and more', cover: 'satellite' });
    expect(created).toMatchObject({
      name: 'Computer Networks',
      description: 'OSI, TCP/IP and more',
      cover: 'satellite',
      bookmarkCount: 0,
      subgroups: [],
    });

    await createSubgroup(created.id, 'YouTube Videos');

    const res = await api.get('/api/collections');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].subgroups.map((s) => s.name)).toEqual(['YouTube Videos']);
  });

  it('uses the default cover when none is chosen', async () => {
    const created = await createCollection();
    expect(created.cover).toBe('saturn');
  });

  it('requires a name and a known cover', async () => {
    const noName = await api.post('/api/collections').send({ name: '   ' });
    expect(noName.status).toBe(400);
    expect(noName.body.error).toMatch(/name is required/i);

    const badCover = await api.post('/api/collections').send({ name: 'Recipes', cover: 'unicorn' });
    expect(badCover.status).toBe(400);
  });

  it('rejects a second collection with the same name (ignoring case)', async () => {
    await createCollection({ name: 'Recipes' });
    const res = await api.post('/api/collections').send({ name: 'recipes' });
    expect(res.status).toBe(409);
  });

  it('updates a collection', async () => {
    const created = await createCollection();
    const res = await api
      .put(`/api/collections/${created.id}`)
      .send({ name: 'Networking', description: 'Updated', cover: 'comet' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: 'Networking', description: 'Updated', cover: 'comet' });
  });

  it('returns 404 for a collection that does not exist', async () => {
    const res = await api.put('/api/collections/999').send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('deleting a collection also deletes its subgroups, bookmarks and unused tags', async () => {
    const collection = await createCollection();
    const subgroup = await createSubgroup(collection.id, 'Reading Material');
    await createBookmark({
      title: 'TCP explained',
      url: 'https://example.com/tcp',
      collectionId: collection.id,
      subgroupId: subgroup.id,
      tags: ['revision'],
    });

    const res = await api.delete(`/api/collections/${collection.id}`);
    expect(res.status).toBe(204);

    expect(db.prepare('SELECT COUNT(*) AS n FROM subgroups').get().n).toBe(0);
    expect(db.prepare('SELECT COUNT(*) AS n FROM bookmarks').get().n).toBe(0);
    expect((await api.get('/api/tags')).body).toEqual([]);
  });
});

describe('subgroups', () => {
  it('renames a subgroup and refuses duplicate names in the same collection', async () => {
    const collection = await createCollection({ name: 'Recipes' });
    const first = await createSubgroup(collection.id, 'Written Recipes');
    await createSubgroup(collection.id, 'Video Recipes');

    const renamed = await api.put(`/api/subgroups/${first.id}`).send({ name: 'Want to Try' });
    expect(renamed.status).toBe(200);
    expect(renamed.body.name).toBe('Want to Try');

    const clash = await api.put(`/api/subgroups/${first.id}`).send({ name: 'video recipes' });
    expect(clash.status).toBe(409);
  });

  it('keeps bookmarks in the collection when their subgroup is deleted', async () => {
    const collection = await createCollection({ name: 'Recipes' });
    const subgroup = await createSubgroup(collection.id, 'Want to Try');
    const bookmark = await createBookmark({
      title: 'Pasta',
      url: 'https://example.com/pasta',
      collectionId: collection.id,
      subgroupId: subgroup.id,
    });

    expect((await api.delete(`/api/subgroups/${subgroup.id}`)).status).toBe(204);

    const res = await api.get(`/api/bookmarks/${bookmark.id}`);
    expect(res.status).toBe(200);
    expect(res.body.collectionId).toBe(collection.id);
    expect(res.body.subgroupId).toBeNull();
  });
});

describe('bookmarks', () => {
  it('creates a bookmark and returns it with its collection, subgroup and tags', async () => {
    const collection = await createCollection();
    const subgroup = await createSubgroup(collection.id, 'YouTube Videos');

    const created = await createBookmark({
      title: 'Subnetting in 10 minutes',
      url: 'https://www.youtube.com/watch?v=abc',
      description: 'Quick revision before exams',
      collectionId: collection.id,
      subgroupId: subgroup.id,
      tags: ['revision', 'beginner', 'Revision'],
    });

    expect(created).toMatchObject({
      title: 'Subnetting in 10 minutes',
      url: 'https://www.youtube.com/watch?v=abc',
      collectionName: 'Computer Networks',
      subgroupName: 'YouTube Videos',
      tags: ['beginner', 'revision'], // duplicate "Revision" removed, sorted
    });

    const list = await api.get('/api/bookmarks');
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(created.id);
  });

  it('allows the optional fields to be left out', async () => {
    const collection = await createCollection();
    const created = await createBookmark({
      title: 'Just a link',
      url: 'https://example.com',
      collectionId: collection.id,
    });
    expect(created).toMatchObject({ description: '', subgroupId: null, tags: [] });
  });

  it('rejects invalid and non-http(s) URLs', async () => {
    const collection = await createCollection();
    const bad = ['not a url', 'example.com', 'ftp://example.com/file', 'javascript:alert(1)', ''];

    for (const url of bad) {
      const res = await api.post('/api/bookmarks').send({ title: 'Bad', url, collectionId: collection.id });
      expect(res.status, `URL "${url}" should be rejected`).toBe(400);
      expect(res.body.error).toBeTruthy();
    }
    expect((await api.get('/api/bookmarks')).body).toHaveLength(0);
  });

  it('rejects duplicate URLs, even when written slightly differently', async () => {
    const collection = await createCollection();
    await createBookmark({ title: 'Docs', url: 'https://example.com/docs', collectionId: collection.id });

    const res = await api.post('/api/bookmarks').send({
      title: 'Same docs again',
      url: 'http://WWW.Example.com/docs/',
      collectionId: collection.id,
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already saved/i);
  });

  it('requires a title and an existing collection', async () => {
    const collection = await createCollection();
    const noTitle = await api.post('/api/bookmarks').send({ url: 'https://a.com', collectionId: collection.id });
    expect(noTitle.status).toBe(400);

    const noCollection = await api.post('/api/bookmarks').send({ title: 'A', url: 'https://a.com', collectionId: 42 });
    expect(noCollection.status).toBe(400);
  });

  it('refuses a subgroup that belongs to a different collection', async () => {
    const networks = await createCollection();
    const recipes = await createCollection({ name: 'Recipes' });
    const recipeSubgroup = await createSubgroup(recipes.id, 'Video Recipes');

    const res = await api.post('/api/bookmarks').send({
      title: 'Mismatch',
      url: 'https://example.com/x',
      collectionId: networks.id,
      subgroupId: recipeSubgroup.id,
    });
    expect(res.status).toBe(400);
  });

  it('updates a bookmark, including moving it and changing its tags', async () => {
    const networks = await createCollection();
    const prep = await createCollection({ name: 'Interview Prep' });
    const bookmark = await createBookmark({
      title: 'OSI model',
      url: 'https://example.com/osi',
      collectionId: networks.id,
      tags: ['beginner'],
    });

    const res = await api.put(`/api/bookmarks/${bookmark.id}`).send({
      title: 'OSI model cheat sheet',
      url: 'https://example.com/osi',
      collectionId: prep.id,
      tags: ['revision'],
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: 'OSI model cheat sheet', collectionName: 'Interview Prep', tags: ['revision'] });

    // "beginner" is no longer used by any bookmark, so it disappears.
    const tags = await api.get('/api/tags');
    expect(tags.body).toEqual([{ name: 'revision', count: 1 }]);
  });

  it('keeping the same URL while editing is not a duplicate', async () => {
    const collection = await createCollection();
    const bookmark = await createBookmark({ title: 'A', url: 'https://a.com/', collectionId: collection.id });
    const res = await api
      .put(`/api/bookmarks/${bookmark.id}`)
      .send({ title: 'A renamed', url: 'https://a.com', collectionId: collection.id });
    expect(res.status).toBe(200);
  });

  it('deletes a bookmark', async () => {
    const collection = await createCollection();
    const bookmark = await createBookmark({ title: 'A', url: 'https://a.com', collectionId: collection.id });

    expect((await api.delete(`/api/bookmarks/${bookmark.id}`)).status).toBe(204);
    expect((await api.get(`/api/bookmarks/${bookmark.id}`)).status).toBe(404);
    expect((await api.delete(`/api/bookmarks/${bookmark.id}`)).status).toBe(404);
  });
});

describe('search and filtering', () => {
  let networks;
  let recipes;
  let videos;

  beforeEach(async () => {
    networks = await createCollection();
    recipes = await createCollection({ name: 'Recipes' });
    videos = await createSubgroup(networks.id, 'YouTube Videos');

    await createBookmark({
      title: 'Docker networking basics',
      url: 'https://example.com/docker-net',
      collectionId: networks.id,
      subgroupId: videos.id,
      tags: ['Docker', 'beginner'],
    });
    await createBookmark({
      title: 'Routing tables',
      url: 'https://example.com/routing',
      description: 'Long read about routers',
      collectionId: networks.id,
      tags: ['revision'],
    });
    await createBookmark({
      title: 'Banana bread',
      url: 'https://recipes.example.org/banana',
      collectionId: recipes.id,
      tags: ['beginner'],
    });
  });

  const titles = (res) => res.body.map((b) => b.title).sort();

  it('searches title, URL and description (case-insensitive)', async () => {
    expect(titles(await api.get('/api/bookmarks?q=DOCKER'))).toEqual(['Docker networking basics']);
    expect(titles(await api.get('/api/bookmarks?q=recipes.example'))).toEqual(['Banana bread']);
    expect(titles(await api.get('/api/bookmarks?q=routers'))).toEqual(['Routing tables']);
  });

  it('treats % and _ in a search as normal characters', async () => {
    expect((await api.get('/api/bookmarks?q=%25')).body).toEqual([]);
  });

  it('filters by collection, subgroup, unsorted and tag', async () => {
    expect(titles(await api.get(`/api/bookmarks?collectionId=${recipes.id}`))).toEqual(['Banana bread']);
    expect(titles(await api.get(`/api/bookmarks?subgroupId=${videos.id}`))).toEqual(['Docker networking basics']);
    expect(titles(await api.get(`/api/bookmarks?collectionId=${networks.id}&subgroupId=none`))).toEqual([
      'Routing tables',
    ]);
    expect(titles(await api.get('/api/bookmarks?tag=beginner'))).toEqual(['Banana bread', 'Docker networking basics']);
  });

  it('combines search and filters', async () => {
    const res = await api.get(`/api/bookmarks?tag=beginner&collectionId=${networks.id}&q=docker`);
    expect(titles(res)).toEqual(['Docker networking basics']);

    const none = await api.get(`/api/bookmarks?tag=beginner&collectionId=${networks.id}&q=banana`);
    expect(none.body).toEqual([]);
  });

  it('lists tags with how many bookmarks use them', async () => {
    const res = await api.get('/api/tags');
    expect(res.body).toEqual([
      { name: 'beginner', count: 2 },
      { name: 'Docker', count: 1 },
      { name: 'revision', count: 1 },
    ]);
  });
});

describe('pinned shortcuts', () => {
  it('creates, edits, unpins and deletes a shortcut', async () => {
    const created = await api.post('/api/shortcuts').send({ name: 'GitHub', url: 'https://github.com' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: 'GitHub', url: 'https://github.com/', pinned: true });

    const id = created.body.id;
    const edited = await api.put(`/api/shortcuts/${id}`).send({ name: 'My GitHub', url: 'https://github.com', pinned: false });
    expect(edited.body).toMatchObject({ name: 'My GitHub', pinned: false });

    expect((await api.delete(`/api/shortcuts/${id}`)).status).toBe(204);
    expect((await api.get('/api/shortcuts')).body).toEqual([]);
  });

  it('rejects invalid and duplicate shortcut URLs', async () => {
    expect((await api.post('/api/shortcuts').send({ name: 'Bad', url: 'notion' })).status).toBe(400);
    await api.post('/api/shortcuts').send({ name: 'YouTube', url: 'https://www.youtube.com' });
    expect((await api.post('/api/shortcuts').send({ name: 'YT', url: 'https://youtube.com/' })).status).toBe(409);
  });

  it('allows at most 8 pinned shortcuts', async () => {
    for (let i = 1; i <= 8; i++) {
      const res = await api.post('/api/shortcuts').send({ name: `Site ${i}`, url: `https://site${i}.com` });
      expect(res.status).toBe(201);
    }
    const ninth = await api.post('/api/shortcuts').send({ name: 'Site 9', url: 'https://site9.com' });
    expect(ninth.status).toBe(409);

    // An unpinned shortcut is still allowed.
    const unpinned = await api.post('/api/shortcuts').send({ name: 'Site 9', url: 'https://site9.com', pinned: false });
    expect(unpinned.status).toBe(201);
  });
});

describe('database rules', () => {
  it('enforces foreign keys even if the API checks are bypassed', () => {
    expect(() =>
      db.prepare("INSERT INTO bookmarks (collection_id, title, url, url_key) VALUES (999, 'x', 'https://x.com', 'x.com')").run(),
    ).toThrow(/FOREIGN KEY/);
  });

  it('records the schema version so migrations run only once', () => {
    expect(db.pragma('user_version', { simple: true })).toBe(1);
  });

  it('rejects a broken JSON body with a friendly 400', async () => {
    const res = await api.post('/api/collections').set('Content-Type', 'application/json').send('{"name":');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not valid JSON/);
  });
});
