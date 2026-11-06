import '../../theme/app_theme.dart';
import 'package:flutter/material.dart';
import '../../services/driver/driver_service.dart';
import '../../models/driver/trip.dart';
import 'driver_trip_history_detail_screen.dart';

class DriverTripHistoryScreen extends StatefulWidget {
  const DriverTripHistoryScreen({super.key});

  @override
  State<DriverTripHistoryScreen> createState() =>
      _DriverTripHistoryScreenState();
}

class _DriverTripHistoryScreenState extends State<DriverTripHistoryScreen> {
  List<DriverTrip> _trips = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTripHistory();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Follow driver screen pattern - refresh when returning to this screen
    // Drivers should see updated trip status after navigation
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && !_isLoading) {
        // Add a small delay to ensure navigation is fully complete
        Future.delayed(const Duration(milliseconds: 200), () {
          if (mounted) {
            _loadTripHistory();
          }
        });
      }
    });
  }

  Future<void> _loadTripHistory() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final trips = await driverService.getMyTrips();
      final filteredTrips = trips.where((trip) {
        final status = trip.status?.toLowerCase();
        return status == 'completed' || status == 'cancelled';
      }).toList();

      // Sort by most recent first
      filteredTrips.sort((a, b) {
        if (a.scheduledDeparture != null && b.scheduledDeparture != null) {
          return b.scheduledDeparture!.compareTo(a.scheduledDeparture!);
        }
        return b.tripId.compareTo(a.tripId);
      });

      setState(() {
        _trips = filteredTrips;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _refresh() async {
    await _loadTripHistory();
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
                              Icon(Icons.history, size: 64, color: Colors.grey),
                              SizedBox(height: 16),
                              Text(
                                'No completed trips',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey,
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Your trip history will appear here',
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
                                    DriverTripHistoryDetailScreen(
                                      tripId: trip.tripId,
                                    ),
                              ),
                            );
                          },
                          child: AppTheme.buildDispatchCard(
                            title: 'ARCHIVED TRIP #${trip.tripId}',
                            icon: Icons.history_rounded,
                            headerIconColor: AppTheme.primary,
                            trailing: AppTheme.buildStatusPill(trip.status ?? 'COMPLETED'),
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
                              if (trip.departureLocation != null || trip.arrivalLocation != null) ...[
                                const SizedBox(height: 10),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: AppTheme.surfaceMuted,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Column(
                                    children: [
                                      if (trip.departureLocation != null)
                                        Row(
                                          children: [
                                            const Icon(Icons.circle, size: 8, color: AppTheme.primary),
                                            const SizedBox(width: 6),
                                            Expanded(
                                              child: Text(
                                                'From: ${trip.departureLocation}',
                                                style: const TextStyle(fontSize: 11.5, color: AppTheme.text),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                          ],
                                        ),
                                      if (trip.departureLocation != null && trip.arrivalLocation != null)
                                        const SizedBox(height: 4),
                                      if (trip.arrivalLocation != null)
                                        Row(
                                          children: [
                                            const Icon(Icons.location_on, size: 10, color: AppTheme.routeOrange),
                                            const SizedBox(width: 6),
                                            Expanded(
                                              child: Text(
                                                'To: ${trip.arrivalLocation}',
                                                style: const TextStyle(fontSize: 11.5, color: AppTheme.text, fontWeight: FontWeight.w600),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                          ],
                                        ),
                                    ],
                                  ),
                                ),
                              ],
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  if (trip.scheduledDeparture != null)
                                    Text(
                                      'Date: ${_formatDate(DateTime.parse(trip.scheduledDeparture!))}',
                                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                    )
                                  else
                                    const SizedBox.shrink(),
                                  Row(
                                    children: const [
                                      Text(
                                        'VIEW LOG',
                                        style: TextStyle(
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.w800,
                                          letterSpacing: 0.5,
                                          color: AppTheme.routeOrange,
                                        ),
                                      ),
                                      SizedBox(width: 4),
                                      Icon(Icons.arrow_forward_rounded, size: 12, color: AppTheme.routeOrange),
                                    ],
                                  ),
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
