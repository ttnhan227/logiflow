import React from 'react';

export const Card = ({
  children,
  className = '',
  style = {},
  onClick,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`ui-card ${hoverable ? 'hoverable' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xs)',
        transition: 'all var(--transition-base)',
        overflow: 'hidden',
        ...(hoverable && { cursor: 'pointer' }),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  children,
  className = '',
  style = {},
  actions = null,
  ...props
}) => {
  return (
    <div
      className={`ui-card-header ${className}`}
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        ...style,
      }}
      {...props}
    >
      <div style={{ flex: 1 }}>{children}</div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{actions}</div>}
    </div>
  );
};

export const CardTitle = ({
  children,
  className = '',
  style = {},
  as: Component = 'h3',
  ...props
}) => {
  return (
    <Component
      className={`ui-card-title ${className}`}
      style={{
        fontSize: 'var(--text-md)',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--text-primary)',
        margin: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
};

export const CardDescription = ({
  children,
  className = '',
  style = {},
  ...props
}) => {
  return (
    <p
      className={`ui-card-description ${className}`}
      style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-secondary)',
        margin: '4px 0 0 0',
        ...style,
      }}
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent = ({
  children,
  className = '',
  style = {},
  noPadding = false,
  ...props
}) => {
  return (
    <div
      className={`ui-card-content ${className}`}
      style={{
        padding: noPadding ? 0 : '20px',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardFooter = ({
  children,
  className = '',
  style = {},
  ...props
}) => {
  return (
    <div
      className={`ui-card-footer ${className}`}
      style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '10px',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
