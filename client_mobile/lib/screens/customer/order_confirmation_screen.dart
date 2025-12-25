import 'package:flutter/material.dart';
import '../../services/customer/customer_service.dart';
import '../../models/customer/order.dart';
import 'track_orders_screen.dart';

class OrderConfirmationScreen extends StatefulWidget {
  final CreateOrderRequest orderRequest;
  final String? calculatedDistance;
  final String? calculatedDuration;

  const OrderConfirmationScreen({
    super.key,
    required this.orderRequest,
    this.calculatedDistance,
    this.calculatedDuration,
  });

  @override
  State<OrderConfirmationScreen> createState() => _OrderConfirmationScreenState();
}

class _PricingCalculator {
  static const double baseFee = 30000; // VND base fee (reduced for local delivery)
  static const double distanceRate = 1500; // VND per km (reduced for local delivery)
  static const double weightRatePerTon = 700000; // VND per ton (reduced from 2M to 700k for local delivery)
  static const double insuranceRate = 0.005; // 0.5% insurance premium on declared value
  static const double urgentMultiplier = 1.3;

  // Fallback distance estimation for HCMC routes when maps service fails
  static double _estimateHcmcDistance(String origin, String destination) {
    // Simple estimation based on common HCMC routes
    // In a real app, this would be more sophisticated
    final originLower = origin.toLowerCase();
    final destLower = destination.toLowerCase();

    // Check if both addresses are in HCMC
    final hcmcKeywords = ['ho chi minh', 'hcmc', 'sai gon', 'thành phố hồ chí minh'];
    final isHcmcRoute = hcmcKeywords.any((keyword) =>
      originLower.contains(keyword) && destLower.contains(keyword));

    if (isHcmcRoute) {
      // Average distance for HCMC deliveries
      return 15.0; // 15km average
    }

    // Default fallback
    return 10.0; // 10km default
  }

  static String calculateEstimatedFee(String? distanceKm, double? weightTons, bool isUrgent,
      {String? originAddress, String? destAddress, double? packageValue}) {

    double distance;

    if (distanceKm != null) {
      try {
        // Extract numeric value from strings like "24.2 km" or "15 km"
        final numericMatch = RegExp(r'(\d+(?:\.\d+)?)').firstMatch(distanceKm);
        if (numericMatch != null) {
          distance = double.parse(numericMatch.group(1)!);
        } else {
          distance = _estimateHcmcDistance(originAddress ?? '', destAddress ?? '');
        }
      } catch (e) {
        distance = _estimateHcmcDistance(originAddress ?? '', destAddress ?? '');
      }
    } else {
      // Maps service failed - use fallback estimation
      distance = _estimateHcmcDistance(originAddress ?? '', destAddress ?? '');
    }

    double weight = weightTons ?? 0.0;
    double insuranceValue = packageValue ?? 0.0;

    // Calculate components
    double distanceFee = distance * distanceRate;
    double weightFee = weight * weightRatePerTon;
    double insurancePremium = insuranceValue * insuranceRate;
    double totalFee = baseFee + distanceFee + weightFee + insurancePremium;

    // Apply urgent multiplier
    if (isUrgent) {
      totalFee *= urgentMultiplier;
    }

    // Format as VND
    final formatted = totalFee.round().toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},'
    );

    return '$formatted VND';
  }
}

class _OrderConfirmationScreenState extends State<OrderConfirmationScreen> {
  bool _isCreatingOrder = false;

  Future<void> _createOrder() async {
    setState(() => _isCreatingOrder = true);

    try {
      final order = await customerService.createOrder(widget.orderRequest);

      if (!mounted) return;

      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Tạo đơn thành công'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 2),
        ),
      );

