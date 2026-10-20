import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';

// A dialog window built on the browser's own <dialog> element, which already
// handles focus, the Escape key and screen-reader behaviour for us.
export function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog.open) dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={wide ? 'modal modal-wide' : 'modal'}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault(); // let React decide when to close
        onClose();
      }}
    >
      <div className="modal-header">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

// Shared form behaviour: remembers whether we are saving and shows the
// error message if saving fails (e.g. "This link is already saved").
export function useSubmit(onSubmit) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(values) {
    setSaving(true);
    setError('');
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return { error, setError, saving, submit };
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <p className="form-error" role="alert">
      {message}
    </p>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onClose }) {
  const { error, saving, submit } = useSubmit(onConfirm);

  return (
    <Modal title={title} onClose={onClose}>
      <p className="confirm-message">{message}</p>
      <FormError message={error} />
      <div className="form-actions">
        <button type="button" className="button button-quiet" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="button button-danger" disabled={saving} onClick={() => submit()}>
          {saving ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// A one-field form, used for creating and renaming subgroups.
export function NameForm({ title, label, initialName = '', submitLabel, onSubmit, onClose }) {
  const [name, setName] = useState(initialName);
  const { error, setError, saving, submit } = useSubmit(onSubmit);

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return setError(`${label} is required.`);
    submit(name.trim());
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field-label">{label}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus required />
        </label>
        <FormError message={error} />
        <div className="form-actions">
          <button type="button" className="button button-quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
