import 'package:flutter/material.dart';
import '../../services/customer/customer_service.dart';
import '../../services/api_client.dart';
import '../../models/customer/customer_profile.dart';
import '../../theme/app_theme.dart';
import 'customer_profile_edit_screen.dart';

class CustomerProfileScreen extends StatefulWidget {
  const CustomerProfileScreen({super.key});

  @override
  State<CustomerProfileScreen> createState() => _CustomerProfileScreenState();
}

class _CustomerProfileScreenState extends State<CustomerProfileScreen> {
  CustomerProfile? _profile;
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

      final profile = await customerService.getProfile();

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
        title: const Text('Shipper Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const CustomerProfileEditScreen(),
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
                            _buildStatsCard(),
                            _buildPersonalInfoCard(),
                            _buildCompanyInfoCard(),
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
              border: Border.all(color: AppTheme.primary, width: 2),
            ),
            child: CircleAvatar(
              radius: 32,
              backgroundColor: AppTheme.surfaceMuted,
              backgroundImage: imageUrl.isNotEmpty ? NetworkImage(imageUrl) : null,
              child: imageUrl.isEmpty
                  ? const Icon(Icons.business_center_rounded, size: 30, color: AppTheme.primary)
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
                    AppTheme.buildStatusPill('VERIFIED'),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  '@${_profile!.username} · Enterprise Shipper',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppTheme.textMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (_profile!.companyName != null) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryLight,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      _profile!.companyName!.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.3,
                        color: AppTheme.primaryDark,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsCard() {
    return AppTheme.buildDispatchCard(
      title: 'SHIPMENT AUDIT & SPEND',
      icon: Icons.analytics_outlined,
      headerIconColor: AppTheme.routeOrange,
      children: [
        Row(
          children: [
            Expanded(
              child: AppTheme.buildMetricTile(
                label: 'Total Orders',
                value: _profile!.totalOrders.toString(),
                unit: 'shipments',
                icon: Icons.inventory_2_outlined,
                iconColor: AppTheme.primary,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AppTheme.buildMetricTile(
                label: 'Total Spend',
                value: '\${_profile!.totalSpent.toStringAsFixed(0)}',
                unit: 'USD',
                icon: Icons.account_balance_wallet_outlined,
                iconColor: AppTheme.success,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPersonalInfoCard() {
    return AppTheme.buildDispatchCard(
      title: 'CONTACT & BILLING DETAILS',
      icon: Icons.person_outline_rounded,
      headerIconColor: AppTheme.primary,
      children: [
        _buildInfoRow('Account Username', _profile!.username),
        const Divider(height: 18),
        _buildInfoRow('Email Address', _profile!.email),
        const Divider(height: 18),
        _buildInfoRow('Contact Phone', _profile!.phone ?? 'Not set'),
        const Divider(height: 18),
        _buildInfoRow('Primary Address', _profile!.address ?? 'Not specified'),
        const Divider(height: 18),
        _buildInfoRow(
          'Payment Method',
          _getPaymentMethodDisplay(_profile!.paymentMethod),
        ),
      ],
    );
  }

  Widget _buildCompanyInfoCard() {
    return AppTheme.buildDispatchCard(
      title: 'ENTERPRISE ACCOUNT PROFILE',
      icon: Icons.corporate_fare_rounded,
      headerIconColor: AppTheme.navy,
      children: [
        _buildInfoRow('Corporate Entity', _profile!.companyName ?? 'Independent Shipper'),
        const Divider(height: 18),
        _buildInfoRow('Client Code', _profile!.companyCode ?? 'STANDARD-01'),
        const Divider(height: 18),
        _buildInfoRow('Account Registered', _formatDate(_profile!.createdAt)),
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

  String _getPaymentMethodDisplay(String? paymentMethod) {
    if (paymentMethod == null) return 'Cash on Delivery (Standard)';

    switch (paymentMethod) {
      case 'cash':
        return 'Cash on Delivery';
      case 'credit_card':
        return 'Corporate Credit Line';
      case 'debit_card':
        return 'Direct Debit';
      case 'digital_wallet':
        return 'Digital Settlement';
      default:
        return paymentMethod;
    }
  }
}
