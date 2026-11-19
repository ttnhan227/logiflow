import React from 'react';
import { Link } from 'react-router-dom';

export const PageHeader = ({
  title,
  description,
  breadcrumbs = null, // Array of { label, href }
  actions = null,
  action = null,
  badge = null,
  className = '',
  style = {},
}) => {
  const headerActions = actions || action;
  return (
    <div
      className={`ui-page-header ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '24px',
        ...style,
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '6px',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            marginBottom: '4px',
          }}
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <span aria-hidden="true">/</span>}
                {crumb.href ? (
                  crumb.href.startsWith('/') ? (
                    <Link
                      to={crumb.href}
                      aria-current={isLast ? 'page' : undefined}
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <a
                      href={crumb.href}
                      aria-current={isLast ? 'page' : undefined}
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {crumb.label}
                    </a>
                  )
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    style={{ color: 'var(--text-primary)', fontWeight: 500 }}
                  >
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--text-primary)',
                letterSpacing: 'var(--tracking-tight)',
                margin: 0,
              }}
            >
              {title}
            </h1>
            {badge && <span className="inline-flex">{badge}</span>}
          </div>

          {description && (
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                margin: 0,
                maxWidth: '720px',
              }}
            >
              {description}
            </p>
          )}
        </div>

        {headerActions && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            {headerActions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
