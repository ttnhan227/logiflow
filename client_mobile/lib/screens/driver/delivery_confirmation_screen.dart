import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:signature/signature.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/api_client.dart';
import '../../services/driver/driver_service.dart';

class DeliveryConfirmationScreen extends StatefulWidget {
  final int tripId;

  const DeliveryConfirmationScreen({super.key, required this.tripId});

  @override
  State<DeliveryConfirmationScreen> createState() => _DeliveryConfirmationScreenState();
}

class _DeliveryConfirmationScreenState extends State<DeliveryConfirmationScreen> {
  String _confirmationType = 'SIGNATURE'; // SIGNATURE, PHOTO, OTP
  final SignatureController _signatureController = SignatureController(
    penStrokeWidth: 3,
    penColor: Colors.black,
    exportBackgroundColor: Colors.white,
  );
  XFile? _selectedPhoto;
  final TextEditingController _otpController = TextEditingController();
  final TextEditingController _recipientNameController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _signatureController.dispose();
    _otpController.dispose();
    _recipientNameController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    final ImagePicker picker = ImagePicker();
    final XFile? photo = await picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );
    if (photo != null) {
      setState(() {
        _selectedPhoto = photo;
      });
    }
  }

  Future<void> _submitConfirmation() async {
    setState(() => _isSubmitting = true);

    try {
      final apiClient = ApiClient();

      Map<String, dynamic> confirmationData = {
        'tripId': widget.tripId,
        'confirmationType': _confirmationType,
        'recipientName': _recipientNameController.text,
        'notes': _notesController.text,
      };

      // Add specific confirmation data based on type
      if (_confirmationType == 'SIGNATURE') {
        if (_signatureController.isEmpty) {
          throw Exception('Please provide a signature');
        }
        final signature = await _signatureController.toPngBytes();
        if (signature != null) {
          confirmationData['signatureData'] = base64Encode(signature);
        }
      } else if (_confirmationType == 'PHOTO') {
        if (_selectedPhoto == null) {
          throw Exception('Please take a photo');
        }
        final bytes = await _selectedPhoto!.readAsBytes();
        confirmationData['photoData'] = base64Encode(bytes);
      } else if (_confirmationType == 'OTP') {
        if (_otpController.text.isEmpty) {
          throw Exception('Please enter OTP code');
        }
        confirmationData['otpCode'] = _otpController.text;
      }

      final response = await apiClient.post(
        '/driver/me/trips/${widget.tripId}/confirm-delivery',
        body: confirmationData,
      );

      if (response.statusCode == 200) {
        print('Delivery confirmation successful - response: ${response.body}');

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Delivery confirmed successfully')),
          );
          Navigator.of(context).pop(true); // Return true to indicate success
        }
      } else {
        throw Exception('Failed to confirm delivery: ${response.body}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }



  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Confirm Delivery'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Confirmation Method',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: RadioListTile<String>(
                    title: const Text('Signature'),
                    value: 'SIGNATURE',
                    groupValue: _confirmationType,
                    onChanged: (value) => setState(() => _confirmationType = value!),
                  ),
                ),
                Expanded(
                  child: RadioListTile<String>(
                    title: const Text('Photo'),
                    value: 'PHOTO',
                    groupValue: _confirmationType,
                    onChanged: (value) => setState(() => _confirmationType = value!),
                  ),
                ),
              ],
            ),
            RadioListTile<String>(
              title: const Text('OTP'),
              value: 'OTP',
              groupValue: _confirmationType,
              onChanged: (value) => setState(() => _confirmationType = value!),
            ),
            const SizedBox(height: 16),
            
            // Confirmation method specific UI
            if (_confirmationType == 'SIGNATURE') ...[
              const Text(
                'Recipient Signature',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Container(
                height: 200,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Signature(
                  controller: _signatureController,
                  backgroundColor: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => _signatureController.clear(),
                child: const Text('Clear Signature'),
              ),
            ] else if (_confirmationType == 'PHOTO') ...[
              const Text(
                'Delivery Photo',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              if (_selectedPhoto != null)
                Container(
                  height: 200,
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Center(child: Text('Photo captured')),
                ),
              const SizedBox(height: 8),
              ElevatedButton.icon(
                onPressed: _pickPhoto,
                icon: const Icon(Icons.camera_alt),
                label: Text(_selectedPhoto == null ? 'Take Photo' : 'Retake Photo'),
              ),
            ] else if (_confirmationType == 'OTP') ...[
              const Text(
                'Enter OTP Code',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _otpController,
                decoration: const InputDecoration(
                  labelText: 'OTP Code',
                  border: OutlineInputBorder(),
                  hintText: 'Enter OTP received from customer',
                ),
                keyboardType: TextInputType.number,
                maxLength: 6,
              ),
            ],
            
            const SizedBox(height: 16),
            TextField(
              controller: _recipientNameController,
              decoration: const InputDecoration(
                labelText: 'Recipient Name (Optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _notesController,
              decoration: const InputDecoration(
                labelText: 'Notes (Optional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitConfirmation,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.all(16),
              ),
              child: _isSubmitting
                  ? const CircularProgressIndicator()
                  : const Text('Confirm Delivery', style: TextStyle(fontSize: 18)),
            ),
          ],
        ),
      ),
    );
  }
}
