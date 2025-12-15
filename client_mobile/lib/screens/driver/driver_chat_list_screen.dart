import 'package:flutter/material.dart';
import '../../services/driver/driver_service.dart';
import '../../models/driver/trip.dart';
import 'driver_chat_screen.dart';

class DriverChatListScreen extends StatefulWidget {
  const DriverChatListScreen({super.key});

  @override
  State<DriverChatListScreen> createState() => _DriverChatListScreenState();
}

class _DriverChatListScreenState extends State<DriverChatListScreen> {
  List<DriverTrip> _trips = [];
  bool _loading = false;
  int? _driverId;

  @override
  void initState() {
    super.initState();
    _loadDriverId();
    _loadTrips();
  }

  Future<void> _loadDriverId() async {
    try {
      final profile = await driverService.getProfile();
      setState(() {
        _driverId = profile.userId;
      });
    } catch (e) {
      // Ignore error, driverId will remain null
    }
  }

  Future<void> _loadTrips() async {
    setState(() => _loading = true);
    try {
      final trips = await driverService.getMyTrips();
      // Only show trips that are not completed/cancelled
      final activeTrips = trips.where((t) {
        final status = (t.status ?? '').toUpperCase();
        return status != 'COMPLETED' && status != 'CANCELLED';
      }).toList();

      setState(() {
        _trips = activeTrips;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load trips: $e')),
        );
      }
    }
  }

  Color _getTripStatusColor(String? status) {
    switch (status?.toUpperCase()) {
      case 'SCHEDULED':
        return Colors.blue;
      case 'IN_PROGRESS':
        return Colors.orange;
      case 'ARRIVED':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Trip Chats'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadTrips,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _trips.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey.shade400),
                      const SizedBox(height: 16),
                      Text(
                        'No active trips',
                        style: TextStyle(fontSize: 18, color: Colors.grey.shade600),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Chat with dispatcher will appear here',
                        style: TextStyle(color: Colors.grey.shade500),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadTrips,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _trips.length,
                    itemBuilder: (context, index) {
                      final trip = _trips[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        elevation: 2,
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              color: _getTripStatusColor(trip.status).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              Icons.local_shipping,
                              color: _getTripStatusColor(trip.status),
                              size: 32,
                            ),
                          ),
                          title: Text(
                            'Trip #${trip.tripId}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: _getTripStatusColor(trip.status),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  trip.status?.toUpperCase() ?? 'N/A',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              if (trip.routeName != null) ...[
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const Icon(Icons.route, size: 14, color: Colors.grey),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        trip.routeName!,
                                        style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                          trailing: const Icon(Icons.chat_bubble, color: Colors.deepPurple),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) => DriverChatScreen(
                                  tripId: trip.tripId,
                                  driverId: _driverId,
                                ),
                              ),
                            );
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
