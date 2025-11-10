import '../api_client.dart';
import 'dart:convert';

class DriverService {
  Future<List<dynamic>> getMyTrips({String? status}) async {
    final endpoint = status != null ? '/driver/me/trips?status=$status' : '/driver/me/trips';
    final response = await apiClient.get(endpoint);
    if (response.statusCode == 200) {
      return List.from(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load trips: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> getMyTripDetail(int tripId) async {
    final response = await apiClient.get('/driver/me/trips/$tripId');
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load trip detail: ${response.body}');
    }
  }

  Future<List<dynamic>> getMySchedule(String startDate, String endDate) async {
    final response = await apiClient.get('/driver/me/schedule?startDate=$startDate&endDate=$endDate');
    if (response.statusCode == 200) {
      return List.from(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load schedule: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> getMyCompliance() async {
    final response = await apiClient.get('/driver/me/compliance/rest-periods');
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load compliance: ${response.body}');
    }
  }

  Future<void> acceptTrip(int tripId) async {
    final response = await apiClient.post('/driver/me/trips/$tripId/accept');
    if (response.statusCode != 200) {
      throw Exception('Failed to accept trip: \\${response.body}');
    }
  }

  Future<void> declineTrip(int tripId) async {
    final response = await apiClient.post('/driver/me/trips/$tripId/decline');
    if (response.statusCode != 200) {
      throw Exception('Failed to decline trip: ${response.body}');
    }
  }

  Future<void> cancelTrip(int tripId) async {
    final response = await apiClient.post('/driver/me/trips/$tripId/cancel');
    if (response.statusCode != 200) {
      throw Exception('Failed to cancel trip: ${response.body}');
    }
  }

  Future<void> updateTripStatus(int tripId, String status) async {
    final response = await apiClient.post(
      '/driver/me/trips/$tripId/status',
      body: {'status': status},
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update trip status: ${response.body}');
    }
  }
}

final driverService = DriverService();
