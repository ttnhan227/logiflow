import 'package:equatable/equatable.dart';

class OrderHistory extends Equatable {
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
  final DateTime createdAt;
  final DateTime? deliveredAt;
  final String? driverName;
  final int? driverRating;

  const OrderHistory({
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
    required this.createdAt,
    this.deliveredAt,
    this.driverName,
    this.driverRating,
  });

  factory OrderHistory.fromJson(Map<String, dynamic> json) {
    return OrderHistory(
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
      createdAt: DateTime.parse(json['createdAt']),
      deliveredAt: json['deliveredAt'] != null
          ? DateTime.parse(json['deliveredAt'])
          : null,
      driverName: json['driverName'],
      driverRating: json['driverRating'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'orderId': orderId,
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
      'orderStatus': orderStatus,
      'createdAt': createdAt.toIso8601String(),
      'deliveredAt': deliveredAt?.toIso8601String(),
      'driverName': driverName,
      'driverRating': driverRating,
    };
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
    createdAt,
    deliveredAt,
    driverName,
    driverRating,
  ];
}
