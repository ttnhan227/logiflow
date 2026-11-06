import '../../theme/app_theme.dart';
import 'package:flutter/material.dart';
import '../../services/driver/driver_service.dart';
import '../../models/driver/trip.dart';
import 'driver_trip_detail_screen.dart';
import 'driver_trip_history_screen.dart';

class DriverTripsScreen extends StatefulWidget {
  const DriverTripsScreen({super.key});

  @override
  State<DriverTripsScreen> createState() => _DriverTripsScreenState();
}

class _DriverTripsScreenState extends State<DriverTripsScreen> {
  bool _isLoading = true;
  List<DriverTrip> _trips = [];
  String? _error;
  DateTimeRange? _dateRange;
  String? _statusFilter; // Add status filter to match schedule functionality

  @override
  void initState() {
    super.initState();
    _fetchTrips();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Force refresh trips every time we return to this screen
    // This ensures updates after delivery confirmations and other changes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && !_isLoading) {
        // Add a small delay to ensure navigation is fully complete
        Future.delayed(const Duration(milliseconds: 200), () {
          if (mounted) {
            _fetchTrips();
          }
        });
      }
    });
  }

  Future<void> _fetchTrips() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      List<DriverTrip> trips;

      // Use schedule API if date range is set, otherwise use trips API
      if (_dateRange != null && _statusFilter == null) {
        final start = _dateRange!.start.toIso8601String().split('T').first;
        final end = _dateRange!.end.toIso8601String().split('T').first;
        final scheduleItems = await driverService.getMySchedule(start, end);

        // Convert schedule items to driver trips format (missing some fields)
        trips = scheduleItems.map((item) => DriverTrip(
          tripId: item.tripId,
          status: item.status,
          assignmentStatus: null, // Schedule API doesn't have this
          scheduledDeparture: item.scheduledDeparture,
          scheduledArrival: item.scheduledArrival,
          routeName: item.routeName,
        )).toList();
      } else {
        // Use regular trips API
        trips = await driverService.getMyTrips(status: _statusFilter);
      }

      // Filter out completed and cancelled trips for active trips screen
      trips = trips.where((trip) {
        final status = trip.status?.toLowerCase();
        return status != 'completed' && status != 'cancelled';
      }).toList();

      // Sort trips by priority: arrived > in_progress > scheduled
      trips.sort((a, b) {
        int getPriority(String? status) {
          switch (status?.toLowerCase()) {
            case 'arrived': return 0; // Top priority - driver at destination!
            case 'in_progress': return 1;
            case 'scheduled': return 2;
            default: return 3;
          }
        }

        int priorityA = getPriority(a.status);
        int priorityB = getPriority(b.status);

        return priorityA.compareTo(priorityB);
      });

      setState(() {
        _trips = trips;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _refresh() async {
    await _fetchTrips();
  }

  Future<void> _pickDateRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: now.subtract(const Duration(days: 365)),
      lastDate: now.add(const Duration(days: 365)),
      initialDateRange: _dateRange ?? DateTimeRange(start: now, end: now.add(const Duration(days: 7))),
    );
    if (picked != null) {
      setState(() {
        _dateRange = picked;
        _statusFilter = null; // Clear status filter when using date range
      });
      _fetchTrips();
    }
  }

  void _clearFilters() {
    setState(() {
      _dateRange = null;
      _statusFilter = null;
    });
    _fetchTrips();
  }

  void _setStatusFilter(String? status) {
    setState(() {
      _statusFilter = status;
      _dateRange = null; // Clear date range when using status filter
    });
    _fetchTrips();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Trips'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _refresh),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _refresh,
              child: _error != null
                  ? ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        SizedBox(
                          height: MediaQuery.of(context).size.height * 0.25,
                        ),
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.error_outline,
                                size: 48,
                                color: Colors.red,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Error: $_error',
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _refresh,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      ],
                    )
                  : _trips.isEmpty
                  ? ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: const [
                        SizedBox(height: 160),
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.local_shipping_outlined,
                                size: 64,
                                color: Colors.grey,
                              ),
                              SizedBox(height: 16),
                              Text(
                                'No active trips',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey,
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Your active trips will appear here',
                                style: TextStyle(color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ],
                    )
                  : ListView.builder(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(16),
                      itemCount: _trips.length,
                      itemBuilder: (context, index) {
                        final trip = _trips[index];

                        return InkWell(
                          borderRadius: BorderRadius.circular(10),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) =>
                                    DriverTripDetailScreen(tripId: trip.tripId),
                              ),
                            );
                          },
                          child: AppTheme.buildDispatchCard(
                            title: 'TRIP #${trip.tripId}',
                            icon: Icons.local_shipping_rounded,
                            headerIconColor: AppTheme.primary,
                            trailing: AppTheme.buildStatusPill(trip.status ?? 'UNKNOWN'),
                            children: [
                              if (trip.routeName != null) ...[
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.alt_route_rounded,
                                      color: AppTheme.routeOrange,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        trip.routeName!,
                                        style: const TextStyle(
                                          fontSize: 14.5,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.text,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                              ],
                              Row(
                                children: [
                                  Expanded(
                                    child: AppTheme.buildMetricTile(
                                      label: 'Distance',
                                      value: trip.distance != null ? trip.distance!.toStringAsFixed(0) : '--',
                                      unit: 'km',
                                      icon: Icons.straighten_rounded,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: AppTheme.buildMetricTile(
                                      label: 'Duration',
                                      value: trip.estimatedDuration != null ? '${trip.estimatedDuration}' : '--',
                                      unit: 'min',
                                      icon: Icons.timer_outlined,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: AppTheme.buildMetricTile(
                                      label: 'Vehicle',
                                      value: trip.vehiclePlate ?? 'TRUCK',
                                      icon: Icons.directions_car_outlined,
                                    ),
                                  ),
                                ],
                              ),
                              if (trip.scheduledDeparture != null || trip.scheduledArrival != null) ...[
                                const SizedBox(height: 10),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: AppTheme.surfaceMuted,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Row(
                                    children: [
                                      if (trip.scheduledDeparture != null) ...[
                                        const Icon(Icons.flight_takeoff_rounded, size: 14, color: AppTheme.primary),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            'DEP: ${trip.scheduledDeparture}',
                                            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: AppTheme.text),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                      if (trip.scheduledDeparture != null && trip.scheduledArrival != null)
                                        const SizedBox(width: 8),
                                      if (trip.scheduledArrival != null) ...[
                                        const Icon(Icons.flight_land_rounded, size: 14, color: AppTheme.routeOrange),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            'ARR: ${trip.scheduledArrival}',
                                            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: AppTheme.text),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                              if (trip.assignmentStatus != null && trip.assignmentStatus!.isNotEmpty) ...[
                                const SizedBox(height: 10),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryLight,
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: const Color(0xFFBAE6FD)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.assignment_ind_rounded, size: 13, color: AppTheme.primary),
                                      const SizedBox(width: 5),
                                      Text(
                                        'ASSIGNMENT: ${trip.assignmentStatus!.toUpperCase()}',
                                        style: const TextStyle(
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.primaryDark,
                                          letterSpacing: 0.3,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: const [
                                  Text(
                                    'VIEW TELEMETRY & ORDERS',
                                    style: TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.5,
                                      color: AppTheme.routeOrange,
                                    ),
                                  ),
                                  SizedBox(width: 4),
                                  Icon(Icons.arrow_forward_rounded, size: 13, color: AppTheme.routeOrange),
                                ],
                              ),
                            ],
                          ),
                        );                      },
                    ),
            ),
    );
  }
}
