import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import 'dart:convert';
import '../main_layout.dart';

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

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'Trip Detail',
      child: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _tripDetail == null
                  ? const Center(child: Text('No trip detail'))
                  : ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        Text('Trip #${_tripDetail!['tripId']}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 12),
                        Text('Status: ${_tripDetail!['status']}'),
                        Text('Type: ${_tripDetail!['tripType']}'),
                        Text('Scheduled Departure: ${_tripDetail!['scheduledDeparture']}'),
                        Text('Scheduled Arrival: ${_tripDetail!['scheduledArrival']}'),
                        if (_tripDetail!['routeName'] != null) Text('Route: ${_tripDetail!['routeName']}'),
                        if (_tripDetail!['originAddress'] != null) Text('Origin: ${_tripDetail!['originAddress']}'),
                        if (_tripDetail!['destinationAddress'] != null) Text('Destination: ${_tripDetail!['destinationAddress']}'),
                        if (_tripDetail!['vehiclePlate'] != null) Text('Vehicle: ${_tripDetail!['vehiclePlate']}'),
                        if (_tripDetail!['orders'] != null && _tripDetail!['orders'] is List && _tripDetail!['orders'].isNotEmpty)
                          ...[
                            const SizedBox(height: 16),
                            const Text('Orders:', style: TextStyle(fontWeight: FontWeight.bold)),
                            ...(_tripDetail!['orders'] as List).map((order) => ListTile(
                                  title: Text('Order #${order['orderId']}'),
                                  subtitle: Text('Customer: ${order['customerName']}\nStatus: ${order['status']}'),
                                )),
                          ],
                      ],
                    ),
    );
  }
}
