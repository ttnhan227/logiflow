import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../../services/maps/maps_service.dart';
import '../../models/picked_location.dart';
import '../../models/customer/customer_profile.dart';

class MapSelectionScreen extends StatefulWidget {
  final double initialLat;
  final double initialLng;
  final String title;
  final bool allowDualSelection; // New parameter for dual-point selection
  final CustomerProfile? customerProfile; // For default address prompt

  const MapSelectionScreen({
    super.key,
    required this.initialLat,
    required this.initialLng,
    required this.title,
    this.allowDualSelection = false, // Default to single selection for backward compatibility
    this.customerProfile,
  });

  @override
  State<MapSelectionScreen> createState() => _MapSelectionScreenState();
}

class _MapSelectionScreenState extends State<MapSelectionScreen> {
  late MapController _mapController;

  // Dual-point selection state
  LatLng? _pickupPoint;
  LatLng? _deliveryPoint;
  String? _pickupAddress;
  String? _deliveryAddress;
  bool _isPickupMode = true; // Start with pickup selection

  // Distance calculation
  double? _calculatedDistanceKm;
  String? _calculatedDistanceText;

  // Loading states
  bool _isLoadingAddress = false;

  // Search functionality
  final _searchController = TextEditingController();
  final _focusNode = FocusNode();
  List<String> _suggestions = [];
  Timer? _debounce;
  bool _isSearching = false;

  // Distance calculator instance
  final Distance _distanceCalculator = Distance();

