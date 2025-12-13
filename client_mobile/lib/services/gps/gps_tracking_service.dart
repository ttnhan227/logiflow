import 'dart:async';
import 'package:geolocator/geolocator.dart';
import '../api_client.dart';

class GpsTrackingService {
  Stream<Position>? _positionStream;
  StreamSubscription<Position>? _positionSubscription;
  Timer? _locationTimer;
  final ApiClient _apiClient = ApiClient();
  bool _isTracking = false;
  String? _tripId;
  String? _driverId;
  DateTime? _lastLocationUpdate;

  Future<void> connectAndStartTracking(String tripId, [String? driverId]) async {
    if (_isTracking && _tripId == tripId) return; // Already tracking this trip

    _tripId = tripId;
    _driverId = driverId ?? '';

    print('Starting GPS tracking for trip: $tripId (driver: $_driverId)');
    _isTracking = true;
    await _requestLocationPermission();
    _startSendingLocation();
  }

  Future<void> _requestLocationPermission() async {
    LocationPermission permission = await Geolocator.checkPermission();

    print('Location permission status: $permission');

    if (permission == LocationPermission.denied) {
      print('Requesting location permission...');
      permission = await Geolocator.requestPermission();
      print('Location permission after request: $permission');
    }

    if (permission == LocationPermission.denied) {
      throw Exception('Location permissions are denied');
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception('Location permissions are permanently denied. Please enable location permissions in your device settings.');
    }

    // For Android 12+, request background location permission
    if (await Geolocator.isLocationServiceEnabled()) {
      LocationPermission bgPermission = await Geolocator.checkPermission();
      if (bgPermission != LocationPermission.always) {
        print('Requesting background location permission...');
        bgPermission = await Geolocator.requestPermission();
        print('Background location permission: $bgPermission');
      }
    } else {
      throw Exception('Location services are disabled. Please enable location services.');
    }

    print('All location permissions granted');
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

    // Also send periodic updates (backup, in case position doesn't change much)
    _locationTimer = Timer.periodic(const Duration(seconds: 30), (timer) async {
      if (!_isTracking) return;

      try {
        Position position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );
        _sendLocation(position.latitude, position.longitude);
      } catch (e) {
        print('Error getting periodic location: $e');
      }
    });
  }

  Future<void> _sendLocation(double latitude, double longitude) async {
    if (!_isTracking) return;

    // Throttle updates - don't send more than once per 5 seconds
    final now = DateTime.now();
    if (_lastLocationUpdate != null &&
        now.difference(_lastLocationUpdate!).inSeconds < 5) return;

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

      _lastLocationUpdate = now;
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
    _tripId = null;
    _driverId = null;
    print('GPS tracking stopped');
  }

  bool get isTracking => _isTracking;
  String? get currentTripId => _tripId;
}

// Global instance
final gpsTrackingService = GpsTrackingService();
