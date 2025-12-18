import 'package:flutter/material.dart';
import '../../services/customer/customer_service.dart';
import '../../services/maps/maps_service.dart';
import '../../models/customer/order.dart';

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
  final _packageValueController = TextEditingController();
  final LayerLink _pickupLink = LayerLink();
  final LayerLink _deliveryLink = LayerLink();

  String _pickupType = '';
  String _priority = 'NORMAL';
  bool _isLoading = false;
  bool _isInitializing = true;

  // Address suggestions state
  List<String> _pickupSuggestions = [];
  List<String> _deliverySuggestions = [];
  bool _isLoadingPickupSuggestions = false;
  bool _isLoadingDeliverySuggestions = false;

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

  @override
  void dispose() {
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
    _packageValueController.dispose();
    super.dispose();
  }

  Future<void> _createOrder() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final request = CreateOrderRequest(
        customerName: _customerNameController.text.trim(),
        customerPhone: _customerPhoneController.text.trim(),
        pickupAddress: _pickupAddressController.text.trim(),
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
        deliveryAddress: _deliveryAddressController.text.trim(),
        packageDetails: _packageDetailsController.text.trim(),
        weightKg: double.tryParse(_weightController.text.trim()),
        packageValue: double.tryParse(_packageValueController.text.trim()),
        priority: _priority,
      );

      final order = await customerService.createOrder(request);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Order created successfully! Check your "Track Orders" tab to track it. 🌟🚚',
            ),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );

        // Clear the form for another order creation
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
        _packageValueController.clear();
        _pickupType = '';
        _priority = 'NORMAL';
        _formKey.currentState?.reset();
      }
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
                    DropdownMenuItem(value: 'STANDARD', child: Text('📍 Standard Pickup')),
                    DropdownMenuItem(value: 'PORT_TERMINAL', child: Text('🚢 Port Terminal')),
                    DropdownMenuItem(
                      value: 'WAREHOUSE',
                      child: Text('🏭 Warehouse'),
                    ),
                  ],
                  onChanged: (value) {
                    setState(() => _pickupType = value ?? '');
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
                          suffixIcon: _isLoadingPickupSuggestions
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : null,
                        ),
                        maxLines: 3,
                        onChanged: (query) {
                          _loadPickupSuggestions(query);
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
                          suffixIcon: _isLoadingDeliverySuggestions
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : null,
                        ),
                        maxLines: 3,
                        onChanged: (query) {
                          _loadDeliverySuggestions(query);
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
                                },
                              );
                            },
                          ),
                        ),
                    ],
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
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _weightController,
                          decoration: const InputDecoration(
                            labelText: 'Package Weight (kg)',
                            border: OutlineInputBorder(),
                            suffixText: 'kg',
                          ),
                          keyboardType: TextInputType.numberWithOptions(
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
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          controller: _packageValueController,
                          decoration: const InputDecoration(
                            labelText: 'Package Value (VND)',
                            border: OutlineInputBorder(),
                            prefixText: 'VND ',
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
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
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _createOrder,
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
    );
  }
}
