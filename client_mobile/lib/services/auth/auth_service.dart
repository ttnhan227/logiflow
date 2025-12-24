import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../api_client.dart';
import '../../models/user.dart';

class AuthService {
  static const String _tokenKey = 'token';
  static const String _userKey = 'user';

  final StreamController<User?> _userController = StreamController<User?>.broadcast();

  Stream<User?> get userStream => _userController.stream;

  void _notifyUserUpdate(User? user) {
    print('AuthService: _notifyUserUpdate called with user: ${user?.username}');
    _userController.add(user);
    print('AuthService: Stream update sent');
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

        print('AuthService: Login successful, notifying stream - user: ${user.username}');
        _notifyUserUpdate(user);
        print('AuthService: Login notification sent');
        return user;
      } else {
        // Parse error response for better user messages
        String errorMessage = _parseLoginError(response);
        throw Exception(errorMessage);
      }
    } on Exception catch (e) {
      // Handle network and other exceptions
      if (e.toString().contains('SocketException') ||
          e.toString().contains('Connection') ||
          e.toString().contains('Network')) {
        throw Exception('Service temporarily unavailable. Please try again later or contact support.');
      } else if (e.toString().contains('TimeoutException')) {
        throw Exception('Connection timeout. Please try again.');
      } else {
        throw Exception('Login failed: $e');
      }
    }
  }

  String _parseLoginError(http.Response response) {
    try {
      final data = jsonDecode(response.body);
      final message = data['message'] as String? ?? 'Unknown error occurred';

      // Map server messages to user-friendly messages
      if (message.contains('Invalid credentials')) {
        return 'Incorrect username or password. Please check your credentials and try again.';
      } else if (message.contains('rejected by the administrator')) {
        return 'Your registration has been rejected. Please contact support for assistance.';
      } else if (message.contains('still pending approval')) {
        return 'Your account registration is awaiting approval. Please try again later.';
      } else if (message.contains('Bad credentials')) {
        return 'Incorrect username or password. Please check your credentials and try again.';
      } else {
        return message;
      }
    } catch (e) {
      // If we can't parse the JSON, return a generic message
      return 'Login failed. Please check your credentials and try again.';
    }
  }

  Future<void> logout() async {
    print('AuthService: Logging out user');
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    _notifyUserUpdate(null);
    print('AuthService: Logout completed, notified stream');
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
