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

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'My Trips',
      child: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : ListView.builder(
                  itemCount: _trips.length,
                  itemBuilder: (context, index) {
                    final trip = _trips[index];
                    return Card(
                      child: ListTile(
                        title: Text('Trip #${trip['tripId']}'),
                        subtitle: Text('Status: ${trip['status']}'),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => DriverTripDetailScreen(tripId: trip['tripId']),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
    );
  }
}