      // Navigate back to main layout and switch to track orders tab
      Navigator.of(context).popUntil((route) => route.isFirst); // Go back to main layout
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
        setState(() => _isCreatingOrder = false);
      }
    }
  }

  Widget _buildInfoRow(String label, String value, {IconData? icon}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 20, color: Colors.blue),
            const SizedBox(width: 8),
          ],
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressSection(String title, String address, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.blue,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 20, color: Colors.blue),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                address,
                style: const TextStyle(
                  fontSize: 14,
                  height: 1.4,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFeeBreakdown(String? distanceKm, double? weightTons, bool isUrgent,
      String originAddress, String destAddress, {double? packageValue}) {

    // Get the distance value - handle formatted strings like "24.2 km"
    double distance;
    if (distanceKm != null) {
      try {
        // Extract numeric value from strings like "24.2 km" or "15 km"
        final numericMatch = RegExp(r'(\d+(?:\.\d+)?)').firstMatch(distanceKm);
        if (numericMatch != null) {
          distance = double.parse(numericMatch.group(1)!);
        } else {
          // If no numeric value found, use fallback
          distance = _PricingCalculator._estimateHcmcDistance(originAddress, destAddress);
        }
      } catch (e) {
        distance = _PricingCalculator._estimateHcmcDistance(originAddress, destAddress);
      }
    } else {
      distance = _PricingCalculator._estimateHcmcDistance(originAddress, destAddress);
    }

    final weight = weightTons ?? 0.0;
    final insuranceValue = packageValue ?? 0.0;

    // Calculate each component
    final baseFee = _PricingCalculator.baseFee;
    final distanceFee = distance * _PricingCalculator.distanceRate;
    final weightFee = weight * _PricingCalculator.weightRatePerTon;
    final insurancePremium = insuranceValue * _PricingCalculator.insuranceRate;
    final subtotal = baseFee + distanceFee + weightFee + insurancePremium;
    final urgentSurcharge = isUrgent ? (subtotal * (_PricingCalculator.urgentMultiplier - 1.0)) : 0.0;
    final total = subtotal + urgentSurcharge;

    // Format currency helper
    String formatCurrency(double amount) {
      final formatted = amount.round().toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
        (Match m) => '${m[1]},'
      );
      return '$formatted VND';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 12),
        const Text(
          'Pricing Breakdown',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.blue,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: Column(
            children: [
              // Base fee
              _buildFeeRow('Base fee', formatCurrency(baseFee), isBase: true),

              // Distance fee
              _buildFeeRow(
                'Distance (${distance.toStringAsFixed(1)} km × 1.5k VND/km)',
                formatCurrency(distanceFee),
              ),

              // Weight fee (only if weight > 0)
              if (weight > 0)
                _buildFeeRow(
                  'Weight (${weight.toStringAsFixed(2)}t × 700,000 VND/t)',
                  formatCurrency(weightFee),
                ),

              // Insurance premium (only if package value declared)
              if (insuranceValue > 0)
                _buildFeeRow(
                  'Insurance (${formatCurrency(insuranceValue)} × 0.5%)',
                  formatCurrency(insurancePremium),
                  isInsurance: true,
                ),

              // Priority multiplier
              _buildFeeRow(
                isUrgent ? 'Priority (Urgent × 1.3)' : 'Priority (Normal × 1.0)',
                isUrgent ? '× 1.3' : '× 1.0',
                isPriority: true,
              ),

              // Subtotal
              const Divider(height: 16),
              _buildFeeRow('Subtotal', formatCurrency(subtotal), isSubtotal: true),

              // Urgent surcharge
              if (isUrgent)
                _buildFeeRow(
                  'Urgent surcharge',
                  formatCurrency(urgentSurcharge),
                  isUrgent: true,
                ),

              // Total
              const Divider(height: 16, thickness: 2),
              _buildFeeRow('Total', formatCurrency(total), isTotal: true),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFeeRow(String label, String amount, {
    bool isBase = false,
    bool isSubtotal = false,
    bool isUrgent = false,
    bool isTotal = false,
    bool isPriority = false,
    bool isInsurance = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: isTotal ? 14 : 12,
                fontWeight: isTotal || isSubtotal ? FontWeight.bold :
                           isBase || isUrgent ? FontWeight.w500 : FontWeight.normal,
                color: isUrgent ? Colors.orange :
                       isTotal ? Colors.green :
                       Colors.grey[700],
              ),
            ),
          ),
          Text(
            amount,
            style: TextStyle(
              fontSize: isTotal ? 14 : 12,
              fontWeight: isTotal || isSubtotal ? FontWeight.bold :
                         isBase || isUrgent ? FontWeight.w500 : FontWeight.normal,
              color: isUrgent ? Colors.orange :
                     isTotal ? Colors.green :
                     Colors.grey[700],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final request = widget.orderRequest;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Confirm Order'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Row(
                children: [
                  const Icon(Icons.local_shipping, color: Colors.blue, size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Order Summary',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                        Text(
                          'Please review your order details before confirming',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.blue.shade700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Customer Information
            const Text(
              'Customer Information',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _buildInfoRow('Name', request.customerName, icon: Icons.person),
                    if (request.customerPhone != null && request.customerPhone!.isNotEmpty)
                      _buildInfoRow('Phone', request.customerPhone!, icon: Icons.phone),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Pickup Type
            if (request.pickupType != null) ...[
              const Text(
                'Pickup Type',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        request.pickupType == 'STANDARD'
                            ? '📍 Standard Pickup'
                            : request.pickupType == 'PORT_TERMINAL'
                                ? '🚢 Port Terminal'
                                : '🏭 Warehouse',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (request.containerNumber != null && request.containerNumber!.isNotEmpty)
                        _buildInfoRow('Container Number', request.containerNumber!, icon: Icons.inventory_2),
                      if (request.terminalName != null && request.terminalName!.isNotEmpty)
                        _buildInfoRow('Terminal Name', request.terminalName!, icon: Icons.directions_boat),
                      if (request.warehouseName != null && request.warehouseName!.isNotEmpty)
                        _buildInfoRow('Warehouse Name', request.warehouseName!, icon: Icons.warehouse),
                      if (request.dockNumber != null && request.dockNumber!.isNotEmpty)
                        _buildInfoRow('Dock Number', request.dockNumber!, icon: Icons.location_on),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Addresses
            const Text(
              'Delivery Details',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _buildAddressSection('Pickup Address', request.pickupAddress, Icons.location_on),
                    const Divider(height: 24),
                    _buildAddressSection('Delivery Address', request.deliveryAddress, Icons.flag),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Package Details
            const Text(
              'Package Information',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    if (request.packageDetails != null && request.packageDetails!.isNotEmpty)
                      _buildInfoRow('Details', request.packageDetails!, icon: Icons.description),
                    if (request.weightKg != null)
                      _buildInfoRow('Weight', '${(request.weightKg! / 1000).toStringAsFixed(2)} tonnes', icon: Icons.scale),
                    _buildInfoRow('Priority', request.priority == 'URGENT' ? '⚡ Urgent' : '📦 Normal', icon: Icons.priority_high),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Distance and Estimated Cost - Always show for pricing transparency
            const Text(
              'Route Information',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    if (widget.calculatedDistance != null)
                      _buildInfoRow('Distance', widget.calculatedDistance!, icon: Icons.straighten),
                    if (widget.calculatedDuration != null)
                      _buildInfoRow('Estimated Time', widget.calculatedDuration!, icon: Icons.access_time),
                    if (widget.calculatedDistance == null && widget.calculatedDuration == null)
                      _buildInfoRow('Status', 'Maps service unavailable - using estimated distance', icon: Icons.info_outline),
                    // Fee breakdown section
                    _buildFeeBreakdown(
                      widget.calculatedDistance,
                      request.weightKg != null ? request.weightKg! / 1000 : null,
                      request.priority == 'URGENT',
                      request.pickupAddress,
                      request.deliveryAddress,
                      packageValue: request.packageValue
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isCreatingOrder ? null : () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: const BorderSide(color: Colors.grey),
                    ),
                    child: const Text(
                      'Cancel',
                      style: TextStyle(fontSize: 16),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isCreatingOrder ? null : _createOrder,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Colors.green,
                    ),
                    child: _isCreatingOrder
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text(
                            'Confirm Order',
                            style: TextStyle(fontSize: 16, color: Colors.white),
                          ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
