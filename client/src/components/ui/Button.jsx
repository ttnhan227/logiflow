import React from 'react';
import { Link } from 'react-router-dom';
import { LuLoaderCircle } from 'react-icons/lu';

export const Button = React.forwardRef(({
  children,
  as,
  to,
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
  'aria-label': ariaLabelProp,
  ...props
}, ref) => {
  const Component = as || (to ? Link : 'button');
  const isButton = Component === 'button';
  const isDisabled = disabled || loading;

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    transition: 'background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast)',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.6 : 1,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    border: '1px solid transparent',
    textDecoration: 'none',
  };

  const sizeStyles = {
    sm: {
      padding: '5px 10px',
      fontSize: 'var(--text-xs)',
      minHeight: '28px',
    },
    md: {
      padding: '8px 14px',
      fontSize: 'var(--text-sm)',
      minHeight: '36px',
    },
    lg: {
      padding: '10px 18px',
      fontSize: 'var(--text-base)',
      minHeight: '42px',
    },
    icon: {
      padding: '6px',
      minHeight: '36px',
      minWidth: '36px',
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

  const handleLinkClick = (e) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    if (onClick) onClick(e);
  };

  return (
    <Component
      ref={ref}
      {...(to ? { to } : {})}
      {...(isButton ? { type, disabled: isDisabled } : {})}
      {...(!isButton && isDisabled ? { 'aria-disabled': 'true', tabIndex: -1 } : {})}
      aria-busy={loading ? 'true' : undefined}
      aria-label={ariaLabelProp}
      onClick={isButton ? onClick : handleLinkClick}
      className={`ui-btn ui-btn-${variant} ui-btn-${size} ${className}`}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <LuLoaderCircle className="animate-spin" size={size === 'sm' ? 14 : 16} aria-hidden="true" />
      ) : leftIcon ? (
        <span className="inline-flex items-center" aria-hidden="true">{leftIcon}</span>
      ) : null}
      {children}
      {!loading && rightIcon && (
        <span className="inline-flex items-center" aria-hidden="true">{rightIcon}</span>
      )}
    </Component>
  );
});

Button.displayName = 'Button';
export default Button;
