import React from 'react';

/**
 * Reusable pagination UI.
 *
 * Props:
 * - page: number (0-based)
 * - totalPages: number
 * - totalItems?: number
 * - pageSize?: number
 * - onPageChange: (nextPage: number) => void
 * - disabled?: boolean
 */
const Pagination = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  disabled = false,
}) => {
  if (!totalPages || totalPages <= 1) return null;

  const clampedPage = Math.min(Math.max(page ?? 0, 0), totalPages - 1);

  const goto = (p) => {
    if (disabled) return;
    const next = Math.min(Math.max(p, 0), totalPages - 1);
    if (next === clampedPage) return;
    onPageChange(next);
  };

  // Keep it compact: show first, last, current +- 1 with ellipsis
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

    // handle totalPages=2 => [0, last] duplicates
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

  return (
    <div className="pagination-bar">
      <div className="pagination-left">
        {typeof totalItems === 'number' && typeof pageSize === 'number' && (
          <span className="pagination-summary">
            Showing <strong>{from}</strong>-<strong>{to}</strong> of <strong>{totalItems}</strong>
          </span>
        )}
      </div>

      <div className="pagination-right">
        <button
          className="pagination-btn"
          onClick={() => goto(0)}
          disabled={disabled || clampedPage === 0}
          aria-label="First page"
        >
          «
        </button>
        <button
          className="pagination-btn"
          onClick={() => goto(clampedPage - 1)}
          disabled={disabled || clampedPage === 0}
          aria-label="Previous page"
        >
          ‹
        </button>

        <div className="pagination-pages">
          {getPageItems().map((it) => {
            if (it.type === 'ellipsis') {
              return (
                <span className="pagination-ellipsis" key={it.key}>
                  …
                </span>
              );
            }

            const active = it.page === clampedPage;
            return (
              <button
                key={it.key}
                className={`pagination-page ${active ? 'active' : ''}`}
                onClick={() => goto(it.page)}
                disabled={disabled}
              >
                {it.page + 1}
              </button>
            );
          })}
        </div>

        <button
          className="pagination-btn"
          onClick={() => goto(clampedPage + 1)}
          disabled={disabled || clampedPage >= totalPages - 1}
          aria-label="Next page"
        >
          ›
        </button>
        <button
          className="pagination-btn"
          onClick={() => goto(totalPages - 1)}
          disabled={disabled || clampedPage >= totalPages - 1}
          aria-label="Last page"
        >
          »
        </button>
      </div>
    </div>
  );
};

export default Pagination;
