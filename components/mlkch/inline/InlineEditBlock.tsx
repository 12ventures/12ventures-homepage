import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { useInlineEdit } from './InlineEditProvider';

interface InlineEditBlockProps {
  blockId: string;
  canEdit?: boolean;
  onSave: () => Promise<void>;
  onCancel?: () => void;
  className?: string;
  editClassName?: string;
  /** Position of pencil / save controls — use "inset" on rounded cards */
  controlsPlacement?: 'default' | 'inset';
  children: React.ReactNode | ((editing: boolean) => React.ReactNode);
}

const CONTROLS_PLACEMENT = {
  default: {
    view: 'right-0 top-0.5',
    edit: 'right-0 -top-7',
  },
  inset: {
    view: 'right-2.5 top-2.5',
    edit: 'right-2.5 -top-7',
  },
} as const;

export const InlineEditBlock: React.FC<InlineEditBlockProps> = ({
  blockId,
  canEdit = false,
  onSave,
  onCancel,
  className = '',
  editClassName = '',
  controlsPlacement = 'default',
  children,
}) => {
  const placement = CONTROLS_PLACEMENT[controlsPlacement];
  const { startEdit, stopEdit, isEditing, activeBlockId } = useInlineEdit();
  const editing = isEditing(blockId);
  const blocked = activeBlockId !== null && !editing;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const handleCancel = () => {
    onCancel?.();
    stopEdit();
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave();
      stopEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!editing) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      }
      if (event.key === 'Enter' && !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault();
        void handleSave();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [editing, onCancel]);

  const handleStart = () => {
    if (!canEdit || blocked) return;
    if (startEdit(blockId)) {
      setError(null);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`group/block relative ${className} ${
        editing ? `mlkch-inline-editing overflow-visible z-20 ${editClassName}` : ''
      } ${blocked ? 'opacity-55' : ''}`}
    >
      {canEdit && !editing && (
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

      {editing && (
        <div
          className={`absolute ${placement.edit} z-20 flex items-center gap-px rounded-lg px-0.5 py-0.5`}
          style={{
            background: 'rgba(6,11,20,0.88)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px) saturate(140%)',
            WebkitBackdropFilter: 'blur(10px) saturate(140%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          }}
        >
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

      {error && <p className="mt-1 text-[10px] text-red-300/90">{error}</p>}
    </div>
  );
};
