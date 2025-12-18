import 'package:equatable/equatable.dart';

class CustomerProfile extends Equatable {
  final int userId;
  final String username;
  final String email;
  final String? fullName;
  final String? phone;
  final String? address;
  final String? companyName;
  final String? companyCode;
  final String? paymentMethod;
  final String? profilePictureUrl;
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
    this.companyName,
    this.companyCode,
    this.paymentMethod,
    this.profilePictureUrl,
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
      companyName: json['companyName'],
      companyCode: json['companyCode'],
      paymentMethod: json['paymentMethod'],
      profilePictureUrl: json['profilePictureUrl'],
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
      'companyName': companyName,
      'companyCode': companyCode,
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
    companyName,
    companyCode,
    paymentMethod,
    profilePictureUrl,
    createdAt,
    totalOrders,
    totalSpent,
  ];
}

class UpdateProfileRequest extends Equatable {
  final String? fullName;
  final String? phone;
  final String? address;
  final String? companyName;
  final String? companyCode;
  final String? paymentMethod;
  final String? profilePictureUrl;

  const UpdateProfileRequest({
    this.fullName,
    this.phone,
    this.address,
    this.companyName,
    this.companyCode,
    this.paymentMethod,
    this.profilePictureUrl,
  });

  Map<String, dynamic> toJson() {
    return {
      'fullName': fullName,
      'phone': phone,
      'address': address,
      'companyName': companyName,
      'companyCode': companyCode,
      'paymentMethod': paymentMethod,
      'profilePictureUrl': profilePictureUrl,
    };
  }

  @override
  List<Object?> get props => [fullName, phone, address, companyName, companyCode, paymentMethod, profilePictureUrl];
}
