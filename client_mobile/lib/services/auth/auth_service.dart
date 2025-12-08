import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../api_client.dart';
import '../../models/user.dart';

class AuthService {
  static const String _tokenKey = 'token';
  static const String _userKey = 'user';

  final StreamController<User?> _userController = StreamController<User?>.broadcast();

  Stream<User?> get userStream => _userController.stream;

  void _notifyUserUpdate(User? user) {
    _userController.add(user);
  }

  Future<User> login(String username, String password) async {
    try {
      final response = await apiClient.post('/auth/login', body: {
        'username': username,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        // Create user from auth response
        final user = User.fromAuthResponse(data);

        // Store token separately
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_tokenKey, user.token!);

        // Store user data (without token)
        await prefs.setString(_userKey, jsonEncode(user.toJson()));

        _notifyUserUpdate(user);
        return user;
      } else {
        throw Exception('Login failed: ${response.body}');
      }
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    _notifyUserUpdate(null);
  }

  Future<User?> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString(_userKey);

    if (userJson != null) {
      try {
        final userMap = jsonDecode(userJson);
        return User.fromStored(userMap);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<bool> isLoggedIn() async {
    final user = await getCurrentUser();
    final token = await getToken();
    return user != null && token != null && token.isNotEmpty;
  }

  Future<Map<String, String>> getAuthHeaders() async {
    final token = await getToken();
    if (token != null && token.isNotEmpty) {
      return {'Authorization': 'Bearer ${token.replaceAll('"', '')}'};
    }
    return {};
  }

  Future<void> updateCurrentUserProfileImage(String profilePictureUrl) async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString(_userKey);

    if (userJson != null) {
      final userMap = jsonDecode(userJson) as Map<String, dynamic>;
      userMap['profilePictureUrl'] = profilePictureUrl;
      await prefs.setString(_userKey, jsonEncode(userMap));

      final updatedUser = User.fromStored(userMap);
      _notifyUserUpdate(updatedUser);
    }
  }
}

// Singleton instance
final authService = AuthService();
