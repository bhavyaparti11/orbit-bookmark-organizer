import { useState } from 'react';
import { COVERS, DEFAULT_COVER } from '../art/covers.js';
import { FormError, Modal, useSubmit } from './Modal.jsx';
import { CoverArt } from './PixelArt.jsx';

export function CollectionForm({ collection, initialName = '', onSubmit, onClose }) {
  const [name, setName] = useState(collection?.name ?? initialName);
  const [description, setDescription] = useState(collection?.description ?? '');
  const [cover, setCover] = useState(collection?.cover ?? DEFAULT_COVER);
  const { error, setError, saving, submit } = useSubmit(onSubmit);

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return setError('Please give your collection a name.');
    submit({ name: name.trim(), description: description.trim(), cover });
  }

  return (
    <Modal title={collection ? 'Edit collection' : 'New collection'} onClose={onClose} wide>
      <form onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field-label">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Computer Networks"
            maxLength={60}
            autoFocus
            required
          />
        </label>

        <label className="field">
          <span className="field-label">
            Description <span className="optional">optional</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will you keep here?"
            maxLength={280}
            rows={2}
          />
        </label>

        <fieldset className="field cover-picker">
          <legend className="field-label">Cover</legend>
          <div className="cover-options">
            {COVERS.map((option) => (
              <label key={option.key} className="cover-option">
                <input
                  type="radio"
                  name="cover"
                  value={option.key}
                  checked={cover === option.key}
                  onChange={() => setCover(option.key)}
                />
                <CoverArt cover={option.key} className="cover-option-art" />
                <span className="cover-option-label">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <FormError message={error} />
        <div className="form-actions">
          <button type="button" className="button button-quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Saving…' : collection ? 'Save changes' : 'Create collection'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
