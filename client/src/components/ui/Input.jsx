import React, { useState, useId } from 'react';
import { LuEye, LuEyeOff } from 'react-icons/lu';

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
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint && !error ? `${inputId}-hint` : undefined;
  const describedBy = [ariaDescribedByProp, errorId, hintId].filter(Boolean).join(' ') || undefined;
  const isInvalid = ariaInvalidProp != null ? ariaInvalidProp : !!error;

  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const effectiveType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

  const hasRightControl = rightIcon || isPasswordType;
  const cleanLabel = typeof label === 'string' && required ? label.replace(/\s*\*$/, '') : label;

  return (
    <div className={`ui-input-group ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {cleanLabel && (
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
          {cleanLabel}
          {required && <span style={{ color: 'var(--color-danger-600)' }} aria-hidden="true">*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              color: error ? 'var(--color-danger-600)' : 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              pointerEvents: 'none',
              zIndex: 1,
            }}
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          disabled={disabled}
          required={required}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy}
          aria-label={!cleanLabel ? (props['aria-label'] || props.placeholder) : undefined}
          className={`ui-input ${error ? 'has-error' : ''}`}
          style={{
            width: '100%',
            minHeight: '40px',
            padding: `8px ${hasRightControl ? '42px' : '12px'} 8px ${leftIcon ? '36px' : '12px'}`,
            fontSize: 'max(1rem, var(--text-sm))',
            color: 'var(--text-primary)',
            backgroundColor: disabled ? 'var(--color-slate-100)' : error ? 'var(--color-danger-50)' : 'var(--color-white)',
            border: `1px solid ${error ? 'var(--color-danger-600)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xs)',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast)',
            ...style,
          }}
          {...props}
        />

        {isPasswordType && !rightIcon && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-pressed={showPassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '8px',
              background: 'none',
              border: 'none',
              padding: '6px',
              minWidth: '28px',
              minHeight: '28px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              zIndex: 1,
            }}
          >
            {showPassword ? <LuEyeOff size={16} aria-hidden="true" /> : <LuEye size={16} aria-hidden="true" />}
          </button>
        )}

        {rightIcon && (
          <span
            style={{
              position: 'absolute',
              right: '12px',
              color: error ? 'var(--color-danger-600)' : 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              zIndex: 1,
            }}
            aria-hidden="true"
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
