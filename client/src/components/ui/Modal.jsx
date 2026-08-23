import React, { useEffect } from 'react';
import { LuX } from 'react-icons/lu';
import { Button } from './Button';

export const Modal = ({
  isOpen = false,
  onClose,
  title,
  description,
  children,
  footer = null,
  maxWidth = '520px',
  closeOnOverlayClick = true,
  className = '',
  style = {},
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="ui-modal-backdrop"
      onClick={closeOnOverlayClick ? onClose : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 9999,
        animation: 'fadeIn var(--transition-fast) ease-out',
      }}
    >
      <div
        className={`ui-modal-container ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 32px)',
          overflow: 'hidden',
          animation: 'fadeIn var(--transition-base) cubic-bezier(0.16, 1, 0.3, 1)',
          ...style,
        }}
      >
        {/* Header */}
        {(title || onClose) && (
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '12px',
              backgroundColor: 'var(--bg-surface-subtle)',
            }}
          >
            <div>
              {title && (
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', margin: 0 }}>
                  {title}
                </h3>
              )}
              {description && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  {description}
                </p>
              )}
            </div>

            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  color: 'var(--color-slate-400)',
                  height: '28px',
                  width: '28px',
                  padding: 0,
                }}
              >
                <LuX size={18} />
              </Button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
