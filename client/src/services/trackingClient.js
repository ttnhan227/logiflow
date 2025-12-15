import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class TrackingClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.subscriptions = new Map();
  }

  connect() {
    if (this.isConnected) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const backendUrl = 'http://localhost:8080';
      const socketUrl = `${backendUrl}/ws/tracking`;

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

  subscribeToTripLocation(tripId, onMessage) {
    if (!this.client || !this.isConnected) throw new Error('TrackingClient not connected');
    const topic = `/topic/trips/${tripId}/location`;
    if (this.subscriptions.has(topic)) return;

    const sub = this.client.subscribe(topic, (msg) => {
      try {
        onMessage(JSON.parse(msg.body));
      } catch {
        onMessage(null);
      }
    });

    this.subscriptions.set(topic, sub);
  }

  unsubscribeTripLocation(tripId) {
    const topic = `/topic/trips/${tripId}/location`;
    const sub = this.subscriptions.get(topic);
    if (sub) sub.unsubscribe();
    this.subscriptions.delete(topic);
  }
}

export default new TrackingClient();
