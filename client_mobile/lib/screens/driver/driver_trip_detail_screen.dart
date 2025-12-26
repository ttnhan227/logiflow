import 'package:flutter/material.dart';
import 'dart:async';
import '../../services/api_client.dart';
import '../../services/driver/driver_service.dart';
import '../../services/gps/gps_tracking_service.dart';
import 'dart:convert';
import 'widgets/trip_map_view.dart';
import 'delivery_confirmation_screen.dart';
import 'driver_chat_screen.dart';
import '../../models/driver/trip.dart';

class DriverTripDetailScreen extends StatefulWidget {
  final int tripId;
  const DriverTripDetailScreen({super.key, required this.tripId});

  @override
  State<DriverTripDetailScreen> createState() => _DriverTripDetailScreenState();
}

class _DriverTripDetailScreenState extends State<DriverTripDetailScreen> {
  bool _isLoading = true;
  bool _isOrderSectionExpanded = true;
  bool _isDelayDialogOpen = false;
  bool _isSubmittingDelay = false;
  Map<String, dynamic>? _tripDetail;
  String? _error;
  String? _previousTripStatus;
  bool? _hasActiveAssignment;
  int? _driverId;
  final TextEditingController _delayReasonController = TextEditingController();
  String? _currentDelayReason;
  bool _delayReportExist = false;
  String? _delayStatus;
  String? _delayAdminComment;

  @override
  void initState() {
    super.initState();
    _fetchTripDetail();
    _checkForActiveAssignments();
  }

  Future<void> _checkForActiveAssignments() async {
    try {
      final hasActive = await driverService.hasActiveTripAssignment();
      setState(() {
        _hasActiveAssignment = hasActive;
      });
    } catch (e) {
      // If unable to check, assume no active assignment
      setState(() {
        _hasActiveAssignment = false;
      });
    }
  }

  @override
  void dispose() {
    // Stop GPS tracking when leaving the screen
    if (gpsTrackingService.isTracking &&
        gpsTrackingService.currentTripId == widget.tripId.toString()) {
      gpsTrackingService.disconnect();
    }
    super.dispose();
  }

  Future<void> _handleGpsTrackingForTripStatus(
    String status,
    String tripId,
  ) async {
    switch (status) {
      case 'in_progress':
        // Start GPS tracking when trip begins
        try {
          await gpsTrackingService.connectAndStartTracking(tripId);
          print('GPS tracking started for trip $tripId');
        } catch (e) {
          print('Failed to start GPS tracking: $e');
        }
        break;

      case 'completed':
      case 'cancelled':
        // Stop GPS tracking when trip ends
        if (gpsTrackingService.isTracking &&
            gpsTrackingService.currentTripId == tripId) {
          gpsTrackingService.disconnect();
          print('GPS tracking stopped for trip $tripId');
        }
        break;

      default:
        // Continue tracking for other statuses (like 'arrived') - GPS stays active
        // until trip is completed or cancelled
        break;
    }
  }

  int? _extractDriverId(Map<String, dynamic> trip) {
    // Common shapes: driverId at root, or nested under driver/assignment
    if (trip['driverId'] != null) return trip['driverId'] as int?;
    if (trip['driver'] != null && trip['driver']['driverId'] != null) {
      return trip['driver']['driverId'] as int?;
    }
    if (trip['tripAssignments'] != null &&
        trip['tripAssignments'] is List &&
        (trip['tripAssignments'] as List).isNotEmpty) {
      final first = (trip['tripAssignments'] as List).first;
      if (first is Map &&
          first['driver'] != null &&
          first['driver']['driverId'] != null) {
        return first['driver']['driverId'] as int?;
      }
    }
    return null;
  }

  Future<void> _fetchTripDetail() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      // Use the driver service to get trip details
      final tripDetail = await driverService.getMyTripDetail(widget.tripId);

      // Convert to map format for backward compatibility with existing code
      final newTripDetail = tripDetail.toJson();

      // DEBUG: Log the full response
      print('DEBUG: Full trip response: $newTripDetail');
      print('DEBUG: Orders in response: ${newTripDetail['orders']}');

      // Check if trip status changed and handle GPS tracking accordingly
      final previousStatus = _tripDetail?['status'];
      final newStatus = newTripDetail['status'];

      if (previousStatus != newStatus || _previousTripStatus != newStatus) {
        await _handleGpsTrackingForTripStatus(
          newStatus,
          newTripDetail['tripId'].toString(),
        );
      }

      // Check for existing delay report on trip itself
      final String? tripDelayReason = newTripDetail['delayReason'];
      final String? tripDelayStatus = newTripDetail['delayStatus'];
      final String? tripDelayAdminComment =
          newTripDetail['delayAdminComment'];

      final bool hasDelayReport =
          tripDelayReason != null && tripDelayReason.toString().isNotEmpty;

