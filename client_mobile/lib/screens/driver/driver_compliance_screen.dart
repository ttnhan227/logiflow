import 'package:flutter/material.dart';
import '../../services/driver/driver_service.dart';
import '../../models/driver/compliance.dart';
import '../../theme/app_theme.dart';

class DriverComplianceScreen extends StatefulWidget {
  const DriverComplianceScreen({super.key});

  @override
  State<DriverComplianceScreen> createState() => _DriverComplianceScreenState();
}

class _DriverComplianceScreenState extends State<DriverComplianceScreen> {
  bool _isLoading = true;
  DriverCompliance? _compliance;
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
      final compliance = await driverService.getMyCompliance();
      setState(() {
        _compliance = compliance;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('HOS Compliance'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchCompliance,
            tooltip: 'Refresh Status',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline_rounded, size: 48, color: AppTheme.danger),
                        const SizedBox(height: 16),
                        Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.textMuted)),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _fetchCompliance,
                          icon: const Icon(Icons.refresh_rounded, size: 16),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : _compliance == null
                  ? const Center(child: Text('No compliance data available'))
                  : RefreshIndicator(
                      onRefresh: _fetchCompliance,
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(16),
                        children: [
                          // HOS Status Card
                          AppTheme.buildDispatchCard(
                            title: 'HOS TELEMETRY & HOURS AUDIT',
                            icon: Icons.shield_rounded,
                            headerIconColor: AppTheme.success,
                            trailing: AppTheme.buildStatusPill('COMPLIANT'),
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: AppTheme.buildMetricTile(
                                      label: 'Hours Driven',
                                      value: '${_compliance!.hoursDrivenTotal ?? 0}',
                                      unit: 'hrs',
                                      icon: Icons.speed_rounded,
                                      iconColor: AppTheme.primary,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: AppTheme.buildMetricTile(
                                      label: 'Rest Required',
                                      value: '${_compliance!.restRequiredHours ?? 0}',
                                      unit: 'hrs',
                                      icon: Icons.hotel_rounded,
                                      iconColor: AppTheme.routeOrange,
                                    ),
                                  ),
                                ],
                              ),
                              if (_compliance!.nextAvailableTime != null) ...[
                                const SizedBox(height: 14),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryLight,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFBAE6FD), width: 1),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.schedule_rounded, size: 18, color: AppTheme.primary),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Text(
                                              'NEXT DISPATCH CLEARANCE',
                                              style: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w800,
                                                letterSpacing: 0.5,
                                                color: AppTheme.primaryDark,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              '${_compliance!.nextAvailableTime}',
                                              style: const TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w700,
                                                color: AppTheme.text,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppTheme.successBg,
                                          borderRadius: BorderRadius.circular(4),
                                          border: Border.all(color: AppTheme.successBorder),
                                        ),
                                        child: const Text(
                                          'CLEAR',
                                          style: TextStyle(
                                            color: AppTheme.success,
                                            fontSize: 9.5,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),

                          // Regulatory Guidelines Card
                          AppTheme.buildDispatchCard(
                            title: 'LINEHAUL REGULATORY STANDARDS',
                            icon: Icons.gavel_rounded,
                            headerIconColor: AppTheme.routeOrange,
                            children: [
                              _buildRuleRow(
                                Icons.timer_outlined,
                                'Maximum Continuous Drive',
                                '4 hours maximum before mandatory 15-min rest',
                              ),
                              const Divider(height: 20),
                              _buildRuleRow(
                                Icons.calendar_today_outlined,
                                'Daily Drive Ceiling',
                                '10 hours total drive time per 24-hour cycle',
                              ),
                              const Divider(height: 20),
                              _buildRuleRow(
                                Icons.bed_outlined,
                                'Mandatory Consecutive Rest',
                                'Minimum 11 consecutive off-duty hours required',
                              ),
                            ],
                          ),

                          // Automated Tracking Banner
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceMuted,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.border, width: 0.8),
                            ),
                            child: Row(
                              children: const [
                                Icon(Icons.verified_rounded, size: 16, color: AppTheme.primary),
                                SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'Hours of Service (HOS) telemetry synchronizes in real-time with backend dispatch logs via STOMP broker.',
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      color: AppTheme.textMuted,
                                      height: 1.4,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
    );
  }

  Widget _buildRuleRow(IconData icon, String title, String description) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppTheme.primary),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.text,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                description,
                style: const TextStyle(
                  fontSize: 11.5,
                  color: AppTheme.textMuted,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
