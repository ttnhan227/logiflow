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
      name: 'General Logistics',
      icon: <LuPackage size={16} />,
      items: [
        {
          question: 'What is LogiFlow and how does the platform operate?',
          answer:
            'LogiFlow is an enterprise freight and dispatch platform in Vietnam. We unify multi-modal linehaul transport, automated dispatch operations, and live telemetry across all 63 provinces for manufacturers, shippers, and commercial fleets.',
        },
        {
          question: 'What provincial corridors and hub coverage does LogiFlow support?',
          answer:
            'We provide comprehensive nationwide coverage anchored by 3 primary sorting mega-terminals in Hanoi, Da Nang, and Ho Chi Minh City, connecting over 40 provincial cross-docking facilities.',
        },
        {
          question: 'How do enterprise shippers create an account?',
          answer:
            'Businesses can register online through our Corporate Registration portal or reach out directly to our Business Development team to discuss volume SLAs, custom rate cards, and billing terms.',
        },
      ],
    },
    {
      name: 'Freight & Shipping',
      icon: <LuTruck size={16} />,
      items: [
        {
          question: 'What cargo weight brackets and vehicle types are available?',
          answer:
            'We support everything from urban express parcels (up to 2 tons) to heavy linehaul full truckloads (5T, 10T, 15T, and 30T ISO container tractors). Specialized refrigerated units (-20°C to +15°C) are also available.',
        },
        {
          question: 'How do GPS updates and digital proof of delivery (e-POD) work?',
          answer:
            'Vehicles stream real-time telemetry coordinates to our cloud control tower. Upon handover, the driver collects recipient signatures and photos directly in the mobile app, generating instant timestamped e-POD PDF manifests.',
        },
        {
          question: 'What cargo insurance coverage is provided for transit?',
          answer:
            'All transported shipments are backstopped by comprehensive primary marine cargo risk policies up to 10 Billion VND, with dedicated 48-hour claims processing.',
        },
      ],
    },
    {
      name: 'Driver Partners',
      icon: <LuFileText size={16} />,
      items: [
        {
          question: 'What are the requirements to join as a driver partner?',
          answer:
            'Drivers must hold a valid commercial Vietnamese driving license (Class B2, C, D, or FC), maintain an active vehicle inspection certificate, pass background verification, and complete the LogiFlow onboarding safety briefing.',
        },
        {
          question: 'How are driver payout requests and settlements processed?',
          answer:
            'Drivers request direct digital bank payouts via their mobile application upon completing assigned trip manifests. Administrative review and bank transfers are executed on expedited cycles.',
        },
      ],
    },
    {
      name: 'Enterprise & API',
      icon: <LuBuilding2 size={16} />,
      items: [
        {
          question: 'Does LogiFlow support direct REST API / Webhook integration?',
          answer:
            'Yes. Our modern REST API enables automated bulk order injection, real-time rate queries, tracking webhooks, and digital invoice extraction directly from your ERP, WMS, or SAP instance.',
        },
        {
          question: 'What contractual Service Level Agreements (SLAs) do you offer?',
          answer:
            'Our corporate agreements guarantee 99.8% on-time transit windows, 15-minute key account priority dispatch response times, and automated contractual rebate credits for unexcused service disruptions.',
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
          badge={<Badge variant="brand">Knowledge Base</Badge>}
          title="Frequently Asked Questions"
          description="Everything you need to know about LogiFlow's nationwide freight network, carrier onboarding, pricing SLAs, and digital operations."
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
              Our operations dispatch desk is available 24/7 to assist with active cargo or enterprise setups.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/contact">
              <Button variant="primary">Contact Operational Support</Button>
            </Link>
            <a href="tel:+8419001234">
              <Button
                variant="outline"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: 'var(--color-slate-700)',
                  color: 'var(--color-white)',
                }}
              >
                Call Hotline: +84 1900-1234
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FaqPage;
