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

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'My Schedule',
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Text(_dateRange == null ? '' : '${_dateRange!.start.toString().split(' ')[0]} - ${_dateRange!.end.toString().split(' ')[0]}'),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _pickDateRange,
                  child: const Text('Pick Date Range'),
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(child: Text(_error!))
                    : ListView.builder(
                        itemCount: _schedule.length,
                        itemBuilder: (context, index) {
                          final item = _schedule[index];
                          return Card(
                            child: ListTile(
                              title: Text('Trip #${item['tripId']}'),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Departure: ${item['scheduledDeparture']}'),
                                  if (item['scheduledArrival'] != null)
                                    Text('Arrival: ${item['scheduledArrival']}'),
                                  if (item['status'] != null)
                                    Text('Status: ${item['status']}'),
                                  if (item['routeName'] != null)
                                    Text('Route: ${item['routeName']}'),
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
