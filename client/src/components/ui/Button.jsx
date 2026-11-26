import React from 'react';
import { Link } from 'react-router-dom';
import { LuLoaderCircle } from 'react-icons/lu';

export const Button = React.forwardRef(({
  children,
  as,
  to,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  style,
  type = 'button',
  onClick,
  'aria-label': ariaLabelProp,
  ...props
}, ref) => {
  const Component = as || (to ? Link : 'button');
  const isButton = Component === 'button';
  const isDisabled = disabled || loading;

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
      style={style}
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
