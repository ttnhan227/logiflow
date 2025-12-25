import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../services/maps/maps_service.dart';
import '../../../models/driver/order.dart';

class TripMapView extends StatefulWidget {
  final Map<String, dynamic> tripDetail;
  final bool compact;
  final List<dynamic>? orders;

  const TripMapView({super.key, required this.tripDetail, this.compact = false, this.orders});

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
    final orders = widget.orders;
    final routeData = widget.tripDetail;

    // DEBUG: Log what we received
    print('TRIP_MAP_VIEW: orders is ${orders == null ? 'null' : 'not null'}, length: ${orders?.length ?? 0}');
    if (orders != null && orders.isNotEmpty) {
      print('TRIP_MAP_VIEW: First order keys: ${orders.first.keys.toList()}');
      final firstOrder = orders.first;
      if (firstOrder is Map) {
        print('TRIP_MAP_VIEW: pickupLat=${firstOrder['pickupLat']}, pickupLng=${firstOrder['pickupLng']}, deliveryLat=${firstOrder['deliveryLat']}, deliveryLng=${firstOrder['deliveryLng']}');
      }
    }

    // PRIMARY: Use orders as checkpoints if available
    if (orders != null && orders.isNotEmpty) {
      final markers = <Marker>[];
      final checkpoints = <LatLng>[];
      double totalLat = 0;
      double totalLng = 0;
      int validLocations = 0;

      // Create numbered checkpoints for each order
      for (var i = 0; i < orders.length; i++) {
        final order = orders[i];

        // Handle both raw Map and DriverOrder objects
        final pickupLat = order is Map ? order['pickupLat'] : (order as dynamic).pickupLat;
        final pickupLng = order is Map ? order['pickupLng'] : (order as dynamic).pickupLng;
        final deliveryLat = order is Map ? order['deliveryLat'] : (order as dynamic).deliveryLat;
        final deliveryLng = order is Map ? order['deliveryLng'] : (order as dynamic).deliveryLng;

        // Pickup location (green checkpoint)
        if (pickupLat != null && pickupLng != null) {
          final lat = pickupLat is double ? pickupLat : double.parse(pickupLat.toString());
          final lng = pickupLng is double ? pickupLng : double.parse(pickupLng.toString());
          final point = LatLng(lat, lng);

          totalLat += lat;
          totalLng += lng;
          validLocations++;
          checkpoints.add(point);

          markers.add(
            Marker(
              point: point,
              width: 50,
              height: 50,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.95),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 6,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    '${i + 1}P',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          );
        }

        // Delivery location (red checkpoint)
        if (deliveryLat != null && deliveryLng != null) {
          final lat = deliveryLat is double ? deliveryLat : double.parse(deliveryLat.toString());
          final lng = deliveryLng is double ? deliveryLng : double.parse(deliveryLng.toString());
          final point = LatLng(lat, lng);

          totalLat += lat;
          totalLng += lng;
          validLocations++;
          checkpoints.add(point);

          markers.add(
            Marker(
              point: point,
              width: 50,
              height: 50,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.95),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 6,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    '${i + 1}D',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          );
        }
      }

      if (validLocations == 0) {
        return const Card(
          child: Padding(
            padding: EdgeInsets.all(16.0),
            child: Text('No location data available for orders.'),
          ),
        );
      }

      final centerLat = totalLat / validLocations;
      final centerLng = totalLng / validLocations;

      // Create route segments connecting waypoints in sequence (like dispatch page)
      final routeSegments = <List<LatLng>>[];

      // Sort orders and create connected route: Order1 Pickup→Delivery → Order2 Pickup→Delivery → etc.
      final sortedOrders = orders.where((order) {
        // Handle both Map and DriverOrder objects
        final orderMap = order is Map ? order : null;
        final orderObj = order is DriverOrder ? order : null;

        final pickupLat = orderMap != null ? orderMap['pickupLat'] : orderObj?.pickupLat;
        final pickupLng = orderMap != null ? orderMap['pickupLng'] : orderObj?.pickupLng;
        final deliveryLat = orderMap != null ? orderMap['deliveryLat'] : orderObj?.deliveryLat;
        final deliveryLng = orderMap != null ? orderMap['deliveryLng'] : orderObj?.deliveryLng;

        return pickupLat != null && pickupLng != null && deliveryLat != null && deliveryLng != null;
      }).toList();

      // Create route segments for each order: Pickup → Delivery
      for (int i = 0; i < sortedOrders.length; i++) {
        final order = sortedOrders[i];
        final orderMap = order is Map ? order : null;
        final orderObj = order is DriverOrder ? order : null;

        final pickupLat = orderMap != null ? orderMap['pickupLat'] : orderObj!.pickupLat!;
        final pickupLng = orderMap != null ? orderMap['pickupLng'] : orderObj!.pickupLng!;
        final deliveryLat = orderMap != null ? orderMap['deliveryLat'] : orderObj!.deliveryLat!;
        final deliveryLng = orderMap != null ? orderMap['deliveryLng'] : orderObj!.deliveryLng!;

        final pickupPoint = LatLng(pickupLat.toDouble(), pickupLng.toDouble());
        final deliveryPoint = LatLng(deliveryLat.toDouble(), deliveryLng.toDouble());

        // For first order: Pickup → Delivery
        if (i == 0) {
          routeSegments.add([pickupPoint, deliveryPoint]);
        } else {
          // For subsequent orders: Previous Delivery → Current Pickup → Current Delivery
          final prevOrder = sortedOrders[i - 1];
          final prevOrderMap = prevOrder is Map ? prevOrder : null;
          final prevOrderObj = prevOrder is DriverOrder ? prevOrder : null;

          final prevDeliveryLat = prevOrderMap != null ? prevOrderMap['deliveryLat'] : prevOrderObj!.deliveryLat!;
          final prevDeliveryLng = prevOrderMap != null ? prevOrderMap['deliveryLng'] : prevOrderObj!.deliveryLng!;

          final prevDeliveryPoint = LatLng(prevDeliveryLat.toDouble(), prevDeliveryLng.toDouble());
          routeSegments.add([prevDeliveryPoint, pickupPoint, deliveryPoint]);
        }
      }

      // Calculate zoom level based on spread of points
      double zoomLevel = 13.0;
      if (checkpoints.length > 1) {
        double maxLat = checkpoints.map((p) => p.latitude).reduce((a, b) => a > b ? a : b);
        double minLat = checkpoints.map((p) => p.latitude).reduce((a, b) => a < b ? a : b);
        double maxLng = checkpoints.map((p) => p.longitude).reduce((a, b) => a > b ? a : b);
        double minLng = checkpoints.map((p) => p.longitude).reduce((a, b) => a < b ? a : b);

        double latDiff = maxLat - minLat;
        double lngDiff = maxLng - minLng;
        double maxDiff = latDiff > lngDiff ? latDiff : lngDiff;

        if (maxDiff > 0.1) zoomLevel = 10.0;
        else if (maxDiff > 0.05) zoomLevel = 11.0;
        else if (maxDiff > 0.02) zoomLevel = 12.0;
        else zoomLevel = 13.0;
      }

      if (widget.compact) {
        return SizedBox(
          height: 300,
          child: FlutterMap(
            options: MapOptions(
              initialCenter: LatLng(centerLat, centerLng),
              initialZoom: zoomLevel,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.logiflow.client_mobile',
              ),
              // Route segments with alternating colors (like dispatch page)
              ...routeSegments.asMap().entries.map((entry) {
                final index = entry.key;
                final segment = entry.value;
                return PolylineLayer(
                  polylines: [
                    Polyline(
                      points: segment,
                      strokeWidth: 4.0,
                      color: index % 2 == 0 ? Colors.blue : Colors.red,
                      borderColor: Colors.white,
                      borderStrokeWidth: 2.0,
                    ),
                  ],
                );
              }),
              MarkerLayer(markers: markers),
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
                  Text(
                    'Trip Route & Checkpoints (${orders.length} orders)',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 16,
                    runSpacing: 8,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 16,
                            height: 16,
                            decoration: const BoxDecoration(
                              color: Colors.green,
                              shape: BoxShape.circle,
                            ),
                            child: const Center(
                              child: Text(
                                '1P',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text('Order Pickups', style: TextStyle(fontSize: 12)),
                        ],
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 16,
                            height: 16,
                            decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                            child: const Center(
                              child: Text(
                                '1D',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text('Order Deliveries', style: TextStyle(fontSize: 12)),
                        ],
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 16,
                            height: 3,
                            color: Colors.blue,
                          ),
                          const SizedBox(width: 6),
                          const Text('Route Path', style: TextStyle(fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            SizedBox(
              height: 300,
              child: FlutterMap(
                options: MapOptions(
                  initialCenter: LatLng(centerLat, centerLng),
                  initialZoom: zoomLevel,
                ),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.logiflow.client_mobile',
                  ),
                  // Route segments with alternating colors (like dispatch page)
                  ...routeSegments.asMap().entries.map((entry) {
                    final index = entry.key;
                    final segment = entry.value;
                    return PolylineLayer(
                      polylines: [
                        Polyline(
                          points: segment,
                          strokeWidth: 4.0,
                          color: index % 2 == 0 ? Colors.blue : Colors.red,
                          borderColor: Colors.white,
                          borderStrokeWidth: 2.0,
                        ),
                      ],
                    );
                  }),
                  MarkerLayer(markers: markers),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // FALLBACK: Use old route coordinates if no orders available
    if (routeData['originLat'] != null && routeData['originLng'] != null &&
        routeData['destinationLat'] != null && routeData['destinationLng'] != null) {

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

    // No location data available
    return const Card(
      child: Padding(
        padding: EdgeInsets.all(16.0),
        child: Text('No location data available for this trip.'),
      ),
    );
  }
}
