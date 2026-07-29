import React, { useEffect, useId, useRef, useState } from 'react';
import { useBackdropDismiss } from '../../hooks/useBackdropDismiss';
import { havenAdminClient } from './api/havenAdminClient';
import type { StylePersonality } from './types';

const DEFAULT_LABEL = 'My Modern Room';

type Phase = 'form' | 'creating' | 'ready';

export interface HavenAdminCreateStyleModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (style: StylePersonality) => void;
}

const HavenAdminCreateStyleModal: React.FC<HavenAdminCreateStyleModalProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const titleId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('form');
  const [label, setLabel] = useState(DEFAULT_LABEL);
  const [error, setError] = useState<string | null>(null);
  const [readyStyle, setReadyStyle] = useState<StylePersonality | null>(null);

  const nameReady = label.trim().length > 0;
  const canClose = phase !== 'creating';

  useEffect(() => {
    if (!open) return;
    setPhase('form');
    setLabel(DEFAULT_LABEL);
    setError(null);
    setReadyStyle(null);
  }, [open]);

  useEffect(() => {
    if (!open || !canClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, canClose, onClose]);

  const backdropDismiss = useBackdropDismiss(onClose, open && canClose);

  if (!open) return null;

  const submitFile = async (file: File | null) => {
    if (!file || !nameReady) return;
    setError(null);
    setPhase('creating');
    try {
      const { style } = await havenAdminClient.createStyleFromRoom({
        file,
        label: label.trim(),
      });
      setReadyStyle(style);
      setPhase('ready');
      onCreated(style);
    } catch (err) {
      setPhase('form');
      setError(err instanceof Error ? err.message : 'Could not create style from photo.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const readySrc = readyStyle?.baseRoomImageUrl || readyStyle?.previewImageUrl || null;

  return (
    <div
      className="hv-admin__modal-backdrop"
      role="presentation"
      onMouseDown={backdropDismiss.onMouseDown}
      onClick={backdropDismiss.onClick}
    >
      <div
        className="hv-admin__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {phase === 'form' && (
          <>
            <h2 id={titleId} className="hv-admin__modal-title">
              Create Room
            </h2>
            <p className="hv-admin__modal-copy">
              Give it a name, then add a photo of a room. We’ll turn it into a clean blank
              canvas you can style again and again.
            </p>
            <label className="hv-admin__field">
              <span className="hv-admin__label">Style name</span>
              <input
                className="hv-admin__input"
                type="text"
                value={label}
                autoFocus
                onChange={(e) => setLabel(e.target.value)}
                placeholder={DEFAULT_LABEL}
              />
            </label>
            {!nameReady && (
              <p className="hv-admin__panel-meta">Add a name to continue.</p>
            )}
            {error && (
              <p className="hv-admin__msg hv-admin__msg--error" role="alert">
                {error}
              </p>
            )}
            <div className="hv-admin__modal-actions">
              <button type="button" className="hv-admin__btn" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--primary"
                disabled={!nameReady}
                onClick={() => fileRef.current?.click()}
              >
                Add room photo
              </button>
            </div>
            <input
              ref={fileRef}
              className="hv-admin__file-input"
              type="file"
              accept="image/*"
              disabled={!nameReady}
              onChange={(e) => {
                void submitFile(e.target.files?.[0] ?? null);
              }}
            />
          </>
        )}

        {phase === 'creating' && (
          <div className="hv-admin__modal-busy" aria-live="polite">
            <h2 id={titleId} className="hv-admin__modal-title">
              Preparing your perfect room…
            </h2>
            <p className="hv-admin__modal-copy">
              Hang tight — this usually takes about a minute.
            </p>
            <div className="hv-admin__modal-spinner" aria-hidden="true" />
          </div>
        )}

        {phase === 'ready' && readyStyle && (
          <>
            <h2 id={titleId} className="hv-admin__modal-title">
              Your new style is ready
            </h2>
            <p className="hv-admin__modal-copy">
              <strong>{readyStyle.label}</strong> is ready to use in your style list.
            </p>
            {readySrc ? (
              <div className="hv-admin__modal-preview">
                <img src={readySrc} alt="" />
              </div>
            ) : null}
            <div className="hv-admin__modal-actions">
              <button
                type="button"
                className="hv-admin__btn hv-admin__btn--primary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HavenAdminCreateStyleModal;
