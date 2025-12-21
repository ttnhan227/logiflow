import 'package:flutter/material.dart';

import '../../models/customer/order.dart';
import '../../services/customer/customer_service.dart';
import 'customer_chat_screen.dart';

class CustomerChatListScreen extends StatefulWidget {
  const CustomerChatListScreen({super.key});

  @override
  State<CustomerChatListScreen> createState() => _CustomerChatListScreenState();
}

class _CustomerChatListScreenState extends State<CustomerChatListScreen> {
  List<OrderSummary> _orders = [];
  bool _loading = false;
  String? _error;
  int? _customerUserId;

  @override
  void initState() {
    super.initState();
    _loadProfileAndOrders();
  }

  Future<void> _loadProfileAndOrders() async {
    try {
      final profile = await customerService.getProfile();
      setState(() => _customerUserId = profile.userId);
    } catch (_) {
      // ignore profile load errors; fallback to order data
    }
    await _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final allOrders = await customerService.getMyOrders();
      final activeOrders = allOrders.where((order) {
        final status = order.orderStatus.toUpperCase();
        return status == 'PENDING' || status == 'ASSIGNED' || status == 'IN_TRANSIT';
      }).toList();

      activeOrders.sort((a, b) {
        int priority(String status) {
          switch (status.toUpperCase()) {
            case 'IN_TRANSIT':
              return 1;
            case 'ASSIGNED':
              return 2;
            case 'PENDING':
              return 3;
            default:
              return 4;
          }
        }

        return priority(a.orderStatus).compareTo(priority(b.orderStatus));
      });

      setState(() => _orders = activeOrders);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return Colors.blue;
      case 'ASSIGNED':
        return Colors.orange;
      case 'IN_TRANSIT':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  IconData _statusIcon(String status) {
    switch (status.toUpperCase()) {
      case 'ASSIGNED':
        return Icons.local_shipping;
      case 'IN_TRANSIT':
        return Icons.route;
      default:
        return Icons.inventory_2_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Order Chats'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadOrders,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 12),
                      Text(_error!, textAlign: TextAlign.center),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _loadOrders,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _orders.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey),
                          const SizedBox(height: 12),
                          Text(
                            'No active orders',
                            style: TextStyle(fontSize: 18, color: Colors.grey.shade600),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Create an order to chat with dispatcher',
                            style: TextStyle(color: Colors.grey.shade500),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadOrders,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _orders.length,
                        itemBuilder: (context, index) {
                          final order = _orders[index];
                          final statusColor = _statusColor(order.orderStatus);
                          final customerChatId = order.customerUserId ?? order.customerId ?? _customerUserId;

                          return Card(
                            margin: const EdgeInsets.only(bottom: 14),
                            elevation: 2,
                            child: InkWell(
                              onTap: () {
                                if (customerChatId == null) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Chat unavailable: missing customer id'),
                                    ),
                                  );
                                  return;
                                }

                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) => CustomerChatScreen(
                                      orderId: order.orderId,
                                      customerId: customerChatId,
                                    ),
                                  ),
                                );
                              },
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      width: 56,
                                      height: 56,
                                      decoration: BoxDecoration(
                                        color: statusColor.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Icon(
                                        _statusIcon(order.orderStatus),
                                        color: statusColor,
                                        size: 30,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Text(
                                                'Order #${order.orderId}',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 16,
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              Container(
                                                padding: const EdgeInsets.symmetric(
                                                  horizontal: 8,
                                                  vertical: 4,
                                                ),
                                                decoration: BoxDecoration(
                                                  color: statusColor,
                                                  borderRadius: BorderRadius.circular(12),
                                                ),
                                                child: Text(
                                                  order.orderStatus.toUpperCase(),
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 8),
                                          Row(
                                            children: [
                                              const Icon(Icons.location_on, size: 16, color: Colors.grey),
                                              const SizedBox(width: 4),
                                              Expanded(
                                                child: Text(
                                                  order.pickupAddress,
                                                  style: TextStyle(color: Colors.grey.shade700),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Row(
                                            children: [
                                              const Icon(Icons.flag, size: 16, color: Colors.grey),
                                              const SizedBox(width: 4),
                                              Expanded(
                                                child: Text(
                                                  order.deliveryAddress,
                                                  style: TextStyle(color: Colors.grey.shade700),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Icon(
                                      Icons.chat_bubble,
                                      color: customerChatId != null ? statusColor : Colors.grey,
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
}
