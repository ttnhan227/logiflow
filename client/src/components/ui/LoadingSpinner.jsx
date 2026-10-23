import React from 'react';
import { LuLoaderCircle } from 'react-icons/lu';

export const LoadingSpinner = ({
  size = 24,
  message,
  text,
  fullPage = false,
  className = '',
  style = {},
}) => {
  const displayMessage = text ?? message ?? 'Loading...';

  const content = (
    <div
      role="status"
      aria-live="polite"
      className={`ui-loading-spinner ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '32px',
        color: 'var(--color-slate-500)',
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
        ...style,
      }}
    >
      <LuLoaderCircle size={size} className="animate-spin" color="var(--color-brand-600)" aria-hidden="true" />
      {displayMessage && <span>{displayMessage}</span>}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
