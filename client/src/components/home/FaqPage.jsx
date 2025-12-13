import React, { useState } from 'react';

const FaqPage = () => {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const faqData = [
    {
      category: "General",
      questions: [
        {
          question: "What is LogiFlow?",
          answer: "LogiFlow is Vietnam's premier logistics and delivery platform connecting customers with reliable, licensed drivers for nationwide shipments. We provide end-to-end logistics solutions with real-time GPS tracking and professional delivery services."
        },
        {
          question: "What areas do you serve?",
          answer: "We provide comprehensive coverage across all of Vietnam, including North (Hanoi, Hai Phong), Central (Da Nang, Hue, Nha Trang), and Southern regions (Ho Chi Minh City, Can Tho). We serve 63 provinces and major cities with our extensive network of professional drivers."
        },
        {
          question: "How do I create an account?",
          answer: "Customers can download our mobile app from the App Store or Google Play Store. For businesses interested in enterprise solutions, contact our business development team directly."
        }
      ]
    },
    {
      category: "Shipping",
      questions: [
        {
          question: "What types of shipments do you handle?",
          answer: "We handle packages up to 30kg for standard deliveries, with specialized services for larger shipments. This includes documents, small parcels, electronics, clothing, perishables, and industrial goods. For oversized or heavy cargo, we recommend our business logistics solutions."
        },
        {
          question: "How long does delivery take?",
          answer: "Same-city deliveries: 1-3 business days\nInter-province deliveries: 2-5 business days\nExpress services: Same-day delivery available in select cities\nDelivery times depend on origin, destination, and service tier selected."
        },
        {
          question: "How much does shipping cost?",
          answer: "Costs vary based on distance, weight, and service type:\n- Standard delivery: From 25,000 VND\n- Express same-day: From 50,000 VND\n- Inter-province: From 100,000 VND\n- Business accounts receive volume discounts and dedicated pricing."
        },
        {
          question: "How do I track my package?",
          answer: "You can track your package in three ways:\n1. Use the tracking form on our website (/track)\n2. Check your delivery status in our mobile app\n3. Contact customer support at +84 1900-1234\nAll shipments include real-time GPS tracking updates."
        },
        {
          question: "What if my package gets lost or damaged?",
          answer: "All shipments are insured and protected. If an issue occurs, our experienced team investigates immediately. We process claims within 24 hours and provide compensation according to our insurance coverage. Contact support immediately if you suspect an issue."
        }
      ]
    },
    {
      category: "Drivers",
      questions: [
        {
          question: "How do I become a LogiFlow driver?",
          answer: "To join our driver network:\n1. Apply through our driver registration page\n2. Provide valid Vietnamese driver's license (A1, A2, B1, or higher)\n3. Complete our background verification process\n4. Attend driver orientation and training\n5. Complete vehicle inspection if applicable\n\nRequirements include being 18+ years old and having a clean driving record."
        },
        {
          question: "What vehicle types can I use?",
          answer: "Drivers can register:\n- Motorcycles (under 175cc) for urban deliveries\n- Vans and trucks for larger shipments\n- All vehicles must be properly licensed, insured, and pass our safety inspection\n- Eco-friendly and newer vehicles are preferred"
        },
        {
          question: "How much can I earn as a driver?",
          answer: "Driver earnings vary based on location, hours worked, and vehicle type:\n- Motorcycle drivers: 150,000 - 400,000 VND/day\n- Van drivers: 250,000 - 600,000 VND/day\n- Truck drivers: 300,000 - 800,000 VND/day\n\nEarnings depend on delivery volume, distance, and customer tips."
        },
        {
          question: "What support do you provide drivers?",
          answer: "We provide:\n- Weekly payments directly to your bank account\n- 24/7 driver support hotline\n- Mobile app with maps and customer details\n- Training and certification programs\n- Insurance coverage for work-related incidents\n- Performance bonuses and incentives"
        }
      ]
    },
    {
      category: "Business Solutions",
      questions: [
        {
          question: "What business services do you offer?",
          answer: "Our enterprise solutions include:\n- Dedicated account management\n- API integration for e-commerce platforms\n- Fleet management and analytics\n- White-label delivery services\n- Industrial and warehouse logistics\n- Specialized handling for pharmaceuticals, electronics, and perishables"
        },
        {
          question: "Do you offer API integration?",
          answer: "Yes! Our enterprise API allows seamless integration with:\n- E-commerce platforms (Shopify, WooCommerce, etc.)\n- WMS and ERP systems\n- Point-of-sale systems\n- Custom applications\n\nAPI documentation is available for approved business partners."
        },
        {
          question: "What are your SLA commitments?",
          answer: "Our business SLAs include:\n- 99.5% on-time delivery rate\n- Real-time tracking and status updates\n- 24/7 dedicated account management\n- Priority customer support\n- Detailed analytics and reporting\n- Guaranteed compensation for service failures"
        }
      ]
    }
  ];

  return (
    <div className="home-container">
      <div className="content-wrapper">
        <h1 className="page-title">
          Frequently Asked Questions
        </h1>
        <p className="page-subtitle">
          Find answers to common questions about LogiFlow's services and operations.
        </p>

        {faqData.map((category, categoryIndex) => (
          <div key={categoryIndex} className="faq-category">
            <h2 className="faq-category-title">
              {category.category}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {category.questions.map((faq, questionIndex) => {
                const itemIndex = `${categoryIndex}-${questionIndex}`;
                const isOpen = openItems.has(itemIndex);

                return (
                  <div key={questionIndex} className="faq-item">
                    <button
                      onClick={() => toggleItem(itemIndex)}
                      className="faq-question"
                    >
                      <span>{faq.question}</span>
                      <span className={`faq-arrow ${isOpen ? 'open' : ''}`}>
                        ▼
                      </span>
                    </button>

                    <div className={`faq-answer ${isOpen ? 'open' : ''}`}>
                      <div className="faq-answer-content">
                        {faq.answer.split('\n').map((line, index) => (
                          <p key={index} style={{ margin: '0.5rem 0' }}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div className="cta-section">
          <h2 className="cta-title">Still have questions?</h2>
          <p className="cta-description">
            Our support team is here to help you with any questions or concerns.
          </p>
          <div className="btn-group">
            <a href="/contact" className="btn btn-outline">
              Contact Support
            </a>
            <a href="tel:+8419001234" className="btn btn-ghost">
              Call +84 1900-1234
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
