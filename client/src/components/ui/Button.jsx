import React from 'react';
import { LuLoaderCircle } from 'react-icons/lu';

export const Button = React.forwardRef(({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size = 'md', // 'sm' | 'md' | 'lg' | 'icon'
  loading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  style = {},
  type = 'button',
  onClick,
  ...props
}, ref) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-fast)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    border: '1px solid transparent',
    textDecoration: 'none',
    ...style,
  };

  const sizeStyles = {
    sm: {
      padding: '5px 10px',
      fontSize: 'var(--text-xs)',
      height: '28px',
    },
    md: {
      padding: '8px 14px',
      fontSize: 'var(--text-sm)',
      height: '36px',
    },
    lg: {
      padding: '10px 18px',
      fontSize: 'var(--text-base)',
      height: '42px',
    },
    icon: {
      padding: '6px',
      height: '36px',
      width: '36px',
      borderRadius: 'var(--radius-md)',
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-brand-600)',
      borderColor: 'var(--color-brand-600)',
      color: 'var(--color-white)',
      boxShadow: 'var(--shadow-xs)',
    },
    secondary: {
      backgroundColor: 'var(--color-slate-100)',
      borderColor: 'var(--color-slate-200)',
      color: 'var(--color-slate-800)',
    },
    outline: {
      backgroundColor: 'var(--color-white)',
      borderColor: 'var(--color-slate-300)',
      color: 'var(--color-slate-700)',
      boxShadow: 'var(--shadow-xs)',
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: 'var(--color-slate-600)',
    },
    danger: {
      backgroundColor: 'var(--color-danger-600)',
      borderColor: 'var(--color-danger-600)',
      color: 'var(--color-white)',
      boxShadow: 'var(--shadow-xs)',
    },
    success: {
      backgroundColor: 'var(--color-success-600)',
      borderColor: 'var(--color-success-600)',
      color: 'var(--color-white)',
      boxShadow: 'var(--shadow-xs)',
    },
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`ui-btn ui-btn-${variant} ui-btn-${size} ${className}`}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
      {...props}
    >
      {loading ? (
        <LuLoaderCircle className="animate-spin" size={size === 'sm' ? 14 : 16} />
      ) : leftIcon ? (
        <span className="inline-flex items-center">{leftIcon}</span>
      ) : null}
      {children}
      {!loading && rightIcon && (
        <span className="inline-flex items-center">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
