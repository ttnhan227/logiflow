import React from 'react';
import { LuChevronLeft, LuChevronRight, LuChevronsLeft, LuChevronsRight } from 'react-icons/lu';

export const Pagination = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  disabled = false,
  className = '',
  style = {},
}) => {
  if (!totalPages || totalPages <= 1) return null;

  const clampedPage = Math.min(Math.max(page ?? 0, 0), totalPages - 1);

  const goto = (p) => {
    if (disabled) return;
    const next = Math.min(Math.max(p, 0), totalPages - 1);
    if (next === clampedPage) return;
    onPageChange(next);
  };

  const getPageItems = () => {
    const items = [];
    const last = totalPages - 1;

    const pushPage = (p) => items.push({ type: 'page', page: p, key: `p-${p}` });
    const pushEllipsis = (key) => items.push({ type: 'ellipsis', key });

    pushPage(0);

    const start = Math.max(1, clampedPage - 1);
    const end = Math.min(last - 1, clampedPage + 1);

    if (start > 1) pushEllipsis('e-start');

    for (let p = start; p <= end; p++) {
      pushPage(p);
    }

    if (end < last - 1) pushEllipsis('e-end');

    pushPage(last);

    const seen = new Set();
    return items.filter((it) => {
      if (it.type !== 'page') return true;
      if (seen.has(it.page)) return false;
      seen.add(it.page);
      return true;
    });
  };

  const from = typeof pageSize === 'number' && typeof totalItems === 'number'
    ? clampedPage * pageSize + 1
    : null;
  const to = typeof pageSize === 'number' && typeof totalItems === 'number'
    ? Math.min((clampedPage + 1) * pageSize, totalItems)
    : null;

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '32px',
    minWidth: '32px',
    padding: '0 6px',
    fontSize: 'var(--text-xs)',
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-default)',
    backgroundColor: 'var(--color-white)',
    color: 'var(--text-secondary)',
    transition: 'all var(--transition-fast)',
    cursor: 'pointer',
    userSelect: 'none',
  };

  return (
    <div
      className={`ui-pagination ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
        ...style,
      }}
    >
      <div>
        {typeof totalItems === 'number' && typeof pageSize === 'number' && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{from}</strong>–<strong style={{ color: 'var(--text-primary)' }}>{to}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalItems}</strong> entries
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          style={buttonStyle}
          onClick={() => goto(0)}
          disabled={disabled || clampedPage === 0}
          aria-label="First page"
          title="First page"
        >
          <LuChevronsLeft size={14} />
        </button>
        <button
          style={buttonStyle}
          onClick={() => goto(clampedPage - 1)}
          disabled={disabled || clampedPage === 0}
          aria-label="Previous page"
          title="Previous page"
        >
          <LuChevronLeft size={14} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '0 4px' }}>
          {getPageItems().map((it) => {
            if (it.type === 'ellipsis') {
              return (
                <span
                  key={it.key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  …
                </span>
              );
            }

            const active = it.page === clampedPage;
            return (
              <button
                key={it.key}
                onClick={() => goto(it.page)}
                disabled={disabled}
                style={{
                  ...buttonStyle,
                  fontWeight: active ? 700 : 500,
                  backgroundColor: active ? 'var(--color-brand-600)' : 'var(--color-white)',
                  color: active ? 'var(--color-white)' : 'var(--text-secondary)',
                  borderColor: active ? 'var(--color-brand-600)' : 'var(--border-default)',
                }}
              >
                {it.page + 1}
              </button>
            );
          })}
        </div>

        <button
          style={buttonStyle}
          onClick={() => goto(clampedPage + 1)}
          disabled={disabled || clampedPage >= totalPages - 1}
          aria-label="Next page"
          title="Next page"
        >
          <LuChevronRight size={14} />
        </button>
        <button
          style={buttonStyle}
          onClick={() => goto(totalPages - 1)}
          disabled={disabled || clampedPage >= totalPages - 1}
          aria-label="Last page"
          title="Last page"
        >
          <LuChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
