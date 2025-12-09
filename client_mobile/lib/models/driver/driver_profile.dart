class DriverProfile {
  final int userId;
  final String username;
  final String email;
  final String? fullName;
  final String? phone;
  final String? profilePictureUrl;
  final String? driverLicenseNumber;
  final String? licenseExpiryDate;
  final String? vehicleType;
  final String? vehiclePlateNumber;
  final DateTime createdAt;
  final String status;
  final int totalDeliveries;
  final double rating;
  final double totalEarnings;
  final double? averageDeliveryTime; // in minutes

  const DriverProfile({
    required this.userId,
    required this.username,
    required this.email,
    this.fullName,
    this.phone,
    this.profilePictureUrl,
    this.driverLicenseNumber,
    this.licenseExpiryDate,
    this.vehicleType,
    this.vehiclePlateNumber,
    required this.createdAt,
    required this.status,
    required this.totalDeliveries,
    required this.rating,
    required this.totalEarnings,
    this.averageDeliveryTime,
  });

  factory DriverProfile.fromJson(Map<String, dynamic> json) {
    return DriverProfile(
      userId: json['userId'],
      username: json['username'],
      email: json['email'],
      fullName: json['fullName'],
      phone: json['phone'],
      profilePictureUrl: json['profilePictureUrl'],
      driverLicenseNumber: json['driverLicenseNumber'],
      licenseExpiryDate: json['licenseExpiryDate'],
      vehicleType: json['vehicleType'],
      vehiclePlateNumber: json['vehiclePlateNumber'],
      createdAt: DateTime.parse(json['createdAt']),
      status: json['status'] ?? 'active',
      totalDeliveries: json['totalDeliveries'] ?? 0,
      rating: (json['rating'] ?? 0.0).toDouble(),
      totalEarnings: (json['totalEarnings'] ?? 0.0).toDouble(),
      averageDeliveryTime: json['averageDeliveryTime']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'username': username,
      'email': email,
      'fullName': fullName,
      'phone': phone,
      'profilePictureUrl': profilePictureUrl,
      'driverLicenseNumber': driverLicenseNumber,
      'licenseExpiryDate': licenseExpiryDate,
      'vehicleType': vehicleType,
      'vehiclePlateNumber': vehiclePlateNumber,
      'createdAt': createdAt.toIso8601String(),
      'status': status,
      'totalDeliveries': totalDeliveries,
      'rating': rating,
      'totalEarnings': totalEarnings,
      'averageDeliveryTime': averageDeliveryTime,
    };
  }
}
