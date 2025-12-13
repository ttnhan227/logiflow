import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../services/maps/maps_service.dart';

class TripMapView extends StatefulWidget {
  final Map<String, dynamic> tripDetail;
  final bool compact;

  const TripMapView({super.key, required this.tripDetail, this.compact = false});

  @override
  State<TripMapView> createState() => _TripMapViewState();
}

class _TripMapViewState extends State<TripMapView> {
  List<LatLng> routePoints = [];
  bool _loadingRoute = true;
  String? _eta;
  double? _distanceKm;

  @override
  void initState() {
    super.initState();
    _loadRoute();
  }

  Future<void> _loadRoute() async {
    // Get route coordinates from trip detail
    final routeData = widget.tripDetail;
    
    // Check if we have origin and destination coordinates
    if (routeData['originLat'] == null || routeData['originLng'] == null ||
        routeData['destinationLat'] == null || routeData['destinationLng'] == null) {
      setState(() => _loadingRoute = false);
      return;
    }

    try {
      final directions = await mapsService.getDirections(
        routeData['originLat'].toString(),
        routeData['originLng'].toString(),
        routeData['destinationLat'].toString(),
        routeData['destinationLng'].toString(),
      );

      if (directions != null && mounted) {
        // Parse route geometry
        if (directions['geometry'] != null) {
          final geometry = directions['geometry'];
          final List<LatLng> points = [];
          
          if (geometry is List) {
            for (var coord in geometry) {
              if (coord is List && coord.length >= 2) {
                points.add(LatLng(coord[1].toDouble(), coord[0].toDouble()));
              }
            }
          }
          
          setState(() {
            routePoints = points;
            // Parse distance from meters
            if (directions['distanceMeters'] != null) {
              _distanceKm = directions['distanceMeters'] / 1000.0;
            }
            // Calculate ETA from seconds (convert to minutes)
            if (directions['durationSeconds'] != null) {
              final durationMinutes = (directions['durationSeconds'] / 60.0).round();
              _eta = _calculateETA(durationMinutes);
            }
            _loadingRoute = false;
          });
        }
      } else {
        setState(() => _loadingRoute = false);
      }
    } catch (e) {
      print('Error loading route: $e');
      setState(() => _loadingRoute = false);
    }
  }

  String _calculateETA(dynamic durationMinutes) {
    if (durationMinutes == null) return 'N/A';
    
    final duration = durationMinutes is int ? durationMinutes : durationMinutes.toInt();
    final now = DateTime.now();
    final eta = now.add(Duration(minutes: duration));
    
    return '${eta.hour.toString().padLeft(2, '0')}:${eta.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final routeData = widget.tripDetail;
    
    // Check if we have coordinates
    if (routeData['originLat'] == null || routeData['originLng'] == null ||
        routeData['destinationLat'] == null || routeData['destinationLng'] == null) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Text('Map data not available for this trip.'),
        ),
      );
    }

    final originLat = routeData['originLat'] is String 
        ? double.parse(routeData['originLat']) 
        : routeData['originLat'].toDouble();
    final originLng = routeData['originLng'] is String 
        ? double.parse(routeData['originLng']) 
        : routeData['originLng'].toDouble();
    final destLat = routeData['destinationLat'] is String 
        ? double.parse(routeData['destinationLat']) 
        : routeData['destinationLat'].toDouble();
    final destLng = routeData['destinationLng'] is String 
        ? double.parse(routeData['destinationLng']) 
        : routeData['destinationLng'].toDouble();

    if (widget.compact) {
      return SizedBox(
        height: 300,
        child: _loadingRoute
          ? const Center(child: CircularProgressIndicator())
          : FlutterMap(
              options: MapOptions(
                initialCenter: LatLng((originLat + destLat) / 2, (originLng + destLng) / 2),
                initialZoom: 11.0,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.logiflow.client_mobile',
                ),
                if (routePoints.isNotEmpty)
                  PolylineLayer(
                    polylines: [
                      Polyline(
                        points: routePoints,
                        strokeWidth: 4.0,
                        color: Colors.blue,
                      ),
                    ],
                  ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: LatLng(originLat, originLng),
                      width: 40,
                      height: 40,
                      child: const Icon(Icons.location_on, color: Colors.green, size: 40),
                    ),
                    Marker(
                      point: LatLng(destLat, destLng),
                      width: 40,
                      height: 40,
                      child: const Icon(Icons.location_on, color: Colors.red, size: 40),
                    ),
                  ],
                ),
              ],
            ),
      );
    }

    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Route Map', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                if (_eta != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.access_time, size: 16),
                      const SizedBox(width: 4),
                      Text('ETA: $_eta', style: const TextStyle(fontWeight: FontWeight.w500)),
                      if (_distanceKm != null) ...[
                        const SizedBox(width: 16),
                        const Icon(Icons.route, size: 16),
                        const SizedBox(width: 4),
                        Text('${_distanceKm!.toStringAsFixed(1)} km'),
                      ],
                    ],
                  ),
                ],
              ],
            ),
          ),
          SizedBox(
            height: 300,
            child: _loadingRoute
                ? const Center(child: CircularProgressIndicator())
                : FlutterMap(
                    options: MapOptions(
                      initialCenter: LatLng((originLat + destLat) / 2, (originLng + destLng) / 2),
                      initialZoom: 11.0,
                    ),
                    children: [
                      TileLayer(
                        urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        userAgentPackageName: 'com.logiflow.client_mobile',
                      ),
                      if (routePoints.isNotEmpty)
                        PolylineLayer(
                          polylines: [
                            Polyline(
                              points: routePoints,
                              strokeWidth: 4.0,
                              color: Colors.blue,
                            ),
                          ],
                        ),
                      MarkerLayer(
                        markers: [
                          Marker(
                            point: LatLng(originLat, originLng),
                            width: 40,
                            height: 40,
                            child: const Icon(Icons.location_on, color: Colors.green, size: 40),
                          ),
                          Marker(
                            point: LatLng(destLat, destLng),
                            width: 40,
                            height: 40,
                            child: const Icon(Icons.location_on, color: Colors.red, size: 40),
                          ),
                        ],
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
