import '../api_client.dart';
import '../../models/picked_location.dart';
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

class GeocodeResult {
  final String formattedAddress;
  final double latitude;
  final double longitude;

  GeocodeResult({
    required this.formattedAddress,
    required this.latitude,
    required this.longitude,
  });

  factory GeocodeResult.fromJson(Map<String, dynamic> json) {
    // server thường trả latitude/longitude hoặc lat/lng
    final lat = (json['latitude'] ?? json['lat']) as num;
    final lng = (json['longitude'] ?? json['lng'] ?? json['lon']) as num;

    return GeocodeResult(
      formattedAddress:
          (json['formattedAddress'] ??
                  json['displayName'] ??
                  json['address'] ??
                  '')
              .toString(),
      latitude: lat.toDouble(),
      longitude: lng.toDouble(),
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

  Future<DistanceResult?> calculateDistance(
    String originAddress,
    String destinationAddress,
  ) async {
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

  Future<List<String>?> getBasicAddressSuggestions(
    String query, {
    int limit = 10,
  }) async {
    try {
      final response = await apiClient.get(
        '/maps/suggest-addresses?query=${Uri.encodeComponent(query)}&limit=$limit',
      );
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

  Future<GeocodeResult?> geocodeAddress(String address) async {
    final q = address.trim();
    if (q.isEmpty) return null;

    final res = await apiClient.get(
      '/maps/geocode?address=${Uri.encodeComponent(q)}',
    );

    // res là http.Response
    if (res.statusCode != 200) return null;

    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return GeocodeResult.fromJson(json);
  }

  Future<String?> reverseGeocode(double latitude, double longitude) async {
    try {
      final response = await apiClient.get(
        '/maps/reverse-geocode?lat=$latitude&lng=$longitude',
      );
      if (response.statusCode == 200) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        return json['address'] as String?;
      }
      return null;
    } catch (e) {
      print('Error reverse geocoding: $e');
      return null;
    }
  }
}

final mapsService = MapsService();
