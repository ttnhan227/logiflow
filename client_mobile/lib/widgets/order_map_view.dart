import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../models/customer/order.dart';
import '../models/customer/order_tracking.dart';
import '../services/maps/maps_service.dart';

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
  final MapController _mapController = MapController();

  bool _loading = true;

  LatLng? _driverLocation;
  LatLng? _pickupLocation;
  LatLng? _deliveryLocation;

  // follow driver
  double _currentZoom = 15.0;
  bool _userMovedMap = false;

  String? _lastPickupAddr;
  String? _lastDeliveryAddr;
  bool _geocoding = false;

  @override
  void initState() {
    super.initState();
    _initMapData();
  }

  @override
  void didUpdateWidget(covariant OrderMapView oldWidget) {
    super.didUpdateWidget(oldWidget);

    // tracking đổi -> chỉ follow driver
    if (widget.tracking != oldWidget.tracking) {
      _updateDriverLocationAndFollow();
    }

    // address đổi (hiếm) -> mới geocode lại
    if (widget.order.pickupAddress != oldWidget.order.pickupAddress ||
        widget.order.deliveryAddress != oldWidget.order.deliveryAddress) {
      _ensurePickupDeliveryGeocoded();
    }
  }

  Future<void> _initMapData() async {
    _updateDriverLocationAndFollow(animate: false);
    await _geocodePickupDelivery();
    if (!mounted) return;
    setState(() => _loading = false);

    // sau khi có pickup/delivery/driver -> fit bounds cho đẹp
    WidgetsBinding.instance.addPostFrameCallback((_) => _fitBoundsIfPossible());
  }

  Future<void> _loadOrderData() async {
    // update driver nhẹ
    _updateDriverLocationAndFollow(animate: false);

    // geocode pickup/delivery 1 lần (hoặc khi address đổi)
    await _ensurePickupDeliveryGeocoded();

    if (mounted) {
      setState(() => _loading = false);
    }
  }

  void _updateDriverLocationAndFollow({bool animate = true}) {
    final lat = widget.tracking?.currentLat;
    final lng = widget.tracking?.currentLng;

    if (lat == null || lng == null) {
      setState(() => _driverLocation = null);
      return;
    }

    final newLoc = LatLng(lat, lng);
    final changed = _driverLocation == null ||
        _driverLocation!.latitude != newLoc.latitude ||
        _driverLocation!.longitude != newLoc.longitude;

    if (!changed) return;

    setState(() => _driverLocation = newLoc);

    // ✅ auto-follow trừ khi user đã kéo map
    if (!_userMovedMap && animate) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _mapController.move(newLoc, _currentZoom);
      });
    }
  }

  Future<void> _geocodePickupDelivery() async {
    final pickupAddr = (widget.order.pickupAddress ?? '').trim();
    final deliveryAddr = (widget.order.deliveryAddress ?? '').trim();

    // Chống bắn lại nhiều lần
    // Nếu đã có location rồi và address không đổi, thì bỏ qua (didUpdateWidget đã check)
    try {
      if (pickupAddr.isNotEmpty) {
        final p = await mapsService.geocodeAddress(pickupAddr);
        if (p != null) {
          _pickupLocation = LatLng(p.latitude, p.longitude);
        } else {
          _pickupLocation = null;
        }
      } else {
        _pickupLocation = null;
      }

      if (deliveryAddr.isNotEmpty) {
        final d = await mapsService.geocodeAddress(deliveryAddr);
        if (d != null) {
          _deliveryLocation = LatLng(d.latitude, d.longitude);
        } else {
          _deliveryLocation = null;
        }
      } else {
        _deliveryLocation = null;
      }

      if (mounted) setState(() {});
    } catch (_) {
      // im lặng: không để fail map
    }
  }

  Future<void> _ensurePickupDeliveryGeocoded() async {
    if (_geocoding) return;

    final pickupAddr = (widget.order.pickupAddress ?? '').trim();
    final deliveryAddr = (widget.order.deliveryAddress ?? '').trim();

    final pickupUnchanged = pickupAddr == _lastPickupAddr;
    final deliveryUnchanged = deliveryAddr == _lastDeliveryAddr;
    if (pickupUnchanged && deliveryUnchanged) return;

    _geocoding = true;
    try {
      if (!pickupUnchanged) {
        _lastPickupAddr = pickupAddr;
        if (pickupAddr.isNotEmpty) {
          final p = await mapsService.geocodeAddress(pickupAddr);
          _pickupLocation = (p != null) ? LatLng(p.latitude, p.longitude) : null;
        } else {
          _pickupLocation = null;
        }
      }

      if (!deliveryUnchanged) {
        _lastDeliveryAddr = deliveryAddr;
        if (deliveryAddr.isNotEmpty) {
          final d = await mapsService.geocodeAddress(deliveryAddr);
          _deliveryLocation = (d != null) ? LatLng(d.latitude, d.longitude) : null;
        } else {
          _deliveryLocation = null;
        }
      }
    } catch (_) {
      // ignore
    } finally {
      _geocoding = false;
    }

    if (mounted) setState(() {});
  }

  void _fitBoundsIfPossible() {
    final points = <LatLng>[];
    if (_driverLocation != null) points.add(_driverLocation!);
    if (_pickupLocation != null) points.add(_pickupLocation!);
    if (_deliveryLocation != null) points.add(_deliveryLocation!);

    if (points.length < 2) return;

    final bounds = LatLngBounds.fromPoints(points);
    // fitCamera có trong flutter_map bản mới
    _mapController.fitCamera(
      CameraFit.bounds(
        bounds: bounds,
        padding: const EdgeInsets.all(30),
      ),
    );
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
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final center = _driverLocation ??
        _pickupLocation ??
        _deliveryLocation ??
        const LatLng(10.762622, 106.660172);

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: center,
        initialZoom:
        (_driverLocation != null || _pickupLocation != null || _deliveryLocation != null)
            ? 15.0
            : 12.0,
        maxZoom: 18.0,
        minZoom: 8.0,
        onPositionChanged: (pos, hasGesture) {
          if (hasGesture) _userMovedMap = true;
          if (pos.zoom != null) _currentZoom = pos.zoom!;
        },
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.logiflow.client_mobile',
          errorTileCallback: (tile, error, stackTrace) {
            debugPrint('TILE ERROR: $error');
          },
        ),

        MarkerLayer(
          markers: [
            if (_driverLocation != null)
              Marker(
                point: _driverLocation!,
                width: 50,
                height: 50,
                child: _circleIcon(
                  icon: Icons.local_shipping,
                  borderColor: Colors.blue,
                  iconColor: Colors.blue,
                ),
              ),

            if (_pickupLocation != null)
              Marker(
                point: _pickupLocation!,
                width: 40,
                height: 40,
                child: _circleIcon(
                  icon: Icons.location_on,
                  borderColor: Colors.green,
                  iconColor: Colors.green,
                ),
              ),

            if (_deliveryLocation != null)
              Marker(
                point: _deliveryLocation!,
                width: 40,
                height: 40,
                child: _circleIcon(
                  icon: Icons.flag,
                  borderColor: Colors.red,
                  iconColor: Colors.red,
                ),
              ),
          ],
        ),
      ],
    );
  }

  Widget _circleIcon({
    required IconData icon,
    required Color borderColor,
    required Color iconColor,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: borderColor, width: 3),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            spreadRadius: 1,
            blurRadius: 3,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Icon(icon, color: iconColor, size: 22),
    );
  }
}
