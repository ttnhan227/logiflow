import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class ChatClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.subscriptions = new Map();
  }

  connect() {
    if (this.isConnected) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const backendUrl = 'http://localhost:8080';
      // reuse notifications endpoint for chat messages as well (same broker)
      const socketUrl = `${backendUrl}/ws/notifications`;

      const socket = new SockJS(socketUrl);
      this.client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          this.isConnected = true;
          resolve();
        },
        onStompError: (frame) => {
          this.isConnected = false;
          reject(frame);
        },
        onWebSocketError: (err) => {
          this.isConnected = false;
          reject(err);
        },
        onDisconnect: () => {
          this.isConnected = false;
        },
      });

      this.client.activate();

      setTimeout(() => {
        if (!this.isConnected) reject(new Error('WebSocket connection timeout'));
      }, 5000);
    });
  }

  disconnect() {
    if (this.client) {
      for (const sub of this.subscriptions.values()) sub.unsubscribe();
      this.subscriptions.clear();
      this.client.deactivate();
      this.isConnected = false;
    }
  }

  subscribeToDriverChat(driverUsername, onMessage) {
    if (!this.client || !this.isConnected) throw new Error('ChatClient not connected');

    // We piggyback on driver notification topic; CHAT messages have type=CHAT
    const topic = `/topic/driver/${driverUsername}`;
    if (this.subscriptions.has(topic)) return;

    const sub = this.client.subscribe(topic, (msg) => {
      try {
        const data = JSON.parse(msg.body);
        onMessage(data);
      } catch {
        onMessage(null);
      }
    });

    this.subscriptions.set(topic, sub);
  }

  unsubscribeToDriverChat(driverUsername) {
    const topic = `/topic/driver/${driverUsername}`;
    const sub = this.subscriptions.get(topic);
    if (sub) sub.unsubscribe();
    this.subscriptions.delete(topic);
  }
}

export default new ChatClient();
