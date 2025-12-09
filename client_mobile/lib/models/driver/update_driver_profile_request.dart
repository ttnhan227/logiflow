class UpdateDriverProfileRequest {
  final String? fullName;
  final String? phone;
  final String? profilePictureUrl;

  const UpdateDriverProfileRequest({
    this.fullName,
    this.phone,
    this.profilePictureUrl,
  });

  Map<String, dynamic> toJson() {
    return {
      'fullName': fullName,
      'phone': phone,
      'profilePictureUrl': profilePictureUrl,
    };
  }
}
