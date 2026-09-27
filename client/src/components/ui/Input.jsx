import React from 'react';

export const Input = React.forwardRef(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  style = {},
  id,
  type = 'text',
  disabled = false,
  required = false,
  'aria-invalid': ariaInvalidProp,
  'aria-describedby': ariaDescribedByProp,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  const hintId = hint && !error && inputId ? `${inputId}-hint` : undefined;
  const describedBy = [ariaDescribedByProp, errorId, hintId].filter(Boolean).join(' ') || undefined;
  const isInvalid = ariaInvalidProp != null ? ariaInvalidProp : !!error;

  return (
    <div className={`ui-input-group ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
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
          {required && <span style={{ color: 'var(--color-danger-600)' }} aria-hidden="true">*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              color: error ? 'var(--color-danger-600)' : 'var(--color-slate-400)',
              display: 'inline-flex',
              alignItems: 'center',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          required={required}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy}
          className={`ui-input ${error ? 'has-error' : ''}`}
          style={{
            width: '100%',
            height: '38px',
            padding: `8px ${rightIcon ? '36px' : '12px'} 8px ${leftIcon ? '36px' : '12px'}`,
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            backgroundColor: disabled ? 'var(--color-slate-100)' : error ? 'var(--color-danger-50)' : 'var(--color-white)',
            border: `1px solid ${error ? 'var(--color-danger-600)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xs)',
            transition: 'all var(--transition-fast)',
            outline: 'none',
            ...style,
          }}
          {...props}
        />

        {rightIcon && (
          <span
            style={{
              position: 'absolute',
              right: '12px',
              color: error ? 'var(--color-danger-600)' : 'var(--color-slate-400)',
              display: 'inline-flex',
              alignItems: 'center',
              zIndex: 1,
            }}
          >
            {rightIcon}
          </span>
        )}
      </div>

      {hint && !error && (
        <span id={hintId} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {hint}
        </span>
      )}

      {error && (
        <span id={errorId} role="alert" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger-600)', fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;