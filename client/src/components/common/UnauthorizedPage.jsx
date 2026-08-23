import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { LuShieldAlert, LuArrowLeft } from 'react-icons/lu';

export const UnauthorizedPage = () => {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--color-danger-50)',
          color: 'var(--color-danger-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <LuShieldAlert size={32} />
      </div>

      <span
        style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          color: 'var(--color-danger-600)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}
      >
        Error 403
      </span>

      <h1
        style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--text-primary)',
          margin: '0 0 8px 0',
        }}
      >
        Access Restricted
      </h1>

      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          maxWidth: '440px',
          margin: '0 0 24px 0',
          lineHeight: 1.5,
        }}
      >
        You do not have the required operational permissions or role clearance to access this resource.
      </p>

      <Link to="/">
        <Button variant="primary" leftIcon={<LuArrowLeft size={16} />}>
          Back to Safe Ground
        </Button>
      </Link>
    </div>
  );
};

export default UnauthorizedPage;
