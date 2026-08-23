import React from 'react';

export const PageHeader = ({
  title,
  description,
  breadcrumbs = null, // Array of { label, href }
  actions = null,
  badge = null,
  className = '',
  style = {},
}) => {
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
            gap: '6px',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            marginBottom: '4px',
          }}
        >
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span>/</span>}
              {crumb.href ? (
                <a href={crumb.href} style={{ color: 'var(--text-secondary)' }}>
                  {crumb.label}
                </a>
              ) : (
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

        {actions && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
