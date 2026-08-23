import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral', // 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand'
  size = 'md', // 'sm' | 'md'
  dot = false,
  className = '',
  style = {},
  ...props
}) => {
  const variantStyles = {
    success: {
      backgroundColor: 'var(--color-success-50)',
      color: 'var(--color-success-800)',
      border: '1px solid var(--color-success-200)',
      dotColor: 'var(--color-success-600)',
    },
    warning: {
      backgroundColor: 'var(--color-warning-50)',
      color: 'var(--color-warning-800)',
      border: '1px solid var(--color-warning-200)',
      dotColor: 'var(--color-warning-600)',
    },
    danger: {
      backgroundColor: 'var(--color-danger-50)',
      color: 'var(--color-danger-800)',
      border: '1px solid var(--color-danger-200)',
      dotColor: 'var(--color-danger-600)',
    },
    info: {
      backgroundColor: 'var(--color-info-50)',
      color: 'var(--color-info-800)',
      border: '1px solid var(--color-info-200)',
      dotColor: 'var(--color-info-600)',
    },
    brand: {
      backgroundColor: 'var(--color-brand-50)',
      color: 'var(--color-brand-800)',
      border: '1px solid var(--color-brand-200)',
      dotColor: 'var(--color-brand-600)',
    },
    neutral: {
      backgroundColor: 'var(--color-slate-100)',
      color: 'var(--color-slate-700)',
      border: '1px solid var(--color-slate-200)',
      dotColor: 'var(--color-slate-500)',
    },
  };

  const sizeStyles = {
    sm: {
      padding: '1px 7px',
      fontSize: '11px',
      height: '18px',
      gap: '4px',
    },
    md: {
      padding: '2px 9px',
      fontSize: '12px',
      height: '22px',
      gap: '5px',
    },
  };

  const selectedVariant = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`ui-badge ui-badge-${variant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        textTransform: 'none',
        ...sizeStyles[size],
        backgroundColor: selectedVariant.backgroundColor,
        color: selectedVariant.color,
        border: selectedVariant.border,
        ...style,
      }}
      {...props}
    >
      {dot && (
        <span
          style={{
            width: size === 'sm' ? '5px' : '6px',
            height: size === 'sm' ? '5px' : '6px',
            borderRadius: '50%',
            backgroundColor: selectedVariant.dotColor,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
