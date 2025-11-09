import 'dart:convert';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stomp_dart_client/stomp.dart';
import 'package:stomp_dart_client/stomp_config.dart';
import 'package:stomp_dart_client/stomp_frame.dart';

class GpsTrackingService {
  StompClient? _stompClient;
  Stream<Position>? _positionStream;
  String? _tripId;
  String? _driverId;

  Future<void> connectAndStartTracking({required String tripId, required String driverId}) async {
    _tripId = tripId;
    _driverId = driverId;
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) throw Exception('No JWT token found');

    final wsUrl = 'ws://192.168.1.70:8080/ws/tracking?token=$token';
    _stompClient = StompClient(
      config: StompConfig.SockJS(
        url: wsUrl,
        onConnect: _onConnect,
        onWebSocketError: (dynamic error) => print('WebSocket error: $error'),
        onStompError: (frame) => print('STOMP error: ${frame.body}'),
        onDisconnect: (frame) => print('Disconnected'),
        heartbeatOutgoing: Duration(seconds: 10),
        heartbeatIncoming: Duration(seconds: 10),
      ),
    );
    _stompClient!.activate();
  }

  void _onConnect(StompFrame frame) {
    print('Connected to GPS WebSocket');
    // Subscribe to location broadcasts if needed
    _stompClient!.subscribe(
      destination: '/topic/locations',
      callback: (frame) {
        print('Received: ${frame.body}');
      },
    );
    // Start sending location
    _startSendingLocation();
  }

  void _startSendingLocation() {
    _positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, distanceFilter: 10),
    );
    _positionStream!.listen((Position position) {
      _sendLocation(position.latitude, position.longitude);
    });
  }

  void _sendLocation(double latitude, double longitude) {
    if (_stompClient == null || !_stompClient!.connected) return;
    final location = {
      'driverId': _driverId,
      'tripId': _tripId,
      'latitude': latitude,
      'longitude': longitude,
    };
    _stompClient!.send(
      destination: '/app/tracking',
      body: jsonEncode(location),
    );
    print('Sent: $location');
  }

  void disconnect() {
    _stompClient?.deactivate();
    _stompClient = null;
  }
}
