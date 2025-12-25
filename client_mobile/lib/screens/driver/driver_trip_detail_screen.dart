import 'package:flutter/material.dart';
import 'dart:async';
import '../../services/api_client.dart';
import '../../services/driver/driver_service.dart';
import '../../services/gps/gps_tracking_service.dart';
import 'dart:convert';
import 'widgets/trip_map_view.dart';
import 'delivery_confirmation_screen.dart';
import 'driver_chat_screen.dart';
import '../../models/driver/trip.dart';

class DriverTripDetailScreen extends StatefulWidget {
  final int tripId;
  const DriverTripDetailScreen({super.key, required this.tripId});

  @override
  State<DriverTripDetailScreen> createState() => _DriverTripDetailScreenState();
}

class _DriverTripDetailScreenState extends State<DriverTripDetailScreen> {
  bool _isLoading = true;
  bool _isOrderSectionExpanded = true;
  bool _isDelayDialogOpen = false;
  bool _isSubmittingDelay = false;
  Map<String, dynamic>? _tripDetail;
  String? _error;
  String? _previousTripStatus;
  bool? _hasActiveAssignment;
  int? _driverId;
  final TextEditingController _delayReasonController = TextEditingController();
  String? _currentDelayReason;
  bool _delayReportExist = false;
  String? _delayStatus;
  String? _delayAdminComment;

  @override
  void initState() {
    super.initState();
    _fetchTripDetail();
    _checkForActiveAssignments();
  }

  Future<void> _checkForActiveAssignments() async {
    try {
      final hasActive = await driverService.hasActiveTripAssignment();
      setState(() {
        _hasActiveAssignment = hasActive;
      });
    } catch (e) {
      // If unable to check, assume no active assignment
      setState(() {
        _hasActiveAssignment = false;
      });
    }
  }

  @override
  void dispose() {
    // Stop GPS tracking when leaving the screen
    if (gpsTrackingService.isTracking &&
        gpsTrackingService.currentTripId == widget.tripId.toString()) {
      gpsTrackingService.disconnect();
    }
    super.dispose();
  }

  Future<void> _handleGpsTrackingForTripStatus(
    String status,
    String tripId,
  ) async {
    switch (status) {
      case 'in_progress':
        // Start GPS tracking when trip begins
        try {
          await gpsTrackingService.connectAndStartTracking(tripId);
          print('GPS tracking started for trip $tripId');
        } catch (e) {
          print('Failed to start GPS tracking: $e');
        }
        break;

      case 'completed':
      case 'cancelled':
        // Stop GPS tracking when trip ends
        if (gpsTrackingService.isTracking &&
            gpsTrackingService.currentTripId == tripId) {
          gpsTrackingService.disconnect();
          print('GPS tracking stopped for trip $tripId');
        }
        break;

      default:
        // Continue tracking for other statuses (like 'arrived') - GPS stays active
        // until trip is completed or cancelled
        break;
    }
  }

  int? _extractDriverId(Map<String, dynamic> trip) {
    // Common shapes: driverId at root, or nested under driver/assignment
    if (trip['driverId'] != null) return trip['driverId'] as int?;
    if (trip['driver'] != null && trip['driver']['driverId'] != null) {
      return trip['driver']['driverId'] as int?;
    }
    if (trip['tripAssignments'] != null &&
        trip['tripAssignments'] is List &&
        (trip['tripAssignments'] as List).isNotEmpty) {
      final first = (trip['tripAssignments'] as List).first;
      if (first is Map &&
          first['driver'] != null &&
          first['driver']['driverId'] != null) {
        return first['driver']['driverId'] as int?;
      }
    }
    return null;
  }

  Future<void> _fetchTripDetail() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      // Add a small delay when coming from navigation to ensure auth context is ready
      await Future.delayed(const Duration(milliseconds: 100));

