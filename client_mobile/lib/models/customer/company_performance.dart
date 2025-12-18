import 'package:equatable/equatable.dart';

class CompanyPerformance extends Equatable {
  final int totalOrders;
  final int deliveredOrders;
  final int cancelledOrders;
  final double onTimeDeliveryRate; // percentage (0-100)
  final Duration averageDelay;
  final Duration averageDeliveryTime;
  final double totalSpent;
  final Map<String, PickupTypePerformance> pickupTypePerformance; // port vs warehouse

  const CompanyPerformance({
    required this.totalOrders,
    required this.deliveredOrders,
    required this.cancelledOrders,
    required this.onTimeDeliveryRate,
    required this.averageDelay,
    required this.averageDeliveryTime,
    required this.totalSpent,
    required this.pickupTypePerformance,
  });

  factory CompanyPerformance.fromJson(Map<String, dynamic> json) {
    final pickupTypeMap = <String, PickupTypePerformance>{};
    if (json['pickupTypePerformance'] != null) {
      (json['pickupTypePerformance'] as Map<String, dynamic>).forEach((key, value) {
        pickupTypeMap[key] = PickupTypePerformance.fromJson(value);
      });
    }

    return CompanyPerformance(
      totalOrders: json['totalOrders'] ?? 0,
      deliveredOrders: json['deliveredOrders'] ?? 0,
      cancelledOrders: json['cancelledOrders'] ?? 0,
      onTimeDeliveryRate: json['onTimeDeliveryRate']?.toDouble() ?? 0.0,
      averageDelay: Duration(minutes: json['averageDelayMinutes'] ?? 0),
      averageDeliveryTime: Duration(minutes: json['averageDeliveryTimeMinutes'] ?? 0),
      totalSpent: json['totalSpent']?.toDouble() ?? 0.0,
      pickupTypePerformance: pickupTypeMap,
    );
  }

  Map<String, dynamic> toJson() {
    final pickupTypeJson = <String, dynamic>{};
    pickupTypePerformance.forEach((key, value) {
      pickupTypeJson[key] = value.toJson();
    });

    return {
      'totalOrders': totalOrders,
      'deliveredOrders': deliveredOrders,
      'cancelledOrders': cancelledOrders,
      'onTimeDeliveryRate': onTimeDeliveryRate,
      'averageDelayMinutes': averageDelay.inMinutes,
      'averageDeliveryTimeMinutes': averageDeliveryTime.inMinutes,
      'totalSpent': totalSpent,
      'pickupTypePerformance': pickupTypeJson,
    };
  }

  @override
  List<Object?> get props => [
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    onTimeDeliveryRate,
    averageDelay,
    averageDeliveryTime,
    totalSpent,
    pickupTypePerformance,
  ];
}

class PickupTypePerformance extends Equatable {
  final String pickupType; // 'PORT' or 'WAREHOUSE'
  final int totalOrders;
  final int onTimeOrders;
  final double onTimeRate; // percentage
  final Duration averageDelay;

  const PickupTypePerformance({
    required this.pickupType,
    required this.totalOrders,
    required this.onTimeOrders,
    required this.onTimeRate,
    required this.averageDelay,
  });

  factory PickupTypePerformance.fromJson(Map<String, dynamic> json) {
    return PickupTypePerformance(
      pickupType: json['pickupType'] ?? '',
      totalOrders: json['totalOrders'] ?? 0,
      onTimeOrders: json['onTimeOrders'] ?? 0,
      onTimeRate: json['onTimeRate']?.toDouble() ?? 0.0,
      averageDelay: Duration(minutes: json['averageDelayMinutes'] ?? 0),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'pickupType': pickupType,
      'totalOrders': totalOrders,
      'onTimeOrders': onTimeOrders,
      'onTimeRate': onTimeRate,
      'averageDelayMinutes': averageDelay.inMinutes,
    };
  }

  @override
  List<Object?> get props => [
    pickupType,
    totalOrders,
    onTimeOrders,
    onTimeRate,
    averageDelay,
  ];
}
