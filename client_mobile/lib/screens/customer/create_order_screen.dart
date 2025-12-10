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
    return ListTile(
      title: Text(address),
      onTap: onTap,
    );
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
  final _deliveryAddressController = TextEditingController();
  final _packageDetailsController = TextEditingController();
  final _weightController = TextEditingController();
  final _packageValueController = TextEditingController();
  final _feeController = TextEditingController();
  final LayerLink _pickupLink = LayerLink();
  final LayerLink _deliveryLink = LayerLink();

  String _priority = 'NORMAL';
  bool _isLoading = false;
  bool _isInitializing = true;
  double _calculatedFee = 0;

  // Address suggestions state
  List<String> _pickupSuggestions = [];
  List<String> _deliverySuggestions = [];
  bool _isLoadingPickupSuggestions = false;
  bool _isLoadingDeliverySuggestions = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Set up listeners on first mount
    _pickupAddressController.addListener(_recalculateFee);
    _deliveryAddressController.addListener(_recalculateFee);
    _weightController.addListener(_recalculateFee);
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

    mapsService.getBasicAddressSuggestions(query, limit: 5).then((suggestions) {
      if (mounted) {
        setState(() {
          _pickupSuggestions = suggestions ?? [];
          _isLoadingPickupSuggestions = false;
        });
      }
    }).catchError((e) {
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

    mapsService.getBasicAddressSuggestions(query, limit: 5).then((suggestions) {
      if (mounted) {
        setState(() {
          _deliverySuggestions = suggestions ?? [];
          _isLoadingDeliverySuggestions = false;
        });
      }
    }).catchError((e) {
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
    _deliveryAddressController.dispose();
    _packageDetailsController.dispose();
    _weightController.dispose();
    _packageValueController.dispose();
    _feeController.dispose();
    super.dispose();
  }

  void _recalculateFee() async {
    // Calculate shipping fee based on backend distance calculation
    try {
      final fromAddress = _pickupAddressController.text;
      final toAddress = _deliveryAddressController.text;
      final weightStr = _weightController.text.trim();
      final parsedWeight = double.tryParse(weightStr);
      final weightKg = parsedWeight != null ? parsedWeight : 0.0;
      final isUrgent = _priority == 'URGENT';

      if (fromAddress.isNotEmpty && toAddress.isNotEmpty && weightKg > 0) {
        // Use backend service to calculate real routing distance
        final distanceResult = await mapsService.calculateDistance(fromAddress, toAddress);

        if (distanceResult != null) {
          // Calculate fee based on real distance from routing service
          final distanceKm = distanceResult.distanceMeters / 1000.0;
          final fee = _calculateShippingFee(distanceKm, weightKg, isUrgent);

          setState(() {
            _calculatedFee = fee;
            _feeController.text = 'VND ${fee.toStringAsFixed(0)} (${distanceResult.totalDistance})';
          });
        } else {
          setState(() {
            _calculatedFee = 0;
            _feeController.text = 'Unable to calculate distance for these addresses';
          });
        }
      } else {
        setState(() {
          _calculatedFee = 0;
          _feeController.text = 'Enter addresses and weight to calculate fee';
        });
      }
    } catch (e) {
      setState(() {
        _calculatedFee = 0;
        _feeController.text = 'Error calculating fee - please check addresses';
      });
    }
  }

  double _calculateShippingFee(double distanceKm, double weightKg, bool isUrgent) {
    // Fee calculation constants (should match backend business logic)
    const double BASE_RATE_PER_KM = 2500; // VND per km
    const double WEIGHT_RATE_PER_KG = 2000; // VND per kg
    const double BASE_FEE = 50000; // VND base fee
    const double URGENT_MULTIPLIER = 1.3;

    double baseFee = BASE_RATE_PER_KM * distanceKm;
    double weightFee = WEIGHT_RATE_PER_KG * weightKg;
    double totalFee = baseFee + weightFee + BASE_FEE;

    if (isUrgent) {
      totalFee *= URGENT_MULTIPLIER;
    }

    return totalFee;
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
        deliveryAddress: _deliveryAddressController.text.trim(),
        packageDetails: _packageDetailsController.text.trim(),
        priority: _priority,
      );

      final order = await customerService.createOrder(request);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Order created successfully! Check your "Track Orders" tab to track it. 🌟🚚'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );

        // Clear the form for another order creation
        _customerNameController.clear();
        _customerPhoneController.clear();
        _pickupAddressController.clear();
        _deliveryAddressController.clear();
        _packageDetailsController.clear();
        _weightController.clear();
        _packageValueController.clear();
        _priority = 'NORMAL';
        _calculatedFee = 0;
        _feeController.text = 'Enter details above to calculate fee';
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
        appBar: AppBar(
          title: const Text('Create New Order'),
        ),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create New Order'),
      ),
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
                        suffixIcon: _isLoadingPickupSuggestions ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : null,
                      ),
                      maxLines: 3,
                      onChanged: (query) {
                        _loadPickupSuggestions(query);
                        // Trigger fee recalculation when address changes
                        _recalculateFee();
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
                          separatorBuilder: (context, index) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final suggestion = _pickupSuggestions[index];
                            return ListTile(
                              dense: true,
                              title: Text(suggestion, style: const TextStyle(fontSize: 14)),
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
                // Delivery Address Input with Backend Suggestions
                Stack(
                  children: [
                    TextFormField(
                      controller: _deliveryAddressController,
                      decoration: InputDecoration(
                        labelText: 'Delivery Address',
                        border: const OutlineInputBorder(),
                        suffixIcon: _isLoadingDeliverySuggestions ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : null,
                      ),
                      maxLines: 3,
                      onChanged: (query) {
                        _loadDeliverySuggestions(query);
                        // Trigger fee recalculation when address changes
                        _recalculateFee();
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
                          separatorBuilder: (context, index) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final suggestion = _deliverySuggestions[index];
                            return ListTile(
                              dense: true,
                              title: Text(suggestion, style: const TextStyle(fontSize: 14)),
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
                    hintText: 'Describe the package (weight, size, special instructions)',
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
                        keyboardType: TextInputType.numberWithOptions(decimal: true),
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
                // Shipping Fee Display (Read-only)
                TextFormField(
                  controller: _feeController,
                  decoration: InputDecoration(
                    labelText: 'Estimated Shipping Fee',
                    border: const OutlineInputBorder(),
                    filled: true,
                    fillColor: Colors.grey[100],
                    prefixIcon: const Icon(Icons.attach_money, color: Colors.green),
                  ),
                  readOnly: true,
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _priority,
                  decoration: const InputDecoration(
                    labelText: 'Delivery Priority',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'NORMAL', child: Text('📦 Normal Delivery')),
                    DropdownMenuItem(value: 'URGENT', child: Text('⚡ Urgent Delivery')),
                  ],
                  onChanged: (value) {
                    setState(() => _priority = value ?? 'NORMAL');
                    // Recalculate fee when priority changes
                    _recalculateFee();
                  },
                ),
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
