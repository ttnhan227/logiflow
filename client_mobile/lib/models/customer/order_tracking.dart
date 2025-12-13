import 'package:equatable/equatable.dart';

class TrackOrderResponse extends Equatable {
  final int orderId;
  final String orderStatus;
  final String? tripStatus;
  final DateTime? estimatedPickupTime;
  final DateTime? estimatedDeliveryTime;
  final DateTime? actualPickupTime;
  final DateTime? actualDeliveryTime;
  final double? currentLat;
  final double? currentLng;
  final String? driverName;
  final String? driverPhone;
  final String? vehiclePlate;
  final String? vehicleType;
  final List<StatusUpdate> statusHistory;

  const TrackOrderResponse({
    required this.orderId,
    required this.orderStatus,
    this.tripStatus,
    this.estimatedPickupTime,
    this.estimatedDeliveryTime,
    this.actualPickupTime,
    this.actualDeliveryTime,
    this.currentLat,
    this.currentLng,
    this.driverName,
    this.driverPhone,
    this.vehiclePlate,
    this.vehicleType,
    required this.statusHistory,
  });

  factory TrackOrderResponse.fromJson(Map<String, dynamic> json) {
    return TrackOrderResponse(
      orderId: json['orderId'] ?? 0,
      orderStatus: json['orderStatus'] ?? 'UNKNOWN',
      tripStatus: json['tripStatus'],
      estimatedPickupTime: json['estimatedPickupTime'] != null ? DateTime.parse(json['estimatedPickupTime']) : null,
      estimatedDeliveryTime: json['estimatedDeliveryTime'] != null ? DateTime.parse(json['estimatedDeliveryTime']) : null,
      actualPickupTime: json['actualPickupTime'] != null ? DateTime.parse(json['actualPickupTime']) : null,
      actualDeliveryTime: json['actualDeliveryTime'] != null ? DateTime.parse(json['actualDeliveryTime']) : null,
      currentLat: json['currentLat']?.toDouble(),
      currentLng: json['currentLng']?.toDouble(),
      driverName: json['driverName'],
      driverPhone: json['driverPhone'],
      vehiclePlate: json['vehiclePlate'],
      vehicleType: json['vehicleType'],
      statusHistory: (json['statusHistory'] as List<dynamic>?)
          ?.map((e) => StatusUpdate.fromJson(e as Map<String, dynamic>))
          .where((update) => update.status != null && update.status.isNotEmpty)
          .toList() ?? [],
    );
  }

  @override
  List<Object?> get props => [
    orderId,
    orderStatus,
    tripStatus,
    estimatedPickupTime,
    estimatedDeliveryTime,
    actualPickupTime,
    actualDeliveryTime,
    currentLat,
    currentLng,
    driverName,
    driverPhone,
    vehiclePlate,
    vehicleType,
    statusHistory,
  ];
}

class StatusUpdate extends Equatable {
  final String status;
  final DateTime timestamp;
  final String? notes;

  const StatusUpdate({
    required this.status,
    required this.timestamp,
    this.notes,
  });

  factory StatusUpdate.fromJson(Map<String, dynamic> json) {
    return StatusUpdate(
      status: json['status'] ?? 'UNKNOWN',
      timestamp: json['timestamp'] != null ? DateTime.parse(json['timestamp']) : DateTime.now(),
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'status': status,
      'timestamp': timestamp.toIso8601String(),
      'notes': notes,
    };
  }

  @override
  List<Object?> get props => [status, timestamp, notes];
}
