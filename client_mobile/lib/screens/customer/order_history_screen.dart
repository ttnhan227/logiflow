import 'package:flutter/material.dart';
import '../../services/customer/customer_service.dart';
import '../../models/customer/order_history.dart';
import 'order_receipt_screen.dart';

// Pricing Calculator (copied from order confirmation screen)
class _PricingCalculator {
  static const double baseFee =
      30000; // VND base fee (reduced for local delivery)
  static const double distanceRate =
      1500; // VND per km (reduced for local delivery)
  static const double weightRatePerTon =
      700000; // VND per ton (reduced from 2M to 700k for local delivery)
  static const double insuranceRate =
      0.005; // 0.5% insurance premium on declared value
  static const double urgentMultiplier = 1.3;

  // Fallback distance estimation for HCMC routes when maps service fails
  static double _estimateHcmcDistance(String origin, String destination) {
    // Simple estimation based on common HCMC routes
    // In a real app, this would be more sophisticated
    final originLower = origin.toLowerCase();
    final destLower = destination.toLowerCase();

    // Check if both addresses are in HCMC
    final hcmcKeywords = [
      'ho chi minh',
      'hcmc',
      'sai gon',
      'thành phố hồ chí minh',
    ];
    final isHcmcRoute = hcmcKeywords.any(
      (keyword) => originLower.contains(keyword) && destLower.contains(keyword),
    );

    if (isHcmcRoute) {
      // Average distance for HCMC deliveries
      return 15.0; // 15km average
    }

    // Default fallback
    return 10.0; // 10km default
  }

