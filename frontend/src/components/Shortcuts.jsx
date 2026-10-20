import { useState } from 'react';
import { isValidHttpUrl, siteName } from '../lib/text.js';
import { Icon } from './Icon.jsx';
import { FormError, Modal, useSubmit } from './Modal.jsx';

export const MAX_PINNED = 8;

// A small square with the first letter of the site, used instead of
// downloading favicons from the internet.
export function SiteBadge({ url, label }) {
  const letter = (label || siteName(url)).trim().charAt(0).toUpperCase() || '·';
  const tone = [...siteName(url)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4;
  return (
    <span className={`site-badge tone-${tone}`} aria-hidden="true">
      {letter}
    </span>
  );
}

// The "Quick access" row on the dashboard.
export function QuickAccess({ shortcuts, onAdd, onManage }) {
  const pinned = shortcuts.filter((s) => s.pinned);

  return (
    <section className="section" aria-labelledby="quick-access-title">
      <div className="section-header">
        <h2 id="quick-access-title">Quick access</h2>
        {shortcuts.length > 0 && (
          <button type="button" className="text-button" onClick={onManage}>
            Manage
          </button>
        )}
      </div>

      <div className="shortcut-row">
        {pinned.map((shortcut) => (
          <a key={shortcut.id} className="shortcut" href={shortcut.url} target="_blank" rel="noopener noreferrer">
            <SiteBadge url={shortcut.url} label={shortcut.name} />
            <span className="shortcut-name">{shortcut.name}</span>
            <span className="visually-hidden">(opens in a new tab)</span>
          </a>
        ))}
        {pinned.length < MAX_PINNED && (
          <button type="button" className="shortcut shortcut-add" onClick={onAdd}>
            <span className="site-badge site-badge-add" aria-hidden="true">
              <Icon name="plus" size={16} />
            </span>
            <span className="shortcut-name">{pinned.length ? 'Add' : 'Pin a website'}</span>
          </button>
        )}
      </div>
      {pinned.length === 0 && (
        <p className="hint">Keep the sites you open every day — YouTube, GitHub, Notion — one click away.</p>
      )}
    </section>
  );
}

export function ShortcutForm({ shortcut, pinnedCount, onSubmit, onClose }) {
  const [name, setName] = useState(shortcut?.name ?? '');
  const [url, setUrl] = useState(shortcut?.url ?? '');
  // New shortcuts are pinned unless the row is already full.
  const [pinned, setPinned] = useState(shortcut ? shortcut.pinned : pinnedCount < MAX_PINNED);
  const { error, setError, saving, submit } = useSubmit(onSubmit);

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return setError('Please add a short name.');
    if (!isValidHttpUrl(url)) return setError('Please enter a full link starting with http:// or https://');
    submit({ name: name.trim(), url: url.trim(), pinned });
  }

  return (
    <Modal title={shortcut ? 'Edit shortcut' : 'Add a shortcut'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field-label">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. GitHub" maxLength={24} autoFocus required />
        </label>
        <label className="field">
          <span className="field-label">Link</span>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com" required />
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          Pin to the dashboard
        </label>
        <FormError message={error} />
        <div className="form-actions">
          <button type="button" className="button button-quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Saving…' : shortcut ? 'Save changes' : 'Add shortcut'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Lists every shortcut (pinned or not) with pin, edit and delete actions.
export function ShortcutManager({ shortcuts, onAdd, onEdit, onTogglePin, onDelete, onClose }) {
  const pinnedCount = shortcuts.filter((s) => s.pinned).length;

  return (
    <Modal title="Quick-access shortcuts" onClose={onClose}>
      <p className="hint">
        {pinnedCount} of {MAX_PINNED} pinned. Unpinned shortcuts are kept here but hidden from the dashboard.
      </p>
      <ul className="manage-list">
        {shortcuts.map((shortcut) => (
          <li key={shortcut.id} className="manage-item">
            <SiteBadge url={shortcut.url} label={shortcut.name} />
            <div className="manage-text">
              <span className="manage-name">{shortcut.name}</span>
              <span className="manage-url">{siteName(shortcut.url)}</span>
            </div>
            <button
              type="button"
              className={shortcut.pinned ? 'pin-toggle is-pinned' : 'pin-toggle'}
              aria-pressed={shortcut.pinned}
              onClick={() => onTogglePin(shortcut)}
            >
              <Icon name="pin" size={15} />
              {shortcut.pinned ? 'Pinned' : 'Pin'}
            </button>
            <button type="button" className="icon-button" onClick={() => onEdit(shortcut)} aria-label={`Edit ${shortcut.name}`}>
              <Icon name="edit" />
            </button>
            <button type="button" className="icon-button" onClick={() => onDelete(shortcut)} aria-label={`Delete ${shortcut.name}`}>
              <Icon name="trash" />
            </button>
          </li>
        ))}
      </ul>
      <div className="form-actions">
        <button type="button" className="button button-quiet" onClick={onClose}>
          Done
        </button>
        <button type="button" className="button button-primary" onClick={onAdd}>
          <Icon name="plus" size={16} /> Add shortcut
        </button>
      </div>
    </Modal>
  );
}
