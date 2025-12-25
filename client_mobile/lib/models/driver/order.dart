class DriverOrder {
  final int orderId;
  final String customerName;
  final String? customerPhone;
  final String pickupAddress;
  final String deliveryAddress;
  final double? pickupLat;
  final double? pickupLng;
  final double? deliveryLat;
  final double? deliveryLng;
  final String? packageDetails;
  final double? weightTons;
  final double? packageValue;
  final double? distanceKm;
  final String? status;
  final String? orderStatus;
  final String? priority;
  final String? priorityLevel;
  final String? delayReason;

  const DriverOrder({
    required this.orderId,
    required this.customerName,
    this.customerPhone,
    required this.pickupAddress,
    required this.deliveryAddress,
    this.pickupLat,
    this.pickupLng,
    this.deliveryLat,
    this.deliveryLng,
    this.packageDetails,
    this.weightTons,
    this.packageValue,
    this.distanceKm,
    this.status,
    this.orderStatus,
    this.priority,
    this.priorityLevel,
    this.delayReason,
  });

  factory DriverOrder.fromJson(Map<String, dynamic> json) {
    return DriverOrder(
      orderId: json['orderId'],
      customerName: json['customerName'],
      customerPhone: json['customerPhone'],
      pickupAddress: json['pickupAddress'],
      deliveryAddress: json['deliveryAddress'],
      pickupLat: json['pickupLat']?.toDouble(),
      pickupLng: json['pickupLng']?.toDouble(),
      deliveryLat: json['deliveryLat']?.toDouble(),
      deliveryLng: json['deliveryLng']?.toDouble(),
      packageDetails: json['packageDetails'],
      weightTons: json['weightTons']?.toDouble(),
      packageValue: json['packageValue']?.toDouble(),
      distanceKm: json['distanceKm']?.toDouble(),
      status: json['status'],
      orderStatus: json['orderStatus'],
      priority: json['priority'],
      priorityLevel: json['priorityLevel'],
      delayReason: json['delayReason'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'orderId': orderId,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'pickupAddress': pickupAddress,
      'deliveryAddress': deliveryAddress,
      'pickupLat': pickupLat,
      'pickupLng': pickupLng,
      'deliveryLat': deliveryLat,
      'deliveryLng': deliveryLng,
      'packageDetails': packageDetails,
      'weightTons': weightTons,
      'packageValue': packageValue,
      'distanceKm': distanceKm,
      'status': status,
      'orderStatus': orderStatus,
      'priority': priority,
      'priorityLevel': priorityLevel,
      'delayReason': delayReason,
    };
  }
}
