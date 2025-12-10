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

  // Check if driver has any active trip assignments (assigned, accepted, or in_progress)
  // Excludes completed trips/assignments to allow accepting new trips
  Future<bool> hasActiveTripAssignment() async {
    try {
      final trips = await getMyTrips();
      return trips.any((trip) =>
        // Must be actively committed to trips (exclude just-assigned-offers)
        // "accepted" status means driver committed to this trip - BLOCKS other assignments
        trip.assignmentStatus?.toLowerCase() == 'accepted' ||
        // Also include trips that are in progress regardless of assignment status
        trip.status?.toLowerCase() == 'in_progress'
        // Note: "assigned" scheduled trips are offers that haven't been accepted yet - don't block
      );
    } catch (e) {
      return false; // If unable to check, assume no active assignment
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

  Future<void> updateAssignmentStatus(int tripId, String assignmentStatus) async {
    final response = await apiClient.post(
      '/driver/me/trips/$tripId/assignment-status',
      body: {'assignmentStatus': assignmentStatus},
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update assignment status: ${response.body}');
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
