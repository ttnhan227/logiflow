import 'dart:async';
import 'dart:convert';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api_client.dart';

class GpsTrackingService {
  Stream<Position>? _positionStream;
  StreamSubscription<Position>? _positionSubscription;
  String? _tripId;
  String? _driverId;
  Timer? _locationTimer;
  final ApiClient _apiClient = ApiClient();
  bool _isTracking = false;

  Future<void> connectAndStartTracking({required String tripId, required String driverId}) async {
    _tripId = tripId;
    _driverId = driverId;
    
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token');
    if (token == null) throw Exception('No JWT token found');

    print('Starting GPS tracking for trip: $tripId, driver: $driverId');
    _isTracking = true;
    _startSendingLocation();
  }

  void _startSendingLocation() {
    // Start streaming location updates
    _positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high, 
        distanceFilter: 10, // Update every 10 meters
      ),
    );
    
    _positionSubscription = _positionStream!.listen(
      (Position position) {
        if (_isTracking) {
          _sendLocation(position.latitude, position.longitude);
        }
      },
      onError: (error) {
        print('GPS tracking error: $error');
      },
    );
  }

  Future<void> _sendLocation(double latitude, double longitude) async {
    if (!_isTracking) return;
    
    try {
      final location = {
        'latitude': latitude,
        'longitude': longitude,
      };
      
      // Send location update via REST API instead of WebSocket
      await _apiClient.post(
        '/driver/me/location',
        body: location,
      );
      
      print('Location sent: lat=$latitude, lng=$longitude');
    } catch (e) {
      print('Error sending location: $e');
    }
  }

  void disconnect() {
    _isTracking = false;
    _positionSubscription?.cancel();
    _locationTimer?.cancel();
    _positionStream = null;
    print('GPS tracking stopped');
  }
  
  bool get isTracking => _isTracking;
}
