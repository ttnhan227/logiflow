import React from 'react';
import { Button } from './Button';

export const EmptyState = ({
  icon,
  title = 'No items found',
  description = 'There is currently no data matching your criteria.',
  action = null, // e.g. { label: 'Create Order', onClick: () => {}, icon: <LuPlus /> }
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`ui-empty-state ${className}`}
      style={{
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-default)',
        backgroundColor: 'var(--bg-surface-subtle)',
        ...style,
      }}
    >
      {icon && (
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-slate-100)',
            color: 'var(--color-slate-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          {icon}
        </div>
      )}

      <h3
        style={{
          fontSize: 'var(--text-md)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-primary)',
          margin: '0 0 6px 0',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          margin: '0 0 20px 0',
          maxWidth: '420px',
        }}
      >
        {description}
      </p>

      {action && (
        <Button
          variant={action.variant || 'primary'}
          size="md"
          leftIcon={action.icon}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
