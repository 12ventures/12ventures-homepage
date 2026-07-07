import React from 'react';
import './ToggleSwitch.css';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const inputId = id ?? (label ? `toggle-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <label
      className={`toggle-switch${checked ? ' toggle-switch--on' : ''}${disabled ? ' toggle-switch--disabled' : ''}${className ? ` ${className}` : ''}`}
      htmlFor={inputId}
    >
      <input
        id={inputId}
        type="checkbox"
        className="toggle-switch__input"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel ?? label}
      />
      <span className="toggle-switch__track" aria-hidden="true">
        <span className="toggle-switch__thumb" />
      </span>
      {label ? <span className="toggle-switch__label">{label}</span> : null}
    </label>
  );
};

export default ToggleSwitch;
