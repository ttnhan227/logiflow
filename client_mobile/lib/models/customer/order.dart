import 'package:equatable/equatable.dart';

class Order extends Equatable {
  final int? orderId;
  final int? tripId;
  final String? customerName;
  final String? customerPhone;
  final String? pickupAddress;
  final String? deliveryAddress;
  final String? packageDetails;
  final double? weightKg;
  final double? packageValue;
  final double? distanceKm;
  final String? priorityLevel;
  final String? orderStatus;
  final String? tripStatus;
  final DateTime? createdAt;
  final DateTime? estimatedPickupTime;
  final DateTime? estimatedDeliveryTime;
  final DateTime? actualPickupTime;
  final DateTime? actualDeliveryTime;
  final String? driverName;
  final String? driverPhone;
  final String? vehiclePlate;
  final double? deliveryFee;

  const Order({
    this.orderId,
    this.tripId,
    this.customerName,
    this.customerPhone,
    this.pickupAddress,
    this.deliveryAddress,
    this.packageDetails,
    this.weightKg,
    this.packageValue,
    this.distanceKm,
    this.priorityLevel,
    this.orderStatus,
    this.tripStatus,
    this.createdAt,
    this.estimatedPickupTime,
    this.estimatedDeliveryTime,
    this.actualPickupTime,
    this.actualDeliveryTime,
    this.driverName,
    this.driverPhone,
    this.vehiclePlate,
    this.deliveryFee,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      orderId: json['orderId'],
      tripId: json['tripId'],
      customerName: json['customerName'],
      customerPhone: json['customerPhone'],
      pickupAddress: json['pickupAddress'],
      deliveryAddress: json['deliveryAddress'],
      packageDetails: json['packageDetails'],
      weightKg: json['weightKg']?.toDouble(),
      packageValue: json['packageValue']?.toDouble(),
      distanceKm: json['distanceKm']?.toDouble(),
      priorityLevel: json['priorityLevel'],
      orderStatus: json['orderStatus'],
      tripStatus: json['tripStatus'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      estimatedPickupTime: json['estimatedPickupTime'] != null ? DateTime.parse(json['estimatedPickupTime']) : null,
      estimatedDeliveryTime: json['estimatedDeliveryTime'] != null ? DateTime.parse(json['estimatedDeliveryTime']) : null,
      actualPickupTime: json['actualPickupTime'] != null ? DateTime.parse(json['actualPickupTime']) : null,
      actualDeliveryTime: json['actualDeliveryTime'] != null ? DateTime.parse(json['actualDeliveryTime']) : null,
      driverName: json['driverName'],
      driverPhone: json['driverPhone'],
      vehiclePlate: json['vehiclePlate'],
      deliveryFee: json['deliveryFee']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'orderId': orderId,
      'tripId': tripId,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'pickupAddress': pickupAddress,
      'deliveryAddress': deliveryAddress,
      'packageDetails': packageDetails,
      'weightKg': weightKg,
      'packageValue': packageValue,
      'distanceKm': distanceKm,
      'priorityLevel': priorityLevel,
      'orderStatus': orderStatus,
      'tripStatus': tripStatus,
      'createdAt': createdAt?.toIso8601String(),
      'estimatedPickupTime': estimatedPickupTime?.toIso8601String(),
      'estimatedDeliveryTime': estimatedDeliveryTime?.toIso8601String(),
      'actualPickupTime': actualPickupTime?.toIso8601String(),
      'actualDeliveryTime': actualDeliveryTime?.toIso8601String(),
      'driverName': driverName,
      'driverPhone': driverPhone,
      'vehiclePlate': vehiclePlate,
      'deliveryFee': deliveryFee,
    };
  }

  @override
  List<Object?> get props => [
    orderId,
    tripId,
    customerName,
    customerPhone,
    pickupAddress,
    deliveryAddress,
    packageDetails,
    weightKg,
    packageValue,
    distanceKm,
    priorityLevel,
    orderStatus,
    tripStatus,
    createdAt,
    estimatedPickupTime,
    estimatedDeliveryTime,
    actualPickupTime,
    actualDeliveryTime,
    driverName,
    driverPhone,
    vehiclePlate,
    deliveryFee,
  ];
}

class CreateOrderRequest extends Equatable {
  final String customerName;
  final String? customerPhone;
  final String pickupAddress;
  final String deliveryAddress;
  final String? packageDetails;
  final double? pickupLat;
  final double? pickupLng;
  final double? deliveryLat;
  final double? deliveryLng;
  final String? priority; // "NORMAL" or "URGENT"

  const CreateOrderRequest({
    required this.customerName,
    this.customerPhone,
    required this.pickupAddress,
    required this.deliveryAddress,
    this.packageDetails,
    this.pickupLat,
    this.pickupLng,
    this.deliveryLat,
    this.deliveryLng,
    this.priority = "NORMAL",
  });

  Map<String, dynamic> toJson() {
    return {
      'customerName': customerName,
      'customerPhone': customerPhone,
      'pickupAddress': pickupAddress,
      'deliveryAddress': deliveryAddress,
      'packageDetails': packageDetails,
      'pickupLat': pickupLat,
      'pickupLng': pickupLng,
      'deliveryLat': deliveryLat,
      'deliveryLng': deliveryLng,
      'priority': priority,
    };
  }

  @override
  List<Object?> get props => [
    customerName,
    customerPhone,
    pickupAddress,
    deliveryAddress,
    packageDetails,
    pickupLat,
    pickupLng,
    deliveryLat,
    deliveryLng,
    priority,
  ];
}

class OrderSummary extends Equatable {
  final int orderId;
  final String pickupAddress;
  final String deliveryAddress;
  final String? packageDetails;
  final double? weightKg;
  final double? packageValue;
  final double? distanceKm;
  final String orderStatus;
  final String? tripStatus;
  final DateTime createdAt;
  final DateTime? estimatedDeliveryTime;
  final double deliveryFee;

  const OrderSummary({
    required this.orderId,
    required this.pickupAddress,
    required this.deliveryAddress,
    this.packageDetails,
    this.weightKg,
    this.packageValue,
    this.distanceKm,
    required this.orderStatus,
    this.tripStatus,
    required this.createdAt,
    this.estimatedDeliveryTime,
    required this.deliveryFee,
  });

  factory OrderSummary.fromJson(Map<String, dynamic> json) {
    return OrderSummary(
      orderId: json['orderId'],
      pickupAddress: json['pickupAddress'],
      deliveryAddress: json['deliveryAddress'],
      packageDetails: json['packageDetails'],
      weightKg: json['weightKg']?.toDouble(),
      packageValue: json['packageValue']?.toDouble(),
      distanceKm: json['distanceKm']?.toDouble(),
      orderStatus: json['orderStatus'],
      tripStatus: json['tripStatus'],
      createdAt: DateTime.parse(json['createdAt']),
      estimatedDeliveryTime: json['estimatedDeliveryTime'] != null ? DateTime.parse(json['estimatedDeliveryTime']) : null,
      deliveryFee: json['deliveryFee']?.toDouble() ?? 0.0,
    );
  }

  @override
  List<Object?> get props => [
    orderId,
    pickupAddress,
    deliveryAddress,
    packageDetails,
    weightKg,
    packageValue,
    distanceKm,
    orderStatus,
    tripStatus,
    createdAt,
    estimatedDeliveryTime,
    deliveryFee,
  ];
}
