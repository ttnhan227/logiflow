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
                  : Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Hours Driven: ${_compliance!['hoursDrivenTotal']}'),
                          Text('Rest Required: ${_compliance!['restRequiredHours']}'),
                          if (_compliance!['nextAvailableTime'] != null)
                            Text('Next Available: ${_compliance!['nextAvailableTime']}'),
                        ],
                      ),
                    ),
    );
  }
}
