import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../services/customer/customer_service.dart';
import '../../services/maps/maps_service.dart';
import '../../models/customer/order.dart';
import '../../models/customer/customer_profile.dart';
import 'dart:async';
import '../../models/picked_location.dart';
import 'map_selection_screen.dart';
import 'track_orders_screen.dart';

class AddressSuggestion extends StatelessWidget {
  final String address;
  final VoidCallback onTap;

  const AddressSuggestion({
    super.key,
    required this.address,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(title: Text(address), onTap: onTap);
  }
}

class CreateOrderScreen extends StatefulWidget {
  const CreateOrderScreen({super.key});

  @override
  State<CreateOrderScreen> createState() => _CreateOrderScreenState();
}

class _CreateOrderScreenState extends State<CreateOrderScreen> {
  final _formKey = GlobalKey<FormState>();
  final _customerNameController = TextEditingController();
  final _customerPhoneController = TextEditingController();
  final _pickupAddressController = TextEditingController();
  final _containerNumberController = TextEditingController();
  final _terminalNameController = TextEditingController();
  final _warehouseNameController = TextEditingController();
  final _dockNumberController = TextEditingController();
  final _deliveryAddressController = TextEditingController();
  final _packageDetailsController = TextEditingController();
  final _weightController = TextEditingController();
  final LayerLink _pickupLink = LayerLink();
  final LayerLink _deliveryLink = LayerLink();

  String _pickupType = '';
  String _priority = 'NORMAL';
  bool _isLoading = false;
  bool _isInitializing = true;

  // Order creation success state
  bool _orderCreated = false;
  int? _createdOrderId;

  // Address suggestions state
  List<String> _pickupSuggestions = [];
  List<String> _deliverySuggestions = [];
  bool _isLoadingPickupSuggestions = false;
  bool _isLoadingDeliverySuggestions = false;

  // Distance calculation state
  String? _calculatedDistance;
  String? _calculatedDuration;
  bool _isCalculatingDistance = false;

  // Auto-fill pickup address state
  CustomerProfile? _customerProfile;
  bool _hasPromptedForAutoFill = false;

  // Distance calculation debouncing
  bool _isDistanceCalculationInProgress = false;

  Timer? _pickupDebounce;
  Timer? _deliveryDebounce;

  // Geocoding state
  double? _pickupLat, _pickupLng;
  double? _deliveryLat, _deliveryLng;

  bool _pickupGeocoding = false;
  bool _deliveryGeocoding = false;

  // để biết đang chọn pickup hay delivery khi mở map
  bool _pickingPickup = true;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Set up listeners on first mount
  }

  void _loadPickupSuggestions(String query) {
    if (query.isEmpty || query.length < 2) {
      setState(() {
        _pickupSuggestions = [];
        _isLoadingPickupSuggestions = false;
      });
      return;
    }

    setState(() {
      _isLoadingPickupSuggestions = true;
    });

    mapsService
        .getBasicAddressSuggestions(query, limit: 5)
        .then((suggestions) {
          if (mounted) {
            setState(() {
              _pickupSuggestions = suggestions ?? [];
              _isLoadingPickupSuggestions = false;
            });
          }
        })
        .catchError((e) {
          if (mounted) {
            setState(() {
              _pickupSuggestions = [];
              _isLoadingPickupSuggestions = false;
            });
          }
        });
  }

  void _loadDeliverySuggestions(String query) {
    if (query.isEmpty || query.length < 2) {
      setState(() {
        _deliverySuggestions = [];
        _isLoadingDeliverySuggestions = false;
      });
      return;
    }

    setState(() {
      _isLoadingDeliverySuggestions = true;
    });

    mapsService
        .getBasicAddressSuggestions(query, limit: 5)
        .then((suggestions) {
          if (mounted) {
            setState(() {
              _deliverySuggestions = suggestions ?? [];
              _isLoadingDeliverySuggestions = false;
            });
          }
        })
        .catchError((e) {
          if (mounted) {
            setState(() {
              _deliverySuggestions = [];
              _isLoadingDeliverySuggestions = false;
            });
          }
        });
  }

  @override
  void initState() {
    super.initState();
    _initializeForm();
  }

