import React, { useEffect, useState } from 'react';
import { Check, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { useInlineEdit } from './InlineEditProvider';

interface InlineEditBlockProps {
  blockId: string;
  canEdit?: boolean;
  onSave: () => Promise<void>;
  onCancel?: () => void;
  onRemove?: () => Promise<void>;
  /** Shown in the remove confirmation prompt */
  removeLabel?: string;
  className?: string;
  editClassName?: string;
  /** Position of pencil / save controls — use "inset" on rounded cards, "inline" beside label text */
  controlsPlacement?: 'default' | 'inset' | 'inline';
  children: React.ReactNode | ((editing: boolean) => React.ReactNode);
}

const CONTROLS_PLACEMENT = {
  default: {
    view: 'right-0 top-0.5',
    edit: 'right-0 -top-7',
    confirm: 'right-0 -top-9',
  },
  inset: {
    view: 'right-2.5 top-2.5',
    edit: 'right-2.5 -top-7',
    confirm: 'right-2.5 -top-9',
  },
  inline: {
    view: '',
    edit: 'left-0 -top-7',
    confirm: 'left-0 -top-9',
  },
} as const;

const controlsShellClass =
  'absolute z-20 flex items-center gap-px rounded-lg px-0.5 py-0.5';

const controlsShellStyle = {
  background: 'rgba(6,11,20,0.88)',
  border: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(10px) saturate(140%)',
  WebkitBackdropFilter: 'blur(10px) saturate(140%)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
} as const;

export const InlineEditBlock: React.FC<InlineEditBlockProps> = ({
  blockId,
  canEdit = false,
  onSave,
  onCancel,
  onRemove,
  removeLabel = 'this item',
  className = '',
  editClassName = '',
  controlsPlacement = 'default',
  children,
}) => {
  const placement = CONTROLS_PLACEMENT[controlsPlacement];
  const inlineControls = controlsPlacement === 'inline';
  const { startEdit, stopEdit, isEditing, activeBlockId } = useInlineEdit();
  const editing = isEditing(blockId);
  const blocked = activeBlockId !== null && !editing;
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = () => {
    onCancel?.();
    stopEdit();
    setConfirmRemove(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave();
      stopEdit();
      setConfirmRemove(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    setSaving(true);
    setError(null);
    try {
      await onRemove();
      stopEdit();
      setConfirmRemove(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!editing) setConfirmRemove(false);
  }, [editing]);

  useEffect(() => {
    if (!editing) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (confirmRemove) {
          setConfirmRemove(false);
          return;
        }
        handleCancel();
      }
      if (
        event.key === 'Enter' &&
        !confirmRemove &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        void handleSave();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [editing, confirmRemove, onCancel]);

  const handleStart = () => {
    if (!canEdit || blocked) return;
    if (startEdit(blockId)) {
      setError(null);
      setConfirmRemove(false);
    }
  };

  return (
    <div
      className={`group/block relative ${
        inlineControls ? 'inline-flex items-center gap-0.5' : ''
      } ${className} ${
        editing ? `mlkch-inline-editing overflow-visible z-20 ${editClassName}` : ''
      } ${blocked ? 'opacity-55' : ''}`}
    >
      {canEdit && !editing && !inlineControls && (
        <button
          type="button"
          onClick={handleStart}
          disabled={blocked}
          aria-label="Edit"
          className={`absolute ${placement.view} z-10 p-1 rounded-md text-white/0 group-hover/block:text-white/35 hover:!text-white/70 transition-colors duration-200 disabled:pointer-events-none`}
        >
          <Pencil className="w-3 h-3" strokeWidth={2} />
        </button>
      )}

      {editing && confirmRemove && onRemove && (
        <div
          className={`${controlsShellClass} ${placement.confirm} gap-1.5 px-2 py-1 max-w-[min(100%,260px)]`}
          style={controlsShellStyle}
        >
          <p className="text-[10px] text-white/75 leading-snug truncate">
            Remove &ldquo;{removeLabel}&rdquo;?
          </p>
          <button
            type="button"
            onClick={() => void handleRemove()}
            disabled={saving}
            aria-label="Confirm remove"
            className="p-1 rounded-md text-red-300/90 hover:text-red-200 transition-colors disabled:opacity-40 flex-shrink-0"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
            )}
          </button>
          <button
            type="button"
            onClick={() => setConfirmRemove(false)}
            disabled={saving}
            aria-label="Cancel remove"
            className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {editing && !confirmRemove && (
        <div className={`${controlsShellClass} ${placement.edit}`} style={controlsShellStyle}>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            aria-label="Save"
            className="p-1 rounded-md text-teal-300/80 hover:text-teal-200 transition-colors disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            )}
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              disabled={saving}
              aria-label="Remove"
              className="p-1 rounded-md text-red-300/70 hover:text-red-200 transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            aria-label="Cancel"
            className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors disabled:opacity-40"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {typeof children === 'function' ? children(editing) : children}

      {canEdit && !editing && inlineControls && (
        <button
          type="button"
          onClick={handleStart}
          disabled={blocked}
          aria-label="Edit"
          className="inline-flex shrink-0 p-0.5 rounded-md text-white/0 group-hover/block:text-white/35 hover:!text-white/70 transition-colors duration-200 disabled:pointer-events-none"
        >
          <Pencil className="w-3 h-3" strokeWidth={2} />
        </button>
      )}

      {error && <p className="mt-1 text-[10px] text-red-300/90">{error}</p>}
    </div>
  );
};
