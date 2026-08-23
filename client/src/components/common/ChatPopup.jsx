import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../../services';
import notificationClient from '../../services/notificationClient';
import { LuMessageSquare, LuSend, LuMinus, LuMaximize2, LuX, LuTruck, LuUser, LuLoaderCircle } from 'react-icons/lu';

export const ChatPopup = ({ tripId, driverId }) => {
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
    if (!tripId || !isOpen) return;

    const loadHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const msgs = await chatService.getTripMessages(Number(tripId));
        setMessages(Array.isArray(msgs) ? msgs : []);
        setUnreadCount(0);
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [tripId, isOpen]);

  useEffect(() => {
    if (!driverId) return;

    let mounted = true;

    const handleDriverMessage = (notification) => {
      if (!mounted) return;
      if (notification.type === 'TRIP_CHAT' && notification.metadata?.tripId === tripId) {
        const loadUpdatedHistory = async () => {
          try {
            const msgs = await chatService.getTripMessages(Number(tripId));
            if (mounted) {
              setMessages(Array.isArray(msgs) ? msgs : []);
              if (!isOpen || isMinimized) {
                setUnreadCount((c) => c + 1);
              }
            }
          } catch (e) {
            console.warn('Failed to reload chat history', e);
          }
        };
        loadUpdatedHistory();
      }
    };

    notificationClient.addListener(handleDriverMessage);

    return () => {
      mounted = false;
      notificationClient.removeListener(handleDriverMessage);
    };
  }, [driverId, tripId, isOpen, isMinimized]);

  const handleSend = async () => {
    const content = inputText.trim();
    if (!content) return;

    setError(null);
    try {
      await chatService.sendMessage({ tripId: Number(tripId), content });
      setInputText('');
      const msgs = await chatService.getTripMessages(Number(tripId));
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

  if (!driverId) {
    return null;
  }

  return (
    <>
      {/* Floating Launcher */}
      <button
        onClick={toggleOpen}
        title="Chat with Assigned Driver"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
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
          zIndex: 999,
          transition: 'transform var(--transition-fast)',
        }}
      >
        <LuMessageSquare size={22} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '20px',
              height: '20px',
              padding: '0 4px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-danger-600)',
              color: 'var(--color-white)',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--color-white)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dialog Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '84px',
            right: '24px',
            width: '340px',
            maxHeight: isMinimized ? '48px' : '480px',
            height: isMinimized ? '48px' : '440px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            transition: 'all var(--transition-base)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--color-slate-900)',
              color: 'var(--color-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LuTruck size={14} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, lineHeight: 1.2 }}>
                  Driver Dispatch Comm
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-slate-300)' }}>
                  Trip #{tripId}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button
                onClick={toggleMinimize}
                title={isMinimized ? 'Maximize' : 'Minimize'}
                style={{
                  padding: '4px',
                  color: 'var(--color-slate-300)',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {isMinimized ? <LuMaximize2 size={13} /> : <LuMinus size={13} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                style={{
                  padding: '4px',
                  color: 'var(--color-slate-300)',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <LuX size={14} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Body */}
              <div
                style={{
                  flex: 1,
                  padding: '12px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  backgroundColor: 'var(--bg-app)',
                }}
              >
                {loading && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                    <LuLoaderCircle size={18} className="animate-spin" />
                  </div>
                )}

                {!loading && messages.length === 0 && (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                    <p style={{ margin: 0 }}>No messages exchanged yet.</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>Type below to send an operational dispatch note.</p>
                  </div>
                )}

                {messages.map((msg) => {
                  const isDriver = msg.senderRole?.toUpperCase() === 'DRIVER' ||
                                  msg.senderUsername?.toLowerCase().includes('driver');
                  return (
                    <div
                      key={msg.messageId}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isDriver ? 'flex-start' : 'flex-end',
                        maxWidth: '85%',
                        alignSelf: isDriver ? 'flex-start' : 'flex-end',
                      }}
                    >
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: isDriver
                            ? 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-xs)'
                            : 'var(--radius-lg) var(--radius-lg) var(--radius-xs) var(--radius-lg)',
                          backgroundColor: isDriver ? 'var(--color-white)' : 'var(--color-brand-600)',
                          color: isDriver ? 'var(--text-primary)' : 'var(--color-white)',
                          fontSize: 'var(--text-xs)',
                          lineHeight: 1.4,
                          boxShadow: 'var(--shadow-xs)',
                          border: isDriver ? '1px solid var(--border-default)' : 'none',
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.content}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '2px',
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span>{isDriver ? 'Driver' : 'Dispatch'}</span>
                        <span>•</span>
                        <span>
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {error && (
                <div
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    color: 'var(--color-danger-700)',
                    backgroundColor: 'var(--color-danger-50)',
                    borderTop: '1px solid var(--color-danger-200)',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Input Footer */}
              <div
                style={{
                  padding: '8px 10px',
                  borderTop: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <input
                  type="text"
                  placeholder="Type message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  style={{
                    flex: 1,
                    height: '32px',
                    padding: '0 10px',
                    fontSize: 'var(--text-xs)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    outline: 'none',
                    backgroundColor: 'var(--color-white)',
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-brand-600)',
                    color: 'var(--color-white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                    opacity: inputText.trim() ? 1 : 0.5,
                  }}
                >
                  <LuSend size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatPopup;
