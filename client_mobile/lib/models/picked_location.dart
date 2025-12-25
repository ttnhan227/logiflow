class PickedLocation {
  final double lat;
  final double lng;
  final String displayText;
  final Map<String, dynamic>? routeData; // For dual-point selection

  PickedLocation({
    required this.lat,
    required this.lng,
    required this.displayText,
    this.routeData,
  });
}
