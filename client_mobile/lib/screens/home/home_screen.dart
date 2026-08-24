import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../services/auth/auth_service.dart';
import '../../services/driver/driver_service.dart';
import '../../services/gps/gps_tracking_service.dart';
import '../../services/maps/maps_service.dart';
import '../../models/user.dart';
import '../../theme/app_theme.dart';
import '../driver/driver_trip_detail_screen.dart';
import '../driver/driver_trips_screen.dart';
import '../driver/driver_compliance_screen.dart';
import '../driver/driver_trip_history_screen.dart';
import '../customer/create_order_screen.dart';
import '../customer/track_orders_screen.dart';
import '../customer/order_history_screen.dart';

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
    _stopLocationUpdates();
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
        // Silently handle location error
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
            .toList();

        if (mounted) {
          setState(() {
            _activeTrips = activeTrips;
          });
          if (activeTrips.isNotEmpty) {
            _startLocationUpdates();
          } else {
            _stopLocationUpdates();
          }
        }
      } catch (e) {
        // Silently ignore active trips error
      }
    }
  }

  Widget _buildGpsBanner() {
    if (_activeTrips == null || _activeTrips!.isEmpty) {
      return const SizedBox.shrink();
    }

    final activeTrip = _activeTrips!.first;
    final isGpsTracking =
        gpsTrackingService.isTracking &&
        gpsTrackingService.currentTripId == activeTrip.tripId.toString();

    if (!isGpsTracking && mounted) {
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        try {
          await gpsTrackingService.connectAndStartTracking(
            activeTrip.tripId.toString(),
          );
          if (mounted) {
            setState(() {});
          }
        } catch (e) {
          // Auto-start fallback
        }
      });
    }

    final bannerBg = isGpsTracking ? AppTheme.successBg : AppTheme.warningBg;
    final borderColor = isGpsTracking ? const Color(0xFFBBF7D0) : const Color(0xFFFDE68A);
    final iconColor = isGpsTracking ? AppTheme.success : AppTheme.warning;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bannerBg,
        border: Border.all(color: borderColor),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isGpsTracking ? Icons.gps_fixed_rounded : Icons.location_disabled_rounded,
                color: iconColor,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                isGpsTracking ? 'Live GPS Tracking Active' : 'GPS Tracking Required',
                style: TextStyle(
                  color: iconColor,
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isGpsTracking ? AppTheme.success : AppTheme.warning,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  'TRIP #${activeTrip.tripId}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'Route: ${activeTrip.routeName ?? "Linehaul Corridor"}',
            style: const TextStyle(
              color: AppTheme.text,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            isGpsTracking
                ? (_currentAddress != null
                    ? 'Current Location: $_currentAddress'
                    : 'Broadcasting live coordinates to dispatch center')
                : 'Please maintain continuous GPS sharing during transit',
            style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) =>
                        DriverTripDetailScreen(tripId: activeTrip.tripId),
                  ),
                );
              },
              icon: const Icon(Icons.navigation_rounded, size: 16),
              label: const Text('Open Trip Navigation & e-POD'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDriverDashboard() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildGpsBanner(),
        const Text(
          'Quick Operations',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppTheme.text,
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.25,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: [
            _buildActionTile(
              icon: Icons.local_shipping_rounded,
              title: 'My Trips',
              subtitle: 'Active & assigned runs',
              color: AppTheme.primary,
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const DriverTripsScreen()),
                );
              },
            ),
            _buildActionTile(
              icon: Icons.verified_user_rounded,
              title: 'Compliance',
              subtitle: 'Safety & weighbridge',
              color: AppTheme.success,
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const DriverComplianceScreen()),
                );
              },
            ),
            _buildActionTile(
              icon: Icons.history_rounded,
              title: 'Trip History',
              subtitle: 'Completed consignments',
              color: AppTheme.navy,
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const DriverTripHistoryScreen()),
                );
              },
            ),
            _buildActionTile(
              icon: Icons.support_agent_rounded,
              title: 'Dispatch Help',
              subtitle: '24/7 Operations desk',
              color: const Color(0xFF7C3AED),
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Contacting Dispatch Control Tower Hotline: 1900-8888')),
                );
              },
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCustomerDashboard() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Freight Actions',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppTheme.text,
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.25,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: [
            _buildActionTile(
              icon: Icons.add_circle_outline_rounded,
              title: 'Create Order',
              subtitle: 'Book linehaul or express',
              color: AppTheme.primary,
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const CreateOrderScreen()),
                );
              },
            ),
            _buildActionTile(
              icon: Icons.track_changes_rounded,
              title: 'Track Orders',
              subtitle: 'Live GPS & ETA updates',
              color: AppTheme.success,
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const TrackOrdersScreen()),
                );
              },
            ),
            _buildActionTile(
              icon: Icons.history_rounded,
              title: 'Order History',
              subtitle: 'Past invoices & receipts',
              color: AppTheme.navy,
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const OrderHistoryScreen()),
                );
              },
            ),
            _buildActionTile(
              icon: Icons.analytics_outlined,
              title: 'SLA Analytics',
              subtitle: '99.8% on-time delivery',
              color: const Color(0xFF0284C7),
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('SLA Performance: 99.8% on-time rate across Vietnam')),
                );
              },
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppTheme.border, width: 1),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(height: 10),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.text,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppTheme.textMuted,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final isDriver = _currentUser?.role?.toUpperCase() == 'DRIVER';

    return Scaffold(
      backgroundColor: AppTheme.canvas,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Header Greeting Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.border),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryLight,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.person_rounded,
                      color: AppTheme.primary,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Hello, ${_currentUser?.username ?? "User"}',
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.text,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: isDriver ? AppTheme.primaryLight : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                _currentUser?.role ?? 'OPERATOR',
                                style: TextStyle(
                                  color: isDriver ? AppTheme.primary : AppTheme.textMuted,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'LogiFlow Operational Network • Vietnam',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Role-specific operational actions
            if (isDriver) _buildDriverDashboard() else _buildCustomerDashboard(),

            const SizedBox(height: 24),

            // System Status Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.navy,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                children: [
                  Icon(Icons.shield_outlined, color: Colors.white, size: 22),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '63-Province Real-Time Coverage',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Automatic e-POD capture & GPS telemetry active',
                          style: TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
