import 'package:flutter/material.dart';
import '../../services/driver/driver_service.dart';
import '../../models/driver/trip.dart';
import 'driver_trip_detail_screen.dart';

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

      // Sort trips by priority: arrived > in_progress > scheduled > completed > cancelled
      trips.sort((a, b) {
        int getPriority(String? status) {
          switch (status?.toLowerCase()) {
            case 'arrived': return 0; // Top priority - driver at destination!
            case 'in_progress': return 1;
            case 'scheduled': return 2;
            case 'completed': return 3;
            case 'cancelled': return 4; // Lowest priority
            default: return 5;
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

  Color _getTripStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return Colors.blue;
      case 'in_progress':
        return Colors.orange;
      case 'arrived':
        return Colors.purple;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Color _getAssignmentStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'assigned':
        return Colors.blue.shade700;
      case 'accepted':
        return Colors.green.shade700;
      case 'declined':
        return Colors.red.shade700;
      case 'completed':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {

    Widget _buildFilterSection() {
      return Card(
        margin: const EdgeInsets.all(16),
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Filters', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  if (_dateRange != null || _statusFilter != null)
                    TextButton(
                      onPressed: _clearFilters,
                      child: const Text('Clear All'),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _pickDateRange,
                      icon: const Icon(Icons.calendar_today, size: 18),
                      label: const Text('Date Range'),
                      style: OutlinedButton.styleFrom(
                        backgroundColor: _dateRange != null ? Colors.blue.shade50 : null,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  DropdownButton<String?>(
                    value: _statusFilter,
                    hint: const Text('Status'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('All Status')),
                      const DropdownMenuItem(value: 'scheduled', child: Text('Scheduled')),
                      const DropdownMenuItem(value: 'in_progress', child: Text('In Progress')),
                      const DropdownMenuItem(value: 'completed', child: Text('Completed')),
                      const DropdownMenuItem(value: 'cancelled', child: Text('Cancelled')),
                    ],
                    onChanged: _setStatusFilter,
                  ),
                ],
              ),
              if (_dateRange != null) ...[
                const SizedBox(height: 8),
                Text(
                  'Date: ${_dateRange!.start.toString().split(' ')[0]} - ${_dateRange!.end.toString().split(' ')[0]}',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
              if (_statusFilter != null) ...[
                const SizedBox(height: 8),
                Text(
                  'Status: ${_statusFilter!.replaceAll('_', ' ').toUpperCase()}',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Trips'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : Column(
                children: [
                  _buildFilterSection(),
                  Expanded(
                    child: _trips.isEmpty
                        ? const Center(child: Text('No trips available'))
                      : RefreshIndicator(
                          onRefresh: _fetchTrips,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _trips.length,
                            itemBuilder: (context, index) {
                              final trip = _trips[index];
                              return Card(
                                elevation: 2,
                                margin: const EdgeInsets.only(bottom: 12),
                                child: InkWell(
                                  onTap: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (context) => DriverTripDetailScreen(tripId: trip.tripId),
                                      ),
                                    );
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text('Trip #${trip.tripId}',
                                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                              decoration: BoxDecoration(
                                                color: _getTripStatusColor(trip.status),
                                                borderRadius: BorderRadius.circular(20),
                                              ),
                                              child: Text(
                                                trip.status?.toUpperCase() ?? 'N/A',
                                                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                              ),
                                            ),
                                          ],
                                        ),
                                        if (trip.assignmentStatus != null) ...[
                                          const SizedBox(height: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: _getAssignmentStatusColor(trip.assignmentStatus),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              'Assignment: ${trip.assignmentStatus?.toUpperCase()}',
                                              style: const TextStyle(color: Colors.white, fontSize: 10),
                                            ),
                                          ),
                                        ],
                                        const Divider(height: 20),
                                        if (trip.routeName != null)
                                          Row(
                                            children: [
                                              const Icon(Icons.route, size: 16, color: Colors.grey),
                                              const SizedBox(width: 8),
                                              Expanded(child: Text(trip.routeName!, style: const TextStyle(fontSize: 14))),
                                            ],
                                          ),
                                        if (trip.scheduledDeparture != null) ...[
                                          const SizedBox(height: 6),
                                          Row(
                                            children: [
                                              const Icon(Icons.access_time, size: 16, color: Colors.green),
                                              const SizedBox(width: 8),
                                              Expanded(child: Text('Departure: ${trip.scheduledDeparture}', style: const TextStyle(fontSize: 13))),
                                            ],
                                          ),
                                        ],
                                        if (trip.scheduledArrival != null) ...[
                                          const SizedBox(height: 6),
                                          Row(
                                            children: [
                                              const Icon(Icons.alarm, size: 16, color: Colors.red),
                                              const SizedBox(width: 8),
                                              Expanded(child: Text('Arrival: ${trip.scheduledArrival}', style: const TextStyle(fontSize: 13))),
                                            ],
                                          ),
                                        ],
                                        if (trip.vehiclePlate != null) ...[
                                          const SizedBox(height: 6),
                                          Row(
                                            children: [
                                              const Icon(Icons.local_shipping, size: 16, color: Colors.grey),
                                              const SizedBox(width: 8),
                                              Text('Vehicle: ${trip.vehiclePlate}', style: const TextStyle(fontSize: 13)),
                                            ],
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                  ),
                ],
              ),
    );
  }
}
