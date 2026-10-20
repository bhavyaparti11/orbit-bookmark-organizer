// The top-level component. It owns the application state (collections,
// bookmarks, filters, which dialog is open, ...), talks to the API and passes
// data and callbacks down to the smaller components as props.

import { useEffect, useState } from 'react';
import { BookmarkForm } from './components/BookmarkForm.jsx';
import { CollectionForm } from './components/CollectionForm.jsx';
import { CollectionPage } from './components/CollectionPage.jsx';
import { Dashboard, Welcome } from './components/Dashboard.jsx';
import { FilterBar, SearchBar } from './components/Filters.jsx';
import { ConfirmDialog, NameForm } from './components/Modal.jsx';
import { PixelSprite } from './components/PixelArt.jsx';
import { Results } from './components/Results.jsx';
import { ShortcutForm, ShortcutManager } from './components/Shortcuts.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { api } from './lib/api.js';

const NO_FILTERS = { q: '', collectionId: '', subgroupId: '', tag: '' };

export default function App() {
  // Data loaded from the backend
  const [collections, setCollections] = useState([]);
  const [tags, setTags] = useState([]);
  const [shortcuts, setShortcuts] = useState([]);
  const [bookmarks, setBookmarks] = useState(null); // null = still loading
  const [loadState, setLoadState] = useState({ status: 'loading', error: '' });
  // Increasing this number tells the effects below to load everything again.
  const [dataVersion, setDataVersion] = useState(0);

  // What the user is looking at
  const [openCollectionId, setOpenCollectionId] = useState(null); // null = dashboard
  const [filters, setFilters] = useState(NO_FILTERS);
  const [dialog, setDialog] = useState(null); // e.g. { type: 'bookmark', bookmark }
  const [toast, setToast] = useState('');

  const openCollection = collections.find((c) => c.id === openCollectionId) ?? null;
  const isFiltering = Boolean(filters.q.trim() || filters.collectionId || filters.subgroupId || filters.tag);
  const showBookmarks = openCollectionId !== null || isFiltering;
  const bookmarkQuery = { ...filters, q: filters.q.trim(), collectionId: openCollectionId ?? filters.collectionId };
  const bookmarkQueryKey = JSON.stringify(bookmarkQuery);

  // Load collections, tags and shortcuts on start-up and after every change.
  useEffect(() => {
    Promise.all([api.listCollections(), api.listTags(), api.listShortcuts()])
      .then(([collectionList, tagList, shortcutList]) => {
        setCollections(collectionList);
        setTags(tagList);
        setShortcuts(shortcutList);
        setLoadState({ status: 'ready', error: '' });
      })
      .catch((error) => setLoadState({ status: 'error', error: error.message }));
  }, [dataVersion]);

  // Load bookmarks whenever the search, filters or open collection change.
  // The short delay means we don't call the API on every single keystroke.
  useEffect(() => {
    if (!showBookmarks) {
      setBookmarks(null);
      return;
    }
    let ignore = false; // ignore answers to searches that are already outdated
    const timer = setTimeout(() => {
      api
        .listBookmarks(JSON.parse(bookmarkQueryKey))
        .then((list) => !ignore && setBookmarks(list))
        .catch((error) => !ignore && notify(error.message));
    }, 200);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [bookmarkQueryKey, showBookmarks, dataVersion]);

  // If the open collection was deleted, go back to the dashboard.
  useEffect(() => {
    if (loadState.status === 'ready' && openCollectionId !== null && !openCollection) goHome();
  }, [loadState.status, openCollectionId, openCollection]);

  // Hide the toast message after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  // ---- small helpers -------------------------------------------------------

  const reload = () => setDataVersion((v) => v + 1);
  const notify = (message) => setToast(message);
  const closeDialog = () => setDialog(null);
  const updateFilters = (changes) => setFilters((current) => ({ ...current, ...changes }));
  const clearFilters = () => setFilters(NO_FILTERS);

  function goHome() {
    setOpenCollectionId(null);
    setFilters(NO_FILTERS);
    setBookmarks(null);
  }

  function showCollection(id) {
    setOpenCollectionId(id);
    setFilters(NO_FILTERS);
    setBookmarks(null);
    window.scrollTo({ top: 0 });
  }

  // Tags are shared by all collections, so a tag click from the sidebar
  // searches everywhere; inside a collection it narrows that collection.
  function filterByTag(tag, everywhere = false) {
    if (everywhere && openCollectionId !== null) {
      setOpenCollectionId(null);
      setBookmarks(null);
      setFilters({ ...NO_FILTERS, tag });
    } else {
      updateFilters({ tag: filters.tag === tag ? '' : tag });
    }
  }

  // Runs an API call, then closes the dialog, reloads data and shows a message.
  // If the call fails, the error is thrown back to the form, which shows it.
  async function save(apiCall, message, nextDialog = null) {
    const result = await apiCall();
    setDialog(nextDialog);
    reload();
    notify(message);
    return result;
  }

  function confirmDelete({ title, message, action, success, returnTo = null }) {
    setDialog({ type: 'confirm', title, message, returnTo, onConfirm: () => save(action, success, returnTo) });
  }

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      notify('Link copied to your clipboard.');
    } catch {
      // Older or stricter browsers: copy from a hidden text box instead.
      const box = document.createElement('textarea');
      box.value = url;
      box.style.position = 'fixed';
      box.style.opacity = '0';
      document.body.append(box);
      box.select();
      const copied = document.execCommand('copy');
      box.remove();
      notify(copied ? 'Link copied to your clipboard.' : 'Your browser did not allow copying. Open the link and copy it from there.');
    }
  }

  // ---- actions passed to components ---------------------------------------

  const bookmarkActions = {
    onCopy: copyLink,
    onTag: (tag) => filterByTag(tag),
    onEdit: (bookmark) => setDialog({ type: 'bookmark', bookmark }),
    onDelete: (bookmark) =>
      confirmDelete({
        title: 'Delete this link?',
        message: `“${bookmark.title}” will be removed from Orbit. This cannot be undone.`,
        action: () => api.deleteBookmark(bookmark.id),
        success: 'Link deleted.',
      }),
  };

  function openBookmarkForm() {
    const collectionId = openCollectionId ?? (Number(filters.collectionId) || null);
    const subgroupId = Number(filters.subgroupId) || null;
    setDialog({ type: 'bookmark', defaults: { collectionId, subgroupId } });
  }

  // ---- rendering ----------------------------------------------------------

  if (loadState.status === 'loading') {
    return (
      <div className="splash">
        <PixelSprite name="saturn" scale={4} />
        <p>Loading your orbit…</p>
      </div>
    );
  }

  if (loadState.status === 'error') {
    return (
      <div className="splash">
        <PixelSprite name="saturn" scale={4} />
        <h1>Orbit could not load</h1>
        <p>{loadState.error}</p>
        <button type="button" className="button button-primary" onClick={reload}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Sidebar
        collections={collections}
        tags={tags}
        openCollectionId={openCollectionId}
        activeTag={filters.tag}
        onHome={goHome}
        onOpenCollection={showCollection}
        onNewCollection={() => setDialog({ type: 'collection' })}
        onTag={(tag) => filterByTag(tag, true)}
      />

      <main id="main" className="main">
        {openCollection ? (
          <CollectionPage
            collection={openCollection}
            bookmarks={bookmarks}
            tags={tags}
            filters={filters}
            isFiltering={isFiltering}
            onFilterChange={updateFilters}
            onClearFilters={clearFilters}
            onBack={goHome}
            onEditCollection={() => setDialog({ type: 'collection', collection: openCollection })}
            onDeleteCollection={() =>
              confirmDelete({
                title: `Delete “${openCollection.name}”?`,
                message: `This also deletes its ${openCollection.subgroups.length} subgroup(s) and ${openCollection.bookmarkCount} saved link(s). This cannot be undone.`,
                action: () => api.deleteCollection(openCollection.id),
                success: 'Collection deleted.',
              })
            }
            onAddBookmark={openBookmarkForm}
            onAddSubgroup={() => setDialog({ type: 'subgroup', collectionId: openCollection.id })}
            onRenameSubgroup={(subgroup) => setDialog({ type: 'subgroup', subgroup })}
            onDeleteSubgroup={(subgroup) =>
              confirmDelete({
                title: `Delete the subgroup “${subgroup.name}”?`,
                message: 'Its links are not deleted — they stay in this collection as “Unsorted”.',
                action: async () => {
                  await api.deleteSubgroup(subgroup.id);
                  updateFilters({ subgroupId: '' });
                },
                success: 'Subgroup deleted.',
              })
            }
            bookmarkActions={bookmarkActions}
          />
        ) : (
          <>
            <Welcome hasCollections={collections.length > 0} onAddBookmark={openBookmarkForm} />
            <SearchBar
              large
              value={filters.q}
              onChange={(q) => updateFilters({ q })}
              placeholder="Search all your links by title, address or note"
            />
            {collections.length > 0 && (
              <FilterBar
                collections={collections}
                tags={tags}
                filters={filters}
                isFiltering={isFiltering}
                onChange={updateFilters}
                onClear={clearFilters}
              />
            )}
            {isFiltering ? (
              <Results bookmarks={bookmarks} filters={filters} onClearFilters={clearFilters} bookmarkActions={bookmarkActions} />
            ) : (
              <Dashboard
                collections={collections}
                shortcuts={shortcuts}
                onOpenCollection={showCollection}
                onNewCollection={(name) => setDialog({ type: 'collection', initialName: name })}
                onAddShortcut={() => setDialog({ type: 'shortcut' })}
                onManageShortcuts={() => setDialog({ type: 'shortcuts' })}
              />
            )}
          </>
        )}
      </main>

      {renderDialog()}

      <div className="toast-region" role="status" aria-live="polite">
        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );

  function renderDialog() {
    if (!dialog) return null;
    const pinnedCount = shortcuts.filter((s) => s.pinned).length;

    switch (dialog.type) {
      case 'collection': {
        const existing = dialog.collection;
        return (
          <CollectionForm
            collection={existing}
            initialName={dialog.initialName}
            onClose={closeDialog}
            onSubmit={async (values) => {
              if (existing) {
                await save(() => api.updateCollection(existing.id, values), 'Collection updated.');
              } else {
                const created = await save(() => api.createCollection(values), 'Collection created.');
                // Add it straight away so the page can open before the reload finishes.
                setCollections((list) => [...list, created]);
                showCollection(created.id);
              }
            }}
          />
        );
      }

      case 'subgroup': {
        const existing = dialog.subgroup;
        return (
          <NameForm
            title={existing ? 'Rename subgroup' : 'New subgroup'}
            label="Subgroup name"
            initialName={existing?.name}
            submitLabel={existing ? 'Rename' : 'Create subgroup'}
            onClose={closeDialog}
            onSubmit={(name) =>
              existing
                ? save(() => api.renameSubgroup(existing.id, name), 'Subgroup renamed.')
                : save(() => api.createSubgroup(dialog.collectionId, name), 'Subgroup created.')
            }
          />
        );
      }

      case 'bookmark': {
        const existing = dialog.bookmark;
        return (
          <BookmarkForm
            bookmark={existing}
            defaults={dialog.defaults}
            collections={collections}
            tags={tags}
            onClose={closeDialog}
            onSubmit={(values) =>
              existing
                ? save(() => api.updateBookmark(existing.id, values), 'Link updated.')
                : save(() => api.createBookmark(values), 'Link saved.')
            }
          />
        );
      }

      case 'shortcuts':
        return (
          <ShortcutManager
            shortcuts={shortcuts}
            onClose={closeDialog}
            onAdd={() => setDialog({ type: 'shortcut', returnTo: { type: 'shortcuts' } })}
            onEdit={(shortcut) => setDialog({ type: 'shortcut', shortcut, returnTo: { type: 'shortcuts' } })}
            onTogglePin={(shortcut) =>
              save(
                () => api.updateShortcut(shortcut.id, { ...shortcut, pinned: !shortcut.pinned }),
                shortcut.pinned ? `${shortcut.name} unpinned.` : `${shortcut.name} pinned.`,
                dialog,
              ).catch((error) => notify(error.message))
            }
            onDelete={(shortcut) =>
              confirmDelete({
                title: `Remove the “${shortcut.name}” shortcut?`,
                message: 'Only the shortcut is removed — nothing happens to the website itself.',
                action: () => api.deleteShortcut(shortcut.id),
                success: 'Shortcut removed.',
                returnTo: { type: 'shortcuts' },
              })
            }
          />
        );

      case 'shortcut': {
        const existing = dialog.shortcut;
        const returnTo = dialog.returnTo ?? null;
        return (
          <ShortcutForm
            shortcut={existing}
            pinnedCount={pinnedCount}
            onClose={() => setDialog(returnTo)}
            onSubmit={(values) =>
              existing
                ? save(() => api.updateShortcut(existing.id, values), 'Shortcut updated.', returnTo)
                : save(() => api.createShortcut(values), 'Shortcut added.', returnTo)
            }
          />
        );
      }

      case 'confirm':
        return (
          <ConfirmDialog
            title={dialog.title}
            message={dialog.message}
            onConfirm={dialog.onConfirm}
            onClose={() => setDialog(dialog.returnTo)}
          />
        );

      default:
        return null;
    }
  }
}
