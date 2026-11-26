import React from 'react';

export const Card = ({
  children,
  className = '',
  style,
  onClick,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`ui-card ${hoverable ? 'hoverable' : ''} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  children,
  className = '',
  style,
  actions = null,
  ...props
}) => {
  return (
    <div className={`ui-card-header ${className}`} style={style} {...props}>
      <div className="ui-card-header-main">{children}</div>
      {actions && <div className="ui-card-header-actions">{actions}</div>}
    </div>
  );
};

export const CardTitle = ({
  children,
  className = '',
  style,
  as: TitleTag = 'h3',
  ...props
}) => {
  return React.createElement(
    TitleTag,
    {
      className: `ui-card-title ${className}`,
      style,
      ...props,
    },
    children
  );
};

export const CardDescription = ({
  children,
  className = '',
  style,
  ...props
}) => {
  return (
    <p className={`ui-card-description ${className}`} style={style} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({
  children,
  className = '',
  style,
  noPadding = false,
  ...props
}) => {
  return (
    <div
      className={`ui-card-content ${noPadding ? 'ui-card-content-flush' : ''} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardFooter = ({
  children,
  className = '',
  style,
  ...props
}) => {
  return (
    <div className={`ui-card-footer ${className}`} style={style} {...props}>
      {children}
    </div>
  );
};

export default Card;
