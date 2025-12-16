import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import authService from './auth/authService';

class NotificationClient {
  constructor() {
    this.client = null;
    this.subscriptions = [];
    this.listeners = [];
    this.isConnected = false;
    this.connectPromise = null;
  }

  connect() {
    if (this.isConnected) {
      console.log('Already connected to notification service');
      return Promise.resolve();
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise((resolve, reject) => {
      // Use the same backend URL as API, but for WebSocket
      const backendUrl = 'http://localhost:8080'; // Match api.js baseURL
      const socketUrl = `${backendUrl}/ws/notifications`;

      console.log('Connecting to SockJS:', socketUrl);
      const socket = new SockJS(socketUrl);

      // Determine topic based on user role
      const user = authService.getCurrentUser();
      const topic = user?.role === 'DISPATCHER' ? '/topic/dispatcher/notifications' : '/topic/admin/notifications';

      this.client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: () => {
          console.log('Connected to notification service');
          this.isConnected = true;

          // Clear any existing subscriptions before re-subscribing
          try {
            this.subscriptions.forEach(sub => {
              try { sub.unsubscribe(); } catch (e) {}
            });
          } finally {
            this.subscriptions = [];
          }

          // Subscribe to role-specific notifications topic
          console.log('Subscribing to', topic);
          if (!this.client || !this.client.connected) {
            console.error('STOMP client not connected when attempting to subscribe');
            this.isConnected = false;
            this.connectPromise = null;
            reject(new Error('STOMP client not connected'));
            return;
          }

          const subscription = this.client.subscribe(topic, (message) => {
            console.log('Received message:', message.body);
            try {
              const notification = JSON.parse(message.body);
              console.log('Parsed notification:', notification);
              this.notifyListeners(notification);
            } catch (e) {
              console.error('Error parsing notification:', e);
            }
          });

          this.subscriptions.push(subscription);
          this.connectPromise = null;
          resolve();
        },

        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          this.isConnected = false;
          this.connectPromise = null;
          reject(frame);
        },

        onDisconnect: () => {
          console.log('Disconnected from notification service');
          this.isConnected = false;
          this.connectPromise = null;
        },

        onWebSocketError: (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          this.connectPromise = null;
          reject(error);
        }
      });

      this.client.activate();

      // Timeout after 5 seconds if connection not established
      setTimeout(() => {
        if (!this.isConnected) {
          console.error('Connection timeout');
          this.connectPromise = null;
          reject(new Error('WebSocket connection timeout'));
        }
      }, 5000);
    });

    return this.connectPromise;
  }

  disconnect() {
    if (this.client) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions = [];
      this.client.deactivate();
      this.isConnected = false;
      this.connectPromise = null;
      console.log('Disconnected from notification service');
    }
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  notifyListeners(notification) {
    this.listeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Allow other parts of the app to push a notification
   * (e.g., chat popup raising a bell badge for driver messages)
   */
  push(notification) {
    // Ensure required fields exist
    const enriched = {
      id: notification.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: notification.type || 'TRIP_CHAT',
      severity: notification.severity || 'INFO',
      title: notification.title || 'New chat message',
      message: notification.message || '',
      actionUrl: notification.actionUrl || null,
      actionLabel: notification.actionLabel || null,
      timestamp: notification.timestamp || new Date().toISOString(),
      isRead: false,
      metadata: notification.metadata || null,
    };
    this.notifyListeners(enriched);
  }
}

export default new NotificationClient();