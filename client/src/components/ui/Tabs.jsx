import React, { useRef } from 'react';

export const Tabs = ({
  items = [], // Array of { id, label, icon, badge, count }
  activeTab,
  onChange,
  variant = 'underline', // 'underline' | 'pills'
  className = '',
  style = {},
}) => {
  const tabRefs = useRef([]);

  const handleKeyDown = (e) => {
    if (!onChange || items.length === 0) return;
    const currentIndex = items.findIndex((t) => t.id === activeTab);
    if (currentIndex === -1) return;

    let targetIndex = null;
    if (e.key === 'ArrowRight') {
      targetIndex = (currentIndex + 1) % items.length;
    } else if (e.key === 'ArrowLeft') {
      targetIndex = (currentIndex - 1 + items.length) % items.length;
    } else if (e.key === 'Home') {
      targetIndex = 0;
    } else if (e.key === 'End') {
      targetIndex = items.length - 1;
    }

    if (targetIndex !== null) {
      e.preventDefault();
      onChange(items[targetIndex].id);
      tabRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div
      className={`ui-tabs ui-tabs-${variant} ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: variant === 'pills' ? '6px' : '24px',
        borderBottom: variant === 'underline' ? '1px solid var(--border-default)' : 'none',
        paddingBottom: '0',
        overflowX: 'auto',
        ...style,
      }}
      role="tablist"
      onKeyDown={handleKeyDown}
    >
      {items.map((tab, index) => {
        const isActive = activeTab === tab.id;

        if (variant === 'pills') {
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange && onChange(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: 'var(--text-sm)',
                fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-medium)',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--color-brand-700)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--color-brand-50)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--color-brand-200)' : 'transparent'}`,
                transition: 'background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.icon && <span aria-hidden="true" className="inline-flex">{tab.icon}</span>}
              <span>{tab.label}</span>
              {(tab.badge !== undefined || tab.count !== undefined) && (
                <span
                  style={{
                    padding: '1px 6px',
                    fontSize: '11px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isActive ? 'var(--color-brand-200)' : 'var(--color-slate-200)',
                    color: isActive ? 'var(--color-brand-900)' : 'var(--color-slate-700)',
                    fontWeight: 700,
                  }}
                >
                  {tab.badge ?? tab.count}
                </span>
              )}
            </button>
          );
        }

        // 'underline' variant
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange && onChange(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 4px',
              fontSize: 'var(--text-sm)',
              fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-medium)',
              color: isActive ? 'var(--color-brand-600)' : 'var(--text-secondary)',
              borderBottom: `2px solid ${isActive ? 'var(--color-brand-600)' : 'transparent'}`,
              marginBottom: '-1px',
              transition: 'color var(--transition-fast), border-color var(--transition-fast)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.icon && <span aria-hidden="true" className="inline-flex">{tab.icon}</span>}
            <span>{tab.label}</span>
            {(tab.badge !== undefined || tab.count !== undefined) && (
              <span
                style={{
                  padding: '1px 6px',
                  fontSize: '11px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isActive ? 'var(--color-brand-100)' : 'var(--color-slate-100)',
                  color: isActive ? 'var(--color-brand-700)' : 'var(--color-slate-600)',
                  fontWeight: 700,
                }}
              >
                {tab.badge ?? tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
