import React from 'react';

export const Table = ({
  children,
  className = '',
  style = {},
  dense = false,
  ...props
}) => {
  return (
    <div
      className="ui-table-container"
      style={{
        width: '100%',
        overflowX: 'auto',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <table
        className={`ui-table ${dense ? 'dense' : ''} ${className}`}
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: 'var(--text-sm)',
          fontVariantNumeric: 'tabular-nums',
          ...style,
        }}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children, className = '', style = {}, ...props }) => {
  return (
    <thead
      className={`ui-table-header ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface-subtle)',
        borderBottom: '1px solid var(--border-default)',
        ...style,
      }}
      {...props}
    >
      {children}
    </thead>
  );
};

export const TableHead = ({ children, className = '', style = {}, align = 'left', ...props }) => {
  return (
    <th
      className={`ui-table-head ${className}`}
      style={{
        padding: '10px 14px',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        textAlign: align,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...props}
    >
      {children}
    </th>
  );
};

export const TableBody = ({ children, className = '', style = {}, ...props }) => {
  return (
    <tbody className={`ui-table-body ${className}`} style={style} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow = ({
  children,
  className = '',
  style = {},
  hoverable = true,
  onClick,
  ...props
}) => {
  return (
    <tr
      onClick={onClick}
      className={`ui-table-row ${hoverable ? 'hoverable' : ''} ${className}`}
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'background-color var(--transition-fast)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableCell = ({
  children,
  className = '',
  style = {},
  align = 'left',
  muted = false,
  ...props
}) => {
  return (
    <td
      className={`ui-table-cell ${className}`}
      style={{
        padding: '12px 14px',
        color: muted ? 'var(--text-muted)' : 'var(--text-primary)',
        textAlign: align,
        verticalAlign: 'middle',
        ...style,
      }}
      {...props}
    >
      {children}
    </td>
  );
};

export const TableEmpty = ({
  colSpan = 1,
  message = 'No data available in this table',
  icon = null,
}) => {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          padding: '48px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 'var(--text-sm)',
        }}
      >
        {icon && <div style={{ marginBottom: '8px' }}>{icon}</div>}
        <p style={{ margin: 0 }}>{message}</p>
      </td>
    </tr>
  );
};

export default Table;
