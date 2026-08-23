import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { LuFileQuestion, LuArrowLeft } from 'react-icons/lu';

export const NotFoundPage = () => {
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
          backgroundColor: 'var(--color-slate-150)',
          color: 'var(--color-brand-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <LuFileQuestion size={32} />
      </div>

      <span
        style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          color: 'var(--color-brand-600)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}
      >
        Error 404
      </span>

      <h1
        style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--text-primary)',
          margin: '0 0 8px 0',
        }}
      >
        Page Not Found
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
        The page you are looking for might have been moved, deleted, or does not exist on LogiFlow.
      </p>

      <Link to="/">
        <Button variant="primary" leftIcon={<LuArrowLeft size={16} />}>
          Return to Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
