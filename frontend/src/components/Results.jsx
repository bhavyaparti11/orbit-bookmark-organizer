import { plural } from '../lib/text.js';
import { BookmarkList } from './BookmarkList.jsx';
import { PixelSprite } from './PixelArt.jsx';

export function EmptyResults({ title, text, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <PixelSprite name="planet" scale={4} />
      <h3>{title}</h3>
      <p>{text}</p>
      {actionLabel && (
        <button type="button" className="button button-quiet" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// Search results on the dashboard (shown while a search or filter is active).
export function Results({ bookmarks, filters, onClearFilters, bookmarkActions }) {
  if (bookmarks === null) return <p className="loading">Searching…</p>;

  return (
    <section className="section" aria-labelledby="results-title" aria-live="polite">
      <div className="section-header">
        <h2 id="results-title">
          {plural(bookmarks.length, 'link')} found
          {filters.q.trim() && <span className="results-query"> for “{filters.q.trim()}”</span>}
        </h2>
      </div>
      {bookmarks.length > 0 ? (
        <BookmarkList bookmarks={bookmarks} showLocation {...bookmarkActions} />
      ) : (
        <EmptyResults
          title="Nothing in orbit matches"
          text="Try a different word, or loosen the filters."
          actionLabel="Clear filters"
          onAction={onClearFilters}
        />
      )}
    </section>
  );
}
