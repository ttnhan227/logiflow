import 'package:flutter/material.dart';
import '../../services/customer/customer_service.dart';
import '../../models/customer/order.dart';
import '../../models/customer/order_tracking.dart';
import '../../widgets/order_map_view.dart';

class TrackOrdersScreen extends StatefulWidget {
  const TrackOrdersScreen({super.key});

  @override
  State<TrackOrdersScreen> createState() => _TrackOrdersScreenState();
}

class _TrackOrdersScreenState extends State<TrackOrdersScreen> {
  List<OrderSummary> _orders = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Follow driver screen pattern - refresh when returning to this screen
    // Customers should see updated order status after navigation
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && !_isLoading) {
        // Add a small delay to ensure navigation is fully complete
        Future.delayed(const Duration(milliseconds: 200), () {
          if (mounted) {
            _loadOrders();
          }
        });
      }
    });
  }

  Future<void> _loadOrders() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final allOrders = await customerService.getMyOrders();
      // Filter to show only ACTIVE orders (PENDING, ASSIGNED, IN_TRANSIT)
      // Follow driver screen pattern for status checking
      final activeOrders = allOrders.where((order) {
        final orderStatus = order.orderStatus?.toUpperCase() ?? '';
        return orderStatus == 'PENDING' ||
            orderStatus == 'ASSIGNED' ||
            orderStatus == 'IN_TRANSIT';
      }).toList();

      // Sort: IN_TRANSIT first, then ASSIGNED, then PENDING
      activeOrders.sort((a, b) {
        final statusA = a.orderStatus?.toUpperCase() ?? '';
        final statusB = b.orderStatus?.toUpperCase() ?? '';

        int getStatusPriority(String status) {
          switch (status) {
            case 'IN_TRANSIT':
              return 1; // Highest priority
            case 'ASSIGNED':
              return 2;
            case 'PENDING':
              return 3;
            default:
              return 4;
          }
        }

        return getStatusPriority(statusA).compareTo(getStatusPriority(statusB));
      });

      setState(() => _orders = activeOrders);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _refresh() async {
    await _loadOrders();
  }

  String _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return '⬜';
      case 'ASSIGNED':
        return '🔵';
      case 'IN_TRANSIT':
        return '🟡';
      case 'DELIVERED':
        return '🟢';
      case 'CANCELLED':
        return '🔴';
      default:
        return '⚪';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Track Orders'),
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
                  Icon(
                    Icons.inventory_2_outlined,
                    size: 64,
                    color: Colors.grey,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'No orders found',
                    style: TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Create your first order to track it here',
                    style: TextStyle(color: Colors.grey),
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
                    child: InkWell(
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) =>
                                OrderDetailScreen(orderId: order.orderId),
                          ),
                        );
                      },
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
                                Text(
                                  '${_getStatusColor(order.orderStatus)} ${order.orderStatus}',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: _getStatusTextColor(
                                      order.orderStatus,
                                    ),
                                  ),
                                ),
                              ],
                            ),
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
                            const SizedBox(height: 12),
                            // Specifications Row - Keep essential only
                            Row(
                              children: [
                                if (order.weightKg != null)
                                  Expanded(
                                    child: Text(
                                      '${order.weightKg!.toStringAsFixed(1)}kg',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey,
                                      ),
                                    ),
                                  ),
                                if (order.distanceKm != null)
                                  Expanded(
                                    child: Text(
                                      '${order.distanceKm!.toStringAsFixed(0)}km',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey,
                                      ),
                                    ),
                                  ),
                                if (order.packageValue != null)
                                  Expanded(
                                    child: Text(
                                      'VND ${order.packageValue!.toStringAsFixed(0)}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            // Footer Row
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Created: ${_formatDate(order.createdAt)}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[500],
                                  ),
                                ),
                              ],
                            ),
                            if (order.tripStatus != null &&
                                order.estimatedDeliveryTime != null) ...[
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Icon(
                                    Icons.access_time,
                                    size: 16,
                                    color: Colors.blue[600],
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'ETA: ${_formatDateTime(order.estimatedDeliveryTime!)}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.blue[600],
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  if (order.slaExtensionMinutes != null && order.slaExtensionMinutes! > 0) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.orange[100],
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: Colors.orange[300]!),
                                      ),
                                      child: Text(
                                        '+${order.slaExtensionMinutes}m',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: Colors.orange[800],
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                            // Delay Information
                            if (order.delayReason != null && order.delayReason!.isNotEmpty) ...[
                              const SizedBox(height: 8),
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
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.warning_amber,
                                          size: 16,
                                          color: Colors.orange[700],
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          'Delay Reported',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.orange[800],
                                          ),
                                        ),
                                        const Spacer(),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: _getDelayStatusColor(order.delayStatus),
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: Text(
                                            _getDelayStatusText(order.delayStatus),
                                            style: const TextStyle(
                                              fontSize: 10,
                                              color: Colors.white,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      order.delayReason!,
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: Colors.orange[900],
                                      ),
                                    ),

                                  ],
                                ),
                              ),
                            ],
                            const SizedBox(height: 8),
                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton.icon(
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (context) => OrderDetailScreen(
                                        orderId: order.orderId,
                                      ),
                                    ),
                                  );
                                },
                                icon: const Icon(Icons.visibility, size: 16),
                                label: const Text('View Details'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }

  Color _getStatusTextColor(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return Colors.green;
      case 'CANCELLED':
        return Colors.red;
      case 'IN_TRANSIT':
        return Colors.orange;
      case 'ASSIGNED':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.month}/${date.day}/${date.year}';
  }

  String _formatDateTime(DateTime date) {
    return '${date.month}/${date.day} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }

  Color _getDelayStatusColor(String? status) {
    if (status == null) return Colors.grey;
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return Colors.green;
      case 'REJECTED':
        return Colors.red;
      case 'PENDING':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String _getDelayStatusText(String? status) {
    if (status == null) return 'Unknown';
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'PENDING':
        return 'Pending';
      default:
        return status;
    }
  }
}

