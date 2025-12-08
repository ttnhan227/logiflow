import 'package:equatable/equatable.dart';

class CustomerProfile extends Equatable {
  final int userId;
  final String username;
  final String email;
  final String? fullName;
  final String? phone;
  final String? address;
  final String? paymentMethod;
  final DateTime createdAt;
  final int totalOrders;
  final double totalSpent;

  const CustomerProfile({
    required this.userId,
    required this.username,
    required this.email,
    this.fullName,
    this.phone,
    this.address,
    this.paymentMethod,
    required this.createdAt,
    required this.totalOrders,
    required this.totalSpent,
  });

  factory CustomerProfile.fromJson(Map<String, dynamic> json) {
    return CustomerProfile(
      userId: json['userId'],
      username: json['username'],
      email: json['email'],
      fullName: json['fullName'],
      phone: json['phone'],
      address: json['address'],
      paymentMethod: json['paymentMethod'],
      createdAt: DateTime.parse(json['createdAt']),
      totalOrders: json['totalOrders'] ?? 0,
      totalSpent: json['totalSpent']?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'username': username,
      'email': email,
      'fullName': fullName,
      'phone': phone,
      'address': address,
      'paymentMethod': paymentMethod,
      'createdAt': createdAt.toIso8601String(),
      'totalOrders': totalOrders,
      'totalSpent': totalSpent,
    };
  }

  @override
  List<Object?> get props => [
    userId,
    username,
    email,
    fullName,
    phone,
    address,
    paymentMethod,
    createdAt,
    totalOrders,
    totalSpent,
  ];
}

class UpdateProfileRequest extends Equatable {
  final String? fullName;
  final String? phone;
  final String? address;
  final String? paymentMethod;

  const UpdateProfileRequest({
    this.fullName,
    this.phone,
    this.address,
    this.paymentMethod,
  });

  Map<String, dynamic> toJson() {
    return {
      'fullName': fullName,
      'phone': phone,
      'address': address,
      'paymentMethod': paymentMethod,
    };
  }

  @override
  List<Object?> get props => [fullName, phone, address, paymentMethod];
}
