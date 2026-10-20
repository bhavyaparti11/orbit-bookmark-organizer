import { useId, useState } from 'react';
import { addTag, isValidHttpUrl } from '../lib/text.js';
import { Icon } from './Icon.jsx';
import { FormError, Modal, useSubmit } from './Modal.jsx';

export function BookmarkForm({ bookmark, collections, tags, defaults = {}, onSubmit, onClose }) {
  const [title, setTitle] = useState(bookmark?.title ?? '');
  const [url, setUrl] = useState(bookmark?.url ?? '');
  const [description, setDescription] = useState(bookmark?.description ?? '');
  const [collectionId, setCollectionId] = useState(
    String(bookmark?.collectionId ?? defaults.collectionId ?? collections[0]?.id ?? ''),
  );
  const [subgroupId, setSubgroupId] = useState(String(bookmark?.subgroupId ?? defaults.subgroupId ?? ''));
  const [tagList, setTagList] = useState(bookmark?.tags ?? []);
  const { error, setError, saving, submit } = useSubmit(onSubmit);

  const subgroups = collections.find((c) => String(c.id) === collectionId)?.subgroups ?? [];

  function changeCollection(value) {
    setCollectionId(value);
    setSubgroupId(''); // subgroups belong to one collection, so reset the choice
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) return setError('Please add a title.');
    if (!isValidHttpUrl(url)) return setError('Please enter a full link starting with http:// or https://');
    if (!collectionId) return setError('Please choose a collection.');
    submit({
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      collectionId: Number(collectionId),
      subgroupId: subgroupId ? Number(subgroupId) : null,
      tags: tagList,
    });
  }

  return (
    <Modal title={bookmark ? 'Edit link' : 'Save a link'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field-label">Link</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            autoFocus={!bookmark}
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A name you will recognise"
            maxLength={200}
            required
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Collection</span>
            <select value={collectionId} onChange={(e) => changeCollection(e.target.value)} required>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">
              Subgroup <span className="optional">optional</span>
            </span>
            <select value={subgroupId} onChange={(e) => setSubgroupId(e.target.value)} disabled={!subgroups.length}>
              <option value="">{subgroups.length ? 'None' : 'No subgroups yet'}</option>
              {subgroups.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span className="field-label">
            Note <span className="optional">optional</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why is this worth keeping?"
            maxLength={1000}
            rows={2}
          />
        </label>

        <TagInput tags={tagList} suggestions={tags} onChange={setTagList} />

        <FormError message={error} />
        <div className="form-actions">
          <button type="button" className="button button-quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Saving…' : bookmark ? 'Save changes' : 'Save link'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Type a tag and press Enter or comma. Existing tags are suggested.
function TagInput({ tags, suggestions, onChange }) {
  const [draft, setDraft] = useState('');
  const inputId = useId();
  const listId = useId();

  function commitDraft() {
    if (draft.trim()) onChange(addTag(tags, draft));
    setDraft('');
  }

  function handleKeyDown(event) {
    if ((event.key === 'Enter' || event.key === ',') && draft.trim()) {
      event.preventDefault();
      commitDraft();
    } else if (event.key === 'Backspace' && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="field">
      <label className="field-label" htmlFor={inputId}>
        Tags <span className="optional">optional · press Enter to add</span>
      </label>
      <div className="tag-input">
        {tags.map((tag) => (
          <span key={tag} className="tag tag-removable">
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} aria-label={`Remove tag ${tag}`}>
              <Icon name="close" size={12} />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          list={listId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={tags.length ? '' : 'e.g. beginner, revision'}
          maxLength={30}
        />
        <datalist id={listId}>
          {suggestions.map((tag) => (
            <option key={tag.name} value={tag.name} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
