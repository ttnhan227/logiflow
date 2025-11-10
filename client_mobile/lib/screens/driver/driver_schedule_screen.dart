import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import 'dart:convert';
import '../main_layout.dart';

class DriverScheduleScreen extends StatefulWidget {
  const DriverScheduleScreen({super.key});

  @override
  State<DriverScheduleScreen> createState() => _DriverScheduleScreenState();
}

class _DriverScheduleScreenState extends State<DriverScheduleScreen> {
  bool _isLoading = true;
  List<dynamic> _schedule = [];
  String? _error;
  DateTimeRange? _dateRange;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _dateRange = DateTimeRange(start: now, end: now.add(const Duration(days: 7)));
    _fetchSchedule();
  }

  Future<void> _fetchSchedule() async {
    if (_dateRange == null) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final start = _dateRange!.start.toIso8601String().split('T').first;
      final end = _dateRange!.end.toIso8601String().split('T').first;
      final response = await apiClient.get('/driver/me/schedule?startDate=$start&endDate=$end');
      if (response.statusCode == 200) {
        setState(() {
          _schedule = List.from(jsonDecode(response.body));
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Failed to load schedule: ${response.body}';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _pickDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      initialDateRange: _dateRange,
    );
    if (picked != null) {
      setState(() {
        _dateRange = picked;
      });
      _fetchSchedule();
    }
  }

  Color _getTripStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return Colors.blue;
      case 'in_progress':
        return Colors.orange;
      case 'arrived':
        return Colors.purple;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'My Schedule',
      child: Column(
        children: [
          Card(
            margin: const EdgeInsets.all(16),
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Date Range', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      const SizedBox(height: 4),
                      Text(
                        _dateRange == null ? 'Not selected' : '${_dateRange!.start.toString().split(' ')[0]} - ${_dateRange!.end.toString().split(' ')[0]}',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  ElevatedButton.icon(
                    onPressed: _pickDateRange,
                    icon: const Icon(Icons.calendar_today, size: 18),
                    label: const Text('Change'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(child: Text(_error!))
                    : _schedule.isEmpty
                        ? const Center(child: Text('No scheduled trips in this date range'))
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _schedule.length,
                            itemBuilder: (context, index) {
                              final item = _schedule[index];
                              return Card(
                                elevation: 2,
                                margin: const EdgeInsets.only(bottom: 12),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text('Trip #${item['tripId']}',
                                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                          if (item['status'] != null)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                              decoration: BoxDecoration(
                                                color: _getTripStatusColor(item['status']),
                                                borderRadius: BorderRadius.circular(20),
                                              ),
                                              child: Text(
                                                item['status']?.toUpperCase() ?? 'N/A',
                                                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                              ),
                                            ),
                                        ],
                                      ),
                                      const Divider(height: 20),
                                      if (item['routeName'] != null)
                                        Row(
                                          children: [
                                            const Icon(Icons.route, size: 16, color: Colors.grey),
                                            const SizedBox(width: 8),
                                            Expanded(child: Text(item['routeName'], style: const TextStyle(fontSize: 14))),
                                          ],
                                        ),
                                      if (item['scheduledDeparture'] != null) ...[
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            const Icon(Icons.access_time, size: 16, color: Colors.green),
                                            const SizedBox(width: 8),
                                            Expanded(child: Text('Departure: ${item['scheduledDeparture']}', style: const TextStyle(fontSize: 13))),
                                          ],
                                        ),
                                      ],
                                      if (item['scheduledArrival'] != null) ...[
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            const Icon(Icons.alarm, size: 16, color: Colors.red),
                                            const SizedBox(width: 8),
                                            Expanded(child: Text('Arrival: ${item['scheduledArrival']}', style: const TextStyle(fontSize: 13))),
                                          ],
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}
