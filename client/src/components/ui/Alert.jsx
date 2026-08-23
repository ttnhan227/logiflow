import React from 'react';
import { LuCircleCheck, LuTriangleAlert, LuCircleAlert, LuInfo, LuX } from 'react-icons/lu';

export const Alert = ({
  variant = 'info', // 'info' | 'success' | 'warning' | 'error' | 'danger'
  title,
  children,
  onClose,
  className = '',
  style = {},
}) => {
  const normVariant = variant === 'error' ? 'danger' : variant;

  const variantConfig = {
    info: {
      bg: 'var(--color-info-50)',
      border: 'var(--color-info-200)',
      text: 'var(--color-info-800)',
      icon: <LuInfo size={18} color="var(--color-info-600)" />,
    },
    success: {
      bg: 'var(--color-success-50)',
      border: 'var(--color-success-200)',
      text: 'var(--color-success-800)',
      icon: <LuCircleCheck size={18} color="var(--color-success-600)" />,
    },
    warning: {
      bg: 'var(--color-warning-50)',
      border: 'var(--color-warning-200)',
      text: 'var(--color-warning-800)',
      icon: <LuTriangleAlert size={18} color="var(--color-warning-600)" />,
    },
    danger: {
      bg: 'var(--color-danger-50)',
      border: 'var(--color-danger-200)',
      text: 'var(--color-danger-800)',
      icon: <LuCircleAlert size={18} color="var(--color-danger-600)" />,
    },
  };

  const config = variantConfig[normVariant] || variantConfig.info;

  return (
    <div
      className={`ui-alert ui-alert-${normVariant} ${className}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
        fontSize: 'var(--text-sm)',
        lineHeight: 1.4,
        ...style,
      }}
      role="alert"
    >
      <span style={{ flexShrink: 0, marginTop: '1px' }}>{config.icon}</span>

      <div style={{ flex: 1 }}>
        {title && (
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', margin: '0 0 2px 0', color: config.text }}>
            {title}
          </h4>
        )}
        <div style={{ color: config.text }}>{children}</div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close alert"
          style={{
            padding: 0,
            color: config.text,
            opacity: 0.7,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <LuX size={16} />
        </button>
      )}
    </div>
  );
};

export default Alert;