      setState(() {
        _tripDetail = newTripDetail;
        _driverId = _extractDriverId(newTripDetail);
        _previousTripStatus = newStatus;
        _delayReportExist = hasDelayReport;
        _currentDelayReason = tripDelayReason;
        _delayStatus = tripDelayStatus;
        _delayAdminComment = tripDelayAdminComment;
        _isLoading = false;
      });
    } catch (e) {
      // Check if it's an authentication error
      if (e.toString().contains('Authentication failed')) {
        setState(() {
          _error = 'Authentication failed. Please try again.';
          _isLoading = false;
        });
        // Optionally show a dialog and navigate back to login
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            Navigator.of(context).pushReplacementNamed('/login');
          }
        });
      } else {
        setState(() {
          _error = 'Error: $e';
          _isLoading = false;
        });
      }
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

  Color _getAssignmentStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'assigned':
        return Colors.blue.shade700;
      case 'accepted':
        return Colors.green.shade700;
      case 'declined':
        return Colors.red.shade700;
      case 'completed':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  Color _getOrderStatusColor(String? status) {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return Colors.grey;
      case 'ASSIGNED':
        return Colors.blue;
      case 'IN_TRANSIT':
        return Colors.orange;
      case 'DELIVERED':
        return Colors.green;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  bool _areAllOrdersDelivered() {
    if (_tripDetail!['orders'] == null || _tripDetail!['orders'] is! List) {
      return false;
    }
    final orders = _tripDetail!['orders'] as List;
    return orders.every((order) =>
        (order['orderStatus'] ?? order['status'])?.toString().toUpperCase() == 'DELIVERED');
  }

  Widget _buildDetailRow(
    IconData icon,
    String label,
    dynamic value, {
    Color? iconColor,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: iconColor ?? Colors.grey.shade600),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 2),
              Text(
                value?.toString() ?? 'N/A',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showDelayReportDialog() {
    setState(() {
      _isDelayDialogOpen = true;
      // Initialize with existing delay info or default values
      if (_delayReportExist && _currentDelayReason != null) {
        _delayReasonController.text = _currentDelayReason!;
      } else {
        _delayReasonController.clear();
      }
    });

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              title: const Text('Report Trip Delay'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Please provide details about the delay so admin can assist appropriately.',
                      style: TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _delayReasonController,
                      decoration: const InputDecoration(
                        labelText: 'Delay Reason',
                        hintText:
                            'e.g., Traffic congestion expected for about 60 mins, vehicle breakdown, customer unavailable...',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.description),
                      ),
                      maxLines: 3,
                      maxLength: 500,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Include timing information in your description so admin understands the expected delay duration.',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    setState(() {
                      _isDelayDialogOpen = false;
                    });
                  },
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: _isSubmittingDelay
                      ? null
                      : () async {
                          if (_delayReasonController.text.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Please provide a delay reason.'),
                              ),
                            );
                            return;
                          }

                          setStateDialog(() => _isSubmittingDelay = true);
                          setState(() => _isSubmittingDelay = true);

                          try {
                            await driverService.reportTripDelay(
                              _tripDetail!['tripId'],
                              _delayReasonController.text.trim(),
                            ); // No hardcoded minutes - info is in text

                            setStateDialog(() => _isSubmittingDelay = false);
                            setState(() => _isSubmittingDelay = false);

                            Navigator.of(context).pop();
                            setState(() {
                              _isDelayDialogOpen = false;
                            });

                            Navigator.of(context).pop();

                            ScaffoldMessenger.of(context).showSnackBar(
                              !_delayReportExist
                                  ? const SnackBar(
                                      content: Text(
                                        'Delay reported successfully. Admin will review.',
                                      ),
                                    )
                                  : const SnackBar(
                                      content: Text(
                                        'Delay report updated successfully. Admin will review.',
                                      ),
                                    ),
                            );

                            // Refresh trip detail to get updated status from server
                            _fetchTripDetail();
                          } catch (e) {
                            setStateDialog(() => _isSubmittingDelay = false);
                            setState(() => _isSubmittingDelay = false);

                            String errorMessage = e.toString();
                            if (errorMessage.contains(
                              'already has approved SLA extensions',
                            )) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Delay report blocked: This trip already has admin-approved extensions. Please contact admin directly.',
                                  ),
                                  duration: Duration(seconds: 5),
                                ),
                              );
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Failed to report delay: $e'),
                                ),
                              );
                            }
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                  ),
                  child: _isSubmittingDelay
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Report Delay'),
                ),
              ],
            );
          },
        );
      },
    ).then((_) {
      setState(() {
        _isDelayDialogOpen = false;
      });
    });
  }

  Widget _buildFab() {
    String buttonText;
    VoidCallback? action;

    if (_tripDetail!['assignmentStatus'] == 'assigned') {
      if (_hasActiveAssignment == true) {
        buttonText = 'BUSY';
        action = null; // Disabled state
      } else {
        buttonText = 'ACCEPT';
        action = () async {
          setState(() => _isLoading = true);
          try {
            await driverService.acceptTrip(_tripDetail!['tripId']);
            await _fetchTripDetail();
            await _checkForActiveAssignments();
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(const SnackBar(content: Text('Trip accepted.')));
          } catch (e) {
            setState(() => _isLoading = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Failed to accept trip: $e')),
            );
          }
        };
      }
    } else if (_tripDetail!['assignmentStatus'] == 'accepted' &&
        (_tripDetail!['status'] == 'scheduled' || _tripDetail!['status'] == 'assigned')) {
      buttonText = 'START TRIP';
      action = () async {
        setState(() => _isLoading = true);
        try {
          await driverService.updateTripStatus(
            _tripDetail!['tripId'],
            'in_progress',
          );
          await _fetchTripDetail();
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Trip started.')));
        } catch (e) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Failed to start trip: $e')));
        }
      };
    } else if (_tripDetail!['status'] == 'in_progress' && _areAllOrdersDelivered()) {
      buttonText = 'COMPLETE TRIP';
      action = () async {
        final confirmed = await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) =>
                DeliveryConfirmationScreen(tripId: _tripDetail!['tripId']),
          ),
        );
        if (confirmed == true) {
          await _fetchTripDetail();
          await _checkForActiveAssignments(); // Refresh active assignments after delivery
        }
      };
    } else {
      return const SizedBox.shrink();
    }

    return FloatingActionButton.extended(
      onPressed: action,
      backgroundColor: action != null ? Colors.blue : Colors.grey,
      elevation: 6,
      label: Text(
        buttonText,
        style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.2),
      ),
      icon: Icon(action != null ? Icons.play_arrow : Icons.block),
    );
  }

  // Get current/next order for quick access
  Map<String, dynamic>? _getCurrentOrder() {
    if (_tripDetail!['orders'] == null || _tripDetail!['orders'] is! List) {
      return null;
    }
    final orders = _tripDetail!['orders'] as List;
    // Find first order that's not delivered
    for (final order in orders) {
      final status = (order['orderStatus'] ?? order['status'])?.toString().toUpperCase();
      if (status != 'DELIVERED') {
        return order as Map<String, dynamic>;
      }
    }
    return null; // All delivered
  }

  // Get trip progress info
  Map<String, int> _getTripProgress() {
    if (_tripDetail!['orders'] == null || _tripDetail!['orders'] is! List) {
      return {'completed': 0, 'total': 0};
    }
    final orders = _tripDetail!['orders'] as List;
    final completed = orders.where((order) {
      final status = (order['orderStatus'] ?? order['status'])?.toString().toUpperCase();
      return status == 'DELIVERED';
    }).length;
    return {'completed': completed, 'total': orders.length};
  }

  // Show full screen map dialog
  void _showFullScreenMap() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          insetPadding: EdgeInsets.zero,
          child: Scaffold(
            appBar: AppBar(
              title: Row(
                children: [
                  const Icon(Icons.map, color: Colors.green),
                  const SizedBox(width: 8),
                  const Text('Trip Map - Full Screen'),
                  const Spacer(),
                  Text(
                    '${(_tripDetail!['orders'] as List?)?.length ?? 0} stops',
                    style: const TextStyle(fontSize: 14),
                  ),
                ],
              ),
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              elevation: 2,
            ),
            body: Container(
              color: Colors.grey[100],
              child: TripMapView(
                tripDetail: _tripDetail!,
                compact: false, // Use full screen mode
                orders: _tripDetail!['orders'] as List<dynamic>?,
                driverLat: _tripDetail!['driverLat']?.toDouble(),
                driverLng: _tripDetail!['driverLng']?.toDouble(),
              ),
            ),
          ),
        );
      },
    );
  }

  // Show detailed order information dialog
  void _showOrderDetailsDialog(Map<String, dynamic> order, int waypointNumber) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 500, maxHeight: 600),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(12),
                      topRight: Radius.circular(12),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.blue.shade100,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Center(
                          child: Text(
                            'WP$waypointNumber',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.blue.shade800,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Order #${order['orderId']}',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _getOrderStatusColor(order['orderStatus'] ?? order['status']).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                (order['orderStatus'] ?? order['status'] ?? 'N/A').toUpperCase(),
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: _getOrderStatusColor(order['orderStatus'] ?? order['status']),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Content
                Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Priority indicator
                        if (order['priorityLevel'] == 'URGENT') ...[
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.orange.shade50,
                              border: Border.all(color: Colors.orange.shade200),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.warning, color: Colors.orange, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  'URGENT DELIVERY',
                                  style: TextStyle(
                                    color: Colors.orange,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // Order Overview
                        _buildDetailSection(
                          'Order Overview',
                          Icons.assignment,
                          Colors.blue,
                          [
                            _buildDetailRow(Icons.tag, 'Order ID', '#${order['orderId']}'),
                            _buildDetailRow(Icons.priority_high, 'Priority', order['priorityLevel'] ?? 'Normal'),
                            if (order['referenceNumber'] != null)
                              _buildDetailRow(Icons.numbers, 'Reference #', order['referenceNumber']),
                            if (order['trackingNumber'] != null)
                              _buildDetailRow(Icons.local_shipping, 'Tracking #', order['trackingNumber']),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Customer Information
                        _buildDetailSection(
                          'Customer Information',
                          Icons.person,
                          Colors.blue.shade700,
                          [
                            _buildDetailRow(Icons.person, 'Name', order['customerName'] ?? 'N/A'),
                            _buildDetailRow(Icons.phone, 'Phone', order['customerPhone'] ?? 'N/A'),
                            if (order['customerEmail'] != null)
                              _buildDetailRow(Icons.email, 'Email', order['customerEmail']),
                            if (order['customerCompany'] != null)
                              _buildDetailRow(Icons.business, 'Company', order['customerCompany']),
                            if (order['customerType'] != null)
                              _buildDetailRow(Icons.group, 'Customer Type', order['customerType']),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Pickup Information
                        _buildDetailSection(
                          'Pickup Details',
                          Icons.store,
                          Colors.green,
                          [
                            _buildDetailRow(Icons.location_on, 'Address', order['pickupAddress'] ?? 'N/A'),
                            _buildDetailRow(Icons.home_work, 'Pickup Type', order['pickupType'] ?? order['pickupLocationType'] ?? 'Business'),
                            if (order['pickupContactName'] != null)
                              _buildDetailRow(Icons.person, 'Contact Person', order['pickupContactName']),
                            if (order['pickupContactPhone'] != null)
                              _buildDetailRow(Icons.phone, 'Contact Phone', order['pickupContactPhone']),
                            if (order['pickupContactEmail'] != null)
                              _buildDetailRow(Icons.email, 'Contact Email', order['pickupContactEmail']),
                            if (order['pickupInstructions'] != null)
                              _buildDetailRow(Icons.info, 'Pickup Instructions', order['pickupInstructions']),
                            if (order['pickupNotes'] != null)
                              _buildDetailRow(Icons.note, 'Pickup Notes', order['pickupNotes']),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Delivery Information
                        _buildDetailSection(
                          'Delivery Details',
                          Icons.home,
                          Colors.red,
                          [
                            _buildDetailRow(Icons.location_on, 'Address', order['deliveryAddress'] ?? 'N/A'),
                            _buildDetailRow(Icons.apartment, 'Delivery Type', order['deliveryType'] ?? order['deliveryLocationType'] ?? 'Residential'),
                            if (order['deliveryContactName'] != null)
                              _buildDetailRow(Icons.person, 'Contact Person', order['deliveryContactName']),
                            if (order['deliveryContactPhone'] != null)
                              _buildDetailRow(Icons.phone, 'Contact Phone', order['deliveryContactPhone']),
                            if (order['deliveryContactEmail'] != null)
                              _buildDetailRow(Icons.email, 'Contact Email', order['deliveryContactEmail']),
                            if (order['deliveryInstructions'] != null)
                              _buildDetailRow(Icons.info, 'Delivery Instructions', order['deliveryInstructions']),
                            if (order['deliveryNotes'] != null)
                              _buildDetailRow(Icons.note, 'Delivery Notes', order['deliveryNotes']),
                            if (order['signatureRequired'] != null && order['signatureRequired'] == true)
                              _buildDetailRow(Icons.edit, 'Signature Required', 'Yes'),
                            if (order['proofOfDelivery'] != null)
                              _buildDetailRow(Icons.camera_alt, 'Proof of Delivery', order['proofOfDelivery']),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Package Information
                        _buildDetailSection(
                          'Package Information',
                          Icons.inventory_2,
                          Colors.purple,
                          [
                            if (order['packageDetails'] != null)
                              _buildDetailRow(Icons.description, 'Description', order['packageDetails']),
                            if (order['packageType'] != null)
                              _buildDetailRow(Icons.category, 'Package Type', order['packageType']),
                            if (order['packageCategory'] != null)
                              _buildDetailRow(Icons.class_, 'Category', order['packageCategory']),
                            if (order['packageValue'] != null)
                              _buildDetailRow(Icons.monetization_on, 'Declared Value', 'VND ${(order['packageValue'] as num).toInt()}'),
                            if (order['weightTons'] != null)
                              _buildDetailRow(Icons.monitor_weight, 'Weight', '${(order['weightTons'] as num).toStringAsFixed(2)} tons'),
                            if (order['weightKg'] != null)
                              _buildDetailRow(Icons.monitor_weight, 'Weight (kg)', '${order['weightKg']}'),
                            if (order['dimensions'] != null)
                              _buildDetailRow(Icons.aspect_ratio, 'Dimensions', order['dimensions']),
                            if (order['length'] != null && order['width'] != null && order['height'] != null)
                              _buildDetailRow(Icons.aspect_ratio, 'L×W×H', '${order['length']}×${order['width']}×${order['height']} cm'),
                            if (order['quantity'] != null)
                              _buildDetailRow(Icons.format_list_numbered, 'Quantity', '${order['quantity']}'),
                            if (order['fragile'] != null && order['fragile'] == true)
                              _buildDetailRow(Icons.warning, 'Fragile', 'Handle with care'),
                            if (order['specialHandling'] != null)
                              _buildDetailRow(Icons.warning_amber, 'Special Handling', order['specialHandling']),
                            if (order['insuranceRequired'] != null && order['insuranceRequired'] == true)
                              _buildDetailRow(Icons.security, 'Insurance', 'Required'),
                            if (order['temperatureControlled'] != null && order['temperatureControlled'] == true)
                              _buildDetailRow(Icons.ac_unit, 'Temperature Control', 'Required'),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Payment & Billing
                        if (order['codAmount'] != null || order['paymentMethod'] != null || order['billingReference'] != null)
                          _buildDetailSection(
                            'Payment & Billing',
                            Icons.payment,
                            Colors.teal,
                            [
                              if (order['paymentMethod'] != null)
                                _buildDetailRow(Icons.payment, 'Payment Method', order['paymentMethod']),
                              if (order['codAmount'] != null)
                                _buildDetailRow(Icons.monetization_on, 'COD Amount', 'VND ${(order['codAmount'] as num).toInt()}'),
                              if (order['billingReference'] != null)
                                _buildDetailRow(Icons.receipt, 'Billing Reference', order['billingReference']),
                              if (order['invoiceNumber'] != null)
                                _buildDetailRow(Icons.receipt_long, 'Invoice #', order['invoiceNumber']),
                            ],
                          ),

                        if (order['codAmount'] != null || order['paymentMethod'] != null || order['billingReference'] != null)
                          const SizedBox(height: 16),

                        // Timing Information
                        _buildDetailSection(
                          'Timing & Scheduling',
                          Icons.schedule,
                          Colors.orange,
                          [
                            if (order['scheduledPickupTime'] != null)
                              _buildDetailRow(Icons.access_time, 'Scheduled Pickup', order['scheduledPickupTime']),
                            if (order['actualPickupTime'] != null)
                              _buildDetailRow(Icons.access_time_filled, 'Actual Pickup', order['actualPickupTime']),
                            if (order['scheduledDeliveryTime'] != null)
                              _buildDetailRow(Icons.alarm, 'Scheduled Delivery', order['scheduledDeliveryTime']),
                            if (order['estimatedDeliveryTime'] != null)
                              _buildDetailRow(Icons.timer, 'Estimated Delivery', order['estimatedDeliveryTime']),
                            if (order['actualDeliveryTime'] != null)
                              _buildDetailRow(Icons.alarm_on, 'Actual Delivery', order['actualDeliveryTime']),
                            if (order['timeWindow'] != null)
                              _buildDetailRow(Icons.schedule, 'Time Window', order['timeWindow']),
                            if (order['serviceLevel'] != null)
                              _buildDetailRow(Icons.star, 'Service Level', order['serviceLevel']),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Status History (if available)
                        if (order['statusHistory'] != null && (order['statusHistory'] as List).isNotEmpty) ...[
                          _buildDetailSection(
                            'Status History',
                            Icons.history,
                            Colors.grey,
                            (order['statusHistory'] as List).map<Widget>((status) {
                              return _buildDetailRow(
                                Icons.circle,
                                status['timestamp'] ?? 'N/A',
                                status['status'] ?? 'N/A',
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // Notes/Comments (if available)
                        if (order['notes'] != null || order['driverNotes'] != null) ...[
                          _buildDetailSection(
                            'Additional Notes',
                            Icons.note,
                            Colors.teal,
                            [
                              if (order['notes'] != null)
                                _buildDetailRow(Icons.note, 'Order Notes', order['notes']),
                              if (order['driverNotes'] != null)
                                _buildDetailRow(Icons.note, 'Driver Notes', order['driverNotes']),
                            ],
                          ),
                          const SizedBox(height: 16),
                        ],
                      ],
                    ),
                  ),
                ),

                // Actions
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(12),
                      bottomRight: Radius.circular(12),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('Close'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // Helper method to build detail sections
  Widget _buildDetailSection(String title, IconData icon, Color color, List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade200),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(8),
                topRight: Radius.circular(8),
              ),
            ),
            child: Row(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(child: Text(_error!))
          : _tripDetail == null
          ? const Center(child: Text('No trip detail'))
          : Stack(
              children: [
                CustomScrollView(
                  slivers: [
                    // Compact App Bar with Trip Info and Actions
                    SliverAppBar(
                      pinned: true,
                      backgroundColor: Colors.white,
                      elevation: 2,
                      title: Row(
                        children: [
                          Text(
                            '#${_tripDetail!['tripId']}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: _getTripStatusColor(
                                _tripDetail!['status'],
                              ),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _tripDetail!['status']?.toUpperCase() ?? 'N/A',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      leading: IconButton(
                        icon: const Icon(Icons.arrow_back),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                      actions: [
                        // Chat button
                        IconButton(
                          icon: const Icon(Icons.chat_bubble_outline),
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) => DriverChatScreen(
                                  tripId: widget.tripId,
                                  driverId: _driverId,
                                ),
                              ),
                            );
                          },
                          tooltip: 'Chat',
                        ),
                        // Trip action button (ACCEPT/START TRIP/COMPLETE TRIP)
                        Builder(
                          builder: (context) {
                            VoidCallback? onPressed;
                            String buttonText = '';

                            if (_tripDetail!['assignmentStatus'] == 'assigned') {
                              if (_hasActiveAssignment == true) {
                                buttonText = 'BUSY';
                                onPressed = null;
                              } else {
                                buttonText = 'ACCEPT';
                                onPressed = () async {
                                  setState(() => _isLoading = true);
                                  try {
                                    await driverService.acceptTrip(_tripDetail!['tripId']);
                                    await _fetchTripDetail();
                                    await _checkForActiveAssignments();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Trip accepted.'))
                                    );
                                  } catch (e) {
                                    setState(() => _isLoading = false);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('Failed to accept trip: $e')),
                                    );
                                  }
                                };
                              }
                            } else if (_tripDetail!['assignmentStatus'] == 'accepted' &&
                                (_tripDetail!['status'] == 'scheduled' || _tripDetail!['status'] == 'assigned')) {
                              buttonText = 'START';
                              onPressed = () async {
                                setState(() => _isLoading = true);
                                try {
                                  await driverService.updateTripStatus(
                                    _tripDetail!['tripId'],
                                    'in_progress',
                                  );
                                  await _fetchTripDetail();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Trip started.'))
                                  );
                                } catch (e) {
                                  setState(() => _isLoading = false);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Failed to start trip: $e'))
                                  );
                                }
                              };
                            } else if (_tripDetail!['status'] == 'in_progress' && _areAllOrdersDelivered()) {
                              buttonText = 'COMPLETE';
                              onPressed = () async {
                                final confirmed = await Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        DeliveryConfirmationScreen(tripId: _tripDetail!['tripId']),
                                  ),
                                );
                                if (confirmed == true) {
                                  await _fetchTripDetail();
                                  await _checkForActiveAssignments();
                                }
                              };
                            }

                            if (buttonText.isNotEmpty) {
                              return Container(
                                margin: const EdgeInsets.symmetric(vertical: 8),
                                child: ElevatedButton(
                                  onPressed: onPressed,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: onPressed != null ? Colors.blue : Colors.grey,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                  child: Text(buttonText),
                                ),
                              );
                            }
                            return const SizedBox.shrink();
                          },
                        ),
                        // Map toggle button
                        IconButton(
                          icon: const Icon(Icons.map),
                          onPressed: _showFullScreenMap,
                          tooltip: 'View full screen map',
                        ),
                      ],
                    ),

                    SliverToBoxAdapter(
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Assignment Status Banner (if not accepted)
                            if (_tripDetail!['assignmentStatus'] != null &&
                                _tripDetail!['assignmentStatus'] != 'accepted')
                              Container(
                                width: double.infinity,
                                margin: const EdgeInsets.only(bottom: 16),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                                decoration: BoxDecoration(
                                  color: _getAssignmentStatusColor(
                                    _tripDetail!['assignmentStatus'],
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(
                                  child: Text(
                                    'Assignment: ${_tripDetail!['assignmentStatus']?.toUpperCase()}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),

                            // Trip Progress Overview
                            Card(
                              elevation: 2,
                              margin: const EdgeInsets.only(bottom: 16),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        const Text(
                                          'TRIP PROGRESS',
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.blue,
                                          ),
                                        ),
                                        Builder(
                                          builder: (context) {
                                            final progress = _getTripProgress();
                                            return Text(
                                              '${progress['completed']}/${progress['total']} Completed',
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: Colors.grey[600],
                                                fontWeight: FontWeight.w500,
                                              ),
                                            );
                                          },
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    // Progress Bar
                                    Builder(
                                      builder: (context) {
                                        final progress = _getTripProgress();
                                        final completed = progress['completed'] ?? 0;
                                        final total = progress['total'] ?? 0;
                                        final percentage = total > 0
                                            ? completed / total
                                            : 0.0;
                                        return Column(
                                          children: [
                                            LinearProgressIndicator(
                                              value: percentage,
                                              backgroundColor: Colors.grey[300],
                                              valueColor: AlwaysStoppedAnimation<Color>(
                                                percentage == 1.0 ? Colors.green : Colors.blue,
                                              ),
                                            ),
                                            const SizedBox(height: 8),
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Text(
                                                  '${(percentage * 100).round()}% Complete',
                                                  style: const TextStyle(
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                                if (_tripDetail!['routeName'] != null)
                                                  Text(
                                                    _tripDetail!['routeName'],
                                                    style: TextStyle(
                                                      fontSize: 12,
                                                      color: Colors.grey[600],
                                                    ),
                                                  ),
                                              ],
                                            ),
                                          ],
                                        );
                                      },
                                    ),
                                  ],
                                ),
                              ),
                            ),

                            // Current/Next Order - Most Important Section
                            Builder(
                              builder: (context) {
                                final currentOrder = _getCurrentOrder();
                                if (currentOrder != null) {
                                  return Card(
                                    elevation: 3,
                                    margin: const EdgeInsets.only(bottom: 16),
                                    child: Container(
                                      decoration: BoxDecoration(
                                        border: Border.all(
                                          color: Colors.blue.shade200,
                                          width: 2,
                                        ),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Padding(
                                        padding: const EdgeInsets.all(16),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.all(8),
                                                  decoration: BoxDecoration(
                                                    color: Colors.blue.shade50,
                                                    borderRadius: BorderRadius.circular(8),
                                                  ),
                                                  child: const Icon(
                                                    Icons.navigation,
                                                    color: Colors.blue,
                                                    size: 20,
                                                  ),
                                                ),
                                                const SizedBox(width: 12),
                                                const Text(
                                                  'CURRENT DELIVERY',
                                                  style: TextStyle(
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.bold,
                                                    color: Colors.blue,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 12),
                                            Text(
                                              'Order #${currentOrder['orderId']}',
                                              style: const TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            const SizedBox(height: 8),
                                            // Customer Info
                                            Row(
                                              children: [
                                                const Icon(
                                                  Icons.person,
                                                  size: 16,
                                                  color: Colors.grey,
                                                ),
                                                const SizedBox(width: 8),
                                                Expanded(
                                                  child: Text(
                                                    '${currentOrder['customerName'] ?? 'N/A'} • ${currentOrder['customerPhone'] ?? 'No phone'}',
                                                    style: const TextStyle(fontSize: 14),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            // Delivery Address
                                            Row(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                const Icon(
                                                  Icons.location_on,
                                                  color: Colors.red,
                                                  size: 16,
                                                ),
                                                const SizedBox(width: 8),
                                                Expanded(
                                                  child: Text(
                                                    currentOrder['deliveryAddress'] ?? 'N/A',
                                                    style: const TextStyle(fontSize: 14),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            // Package details
                                            if (currentOrder['packageDetails'] != null) ...[
                                              const SizedBox(height: 8),
                                              Row(
                                                children: [
                                                  const Icon(
                                                    Icons.inventory_2,
                                                    size: 16,
                                                    color: Colors.grey,
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Expanded(
                                                    child: Text(
                                                      currentOrder['packageDetails'],
                                                      style: TextStyle(
                                                        fontSize: 13,
                                                        color: Colors.grey[800],
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],

                                            // Pickup Type Information
                                            if (currentOrder['pickupType'] != null && currentOrder['pickupType'].toString().isNotEmpty) ...[
                                              const SizedBox(height: 8),
                                              Container(
                                                padding: const EdgeInsets.all(8),
                                                decoration: BoxDecoration(
                                                  color: Colors.blue[50],
                                                  borderRadius: BorderRadius.circular(6),
                                                  border: Border.all(color: Colors.blue[200]!),
                                                ),
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text(
                                                      'Pickup Type: ${currentOrder['pickupType']}',
                                                      style: const TextStyle(
                                                        fontSize: 12,
                                                        fontWeight: FontWeight.w600,
                                                        color: Colors.blue,
                                                      ),
                                                    ),
                                                    const SizedBox(height: 4),
                                                    // Show specific fields based on pickup type
                                                    if (currentOrder['pickupType'] == 'WAREHOUSE' && currentOrder['warehouseName'] != null) ...[
                                                      Text(
                                                        'Warehouse: ${currentOrder['warehouseName']}',
                                                        style: const TextStyle(
                                                          fontSize: 11,
                                                          color: Colors.blue,
                                                        ),
                                                      ),
                                                    ],
                                                    if (currentOrder['pickupType'] == 'WAREHOUSE' && currentOrder['dockNumber'] != null) ...[
                                                      Text(
                                                        'Dock: ${currentOrder['dockNumber']}',
                                                        style: const TextStyle(
                                                          fontSize: 11,
                                                          color: Colors.blue,
                                                        ),
                                                      ),
                                                    ],
                                                    if (currentOrder['pickupType'] == 'PORT_TERMINAL' && currentOrder['containerNumber'] != null) ...[
                                                      Text(
                                                        'Container: ${currentOrder['containerNumber']}',
                                                        style: const TextStyle(
                                                          fontSize: 11,
                                                          color: Colors.blue,
                                                        ),
                                                      ),
                                                    ],
                                                    if (currentOrder['pickupType'] == 'PORT_TERMINAL' && currentOrder['terminalName'] != null) ...[
                                                      Text(
                                                        'Terminal: ${currentOrder['terminalName']}',
                                                        style: const TextStyle(
                                                          fontSize: 11,
                                                          color: Colors.blue,
                                                        ),
                                                      ),
                                                    ],
                                                  ],
                                                ),
                                              ),
                                            ],
                                            // Priority indicator
                                            if (currentOrder['priorityLevel'] == 'URGENT') ...[
                                              const SizedBox(height: 8),
                                              Container(
                                                padding: const EdgeInsets.symmetric(
                                                  horizontal: 8,
                                                  vertical: 4,
                                                ),
                                                decoration: BoxDecoration(
                                                  color: Colors.orange.shade50,
                                                  border: Border.all(
                                                    color: Colors.orange.shade200,
                                                  ),
                                                  borderRadius: BorderRadius.circular(4),
                                                ),
                                                child: const Row(
                                                  mainAxisAlignment: MainAxisAlignment.center,
                                                  children: [
                                                    Icon(
                                                      Icons.warning,
                                                      color: Colors.orange,
                                                      size: 14,
                                                    ),
                                                    SizedBox(width: 4),
                                                    Text(
                                                      'URGENT DELIVERY',
                                                      style: TextStyle(
                                                        color: Colors.orange,
                                                        fontWeight: FontWeight.bold,
                                                        fontSize: 12,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                            // Action buttons
                                            if (_tripDetail!['status'] == 'in_progress' ||
                                                _tripDetail!['status'] == 'arrived') ...[
                                              const SizedBox(height: 16),
                                              Row(
                                                children: [
                                                  if (currentOrder['orderStatus'] == 'ASSIGNED') ...[
                                                    Expanded(
                                                      child: ElevatedButton.icon(
                                                        onPressed: () async {
                                                          setState(() => _isLoading = true);
                                                          try {
                                                            await driverService.updateOrderStatus(
                                                              _tripDetail!['tripId'],
                                                              currentOrder['orderId'],
                                                              'IN_TRANSIT',
                                                            );
                                                            await _fetchTripDetail();
                                                            ScaffoldMessenger.of(context).showSnackBar(
                                                              const SnackBar(content: Text('Order marked as In Transit')),
                                                            );
                                                          } catch (e) {
                                                            ScaffoldMessenger.of(context).showSnackBar(
                                                              SnackBar(content: Text('Failed to update order: $e')),
                                                            );
                                                          } finally {
                                                            setState(() => _isLoading = false);
                                                          }
                                                        },
                                                        icon: const Icon(Icons.local_shipping, size: 16),
                                                        label: const Text('START DELIVERY'),
                                                        style: ElevatedButton.styleFrom(
                                                          backgroundColor: Colors.blue,
                                                          foregroundColor: Colors.white,
                                                          padding: const EdgeInsets.symmetric(vertical: 12),
                                                        ),
                                                      ),
                                                    ),
                                                  ] else if (currentOrder['orderStatus'] == 'IN_TRANSIT') ...[
                                                    Expanded(
                                                      child: ElevatedButton.icon(
                                                        onPressed: () async {
                                                          setState(() => _isLoading = true);
                                                          try {
                                                            await driverService.updateOrderStatus(
                                                              _tripDetail!['tripId'],
                                                              currentOrder['orderId'],
                                                              'DELIVERED',
                                                            );
                                                            await _fetchTripDetail();
                                                            ScaffoldMessenger.of(context).showSnackBar(
                                                              const SnackBar(content: Text('Order marked as Delivered')),
                                                            );
                                                          } catch (e) {
                                                            ScaffoldMessenger.of(context).showSnackBar(
                                                              SnackBar(content: Text('Failed to update order: $e')),
                                                            );
                                                          } finally {
                                                            setState(() => _isLoading = false);
                                                          }
                                                        },
                                                        icon: const Icon(Icons.check_circle, size: 16),
                                                        label: const Text('MARK DELIVERED'),
                                                        style: ElevatedButton.styleFrom(
                                                          backgroundColor: Colors.green,
                                                          foregroundColor: Colors.white,
                                                          padding: const EdgeInsets.symmetric(vertical: 12),
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ],
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                    ),
                                  );
                                }
                                return const SizedBox.shrink();
                              },
                            ),

                            // Combined Map & Route Overview
                            Card(
                              elevation: 2,
                              margin: const EdgeInsets.only(bottom: 16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Header
                                  Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Row(
                                      children: [
                                        const Icon(
                                          Icons.map,
                                          color: Colors.green,
                                          size: 20,
                                        ),
                                        const SizedBox(width: 8),
                                        const Text(
                                          'TRIP OVERVIEW',
                                          style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.green,
                                          ),
                                        ),
                                        const Spacer(),
                                        Text(
                                          '${(_tripDetail!['orders'] as List?)?.length ?? 0} stops',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),

                                  // Map Section
                                  GestureDetector(
                                    onTap: () => _showFullScreenMap(),
                                    child: Container(
                                      height: 220,
                                      color: Colors.grey[100],
                                      child: Stack(
                                        children: [
                                          TripMapView(
                                            tripDetail: _tripDetail!,
                                            compact: true,
                                            orders: _tripDetail!['orders'] as List<dynamic>?,
                                            driverLat: _tripDetail!['driverLat']?.toDouble(),
                                            driverLng: _tripDetail!['driverLng']?.toDouble(),
                                          ),
                                          Positioned(
                                            bottom: 8,
                                            right: 8,
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: Colors.black.withOpacity(0.7),
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              child: const Row(
                                                children: [
                                                  Icon(
                                                    Icons.fullscreen,
                                                    size: 14,
                                                    color: Colors.white,
                                                  ),
                                                  SizedBox(width: 4),
                                                  Text(
                                                    'Tap to expand',
                                                    style: TextStyle(
                                                      fontSize: 10,
                                                      color: Colors.white,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),

                                  const Divider(height: 1),

                                  // Compact Route Sequence
                                  Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          'Route Sequence',
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.blue,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Builder(
                                          builder: (context) {
                                            final orders = _tripDetail!['orders'] as List;
                                            final List<Widget> routeSteps = [];

                                            for (int i = 0; i < orders.length; i++) {
                                              final order = orders[i] as Map<String, dynamic>;
                                              final orderStatus = (order['orderStatus'] ?? order['status'])?.toString().toUpperCase();
                                              final isCompleted = orderStatus == 'DELIVERED';

                                              // Pickup step with address
                                              routeSteps.add(
                                                InkWell(
                                                  onTap: () => _showOrderDetailsDialog(order, i + 1),
                                                  child: Container(
                                                    margin: const EdgeInsets.only(bottom: 4),
                                                    padding: const EdgeInsets.all(12),
                                                    decoration: BoxDecoration(
                                                      color: isCompleted ? Colors.grey.shade100 : Colors.green.shade50,
                                                      borderRadius: BorderRadius.circular(12),
                                                      border: Border.all(
                                                        color: isCompleted ? Colors.grey.shade300 : Colors.green.shade200,
                                                      ),
                                                    ),
                                                    child: Row(
                                                      children: [
                                                        Container(
                                                          width: 32,
                                                          height: 32,
                                                          decoration: BoxDecoration(
                                                            color: isCompleted ? Colors.grey : Colors.green,
                                                            shape: BoxShape.circle,
                                                          ),
                                                          child: Center(
                                                            child: Text(
                                                              '${i + 1}P',
                                                              style: const TextStyle(
                                                                color: Colors.white,
                                                                fontSize: 10,
                                                                fontWeight: FontWeight.bold,
                                                              ),
                                                            ),
                                                          ),
                                                        ),
                                                        const SizedBox(width: 12),
                                                        Expanded(
                                                          child: Column(
                                                            crossAxisAlignment: CrossAxisAlignment.start,
                                                            children: [
                                                              Row(
                                                                children: [
                                                                  Text(
                                                                    'Order ${i + 1} Pickup',
                                                                    style: TextStyle(
                                                                      fontSize: 12,
                                                                      fontWeight: FontWeight.w600,
                                                                      color: isCompleted ? Colors.grey.shade700 : Colors.green.shade800,
                                                                    ),
                                                                  ),
                                                                  if (isCompleted) ...[
                                                                    const SizedBox(width: 6),
                                                                    Icon(
                                                                      Icons.check_circle,
                                                                      size: 12,
                                                                      color: Colors.green.shade600,
                                                                    ),
                                                                  ],
                                                                ],
                                                              ),
                                                              const SizedBox(height: 2),
                                                              Text(
                                                                order['pickupAddress'] ?? 'N/A',
                                                                style: TextStyle(
                                                                  fontSize: 11,
                                                                  color: isCompleted ? Colors.grey.shade600 : Colors.black87,
                                                                ),
                                                                maxLines: 2,
                                                                overflow: TextOverflow.ellipsis,
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                        Icon(
                                                          Icons.chevron_right,
                                                          size: 16,
                                                          color: Colors.grey[400],
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                              );

                                              // Arrow to delivery
                                              routeSteps.add(
                                                Container(
                                                  margin: const EdgeInsets.symmetric(vertical: 4),
                                                  child: Row(
                                                    mainAxisAlignment: MainAxisAlignment.center,
                                                    children: [
                                                      Icon(
                                                        Icons.arrow_downward,
                                                        color: Colors.blue.shade400,
                                                        size: 16,
                                                      ),
                                                      const SizedBox(width: 8),
                                                      Text(
                                                        'Deliver',
                                                        style: TextStyle(
                                                          color: Colors.blue.shade600,
                                                          fontSize: 11,
                                                          fontWeight: FontWeight.w500,
                                                        ),
                                                      ),
                                                      const SizedBox(width: 8),
                                                      Icon(
                                                        Icons.arrow_downward,
                                                        color: Colors.blue.shade400,
                                                        size: 16,
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              );

                                              // Delivery step with address
                                              routeSteps.add(
                                                InkWell(
                                                  onTap: () => _showOrderDetailsDialog(order, i + 1),
                                                  child: Container(
                                                    margin: const EdgeInsets.only(bottom: 12),
                                                    padding: const EdgeInsets.all(12),
                                                    decoration: BoxDecoration(
                                                      color: isCompleted ? Colors.grey.shade100 : Colors.red.shade50,
                                                      borderRadius: BorderRadius.circular(12),
                                                      border: Border.all(
                                                        color: isCompleted ? Colors.grey.shade300 : Colors.red.shade200,
                                                      ),
                                                    ),
                                                    child: Row(
                                                      children: [
                                                        Container(
                                                          width: 32,
                                                          height: 32,
                                                          decoration: BoxDecoration(
                                                            color: isCompleted ? Colors.grey : Colors.red,
                                                            shape: BoxShape.circle,
                                                          ),
                                                          child: Center(
                                                            child: Text(
                                                              '${i + 1}D',
                                                              style: const TextStyle(
                                                                color: Colors.white,
                                                                fontSize: 10,
                                                                fontWeight: FontWeight.bold,
                                                              ),
                                                            ),
                                                          ),
                                                        ),
                                                        const SizedBox(width: 12),
                                                        Expanded(
                                                          child: Column(
                                                            crossAxisAlignment: CrossAxisAlignment.start,
                                                            children: [
                                                              Row(
                                                                children: [
                                                                  Text(
                                                                    'Order ${i + 1} Delivery',
                                                                    style: TextStyle(
                                                                      fontSize: 12,
                                                                      fontWeight: FontWeight.w600,
                                                                      color: isCompleted ? Colors.grey.shade700 : Colors.red.shade800,
                                                                    ),
                                                                  ),
                                                                  if (isCompleted) ...[
                                                                    const SizedBox(width: 6),
                                                                    Icon(
                                                                      Icons.check_circle,
                                                                      size: 12,
                                                                      color: Colors.green.shade600,
                                                                    ),
                                                                  ],
                                                                ],
                                                              ),
                                                              const SizedBox(height: 2),
                                                              Text(
                                                                order['deliveryAddress'] ?? 'N/A',
                                                                style: TextStyle(
                                                                  fontSize: 11,
                                                                  color: isCompleted ? Colors.grey.shade600 : Colors.black87,
                                                                ),
                                                                maxLines: 2,
                                                                overflow: TextOverflow.ellipsis,
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                        Icon(
                                                          Icons.chevron_right,
                                                          size: 16,
                                                          color: Colors.grey[400],
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                              );

                                              // Separator for next order
                                              if (i < orders.length - 1) {
                                                routeSteps.add(
                                                  Container(
                                                    margin: const EdgeInsets.symmetric(vertical: 8),
                                                    child: Row(
                                                      children: [
                                                        Expanded(
                                                          child: Container(
                                                            height: 1,
                                                            color: Colors.grey.shade300,
                                                          ),
                                                        ),
                                                        const SizedBox(width: 8),
                                                        Text(
                                                          'Next Order',
                                                          style: TextStyle(
                                                            fontSize: 10,
                                                            color: Colors.grey.shade500,
                                                            fontWeight: FontWeight.w500,
                                                          ),
                                                        ),
                                                        const SizedBox(width: 8),
                                                        Expanded(
                                                          child: Container(
                                                            height: 1,
                                                            color: Colors.grey.shade300,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                );
                                              }
                                            }

                                            return Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: routeSteps,
                                            );
                                          },
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // Trip Details Summary
                            Card(
                              elevation: 2,
                              margin: const EdgeInsets.only(bottom: 16),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'TRIP INFO',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.blue,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: _buildDetailRow(
                                            Icons.category,
                                            'Type',
                                            _tripDetail!['tripType'] ?? 'N/A',
                                          ),
                                        ),
                                        Expanded(
                                          child: _buildDetailRow(
                                            Icons.access_time,
                                            'Departure',
                                            _tripDetail!['scheduledDeparture'] ?? 'N/A',
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        if (_tripDetail!['vehiclePlate'] != null)
                                          Expanded(
                                            child: _buildDetailRow(
                                              Icons.local_shipping,
                                              'Vehicle',
                                              _tripDetail!['vehiclePlate'],
                                            ),
                                          ),
                                        Expanded(
                                          child: _buildDetailRow(
                                            Icons.alarm,
                                            'Arrival',
                                            _tripDetail!['scheduledArrival'] ?? 'N/A',
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),

                            // Delay Reporting - Compact
                            if ((_tripDetail!['status'] == 'in_progress' ||
                                    _tripDetail!['status'] == 'scheduled' ||
                                    _tripDetail!['status'] == 'arrived') &&
                                _tripDetail!['assignmentStatus'] == 'accepted')
                              Card(
                                elevation: 2,
                                margin: const EdgeInsets.only(bottom: 16),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(
                                            Icons.warning_amber,
                                            color: Colors.orange,
                                            size: 20,
                                          ),
                                          const SizedBox(width: 8),
                                          const Text(
                                            'DELAY REPORTING',
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.orange,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),

                                      // Show current delay report if it exists
                                      if (_delayReportExist && _currentDelayReason != null) ...[
                                        Container(
                                          padding: const EdgeInsets.all(12),
                                          decoration: BoxDecoration(
                                            color: Colors.amber.shade50,
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: Colors.amber.shade200),
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  Text(
                                                    'Status: ${(_delayStatus ?? 'PENDING').toUpperCase()}',
                                                    style: const TextStyle(
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.bold,
                                                      color: Colors.orange,
                                                    ),
                                                  ),
                                                  if (_tripDetail!['slaExtensionMinutes'] != null &&
                                                      _tripDetail!['slaExtensionMinutes'] > 0)
                                                    Container(
                                                      margin: const EdgeInsets.only(left: 8),
                                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                      decoration: BoxDecoration(
                                                        color: Colors.green.shade100,
                                                        borderRadius: BorderRadius.circular(8),
                                                      ),
                                                      child: Text(
                                                        '+${_tripDetail!['slaExtensionMinutes']}min',
                                                        style: const TextStyle(
                                                          fontSize: 10,
                                                          color: Colors.green,
                                                          fontWeight: FontWeight.bold,
                                                        ),
                                                      ),
                                                    ),
                                                ],
                                              ),
                                              const SizedBox(height: 8),
                                              Text(
                                                _currentDelayReason!,
                                                style: const TextStyle(fontSize: 13),
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(height: 12),
                                        if (_tripDetail!['slaExtensionMinutes'] == null ||
                                            _tripDetail!['slaExtensionMinutes'] == 0)
                                          SizedBox(
                                            width: double.infinity,
                                            child: ElevatedButton.icon(
                                              onPressed: _delayStatus == 'APPROVED'
                                                  ? null
                                                  : _showDelayReportDialog,
                                              icon: const Icon(Icons.edit, size: 16),
                                              label: const Text('UPDATE DELAY'),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: Colors.grey,
                                                foregroundColor: Colors.white,
                                                padding: const EdgeInsets.symmetric(vertical: 10),
                                              ),
                                            ),
                                          ),
                                      ] else ...[
                                        const Text(
                                          'Report delays to admin team',
                                          style: TextStyle(fontSize: 12, color: Colors.grey),
                                        ),
                                        const SizedBox(height: 8),
                                        SizedBox(
                                          width: double.infinity,
                                          child: ElevatedButton.icon(
                                            onPressed: _showDelayReportDialog,
                                            icon: const Icon(Icons.report_problem, size: 16),
                                            label: const Text('REPORT DELAY'),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: Colors.orange,
                                              foregroundColor: Colors.white,
                                              padding: const EdgeInsets.symmetric(vertical: 10),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ),



                            // All Orders List - Compact Summary
                            if (_tripDetail!['orders'] != null &&
                                _tripDetail!['orders'] is List &&
                                _tripDetail!['orders'].isNotEmpty)
                              Card(
                                elevation: 2,
                                margin: const EdgeInsets.only(bottom: 80),
                                child: Theme(
                                  data: Theme.of(context).copyWith(
                                    dividerColor: Colors.transparent,
                                  ),
                                  child: ExpansionTile(
                                    initiallyExpanded: false,
                                    title: Row(
                                      children: [
                                        const Icon(
                                          Icons.list_alt,
                                          color: Colors.orange,
                                          size: 20,
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          'ORDER SUMMARY (${(_tripDetail!['orders'] as List).length})',
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.orange,
                                          ),
                                        ),
                                      ],
                                    ),
                                    children: [
                                      const Divider(height: 1),
                                      ...(_tripDetail!['orders'] as List).map(
                                        (order) {
                                          final orderIndex = (_tripDetail!['orders'] as List).indexOf(order) + 1;
                                          return InkWell(
                                            onTap: () => _showOrderDetailsDialog(order, orderIndex),
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(
                                                horizontal: 16,
                                                vertical: 12,
                                              ),
                                              decoration: BoxDecoration(
                                                border: Border(
                                                  bottom: BorderSide(
                                                    color: Colors.grey.shade100,
                                                    width: 1,
                                                  ),
                                                ),
                                              ),
                                              child: Row(
                                                children: [
                                                  // Waypoint number
                                                  Container(
                                                    width: 32,
                                                    height: 32,
                                                    decoration: BoxDecoration(
                                                      color: Colors.blue.shade100,
                                                      borderRadius: BorderRadius.circular(16),
                                                    ),
                                                    child: Center(
                                                      child: Text(
                                                        'WP${orderIndex}',
                                                        style: TextStyle(
                                                          fontSize: 10,
                                                          color: Colors.blue.shade800,
                                                          fontWeight: FontWeight.bold,
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                                  const SizedBox(width: 12),
                                                  // Status indicator
                                                  Container(
                                                    width: 12,
                                                    height: 12,
                                                    decoration: BoxDecoration(
                                                      color: _getOrderStatusColor(
                                                        order['orderStatus'] ?? order['status'],
                                                      ),
                                                      shape: BoxShape.circle,
                                                    ),
                                                  ),
                                                  const SizedBox(width: 12),
                                                  // Order info
                                                  Expanded(
                                                    child: Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [
                                                        Row(
                                                          children: [
                                                            Text(
                                                              'Order #${order['orderId']}',
                                                              style: const TextStyle(
                                                                fontSize: 14,
                                                                fontWeight: FontWeight.w600,
                                                              ),
                                                            ),
                                                            if (order['priorityLevel'] == 'URGENT') ...[
                                                              const SizedBox(width: 6),
                                                              Container(
                                                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                                                decoration: BoxDecoration(
                                                                  color: Colors.orange.shade100,
                                                                  borderRadius: BorderRadius.circular(4),
                                                                ),
                                                                child: const Text(
                                                                  'URGENT',
                                                                  style: TextStyle(
                                                                    fontSize: 8,
                                                                    color: Colors.orange,
                                                                    fontWeight: FontWeight.bold,
                                                                  ),
                                                                ),
                                                              ),
                                                            ],
                                                          ],
                                                        ),
                                                        const SizedBox(height: 4),
                                                        Text(
                                                          '${order['customerName'] ?? 'N/A'} • ${order['customerPhone'] ?? 'No phone'}',
                                                          style: TextStyle(
                                                            fontSize: 12,
                                                            color: Colors.grey[700],
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                  const SizedBox(width: 8),
                                                  // Status text + tap indicator
                                                  Row(
                                                    children: [
                                                      Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                        decoration: BoxDecoration(
                                                          color: _getOrderStatusColor(
                                                            order['orderStatus'] ?? order['status'],
                                                          ).withOpacity(0.1),
                                                          borderRadius: BorderRadius.circular(12),
                                                        ),
                                                        child: Text(
                                                          (order['orderStatus'] ?? order['status'] ?? 'N/A').toUpperCase(),
                                                          style: TextStyle(
                                                            fontSize: 10,
                                                            fontWeight: FontWeight.bold,
                                                            color: _getOrderStatusColor(
                                                              order['orderStatus'] ?? order['status'],
                                                            ),
                                                          ),
                                                        ),
                                                      ),
                                                      const SizedBox(width: 8),
                                                      Icon(
                                                        Icons.chevron_right,
                                                        size: 16,
                                                        color: Colors.grey[400],
                                                      ),
                                                    ],
                                                  ),
                                                ],
                                              ),
                                            ),
                                          );
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
      floatingActionButton: null,
    );
  }
}
