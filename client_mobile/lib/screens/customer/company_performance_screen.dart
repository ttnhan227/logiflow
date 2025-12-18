import 'package:flutter/material.dart';
import '../../services/customer/customer_service.dart';
import '../../models/customer/company_performance.dart';

class CompanyPerformanceScreen extends StatefulWidget {
  const CompanyPerformanceScreen({super.key});

  @override
  State<CompanyPerformanceScreen> createState() => _CompanyPerformanceScreenState();
}

class _CompanyPerformanceScreenState extends State<CompanyPerformanceScreen> {
  CompanyPerformance? _performance;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPerformance();
  }

  Future<void> _loadPerformance() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final performance = await customerService.getCompanyPerformance();
      setState(() => _performance = performance);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _refresh() async {
    await _loadPerformance();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Company Performance'),
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
              : _performance == null
                  ? const Center(
                      child: Text('No performance data available'),
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildOverviewCard(),
                          const SizedBox(height: 16),
                          _buildDeliveryMetricsCard(),
                          const SizedBox(height: 16),
                          _buildPickupTypeComparisonCard(),
                        ],
                      ),
                    ),
    );
  }

  Widget _buildOverviewCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Overview',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildMetricTile(
                    'Total Orders',
                    _performance!.totalOrders.toString(),
                    Icons.inventory,
                    Colors.blue,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildMetricTile(
                    'Delivered',
                    _performance!.deliveredOrders.toString(),
                    Icons.check_circle,
                    Colors.green,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildMetricTile(
                    'Cancelled',
                    _performance!.cancelledOrders.toString(),
                    Icons.cancel,
                    Colors.red,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildMetricTile(
                    'Total Spent',
                    '\$${_performance!.totalSpent.toStringAsFixed(0)}',
                    Icons.attach_money,
                    Colors.orange,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDeliveryMetricsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Delivery Performance',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildMetricTile(
                    'On-Time Rate',
                    '${_performance!.onTimeDeliveryRate.toStringAsFixed(1)}%',
                    Icons.timer,
                    _performance!.onTimeDeliveryRate >= 90 ? Colors.green :
                    _performance!.onTimeDeliveryRate >= 75 ? Colors.orange : Colors.red,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildMetricTile(
                    'Avg Delivery',
                    _formatDuration(_performance!.averageDeliveryTime),
                    Icons.schedule,
                    Colors.blue,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildMetricTile(
              'Average Delay',
              _formatDuration(_performance!.averageDelay),
              Icons.warning,
              _performance!.averageDelay.inMinutes < 30 ? Colors.green :
              _performance!.averageDelay.inMinutes < 60 ? Colors.orange : Colors.red,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPickupTypeComparisonCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Pickup Type Performance',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ..._performance!.pickupTypePerformance.entries.map((entry) {
              final performance = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      performance.pickupType == 'PORT' ? '🚢 Port Pickups' : '🏭 Warehouse Pickups',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: _buildSmallMetric(
                            'Orders',
                            performance.totalOrders.toString(),
                          ),
                        ),
                        Expanded(
                          child: _buildSmallMetric(
                            'On-Time',
                            '${performance.onTimeRate.toStringAsFixed(1)}%',
                          ),
                        ),
                        Expanded(
                          child: _buildSmallMetric(
                            'Avg Delay',
                            _formatDuration(performance.averageDelay),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricTile(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 32, color: color),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: color.withOpacity(0.8),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildSmallMetric(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  String _formatDuration(Duration duration) {
    if (duration.inHours > 0) {
      return '${duration.inHours}h ${duration.inMinutes % 60}m';
    } else if (duration.inMinutes > 0) {
      return '${duration.inMinutes}m';
    } else {
      return '< 1m';
    }
  }
}
