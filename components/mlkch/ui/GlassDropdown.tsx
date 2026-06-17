import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Loader2 } from 'lucide-react';

export interface GlassDropdownOption<T extends string = string> {
  value: T;
  label: string;
  color?: string;
  textShadow?: string;
}

interface GlassDropdownProps<T extends string = string> {
  value: T;
  options: GlassDropdownOption<T>[];
  onChange: (value: T) => void | Promise<void>;
  disabled?: boolean;
  align?: 'left' | 'right';
  className?: string;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
  menuAccent?: string;
  showChevronOnHover?: boolean;
  /** Badge pill (dashboard) vs full-width form field (edit panel) */
  variant?: 'badge' | 'field';
  /** Override portal z-index — use above parent overlays (edit panel = 70) */
  menuZIndex?: number;
}

const MENU_MIN_WIDTH = 152;
const MENU_OFFSET = 6;
/** Portaled above dashboard UI; below modals/copilot (z-50) and edit panel (z-60) */
const MENU_Z_INDEX = 45;

interface MenuPosition {
  top: number;
  left: number;
  minWidth: number;
}

const GlassDropdown = <T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  align = 'right',
  className = '',
  triggerClassName = '',
  triggerStyle,
  menuAccent = '#38bdf8',
  showChevronOnHover,
  variant = 'badge',
  menuZIndex = MENU_Z_INDEX,
}: GlassDropdownProps<T>) => {
  const isField = variant === 'field';
  const chevronOnHover = showChevronOnHover ?? !isField;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const selected = options.find((option) => option.value === value) ?? options[0];

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const minWidth = Math.max(MENU_MIN_WIDTH, rect.width);

    let left = align === 'right' ? rect.right - minWidth : rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - minWidth - 8));

    const top = rect.bottom + MENU_OFFSET;

    setMenuPosition({ top, left, minWidth });
  }, [align]);

  useEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();

    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleSelect = async (next: T) => {
    if (next === value || saving) {
      setOpen(false);
      return;
    }

    setSaving(true);
    try {
      await onChange(next);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const triggerColor = selected?.color ?? triggerStyle?.color;
  const triggerShadow = selected?.textShadow;

  const menu =
    open && !disabled && menuPosition
      ? createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            className="fixed py-1 rounded-xl overflow-hidden"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: menuPosition.minWidth,
              zIndex: menuZIndex,
              background:
                'linear-gradient(155deg, rgba(14,100,180,0.22) 0%, rgba(6,30,80,0.28) 100%)',
              border: `1px solid color-mix(in srgb, ${menuAccent} 35%, rgba(255,255,255,0.12))`,
              backdropFilter: 'blur(14px) saturate(160%)',
              WebkitBackdropFilter: 'blur(14px) saturate(160%)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.14), 0 8px 32px rgba(0,0,0,0.45)',
            }}
          >
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <li key={option.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => void handleSelect(option.value)}
                    className={`w-full text-left px-3 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${
                      isSelected ? 'bg-white/[0.08]' : 'hover:bg-white/[0.06]'
                    }`}
                    style={{
                      color: option.color ?? 'rgba(255,255,255,0.85)',
                      textShadow: option.textShadow,
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        className={`relative ${isField ? 'block w-full' : 'inline-flex'} ${className}`}
      >
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled || saving}
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => {
            if (disabled || saving) return;
            setOpen((current) => !current);
          }}
          className={`group/trigger inline-flex items-center gap-1.5 transition-all duration-200 disabled:opacity-60 ${
            isField
              ? 'w-full justify-between rounded-xl px-3 py-2 text-sm font-medium normal-case tracking-normal text-white/90 bg-white/[0.04] border border-white/[0.08] hover:border-sky-400/30'
              : 'text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full'
          } ${triggerClassName}`}
          style={triggerStyle}
        >
          <span
            className={isField ? 'truncate text-left' : undefined}
            style={{
              color: isField ? undefined : triggerColor,
              textShadow: isField ? undefined : triggerShadow,
            }}
          >
            {selected?.label}
          </span>
          {!disabled &&
            (saving ? (
              <Loader2
                className={`${isField ? 'w-4 h-4' : 'w-3 h-3'} animate-spin opacity-70 flex-shrink-0`}
                strokeWidth={2.5}
              />
            ) : (
              <ChevronDown
                className={`flex-shrink-0 transition-all duration-200 ${
                  isField ? 'w-4 h-4 opacity-45' : 'w-3 h-3'
                } ${
                  open
                    ? 'opacity-90 rotate-180'
                    : chevronOnHover
                      ? 'opacity-0 -mr-1 group-hover/trigger:opacity-70 group-hover/trigger:mr-0'
                      : 'opacity-45'
                }`}
                style={{ color: triggerColor ?? 'rgba(255,255,255,0.55)' }}
                strokeWidth={2.5}
              />
            ))}
        </button>
      </div>
      {menu}
    </>
  );
};

export default GlassDropdown;
