import React from 'react';
import { LuChevronDown } from 'react-icons/lu';

export const Select = React.forwardRef(({
  label,
  error,
  hint,
  options = [],
  children,
  className = '',
  style = {},
  id,
  disabled = false,
  required = false,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`ui-select-group ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--color-danger-600)' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          className={`ui-select ${error ? 'has-error' : ''}`}
          style={{
            width: '100%',
            height: '38px',
            padding: '8px 36px 8px 12px',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            backgroundColor: disabled ? 'var(--color-slate-100)' : 'var(--color-white)',
            border: `1px solid ${error ? 'var(--color-danger-600)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xs)',
            appearance: 'none',
            WebkitAppearance: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition-fast)',
            outline: 'none',
            ...style,
          }}
          {...props}
        >
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        <span
          style={{
            position: 'absolute',
            right: '12px',
            color: 'var(--color-slate-400)',
            pointerEvents: 'none',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <LuChevronDown size={16} />
        </span>
      </div>

      {hint && !error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {hint}
        </span>
      )}

      {error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger-600)', fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
