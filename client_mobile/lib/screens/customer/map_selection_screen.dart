import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../../services/maps/maps_service.dart';
import '../../models/picked_location.dart';

class MapSelectionScreen extends StatefulWidget {
  final double initialLat;
  final double initialLng;
  final String title;

  const MapSelectionScreen({
    super.key,
    required this.initialLat,
    required this.initialLng,
    required this.title,
  });

  @override
  State<MapSelectionScreen> createState() => _MapSelectionScreenState();
}

class _MapSelectionScreenState extends State<MapSelectionScreen> {
  late MapController _mapController;
  late LatLng _selectedLocation;
  PickedLocation? _pickedLocation;
  Timer? _reverseDebounce;
  bool _reverseLoading = false;

  bool _isLoadingAddress = false;
  String? _selectedAddressText;

  // Search functionality
  final _searchController = TextEditingController();
  final _focusNode = FocusNode();
  List<String> _suggestions = [];
  Timer? _debounce;
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    _selectedLocation = LatLng(widget.initialLat, widget.initialLng);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _getAddressFromLocation(LatLng location) async {
    setState(() => _isLoadingAddress = true);

    try {
      // Try geocoding package first (more reliable)
      final placemarks = await placemarkFromCoordinates(
        location.latitude,
        location.longitude,
      );

      if (placemarks.isNotEmpty) {
        final pm = placemarks.first;

        // Build address from placemark components
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
            _selectedAddressText = address;
            _isLoadingAddress = false;
          });
          return;
        }
      }

      // Fallback to backend API if geocoding package fails
      final address = await mapsService.reverseGeocode(
        location.latitude,
        location.longitude,
      );

      if (mounted) {
        setState(() {
          _selectedAddressText = address ?? '';
          _isLoadingAddress = false;
        });
      }
    } catch (e) {
      // If both methods fail, leave address empty (will use fallback in confirm)
      if (mounted) {
        setState(() {
          _selectedAddressText = '';
          _isLoadingAddress = false;
        });
      }
    }
  }

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () async {
      final q = query.trim();
      if (q.isEmpty) {
        if (!mounted) return;
        setState(() => _suggestions = []);
        return;
      }

      setState(() => _isSearching = true);

      try {
        // Use geocode for suggestions since server may not have suggestions endpoint
        final geo = await mapsService.geocodeAddress(q);
        final list = <String>[];
        if (geo != null && geo.formattedAddress.isNotEmpty) {
          list.add(geo.formattedAddress);
        } else {
          list.add(q);
        }

        if (!mounted) return;
        setState(() => _suggestions = list);
      } finally {
        if (!mounted) return;
        setState(() => _isSearching = false);
      }
    });
  }

  Future<void> _selectSuggestion(String text) async {
    _searchController.text = text;
    _searchController.selection = TextSelection.fromPosition(
      TextPosition(offset: text.length),
    );
    setState(() {
      _suggestions = [];
      _isSearching = true;
    });
    _focusNode.unfocus();

    try {
      final geo = await mapsService.geocodeAddress(text);
      if (geo?.latitude == null || geo?.longitude == null) return;

      final p = LatLng(geo!.latitude!, geo.longitude!);

      setState(() {
        _selectedLocation = p;
        _selectedAddressText = geo.formattedAddress.isNotEmpty
            ? geo.formattedAddress
            : text;
      });

      _mapController.move(p, 16);
    } finally {
      if (!mounted) return;
      setState(() => _isSearching = false);
    }
  }

  void _onMapTap(TapPosition tapPosition, LatLng point) {
    setState(() {
      _selectedLocation = point;
      _selectedAddressText = null; // Reset when tapping map
    });
    _getAddressFromLocation(point);
  }

  Future<void> _goToMyLocation() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Location services are disabled. Please enable them.'),
        ),
      );
      return;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Location permissions are denied. Please enable them in settings.',
          ),
        ),
      );
      return;
    }

    try {
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      final p = LatLng(pos.latitude, pos.longitude);

      setState(() {
        _selectedLocation = p;
        _selectedAddressText = null; // Will be fetched by reverse geocode
      });

      _mapController.move(p, 16);

      // Get address for current location
      await _getAddressFromLocation(p);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to get location: $e')));
    }
  }

  void _confirmSelection() {
    final fallback =
        'Pinned (${_selectedLocation.latitude.toStringAsFixed(6)}, ${_selectedLocation.longitude.toStringAsFixed(6)})';
    final text = (_selectedAddressText?.trim().isNotEmpty ?? false)
        ? _selectedAddressText!.trim()
        : fallback;

    Navigator.of(context).pop(
      PickedLocation(
        lat: _selectedLocation.latitude,
        lng: _selectedLocation.longitude,
        displayText: text,
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
                    initialCenter: _selectedLocation,
                    initialZoom: 15.0,
                    onTap: _onMapTap,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                      subdomains: const ['a', 'b', 'c', 'd'],
                      userAgentPackageName: 'com.logiflow.client_mobile',
                      errorTileCallback: (tile, error, stackTrace) {
                        debugPrint('TILE ERROR: $error');
                      },
                    ),
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: _selectedLocation,
                          child: const Icon(
                            Icons.location_pin,
                            color: Colors.red,
                            size: 40,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
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
                    const Text(
                      'Selected Location',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.location_on, color: Colors.red),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _isLoadingAddress
                              ? const Row(
                                  children: [
                                    SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    ),
                                    SizedBox(width: 8),
                                    Text('Getting address...'),
                                  ],
                                )
                              : Text(
                                  _selectedAddressText ??
                                      'Tap on the map to select a location',
                                  style: const TextStyle(fontSize: 14),
                                ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Lat: ${_selectedLocation.latitude.toStringAsFixed(6)}, Lng: ${_selectedLocation.longitude.toStringAsFixed(6)}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          final p = _selectedLocation;
                          final text =
                              (_selectedAddressText?.trim().isNotEmpty ?? false)
                              ? _selectedAddressText!
                              : 'Pinned (${p.latitude.toStringAsFixed(6)}, ${p.longitude.toStringAsFixed(6)})';

                          Navigator.pop(
                            context,
                            PickedLocation(
                              lat: p.latitude,
                              lng: p.longitude,
                              displayText: text,
                            ),
                          );
                        },
                        icon: const Icon(Icons.check),
                        label: const Text('Use this location'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          // Search box overlay
          Positioned(
            top: 12,
            left: 12,
            right: 12,
            child: Material(
              elevation: 3,
              borderRadius: BorderRadius.circular(12),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: _searchController,
                    focusNode: _focusNode,
                    textInputAction: TextInputAction.search,
                    onSubmitted: (value) async {
                      final q = value.trim();
                      if (q.isEmpty) return;
                      await _selectSuggestion(
                        q,
                      ); // Use same logic as selecting suggestion
                    },
                    onChanged: _onSearchChanged,
                    decoration: InputDecoration(
                      hintText: 'Search address...',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _isSearching
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              ),
                            )
                          : (_searchController.text.isEmpty
                                ? null
                                : IconButton(
                                    icon: const Icon(Icons.clear),
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() => _suggestions = []);
                                    },
                                  )),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                    ),
                  ),
                  if (_suggestions.isNotEmpty)
                    Container(
                      constraints: const BoxConstraints(maxHeight: 220),
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: _suggestions.length,
                        itemBuilder: (_, i) {
                          final s = _suggestions[i];
                          return ListTile(
                            title: Text(
                              s,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            onTap: () => _selectSuggestion(s),
                          );
                        },
                      ),
                    ),
                ],
              ),
            ),
          ),
          // GPS floating action button
          Positioned(
            bottom: 100, // Above the bottom container
            right: 16,
            child: FloatingActionButton(
              onPressed: _goToMyLocation,
              backgroundColor: Colors.blue,
              child: const Icon(Icons.my_location, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}
