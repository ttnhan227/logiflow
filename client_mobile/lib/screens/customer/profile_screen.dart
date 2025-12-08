import 'package:flutter/material.dart';
import '../../services/customer/customer_service.dart';
import '../../models/customer/customer_profile.dart';

class CustomerProfileScreen extends StatefulWidget {
  const CustomerProfileScreen({super.key});

  @override
  State<CustomerProfileScreen> createState() => _CustomerProfileScreenState();
}

class _CustomerProfileScreenState extends State<CustomerProfileScreen> {
  CustomerProfile? _profile;
  bool _isLoading = true;
  bool _isEditing = false;
  String? _error;

  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  String? _paymentMethod;

  String _getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';

    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // Base URL without /api (same as web client logic)
    const baseUrl = 'http://192.168.1.22:8080'; // Match ApiClient baseUrl pattern
    return '$baseUrl${imagePath.startsWith('/') ? '' : '/'}$imagePath';
  }

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
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
        // Populate controllers if we have data
        if (profile.fullName != null) _fullNameController.text = profile.fullName!;
        if (profile.phone != null) _phoneController.text = profile.phone!;
        if (profile.address != null) _addressController.text = profile.address!;
        _paymentMethod = profile.paymentMethod;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveProfile() async {
    if (_profile == null) return;

    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final request = UpdateProfileRequest(
        fullName: _fullNameController.text.trim().isNotEmpty ? _fullNameController.text.trim() : null,
        phone: _phoneController.text.trim().isNotEmpty ? _phoneController.text.trim() : null,
        address: _addressController.text.trim().isNotEmpty ? _addressController.text.trim() : null,
        paymentMethod: _paymentMethod,
      );

      final updatedProfile = await customerService.updateProfile(request);

      setState(() {
        _profile = updatedProfile;
        _isEditing = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated successfully')),
      );
    } catch (e) {
      setState(() => _error = e.toString());
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update profile: $e')),
      );
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
            icon: Icon(_isEditing ? Icons.save : Icons.edit),
            onPressed: _isLoading ? null : (_isEditing ? _saveProfile : () {
              setState(() => _isEditing = true);
            }),
          ),
          if (_isEditing) IconButton(
            icon: const Icon(Icons.cancel),
            onPressed: () {
              setState(() {
                _isEditing = false;
                // Reset form data
                _loadProfile();
              });
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
                  ? const Center(
                      child: Text('No profile data available'),
                    )
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
            if (_isEditing) ...[
              _buildTextField('Full Name', _fullNameController),
              const SizedBox(height: 16),
              _buildTextField('Phone Number', _phoneController),
              const SizedBox(height: 16),
              _buildTextField('Address', _addressController, maxLines: 3),
              const SizedBox(height: 16),
              _buildPaymentMethodDropdown(),
            ] else ...[
              _buildInfoRow('Full Name', _profile!.fullName ?? 'Not set'),
              const SizedBox(height: 12),
              _buildInfoRow('Phone', _profile!.phone ?? 'Not set'),
              const SizedBox(height: 12),
              _buildInfoRow('Address', _profile!.address ?? 'Not set'),
            ],
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
            _buildInfoRow('Total Spent', '\$${_profile!.totalSpent.toStringAsFixed(2)}'),
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
        Expanded(
          child: Text(value),
        ),
      ],
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, {int maxLines = 1}) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
      ),
      maxLines: maxLines,
    );
  }

  Widget _buildPaymentMethodDropdown() {
    return DropdownButtonFormField<String>(
      value: _paymentMethod,
      decoration: const InputDecoration(
        labelText: 'Preferred Payment Method',
        border: OutlineInputBorder(),
      ),
      items: const [
        DropdownMenuItem(value: null, child: Text('Not specified')),
        DropdownMenuItem(value: 'cash', child: Text('Cash on Delivery')),
        DropdownMenuItem(value: 'credit_card', child: Text('Credit Card')),
        DropdownMenuItem(value: 'debit_card', child: Text('Debit Card')),
        DropdownMenuItem(value: 'digital_wallet', child: Text('Digital Wallet')),
      ],
      onChanged: (value) {
        setState(() => _paymentMethod = value);
      },
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
              backgroundImage: imageUrl.isNotEmpty ? NetworkImage(imageUrl) : null,
              child: imageUrl.isEmpty ? const Icon(Icons.person, size: 50, color: Colors.grey) : null,
            ),
            const SizedBox(height: 8),
            Text(
              _profile!.fullName ?? _profile!.username,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.month}/${date.day}/${date.year}';
  }
}
