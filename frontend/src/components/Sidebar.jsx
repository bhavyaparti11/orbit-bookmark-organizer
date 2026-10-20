import { Icon } from './Icon.jsx';
import { CoverArt, PixelSprite } from './PixelArt.jsx';

export function Sidebar({ collections, tags, openCollectionId, activeTag, onHome, onOpenCollection, onNewCollection, onTag }) {
  return (
    <aside className="sidebar">
      <button type="button" className="brand" onClick={onHome} aria-label="Orbit — go to the dashboard">
        <PixelSprite name="saturn" scale={2} />
        <span className="brand-name">Orbit</span>
      </button>

      <nav className="sidebar-nav" aria-label="Collections">
        <button
          type="button"
          className={openCollectionId === null ? 'nav-item is-active' : 'nav-item'}
          aria-current={openCollectionId === null ? 'page' : undefined}
          onClick={onHome}
        >
          <Icon name="home" size={17} />
          <span className="nav-label">Home</span>
        </button>

        <div className="sidebar-heading">
          <span>Collections</span>
          <button type="button" className="icon-button icon-button-small" onClick={onNewCollection} aria-label="New collection">
            <Icon name="plus" size={15} />
          </button>
        </div>

        {collections.map((collection) => (
          <button
            key={collection.id}
            type="button"
            className={collection.id === openCollectionId ? 'nav-item is-active' : 'nav-item'}
            aria-current={collection.id === openCollectionId ? 'page' : undefined}
            onClick={() => onOpenCollection(collection.id)}
          >
            <CoverArt cover={collection.cover} className="nav-cover" />
            <span className="nav-label">{collection.name}</span>
            <span className="nav-count">{collection.bookmarkCount}</span>
          </button>
        ))}
        {collections.length === 0 && <p className="sidebar-empty">No collections yet.</p>}
      </nav>

      {tags.length > 0 && (
        <div className="sidebar-tags">
          <div className="sidebar-heading">
            <span>Tags</span>
          </div>
          <div className="tag-list">
            {tags.map((tag) => (
              <button
                key={tag.name}
                type="button"
                className={activeTag === tag.name ? 'tag is-active' : 'tag'}
                aria-pressed={activeTag === tag.name}
                onClick={() => onTag(tag.name)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sidebar-sky" aria-hidden="true">
        <PixelSprite name="twinkle" scale={2} className="sky-1" />
        <PixelSprite name="planet" scale={2} className="sky-2" />
        <PixelSprite name="star" scale={2} className="sky-3" />
        <span className="sky-caption">a quiet little library</span>
      </div>
    </aside>
  );
}
