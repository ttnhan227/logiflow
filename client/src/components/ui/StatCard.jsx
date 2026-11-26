import React from 'react';
import { Card } from './Card';
import { LuTrendingUp, LuTrendingDown } from 'react-icons/lu';

export const StatCard = ({
  title,
  value,
  icon = null,
  trend = null,
  trendDirection = null,
  trendLabel = 'vs last period',
  subtext = null,
  accentColor = null,
  className = '',
  style,
  onClick,
}) => {
  const isPositive = trendDirection === 'up' || (typeof trend === 'string' && trend.startsWith('+'));
  const isNegative = trendDirection === 'down' || (typeof trend === 'string' && trend.startsWith('-'));

  return (
    <Card
      onClick={onClick}
      hoverable={!!onClick}
      className={`ui-stat-card ${className}`}
      style={style}
    >
      <div className="ui-stat-card-top">
        <span className="ui-stat-card-title">{title}</span>
        {icon && (
          <div
            className="ui-stat-card-icon"
            style={
              accentColor
                ? { backgroundColor: `${accentColor}15`, color: accentColor }
                : undefined
            }
          >
            {icon}
          </div>
        )}
      </div>

      <div className="ui-stat-card-value-row">
        <span className="ui-stat-card-value">{value}</span>
      </div>

      {(trend || subtext) && (
        <div className="ui-stat-card-meta">
          {trend && (
            <span
              className={`ui-stat-card-trend ${
                isPositive ? 'is-positive' : isNegative ? 'is-negative' : ''
              }`}
            >
              {isPositive && <LuTrendingUp size={14} />}
              {isNegative && <LuTrendingDown size={14} />}
              {trend}
            </span>
          )}
          {trendLabel && trend && (
            <span className="ui-stat-card-subtext">{trendLabel}</span>
          )}
          {subtext && !trend && (
            <span className="ui-stat-card-subtext">{subtext}</span>
          )}
        </div>
      )}
    </Card>
  );
};

export default StatCard;
