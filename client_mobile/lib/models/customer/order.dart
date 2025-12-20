import 'package:equatable/equatable.dart';

class Order extends Equatable {
  final int? orderId;
  final int? tripId;
  final String? customerName;
  final String? customerPhone;
  final String? pickupAddress;
  final String? pickupType;
  final String? containerNumber;
  final String? terminalName;
  final String? warehouseName;
  final String? dockNumber;
  final String? deliveryAddress;
  final String? packageDetails;
  final double? weightTons;
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

  const Order({
    this.orderId,
    this.tripId,
    this.customerName,
    this.customerPhone,
    this.pickupAddress,
    this.pickupType,
    this.containerNumber,
    this.terminalName,
    this.warehouseName,
    this.dockNumber,
    this.deliveryAddress,
    this.packageDetails,
    this.weightTons,
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
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      orderId: json['orderId'],
      tripId: json['tripId'],
      customerName: json['customerName'],
      customerPhone: json['customerPhone'],
      pickupAddress: json['pickupAddress'],
      pickupType: json['pickupType'],
      containerNumber: json['containerNumber'],
      terminalName: json['terminalName'],
      warehouseName: json['warehouseName'],
      dockNumber: json['dockNumber'],
      deliveryAddress: json['deliveryAddress'],
      packageDetails: json['packageDetails'],
      weightTons: json['weightTons']?.toDouble(),
      packageValue: json['packageValue']?.toDouble(),
      distanceKm: json['distanceKm']?.toDouble(),
      priorityLevel: json['priorityLevel'],
      orderStatus: json['orderStatus'],
      tripStatus: json['tripStatus'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      estimatedPickupTime: json['estimatedPickupTime'] != null
          ? DateTime.parse(json['estimatedPickupTime'])
          : null,
      estimatedDeliveryTime: json['estimatedDeliveryTime'] != null
          ? DateTime.parse(json['estimatedDeliveryTime'])
          : null,
      actualPickupTime: json['actualPickupTime'] != null
          ? DateTime.parse(json['actualPickupTime'])
          : null,
      actualDeliveryTime: json['actualDeliveryTime'] != null
          ? DateTime.parse(json['actualDeliveryTime'])
          : null,
      driverName: json['driverName'],
      driverPhone: json['driverPhone'],
      vehiclePlate: json['vehiclePlate'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'orderId': orderId,
      'tripId': tripId,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'pickupAddress': pickupAddress,
      'pickupType': pickupType,
      'containerNumber': containerNumber,
      'terminalName': terminalName,
      'warehouseName': warehouseName,
      'dockNumber': dockNumber,
      'deliveryAddress': deliveryAddress,
      'packageDetails': packageDetails,
      'weightTons': weightTons,
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
    };
  }

  @override
  List<Object?> get props => [
    orderId,
    tripId,
    customerName,
    customerPhone,
    pickupAddress,
    pickupType,
    containerNumber,
    terminalName,
    warehouseName,
    dockNumber,
    deliveryAddress,
    packageDetails,
    weightTons,
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
  ];
}

class CreateOrderRequest extends Equatable {
  final String customerName;
  final String? customerPhone;
  final String pickupAddress;
  final String? pickupType;
  final String? containerNumber;
  final String? terminalName;
  final String? warehouseName;
  final String? dockNumber;
  final String deliveryAddress;
  final String? packageDetails;
  final double? pickupLat;
  final double? pickupLng;
  final double? deliveryLat;
  final double? deliveryLng;
  final double? weightTonnes;
  final String? priority; // "NORMAL" or "URGENT"

  const CreateOrderRequest({
    required this.customerName,
    this.customerPhone,
    required this.pickupAddress,
    this.pickupType,
    this.containerNumber,
    this.terminalName,
    this.warehouseName,
    this.dockNumber,
    required this.deliveryAddress,
    this.packageDetails,
    this.pickupLat,
    this.pickupLng,
    this.deliveryLat,
    this.deliveryLng,
    this.weightTonnes,
    this.priority = "NORMAL",
  });

  Map<String, dynamic> toJson() {
    return {
      'customerName': customerName,
      'customerPhone': customerPhone,
      'pickupAddress': pickupAddress,
      'pickupType': pickupType,
      'containerNumber': containerNumber,
      'terminalName': terminalName,
      'warehouseName': warehouseName,
      'dockNumber': dockNumber,
      'deliveryAddress': deliveryAddress,
      'packageDetails': packageDetails,
      'pickupLat': pickupLat,
      'pickupLng': pickupLng,
      'deliveryLat': deliveryLat,
      'deliveryLng': deliveryLng,
      'weightTonnes': weightTonnes,
      'priority': priority,
    };
  }

  @override
  List<Object?> get props => [
    customerName,
    customerPhone,
    pickupAddress,
    pickupType,
    containerNumber,
    terminalName,
    warehouseName,
    dockNumber,
    deliveryAddress,
    packageDetails,
    pickupLat,
    pickupLng,
    deliveryLat,
    deliveryLng,
    weightTonnes,
    priority,
  ];
}

class OrderSummary extends Equatable {
  final int orderId;
  final String pickupAddress;
  final String? pickupType;
  final String? containerNumber;
  final String? terminalName;
  final String? warehouseName;
  final String? dockNumber;
  final String deliveryAddress;
  final String? packageDetails;
  final double? weightTons;
  final double? packageValue;
  final double? distanceKm;
  final String orderStatus;
  final String? tripStatus;
  final DateTime createdAt;
  final DateTime? estimatedDeliveryTime;
  final int? slaExtensionMinutes;
  final String? delayReason;
  final String? delayStatus;

  const OrderSummary({
    required this.orderId,
    required this.pickupAddress,
    this.pickupType,
    this.containerNumber,
    this.terminalName,
    this.warehouseName,
    this.dockNumber,
    required this.deliveryAddress,
    this.packageDetails,
    this.weightTons,
    this.packageValue,
    this.distanceKm,
    required this.orderStatus,
    this.tripStatus,
    required this.createdAt,
    this.estimatedDeliveryTime,
    this.slaExtensionMinutes,
    this.delayReason,
    this.delayStatus,
  });

  factory OrderSummary.fromJson(Map<String, dynamic> json) {
    return OrderSummary(
      orderId: json['orderId'],
      pickupAddress: json['pickupAddress'],
      pickupType: json['pickupType'],
      containerNumber: json['containerNumber'],
      terminalName: json['terminalName'],
      warehouseName: json['warehouseName'],
      dockNumber: json['dockNumber'],
      deliveryAddress: json['deliveryAddress'],
      packageDetails: json['packageDetails'],
      weightTons: json['weightTons']?.toDouble(),
      packageValue: json['packageValue']?.toDouble(),
      distanceKm: json['distanceKm']?.toDouble(),
      orderStatus: json['orderStatus'],
      tripStatus: json['tripStatus'],
      createdAt: DateTime.parse(json['createdAt']),
      estimatedDeliveryTime: json['estimatedDeliveryTime'] != null
          ? DateTime.parse(json['estimatedDeliveryTime'])
          : null,
      slaExtensionMinutes: json['slaExtensionMinutes'],
      delayReason: json['delayReason'],
      delayStatus: json['delayStatus'],
    );
  }

  @override
  List<Object?> get props => [
    orderId,
    pickupAddress,
    pickupType,
    containerNumber,
    terminalName,
    warehouseName,
    dockNumber,
    deliveryAddress,
    packageDetails,
    weightTons,
    packageValue,
    distanceKm,
    orderStatus,
    tripStatus,
    createdAt,
    estimatedDeliveryTime,
    slaExtensionMinutes,
    delayReason,
    delayStatus,
  ];
}
