// Opens the SQLite database and makes sure every table exists.
//
// Schema changes are kept in the MIGRATIONS list below. SQLite has a built-in
// number called `user_version` that we use to remember how many migrations
// have already run, so each one runs exactly once — even after restarts.
// To change the schema later, ADD a new string to the end of the list
// (never edit an old one, because existing databases have already run it).

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const MIGRATIONS = [
  // Migration 1: the initial schema.
  `
  CREATE TABLE collections (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    description TEXT    NOT NULL DEFAULT '',
    cover       TEXT    NOT NULL DEFAULT 'saturn',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- A subgroup belongs to exactly one collection.
  -- Deleting the collection deletes its subgroups (ON DELETE CASCADE).
  CREATE TABLE subgroups (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    name          TEXT    NOT NULL COLLATE NOCASE,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (collection_id, name)
  );

  -- Deleting a collection deletes its bookmarks.
  -- Deleting a subgroup keeps its bookmarks, they just become "unsorted"
  -- inside the collection (ON DELETE SET NULL).
  -- url_key is the normalised URL, used to stop the same link being saved twice.
  CREATE TABLE bookmarks (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    subgroup_id   INTEGER REFERENCES subgroups(id) ON DELETE SET NULL,
    title         TEXT    NOT NULL,
    url           TEXT    NOT NULL,
    url_key       TEXT    NOT NULL UNIQUE,
    description   TEXT    NOT NULL DEFAULT '',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_bookmarks_collection ON bookmarks (collection_id);
  CREATE INDEX idx_bookmarks_subgroup   ON bookmarks (subgroup_id);

  -- Tags are shared by all collections. bookmark_tags is the "join table"
  -- for the many-to-many relationship: one bookmark has many tags and one
  -- tag is used by many bookmarks.
  CREATE TABLE tags (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE COLLATE NOCASE
  );

  CREATE TABLE bookmark_tags (
    bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
    tag_id      INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (bookmark_id, tag_id)
  );
  CREATE INDEX idx_bookmark_tags_tag ON bookmark_tags (tag_id);

  -- Quick-access websites. Independent of collections and bookmarks.
  CREATE TABLE shortcuts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    url        TEXT    NOT NULL,
    url_key    TEXT    NOT NULL UNIQUE,
    pinned     INTEGER NOT NULL DEFAULT 1 CHECK (pinned IN (0, 1)),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  `,
];

export function openDatabase(filename) {
  // ':memory:' is a temporary database that lives only in RAM (used by tests).
  if (filename !== ':memory:') {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }

  const db = new Database(filename);
  // SQLite only enforces foreign keys when this is switched on (per connection).
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db) {
  const applied = db.pragma('user_version', { simple: true });

  for (let version = applied; version < MIGRATIONS.length; version++) {
    // A transaction means a migration either fully succeeds or changes nothing.
    db.transaction(() => {
      db.exec(MIGRATIONS[version]);
      db.pragma(`user_version = ${version + 1}`);
    })();
  }
}
