import React from 'react';
import { Card } from './Card';
import { LuTrendingUp, LuTrendingDown } from 'react-icons/lu';

export const StatCard = ({
  title,
  value,
  icon = null,
  trend = null, // e.g. "+12.5%" or "-3.2%" or number
  trendDirection = null, // 'up' | 'down' | 'neutral'
  trendLabel = 'vs last period',
  subtext = null,
  accentColor = null,
  className = '',
  style = {},
  onClick,
}) => {
  const isPositive = trendDirection === 'up' || (typeof trend === 'string' && trend.startsWith('+'));
  const isNegative = trendDirection === 'down' || (typeof trend === 'string' && trend.startsWith('-'));

  return (
    <Card
      onClick={onClick}
      hoverable={!!onClick}
      className={`ui-stat-card ${className}`}
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {title}
        </span>
        {icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: accentColor ? `${accentColor}15` : 'var(--color-slate-100)',
              color: accentColor || 'var(--color-slate-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
      </div>

      {(trend || subtext) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)' }}>
          {trend && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontWeight: 600,
                color: isPositive
                  ? 'var(--color-success-600)'
                  : isNegative
                  ? 'var(--color-danger-600)'
                  : 'var(--text-secondary)',
              }}
            >
              {isPositive && <LuTrendingUp size={14} />}
              {isNegative && <LuTrendingDown size={14} />}
              {trend}
            </span>
          )}
          {trendLabel && trend && (
            <span style={{ color: 'var(--text-muted)' }}>{trendLabel}</span>
          )}
          {subtext && !trend && (
            <span style={{ color: 'var(--text-secondary)' }}>{subtext}</span>
          )}
        </div>
      )}
    </Card>
  );
};

export default StatCard;
