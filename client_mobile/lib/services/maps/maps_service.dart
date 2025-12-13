import '../api_client.dart';
import 'dart:convert';

class DistanceResult {
  final String totalDistance;
  final int distanceMeters;
  final String totalDuration;
  final int durationSeconds;

  DistanceResult({
    required this.totalDistance,
    required this.distanceMeters,
    required this.totalDuration,
    required this.durationSeconds,
  });

  factory DistanceResult.fromJson(Map<String, dynamic> json) {
    return DistanceResult(
      totalDistance: json['totalDistance'],
      distanceMeters: json['distanceMeters'],
      totalDuration: json['totalDuration'],
      durationSeconds: json['durationSeconds'],
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
      if (response.statusCode == 200) {
        return DistanceResult.fromJson(jsonDecode(response.body));
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
