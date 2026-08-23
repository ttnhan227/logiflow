import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../../services';
import notificationClient from '../../services/notificationClient';
import { Button, Input, Badge } from '@/components/ui';
import {
  LuMessageSquare,
  LuSend,
  LuMinimize2,
  LuMaximize2,
  LuX,
  LuUser,
} from 'react-icons/lu';

export const OrderChatPopup = ({ orderId, customerId, order }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (!orderId || !isOpen) return;

    const loadHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const msgs = await chatService.getOrderMessages(Number(orderId));
        setMessages(Array.isArray(msgs) ? msgs : []);
        setUnreadCount(0);
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [orderId, isOpen]);

  useEffect(() => {
    if (!orderId) return;
    let mounted = true;

    const handleOrderChatMessage = (notification) => {
      if (!mounted) return;
      const metaOrderId = Number(notification.metadata?.orderId);
      if (notification.type === 'ORDER_CHAT' && metaOrderId === Number(orderId)) {
        const loadUpdatedHistory = async () => {
          try {
            const msgs = await chatService.getOrderMessages(Number(orderId));
            if (mounted) {
              setMessages(Array.isArray(msgs) ? msgs : []);
              if (!isOpen || isMinimized) {
                setUnreadCount((c) => c + 1);
              }
            }
          } catch (e) {
            console.warn('Failed to reload order chat history', e);
          }
        };
        loadUpdatedHistory();
      }
    };

    notificationClient.addListener(handleOrderChatMessage);

    return () => {
      mounted = false;
      notificationClient.removeListener(handleOrderChatMessage);
    };
  }, [orderId, isOpen, isMinimized]);

  const handleSend = async () => {
    const content = inputText.trim();
    if (!content) return;

    setError(null);
    try {
      await chatService.sendOrderMessage({ orderId: Number(orderId), content });
      setInputText('');

      const msgs = await chatService.getOrderMessages(Number(orderId));
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!order?.customerName || !customerId) {
    return null;
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
          setUnreadCount(0);
        }}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '88px',
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-brand-600)',
          color: 'var(--color-white)',
          border: 'none',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 'var(--z-fixed)',
          transition: 'transform var(--transition-fast)',
        }}
        title="Chat with Customer"
      >
        <LuMessageSquare size={22} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: 'var(--color-danger-600)',
              color: 'var(--color-white)',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '84px',
            right: '88px',
            width: '360px',
            height: isMinimized ? '48px' : '480px',
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 'var(--z-modal)',
            transition: 'height 180ms ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-slate-900)',
              color: 'var(--color-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LuMessageSquare size={16} color="var(--color-brand-500)" />
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, lineHeight: 1.2 }}>
                  Customer Chat
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-slate-400)' }}>
                  Order #{orderId}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-slate-400)', cursor: 'pointer' }}
              >
                {isMinimized ? <LuMaximize2 size={14} /> : <LuMinimize2 size={14} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-slate-400)', cursor: 'pointer' }}
              >
                <LuX size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message Feed */}
              <div
                style={{
                  flex: 1,
                  padding: '16px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                }}
              >
                {loading && (
                  <div style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Loading conversation...
                  </div>
                )}

                {!loading && messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: '40px' }}>
                    No messages yet. Send a direct message to the customer regarding this order.
                  </div>
                )}

                {messages.map((msg) => {
                  const isCustomer =
                    msg.senderRole?.toUpperCase() === 'CUSTOMER' ||
                    msg.senderRole?.toUpperCase() === 'ROLE_CUSTOMER';

                  return (
                    <div
                      key={msg.messageId}
                      style={{
                        alignSelf: isCustomer ? 'flex-start' : 'flex-end',
                        maxWidth: '82%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-lg)',
                          backgroundColor: isCustomer ? 'var(--color-white)' : 'var(--color-brand-600)',
                          color: isCustomer ? 'var(--text-primary)' : 'var(--color-white)',
                          border: isCustomer ? '1px solid var(--border-default)' : 'none',
                          fontSize: 'var(--text-xs)',
                          lineHeight: 1.4,
                        }}
                      >
                        {msg.content}
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          alignSelf: isCustomer ? 'flex-start' : 'flex-end',
                        }}
                      >
                        {isCustomer ? 'Customer' : 'Dispatcher'} •{' '}
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input row */}
              <div style={{ padding: '12px', borderTop: '1px solid var(--border-default)', display: 'flex', gap: '8px', backgroundColor: 'var(--color-white)' }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    fontSize: 'var(--text-xs)',
                    outline: 'none',
                  }}
                />
                <Button variant="primary" size="sm" onClick={handleSend} disabled={!inputText.trim()}>
                  <LuSend size={14} />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default OrderChatPopup;
