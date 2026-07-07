import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { createPortal } from 'react-dom';
import './CustomDropdown.css';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  languageBadge?: string;
  id?: string; // Optional ID for storing additional data (e.g., quiz_id for quiz variations)
}

export interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: 'default' | 'mini';
  glass?: boolean;
  id?: string;
  name?: string;
  'aria-label'?: string;
  /** Overrides default max-height on the options list (e.g. `min(520px, 65vh)` for long variation lists). */
  optionsMaxHeight?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  size = 'default',
  glass = false,
  id,
  name,
  'aria-label': ariaLabel,
  optionsMaxHeight
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuPortalRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  /** Max height for the scrollable options list — fits viewport under/above trigger (unless optionsMaxHeight is set). */
  const [listMaxHeightPx, setListMaxHeightPx] = useState<number | null>(null);
  /** Whether there is more content below the visible scroll area. */
  const [hasOverflowBelow, setHasOverflowBelow] = useState(true);

  const checkOverflow = () => {
    const el = listRef.current;
    if (!el) return;
    // 2px tolerance to avoid floating-point jitter at exact bottom
    setHasOverflowBelow(el.scrollTop + el.clientHeight < el.scrollHeight - 2);
  };

  // Close dropdown when clicking outside (account for portal menu)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        (!menuPortalRef.current || !menuPortalRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  /** Vertical space available for the open menu (list + chrome) without crossing viewport edges. */
  const computeListMaxHeightPx = (): number => {
    const btn = buttonRef.current;
    if (!btn) return 320;
    const rect = btn.getBoundingClientRect();
    const vh = window.innerHeight;
    const edgeMargin = 12;
    const spaceBelow = vh - rect.bottom - edgeMargin;
    const spaceAbove = rect.top - edgeMargin;
    // Match computePosition: prefer opening downward when there’s enough room vs above
    const estMenuH = 280;
    const openDown = spaceBelow >= estMenuH || spaceBelow >= spaceAbove;
    const availableForMenu = openDown ? spaceBelow : spaceAbove;
    // Reserve a few px for menu padding/border — never exceed the side we open toward
    const raw = Math.floor(availableForMenu - 10);
    return Math.max(48, Math.min(raw, 2000));
  };

  const computePosition = (menuW: number, menuH: number) => {
    const btn = buttonRef.current;
    if (!btn) return { top: 0, left: 0, width: menuW };
    const rect = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.max(rect.width, menuW);
    const spaceBelow = vh - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openDown = spaceBelow >= menuH || spaceBelow >= spaceAbove; // prefer down when enough space
    const top = openDown ? rect.bottom + 8 : rect.top - menuH - 8;
    // Prefer aligning left with button; if overflow right, align right edge
    let left = rect.left;
    if (left + width > vw - 8) {
      left = rect.right - width;
    }
    left = clamp(left, 8, Math.max(8, vw - width - 8));
    return { top: clamp(top, 8, Math.max(8, vh - menuH - 8)), left, width };
  };

  const measureAndPosition = (maxListPx?: number) => {
    const listCap = maxListPx ?? listMaxHeightPx ?? 280;
    const estimatedMenuW = 220; // matches CSS min-width
    const estimatedMenuH = Math.min(listCap, 560) + 28; // scrollable list + menu padding
    const pos = computePosition(estimatedMenuW, estimatedMenuH);
    setMenuPosition(pos);
  };

  // Before paint: max-height so the list uses all usable viewport space without clipping
  useLayoutEffect(() => {
    if (!isOpen) {
      setListMaxHeightPx(null);
      setHasOverflowBelow(true); // reset for next open
      return;
    }

    const syncLayout = () => {
      if (optionsMaxHeight) {
        setListMaxHeightPx(null);
        measureAndPosition(360);
      } else {
        const maxList = computeListMaxHeightPx();
        setListMaxHeightPx(maxList);
        measureAndPosition(maxList);
      }
      requestAnimationFrame(() => {
        try {
          const portal = menuPortalRef.current;
          const menu = portal?.firstElementChild as HTMLElement | null;
          if (menu) {
            const rect = menu.getBoundingClientRect();
            setMenuPosition(computePosition(Math.max(rect.width, 220), rect.height));
          }
        } catch {
          /* noop */
        }
        checkOverflow();
      });
    };

    syncLayout();
    window.addEventListener('resize', syncLayout, { passive: true });
    window.addEventListener('scroll', syncLayout, { passive: true });
    return () => {
      window.removeEventListener('resize', syncLayout as EventListener);
      window.removeEventListener('scroll', syncLayout as EventListener);
    };
  }, [isOpen, optionsMaxHeight]);

  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (optionValue: string) => {
    if (!disabled) {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          // Navigate to next option
          const currentIndex = options.findIndex(option => option.value === value);
          const nextIndex = (currentIndex + 1) % options.length;
          onChange(options[nextIndex].value);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          // Navigate to previous option
          const currentIndex = options.findIndex(option => option.value === value);
          const prevIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
          onChange(options[prevIndex].value);
        }
        break;
    }
  };

  const menuContent = (
    <div className="custom-dropdown-menu" style={{ width: menuPosition.width }}>
      <div className="custom-dropdown-options-wrap">
        <ul
          ref={listRef}
          className="custom-dropdown-options"
          role="listbox"
          aria-label={ariaLabel || 'Options'}
          onScroll={checkOverflow}
          style={{
            maxHeight: optionsMaxHeight
              ? optionsMaxHeight
              : listMaxHeightPx != null
                ? `${listMaxHeightPx}px`
                : undefined,
          }}
        >
          {options.map((option) => (
            <li
              key={option.value}
              className={`custom-dropdown-option ${option.value === value ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}`}
              role="option"
              aria-selected={option.value === value}
              onClick={() => !option.disabled && handleOptionClick(option.value)}
            >
              <div className="custom-dropdown-option-content">
                {option.icon && <span className="custom-dropdown-option-icon">{option.icon}</span>}
                <span className="custom-dropdown-option-label">{option.label}</span>
                {option.languageBadge && (
                  <span className="custom-dropdown-language-badge">{option.languageBadge}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
        {/* Fade hides itself once the list is scrolled to the bottom */}
        {hasOverflowBelow && <div className="custom-dropdown-fade" aria-hidden="true" />}
      </div>
    </div>
  );

  return (
    <div 
      ref={dropdownRef}
      className={`custom-dropdown ${size === 'mini' ? 'mini' : ''} ${glass ? 'glass' : ''} ${className} ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
      id={id}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`custom-dropdown-button ${size === 'mini' ? 'mini' : ''} ${glass ? 'glass' : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        name={name}
      >
        <span className={`custom-dropdown-value ${size === 'mini' ? 'mini' : ''}`}>
          {selectedOption?.icon && <span className="custom-dropdown-value-icon">{selectedOption.icon}</span>}
          {displayValue}
          {selectedOption?.languageBadge && (
            <span className="custom-dropdown-value-badge">{selectedOption.languageBadge}</span>
          )}
        </span>
        <FiChevronDown 
          className={`custom-dropdown-arrow ${size === 'mini' ? 'mini' : ''} ${glass ? 'glass' : ''} ${isOpen ? 'open' : ''}`}
          size={16}
        />
      </button>
      {isOpen && createPortal(
        <div
          className={`custom-dropdown-portal ${size === 'mini' ? 'mini' : ''} ${glass ? 'glass' : ''}`}
          ref={menuPortalRef}
          style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left, zIndex: 3000, width: menuPosition.width }}
        >
          {menuContent}
        </div>,
        document.body
      )}
    </div>
  );
};

export default CustomDropdown; 