import React from 'react';

export const Textarea = React.forwardRef(({
  label,
  error,
  hint,
  className = '',
  style = {},
  id,
  rows = 3,
  disabled = false,
  required = false,
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`ui-textarea-group ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={textareaId}
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

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        required={required}
        className={`ui-textarea ${error ? 'has-error' : ''}`}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-primary)',
          backgroundColor: disabled ? 'var(--color-slate-100)' : 'var(--color-white)',
          border: `1px solid ${error ? 'var(--color-danger-600)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xs)',
          transition: 'all var(--transition-fast)',
          outline: 'none',
          resize: 'vertical',
          ...style,
        }}
        {...props}
      />

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

Textarea.displayName = 'Textarea';
export default Textarea;
