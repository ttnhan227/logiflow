import React from 'react';
import './modal.css';

/**
 * Reusable Modal component for admin pages
 * Provides consistent styling and behavior across all modals
 */
const Modal = ({ 
  isOpen = true, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  showCloseButton = true,
  onOverlayClick = true,
  isLoading = false
}) => {
  const handleBackdropClick = (e) => {
    if (onOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEscapeKey = (e) => {
    if (e.key === 'Escape' && onOverlayClick) {
      onClose();
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [onOverlayClick]);

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className={`modal modal-${size}`}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          {showCloseButton && (
            <button
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
              disabled={isLoading}
            >
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
