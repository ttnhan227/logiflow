import React, { useEffect, useId, useRef } from 'react';
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
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleCancel = (e) => {
    e.preventDefault();
    onCloseRef.current?.();
  };

  const handleBackdropClick = (e) => {
    if (closeOnOverlayClick && e.target === dialogRef.current) {
      onCloseRef.current?.();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className={`ui-native-modal ui-modal-container ${className}`}
      style={{
        width: 'min(calc(100vw - 32px), 100%)',
        maxWidth,
        margin: 'auto',
        padding: 0,
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-modal)',
        border: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100dvh - 32px)',
        overflow: 'hidden',
        overscrollBehavior: 'contain',
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
              <h2
                id={titleId}
                style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', margin: 0 }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                id={descId}
                style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}
              >
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
                color: 'var(--text-secondary)',
                minHeight: '36px',
                width: '36px',
                padding: 0,
              }}
            >
              <LuX size={18} aria-hidden="true" />
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
    </dialog>
  );
};

export default Modal;
