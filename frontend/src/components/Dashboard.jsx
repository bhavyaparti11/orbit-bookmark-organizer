import { greeting, plural } from '../lib/text.js';
import { Icon } from './Icon.jsx';
import { CoverArt, PixelSprite } from './PixelArt.jsx';
import { QuickAccess } from './Shortcuts.jsx';

const SUGGESTIONS = ['Streaming', 'Recipes', 'Travel', 'Reading List', 'Shopping', 'Learning'];

export function Welcome({ hasCollections, onAddBookmark }) {
  return (
    <header className="welcome">
      <div>
        <h1>{greeting()}.</h1>
        <p className="welcome-text">A quiet place for the links worth keeping.</p>
      </div>
      {hasCollections && (
        <button type="button" className="button button-primary" onClick={onAddBookmark}>
          <Icon name="plus" size={16} /> Save a link
        </button>
      )}
      <div className="corner-sky" aria-hidden="true">
        <PixelSprite name="twinkle" scale={3} className="corner-1" />
        <PixelSprite name="planet" scale={3} className="corner-2" />
        <PixelSprite name="star" scale={2} className="corner-3" />
      </div>
    </header>
  );
}

export function Dashboard({ collections, shortcuts, onOpenCollection, onNewCollection, onAddShortcut, onManageShortcuts }) {
  return (
    <>
      <QuickAccess shortcuts={shortcuts} onAdd={onAddShortcut} onManage={onManageShortcuts} />

      <section className="section" aria-labelledby="collections-title">
        <div className="section-header">
          <h2 id="collections-title">Collections</h2>
          {collections.length > 0 && (
            <button type="button" className="text-button" onClick={() => onNewCollection()}>
              <Icon name="plus" size={15} /> New collection
            </button>
          )}
        </div>

        {collections.length === 0 ? (
          <div className="empty-state empty-state-first">
            <PixelSprite name="saturn" scale={5} />
            <h3>Your orbit is empty — for now.</h3>
            <p>
              Start with a collection: a home for one topic, like shows to stream or recipes to try. Then save
              links into it.
            </p>
            <button type="button" className="button button-primary" onClick={() => onNewCollection()}>
              <Icon name="plus" size={16} /> Create your first collection
            </button>
            <div className="suggestions">
              <span>Or start with:</span>
              {SUGGESTIONS.map((name) => (
                <button key={name} type="button" className="tag" onClick={() => onNewCollection(name)}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="collection-grid">
            {collections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                className="collection-card"
                onClick={() => onOpenCollection(collection.id)}
              >
                <CoverArt cover={collection.cover} className="collection-cover" />
                <span className="collection-card-body">
                  <span className="collection-name">{collection.name}</span>
                  {collection.description && <span className="collection-description">{collection.description}</span>}
                  <span className="collection-meta">
                    {plural(collection.bookmarkCount, 'link')}
                    {collection.subgroups.length > 0 && ` · ${plural(collection.subgroups.length, 'subgroup')}`}
                  </span>
                </span>
              </button>
            ))}
            <button type="button" className="collection-card collection-card-new" onClick={() => onNewCollection()}>
              <Icon name="plus" size={22} />
              <span>New collection</span>
            </button>
          </div>
        )}
      </section>
    </>
  );
}
