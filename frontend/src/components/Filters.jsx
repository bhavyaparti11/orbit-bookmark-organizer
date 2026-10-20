import { Icon } from './Icon.jsx';

export function SearchBar({ value, onChange, placeholder, large = false }) {
  return (
    <div className={large ? 'search search-large' : 'search'}>
      <Icon name="search" size={large ? 20 : 17} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}

// Drop-down filters. When `collection` is given (inside a collection page)
// the collection and subgroup are chosen elsewhere, so only the tag is shown.
export function FilterBar({ collections, tags, filters, collection, onChange, onClear, isFiltering }) {
  const chosenCollection = collections.find((c) => String(c.id) === String(filters.collectionId));
  const subgroups = chosenCollection?.subgroups ?? [];

  return (
    <div className="filter-bar">
      {!collection && (
        <>
          <label className="filter">
            <span className="visually-hidden">Collection</span>
            <select
              value={filters.collectionId}
              onChange={(e) => onChange({ collectionId: e.target.value, subgroupId: '' })}
            >
              <option value="">All collections</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter">
            <span className="visually-hidden">Subgroup</span>
            <select
              value={filters.subgroupId}
              onChange={(e) => onChange({ subgroupId: e.target.value })}
              disabled={!chosenCollection}
              title={chosenCollection ? undefined : 'Choose a collection first'}
            >
              <option value="">All subgroups</option>
              {subgroups.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              {chosenCollection && <option value="none">Unsorted</option>}
            </select>
          </label>
        </>
      )}
      <label className="filter">
        <span className="visually-hidden">Tag</span>
        <select value={filters.tag} onChange={(e) => onChange({ tag: e.target.value })} disabled={!tags.length && !filters.tag}>
          <option value="">{tags.length ? 'All tags' : 'No tags yet'}</option>
          {tags.map((tag) => (
            <option key={tag.name} value={tag.name}>
              {tag.name} ({tag.count})
            </option>
          ))}
        </select>
      </label>
      {isFiltering && (
        <button type="button" className="text-button clear-button" onClick={onClear}>
          <Icon name="close" size={14} /> Clear filters
        </button>
      )}
    </div>
  );
}