  @override
  void initState() {
    super.initState();
    _mapController = MapController();

    // Prompt to use default address when screen opens (if available)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _promptDefaultAddressIfAvailable();
    });
  }

  Future<void> _promptDefaultAddressIfAvailable() async {
    if (widget.customerProfile?.address == null ||
        widget.customerProfile!.address!.isEmpty ||
        !mounted) {
      return;
    }

    // Only prompt if no points are selected yet
    if (_pickupPoint == null && _deliveryPoint == null) {
      final shouldUseDefault = await showDialog<bool>(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Text('Use Your Saved Address?'),
            content: Text(
              'Would you like to use your saved address as the ${widget.allowDualSelection ? 'pickup' : ''} location?\n\n"${widget.customerProfile!.address}"',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('No, select on map'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('Yes, use it'),
              ),
            ],
          );
        },
      );

      if (shouldUseDefault == true && mounted) {
        // Geocode the default address to get coordinates
        try {
          final locations = await locationFromAddress(widget.customerProfile!.address!);
          if (locations.isNotEmpty && mounted) {
            final location = locations.first;
            final point = LatLng(location.latitude, location.longitude);

            setState(() {
              if (widget.allowDualSelection) {
                // For dual selection, set as pickup point
                _pickupPoint = point;
                _pickupAddress = widget.customerProfile!.address;
                _isPickupMode = false; // Switch to delivery mode
              } else {
                // For single selection, set as the selected point
                _pickupPoint = point;
                _pickupAddress = widget.customerProfile!.address;
              }
            });

            // Move map to the location
            _mapController.move(point, 15);
          }
        } catch (e) {
          // If geocoding fails, show error but don't block the user
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Could not locate your saved address: ${e.toString()}'),
                backgroundColor: Colors.orange,
              ),
            );
          }
        }
      }
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  // Calculate distance between two points using Haversine formula
  void _calculateDistance() {
    if (_pickupPoint != null && _deliveryPoint != null) {
      _calculatedDistanceKm = _distanceCalculator.as(
        LengthUnit.Kilometer,
        _pickupPoint!,
        _deliveryPoint!,
      );

      // Format distance text
      if (_calculatedDistanceKm! < 1.0) {
        _calculatedDistanceText =
            '${(_calculatedDistanceKm! * 1000).round()} m';
      } else {
        _calculatedDistanceText =
            '${_calculatedDistanceKm!.toStringAsFixed(1)} km';
      }
    } else {
      _calculatedDistanceKm = null;
      _calculatedDistanceText = null;
    }
  }

  Future<void> _getAddressFromLocation(LatLng location, bool isPickup) async {
    setState(() => _isLoadingAddress = true);

    try {
      // Try geocoding package first (more reliable)
      final placemarks = await placemarkFromCoordinates(
        location.latitude,
        location.longitude,
      );

      if (placemarks.isNotEmpty) {
        final pm = placemarks.first;
        final parts = <String>[
          if ((pm.street ?? '').trim().isNotEmpty) pm.street!,
          if ((pm.subLocality ?? '').trim().isNotEmpty) pm.subLocality!,
          if ((pm.locality ?? '').trim().isNotEmpty) pm.locality!,
          if ((pm.administrativeArea ?? '').trim().isNotEmpty)
            pm.administrativeArea!,
          if ((pm.country ?? '').trim().isNotEmpty) pm.country!,
        ];
        final address = parts.join(', ');

        if (mounted && address.isNotEmpty) {
          setState(() {
            if (isPickup) {
              _pickupAddress = address;
            } else {
              _deliveryAddress = address;
            }
            _isLoadingAddress = false;
          });
          return;
        }
      }

      // Fallback to backend API
      final address = await mapsService.reverseGeocode(
        location.latitude,
        location.longitude,
      );

      if (mounted) {
        setState(() {
          if (isPickup) {
            _pickupAddress = address ?? '';
          } else {
            _deliveryAddress = address ?? '';
          }
          _isLoadingAddress = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          if (isPickup) {
            _pickupAddress = '';
          } else {
            _deliveryAddress = '';
          }
          _isLoadingAddress = false;
        });
      }
    }
  }

  void _onMapTap(TapPosition tapPosition, LatLng point) {
    setState(() {
      if (_isPickupMode) {
        _pickupPoint = point;
        _pickupAddress = null;
        _getAddressFromLocation(point, true);
      } else {
        _deliveryPoint = point;
        _deliveryAddress = null;
        _getAddressFromLocation(point, false);
      }

      // Calculate distance if both points are set
      _calculateDistance();
    });

    // Auto-fit map to show both points if available
    _fitMapToPoints();
  }

  void _fitMapToPoints() {
    final points = <LatLng>[];
    if (_pickupPoint != null) points.add(_pickupPoint!);
    if (_deliveryPoint != null) points.add(_deliveryPoint!);

    if (points.length >= 2) {
      // Calculate center point between the two points
      final avgLat = (points[0].latitude + points[1].latitude) / 2;
      final avgLng = (points[0].longitude + points[1].longitude) / 2;
      final center = LatLng(avgLat, avgLng);

      // Calculate appropriate zoom level based on distance
      final distance = _distanceCalculator.as(
        LengthUnit.Kilometer,
        points[0],
        points[1],
      );
      final zoom = distance > 50
          ? 8
          : distance > 20
          ? 9
          : distance > 10
          ? 10
          : distance > 5
          ? 11
          : 12;

      _mapController.move(center, zoom.toDouble());
    } else if (points.isNotEmpty) {
      // Center on single point
      _mapController.move(points.first, 15);
    }
  }

  void _switchMode() {
    setState(() => _isPickupMode = !_isPickupMode);
  }

  void _clearPoint(bool isPickup) {
    setState(() {
      if (isPickup) {
        _pickupPoint = null;
        _pickupAddress = null;
      } else {
        _deliveryPoint = null;
        _deliveryAddress = null;
      }
      _calculateDistance();
    });
  }

  void _confirmSelection() {
    if (!widget.allowDualSelection) {
      // Single selection mode (backward compatibility)
      final point = _isPickupMode ? _pickupPoint : _deliveryPoint;
      final address = _isPickupMode ? _pickupAddress : _deliveryAddress;

      if (point == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select a location first')),
        );
        return;
      }

      final fallback =
          'Pinned (${point.latitude.toStringAsFixed(6)}, ${point.longitude.toStringAsFixed(6)})';
      final text = (address?.trim().isNotEmpty ?? false)
          ? address!.trim()
          : fallback;

      Navigator.of(context).pop(
        PickedLocation(
          lat: point.latitude,
          lng: point.longitude,
          displayText: text,
        ),
      );
      return;
    }

    // Dual selection mode
    if (_pickupPoint == null || _deliveryPoint == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select both pickup and delivery locations'),
        ),
      );
      return;
    }

    // Return route data (could be extended to include both points)
    final pickupFallback =
        'Pickup: (${_pickupPoint!.latitude.toStringAsFixed(6)}, ${_pickupPoint!.longitude.toStringAsFixed(6)})';
    final pickupText = (_pickupAddress?.trim().isNotEmpty ?? false)
        ? _pickupAddress!.trim()
        : pickupFallback;

    Navigator.of(context).pop(
      PickedLocation(
        lat: _pickupPoint!.latitude,
        lng: _pickupPoint!.longitude,
        displayText: pickupText,
        // Could add additional fields for route data
        routeData: {
          'pickup': {
            'lat': _pickupPoint!.latitude,
            'lng': _pickupPoint!.longitude,
            'address': _pickupAddress,
          },
          'delivery': {
            'lat': _deliveryPoint!.latitude,
            'lng': _deliveryPoint!.longitude,
            'address': _deliveryAddress,
          },
          'distanceKm': _calculatedDistanceKm,
          'distanceText': _calculatedDistanceText,
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        actions: [
          TextButton(
            onPressed: _confirmSelection,
            child: const Text('Confirm', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: Stack(
        children: [
          Column(
            children: [
              Expanded(
                child: FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: LatLng(widget.initialLat, widget.initialLng),
                    initialZoom: 13.0,
                    onTap: _onMapTap,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.logiflow.client_mobile',
                    ),
                    // Route line between points
                    if (_pickupPoint != null && _deliveryPoint != null)
                      PolylineLayer(
                        polylines: [
                          Polyline(
                            points: [_pickupPoint!, _deliveryPoint!],
                            strokeWidth: 4.0,
                            color: Colors.blue,
                          ),
                        ],
                      ),
                    // Markers for pickup and delivery
                    MarkerLayer(
                      markers: [
                        if (_pickupPoint != null)
                          Marker(
                            point: _pickupPoint!,
                            child: Container(
                              decoration: const BoxDecoration(
                                color: Colors.green,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.location_on,
                                color: Colors.white,
                                size: 30,
                              ),
                            ),
                          ),
                        if (_deliveryPoint != null)
                          Marker(
                            point: _deliveryPoint!,
                            child: Container(
                              decoration: const BoxDecoration(
                                color: Colors.red,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.location_on,
                                color: Colors.white,
                                size: 30,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              // Bottom panel with dual-point selection UI
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 4,
                      offset: const Offset(0, -2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Mode selector (only for dual selection)
                    if (widget.allowDualSelection) ...[
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _isPickupMode ? null : _switchMode,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: _isPickupMode
                                    ? Colors.green
                                    : Colors.grey,
                              ),
                              child: const Text('Set Pickup'),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: !_isPickupMode ? null : _switchMode,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: !_isPickupMode
                                    ? Colors.red
                                    : Colors.grey,
                              ),
                              child: const Text('Set Delivery'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Points display
                    if (_pickupPoint != null || _deliveryPoint != null) ...[
                      _buildPointDisplay(
                        'Pickup Location',
                        _pickupPoint,
                        _pickupAddress,
                        true,
                      ),
                      const SizedBox(height: 12),
                      if (widget.allowDualSelection)
                        _buildPointDisplay(
                          'Delivery Location',
                          _deliveryPoint,
                          _deliveryAddress,
                          false,
                        ),

                      // Distance display (only when both points selected)
                      if (_calculatedDistanceText != null &&
                          widget.allowDualSelection) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.blue.shade200),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.straighten, color: Colors.blue),
                              const SizedBox(width: 8),
                              Text(
                                'Distance: $_calculatedDistanceText',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blue,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ] else ...[
                      Text(
                        widget.allowDualSelection
                            ? 'Tap on the map to select pickup and delivery locations'
                            : 'Tap on the map to select a location',
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                      ),
                    ],

                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _confirmSelection,
                        icon: const Icon(Icons.check),
                        label: const Text('Confirm Selection'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Floating action buttons
          Positioned(
            bottom: 120, // Above the bottom container
            right: 16,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_pickupPoint != null || _deliveryPoint != null)
                  FloatingActionButton(
                    onPressed: () => _clearPoint(_isPickupMode),
                    backgroundColor: Colors.orange,
                    mini: true,
                    heroTag: 'clear_point_fab', // Unique hero tag
                    child: const Icon(Icons.clear),
                    tooltip: 'Clear current point',
                  ),
                const SizedBox(height: 8),
                FloatingActionButton(
                  onPressed: () {
                    // Center on current points or default location
                    final points = <LatLng>[];
                    if (_pickupPoint != null) points.add(_pickupPoint!);
                    if (_deliveryPoint != null) points.add(_deliveryPoint!);

                    if (points.isNotEmpty) {
                      _fitMapToPoints();
                    } else {
                      _mapController.move(
                        LatLng(widget.initialLat, widget.initialLng),
                        13,
                      );
                    }
                  },
                  backgroundColor: Colors.blue,
                  heroTag: 'center_map_fab', // Unique hero tag
                  child: const Icon(Icons.center_focus_strong),
                  tooltip: 'Center map',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPointDisplay(
    String label,
    LatLng? point,
    String? address,
    bool isPickup,
  ) {
    if (point == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isPickup ? Colors.green.shade50 : Colors.red.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isPickup ? Colors.green.shade200 : Colors.red.shade200,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.location_on,
                color: isPickup ? Colors.green : Colors.red,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: isPickup ? Colors.green : Colors.red,
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: () => _clearPoint(isPickup),
                icon: const Icon(Icons.close, size: 16),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            address?.isNotEmpty == true ? address! : 'Getting address...',
            style: const TextStyle(fontSize: 12),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            'Lat: ${point.latitude.toStringAsFixed(6)}, Lng: ${point.longitude.toStringAsFixed(6)}',
            style: const TextStyle(fontSize: 10, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
