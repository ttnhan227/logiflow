import React, { useState, useEffect, useRef } from 'react';
import '../common/ChatPopup.css';
import { chatService } from '../../services';
import notificationClient from '../../services/notificationClient';

const OrderChatPopup = ({ orderId, customerId, order }) => {
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

  // Load chat history
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

  // Subscribe to WebSocket order chat updates
  useEffect(() => {
    if (!orderId) return;

    let mounted = true;

    const handleOrderChatMessage = (notification) => {
      if (!mounted) return;
      // Check if this is a chat message for our order
      const metaOrderId = Number(notification.metadata?.orderId);
      if (notification.type === 'ORDER_CHAT' && metaOrderId === Number(orderId)) {
        const loadUpdatedHistory = async () => {
          try {
            const msgs = await chatService.getOrderMessages(Number(orderId));
            if (mounted) {
              setMessages(Array.isArray(msgs) ? msgs : []);

              // Increment unread count when popup is not fully open
              if (!isOpen || isMinimized) {
                setUnreadCount(c => c + 1);
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

      // Reload message history after sending
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

  const toggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      setUnreadCount(0);
    } else {
      setIsOpen(false);
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      setUnreadCount(0);
    }
  };

  if (!order?.customerName || !customerId) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className={`chat-float-button ${isOpen ? 'active' : ''}`}
        onClick={toggleOpen}
        title="Chat with Customer"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {unreadCount > 0 && (
          <span className="chat-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* Chat Popup Window */}
      <div className={`chat-popup ${isOpen ? 'open' : ''} ${isMinimized ? 'minimized' : ''}`}>
        <div className="chat-header">
          <div className="chat-header-info">
            <h3>Chat with Customer</h3>
            <span className="chat-trip-id">Order #{orderId}</span>
          </div>
          <div className="chat-header-actions">
            <button
              className="chat-header-btn"
              onClick={toggleMinimize}
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
            </button>
            <button
              className="chat-header-btn"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="chat-messages">
              {loading && (
                <div className="chat-loading">Loading messages...</div>
              )}
              {!loading && messages.length === 0 && (
                <div className="chat-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <p>No messages yet</p>
                  <span>Start chatting with the customer</span>
                </div>
              )}
              {messages.map((msg) => {
                const isCustomer = msg.senderRole?.toUpperCase() === 'CUSTOMER' || 
                                msg.senderRole?.toUpperCase() === 'ROLE_CUSTOMER';
                return (
                  <div key={msg.messageId} className={`chat-message ${isCustomer ? 'driver' : 'dispatcher'}`}>
                    <div className="message-bubble">
                      <div className="message-content">{msg.content}</div>
                      <div className="message-meta">
                        <span className="message-sender">
                          {isCustomer ? '👤 Customer' : '📋 Dispatcher'}
                        </span>
                        <span className="message-time">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {error && (
              <div className="chat-error">{error}</div>
            )}

            <div className="chat-input-container">
              <input
                type="text"
                className="chat-input"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!inputText.trim()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default OrderChatPopup;
