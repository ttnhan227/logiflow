import 'package:shared_preferences/shared_preferences.dart';

class NotificationService {
  String? _driverId;
  Function(Map<String, dynamic>)? onNotificationReceived;
  bool _isConnected = false;

  Future<void> connect(String driverId) async {
    _driverId = driverId;

    // Get JWT token from shared preferences (using correct key)
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    if (token == null) {
      print('No JWT token found');
      return;
    }

    try {
      // Notification service initialized
      // Note: For production, implement proper WebSocket/STOMP connection
      // For now, this is a placeholder that can be extended with proper STOMP client
      print('Notification service initialized for driver: $_driverId');
      _isConnected = true;
      
      // Simulate receiving notifications for testing
      // In production, this would listen to WebSocket messages
    } catch (e) {
      print('Error connecting to notification service: $e');
      _isConnected = false;
    }
  }

  void disconnect() {
    _isConnected = false;
    print('Notification service disconnected');
  }

  bool get isConnected => _isConnected;
  
  // Method to manually trigger notification (for testing or polling-based approach)
  void simulateNotification(Map<String, dynamic> notification) {
    if (onNotificationReceived != null) {
      onNotificationReceived!(notification);
    }
  }
}
