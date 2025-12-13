class User {
  final String username;
  final String role;
  final String? token;  // Optional - only present after login
  final String? message; // Optional - only from login response
  final String? profilePictureUrl;

  User({
    required this.username,
    required this.role,
    this.token,
    this.message,
    this.profilePictureUrl,
  });

  // From login API response
  factory User.fromAuthResponse(Map<String, dynamic> json) {
    return User(
      username: json['username'] ?? json['user'] ?? '',
      role: json['role'],
      token: json['token'],
      message: json['message'],
      profilePictureUrl: json['profilePictureUrl'],
    );
  }

  // From stored user data (no token/message)
  factory User.fromStored(Map<String, dynamic> json) {
    return User(
      username: json['username'],
      role: json['role'],
      profilePictureUrl: json['profilePictureUrl'],
    );
  }

  // For local storage (exclude token/message)
  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'role': role,
      'profilePictureUrl': profilePictureUrl,
    };
  }

  // Check if user is logged in
  bool get isLoggedIn => token != null && token!.isNotEmpty;
}
