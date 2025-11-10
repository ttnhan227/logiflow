import 'package:flutter/material.dart';
import '../../services/api_client.dart';
import 'dart:convert';
import '../main_layout.dart';

class DriverComplianceScreen extends StatefulWidget {
  const DriverComplianceScreen({super.key});

  @override
  State<DriverComplianceScreen> createState() => _DriverComplianceScreenState();
}

class _DriverComplianceScreenState extends State<DriverComplianceScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _compliance;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchCompliance();
  }

  Future<void> _fetchCompliance() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await apiClient.get('/driver/me/compliance/rest-periods');
      if (response.statusCode == 200) {
        setState(() {
          _compliance = jsonDecode(response.body);
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Failed to load compliance: ${response.body}';
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

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Icon(icon, size: 40, color: color),
            const SizedBox(height: 12),
            Text(title, style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'Compliance',
      child: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _compliance == null
                  ? const Center(child: Text('No compliance data'))
                  : ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        // Summary Card
                        Card(
                          elevation: 2,
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(Icons.check_circle, color: Colors.green.shade700, size: 28),
                                    const SizedBox(width: 12),
                                    const Text('Compliance Status', 
                                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                                const Divider(height: 20),
                                Row(
                                  children: [
                                    const Icon(Icons.timer, size: 20, color: Colors.grey),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text('Hours Driven (Total)', 
                                            style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                                          const SizedBox(height: 4),
                                          Text('${_compliance!['hoursDrivenTotal'] ?? 'N/A'}', 
                                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  children: [
                                    const Icon(Icons.hotel, size: 20, color: Colors.grey),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text('Rest Required (Hours)', 
                                            style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                                          const SizedBox(height: 4),
                                          Text('${_compliance!['restRequiredHours'] ?? 'N/A'}', 
                                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                if (_compliance!['nextAvailableTime'] != null) ...[
                                  const SizedBox(height: 16),
                                  Row(
                                    children: [
                                      const Icon(Icons.schedule, size: 20, color: Colors.grey),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text('Next Available Time', 
                                              style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                                            const SizedBox(height: 4),
                                            Text('${_compliance!['nextAvailableTime']}', 
                                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blue)),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Info Card
                        Card(
                          elevation: 2,
                          color: Colors.blue.shade50,
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Icon(Icons.info_outline, color: Colors.blue.shade700),
                                const SizedBox(width: 12),
                                const Expanded(
                                  child: Text(
                                    'Work hours and rest periods are tracked automatically to ensure compliance with regulations.',
                                    style: TextStyle(fontSize: 13),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
    );
  }
}
