import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../services/maps/maps_service.dart';
import '../models/customer/order.dart';
import '../models/customer/order_tracking.dart';

class OrderMapView extends StatefulWidget {
  final Order order;
  final TrackOrderResponse? tracking;

  const OrderMapView({
    super.key,
    required this.order,
    this.tracking,
  });

  @override
  State<OrderMapView> createState() => _OrderMapViewState();
}

class _OrderMapViewState extends State<OrderMapView> {
  List<LatLng> routePoints = [];
  bool _loadingRoute = true;
  LatLng? _driverLocation;
  LatLng? _pickupLocation;
  LatLng? _deliveryLocation;

  @override
  void initState() {
    super.initState();
    _loadOrderData();
  }

  @override
  void didUpdateWidget(OrderMapView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.tracking != oldWidget.tracking) {
      _updateDriverLocation();
    }
  }

  void _updateDriverLocation() {
    if (widget.tracking?.currentLat != null && widget.tracking?.currentLng != null) {
      setState(() {
        _driverLocation = LatLng(widget.tracking!.currentLat!, widget.tracking!.currentLng!);
      });
    } else {
      setState(() => _driverLocation = null);
    }
  }

  Future<void> _loadOrderData() async {
    // For now, we'll work with addresses and show points statically
    // In a real implementation, you'd geocode addresses to coordinates
    // or ensure the backend provides coordinates

    // Update driver location from tracking
    _updateDriverLocation();

    // If order has coordinates (if available from backend), use them
    // For now, just focus on driver location tracking

    setState(() => _loadingRoute = false);
  }

  LatLngBounds _calculateBounds() {
    final points = <LatLng>[];

    if (_driverLocation != null) points.add(_driverLocation!);
    if (_pickupLocation != null) points.add(_pickupLocation!);
    if (_deliveryLocation != null) points.add(_deliveryLocation!);

    if (points.isEmpty) return LatLngBounds(LatLng(0, 0), LatLng(0, 0));

    return LatLngBounds.fromPoints(points);
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return Colors.green;
      case 'IN_TRANSIT':
        return Colors.orange;
      case 'ASSIGNED':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loadingRoute) {
      return const Card(
        child: SizedBox(
          height: 300,
          child: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                const Icon(Icons.map, size: 20),
                const SizedBox(width: 8),
                const Text('Order Location', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(widget.order.orderStatus ?? 'PENDING'),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    widget.tracking?.orderStatus ?? widget.order.orderStatus ?? 'PENDING',
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 300,
            child: FlutterMap(
              options: MapOptions(
                initialCenter: _driverLocation ?? LatLng(10.762622, 106.660172), // Default to Ho Chi Minh City
                initialZoom: 12.0,
                maxZoom: 18.0,
                minZoom: 8.0,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.logiflow.client_mobile',
                ),
                MarkerLayer(
                  markers: [
                    // Driver location marker (only show if tracking available)
                    if (_driverLocation != null)
                      Marker(
                        point: _driverLocation!,
                        width: 50,
                        height: 50,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.blue, width: 3),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.2),
                                spreadRadius: 1,
                                blurRadius: 3,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.local_shipping,
                            color: Colors.blue,
                            size: 24,
                          ),
                        ),
                      ),
                    // Pickup location marker (placeholder - would need geocoding)
                    Marker(
                      point: LatLng(10.762622, 106.660172), // Example coordinates
                      width: 40,
                      height: 40,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.green, width: 2),
                        ),
                        child: const Icon(
                          Icons.location_on,
                          color: Colors.green,
                          size: 20,
                        ),
                      ),
                    ),
                    // Delivery location marker (placeholder - would need geocoding)
                    Marker(
                      point: LatLng(10.762622, 106.665172), // Example coordinates
                      width: 40,
                      height: 40,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.red, width: 2),
                        ),
                        child: const Icon(
                          Icons.flag,
                          color: Colors.red,
                          size: 20,
                        ),
                      ),
                    ),
                  ],
                ),
                if (routePoints.isNotEmpty)
                  PolylineLayer(
                    polylines: [
                      Polyline(
                        points: routePoints,
                        strokeWidth: 4.0,
                        color: Colors.blue.shade300,
                      ),
                    ],
                  ),
              ],
            ),
          ),
          if (_driverLocation != null || routePoints.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  if (_driverLocation != null) ...[
                    const Icon(Icons.local_shipping, size: 16, color: Colors.blue),
                    const SizedBox(width: 4),
                    const Text('Driver location available', style: TextStyle(fontSize: 12)),
                  ],
                  if (routePoints.isNotEmpty) ...[
                    const Spacer(),
                    const Icon(Icons.route, size: 16),
                    const SizedBox(width: 4),
                    Text('${routePoints.length} route points', style: TextStyle(fontSize: 12)),
                  ],
                ],
              ),
            ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Text(
              'Note: This is a preview implementation. Actual map shows real-time driver location and order points.',
              style: TextStyle(fontSize: 11, color: Colors.grey, fontStyle: FontStyle.italic),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}