  Future<void> _initializeForm() async {
    try {
      // Pre-fill customer info from profile if available
      final profile = await customerService.getProfile();
      setState(() {
        _customerProfile = profile;
        if (profile.fullName != null && profile.fullName!.isNotEmpty) {
          _customerNameController.text = profile.fullName!;
        }
        if (profile.phone != null && profile.phone!.isNotEmpty) {
          _customerPhoneController.text = profile.phone!;
        }
        _isInitializing = false;
      });
    } catch (e) {
      // Skip pre-filling on error, user can still enter manually
      setState(() => _isInitializing = false);
    }
  }

  Future<void> _promptAutoFillPickupAddress() async {
    if (_customerProfile?.address == null ||
        _customerProfile!.address!.isEmpty ||
        _hasPromptedForAutoFill ||
        _pickupAddressController.text.isNotEmpty) {
      return;
    }

    final shouldAutoFill = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Use Your Address?'),
          content: Text(
            'Would you like to use your saved address as the pickup location?\n\n"${_customerProfile!.address}"',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('No, thanks'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Yes, use it'),
            ),
          ],
        );
      },
    );

    if (shouldAutoFill == true && mounted) {
      setState(() {
        _pickupAddressController.text = _customerProfile!.address!;
        _hasPromptedForAutoFill = true;
      });
      // Trigger distance calculation
      Future.delayed(const Duration(milliseconds: 100), () {
        if (mounted) _calculateDistance();
      });
    } else {
      setState(() => _hasPromptedForAutoFill = true);
    }
  }

  void _calculateDistance() async {
    final pickupAddress = _pickupAddressController.text.trim();
    final deliveryAddress = _deliveryAddressController.text.trim();

    if (pickupAddress.isEmpty ||
        deliveryAddress.isEmpty ||
        _isDistanceCalculationInProgress) {
      return;
    }

    _isDistanceCalculationInProgress = true;
    setState(() => _isCalculatingDistance = true);

    try {
      final result = await mapsService.calculateDistance(
        pickupAddress,
        deliveryAddress,
      );
      if (mounted && result != null) {
        setState(() {
          _calculatedDistance = result.totalDistance;
          _calculatedDuration = result.totalDuration;
        });
      } else if (mounted) {
        setState(() {
          _calculatedDistance = null;
          _calculatedDuration = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _calculatedDistance = null;
          _calculatedDuration = null;
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isCalculatingDistance = false);
      }
      _isDistanceCalculationInProgress = false;
    }
  }

  Future<void> _setPickupAddress(String address) async {
    _pickupAddressController.text = address;
    _pickupAddressController.selection = TextSelection.fromPosition(
      TextPosition(offset: address.length),
    );

    setState(() {
      _pickupLat = null;
      _pickupLng = null;
      _pickupGeocoding = true;
    });

    try {
      final geo = await mapsService.geocodeAddress(address);
      if (!mounted) return;
      setState(() {
        _pickupLat = geo?.latitude;
        _pickupLng = geo?.longitude;
      });
    } catch (_) {
      // cứ để null, lát submit sẽ báo
    } finally {
      if (!mounted) return;
      setState(() => _pickupGeocoding = false);
    }
  }

  Future<void> _setDeliveryAddress(String address) async {
    _deliveryAddressController.text = address;
    _deliveryAddressController.selection = TextSelection.fromPosition(
      TextPosition(offset: address.length),
    );

    setState(() {
      _deliveryLat = null;
      _deliveryLng = null;
      _deliveryGeocoding = true;
    });

    try {
      final geo = await mapsService.geocodeAddress(address);
      if (!mounted) return;
      setState(() {
        _deliveryLat = geo?.latitude;
        _deliveryLng = geo?.longitude;
      });
    } catch (_) {
      // cứ để null, lát submit sẽ báo
    } finally {
      if (!mounted) return;
      setState(() => _deliveryGeocoding = false);
    }
  }

  void _openMapForPickup() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MapSelectionScreen(
          initialLat: _pickupLat ?? 10.8231, // Default to Ho Chi Minh City
          initialLng: _pickupLng ?? 106.6297,
          title: 'Select Pickup Location',
        ),
      ),
    );

    if (result != null && result is PickedLocation) {
      setState(() {
        _pickupLat = result.lat;
        _pickupLng = result.lng;
        _pickupAddressController.text = result.displayText;
      });

      // Trigger distance calculation
      Future.delayed(const Duration(milliseconds: 100), () {
        if (mounted) _calculateDistance();
      });
    }
  }

  void _openMapForDelivery() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MapSelectionScreen(
          initialLat: _deliveryLat ?? 10.8231, // Default to Ho Chi Minh City
          initialLng: _deliveryLng ?? 106.6297,
          title: 'Select Delivery Location',
        ),
      ),
    );

    if (result != null && result is PickedLocation) {
      setState(() {
        _deliveryLat = result.lat;
        _deliveryLng = result.lng;
        _deliveryAddressController.text = result.displayText;
      });

      // Trigger distance calculation
      Future.delayed(const Duration(milliseconds: 100), () {
        if (mounted) _calculateDistance();
      });
    }
  }

  @override
  void dispose() {
    _pickupDebounce?.cancel();
    _deliveryDebounce?.cancel();

    _customerNameController.dispose();
    _customerPhoneController.dispose();
    _pickupAddressController.dispose();
    _containerNumberController.dispose();
    _terminalNameController.dispose();
    _warehouseNameController.dispose();
    _dockNumberController.dispose();
    _deliveryAddressController.dispose();
    _packageDetailsController.dispose();
    _weightController.dispose();
    super.dispose();
  }

  Future<void> _createOrder() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final weightTonnes = double.tryParse(_weightController.text.trim());
      final request = CreateOrderRequest(
        customerName: _customerNameController.text.trim(),
        customerPhone: _customerPhoneController.text.trim(),
        pickupAddress: _pickupAddressController.text.trim(),
        deliveryAddress: _deliveryAddressController.text.trim(),
        pickupLat: _pickupLat,
        pickupLng: _pickupLng,
        deliveryLat: _deliveryLat,
        deliveryLng: _deliveryLng,
        packageDetails: _packageDetailsController.text.trim().isNotEmpty
            ? _packageDetailsController.text.trim()
            : null,
        weightKg: weightTonnes != null ? weightTonnes * 1000 : null,
        priority: _priority,
        pickupType: _pickupType.isNotEmpty ? _pickupType : null,
        containerNumber: _containerNumberController.text.trim().isNotEmpty
            ? _containerNumberController.text.trim()
            : null,
        terminalName: _terminalNameController.text.trim().isNotEmpty
            ? _terminalNameController.text.trim()
            : null,
        warehouseName: _warehouseNameController.text.trim().isNotEmpty
            ? _warehouseNameController.text.trim()
            : null,
        dockNumber: _dockNumberController.text.trim().isNotEmpty
            ? _dockNumberController.text.trim()
            : null,
      );

      final order = await customerService.createOrder(request);

      if (!mounted) return;

      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Tạo đơn thành công'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 2),
        ),
      );

      // Set order created state with the order ID
      setState(() {
        _orderCreated = true;
        _createdOrderId = order.orderId;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to create order: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _resetForm() {
    // Reset form state
    _formKey.currentState?.reset();

    // Clear all controllers
    _customerNameController.clear();
    _customerPhoneController.clear();
    _pickupAddressController.clear();
    _containerNumberController.clear();
    _terminalNameController.clear();
    _warehouseNameController.clear();
    _dockNumberController.clear();
    _deliveryAddressController.clear();
    _packageDetailsController.clear();
    _weightController.clear();

    // Reset state variables
    setState(() {
      _pickupType = '';
      _priority = 'NORMAL';
      _pickupLat = null;
      _pickupLng = null;
      _deliveryLat = null;
      _deliveryLng = null;
      _calculatedDistance = null;
      _calculatedDuration = null;
      _pickupSuggestions = [];
      _deliverySuggestions = [];
      _hasPromptedForAutoFill = false;
      _isLoading = false;
      _orderCreated = false;
      _createdOrderId = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isInitializing) {
      return Scaffold(
        appBar: AppBar(title: const Text('Create New Order')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Create New Order')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Customer Information',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _customerNameController,
                  decoration: const InputDecoration(
                    labelText: 'Name',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter customer name';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _customerPhoneController,
                  decoration: const InputDecoration(
                    labelText: 'Phone Number',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 24),
                const Text(
                  'Pickup Type',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _pickupType.isEmpty ? null : _pickupType,
                  decoration: const InputDecoration(
                    labelText: 'Pickup Type',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(
                      value: 'STANDARD',
                      child: Text('📍 Standard Pickup'),
                    ),
                    DropdownMenuItem(
                      value: 'PORT_TERMINAL',
                      child: Text('🚢 Port Terminal'),
                    ),
                    DropdownMenuItem(
                      value: 'WAREHOUSE',
                      child: Text('🏭 Warehouse'),
                    ),
                  ],
                  onChanged: (value) {
                    setState(() => _pickupType = value ?? '');
                    // Prompt to auto-fill pickup address from profile when pickup type is selected
                    if (value != null && value.isNotEmpty) {
                      Future.delayed(const Duration(milliseconds: 200), () {
                        if (mounted) _promptAutoFillPickupAddress();
                      });
                    }
                  },
                ),
                const SizedBox(height: 24),
                // Only show order details if pickup type is selected
                if (_pickupType.isNotEmpty) ...[
                  const Text(
                    'Order Details',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  // Pickup Address Input with Backend Suggestions
                  Stack(
                    children: [
                      TextFormField(
                        controller: _pickupAddressController,
                        decoration: InputDecoration(
                          labelText: 'Pickup Address',
                          border: const OutlineInputBorder(),
                          suffixIcon: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (_isLoadingPickupSuggestions)
                                const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                ),
                              IconButton(
                                icon: const Icon(Icons.map),
                                onPressed: () => _openMapForPickup(),
                                tooltip: 'Select on map',
                              ),
                            ],
                          ),
                        ),
                        maxLines: 3,
                        onChanged: (query) {
                          _pickupDebounce?.cancel();
                          _pickupDebounce = Timer(
                            const Duration(milliseconds: 350),
                            () {
                              if (!mounted) return;
                              _loadPickupSuggestions(query);
                            },
                          );

                          // Trigger distance calculation with a small delay
                          Future.delayed(const Duration(milliseconds: 600), () {
                            if (mounted) _calculateDistance();
                          });
                        },
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter pickup address';
                          }
                          return null;
                        },
                      ),
                      if (_pickupSuggestions.isNotEmpty)
                        Container(
                          margin: const EdgeInsets.only(top: 65),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(color: Colors.grey),
                            borderRadius: BorderRadius.circular(5),
                            boxShadow: const [BoxShadow(blurRadius: 2)],
                          ),
                          child: ListView.separated(
                            shrinkWrap: true,
                            itemCount: _pickupSuggestions.length,
                            separatorBuilder: (context, index) =>
                                const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final suggestion = _pickupSuggestions[index];
                              return ListTile(
                                dense: true,
                                title: Text(
                                  suggestion,
                                  style: const TextStyle(fontSize: 14),
                                ),
                                onTap: () {
                                  _pickupAddressController.text = suggestion;
                                  setState(() {
                                    _pickupSuggestions = [];
                                  });
                                  // Trigger distance calculation immediately
                                  Future.delayed(
                                    const Duration(milliseconds: 100),
                                    () {
                                      if (mounted) _calculateDistance();
                                    },
                                  );
                                },
                              );
                            },
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Conditional fields based on pickup type
                  if (_pickupType == 'PORT_TERMINAL') ...[
                    TextFormField(
                      controller: _containerNumberController,
                      decoration: const InputDecoration(
                        labelText: 'Container Number',
                        border: OutlineInputBorder(),
                        hintText: 'Enter container number (e.g., ABC123456)',
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _terminalNameController,
                      decoration: const InputDecoration(
                        labelText: 'Terminal Name',
                        border: OutlineInputBorder(),
                        hintText: 'Enter port terminal name',
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _dockNumberController,
                      decoration: const InputDecoration(
                        labelText: 'Dock Number',
                        border: OutlineInputBorder(),
                        hintText: 'Enter dock/gate number',
                      ),
                    ),
                  ] else if (_pickupType == 'WAREHOUSE') ...[
                    TextFormField(
                      controller: _warehouseNameController,
                      decoration: const InputDecoration(
                        labelText: 'Warehouse Name',
                        border: OutlineInputBorder(),
                        hintText: 'Enter warehouse name',
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _dockNumberController,
                      decoration: const InputDecoration(
                        labelText: 'Dock Number',
                        border: OutlineInputBorder(),
                        hintText: 'Enter loading dock number',
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  // Delivery Address Input with Backend Suggestions
                  Stack(
                    children: [
                      TextFormField(
                        controller: _deliveryAddressController,
                        decoration: InputDecoration(
                          labelText: 'Delivery Address',
                          border: const OutlineInputBorder(),
                          suffixIcon: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (_isLoadingDeliverySuggestions)
                                const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                ),
                              IconButton(
                                icon: const Icon(Icons.map),
                                onPressed: () => _openMapForDelivery(),
                                tooltip: 'Select on map',
                              ),
                            ],
                          ),
                        ),
                        maxLines: 3,
                        onChanged: (query) {
                          _deliveryDebounce?.cancel();
                          _deliveryDebounce = Timer(
                            const Duration(milliseconds: 350),
                            () {
                              if (!mounted) return;
                              _loadDeliverySuggestions(query);
                            },
                          );

                          // Trigger distance calculation with a small delay
                          Future.delayed(const Duration(milliseconds: 600), () {
                            if (mounted) _calculateDistance();
                          });
                        },
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter delivery address';
                          }
                          return null;
                        },
                      ),
                      if (_deliverySuggestions.isNotEmpty)
                        Container(
                          margin: const EdgeInsets.only(top: 65),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(color: Colors.grey),
                            borderRadius: BorderRadius.circular(5),
                            boxShadow: const [BoxShadow(blurRadius: 2)],
                          ),
                          child: ListView.separated(
                            shrinkWrap: true,
                            itemCount: _deliverySuggestions.length,
                            separatorBuilder: (context, index) =>
                                const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final suggestion = _deliverySuggestions[index];
                              return ListTile(
                                dense: true,
                                title: Text(
                                  suggestion,
                                  style: const TextStyle(fontSize: 14),
                                ),
                                onTap: () {
                                  _deliveryAddressController.text = suggestion;
                                  setState(() {
                                    _deliverySuggestions = [];
                                  });
                                  // Trigger distance calculation immediately
                                  Future.delayed(
                                    const Duration(milliseconds: 100),
                                    () {
                                      if (mounted) _calculateDistance();
                                    },
                                  );
                                },
                              );
                            },
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Distance and Duration Display
                  if (_isCalculatingDistance ||
                      (_calculatedDistance != null ||
                          _calculatedDuration != null))
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.blue.shade200),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.route, color: Colors.blue),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _isCalculatingDistance
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
                                      Text('Calculating distance...'),
                                    ],
                                  )
                                : Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Distance: ${_calculatedDistance ?? "Unable to calculate"}',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: Colors.blue,
                                        ),
                                      ),
                                      Text(
                                        'Estimated duration: ${_calculatedDuration ?? "Unable to calculate"}',
                                        style: const TextStyle(
                                          color: Colors.blue,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _packageDetailsController,
                    decoration: const InputDecoration(
                      labelText: 'Package Details',
                      border: OutlineInputBorder(),
                      hintText:
                          'Describe the package (weight, size, special instructions)',
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 16),
                  // Package Weight
                  TextFormField(
                    controller: _weightController,
                    decoration: const InputDecoration(
                      labelText: 'Package Weight (tonnes)',
                      border: OutlineInputBorder(),
                      suffixText: 'tonnes',
                    ),
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return null; // Weight is optional
                      }
                      final weight = double.tryParse(value);
                      if (weight == null) {
                        return 'Please enter a valid weight';
                      }
                      if (weight <= 0) {
                        return 'Weight must be greater than 0';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _priority,
                    decoration: const InputDecoration(
                      labelText: 'Delivery Priority',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'NORMAL',
                        child: Text('📦 Normal Delivery'),
                      ),
                      DropdownMenuItem(
                        value: 'URGENT',
                        child: Text('⚡ Urgent Delivery'),
                      ),
                    ],
                    onChanged: (value) {
                      setState(() => _priority = value ?? 'NORMAL');
                    },
                  ),
                ], // Close the pickup type conditional block
                const SizedBox(height: 32),
                if (_pickupType.isNotEmpty)
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: (_orderCreated || _isLoading)
                          ? null
                          : _createOrder,
                      child: _isLoading
                          ? const CircularProgressIndicator()
                          : const Text('Create Order'),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: _orderCreated
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) =>
                                  OrderDetailScreen(orderId: _createdOrderId!),
                            ),
                          );
                        },
                        child: const Text('Xem đơn'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          _resetForm();
                        },
                        child: const Text('Tạo đơn mới'),
                      ),
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }
}
