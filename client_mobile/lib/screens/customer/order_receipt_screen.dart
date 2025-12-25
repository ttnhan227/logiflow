import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:open_file/open_file.dart';
import 'dart:io';
import '../../services/customer/customer_service.dart';
import '../../services/api_client.dart';
import '../../models/customer/order.dart';

// Pricing Calculator (copied from order confirmation screen)
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

class OrderReceiptScreen extends StatefulWidget {
  final int orderId;

  const OrderReceiptScreen({super.key, required this.orderId});

  @override
  State<OrderReceiptScreen> createState() => _OrderReceiptScreenState();
}

class _OrderReceiptScreenState extends State<OrderReceiptScreen> {
  Order? _order;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadOrderDetails();
  }

  Future<void> _loadOrderDetails() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final order = await customerService.getOrderById(widget.orderId);
      setState(() {
        _order = order;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Order Receipt'),
        actions: [
          IconButton(
            icon: const Icon(Icons.download),
            tooltip: 'Download PDF',
            onPressed: _order != null ? _downloadReceipt : null,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadOrderDetails,
          ),
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
                    onPressed: _loadOrderDetails,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            )
          : _order == null
          ? const Center(
              child: Text('Order not found'),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Receipt Header
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.blue[200]!),
                    ),
                    child: Column(
                      children: [
                        const Icon(
                          Icons.receipt_long,
                          size: 48,
                          color: Colors.blue,
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'ORDER RECEIPT',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Order #${_order!.orderId}',
                          style: const TextStyle(
                            fontSize: 16,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Order Status
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Order Status',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Icon(
                                _getStatusIcon(_order!.orderStatus ?? ''),
                                color: _getStatusColor(_order!.orderStatus ?? ''),
                                size: 24,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                _getStatusText(_order!.orderStatus ?? ''),
                                style: TextStyle(
                                  fontSize: 16,
                                  color: _getStatusColor(_order!.orderStatus ?? ''),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                          if (_order!.tripStatus != null) ...[
                            const SizedBox(height: 8),
                            Text(
                              'Trip Status: ${_order!.tripStatus}',
                              style: const TextStyle(
                                fontSize: 14,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Customer Information
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Customer Information',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          _buildInfoRow('Name', _order!.customerName ?? 'N/A'),
                          _buildInfoRow('Phone', _order!.customerPhone ?? 'N/A'),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Order Details
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Order Details',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          _buildInfoRow('From', _order!.pickupAddress ?? 'N/A'),
                          _buildInfoRow('To', _order!.deliveryAddress ?? 'N/A'),
                          if (_order!.pickupType != null && _order!.pickupType!.isNotEmpty)
                            _buildInfoRow('Pickup Type', _order!.pickupType!),
                          // Show pickup type specific fields
                          if (_order!.warehouseName != null && _order!.warehouseName!.isNotEmpty)
                            _buildInfoRow('Warehouse', _order!.warehouseName!),
                          if (_order!.dockNumber != null && _order!.dockNumber!.isNotEmpty)
                            _buildInfoRow('Dock Number', _order!.dockNumber!),
                          if (_order!.containerNumber != null && _order!.containerNumber!.isNotEmpty)
                            _buildInfoRow('Container', _order!.containerNumber!),
                          if (_order!.terminalName != null && _order!.terminalName!.isNotEmpty)
                            _buildInfoRow('Terminal', _order!.terminalName!),
                          if (_order!.packageDetails != null && _order!.packageDetails!.isNotEmpty)
                            _buildInfoRow('Package', _order!.packageDetails!),
                          if (_order!.weightTons != null)
                            _buildInfoRow('Weight', '${_order!.weightTons!.toStringAsFixed(2)} tons'),
                          if (_order!.packageValue != null)
                            _buildInfoRow('Value', 'VND ${_order!.packageValue!.toStringAsFixed(0)}'),
                          if (_order!.distanceKm != null)
                            _buildInfoRow('Distance', '${_order!.distanceKm!.toStringAsFixed(1)} km'),
                          if (_order!.priorityLevel != null)
                            _buildInfoRow('Priority', _order!.priorityLevel!),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Price Breakdown & Payment Information
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Price Breakdown',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          // Add the same price breakdown as order confirmation
                          _buildFeeBreakdown(
                            _order!.distanceKm != null ? _order!.distanceKm!.toStringAsFixed(1) + ' km' : null,
                            _order!.weightTons,
                            _order!.priorityLevel == 'URGENT',
                            _order!.pickupAddress ?? '',
                            _order!.deliveryAddress ?? '',
                            packageValue: _order!.packageValue,
                          ),
                          const SizedBox(height: 16),
                          const Divider(),
                          const SizedBox(height: 16),
                          const Text(
                            'Payment Information',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.green[50],
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.green[200]!),
                            ),
                            child: const Row(
                              children: [
                                Icon(
                                  Icons.check_circle,
                                  size: 16,
                                  color: Colors.green,
                                ),
                                SizedBox(width: 8),
                                Text(
                                  'Payment Completed',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.green,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Driver & Vehicle Information
                  if (_order!.driverName != null || _order!.vehiclePlate != null)
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Delivery Information',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 12),
                            if (_order!.driverName != null)
                              _buildInfoRow('Driver', _order!.driverName!),
                            if (_order!.driverPhone != null)
                              _buildInfoRow('Driver Phone', _order!.driverPhone!),
                            if (_order!.vehiclePlate != null)
                              _buildInfoRow('Vehicle', _order!.vehiclePlate!),
                          ],
                        ),
                      ),
                    ),

                  const SizedBox(height: 16),

                  // Timeline
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Order Timeline',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          if (_order!.createdAt != null)
                            _buildTimelineItem(
                              'Order Created',
                              _order!.createdAt!,
                              Icons.shopping_cart,
                              Colors.blue,
                            ),
                          if (_order!.estimatedPickupTime != null)
                            _buildTimelineItem(
                              'Estimated Pickup',
                              _order!.estimatedPickupTime!,
                              Icons.schedule,
                              Colors.orange,
                            ),
                          if (_order!.actualPickupTime != null)
                            _buildTimelineItem(
                              'Actual Pickup',
                              _order!.actualPickupTime!,
                              Icons.local_shipping,
                              Colors.blue,
                            ),
                          if (_order!.estimatedDeliveryTime != null)
                            _buildTimelineItem(
                              'Estimated Delivery',
                              _order!.estimatedDeliveryTime!,
                              Icons.access_time,
                              Colors.orange,
                            ),
                          if (_order!.actualDeliveryTime != null)
                            _buildTimelineItem(
                              'Delivered',
                              _order!.actualDeliveryTime!,
                              Icons.check_circle,
                              Colors.green,
                            ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Footer
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      children: [
                        const Text(
                          'Thank you for choosing LogiFlow!',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Generated on ${DateTime.now().toLocal().toString().split('.')[0]}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.grey,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem(String title, DateTime time, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(
            icon,
            size: 20,
            color: color,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  _formatDateTime(time),
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays == 0) {
      return 'Today at ${_formatTime(dateTime)}';
    } else if (difference.inDays == 1) {
      return 'Yesterday at ${_formatTime(dateTime)}';
    } else if (difference.inDays < 7) {
      final weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return '${weekdays[dateTime.weekday - 1]} at ${_formatTime(dateTime)}';
    } else {
      return '${dateTime.month}/${dateTime.day}/${dateTime.year} at ${_formatTime(dateTime)}';
    }
  }

  String _formatTime(DateTime dateTime) {
    final hour = dateTime.hour > 12
        ? dateTime.hour - 12
        : (dateTime.hour == 0 ? 12 : dateTime.hour);
    final amPm = dateTime.hour >= 12 ? 'PM' : 'AM';
    final minute = dateTime.minute.toString().padLeft(2, '0');
    return '$hour:$minute $amPm';
  }

  IconData _getStatusIcon(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return Icons.check_circle;
      case 'IN_TRANSIT':
        return Icons.local_shipping;
      case 'ASSIGNED':
        return Icons.assignment;
      case 'PENDING':
        return Icons.schedule;
      case 'CANCELLED':
        return Icons.cancel;
      default:
        return Icons.info;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return Colors.green;
      case 'IN_TRANSIT':
        return Colors.blue;
      case 'ASSIGNED':
        return Colors.orange;
      case 'PENDING':
        return Colors.grey;
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
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'ASSIGNED':
        return 'Assigned to Driver';
      case 'PENDING':
        return 'Pending';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  Future<void> _downloadReceipt() async {
    if (_order == null) return;

    try {
      // Show loading indicator
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Downloading invoice...')),
      );

      // Make request to download invoice using the API client
      final headers = await apiClient.getHeaders();
      final url = '${ApiClient.baseUrl.replaceAll('/api', '')}/api/orders/${_order!.orderId}/invoice/download';
      final response = await http.get(Uri.parse(url), headers: headers);

      if (response.statusCode == 200) {
        // Get directory to save file
        Directory? output;
        try {
          output = await getApplicationDocumentsDirectory();
        } catch (e) {
          // Fallback to external storage if available
          try {
            output = await getExternalStorageDirectory();
            if (output != null) {
              output = Directory('${output.path}/Documents');
              if (!await output.exists()) {
                await output.create(recursive: true);
              }
            }
          } catch (e2) {
            // Last resort - use temporary directory
            output = await getTemporaryDirectory();
          }
        }

        if (output == null) {
          throw Exception('Unable to access storage directory');
        }

        // Save PDF to device
        final file = File('${output.path}/invoice_order_${_order!.orderId}.pdf');
        await file.writeAsBytes(response.bodyBytes);

        // Show success message and open file
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Invoice downloaded successfully!'),
              action: SnackBarAction(
                label: 'Open',
                onPressed: () {
                  OpenFile.open(file.path);
                },
              ),
            ),
          );
        }
      } else if (response.statusCode == 403) {
        // Forbidden - not authorized to access this invoice
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('You do not have permission to download this invoice')),
          );
        }
      } else if (response.statusCode == 400) {
        // Bad request - invoice not available (e.g., not paid)
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Invoice not available for this order')),
          );
        }
      } else {
        // Other error
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to download invoice: ${response.statusCode}')),
          );
        }
      }

    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to download invoice: $e')),
        );
      }
    }
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

}
