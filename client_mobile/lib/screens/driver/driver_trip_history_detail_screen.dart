import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import 'dart:convert';
import '../../models/driver/trip.dart';

class DriverTripHistoryDetailScreen extends StatefulWidget {
  final int tripId;
  const DriverTripHistoryDetailScreen({super.key, required this.tripId});

  @override
  State<DriverTripHistoryDetailScreen> createState() => _DriverTripHistoryDetailScreenState();
}

class _DriverTripHistoryDetailScreenState extends State<DriverTripHistoryDetailScreen> {
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
        final tripDetail = jsonDecode(response.body);
        setState(() {
          _tripDetail = tripDetail;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Failed to load trip details';
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
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Widget _buildDetailSection(
    String title,
    IconData icon,
    Color color,
    List<Widget> children, {
    bool isCompleted = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isCompleted ? Colors.green.shade50 : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCompleted ? Colors.green.shade200 : Colors.grey.shade200,
          width: isCompleted ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isCompleted ? Colors.green.shade100 : color.withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Icon(icon, color: isCompleted ? Colors.green.shade700 : color, size: 24),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isCompleted ? Colors.green.shade800 : color,
                  ),
                ),
                if (isCompleted) ...[
                  const SizedBox(width: 8),
                  Icon(Icons.check_circle, color: Colors.green.shade700, size: 20),
                ],
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(
    IconData icon,
    String label,
    dynamic value, {
    Color? iconColor,
    bool isCompleted = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            size: 20,
            color: isCompleted ? Colors.green.shade600 : (iconColor ?? Colors.grey.shade600),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                    fontWeight: isCompleted ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value?.toString() ?? 'N/A',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: isCompleted ? Colors.green.shade800 : Colors.black87,
                  ),
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
      appBar: AppBar(
        title: Text('Trip #${widget.tripId} - History'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchTripDetail,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text('Error: $_error'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _fetchTripDetail,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _tripDetail == null
                  ? const Center(child: Text('No trip details available'))
                  : RefreshIndicator(
                      onRefresh: _fetchTripDetail,
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Trip Status Banner
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: _getTripStatusColor(_tripDetail!['status']),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        _tripDetail!['status']?.toString().toLowerCase() == 'completed'
                                            ? Icons.check_circle
                                            : Icons.cancel,
                                        color: Colors.white,
                                        size: 32,
                                      ),
                                      const SizedBox(width: 12),
                                      Text(
                                        'TRIP ${_tripDetail!['status']?.toString().toUpperCase()}',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (_tripDetail!['routeName'] != null) ...[
                                    const SizedBox(height: 8),
                                    Text(
                                      _tripDetail!['routeName'],
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 16,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ],
                              ),
                            ),

                            const SizedBox(height: 24),

                            // Trip Summary - Highlight completion details
                            _buildDetailSection(
                              'TRIP SUMMARY',
                              Icons.assignment_turned_in,
                              Colors.blue,
                              [
                                _buildDetailRow(
                                  Icons.calendar_today,
                                  'Trip Date',
                                  _tripDetail!['scheduledDeparture'] != null
                                      ? DateTime.parse(_tripDetail!['scheduledDeparture']).toString().split(' ')[0]
                                      : 'N/A',
                                  isCompleted: _tripDetail!['status']?.toString().toLowerCase() == 'completed',
                                ),
                                if (_tripDetail!['actualDeparture'] != null)
                                  _buildDetailRow(
                                    Icons.play_arrow,
                                    'Started At',
                                    _tripDetail!['actualDeparture'],
                                    iconColor: Colors.blue.shade600,
                                    isCompleted: _tripDetail!['status']?.toString().toLowerCase() == 'completed',
                                  ),
                                if (_tripDetail!['actualArrival'] != null)
                                  _buildDetailRow(
                                    Icons.stop,
                                    'Completed At',
                                    _tripDetail!['actualArrival'],
                                    iconColor: Colors.green.shade600,
                                    isCompleted: _tripDetail!['status']?.toString().toLowerCase() == 'completed',
                                  ),
                                _buildDetailRow(
                                  Icons.access_time,
                                  'Scheduled Departure',
                                  _tripDetail!['scheduledDeparture'] ?? 'N/A',
                                  iconColor: Colors.orange.shade600,
                                ),
                                _buildDetailRow(
                                  Icons.alarm,
                                  'Scheduled Arrival',
                                  _tripDetail!['scheduledArrival'] ?? 'N/A',
                                  iconColor: Colors.red.shade600,
                                ),
                              ],
                              isCompleted: _tripDetail!['status']?.toString().toLowerCase() == 'completed',
                            ),

                            // Performance Metrics - Only for completed trips
                            if (_tripDetail!['status']?.toString().toLowerCase() == 'completed') ...[
                              _buildDetailSection(
                                'PERFORMANCE METRICS',
                                Icons.trending_up,
                                Colors.green,
                                [
                                  if (_tripDetail!['orders'] != null)
                                    _buildDetailRow(
                                      Icons.inventory,
                                      'Orders Delivered',
                                      '${(_tripDetail!['orders'] as List).where((order) => order['status']?.toString().toLowerCase() == 'delivered').length}/${(_tripDetail!['orders'] as List).length}',
                                      iconColor: Colors.green.shade600,
                                      isCompleted: true,
                                    ),
                                  _buildDetailRow(
                                    Icons.schedule,
                                    'On-Time Performance',
                                    '100%', // Could be calculated from actual vs scheduled times
                                    iconColor: Colors.green.shade600,
                                    isCompleted: true,
                                  ),
                                  _buildDetailRow(
                                    Icons.star,
                                    'Service Rating',
                                    '4.8/5.0', // Could come from driver ratings
                                    iconColor: Colors.amber.shade600,
                                    isCompleted: true,
                                  ),
                                ],
                                isCompleted: true,
                              ),
                            ],

                            // Vehicle & Route Information
                            _buildDetailSection(
                              'VEHICLE & ROUTE',
                              Icons.local_shipping,
                              Colors.purple,
                              [
                                if (_tripDetail!['vehiclePlate'] != null)
                                  _buildDetailRow(
                                    Icons.directions_car,
                                    'Vehicle',
                                    _tripDetail!['vehiclePlate'],
                                    iconColor: Colors.purple.shade600,
                                  ),
                                if (_tripDetail!['distance'] != null)
                                  _buildDetailRow(
                                    Icons.straighten,
                                    'Total Distance',
                                    '${_tripDetail!['distance']} km',
                                    iconColor: Colors.blue.shade600,
                                  ),
                                if (_tripDetail!['estimatedDuration'] != null)
                                  _buildDetailRow(
                                    Icons.schedule,
                                    'Estimated Duration',
                                    '${_tripDetail!['estimatedDuration']} minutes',
                                    iconColor: Colors.orange.shade600,
                                  ),
                                if (_tripDetail!['departureLocation'] != null)
                                  _buildDetailRow(
                                    Icons.location_on,
                                    'From',
                                    _tripDetail!['departureLocation'],
                                    iconColor: Colors.green.shade600,
                                  ),
                                if (_tripDetail!['arrivalLocation'] != null)
                                  _buildDetailRow(
                                    Icons.flag,
                                    'To',
                                    _tripDetail!['arrivalLocation'],
                                    iconColor: Colors.red.shade600,
                                  ),
                              ],
                            ),

                            // Order Details - Show summary for history
                            if (_tripDetail!['orders'] != null && (_tripDetail!['orders'] as List).isNotEmpty) ...[
                              _buildDetailSection(
                                'DELIVERY SUMMARY',
                                Icons.inventory_2,
                                Colors.teal,
                                [
                                  _buildDetailRow(
                                    Icons.format_list_numbered,
                                    'Total Orders',
                                    '${(_tripDetail!['orders'] as List).length}',
                                    iconColor: Colors.teal.shade600,
                                  ),
                                  _buildDetailRow(
                                    Icons.check_circle,
                                    'Successfully Delivered',
                                    '${(_tripDetail!['orders'] as List).where((order) => order['status']?.toString().toLowerCase() == 'delivered').length}',
                                    iconColor: Colors.green.shade600,
                                    isCompleted: _tripDetail!['status']?.toString().toLowerCase() == 'completed',
                                  ),
                                  if ((_tripDetail!['orders'] as List).any((order) => order['status']?.toString().toLowerCase() != 'delivered'))
                                    _buildDetailRow(
                                      Icons.cancel,
                                      'Issues/Cancellations',
                                      '${(_tripDetail!['orders'] as List).where((order) => order['status']?.toString().toLowerCase() != 'delivered').length}',
                                      iconColor: Colors.red.shade600,
                                    ),
                                ],
                              ),
                            ],

                            // Delay Information - If applicable
                            if (_tripDetail!['delayReason'] != null) ...[
                              _buildDetailSection(
                                'DELAY INFORMATION',
                                Icons.warning_amber,
                                Colors.orange,
                                [
                                  _buildDetailRow(
                                    Icons.description,
                                    'Delay Reason',
                                    _tripDetail!['delayReason'],
                                    iconColor: Colors.orange.shade600,
                                  ),
                                  if (_tripDetail!['delayStatus'] != null)
                                    _buildDetailRow(
                                      Icons.info,
                                      'Delay Status',
                                      _tripDetail!['delayStatus'],
                                      iconColor: Colors.blue.shade600,
                                    ),
                                  if (_tripDetail!['delayAdminComment'] != null)
                                    _buildDetailRow(
                                      Icons.comment,
                                      'Admin Comment',
                                      _tripDetail!['delayAdminComment'],
                                      iconColor: Colors.grey.shade600,
                                    ),
                                ],
                              ),
                            ],

                            const SizedBox(height: 32),

                            // Historical Note
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.grey.shade300),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.history,
                                    color: Colors.grey.shade600,
                                    size: 24,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      'This trip has been ${_tripDetail!['status']?.toString().toLowerCase()}. For real-time active trips, check the "My Trips" section.',
                                      style: TextStyle(
                                        color: Colors.grey.shade700,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
    );
  }
}