  static String calculateEstimatedFee(
    String? distanceKm,
    double? weightTons,
    bool isUrgent, {
    String? originAddress,
    String? destAddress,
    double? packageValue,
  }) {
    double distance;

    if (distanceKm != null) {
      try {
        // Extract numeric value from strings like "24.2 km" or "15 km"
        final numericMatch = RegExp(r'(\d+(?:\.\d+)?)').firstMatch(distanceKm);
        if (numericMatch != null) {
          distance = double.parse(numericMatch.group(1)!);
        } else {
          distance = _estimateHcmcDistance(
            originAddress ?? '',
            destAddress ?? '',
          );
        }
      } catch (e) {
        distance = _estimateHcmcDistance(
          originAddress ?? '',
          destAddress ?? '',
        );
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
      (Match m) => '${m[1]},',
    );

    return '$formatted VND';
  }
}

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  List<OrderHistory> _orders = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadOrderHistory();
  }

  Future<void> _loadOrderHistory() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final orders = await customerService.getOrderHistory();
      setState(() {
        _orders = orders;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _refresh() async {
    await _loadOrderHistory();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Order History'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _refresh),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 16),
                  Text('Error: $_error', textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _refresh,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            )
          : _orders.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.history, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text(
                    'No completed orders',
                    style: TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Your order history will appear here once delivered',
                    style: TextStyle(color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _refresh,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _orders.length,
                itemBuilder: (context, index) {
                  final order = _orders[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Order #${order.orderId}',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Icon(
                                _getStatusIcon(order.orderStatus),
                                color: _getStatusColor(order.orderStatus),
                                size: 20,
                              ),
                            ],
                          ),

                          // Delay report banner for completed orders that had delays
                          if (order.delayReason != null &&
                              order.delayReason!.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.orange[50],
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.orange[200]!),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(
                                    Icons.warning_amber,
                                    size: 16,
                                    color: Colors.orange[700],
                                  ),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      order.delayReason!,
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.orange[900],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],

                          const SizedBox(height: 8),
                          Text(
                            'From: ${order.pickupAddress}',
                            style: TextStyle(color: Colors.grey[600]),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'To: ${order.deliveryAddress}',
                            style: TextStyle(color: Colors.grey[600]),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          // Pickup Type Information
                          if (order.pickupType != null &&
                              order.pickupType!.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.blue[50],
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: Colors.blue[200]!),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Pickup Type: ${order.pickupType}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.blue,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  // Show specific fields based on pickup type
                                  if (order.pickupType == 'WAREHOUSE' &&
                                      order.warehouseName != null) ...[
                                    Text(
                                      'Warehouse: ${order.warehouseName}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: Colors.blue,
                                      ),
                                    ),
                                  ],
                                  if (order.pickupType == 'WAREHOUSE' &&
                                      order.dockNumber != null) ...[
                                    Text(
                                      'Dock: ${order.dockNumber}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: Colors.blue,
                                      ),
                                    ),
                                  ],
                                  if (order.pickupType == 'PORT_TERMINAL' &&
                                      order.containerNumber != null) ...[
                                    Text(
                                      'Container: ${order.containerNumber}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: Colors.blue,
                                      ),
                                    ),
                                  ],
                                  if (order.pickupType == 'PORT_TERMINAL' &&
                                      order.terminalName != null) ...[
                                    Text(
                                      'Terminal: ${order.terminalName}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: Colors.blue,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                          // Package Details
                          if (order.packageDetails != null &&
                              order.packageDetails!.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Text(
                              'Package: ${order.packageDetails}',
                              style: TextStyle(color: Colors.grey[700]),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                          const SizedBox(height: 12),
                          // Specifications Row
                          Row(
                            children: [
                              if (order.weightTons != null)
                                Expanded(
                                  child: Text(
                                    'Weight: ${order.weightTons} tons',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey,
                                    ),
                                  ),
                                ),
                              if (order.distanceKm != null)
                                Expanded(
                                  child: Text(
                                    'Distance: ${order.distanceKm!.toStringAsFixed(1)}km',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey,
                                    ),
                                  ),
                                ),
                              if (order.packageValue != null)
                                Expanded(
                                  child: Text(
                                    'Value: VND ${order.packageValue!.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          // Price Breakdown - Always show if we have any pricing data
                          if (order.shippingFee != null ||
                              order.distanceKm != null ||
                              order.weightTons != null) ...[
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.blue[50],
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.blue[200]!),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Price Breakdown',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.blue,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  // Add the same price breakdown as other screens
                                  // Assume normal priority for history (we don't have priority info in OrderHistory)
                                  _buildFeeBreakdown(
                                    order.distanceKm != null
                                        ? order.distanceKm!.toStringAsFixed(1) +
                                              ' km'
                                        : null,
                                    order.weightTons,
                                    order.priorityLevel ==
                                        'URGENT', // Use actual priority level
                                    order.pickupAddress ?? '',
                                    order.deliveryAddress ?? '',
                                    packageValue: order.packageValue,
                                  ),
                                ],
                              ),
                            ),
                          ] else ...[
                            // Show debug info if no pricing data
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.orange[50],
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.orange[200]!),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Debug: No pricing data available',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.orange[800],
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    'Fee: ${order.shippingFee}, Distance: ${order.distanceKm}, Weight: ${order.weightTons}, Value: ${order.packageValue}',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: Colors.orange[700],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          // Payment Status with contextual messaging
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: _getPaymentStatusColor(
                                order.paymentStatus,
                              ).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: _getPaymentStatusColor(
                                  order.paymentStatus,
                                ).withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  _getPaymentStatusIcon(order.paymentStatus),
                                  size: 20,
                                  color: _getPaymentStatusColor(
                                    order.paymentStatus,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _getPaymentStatusMessage(
                                      order.paymentStatus,
                                    ),
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: _getPaymentStatusColor(
                                        order.paymentStatus,
                                      ),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Ordered: ${_formatDate(order.createdAt)}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[500],
                                    ),
                                  ),
                                  if (order.deliveredAt != null)
                                    Text(
                                      'Delivered: ${_formatDate(order.deliveredAt!)}',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.green[600],
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
                          if (order.driverName != null) ...[
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Icon(
                                  Icons.person,
                                  size: 16,
                                  color: Colors.blue[600],
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Delivered by: ${order.driverName}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.blue[600],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ],
                          if (order.driverRating != null) ...[
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.star, size: 16, color: Colors.amber),
                                const SizedBox(width: 4),
                                Text(
                                  'Rating: ${order.driverRating}/5',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.amber[700],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ],
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Status: ${_getStatusText(order.orderStatus)}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: _getStatusColor(order.orderStatus),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              // Only show View Receipt button for paid orders
                              if (order.orderStatus.toUpperCase() ==
                                      'DELIVERED' &&
                                  order.paymentStatus?.toUpperCase() == 'PAID')
                                TextButton.icon(
                                  onPressed: () {
                                    // Navigate to receipt screen for paid orders
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            OrderReceiptScreen(
                                              orderId: order.orderId,
                                            ),
                                      ),
                                    );
                                  },
                                  icon: const Icon(Icons.receipt, size: 16),
                                  label: const Text('View Receipt'),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return 'Today at ${_formatTime(date)}';
    } else if (difference.inDays == 1) {
      return 'Yesterday at ${_formatTime(date)}';
    } else if (difference.inDays < 7) {
      final weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return '${weekdays[date.weekday - 1]} at ${_formatTime(date)}';
    } else {
      return '${date.month}/${date.day}/${date.year}';
    }
  }

  String _formatTime(DateTime date) {
    final hour = date.hour > 12
        ? date.hour - 12
        : (date.hour == 0 ? 12 : date.hour);
    final amPm = date.hour >= 12 ? 'PM' : 'AM';
    final minute = date.minute.toString().padLeft(2, '0');
    return '$hour:$minute $amPm';
  }

  IconData _getStatusIcon(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return Icons.check_circle;
      case 'CANCELLED':
        return Icons.cancel;
      default:
        return Icons.history;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return Colors.green;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  String _getActionText(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'View Receipt';
      case 'CANCELLED':
        return 'View Details';
      default:
        return 'View Details';
    }
  }

  // Payment status helper methods
  Color _getPaymentStatusColor(String? paymentStatus) {
    if (paymentStatus == null) {
      return Colors.grey;
    }

    switch (paymentStatus.toUpperCase()) {
      case 'PAID':
        return Colors.green;
      case 'PENDING':
        return Colors.blue;
      case 'FAILED':
        return Colors.red;
      case 'CANCELLED':
        return Colors.red;
      case 'REFUNDED':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  IconData _getPaymentStatusIcon(String? paymentStatus) {
    if (paymentStatus == null) {
      return Icons.info_outline;
    }

    switch (paymentStatus.toUpperCase()) {
      case 'PAID':
        return Icons.check_circle;
      case 'PENDING':
        return Icons.email;
      case 'FAILED':
        return Icons.error;
      case 'CANCELLED':
        return Icons.cancel;
      case 'REFUNDED':
        return Icons.replay;
      default:
        return Icons.info_outline;
    }
  }

  String _getPaymentStatusMessage(String? paymentStatus) {
    if (paymentStatus == null) {
      return 'Please check your email for payment info';
    }

    switch (paymentStatus.toUpperCase()) {
      case 'PAID':
        return 'Payment received - your order is now complete';
      case 'PENDING':
        return 'Payment processed - please check your email for invoice and payment details';
      case 'FAILED':
        return 'Payment failed - please contact support';
      case 'CANCELLED':
        return 'Payment cancelled';
      case 'REFUNDED':
        return 'Payment refunded';
      default:
        return 'Please check your email for payment info';
    }
  }

  Widget _buildFeeBreakdown(
    String? distanceKm,
    double? weightTons,
    bool isUrgent,
    String originAddress,
    String destAddress, {
    double? packageValue,
  }) {
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
          distance = _PricingCalculator._estimateHcmcDistance(
            originAddress,
            destAddress,
          );
        }
      } catch (e) {
        distance = _PricingCalculator._estimateHcmcDistance(
          originAddress,
          destAddress,
        );
      }
    } else {
      distance = _PricingCalculator._estimateHcmcDistance(
        originAddress,
        destAddress,
      );
    }

    final weight = weightTons ?? 0.0;
    final insuranceValue = packageValue ?? 0.0;

    // Calculate each component
    final baseFee = _PricingCalculator.baseFee;
    final distanceFee = distance * _PricingCalculator.distanceRate;
    final weightFee = weight * _PricingCalculator.weightRatePerTon;
    final insurancePremium = insuranceValue * _PricingCalculator.insuranceRate;
    final subtotal = baseFee + distanceFee + weightFee + insurancePremium;
    final urgentSurcharge = isUrgent
        ? (subtotal * (_PricingCalculator.urgentMultiplier - 1.0))
        : 0.0;
    final total = subtotal + urgentSurcharge;

    // Format currency helper
    String formatCurrency(double amount) {
      final formatted = amount.round().toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
        (Match m) => '${m[1]},',
      );
      return '$formatted VND';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 4),
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
        const Divider(height: 12),
        _buildFeeRow('Subtotal', formatCurrency(subtotal), isSubtotal: true),

        // Urgent surcharge
        if (isUrgent)
          _buildFeeRow(
            'Urgent surcharge',
            formatCurrency(urgentSurcharge),
            isUrgent: true,
          ),

        // Total
        const Divider(height: 12, thickness: 2),
        _buildFeeRow('Total', formatCurrency(total), isTotal: true),
      ],
    );
  }

  Widget _buildFeeRow(
    String label,
    String amount, {
    bool isBase = false,
    bool isSubtotal = false,
    bool isUrgent = false,
    bool isTotal = false,
    bool isPriority = false,
    bool isInsurance = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: isTotal ? 12 : 11,
                fontWeight: isTotal || isSubtotal
                    ? FontWeight.bold
                    : isBase || isUrgent
                    ? FontWeight.w500
                    : FontWeight.normal,
                color: isUrgent
                    ? Colors.orange
                    : isTotal
                    ? Colors.green
                    : Colors.grey[700],
              ),
            ),
          ),
          Text(
            amount,
            style: TextStyle(
              fontSize: isTotal ? 12 : 11,
              fontWeight: isTotal || isSubtotal
                  ? FontWeight.bold
                  : isBase || isUrgent
                  ? FontWeight.w500
                  : FontWeight.normal,
              color: isUrgent
                  ? Colors.orange
                  : isTotal
                  ? Colors.green
                  : Colors.grey[700],
            ),
          ),
        ],
      ),
    );
  }
}