      final response = await apiClient.get('/driver/me/trips/${widget.tripId}');
      if (response.statusCode == 200) {
        final newTripDetail = jsonDecode(response.body);

        // DEBUG: Log the full response
        print('DEBUG: Full trip response: $newTripDetail');
        print('DEBUG: Orders in response: ${newTripDetail['orders']}');

        // Check if trip status changed and handle GPS tracking accordingly
        final previousStatus = _tripDetail?['status'];
        final newStatus = newTripDetail['status'];

        if (previousStatus != newStatus || _previousTripStatus != newStatus) {
          await _handleGpsTrackingForTripStatus(
            newStatus,
            newTripDetail['tripId'].toString(),
          );
        }

        // Check for existing delay report on trip itself
        final String? tripDelayReason = newTripDetail['delayReason'];
        final String? tripDelayStatus = newTripDetail['delayStatus'];
        final String? tripDelayAdminComment =
            newTripDetail['delayAdminComment'];

        final bool hasDelayReport =
            tripDelayReason != null && tripDelayReason.toString().isNotEmpty;

        setState(() {
          _tripDetail = newTripDetail;
          _driverId = _extractDriverId(newTripDetail);
          _previousTripStatus = newStatus;
          _delayReportExist = hasDelayReport;
          _currentDelayReason = tripDelayReason;
          _delayStatus = tripDelayStatus;
          _delayAdminComment = tripDelayAdminComment;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error =
              'Failed to load trip (status ${response.statusCode}): ${response.body}';
          _isLoading = false;
        });
      }
    } catch (e) {
      // Check if it's an authentication error
      if (e.toString().contains('Authentication failed')) {
        setState(() {
          _error = 'Authentication failed. Please try again.';
          _isLoading = false;
        });
        // Optionally show a dialog and navigate back to login
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            Navigator.of(context).pushReplacementNamed('/login');
          }
        });
      } else {
        setState(() {
          _error = 'Error: $e';
          _isLoading = false;
        });
      }
    }
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

  Color _getOrderStatusColor(String? status) {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return Colors.grey;
      case 'ASSIGNED':
        return Colors.blue;
      case 'IN_TRANSIT':
        return Colors.orange;
      case 'DELIVERED':
        return Colors.green;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Widget _buildDetailRow(
    IconData icon,
    String label,
    dynamic value, {
    Color? iconColor,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: iconColor ?? Colors.grey.shade600),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 2),
              Text(
                value?.toString() ?? 'N/A',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showDelayReportDialog() {
    setState(() {
      _isDelayDialogOpen = true;
      // Initialize with existing delay info or default values
      if (_delayReportExist && _currentDelayReason != null) {
        _delayReasonController.text = _currentDelayReason!;
      } else {
        _delayReasonController.clear();
      }
    });

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              title: const Text('Report Trip Delay'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Please provide details about the delay so admin can assist appropriately.',
                      style: TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _delayReasonController,
                      decoration: const InputDecoration(
                        labelText: 'Delay Reason',
                        hintText:
                            'e.g., Traffic congestion expected for about 60 mins, vehicle breakdown, customer unavailable...',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.description),
                      ),
                      maxLines: 3,
                      maxLength: 500,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Include timing information in your description so admin understands the expected delay duration.',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    setState(() {
                      _isDelayDialogOpen = false;
                    });
                  },
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: _isSubmittingDelay
                      ? null
                      : () async {
                          if (_delayReasonController.text.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Please provide a delay reason.'),
                              ),
                            );
                            return;
                          }

                          setStateDialog(() => _isSubmittingDelay = true);
                          setState(() => _isSubmittingDelay = true);

                          try {
                            await driverService.reportTripDelay(
                              _tripDetail!['tripId'],
                              _delayReasonController.text.trim(),
                            ); // No hardcoded minutes - info is in text

                            setStateDialog(() => _isSubmittingDelay = false);
                            setState(() => _isSubmittingDelay = false);

                            Navigator.of(context).pop();
                            setState(() {
                              _isDelayDialogOpen = false;
                            });

                            Navigator.of(context).pop();

                            ScaffoldMessenger.of(context).showSnackBar(
                              !_delayReportExist
                                  ? const SnackBar(
                                      content: Text(
                                        'Delay reported successfully. Admin will review.',
                                      ),
                                    )
                                  : const SnackBar(
                                      content: Text(
                                        'Delay report updated successfully. Admin will review.',
                                      ),
                                    ),
                            );

                            // Refresh trip detail to get updated status from server
                            _fetchTripDetail();
                          } catch (e) {
                            setStateDialog(() => _isSubmittingDelay = false);
                            setState(() => _isSubmittingDelay = false);

                            String errorMessage = e.toString();
                            if (errorMessage.contains(
                              'already has approved SLA extensions',
                            )) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Delay report blocked: This trip already has admin-approved extensions. Please contact admin directly.',
                                  ),
                                  duration: Duration(seconds: 5),
                                ),
                              );
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Failed to report delay: $e'),
                                ),
                              );
                            }
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                  ),
                  child: _isSubmittingDelay
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Report Delay'),
                ),
              ],
            );
          },
        );
      },
    ).then((_) {
      setState(() {
        _isDelayDialogOpen = false;
      });
    });
  }

  Widget _buildFab() {
    String buttonText;
    VoidCallback? action;

    if (_tripDetail!['assignmentStatus'] == 'assigned') {
      if (_hasActiveAssignment == true) {
        buttonText = 'BUSY';
        action = null; // Disabled state
      } else {
        buttonText = 'ACCEPT';
        action = () async {
          setState(() => _isLoading = true);
          try {
            await driverService.acceptTrip(_tripDetail!['tripId']);
            await _fetchTripDetail();
            await _checkForActiveAssignments();
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(const SnackBar(content: Text('Trip accepted.')));
          } catch (e) {
            setState(() => _isLoading = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Failed to accept trip: $e')),
            );
          }
        };
      }
    } else if (_tripDetail!['status'] == 'scheduled' &&
        _tripDetail!['assignmentStatus'] == 'accepted') {
      buttonText = 'START TRIP';
      action = () async {
        setState(() => _isLoading = true);
        try {
          await driverService.updateTripStatus(
            _tripDetail!['tripId'],
            'in_progress',
          );
          await _fetchTripDetail();
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Trip started.')));
        } catch (e) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Failed to start trip: $e')));
        }
      };
    } else if (_tripDetail!['status'] == 'in_progress') {
      buttonText = 'ARRIVED';
      action = () async {
        setState(() => _isLoading = true);
        try {
          await driverService.updateTripStatus(
            _tripDetail!['tripId'],
            'arrived',
          );
          await _fetchTripDetail();
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Marked as arrived.')));
        } catch (e) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to mark as arrived: $e')),
          );
        }
      };
    } else if (_tripDetail!['status'] == 'arrived' ||
        _tripDetail!['status'] == 'in_progress') {
      buttonText = 'DELIVER';
      action = () async {
        final confirmed = await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) =>
                DeliveryConfirmationScreen(tripId: _tripDetail!['tripId']),
          ),
        );
        if (confirmed == true) {
          await _fetchTripDetail();
          await _checkForActiveAssignments(); // Refresh active assignments after delivery
        }
      };
    } else {
      return const SizedBox.shrink();
    }

    return FloatingActionButton.extended(
      onPressed: action,
      backgroundColor: action != null ? Colors.blue : Colors.grey,
      elevation: 6,
      label: Text(
        buttonText,
        style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.2),
      ),
      icon: Icon(action != null ? Icons.play_arrow : Icons.block),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(child: Text(_error!))
          : _tripDetail == null
          ? const Center(child: Text('No trip detail'))
          : Stack(
              children: [
                CustomScrollView(
                  slivers: [
                    SliverAppBar(
                      pinned: true,
                      expandedHeight: 240,
                      backgroundColor: Colors.white,
                      elevation: 0,
                      flexibleSpace: FlexibleSpaceBar(
                        background: Container(
                          color: Colors.grey[100],
                          child: TripMapView(
                            tripDetail: _tripDetail!,
                            compact: true,
                            orders: _tripDetail!['orders'] as List<dynamic>?,
                          ),
                        ),
                      ),
                      title: Row(
                        children: [
                          Text(
                            '#${_tripDetail!['tripId']}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(width: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: _getTripStatusColor(
                                _tripDetail!['status'],
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              _tripDetail!['status']?.toUpperCase() ?? 'N/A',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      leading: IconButton(
                        icon: const Icon(Icons.arrow_back),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ),

                    SliverToBoxAdapter(
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Assignment Status
                            if (_tripDetail!['assignmentStatus'] != null)
                              Container(
                                width: double.infinity,
                                margin: const EdgeInsets.only(bottom: 16),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                                decoration: BoxDecoration(
                                  color: _getAssignmentStatusColor(
                                    _tripDetail!['assignmentStatus'],
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(
                                  child: Text(
                                    'Assignment: ${_tripDetail!['assignmentStatus']?.toUpperCase()}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),

                            // Trip Details Card
                            Card(
                              elevation: 4,
                              child: Padding(
                                padding: const EdgeInsets.all(20),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'TRIP DETAILS',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.blue,
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                            color: Colors.blue.shade50,
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                          ),
                                          child: const Icon(
                                            Icons.category,
                                            color: Colors.blue,
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Type',
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  color: Colors.grey[600],
                                                ),
                                              ),
                                              Text(
                                                _tripDetail!['tripType'] ??
                                                    'N/A',
                                                style: const TextStyle(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    _buildDetailRow(
                                      Icons.access_time,
                                      'Departure',
                                      _tripDetail!['scheduledDeparture'],
                                    ),
                                    const SizedBox(height: 12),
                                    _buildDetailRow(
                                      Icons.alarm,
                                      'Arrival',
                                      _tripDetail!['scheduledArrival'],
                                    ),
                                    if (_tripDetail!['vehiclePlate'] !=
                                        null) ...[
                                      const SizedBox(height: 12),
                                      _buildDetailRow(
                                        Icons.local_shipping,
                                        'Vehicle',
                                        _tripDetail!['vehiclePlate'],
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ),

                            const SizedBox(height: 16),

                            // Trip Route Waypoints Card
                            if (_tripDetail!['orders'] != null &&
                                _tripDetail!['orders'] is List &&
                                _tripDetail!['orders'].isNotEmpty)
                              Card(
                                elevation: 4,
                                child: Padding(
                                  padding: const EdgeInsets.all(20),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(
                                            Icons.route,
                                            color: Colors.green,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            'TRIP WAYPOINTS (${(_tripDetail!['orders'] as List).length} stops)',
                                            style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.green,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 16),
                                      if (_tripDetail!['routeName'] != null) ...[
                                        Row(
                                          children: [
                                            const Text(
                                              'Route: ',
                                              style: TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            Expanded(
                                              child: Text(
                                                _tripDetail!['routeName']!,
                                                style: const TextStyle(
                                                  fontSize: 14,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 16),
                                      ],
                                      // Sequential Waypoint Route
                                      ...() {
                                        final orders = _tripDetail!['orders'] as List;
                                        final List<Widget> routeWidgets = [];

                                        for (int i = 0; i < orders.length; i++) {
                                          final order = orders[i] as Map<String, dynamic>;

                                          // Add pickup waypoint
                                          routeWidgets.add(
                                            Container(
                                              padding: const EdgeInsets.all(12),
                                              decoration: BoxDecoration(
                                                color: Colors.green.shade50,
                                                borderRadius: BorderRadius.circular(8),
                                                border: Border.all(color: Colors.green.shade200),
                                              ),
                                              child: Row(
                                                children: [
                                                  Container(
                                                    width: 24,
                                                    height: 24,
                                                    decoration: const BoxDecoration(
                                                      color: Colors.green,
                                                      shape: BoxShape.circle,
                                                    ),
                                                    child: Center(
                                                      child: Text(
                                                        '${i + 1}P',
                                                        style: const TextStyle(
                                                          color: Colors.white,
                                                          fontSize: 10,
                                                          fontWeight: FontWeight.bold,
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                                  const SizedBox(width: 12),
                                                  const Icon(
                                                    Icons.store,
                                                    color: Colors.green,
                                                    size: 20,
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Expanded(
                                                    child: Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [
                                                        Text(
                                                          'Order ${i + 1} Pickup',
                                                          style: const TextStyle(
                                                            fontSize: 12,
                                                            fontWeight: FontWeight.w600,
                                                            color: Colors.green,
                                                          ),
                                                        ),
                                                        Text(
                                                          order['pickupAddress'] ?? 'N/A',
                                                          style: const TextStyle(
                                                            fontSize: 14,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          );

                                          // Add arrow to delivery
                                          routeWidgets.add(
                                            Container(
                                              margin: const EdgeInsets.symmetric(vertical: 4),
                                              child: Row(
                                                mainAxisAlignment: MainAxisAlignment.center,
                                                children: [
                                                  Icon(
                                                    Icons.arrow_downward,
                                                    color: Colors.blue.shade400,
                                                    size: 20,
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Text(
                                                    'Deliver to Order ${i + 1}',
                                                    style: TextStyle(
                                                      color: Colors.blue.shade600,
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.w500,
                                                    ),
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Icon(
                                                    Icons.arrow_downward,
                                                    color: Colors.blue.shade400,
                                                    size: 20,
                                                  ),
                                                ],
                                              ),
                                            ),
                                          );

                                          // Add delivery waypoint
                                          routeWidgets.add(
                                            Container(
                                              padding: const EdgeInsets.all(12),
                                              decoration: BoxDecoration(
                                                color: Colors.red.shade50,
                                                borderRadius: BorderRadius.circular(8),
                                                border: Border.all(color: Colors.red.shade200),
                                              ),
                                              child: Row(
                                                children: [
                                                  Container(
                                                    width: 24,
                                                    height: 24,
                                                    decoration: const BoxDecoration(
                                                      color: Colors.red,
                                                      shape: BoxShape.circle,
                                                    ),
                                                    child: Center(
                                                      child: Text(
                                                        '${i + 1}D',
                                                        style: const TextStyle(
                                                          color: Colors.white,
                                                          fontSize: 10,
                                                          fontWeight: FontWeight.bold,
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                                  const SizedBox(width: 12),
                                                  const Icon(
                                                    Icons.home,
                                                    color: Colors.red,
                                                    size: 20,
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Expanded(
                                                    child: Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [
                                                        Text(
                                                          'Order ${i + 1} Delivery',
                                                          style: const TextStyle(
                                                            fontSize: 12,
                                                            fontWeight: FontWeight.w600,
                                                            color: Colors.red,
                                                          ),
                                                        ),
                                                        Text(
                                                          order['deliveryAddress'] ?? 'N/A',
                                                          style: const TextStyle(
                                                            fontSize: 14,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          );

                                          // Add arrow to next order (if not last)
                                          if (i < orders.length - 1) {
                                            routeWidgets.add(
                                              Container(
                                                margin: const EdgeInsets.symmetric(vertical: 8),
                                                child: Row(
                                                  mainAxisAlignment: MainAxisAlignment.center,
                                                  children: [
                                                    Container(
                                                      height: 2,
                                                      width: 40,
                                                      color: Colors.grey.shade400,
                                                    ),
                                                    const SizedBox(width: 8),
                                                    Text(
                                                      'Next Order',
                                                      style: TextStyle(
                                                        color: Colors.grey.shade600,
                                                        fontSize: 12,
                                                        fontWeight: FontWeight.w500,
                                                      ),
                                                    ),
                                                    const SizedBox(width: 8),
                                                    Container(
                                                      height: 2,
                                                      width: 40,
                                                      color: Colors.grey.shade400,
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            );
                                          }
                                        }

                                        return routeWidgets;
                                      }(),
                                    ],
                                  ),
                                ),
                              ),

                            const SizedBox(height: 16),

                            // Delay Report Section
                            if ((_tripDetail!['status'] == 'in_progress' ||
                                    _tripDetail!['status'] == 'scheduled' ||
                                    _tripDetail!['status'] == 'arrived') &&
                                _tripDetail!['assignmentStatus'] ==
                                    'accepted') ...[
                              Card(
                                elevation: 4,
                                child: Padding(
                                  padding: const EdgeInsets.all(20),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Row(
                                        children: [
                                          Icon(
                                            Icons.warning_amber,
                                            color: Colors.orange,
                                          ),
                                          SizedBox(width: 8),
                                          Text(
                                            'DELAY REPORTING',
                                            style: TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.orange,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 16),

                                      // Show current delay report if it exists
                                      if (_delayReportExist &&
                                          _currentDelayReason != null) ...[
                                        Container(
                                          padding: const EdgeInsets.all(16),
                                          decoration: BoxDecoration(
                                            color: Colors.amber.shade50,
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                            border: Border.all(
                                              color: Colors.amber.shade200,
                                            ),
                                          ),
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  const Icon(
                                                    Icons.access_time,
                                                    color: Colors.amber,
                                                    size: 20,
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Text(
                                                    'SUBMITTED DELAY REPORT',
                                                    style: const TextStyle(
                                                      fontSize: 14,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      color: Colors.orange,
                                                    ),
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Container(
                                                    padding:
                                                        const EdgeInsets.symmetric(
                                                          horizontal: 8,
                                                          vertical: 4,
                                                        ),
                                                    decoration: BoxDecoration(
                                                      color: Colors
                                                          .orange
                                                          .shade100,
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                            12,
                                                          ),
                                                    ),
                                                    child: Text(
                                                      (_delayStatus ??
                                                              'PENDING')
                                                          .toUpperCase(),
                                                      style: const TextStyle(
                                                        fontSize: 10,
                                                        fontWeight:
                                                            FontWeight.bold,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 12),
                                              Text(
                                                _currentDelayReason!,
                                                style: const TextStyle(
                                                  fontSize: 14,
                                                  color: Colors.black87,
                                                ),
                                              ),
                                              if (_delayAdminComment != null &&
                                                  _delayAdminComment!
                                                      .trim()
                                                      .isNotEmpty) ...[
                                                const SizedBox(height: 8),
                                                Container(
                                                  padding: const EdgeInsets.all(
                                                    8,
                                                  ),
                                                  decoration: BoxDecoration(
                                                    color: Colors.blue.shade50,
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          6,
                                                        ),
                                                  ),
                                                  child: Row(
                                                    crossAxisAlignment:
                                                        CrossAxisAlignment
                                                            .start,
                                                    children: [
                                                      const Icon(
                                                        Icons.info_outline,
                                                        size: 16,
                                                        color: Colors.blueGrey,
                                                      ),
                                                      const SizedBox(width: 8),
                                                      Expanded(
                                                        child: Text(
                                                          _delayAdminComment!,
                                                          style:
                                                              const TextStyle(
                                                                fontSize: 12,
                                                              ),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ],
                                              // Show SLA extension if admin has approved
                                              if (_tripDetail!['slaExtensionMinutes'] !=
                                                      null &&
                                                  _tripDetail!['slaExtensionMinutes'] >
                                                      0)
                                                Padding(
                                                  padding:
                                                      const EdgeInsets.only(
                                                        top: 8,
                                                      ),
                                                  child: Container(
                                                    padding:
                                                        const EdgeInsets.all(8),
                                                    decoration: BoxDecoration(
                                                      color:
                                                          Colors.green.shade50,
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                            6,
                                                          ),
                                                      border: Border.all(
                                                        color: Colors
                                                            .green
                                                            .shade200,
                                                      ),
                                                    ),
                                                    child: Text(
                                                      '✅ APPROVED: SLA extended by ${_tripDetail!['slaExtensionMinutes']} minutes',
                                                      style: TextStyle(
                                                        fontSize: 13,
                                                        color: const Color(
                                                          0xFF00701A,
                                                        ), // Dark green instead of Colors.green.shade700
                                                        fontWeight:
                                                            FontWeight.w600,
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              Padding(
                                                padding: const EdgeInsets.only(
                                                  top: 12,
                                                ),
                                                child: Text(
                                                  _tripDetail!['slaExtensionMinutes'] !=
                                                              null &&
                                                          _tripDetail!['slaExtensionMinutes'] >
                                                              0
                                                      ? 'Status: Delay approved - SLA extended'
                                                      : 'Status: Submitted to admin for review',
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    color:
                                                        _tripDetail!['slaExtensionMinutes'] !=
                                                                null &&
                                                            _tripDetail!['slaExtensionMinutes'] >
                                                                0
                                                        ? Colors.green.shade600
                                                        : Colors.orange,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                        // Update button (only if not approved - no more delays after approval)
                                        if (_tripDetail!['slaExtensionMinutes'] ==
                                                null ||
                                            _tripDetail!['slaExtensionMinutes'] ==
                                                0)
                                          SizedBox(
                                            width: double.infinity,
                                            child: ElevatedButton.icon(
                                              onPressed:
                                                  _delayStatus == 'APPROVED'
                                                  ? null
                                                  : _showDelayReportDialog,
                                              icon: const Icon(Icons.edit),
                                              label: const Text(
                                                'UPDATE PENDING APPROVAL',
                                              ),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: Colors.grey,
                                                foregroundColor: Colors.white,
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      vertical: 12,
                                                    ),
                                              ),
                                            ),
                                          ),
                                        // Notify about re-approval requirement
                                        if (_tripDetail!['slaExtensionMinutes'] ==
                                                null ||
                                            _tripDetail!['slaExtensionMinutes'] ==
                                                0)
                                          Container(
                                            padding: const EdgeInsets.all(8),
                                            margin: const EdgeInsets.only(
                                              top: 8,
                                            ),
                                            decoration: BoxDecoration(
                                              color: Colors.orange.shade50,
                                              borderRadius:
                                                  BorderRadius.circular(6),
                                              border: Border.all(
                                                color: Colors.orange.shade200,
                                              ),
                                            ),
                                            child: const Row(
                                              children: [
                                                Icon(
                                                  Icons.info,
                                                  color: Colors.orange,
                                                  size: 16,
                                                ),
                                                SizedBox(width: 6),
                                                Expanded(
                                                  child: Text(
                                                    'Your delay update requires admin re-approval',
                                                    style: TextStyle(
                                                      color: Colors.orange,
                                                      fontSize: 12,
                                                      fontStyle:
                                                          FontStyle.italic,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                      ] else ...[
                                        const Text(
                                          'If you\'re experiencing delays, please report them to the admin team.',
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.grey,
                                          ),
                                        ),
                                        const SizedBox(height: 12),
                                        // Report button
                                        SizedBox(
                                          width: double.infinity,
                                          child: ElevatedButton.icon(
                                            onPressed: _showDelayReportDialog,
                                            icon: const Icon(
                                              Icons.report_problem,
                                            ),
                                            label: const Text('REPORT DELAY'),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: Colors.orange,
                                              foregroundColor: Colors.white,
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    vertical: 12,
                                                  ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                            ],

                            // Expandable Orders Section
                            if (_tripDetail!['orders'] != null &&
                                _tripDetail!['orders'] is List &&
                                _tripDetail!['orders'].isNotEmpty)
                              Card(
                                elevation: 4,
                                child: Theme(
                                  data: Theme.of(
                                    context,
                                  ).copyWith(dividerColor: Colors.transparent),
                                  child: ExpansionTile(
                                    initiallyExpanded: _isOrderSectionExpanded,
                                    onExpansionChanged: (expanded) {
                                      setState(() {
                                        _isOrderSectionExpanded = expanded;
                                      });
                                    },
                                    title: Row(
                                      children: [
                                        const Icon(
                                          Icons.inventory_2,
                                          color: Colors.orange,
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          'ORDERS (${(_tripDetail!['orders'] as List).length})',
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.orange,
                                          ),
                                        ),
                                      ],
                                    ),
                                    children: [
                                      Divider(height: 1),
                                      ...(_tripDetail!['orders'] as List).map(
                                        (order) => Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 20,
                                            vertical: 16,
                                          ),
                                          margin: EdgeInsets.only(
                                            bottom:
                                                order ==
                                                    (_tripDetail!['orders']
                                                            as List)
                                                        .last
                                                ? 0
                                                : 8,
                                          ),
                                          decoration: BoxDecoration(
                                            color: _getOrderStatusColor(
                                              order['orderStatus'] ??
                                                  order['status'],
                                            ).withOpacity(0.1),
                                            border: Border(
                                              left: BorderSide(
                                                color: _getOrderStatusColor(
                                                  order['orderStatus'] ??
                                                      order['status'],
                                                ),
                                                width: 4,
                                              ),
                                            ),
                                          ),
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment
                                                        .spaceBetween,
                                                children: [
                                                  Text(
                                                    'Order #${order['orderId']}',
                                                    style: const TextStyle(
                                                      fontSize: 16,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                    ),
                                                  ),
                                                  Container(
                                                    padding:
                                                        const EdgeInsets.symmetric(
                                                          horizontal: 8,
                                                          vertical: 4,
                                                        ),
                                                    decoration: BoxDecoration(
                                                      color: _getOrderStatusColor(
                                                        order['orderStatus'] ??
                                                            order['status'],
                                                      ),
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                            12,
                                                          ),
                                                    ),
                                                    child: Text(
                                                      order['orderStatus'] ??
                                                          order['status'] ??
                                                          'N/A',
                                                      style: const TextStyle(
                                                        color: Colors.white,
                                                        fontSize: 12,
                                                        fontWeight:
                                                            FontWeight.bold,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 12),
                                              Row(
                                                children: [
                                                  const Icon(
                                                    Icons.person,
                                                    size: 16,
                                                    color: Colors.grey,
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Expanded(
                                                    child: Text(
                                                      '${order['customerName'] ?? 'N/A'} �?${order['customerPhone'] ?? 'No phone'}',
                                                      style: const TextStyle(
                                                        fontSize: 14,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 8),
                                              Row(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  const Icon(
                                                    Icons.location_on,
                                                    color: Colors.green,
                                                    size: 16,
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Expanded(
                                                    child: Text(
                                                      'Pickup: ${order['pickupAddress'] ?? 'N/A'}',
                                                      style: const TextStyle(
                                                        fontSize: 13,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 6),
                                              Row(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  const Icon(
                                                    Icons.flag,
                                                    color: Colors.red,
                                                    size: 16,
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Expanded(
                                                    child: Text(
                                                      'Delivery: ${order['deliveryAddress'] ?? 'N/A'}',
                                                      style: const TextStyle(
                                                        fontSize: 13,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              if (order['packageDetails'] !=
                                                  null) ...[
                                                const SizedBox(height: 8),
                                                Row(
                                                  children: [
                                                    const Icon(
                                                      Icons.inventory_2,
                                                      size: 16,
                                                      color: Colors.grey,
                                                    ),
                                                    const SizedBox(width: 8),
                                                    Expanded(
                                                      child: Text(
                                                        'Package: ${order['packageDetails']}',
                                                        style: TextStyle(
                                                          fontSize: 13,
                                                          fontWeight:
                                                              FontWeight.w500,
                                                          color:
                                                              Colors.grey[800],
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ],
                                              // Package specifications - Weight and Value
                                              const SizedBox(height: 4),
                                              Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.start,
                                                children: [
                                                  if (order['packageValue'] !=
                                                      null) ...[
                                                    Icon(
                                                      Icons.monetization_on,
                                                      size: 14,
                                                      color: Colors.green,
                                                    ),
                                                    const SizedBox(width: 4),
                                                    Text(
                                                      'VND ${(order['packageValue'] as num).toInt()}',
                                                      style: const TextStyle(
                                                        fontSize: 12,
                                                        color: Colors.green,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                      ),
                                                    ),
                                                  ],
                                                  if (order['packageValue'] !=
                                                          null &&
                                                      order['weightTons'] != null)
                                                    Text(
                                                      ' ?',
                                                      style: TextStyle(
                                                        color: Colors.grey,
                                                      ),
                                                    ),
                                                  if (order['weightTons'] !=
                                                      null) ...[
                                                    Icon(
                                                      Icons.monitor_weight,
                                                      size: 14,
                                                      color: Colors.blue,
                                                    ),
                                                    const SizedBox(width: 4),
                                                    Text(
                                                      '${(order['weightTons'] as num).toStringAsFixed(2)}t',
                                                      style: const TextStyle(
                                                        fontSize: 12,
                                                        color: Colors.blue,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                      ),
                                                    ),
                                                  ],
                                                ],
                                              ),
                                              if (order['priorityLevel'] !=
                                                      null &&
                                                  order['priorityLevel'] ==
                                                      'URGENT') ...[
                                                const SizedBox(height: 8),
                                                Container(
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                        horizontal: 8,
                                                        vertical: 4,
                                                      ),
                                                  decoration: BoxDecoration(
                                                    color:
                                                        Colors.orange.shade50,
                                                    border: Border.all(
                                                      color: Colors
                                                          .orange
                                                          .shade200,
                                                    ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          4,
                                                        ),
                                                  ),
                                                  child: const Row(
                                                    children: [
                                                      Icon(
                                                        Icons.warning,
                                                        color: Colors.orange,
                                                        size: 14,
                                                      ),
                                                      SizedBox(width: 4),
                                                      Text(
                                                        'URGENT DELIVERY',
                                                        style: TextStyle(
                                                          color: Colors.orange,
                                                          fontWeight:
                                                              FontWeight.bold,
                                                          fontSize: 12,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ],
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),

                            // Bottom padding for FAB
                            const SizedBox(height: 80),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
      floatingActionButton: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          FloatingActionButton(
            heroTag: 'chat',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => DriverChatScreen(
                    tripId: widget.tripId,
                    driverId: _driverId,
                  ),
                ),
              );
            },
            backgroundColor: Colors.deepPurple,
            child: const Icon(Icons.chat_bubble_outline),
          ),
          if (_tripDetail != null &&
              _buildFab() != const SizedBox.shrink()) ...[
            const SizedBox(width: 16),
            _buildFab(),
          ],
        ],
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}
