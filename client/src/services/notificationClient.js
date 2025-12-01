import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class NotificationClient {
  constructor() {
    this.client = null;
    this.subscriptions = [];
    this.listeners = [];
    this.isConnected = false;
  }

  connect(token) {
    if (this.isConnected) {
      console.log('Already connected to notification service');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const socket = new SockJS('http://localhost:8080/ws/notifications');
      
      this.client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        
        onConnect: () => {
          console.log('Connected to notification service');
          this.isConnected = true;
          
          // Subscribe to admin notifications topic
          const subscription = this.client.subscribe('/topic/admin/notifications', (message) => {
            const notification = JSON.parse(message.body);
            this.notifyListeners(notification);
          });
          
          this.subscriptions.push(subscription);
          resolve();
        },
        
        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          this.isConnected = false;
          reject(frame);
        },
        
        onDisconnect: () => {
          console.log('Disconnected from notification service');
          this.isConnected = false;
        }
      });

      this.client.activate();
    });
  }

  disconnect() {
    if (this.client) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions = [];
      this.client.deactivate();
      this.isConnected = false;
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
}

export default new NotificationClient();
