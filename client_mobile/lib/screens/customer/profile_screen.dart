import 'package:flutter/material.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../../services/customer/customer_service.dart';
import '../../services/upload/upload_service.dart';
import '../../services/auth/auth_service.dart';
import '../../services/api_client.dart';
import '../../models/customer/customer_profile.dart';
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

    // Base URL without /api (same as web client logic)
    return '${ApiClient.baseImageUrl}${imagePath.startsWith('/') ? '' : '/'}$imagePath';
  }

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    super.dispose();
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
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const CustomerProfileEditScreen(),
                ),
              ).then((_) => _loadProfile()); // Refresh after edit
            },
          ),
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
                    onPressed: _loadProfile,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            )
          : _profile == null
          ? const Center(child: Text('No profile data available'))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildProfilePicture(),
                  const SizedBox(height: 16),
                  _buildProfileCard(),
                  const SizedBox(height: 16),
                  _buildAccountStatsCard(),
                ],
              ),
            ),
    );
  }

  Widget _buildProfileCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Personal Information',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildInfoRow('Username', _profile!.username),
            const SizedBox(height: 12),
            _buildInfoRow('Email', _profile!.email),
            const SizedBox(height: 16),
            _buildInfoRow('Full Name', _profile!.fullName ?? 'Not set'),
            const SizedBox(height: 12),
            _buildInfoRow('Phone', _profile!.phone ?? 'Not set'),
            const SizedBox(height: 12),
            _buildInfoRow('Address', _profile!.address ?? 'Not set'),
            const SizedBox(height: 12),
            _buildInfoRow(
              'Payment Method',
              _getPaymentMethodDisplay(_profile!.paymentMethod),
            ),
            const SizedBox(height: 16),
            const Text(
              'Company Information',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _buildInfoRow('Company Name', _profile!.companyName ?? 'Not set'),
            const SizedBox(height: 12),
            _buildInfoRow('Company Code', _profile!.companyCode ?? 'Not set'),
          ],
        ),
      ),
    );
  }

  Widget _buildAccountStatsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Account Statistics',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildInfoRow('Member Since', _formatDate(_profile!.createdAt)),
            const SizedBox(height: 12),
            _buildInfoRow('Total Orders', _profile!.totalOrders.toString()),
            const SizedBox(height: 12),
            _buildInfoRow(
              'Total Spent',
              '\$${_profile!.totalSpent.toStringAsFixed(2)}',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 100,
          child: Text(
            '$label:',
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
        ),
        Expanded(child: Text(value)),
      ],
    );
  }

  Widget _buildProfilePicture() {
    final imageUrl = _getImageUrl(_profile!.profilePictureUrl);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text(
              'Profile Picture',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            CircleAvatar(
              radius: 50,
              backgroundColor: Colors.grey[200],
              backgroundImage: imageUrl.isNotEmpty
                  ? NetworkImage(imageUrl)
                  : null,
              child: imageUrl.isEmpty
                  ? const Icon(Icons.person, size: 50, color: Colors.grey)
                  : null,
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.month}/${date.day}/${date.year}';
  }

  String _getPaymentMethodDisplay(String? paymentMethod) {
    if (paymentMethod == null) return 'Not set';

    switch (paymentMethod) {
      case 'cash':
        return 'Cash on Delivery';
      case 'credit_card':
        return 'Credit Card';
      case 'debit_card':
        return 'Debit Card';
      case 'digital_wallet':
        return 'Digital Wallet';
      default:
        return paymentMethod;
    }
  }
}
