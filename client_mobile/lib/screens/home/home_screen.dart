import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../services/auth/auth_service.dart';
import '../../services/driver/driver_service.dart';
import '../../services/gps/gps_tracking_service.dart';
import '../../services/maps/maps_service.dart';
import '../../models/user.dart';
import '../driver/driver_trip_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  User? _currentUser;
  bool _isLoading = true;
  List<dynamic>? _activeTrips;
  double? _currentLat;
  double? _currentLng;
  String? _currentAddress;
  Timer? _locationUpdateTimer;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  @override
  void dispose() {
    _locationUpdateTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadUser() async {
    final user = await authService.getCurrentUser();
    if (mounted) {
      setState(() {
        _currentUser = user;
      });
      await _loadActiveTrips();
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _startLocationUpdates() {
    _stopLocationUpdates(); // Cancel any existing timer
    _locationUpdateTimer = Timer.periodic(const Duration(seconds: 30), (
      timer,
    ) async {
      if (!mounted) return;
      try {
        Position position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );
        final address = await mapsService.reverseGeocode(
          position.latitude,
          position.longitude,
        );
        if (mounted) {
          setState(() {
            _currentLat = position.latitude;
            _currentLng = position.longitude;
            _currentAddress = address ?? 'Unknown location';
          });
        }
      } catch (e) {
        print('Error updating location: $e');
      }
    });
  }

  void _stopLocationUpdates() {
    _locationUpdateTimer?.cancel();
    _locationUpdateTimer = null;
    setState(() {
      _currentLat = null;
      _currentLng = null;
      _currentAddress = null;
    });
  }

  Future<void> _loadActiveTrips() async {
    if (_currentUser?.role?.toUpperCase() == 'DRIVER') {
      try {
        final trips = await driverService.getMyTrips();
        final activeTrips = trips
            .where(
              (trip) =>
                  trip.status?.toLowerCase() == 'in_progress' ||
                  trip.status?.toLowerCase() == 'arrived',
            )
            .take(1)
            .toList(); // Just need one active trip for the banner

        if (mounted) {
          setState(() {
            _activeTrips = activeTrips;
          });
          // Start location updates if has active trips
          if (activeTrips.isNotEmpty) {
            _startLocationUpdates();
          } else {
            _stopLocationUpdates();
          }
        }
      } catch (e) {
        // Silently fail - driver just won't see GPS banner
      }
    }
  }

  Widget _buildGpsBanner() {
    if (_activeTrips == null || _activeTrips!.isEmpty)
      return const SizedBox.shrink();

    final activeTrip = _activeTrips!.first;
    final isGpsTracking =
        gpsTrackingService.isTracking &&
        gpsTrackingService.currentTripId == activeTrip.tripId.toString();

    // Auto-start GPS tracking for trips that are in progress but not yet tracking
    if (!isGpsTracking && mounted) {
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        try {
          await gpsTrackingService.connectAndStartTracking(
            activeTrip.tripId.toString(),
          );
          // Force banner update after GPS starts
          if (mounted) {
            setState(() {});
          }
        } catch (e) {
          // Silently fail auto-start, driver will see "GPS Tracking Required" banner
          print('GPS auto-start failed: $e');
        }
      });
    }

    final bannerColor = isGpsTracking ? Colors.green : Colors.orange;
    final icon = isGpsTracking ? Icons.gps_fixed : Icons.location_disabled;
    final title = isGpsTracking
        ? 'GPS Tracking Active'
        : 'GPS Tracking Required';
    final subtitle = isGpsTracking
        ? (_currentLat != null &&
                  _currentLng != null &&
                  _currentAddress != null)
              ? 'Lat: ${_currentLat!.toStringAsFixed(6)}, Lng: ${_currentLng!.toStringAsFixed(6)}\n${_currentAddress}'
              : 'Your location is being shared with customers'
        : activeTrip.status?.toLowerCase() == 'arrived'
        ? 'You must share location while at delivery destination'
        : 'Tap "My Trips" to start tracking your route';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bannerColor.shade50,
        border: Border.all(color: bannerColor.shade300),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, color: bannerColor.shade700),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: bannerColor.shade800,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Trip #${activeTrip.tripId} • ${activeTrip.routeName ?? "Route"}',
                  style: TextStyle(color: bannerColor.shade700, fontSize: 14),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(color: bannerColor.shade600, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Welcome to LogiFlow!',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 20),

                  // GPS Banner for drivers with active trips
                  _buildGpsBanner(),

                  if (_currentUser != null) ...[
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Hello, ${_currentUser!.username}!',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Role: ${_currentUser!.role}',
                              style: const TextStyle(color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  const Card(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Smart Logistics Management',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Manage drivers, vehicles, and deliveries efficiently with our intelligent logistics system.',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
