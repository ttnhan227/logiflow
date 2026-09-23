import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent, Badge, PageHeader } from '@/components/ui';
import {
  LuChevronDown,
  LuCircleHelp,
  LuPhone,
  LuMail,
  LuArrowRight,
  LuPackage,
  LuTruck,
  LuBuilding2,
  LuFileText,
} from 'react-icons/lu';

export const FaqPage = () => {
  const [openItems, setOpenItems] = useState(new Set(['0-0', '1-0']));
  const [activeCategory, setActiveCategory] = useState('All');

  const toggleItem = (key) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const faqCategories = [
    {
      name: 'Project Scope',
      icon: <LuPackage size={16} />,
      items: [
        {
          question: 'What is LogiFlow?',
          answer:
            'LogiFlow is an academic full-stack project that demonstrates freight orders, trip assignment, driver location updates, proof of delivery, and billing. It is not a live carrier or commercial logistics service.',
        },
        {
          question: 'Are the hubs, routes, and contacts real?',
          answer:
            'No. Public maps and route examples use sample Vietnamese locations to demonstrate the interface; they do not represent an operating network.',
        },
        {
          question: 'Can I create a demonstration account?',
          answer:
            'The registration screens support the project roles used by the customer, driver, and administrator workflows. Do not enter sensitive production data.',
        },
      ],
    },
    {
      name: 'Freight & Shipping',
      icon: <LuTruck size={16} />,
      items: [
        {
          question: 'What vehicle data does the project model?',
          answer:
            'The sample data includes several vehicle classes and capacities so the assignment logic can compare driver licenses, vehicle capacity, availability, and distance.',
        },
        {
          question: 'How do GPS updates and digital proof of delivery (e-POD) work?',
          answer:
            'The driver client sends trip-scoped coordinates over the backend, and authorized web clients receive location updates through WebSockets. The mobile workflow also captures a recipient signature at delivery.',
        },
        {
          question: 'Does the project provide transport or cargo insurance?',
          answer:
            'No. LogiFlow does not transport cargo, sell insurance, or process claims.',
        },
      ],
    },
    {
      name: 'Driver Partners',
      icon: <LuFileText size={16} />,
      items: [
        {
          question: 'How does driver onboarding work in the demo?',
          answer:
            'A user submits driver and vehicle details. Mistral OCR can extract fields from a license image, but an administrator still reviews the submitted data; the project does not authenticate a government document or run a background check.',
        },
        {
          question: 'Does the mobile app pay drivers?',
          answer:
            'No. There is no real driver payout or bank-transfer integration.',
        },
      ],
    },
    {
      name: 'API & Billing',
      icon: <LuBuilding2 size={16} />,
      items: [
        {
          question: 'What API does the application use?',
          answer:
            'The React and Flutter clients call a Spring Boot REST API. The repository does not claim a production ERP, WMS, SAP, or public webhook integration.',
        },
        {
          question: 'How does billing work?',
          answer:
            'The application can generate invoice PDFs and open a PayPal sandbox checkout. It does not collect live freight payments or offer commercial service-level agreements.',
        },
      ],
    },
  ];

  const filteredCategories =
    activeCategory === 'All'
      ? faqCategories
      : faqCategories.filter((c) => c.name === activeCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '36px 0 64px 0' }}>
      <div className="container">
        <PageHeader
          badge={<Badge variant="brand">Project FAQ</Badge>}
          title="Frequently Asked Questions"
          description="Clear boundaries between the implemented demonstration and services the project does not provide."
        />
      </div>

      {/* Category Filter Pills */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveCategory('All')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--border-default)',
              backgroundColor: activeCategory === 'All' ? 'var(--color-brand-600)' : 'var(--color-white)',
              color: activeCategory === 'All' ? 'var(--color-white)' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
          >
            All Questions
          </button>
          {faqCategories.map((c) => (
            <button
              key={c.name}
              onClick={() => setActiveCategory(c.name)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid var(--border-default)',
                backgroundColor: activeCategory === c.name ? 'var(--color-brand-600)' : 'var(--color-white)',
                color: activeCategory === c.name ? 'var(--color-white)' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {c.icon}
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* FAQ Accordion List */}
      <section className="container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {filteredCategories.map((cat, catIdx) => (
            <div key={cat.name} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: 0 }}>
                {cat.name}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {cat.items.map((item, itemIdx) => {
                  const key = `${catIdx}-${itemIdx}`;
                  const isOpen = openItems.has(key);

                  return (
                    <Card
                      key={item.question}
                      style={{
                        border: isOpen ? '1px solid var(--color-brand-200)' : '1px solid var(--border-default)',
                        backgroundColor: 'var(--bg-surface)',
                      }}
                    >
                      <button
                        onClick={() => toggleItem(key)}
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          backgroundColor: 'transparent',
                        }}
                      >
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.question}
                        </span>
                        <LuChevronDown
                          size={18}
                          style={{
                            transform: isOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 180ms ease',
                            color: isOpen ? 'var(--color-brand-600)' : 'var(--color-slate-400)',
                            flexShrink: 0,
                          }}
                        />
                      </button>

                      {isOpen && (
                        <div
                          style={{
                            padding: '0 20px 16px 20px',
                            borderTop: '1px solid var(--border-subtle)',
                            paddingTop: '14px',
                          }}
                        >
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still Have Questions CTA */}
      <section className="container">
        <div
          style={{
            padding: '36px',
            backgroundColor: 'var(--color-slate-900)',
            color: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-white)', margin: '0 0 4px 0' }}>
              Still have specific questions?
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-300)', margin: 0 }}>
              LogiFlow has no live dispatch desk. Use the repository issue tracker for project questions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/contact">
              <Button variant="primary">View Form Demo</Button>
            </Link>
            <Link to="/about">
              <Button
                variant="outline"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: 'var(--color-slate-700)',
                  color: 'var(--color-white)',
                }}
              >
                About the Project
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FaqPage;
