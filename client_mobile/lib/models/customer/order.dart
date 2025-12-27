import 'package:equatable/equatable.dart';

class Order extends Equatable {
  final int? orderId;
  final int? tripId;
  final String? customerName;
  final String? customerPhone;
  final int? customerId;
  final int? customerUserId;
  final String? pickupAddress;
  final String? pickupType;
  final String? containerNumber;
  final String? terminalName;
  final String? warehouseName;
  final String? dockNumber;
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
    this.customerId,
    this.customerUserId,
    this.pickupAddress,
    this.pickupType,
    this.containerNumber,
    this.terminalName,
    this.warehouseName,
    this.dockNumber,
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

  double? get weightTons => weightKg != null ? weightKg! / 1000 : null;

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      orderId: json['orderId'] is int
          ? json['orderId']
          : (json['orderId'] as num?)?.toInt(),
      tripId: json['tripId'] is int
          ? json['tripId']
          : (json['tripId'] as num?)?.toInt(),
      customerName: json['customerName'],
      customerPhone: json['customerPhone'],
      customerId: json['customerId'] is int
          ? json['customerId']
          : (json['customerId'] as num?)?.toInt(),
      customerUserId: json['customerUserId'] is int
          ? json['customerUserId']
          : (json['customerUserId'] as num?)?.toInt(),
      pickupAddress: json['pickupAddress'],
      pickupType: json['pickupType'],
      containerNumber: json['containerNumber'],
      terminalName: json['terminalName'],
      warehouseName: json['warehouseName'],
      dockNumber: json['dockNumber'],
      deliveryAddress: json['deliveryAddress'],
      packageDetails: json['packageDetails'],
      weightKg: json['weightTons'] != null
          ? (json['weightTons'] as num).toDouble() * 1000
          : null,
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
      deliveryFee: json['shippingFee']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'orderId': orderId,
      'tripId': tripId,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'customerId': customerId,
      'customerUserId': customerUserId,
      'pickupAddress': pickupAddress,
      'pickupType': pickupType,
      'containerNumber': containerNumber,
      'terminalName': terminalName,
      'warehouseName': warehouseName,
      'dockNumber': dockNumber,
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
    customerId,
    customerUserId,
    pickupAddress,
    pickupType,
    containerNumber,
    terminalName,
    warehouseName,
    dockNumber,
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
  final double? weightKg;
  final double? packageValue;
  final String? priority; // "NORMAL" or "URGENT"
  final String? pickupType;
  final String? containerNumber;
  final String? terminalName;
  final String? warehouseName;
  final String? dockNumber;

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
    this.weightKg,
    this.packageValue,
    this.priority = "NORMAL",
    this.pickupType,
    this.containerNumber,
    this.terminalName,
    this.warehouseName,
    this.dockNumber,
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
      'weightTonnes': weightKg != null ? weightKg! / 1000 : null,
      'packageValue': packageValue,
      'priority': priority,
      'pickupType': pickupType,
      'containerNumber': containerNumber,
      'terminalName': terminalName,
      'warehouseName': warehouseName,
      'dockNumber': dockNumber,
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
    weightKg,
    packageValue,
    priority,
    pickupType,
    containerNumber,
    terminalName,
    warehouseName,
    dockNumber,
  ];
}

class OrderSummary extends Equatable {
  final int orderId;
  final String customerName;
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
  final double? shippingFee;
  final String orderStatus;
  final String? paymentStatus;
  final String? tripStatus;
  final DateTime createdAt;
  final DateTime? estimatedDeliveryTime;
  final int? slaExtensionMinutes;
  final String? delayReason;
  final String? delayStatus;
  final double deliveryFee;
  final int? customerId;
  final int? customerUserId;

  const OrderSummary({
    required this.orderId,
    required this.customerName,
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
    this.shippingFee,
    required this.orderStatus,
    this.paymentStatus,
    this.tripStatus,
    required this.createdAt,
    this.estimatedDeliveryTime,
    this.slaExtensionMinutes,
    this.delayReason,
    this.delayStatus,
    required this.deliveryFee,
    this.customerId,
    this.customerUserId,
  });

  factory OrderSummary.fromJson(Map<String, dynamic> json) {
    return OrderSummary(
      orderId: (json['orderId'] as num).toInt(),
      customerName: json['customerName'],
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
      shippingFee: json['shippingFee']?.toDouble(),
      orderStatus: json['orderStatus'],
      paymentStatus: json['paymentStatus'],
      tripStatus: json['tripStatus'],
      createdAt: DateTime.parse(json['createdAt']),
      estimatedDeliveryTime: json['estimatedDeliveryTime'] != null
          ? DateTime.parse(json['estimatedDeliveryTime'])
          : null,
      slaExtensionMinutes: json['slaExtensionMinutes'] is int
          ? json['slaExtensionMinutes']
          : (json['slaExtensionMinutes'] as num?)?.toInt(),
      delayReason: json['delayReason'],
      delayStatus: json['delayStatus'],
      deliveryFee: json['deliveryFee']?.toDouble() ?? 0.0,
      customerId: json['customerId'] is int
          ? json['customerId']
          : (json['customerId'] as num?)?.toInt(),
      customerUserId: json['customerUserId'] is int
          ? json['customerUserId']
          : (json['customerUserId'] as num?)?.toInt(),
    );
  }

  @override
  List<Object?> get props => [
    orderId,
    customerName,
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
    shippingFee,
    orderStatus,
    paymentStatus,
    tripStatus,
    createdAt,
    estimatedDeliveryTime,
    slaExtensionMinutes,
    delayReason,
    delayStatus,
    deliveryFee,
    customerId,
    customerUserId,
  ];
}
