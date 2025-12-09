import '../api_client.dart';
import 'dart:convert';
import '../../models/driver/driver_profile.dart';
import '../../models/driver/trip.dart';
import '../../models/driver/schedule.dart';
import '../../models/driver/compliance.dart';
import '../../models/driver/update_driver_profile_request.dart';

class DriverService {
  Future<List<DriverTrip>> getMyTrips({String? status}) async {
    final endpoint = status != null ? '/driver/me/trips?status=$status' : '/driver/me/trips';
    final response = await apiClient.get(endpoint);
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as List;
      return data.map((item) => DriverTrip.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load trips: ${response.body}');
    }
  }

  Future<DriverTripDetail> getMyTripDetail(int tripId) async {
    final response = await apiClient.get('/driver/me/trips/$tripId');
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return DriverTripDetail.fromJson(data);
    } else {
      throw Exception('Failed to load trip detail: ${response.body}');
    }
  }

  Future<List<DriverScheduleItem>> getMySchedule(String startDate, String endDate) async {
    final response = await apiClient.get('/driver/me/schedule?startDate=$startDate&endDate=$endDate');
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as List;
      return data.map((item) => DriverScheduleItem.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load schedule: ${response.body}');
    }
  }

  Future<DriverCompliance> getMyCompliance() async {
    final response = await apiClient.get('/driver/me/compliance/rest-periods');
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return DriverCompliance.fromJson(data);
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

  // Get driver profile
  Future<DriverProfile> getProfile() async {
    final response = await apiClient.get('/driver/me/profile');
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return DriverProfile.fromJson(data);
    } else {
      throw Exception('Failed to get profile: ${response.body}');
    }
  }

  // Update driver profile
  Future<DriverProfile> updateProfile(UpdateDriverProfileRequest request) async {
    final response = await apiClient.put(
      '/driver/me/profile',
      body: request.toJson(),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return DriverProfile.fromJson(data);
    } else {
      throw Exception('Failed to update profile: ${response.body}');
    }
  }
}

final driverService = DriverService();
