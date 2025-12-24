import 'dart:async';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

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
          : RefreshIndicator(
              onRefresh: _refresh,
              child: _error != null
                  ? ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        SizedBox(
                          height: MediaQuery.of(context).size.height * 0.25,
                        ),
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.error_outline,
                                size: 48,
                                color: Colors.red,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Error: $_error',
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _refresh,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      ],
                    )
                  : _orders.isEmpty
                  ? ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: const [
                        SizedBox(height: 160),
                        Center(
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
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey,
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Create your first order to track it here',
                                style: TextStyle(color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ],
                    )
                  : ListView.builder(
                      physics: const AlwaysScrollableScrollPhysics(),
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
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'Order #${order.orderId}',
                                        style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Text(
                                        '${_getStatusColor(order.orderStatus ?? '')} ${order.orderStatus ?? ''}',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500,
                                          color: _getStatusTextColor(
                                            order.orderStatus ?? '',
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),

                                  // ✅ Delay banner nên để ngay đây (customer thấy liền)
                                  if (order.delayReason != null &&
                                      order.delayReason!.isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: Colors.orange[50],
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: Colors.orange[200]!,
                                        ),
                                      ),
                                      child: Row(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
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

                                  // Pickup Type Information
                                  if (order.pickupType != null && order.pickupType!.isNotEmpty) ...[
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
                                          if (order.pickupType == 'WAREHOUSE' && order.warehouseName != null) ...[
                                            Text(
                                              'Warehouse: ${order.warehouseName}',
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: Colors.blue,
                                              ),
                                            ),
                                          ],
                                          if (order.pickupType == 'WAREHOUSE' && order.dockNumber != null) ...[
                                            Text(
                                              'Dock: ${order.dockNumber}',
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: Colors.blue,
                                              ),
                                            ),
                                          ],
                                          if (order.pickupType == 'PORT_TERMINAL' && order.containerNumber != null) ...[
                                            Text(
                                              'Container: ${order.containerNumber}',
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: Colors.blue,
                                              ),
                                            ),
                                          ],
                                          if (order.pickupType == 'PORT_TERMINAL' && order.terminalName != null) ...[
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
                                  Row(
                                    children: [
                                      if (order.weightTons != null)
                                        Expanded(
                                          child: Text(
                                            '${order.weightTons!.toStringAsFixed(1)}t',
                                            style: const TextStyle(
                                              fontSize: 14,
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
  // Load order + initial tracking ONCE (FutureBuilder chỉ dùng lần đầu)
  late Future<List<dynamic>> _initialFuture;

  Order? _order;
  TrackOrderResponse? _tracking;

  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _initialFuture = _fetchInitial();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<List<dynamic>> _fetchInitial() async {
    final results = await Future.wait([
      customerService.getOrderById(widget.orderId),
      customerService.trackOrder(widget.orderId),
    ]);

    _order = results[0] as Order;
    _tracking = results[1] as TrackOrderResponse;

    _startPollingTrackingOnly(); // ✅ chỉ poll tracking, KHÔNG reset FutureBuilder

    return results;
  }

  void _startPollingTrackingOnly() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) async {
      if (!mounted) return;
      try {
        final t = await customerService.trackOrder(widget.orderId);
        if (!mounted) return;
        setState(() => _tracking = t);
      } catch (_) {
        // ignore
      }
    });
  }

  Future<void> _callDriver(String phone) async {
    final raw = phone.trim();
    if (raw.isEmpty) return;

    final sanitized = raw.replaceAll(RegExp(r'[^\d+]'), '');
    final uri = Uri(scheme: 'tel', path: sanitized);

    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('This device cannot open the dialer')),
      );
    }
  }

  Future<void> _copyPhone(String phone) async {
    final trimmed = phone.trim();
    if (trimmed.isEmpty) return;

    await Clipboard.setData(ClipboardData(text: trimmed));
    if (!mounted) return;

    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Phone number copied')));
  }

  Future<void> _retry() async {
    _pollTimer?.cancel();
    setState(() {
      _order = null;
      _tracking = null;
      _initialFuture = _fetchInitial();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Order #${widget.orderId}')),
      body: FutureBuilder<List<dynamic>>(
        future: _initialFuture,
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
                  Text('Error: ${snapshot.error}', textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton(onPressed: _retry, child: const Text('Retry')),
                ],
              ),
            );
          }

          // ✅ Sau lần đầu: ưu tiên dùng state (_order/_tracking) để không reset map
          final order = _order ?? snapshot.data![0] as Order;
          final tracking = _tracking ?? snapshot.data![1] as TrackOrderResponse;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ✅ Map dùng tracking đang poll -> marker nhúc nhích
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

            // Pickup Type Information
            if (order.pickupType != null && order.pickupType!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pickup Type: ${order.pickupType}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.blue,
                      ),
                    ),
                    const SizedBox(height: 6),
                    // Show specific fields based on pickup type
                    if (order.pickupType == 'WAREHOUSE' && order.warehouseName != null) ...[
                      Text(
                        'Warehouse: ${order.warehouseName}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.blue,
                        ),
                      ),
                    ],
                    if (order.pickupType == 'WAREHOUSE' && order.dockNumber != null) ...[
                      Text(
                        'Dock: ${order.dockNumber}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.blue,
                        ),
                      ),
                    ],
                    if (order.pickupType == 'PORT_TERMINAL' && order.containerNumber != null) ...[
                      Text(
                        'Container: ${order.containerNumber}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.blue,
                        ),
                      ),
                    ],
                    if (order.pickupType == 'PORT_TERMINAL' && order.terminalName != null) ...[
                      Text(
                        'Terminal: ${order.terminalName}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.blue,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],

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
    final phone = (tracking.driverPhone ?? '').trim();

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
            if (tracking.driverName != null)
              _buildInfoRow('Driver', tracking.driverName!),
            if (phone.isNotEmpty) _buildInfoRow('Driver Phone', phone),
            if (tracking.vehiclePlate != null)
              _buildInfoRow('Vehicle', tracking.vehiclePlate!),

            // ✅ Call + Copy
            if (phone.isNotEmpty) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _callDriver(phone),
                      icon: const Icon(Icons.call),
                      label: const Text('Call Driver'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _copyPhone(phone),
                      icon: const Icon(Icons.copy),
                      label: const Text('Copy Phone'),
                    ),
                  ),
                ],
              ),
            ],

            // Status history (nếu có)
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
            width: 110,
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

class OrderCard extends StatelessWidget {
  const OrderCard({super.key, required this.order, required this.onTap});

  final OrderSummary order;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final hasDelay =
        order.delayReason != null && order.delayReason!.trim().isNotEmpty;

    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 🔶 DELAY BANNER
              if (hasDelay) ...[
                _DelayBanner(text: order.delayReason!),
                const SizedBox(height: 10),
              ],

              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Order #${order.orderId}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  _StatusPill(text: order.orderStatus),
                ],
              ),

              const SizedBox(height: 8),
              Text('Pickup: ${order.pickupAddress}'),
              const SizedBox(height: 4),
              Text('Delivery: ${order.deliveryAddress}'),
            ],
          ),
        ),
      ),
    );
  }
}

class _DelayBanner extends StatelessWidget {
  const _DelayBanner({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        border: Border.all(color: Colors.orange.shade300),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.warning_amber_rounded,
            color: Colors.orange.shade800,
            size: 18,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                color: Colors.orange.shade900,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.text});

  final String text;

  Color _color(String s) {
    switch (s.toUpperCase()) {
      case 'DELIVERED':
        return Colors.green;
      case 'IN_TRANSIT':
        return Colors.orange;
      case 'ASSIGNED':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _color(text);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: c,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
