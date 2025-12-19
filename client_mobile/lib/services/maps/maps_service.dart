import '../api_client.dart';
import 'dart:convert';

class DistanceResult {
  final String? totalDistance;
  final int? distanceMeters;
  final String? totalDuration;
  final int? durationSeconds;

  DistanceResult({
    this.totalDistance,
    this.distanceMeters,
    this.totalDuration,
    this.durationSeconds,
  });

  factory DistanceResult.fromJson(Map<String, dynamic> json) {
    return DistanceResult(
      totalDistance: json['totalDistance'] as String?,
      distanceMeters: json['distanceMeters'] as int?,
      totalDuration: json['totalDuration'] as String?,
      durationSeconds: json['durationSeconds'] as int?,
    );
  }
}

class MapsService {
  Future<Map<String, dynamic>?> getDirections(
    String originLat,
    String originLng,
    String destLat,
    String destLng,
  ) async {
    try {
      final response = await apiClient.get(
        '/maps/directions?originLat=$originLat&originLng=$originLng&destLat=$destLat&destLng=$destLng&includeGeometry=true',
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Error fetching directions: $e');
      return null;
    }
  }

  Future<DistanceResult?> calculateDistance(String originAddress, String destinationAddress) async {
    try {
      final response = await apiClient.get(
        '/maps/distance?origin=${Uri.encodeComponent(originAddress)}&destination=${Uri.encodeComponent(destinationAddress)}',
      );
      if (response.statusCode == 200 && response.body.isNotEmpty) {
        final json = jsonDecode(response.body);
        if (json is Map<String, dynamic>) {
          return DistanceResult.fromJson(json);
        }
      }
      return null;
    } catch (e) {
      print('Error calculating distance: $e');
      return null;
    }
  }

  Future<List<String>?> getBasicAddressSuggestions(String query, {int limit = 10}) async {
    try {
      final response = await apiClient.get('/maps/suggest-addresses?query=${Uri.encodeComponent(query)}&limit=$limit');
      if (response.statusCode == 200) {
        final List<dynamic> suggestions = jsonDecode(response.body);
        return suggestions.map((s) => s.toString()).toList();
      }
      return null;
    } catch (e) {
      print('Error fetching address suggestions: $e');
      return null;
    }
  }
}

final mapsService = MapsService();
