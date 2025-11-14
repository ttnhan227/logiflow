import '../api_client.dart';
import 'dart:convert';

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
}

final mapsService = MapsService();
