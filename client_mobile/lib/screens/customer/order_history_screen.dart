import '../../theme/app_theme.dart';
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
                  return InkWell(
                    borderRadius: BorderRadius.circular(10),
                    onTap: () {
                      if (order.orderStatus.toUpperCase() == 'DELIVERED' &&
                          order.paymentStatus?.toUpperCase() == 'PAID') {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => OrderReceiptScreen(
                              orderId: order.orderId,
                            ),
                          ),
                        );
                      }
                    },
                    child: AppTheme.buildDispatchCard(
                      title: 'ORDER #${order.orderId}',
                      icon: Icons.inventory_2_rounded,
                      headerIconColor: AppTheme.primary,
                      trailing: AppTheme.buildStatusPill(order.orderStatus),
                      children: [
                        // Route Information
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceMuted,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.circle, size: 8, color: AppTheme.primary),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'From: ${order.pickupAddress ?? 'N/A'}',
                                      style: const TextStyle(fontSize: 12, color: AppTheme.text),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Icon(Icons.location_on, size: 10, color: AppTheme.routeOrange),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'To: ${order.deliveryAddress ?? 'N/A'}',
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.text),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Specs Row
                        Row(
                          children: [
                            Expanded(
                              child: AppTheme.buildMetricTile(
                                label: 'Weight',
                                value: order.weightTons != null ? order.weightTons!.toStringAsFixed(1) : '--',
                                unit: 't',
                                icon: Icons.scale_rounded,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: AppTheme.buildMetricTile(
                                label: 'Distance',
                                value: order.distanceKm != null ? order.distanceKm!.toStringAsFixed(0) : '--',
                                unit: 'km',
                                icon: Icons.straighten_rounded,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: AppTheme.buildMetricTile(
                                label: 'Declared',
                                value: order.packageValue != null ? '${(order.packageValue! / 1000).toStringAsFixed(0)}k' : '--',
                                unit: 'VND',
                                icon: Icons.paid_outlined,
                              ),
                            ),
                          ],
                        ),

                        // Package Details note
                        if (order.packageDetails != null && order.packageDetails!.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              const Icon(Icons.info_outline_rounded, size: 14, color: AppTheme.textMuted),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  order.packageDetails!,
                                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],

                        // Payment Status & Date
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  order.paymentStatus?.toUpperCase() == 'PAID'
                                      ? Icons.check_circle_outline_rounded
                                      : Icons.schedule_rounded,
                                  size: 14,
                                  color: order.paymentStatus?.toUpperCase() == 'PAID'
                                      ? AppTheme.success
                                      : AppTheme.warning,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'PAYMENT: ${order.paymentStatus?.toUpperCase() ?? 'PENDING'}',
                                  style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w700,
                                    color: order.paymentStatus?.toUpperCase() == 'PAID'
                                        ? AppTheme.success
                                        : AppTheme.warning,
                                  ),
                                ),
                              ],
                            ),
                            if (order.deliveredAt != null)
                              Text(
                                'Delivered: ${_formatDate(order.deliveredAt!)}',
                                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                              )
                            else
                              Text(
                                'Ordered: ${_formatDate(order.createdAt)}',
                                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                              ),
                          ],
                        ),

                        if (order.orderStatus.toUpperCase() == 'DELIVERED' &&
                            order.paymentStatus?.toUpperCase() == 'PAID') ...[
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: const [
                              Text(
                                'VIEW OFFICIAL RECEIPT',
                                style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                  color: AppTheme.routeOrange,
                                ),
                              ),
                              SizedBox(width: 4),
                              Icon(Icons.arrow_forward_rounded, size: 12, color: AppTheme.routeOrange),
                            ],
                          ),
                        ],
                      ],
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
