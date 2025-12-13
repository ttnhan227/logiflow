import 'package:equatable/equatable.dart';

class OrderHistory extends Equatable {
  final int orderId;
  final String pickupAddress;
  final String deliveryAddress;
  final String? packageDetails;
  final double? weightKg;
  final double? packageValue;
  final double? distanceKm;
  final String orderStatus;
  final DateTime createdAt;
  final DateTime? deliveredAt;
  final double deliveryFee;
  final String? driverName;
  final int? driverRating;

  const OrderHistory({
    required this.orderId,
    required this.pickupAddress,
    required this.deliveryAddress,
    this.packageDetails,
    this.weightKg,
    this.packageValue,
    this.distanceKm,
    required this.orderStatus,
    required this.createdAt,
    this.deliveredAt,
    required this.deliveryFee,
    this.driverName,
    this.driverRating,
  });

  factory OrderHistory.fromJson(Map<String, dynamic> json) {
    return OrderHistory(
      orderId: json['orderId'],
      pickupAddress: json['pickupAddress'],
      deliveryAddress: json['deliveryAddress'],
      packageDetails: json['packageDetails'],
      weightKg: json['weightKg']?.toDouble(),
      packageValue: json['packageValue']?.toDouble(),
      distanceKm: json['distanceKm']?.toDouble(),
      orderStatus: json['orderStatus'],
      createdAt: DateTime.parse(json['createdAt']),
      deliveredAt: json['deliveredAt'] != null ? DateTime.parse(json['deliveredAt']) : null,
      deliveryFee: json['deliveryFee']?.toDouble() ?? 0.0,
      driverName: json['driverName'],
      driverRating: json['driverRating'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'orderId': orderId,
      'pickupAddress': pickupAddress,
      'deliveryAddress': deliveryAddress,
      'packageDetails': packageDetails,
      'weightKg': weightKg,
      'packageValue': packageValue,
      'distanceKm': distanceKm,
      'orderStatus': orderStatus,
      'createdAt': createdAt.toIso8601String(),
      'deliveredAt': deliveredAt?.toIso8601String(),
      'deliveryFee': deliveryFee,
      'driverName': driverName,
      'driverRating': driverRating,
    };
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
    createdAt,
    deliveredAt,
    deliveryFee,
    driverName,
    driverRating,
  ];
}
