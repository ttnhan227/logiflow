import 'dart:async';
import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:stomp_dart_client/stomp_dart_client.dart';
import '../api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class GpsTrackingService {
  Stream<Position>? _positionStream;
  StreamSubscription<Position>? _positionSubscription;
  Timer? _locationTimer;
  final ApiClient _apiClient = ApiClient();
  StompClient? _stompClient;
  bool _isTracking = false;
  bool _isWebSocketConnected = false;
  Timer? _reconnectTimer;
  String? _tripId;
  String? _driverId;
  DateTime? _lastLocationUpdate;
  final Set<String> _loggedDisabledTrips = {}; // Track trips we've already logged as disabled
  DateTime? _lastGpsCheck; // Prevent excessive GPS checks

  Future<void> connectAndStartTracking(String tripId, [String? driverId]) async {
    // Rate limiting: Don't check GPS settings more than once every 5 seconds
    final now = DateTime.now();
    if (_lastGpsCheck != null && now.difference(_lastGpsCheck!).inSeconds < 5) {
      return; // Too frequent, ignore
    }
    _lastGpsCheck = now;

    if (_isTracking && _tripId == tripId) return; // Already tracking this trip

    _tripId = tripId;
    _driverId = driverId ?? '';

    // Check if GPS tracking is enabled in user settings
    final prefs = await SharedPreferences.getInstance();
    final gpsEnabled = prefs.getBool('gps_tracking_enabled') ?? true;

    if (!gpsEnabled) {
      // Only log once per trip to avoid log spam
      if (!_loggedDisabledTrips.contains(tripId)) {
        print('GPS tracking disabled in user settings - not starting tracking for trip: $tripId');
        _loggedDisabledTrips.add(tripId);
      }
      return;
    }

    print('Starting GPS tracking for trip: $tripId (driver: $_driverId)');
    _isTracking = true;

    // Start foreground service for Android (required for background GPS)
    if (Platform.isAndroid) {
      await _startForegroundService();
    }

    // Connect to WebSocket for GPS tracking
    try {
      await _connectWebSocket();
    } catch (e) {
      print('Failed to connect GPS WebSocket: $e');
      // Continue with tracking even if WebSocket fails - location updates will be buffered
    }

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

    // Request background location permission for Android (required for background tracking)
    if (Platform.isAndroid) {
      if (permission == LocationPermission.whileInUse) {
        print('Requesting background location permission...');
        LocationPermission bgPermission = await Geolocator.requestPermission();
        print('Background location permission: $bgPermission');

        if (bgPermission != LocationPermission.always) {
          print('WARNING: Background location permission not granted. GPS tracking will stop when app is backgrounded.');
        }
      }
    }

    if (!(await Geolocator.isLocationServiceEnabled())) {
      throw Exception('Location services are disabled. Please enable location services.');
    }

    print('All location permissions granted');
  }

  void _startSendingLocation() {
    // Start streaming location updates
    _positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 25, // Update every 25 meters (increased for better performance)
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
    _locationTimer = Timer.periodic(const Duration(seconds: 60), (timer) async {
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

  Future<void> _connectWebSocket() async {
    if (_isWebSocketConnected && _stompClient != null) return;

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) {
      throw Exception('No authentication token found');
    }

    // Build WebSocket URL for GPS tracking - use SockJS URL pattern with JWT token
    final baseUrl = ApiClient.baseUrl.replaceFirst('/api', '');
    String wsUrl;
    if (baseUrl.startsWith('https://')) {
      wsUrl = baseUrl.replaceFirst('https://', 'wss://') + '/ws/tracking/websocket?token=$token';
    } else if (baseUrl.startsWith('http://')) {
      wsUrl = baseUrl.replaceFirst('http://', 'ws://') + '/ws/tracking/websocket?token=$token';
    } else {
      wsUrl = 'ws://$baseUrl/ws/tracking/websocket?token=$token';
    }

    print('GPS DEBUG: ApiClient.baseUrl: ${ApiClient.baseUrl}');
    print('GPS DEBUG: baseUrl (stripped /api): $baseUrl');
    print('GPS DEBUG: JWT token present: ${token != null}');
    print('GPS DEBUG: final wsUrl: $wsUrl');

    _stompClient = StompClient(
      config: StompConfig(
        url: wsUrl,
        onConnect: (_) {
          print('GPS DEBUG: WebSocket connected successfully');
          _isWebSocketConnected = true;
          _reconnectTimer?.cancel();
        },
        onWebSocketError: (dynamic err) {
          print('GPS DEBUG: WebSocket error: $err');
          _isWebSocketConnected = false;
          _scheduleReconnect();
        },
        onStompError: (StompFrame frame) {
          print('GPS DEBUG: STOMP error: ${frame.body}');
          _isWebSocketConnected = false;
          _scheduleReconnect();
        },
        onDisconnect: (StompFrame frame) {
          print('GPS DEBUG: WebSocket disconnected');
          _isWebSocketConnected = false;
          _scheduleReconnect();
        },
        connectionTimeout: const Duration(seconds: 10),
        heartbeatOutgoing: const Duration(seconds: 30),
        heartbeatIncoming: const Duration(seconds: 30),
        onDebugMessage: (String msg) => print('GPS STOMP DEBUG: $msg'),
      ),
    );

    print('GPS DEBUG: Activating STOMP client...');
    _stompClient?.activate();
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), () {
      if (!_isWebSocketConnected) {
        print('Attempting to reconnect GPS WebSocket...');
        _connectWebSocket();
      }
    });
  }

  void _sendLocation(double latitude, double longitude) {
    if (!_isTracking || _tripId == null) return;

    // Throttle updates - don't send more than once per 10 seconds
    final now = DateTime.now();
    if (_lastLocationUpdate != null &&
        now.difference(_lastLocationUpdate!).inSeconds < 10) return;

    if (!_isWebSocketConnected || _stompClient == null) {
      print('GPS WebSocket not connected, skipping location update');
      return;
    }

    final locationMessage = {
      'tripId': _tripId!,
      'latitude': latitude,
      'longitude': longitude,
    };

    try {
      _stompClient?.send(
        destination: '/app/tracking',
        body: jsonEncode(locationMessage),
      );
      _lastLocationUpdate = now;
      print('Location sent: lat=$latitude, lng=$longitude');
    } catch (e) {
      print('Error sending location: $e');
    }
  }

  Future<void> _startForegroundService() async {
    try {
      const platform = MethodChannel('com.logiflow.client_mobile/gps_service');
      await platform.invokeMethod('startGpsService');
      print('Foreground GPS service started');
    } catch (e) {
      print('Failed to start foreground service: $e');
    }
  }

  Future<void> _stopForegroundService() async {
    try {
      const platform = MethodChannel('com.logiflow.client_mobile/gps_service');
      await platform.invokeMethod('stopGpsService');
      print('Foreground GPS service stopped');
    } catch (e) {
      print('Failed to stop foreground service: $e');
    }
  }

  void disconnect() {
    _isTracking = false;

    // Stop foreground service for Android
    if (Platform.isAndroid) {
      _stopForegroundService();
    }

    _positionSubscription?.cancel();
    _locationTimer?.cancel();
    _positionStream = null;
    _tripId = null;
    _driverId = null;

    // Disconnect WebSocket
    _isWebSocketConnected = false;
    _reconnectTimer?.cancel();
    _stompClient?.deactivate();
    _stompClient = null;

    print('GPS tracking stopped');
  }

  /// Check if GPS tracking should be enabled and stop if disabled
  Future<void> _checkAndEnforceGpsSetting() async {
    final prefs = await SharedPreferences.getInstance();
    final gpsEnabled = prefs.getBool('gps_tracking_enabled') ?? true;

    if (!gpsEnabled && _isTracking) {
      print('GPS tracking disabled in settings - stopping current tracking');
      disconnect();
    }
  }

  bool get isTracking => _isTracking;
  String? get currentTripId => _tripId;
}

// Global instance
final gpsTrackingService = GpsTrackingService();
