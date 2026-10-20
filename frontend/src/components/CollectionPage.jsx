import { plural } from '../lib/text.js';
import { BookmarkList } from './BookmarkList.jsx';
import { FilterBar, SearchBar } from './Filters.jsx';
import { Icon } from './Icon.jsx';
import { CoverArt } from './PixelArt.jsx';
import { EmptyResults } from './Results.jsx';

export function CollectionPage({
  collection,
  bookmarks,
  tags,
  filters,
  isFiltering,
  onFilterChange,
  onClearFilters,
  onBack,
  onEditCollection,
  onDeleteCollection,
  onAddBookmark,
  onAddSubgroup,
  onRenameSubgroup,
  onDeleteSubgroup,
  bookmarkActions,
}) {
  const { subgroups } = collection;
  const selectedSubgroup = subgroups.find((s) => String(s.id) === filters.subgroupId);

  return (
    <>
      <button type="button" className="text-button back-button" onClick={onBack}>
        <Icon name="back" size={16} /> All collections
      </button>

      <header className="collection-header">
        <CoverArt cover={collection.cover} className="collection-banner" wide />
        <div className="collection-heading">
          <div>
            <h1>{collection.name}</h1>
            {collection.description && <p className="collection-header-description">{collection.description}</p>}
            <p className="collection-meta">
              {plural(collection.bookmarkCount, 'link')} · {plural(subgroups.length, 'subgroup')}
            </p>
          </div>
          <div className="collection-actions">
            <button type="button" className="button button-quiet" onClick={onEditCollection}>
              <Icon name="edit" size={16} /> Edit
            </button>
            <button type="button" className="button button-quiet button-quiet-danger" onClick={onDeleteCollection}>
              <Icon name="trash" size={16} /> Delete
            </button>
            <button type="button" className="button button-primary" onClick={onAddBookmark}>
              <Icon name="plus" size={16} /> Save a link
            </button>
          </div>
        </div>
      </header>

      <div className="subgroup-bar" role="group" aria-label="Subgroups">
        <button
          type="button"
          className={!filters.subgroupId ? 'chip is-active' : 'chip'}
          aria-pressed={!filters.subgroupId}
          onClick={() => onFilterChange({ subgroupId: '' })}
        >
          All
        </button>
        {subgroups.map((subgroup) => (
          <button
            key={subgroup.id}
            type="button"
            className={String(subgroup.id) === filters.subgroupId ? 'chip is-active' : 'chip'}
            aria-pressed={String(subgroup.id) === filters.subgroupId}
            onClick={() => onFilterChange({ subgroupId: String(subgroup.id) })}
          >
            {subgroup.name}
            <span className="chip-count">{subgroup.bookmarkCount}</span>
          </button>
        ))}
        {subgroups.length > 0 && (
          <button
            type="button"
            className={filters.subgroupId === 'none' ? 'chip is-active' : 'chip'}
            aria-pressed={filters.subgroupId === 'none'}
            onClick={() => onFilterChange({ subgroupId: 'none' })}
          >
            Unsorted
          </button>
        )}
        <button type="button" className="chip chip-add" onClick={onAddSubgroup}>
          <Icon name="plus" size={14} /> Subgroup
        </button>
      </div>

      {selectedSubgroup && (
        <div className="subgroup-actions">
          <span>
            Subgroup <strong>{selectedSubgroup.name}</strong>
          </span>
          <button type="button" className="text-button" onClick={() => onRenameSubgroup(selectedSubgroup)}>
            Rename
          </button>
          <button type="button" className="text-button text-button-danger" onClick={() => onDeleteSubgroup(selectedSubgroup)}>
            Delete
          </button>
        </div>
      )}

      <div className="toolbar">
        <SearchBar
          value={filters.q}
          onChange={(q) => onFilterChange({ q })}
          placeholder={`Search in ${collection.name}`}
        />
        <FilterBar
          collection={collection}
          collections={[]}
          tags={tags}
          filters={filters}
          isFiltering={isFiltering}
          onChange={onFilterChange}
          onClear={onClearFilters}
        />
      </div>

      {bookmarks === null ? (
        <p className="loading">Loading links…</p>
      ) : bookmarks.length > 0 ? (
        <BookmarkList bookmarks={bookmarks} {...bookmarkActions} />
      ) : collection.bookmarkCount === 0 ? (
        <EmptyResults
          title="Nothing saved here yet"
          text="Save your first link to this collection — a video, an article, anything worth coming back to."
          actionLabel="Save a link"
          onAction={onAddBookmark}
        />
      ) : (
        <EmptyResults
          title="No links match"
          text="Try another word, subgroup or tag."
          actionLabel="Clear filters"
          onAction={onClearFilters}
        />
      )}
    </>
  );
}
