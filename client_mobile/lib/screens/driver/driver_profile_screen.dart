import 'package:flutter/material.dart';
import '../../services/driver/driver_service.dart';
import '../../services/api_client.dart';
import '../../models/driver/driver_profile.dart';
import '../../theme/app_theme.dart';
import 'driver_settings_screen.dart';
import 'driver_profile_edit_screen.dart';

class DriverProfileScreen extends StatefulWidget {
  const DriverProfileScreen({super.key});

  @override
  State<DriverProfileScreen> createState() => _DriverProfileScreenState();
}

class _DriverProfileScreenState extends State<DriverProfileScreen> {
  DriverProfile? _profile;
  bool _isLoading = true;
  String? _error;

  String _getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    return '${ApiClient.baseImageUrl}${imagePath.startsWith('/') ? '' : '/'}$imagePath';
  }

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final profile = await driverService.getProfile();

      setState(() {
        _profile = profile;
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
        title: const Text('Driver Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const DriverSettingsScreen(),
                ),
              );
            },
            tooltip: 'Settings',
          ),
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const DriverProfileEditScreen(),
                ),
              ).then((_) => _loadProfile());
            },
            tooltip: 'Edit Profile',
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
                        Text('Error: $_error', textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.textMuted)),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _loadProfile,
                          icon: const Icon(Icons.refresh_rounded, size: 16),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : _profile == null
                  ? const Center(child: Text('No profile data available'))
                  : RefreshIndicator(
                      onRefresh: _loadProfile,
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildHeaderCard(),
                            _buildPerformanceCard(),
                            _buildPersonalInfoCard(),
                            _buildAccountCard(),
                          ],
                        ),
                      ),
                    ),
    );
  }

  Widget _buildHeaderCard() {
    final imageUrl = _getImageUrl(_profile!.profilePictureUrl);
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.border, width: 1),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppTheme.routeOrange, width: 2),
            ),
            child: CircleAvatar(
              radius: 32,
              backgroundColor: AppTheme.surfaceMuted,
              backgroundImage: imageUrl.isNotEmpty ? NetworkImage(imageUrl) : null,
              child: imageUrl.isEmpty
                  ? const Icon(Icons.person, size: 32, color: AppTheme.textMuted)
                  : null,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        _profile!.fullName?.isNotEmpty == true
                            ? _profile!.fullName!
                            : _profile!.username,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.text,
                          letterSpacing: -0.2,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    AppTheme.buildStatusPill(_profile!.status),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  '@${_profile!.username} · CDL Linehaul Driver',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppTheme.textMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryLight,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'LIC: ${_profile!.driverLicenseNumber ?? "PENDING VERIFICATION"}',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.3,
                      color: AppTheme.primaryDark,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPerformanceCard() {
    return AppTheme.buildDispatchCard(
      title: 'DISPATCH PERFORMANCE METRICS',
      icon: Icons.insights_rounded,
      headerIconColor: AppTheme.routeOrange,
      children: [
        Row(
          children: [
            Expanded(
              child: AppTheme.buildMetricTile(
                label: 'Rating',
                value: _profile!.rating.toStringAsFixed(1),
                unit: '★',
                icon: Icons.star_rounded,
                iconColor: Colors.amber,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AppTheme.buildMetricTile(
                label: 'Completed',
                value: _profile!.totalDeliveries.toString(),
                unit: 'trips',
                icon: Icons.local_shipping_rounded,
                iconColor: AppTheme.primary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: AppTheme.buildMetricTile(
                label: 'Earnings',
                value: '\${_profile!.totalEarnings.toStringAsFixed(0)}',
                unit: 'USD',
                icon: Icons.payments_outlined,
                iconColor: AppTheme.success,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AppTheme.buildMetricTile(
                label: 'Avg Turnaround',
                value: _profile!.averageDeliveryTime != null
                    ? _profile!.averageDeliveryTime!.toStringAsFixed(0)
                    : '--',
                unit: 'min',
                icon: Icons.timer_outlined,
                iconColor: AppTheme.routeOrange,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPersonalInfoCard() {
    return AppTheme.buildDispatchCard(
      title: 'DRIVER CREDENTIALS & LICENSING',
      icon: Icons.badge_outlined,
      headerIconColor: AppTheme.primary,
      children: [
        _buildInfoRow('Email Address', _profile!.email),
        const Divider(height: 18),
        _buildInfoRow('Phone Number', _profile!.phone ?? 'Not specified'),
        const Divider(height: 18),
        _buildInfoRow('License Number', _profile!.driverLicenseNumber ?? 'Not available'),
        const Divider(height: 18),
        _buildInfoRow('License Expiry', _profile!.licenseExpiryDate ?? 'Not available'),
      ],
    );
  }

  Widget _buildAccountCard() {
    return AppTheme.buildDispatchCard(
      title: 'SYSTEM REGISTRATION & SECURITY',
      icon: Icons.security_rounded,
      headerIconColor: AppTheme.navy,
      children: [
        _buildInfoRow('Account Member Since', _formatDate(_profile!.createdAt)),
        const Divider(height: 18),
        _buildInfoRow('Driver Role', 'Heavy Commercial Vehicle (HCV)'),
        const Divider(height: 18),
        _buildInfoRow('Telemetry Frequency', '24Hz STOMP WebSocket Live'),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 140,
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: AppTheme.textMuted,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppTheme.text,
            ),
          ),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.month}/${date.day}/${date.year}';
  }
}
