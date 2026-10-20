import { siteName } from '../lib/text.js';
import { Icon } from './Icon.jsx';
import { SiteBadge } from './Shortcuts.jsx';

// A list of bookmark cards. showLocation adds "Collection › Subgroup" to each
// card, which is useful in search results that mix several collections.
export function BookmarkList({ bookmarks, showLocation, onEdit, onDelete, onCopy, onTag }) {
  return (
    <ul className="bookmark-list">
      {bookmarks.map((bookmark) => (
        <li key={bookmark.id} className="bookmark">
          <SiteBadge url={bookmark.url} />
          <div className="bookmark-body">
            <a className="bookmark-title" href={bookmark.url} target="_blank" rel="noopener noreferrer">
              {bookmark.title}
              <Icon name="external" size={14} />
              <span className="visually-hidden">(opens in a new tab)</span>
            </a>
            <p className="bookmark-meta">
              <span>{siteName(bookmark.url)}</span>
              {showLocation && (
                <span>
                  {bookmark.collectionName}
                  {bookmark.subgroupName && ` › ${bookmark.subgroupName}`}
                </span>
              )}
              {!showLocation && bookmark.subgroupName && <span>{bookmark.subgroupName}</span>}
            </p>
            {bookmark.description && <p className="bookmark-description">{bookmark.description}</p>}
            {bookmark.tags.length > 0 && (
              <div className="tag-list">
                {bookmark.tags.map((tag) => (
                  <button key={tag} type="button" className="tag" onClick={() => onTag(tag)} title={`Show links tagged ${tag}`}>
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="bookmark-actions">
            <button type="button" className="icon-button" onClick={() => onCopy(bookmark.url)} aria-label={`Copy link to ${bookmark.title}`}>
              <Icon name="copy" />
            </button>
            <button type="button" className="icon-button" onClick={() => onEdit(bookmark)} aria-label={`Edit ${bookmark.title}`}>
              <Icon name="edit" />
            </button>
            <button type="button" className="icon-button" onClick={() => onDelete(bookmark)} aria-label={`Delete ${bookmark.title}`}>
              <Icon name="trash" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