// Order Detail Screen (simplified for now)
class OrderDetailScreen extends StatefulWidget {
  final int orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  late Future<dynamic> _orderFuture;

  @override
  void initState() {
    super.initState();
    _loadOrderData();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Follow driver screen pattern - refresh when returning to this screen
    // Customers should see updated order tracking status
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        // Force refresh of order data when returning to screen
        setState(() {
          _loadOrderData();
        });
      }
    });
  }

  void _loadOrderData() {
    _orderFuture = Future.wait([
      customerService.getOrderById(widget.orderId),
      customerService.trackOrder(widget.orderId),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Order #${widget.orderId}')),
      body: FutureBuilder(
        future: _orderFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 16),
                  Text('Error: ${snapshot.error}'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => setState(_loadOrderData),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          final data = snapshot.data as List;
          final order = data[0] as Order;
          final tracking = data[1] as TrackOrderResponse;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Add the order map view at the top
                OrderMapView(order: order, tracking: tracking),
                const SizedBox(height: 16),
                _buildOrderCard(order, tracking),
                const SizedBox(height: 16),
                _buildTrackingCard(tracking),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildOrderCard(Order order, TrackOrderResponse tracking) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Order Details',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildInfoRow('Status', order.orderStatus ?? 'Unknown'),
            _buildInfoRow('Priority', order.priorityLevel ?? 'Normal'),
            _buildInfoRow('Customer', order.customerName ?? 'N/A'),
            if (order.customerPhone != null)
              _buildInfoRow('Phone', order.customerPhone!),
            const SizedBox(height: 16),
            const Text(
              'Pickup Address:',
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
            Text(order.pickupAddress ?? 'N/A'),
            const SizedBox(height: 8),
            const Text(
              'Delivery Address:',
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
            Text(order.deliveryAddress ?? 'N/A'),
            if (order.packageDetails != null &&
                order.packageDetails!.isNotEmpty) ...[
              const SizedBox(height: 8),
              const Text(
                'Package Details:',
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
              Text(order.packageDetails!),
            ],
            const SizedBox(height: 16),
            if (order.weightKg != null)
              _buildInfoRow(
                'Weight',
                '${order.weightKg?.toStringAsFixed(1)} kg',
              ),
            if (order.packageValue != null)
              _buildInfoRow(
                'Package Value',
                'VND ${order.packageValue?.toStringAsFixed(0)}',
              ),
            if (order.distanceKm != null)
              _buildInfoRow(
                'Distance',
                '${order.distanceKm?.toStringAsFixed(1)} km',
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrackingCard(TrackOrderResponse tracking) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Tracking Information',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildInfoRow('Status', tracking.orderStatus),
            if (tracking.tripStatus != null)
              _buildInfoRow('Trip Status', tracking.tripStatus!),
            if (tracking.driverName != null) ...[
              _buildInfoRow('Driver', tracking.driverName!),
              if (tracking.driverPhone != null)
                _buildInfoRow('Driver Phone', tracking.driverPhone!),
              if (tracking.vehiclePlate != null)
                _buildInfoRow('Vehicle', tracking.vehiclePlate!),
            ],
            if (tracking.statusHistory.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Text(
                'Status History:',
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 8),
              ...tracking.statusHistory.map(
                (update) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Text(
                        '${update.status}: ',
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                      Text(
                        update.timestamp.toString().split('.')[0],
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),
            ],
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
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
