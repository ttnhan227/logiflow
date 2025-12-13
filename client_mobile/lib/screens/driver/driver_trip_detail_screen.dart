import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../services/driver/driver_service.dart';
import '../../services/gps/gps_tracking_service.dart';
import 'dart:convert';
import 'widgets/trip_map_view.dart';
import 'delivery_confirmation_screen.dart';

class DriverTripDetailScreen extends StatefulWidget {
  final int tripId;
  const DriverTripDetailScreen({super.key, required this.tripId});

  @override
  State<DriverTripDetailScreen> createState() => _DriverTripDetailScreenState();
}

class _DriverTripDetailScreenState extends State<DriverTripDetailScreen> {
  bool _isLoading = true;
  bool _isOrderSectionExpanded = true;
  Map<String, dynamic>? _tripDetail;
  String? _error;
  String? _previousTripStatus;
  bool? _hasActiveAssignment;

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
    if (gpsTrackingService.isTracking && gpsTrackingService.currentTripId == widget.tripId.toString()) {
      gpsTrackingService.disconnect();
    }
    super.dispose();
  }

  Future<void> _handleGpsTrackingForTripStatus(String status, String tripId) async {
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
        if (gpsTrackingService.isTracking && gpsTrackingService.currentTripId == tripId) {
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

  Future<void> _fetchTripDetail() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await apiClient.get('/driver/me/trips/${widget.tripId}');
      if (response.statusCode == 200) {
        final newTripDetail = jsonDecode(response.body);

        // Check if trip status changed and handle GPS tracking accordingly
        final previousStatus = _tripDetail?['status'];
        final newStatus = newTripDetail['status'];

        if (previousStatus != newStatus || _previousTripStatus != newStatus) {
          await _handleGpsTrackingForTripStatus(newStatus, newTripDetail['tripId'].toString());
        }

        setState(() {
          _tripDetail = newTripDetail;
          _previousTripStatus = newStatus;
          // Debug: Print orders data
          print('Trip Detail Response: ${response.body}');
          print('Orders data: ${_tripDetail!['orders']}');
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Failed to load trip: ${response.body}';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error: $e';
        _isLoading = false;
      });
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

  Widget _buildDetailRow(IconData icon, String label, dynamic value, {Color? iconColor}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: iconColor ?? Colors.grey.shade600),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
              const SizedBox(height: 2),
              Text(value?.toString() ?? 'N/A', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ],
    );
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
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Trip accepted.')));
          } catch (e) {
            setState(() => _isLoading = false);
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to accept trip: $e')));
          }
        };
      }
    } else if (_tripDetail!['status'] == 'scheduled' && _tripDetail!['assignmentStatus'] == 'accepted') {
      buttonText = 'START TRIP';
      action = () async {
        setState(() => _isLoading = true);
        try {
          await driverService.updateTripStatus(_tripDetail!['tripId'], 'in_progress');
          await _fetchTripDetail();
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Trip started.')));
        } catch (e) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to start trip: $e')));
        }
      };
    } else if (_tripDetail!['status'] == 'in_progress') {
      buttonText = 'ARRIVED';
      action = () async {
        setState(() => _isLoading = true);
        try {
          await driverService.updateTripStatus(_tripDetail!['tripId'], 'arrived');
          await _fetchTripDetail();
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Marked as arrived.')));
        } catch (e) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to mark as arrived: $e')));
        }
      };
    } else if (_tripDetail!['status'] == 'arrived' || _tripDetail!['status'] == 'in_progress') {
      buttonText = 'DELIVER';
      action = () async {
        final confirmed = await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => DeliveryConfirmationScreen(tripId: _tripDetail!['tripId']),
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
        style: const TextStyle(
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
      ),
      icon: Icon(action != null ? Icons.play_arrow : Icons.block),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: _tripDetail != null ? _buildFab() : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(child: Text(_error!))
          : _tripDetail == null
          ? const Center(child: Text('No trip detail'))
          : CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 240,
            backgroundColor: Colors.white,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                color: Colors.grey[100],
                child: TripMapView(tripDetail: _tripDetail!, compact: true),
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
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getTripStatusColor(_tripDetail!['status']),
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
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: _getAssignmentStatusColor(_tripDetail!['assignmentStatus']),
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
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.category, color: Colors.blue),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Type',
                                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                                    ),
                                    Text(
                                      _tripDetail!['tripType'] ?? 'N/A',
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
                          _buildDetailRow(Icons.access_time, 'Departure', _tripDetail!['scheduledDeparture']),
                          const SizedBox(height: 12),
                          _buildDetailRow(Icons.alarm, 'Arrival', _tripDetail!['scheduledArrival']),
                          if (_tripDetail!['vehiclePlate'] != null) ...[
                            const SizedBox(height: 12),
                            _buildDetailRow(Icons.local_shipping, 'Vehicle', _tripDetail!['vehiclePlate']),
                          ],
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Route Info Card
                  if (_tripDetail!['routeName'] != null || _tripDetail!['originAddress'] != null || _tripDetail!['destinationAddress'] != null)
                    Card(
                      elevation: 4,
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.route, color: Colors.green),
                                SizedBox(width: 8),
                                Text(
                                  'ROUTE INFORMATION',
                                  style: TextStyle(
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
                                  const Text('Route: ',
                                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                                  Expanded(
                                    child: Text(
                                      _tripDetail!['routeName']!,
                                      style: const TextStyle(fontSize: 14),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                            ],
                            Row(
                              children: [
                                const Icon(Icons.location_on, color: Colors.green, size: 20),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'FROM: ${_tripDetail!['originAddress'] ?? 'N/A'}',
                                    style: const TextStyle(fontSize: 14),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.flag, color: Colors.red, size: 20),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'TO: ${_tripDetail!['destinationAddress'] ?? 'N/A'}',
                                    style: const TextStyle(fontSize: 14),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),

                  const SizedBox(height: 16),

                  // Expandable Orders Section
                  if (_tripDetail!['orders'] != null && _tripDetail!['orders'] is List && _tripDetail!['orders'].isNotEmpty)
                    Card(
                      elevation: 4,
                      child: Theme(
                        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                        child: ExpansionTile(
                          initiallyExpanded: _isOrderSectionExpanded,
                          onExpansionChanged: (expanded) {
                            setState(() {
                              _isOrderSectionExpanded = expanded;
                            });
                          },
                          title: Row(
                            children: [
                              const Icon(Icons.inventory_2, color: Colors.orange),
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
                            ...(_tripDetail!['orders'] as List).map((order) => Container(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                              margin: EdgeInsets.only(
                                bottom: order == (_tripDetail!['orders'] as List).last ? 0 : 8,
                              ),
                              decoration: BoxDecoration(
                                color: _getOrderStatusColor(order['orderStatus'] ?? order['status']).withOpacity(0.1),
                                border: Border(
                                  left: BorderSide(
                                    color: _getOrderStatusColor(order['orderStatus'] ?? order['status']),
                                    width: 4,
                                  ),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'Order #${order['orderId']}',
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: _getOrderStatusColor(order['orderStatus'] ?? order['status']),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          order['orderStatus'] ?? order['status'] ?? 'N/A',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      const Icon(Icons.person, size: 16, color: Colors.grey),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          '${order['customerName'] ?? 'N/A'} • ${order['customerPhone'] ?? 'No phone'}',
                                          style: const TextStyle(fontSize: 14),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Icon(Icons.location_on, color: Colors.green, size: 16),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          'Pickup: ${order['pickupAddress'] ?? 'N/A'}',
                                          style: const TextStyle(fontSize: 13),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Icon(Icons.flag, color: Colors.red, size: 16),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          'Delivery: ${order['deliveryAddress'] ?? 'N/A'}',
                                          style: const TextStyle(fontSize: 13),
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (order['packageDetails'] != null) ...[
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        const Icon(Icons.inventory_2, size: 16, color: Colors.grey),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            'Package: ${order['packageDetails']}',
                                            style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w500,
                                              color: Colors.grey[800]
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                  // Package specifications - Weight and Value
                                  const SizedBox(height: 4),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.start,
                                    children: [
                                      if (order['packageValue'] != null) ...[
                                        Icon(Icons.monetization_on, size: 14, color: Colors.green),
                                        const SizedBox(width: 4),
                                        Text(
                                          'VND ${(order['packageValue'] as num).toInt()}',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: Colors.green,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                      if (order['packageValue'] != null && order['weightKg'] != null)
                                        Text(' • ', style: TextStyle(color: Colors.grey)),
                                      if (order['weightKg'] != null) ...[
                                        Icon(Icons.monitor_weight, size: 14, color: Colors.blue),
                                        const SizedBox(width: 4),
                                        Text(
                                          '${(order['weightKg'] as num).toStringAsFixed(1)}kg',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: Colors.blue,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                  if (order['priorityLevel'] != null && order['priorityLevel'] == 'URGENT') ...[
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.orange.shade50,
                                        border: Border.all(color: Colors.orange.shade200),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Row(
                                        children: [
                                          Icon(Icons.warning, color: Colors.orange, size: 14),
                                          SizedBox(width: 4),
                                          Text(
                                            'URGENT DELIVERY',
                                            style: TextStyle(
                                              color: Colors.orange,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            )),
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
    );
  }
}
