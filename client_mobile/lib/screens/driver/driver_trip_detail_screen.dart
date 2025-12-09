import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../services/driver/driver_service.dart';
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
  Map<String, dynamic>? _tripDetail;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchTripDetail();
  }

  Future<void> _fetchTripDetail() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await apiClient.get('/driver/me/trips/${widget.tripId}');
      if (response.statusCode == 200) {
        setState(() {
          _tripDetail = jsonDecode(response.body);
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Trip Detail'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(child: Text(_error!))
          : _tripDetail == null
          ? const Center(child: Text('No trip detail'))
          : ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Trip Header Card
          Card(
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Trip #${_tripDetail!['tripId']}', 
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: _getTripStatusColor(_tripDetail!['status']),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          _tripDetail!['status']?.toUpperCase() ?? 'N/A',
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  if (_tripDetail!['assignmentStatus'] != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getAssignmentStatusColor(_tripDetail!['assignmentStatus']),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Assignment: ${_tripDetail!['assignmentStatus']?.toUpperCase()}',
                        style: const TextStyle(color: Colors.white, fontSize: 11),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          // Trip Details Card
          Card(
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Trip Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const Divider(height: 16),
                  _buildDetailRow(Icons.category, 'Type', _tripDetail!['tripType']),
                  const SizedBox(height: 8),
                  _buildDetailRow(Icons.access_time, 'Departure', _tripDetail!['scheduledDeparture']),
                  const SizedBox(height: 8),
                  _buildDetailRow(Icons.alarm, 'Arrival', _tripDetail!['scheduledArrival']),
                  if (_tripDetail!['vehiclePlate'] != null) ...[
                    const SizedBox(height: 8),
                    _buildDetailRow(Icons.local_shipping, 'Vehicle', _tripDetail!['vehiclePlate']),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          // Route Card
          if (_tripDetail!['routeName'] != null || _tripDetail!['originAddress'] != null || _tripDetail!['destinationAddress'] != null)
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Route Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const Divider(height: 16),
                    if (_tripDetail!['routeName'] != null)
                      _buildDetailRow(Icons.route, 'Route', _tripDetail!['routeName']),
                    if (_tripDetail!['originAddress'] != null) ...[
                      const SizedBox(height: 8),
                      _buildDetailRow(Icons.location_on, 'Origin', _tripDetail!['originAddress'], iconColor: Colors.green),
                    ],
                    if (_tripDetail!['destinationAddress'] != null) ...[
                      const SizedBox(height: 8),
                      _buildDetailRow(Icons.flag, 'Destination', _tripDetail!['destinationAddress'], iconColor: Colors.red),
                    ],
                  ],
                ),
              ),
            ),
          if (_tripDetail!['orders'] != null && _tripDetail!['orders'] is List && _tripDetail!['orders'].isNotEmpty)
            ...[
              const SizedBox(height: 16),
              const Text('Orders:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ...(_tripDetail!['orders'] as List).map((order) => Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Order #${order['orderId']}', 
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: _getOrderStatusColor(order['orderStatus'] ?? order['status']),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              order['orderStatus'] ?? order['status'] ?? 'N/A',
                              style: const TextStyle(color: Colors.white, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 16),
                      Row(
                        children: [
                          const Icon(Icons.person, size: 16, color: Colors.grey),
                          const SizedBox(width: 8),
                          Expanded(child: Text('Customer: ${order['customerName'] ?? 'N/A'}')),
                        ],
                      ),
                      if (order['customerPhone'] != null) ...[
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.phone, size: 16, color: Colors.grey),
                            const SizedBox(width: 8),
                            Expanded(child: Text('Phone: ${order['customerPhone']}')),
                          ],
                        ),
                      ],
                      const SizedBox(height: 6),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.location_on, size: 16, color: Colors.green),
                          const SizedBox(width: 8),
                          Expanded(child: Text('Pickup: ${order['pickupAddress'] ?? 'N/A'}', 
                            style: const TextStyle(fontSize: 13))),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.flag, size: 16, color: Colors.red),
                          const SizedBox(width: 8),
                          Expanded(child: Text('Delivery: ${order['deliveryAddress'] ?? 'N/A'}', 
                            style: const TextStyle(fontSize: 13))),
                        ],
                      ),
                      if (order['packageDetails'] != null) ...[
                        const SizedBox(height: 6),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.inventory_2, size: 16, color: Colors.grey),
                            const SizedBox(width: 8),
                            Expanded(child: Text('Package: ${order['packageDetails']}', 
                              style: const TextStyle(fontSize: 13))),
                          ],
                        ),
                      ],
                      if (order['priorityLevel'] != null && order['priorityLevel'] == 'URGENT') ...[
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.warning, size: 16, color: Colors.orange),
                            const SizedBox(width: 8),
                            const Text('URGENT DELIVERY', 
                              style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 13)),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              )),
            ],
          const SizedBox(height: 24),
          TripMapView(tripDetail: _tripDetail!),
          const SizedBox(height: 24),
          if (_tripDetail!['assignmentStatus'] == 'assigned')
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: () async {
                    setState(() => _isLoading = true);
                    try {
                      await driverService.acceptTrip(_tripDetail!['tripId']);
                      await _fetchTripDetail();
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Trip accepted.')));
                    } catch (e) {
                      setState(() => _isLoading = false);
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to accept trip: $e')));
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                  child: const Text('Accept'),
                ),
                const SizedBox(width: 16),
                ElevatedButton(
                  onPressed: () async {
                    setState(() => _isLoading = true);
                    try {
                      await driverService.declineTrip(_tripDetail!['tripId']);
                      await _fetchTripDetail();
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Trip declined.')));
                    } catch (e) {
                      setState(() => _isLoading = false);
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to decline trip: $e')));
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  child: const Text('Decline'),
                ),
              ],
            ),
          const SizedBox(height: 16),
          if (_tripDetail!['status'] == 'scheduled' && _tripDetail!['assignmentStatus'] == 'accepted')
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: () async {
                    setState(() => _isLoading = true);
                    try {
                      await driverService.updateTripStatus(_tripDetail!['tripId'], 'in_progress');
                      await _fetchTripDetail();
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Trip started.')));
                    } catch (e) {
                      setState(() => _isLoading = false);
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to start trip: $e')));
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                  child: const Text('Start Trip'),
                ),
                const SizedBox(width: 16),
                ElevatedButton(
                  onPressed: () async {
                    setState(() => _isLoading = true);
                    try {
                      await driverService.cancelTrip(_tripDetail!['tripId']);
                      await _fetchTripDetail();
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Trip cancelled.')));
                    } catch (e) {
                      setState(() => _isLoading = false);
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to cancel trip: $e')));
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.grey),
                  child: const Text('Cancel'),
                ),
              ],
            ),
          if (_tripDetail!['status'] == 'in_progress')
            ElevatedButton(
              onPressed: () async {
                setState(() => _isLoading = true);
                try {
                  await driverService.updateTripStatus(_tripDetail!['tripId'], 'arrived');
                  await _fetchTripDetail();
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Marked as arrived.')));
                } catch (e) {
                  setState(() => _isLoading = false);
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to mark as arrived: $e')));
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
              child: const Text('Mark as Arrived'),
            ),
          if (_tripDetail!['status'] == 'arrived' || _tripDetail!['status'] == 'in_progress')
            ElevatedButton(
              onPressed: () async {
                // Navigate to delivery confirmation screen
                final confirmed = await Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => DeliveryConfirmationScreen(tripId: _tripDetail!['tripId']),
                  ),
                );
                
                if (confirmed == true) {
                  await _fetchTripDetail();
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
              child: const Text('Confirm Delivery'),
            ),
        ],
      ),
    );
  }
}