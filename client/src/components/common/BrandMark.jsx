import React from 'react';
import { LuTruck } from 'react-icons/lu';

export const BrandMark = ({ theme = 'dark', size = 'md' }) => {
  const isDark = theme === 'dark';
  const boxSize = size === 'lg' ? 40 : 36;
  const iconSize = size === 'lg' ? 22 : 20;
  const fontSize = size === 'lg' ? '22px' : '20px';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '9px' }}>
      <span
        aria-hidden="true"
        style={{
          width: `${boxSize}px`,
          height: `${boxSize}px`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-route-orange)',
          border: isDark
            ? '1px solid rgba(255, 103, 20, 0.35)'
            : '1px solid rgba(255, 103, 20, 0.45)',
          borderRadius: '8px',
          backgroundColor: isDark
            ? 'rgba(255, 103, 20, 0.08)'
            : 'rgba(255, 103, 20, 0.1)',
        }}
      >
        <LuTruck size={iconSize} />
      </span>
      <span
        style={{
          color: isDark ? 'var(--color-white)' : 'var(--color-asphalt)',
          fontSize,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        LOGI<span style={{ color: 'var(--color-route-orange)' }}>FLOW</span>
      </span>
    </span>
  );
};

export default BrandMark;
