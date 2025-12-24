import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String baseUrl = 'http://172.16.2.94:8080/api';
  static String get baseImageUrl => baseUrl.replaceFirst('/api', '');
  final http.Client _client = http.Client();

  Future<Map<String, String>> getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    final headers = <String, String>{
      'Content-Type': 'application/json',
    };

    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer ${token.replaceAll('"', '')}';
    }

    return headers;
  }

  Future<http.Response> get(String endpoint) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await getHeaders();

    final response = await _client.get(url, headers: headers);
    await _handleResponse(response);
    return response;
  }

  Future<http.Response> post(String endpoint, {Map<String, dynamic>? body}) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await getHeaders();

    final response = await _client.post(
      url,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
    await _handleResponse(response);
    return response;
  }

  Future<http.Response> put(String endpoint, {Map<String, dynamic>? body}) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await getHeaders();

    final response = await _client.put(
      url,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
    await _handleResponse(response);
    return response;
  }

  Future<http.Response> delete(String endpoint) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await getHeaders();

    final response = await _client.delete(url, headers: headers);
    await _handleResponse(response);
    return response;
  }

  Future<void> _handleResponse(http.Response response) async {
    if (response.statusCode == 401 || response.statusCode == 403) {
      // Clear stored auth data
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
      await prefs.remove('user');

      // You might want to navigate to login screen here
      // This depends on your navigation setup
      throw Exception('Authentication failed');
    }
  }

  void dispose() {
    _client.close();
  }
}

// Singleton instance
final apiClient = ApiClient();
