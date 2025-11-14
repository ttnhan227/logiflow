import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import '../../models/user.dart';
import 'dart:convert';
import '../main_layout.dart';
import 'driver_trip_detail_screen.dart';

class DriverTripsScreen extends StatefulWidget {
  const DriverTripsScreen({super.key});

  @override
  State<DriverTripsScreen> createState() => _DriverTripsScreenState();
}

class _DriverTripsScreenState extends State<DriverTripsScreen> {
  bool _isLoading = true;
  List<dynamic> _trips = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchTrips();
  }

  Future<void> _fetchTrips() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await apiClient.get('/driver/me/trips');
      if (response.statusCode == 200) {
        setState(() {
          _trips = List.from(jsonDecode(response.body));
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Failed to load trips: ${response.body}';
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

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'My Trips',
      child: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _trips.isEmpty
                  ? const Center(child: Text('No trips available'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
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
                                  builder: (context) => DriverTripDetailScreen(tripId: trip['tripId']),
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
                                      Text('Trip #${trip['tripId']}',
                                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: _getTripStatusColor(trip['status']),
                                          borderRadius: BorderRadius.circular(20),
                                        ),
                                        child: Text(
                                          trip['status']?.toUpperCase() ?? 'N/A',
                                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (trip['assignmentStatus'] != null) ...[
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: _getAssignmentStatusColor(trip['assignmentStatus']),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        'Assignment: ${trip['assignmentStatus']?.toUpperCase()}',
                                        style: const TextStyle(color: Colors.white, fontSize: 10),
                                      ),
                                    ),
                                  ],
                                  const Divider(height: 20),
                                  if (trip['routeName'] != null)
                                    Row(
                                      children: [
                                        const Icon(Icons.route, size: 16, color: Colors.grey),
                                        const SizedBox(width: 8),
                                        Expanded(child: Text(trip['routeName'], style: const TextStyle(fontSize: 14))),
                                      ],
                                    ),
                                  if (trip['scheduledDeparture'] != null) ...[
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        const Icon(Icons.access_time, size: 16, color: Colors.grey),
                                        const SizedBox(width: 8),
                                        Expanded(child: Text('Departure: ${trip['scheduledDeparture']}', style: const TextStyle(fontSize: 13))),
                                      ],
                                    ),
                                  ],
                                  if (trip['vehiclePlate'] != null) ...[
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        const Icon(Icons.local_shipping, size: 16, color: Colors.grey),
                                        const SizedBox(width: 8),
                                        Text('Vehicle: ${trip['vehiclePlate']}', style: const TextStyle(fontSize: 13)),
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
    );
  }
}
