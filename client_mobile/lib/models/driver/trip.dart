class DriverTrip {
  final int tripId;
  final String? routeName;
  final String? status;
  final String? assignmentStatus;
  final String? scheduledDeparture;
  final String? scheduledArrival;
  final String? vehiclePlate;
  final double? distance;
  final int? estimatedDuration;
  final String? departureLocation;
  final String? arrivalLocation;

  const DriverTrip({
    required this.tripId,
    this.routeName,
    this.status,
    this.assignmentStatus,
    this.scheduledDeparture,
    this.scheduledArrival,
    this.vehiclePlate,
    this.distance,
    this.estimatedDuration,
    this.departureLocation,
    this.arrivalLocation,
  });

  factory DriverTrip.fromJson(Map<String, dynamic> json) {
    return DriverTrip(
      tripId: json['tripId'],
      routeName: json['routeName'],
      status: json['status'],
      assignmentStatus: json['assignmentStatus'],
      scheduledDeparture: json['scheduledDeparture'],
      scheduledArrival: json['scheduledArrival'],
      vehiclePlate: json['vehiclePlate'],
      distance: json['distance']?.toDouble(),
      estimatedDuration: json['estimatedDuration'],
      departureLocation: json['departureLocation'],
      arrivalLocation: json['arrivalLocation'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'tripId': tripId,
      'routeName': routeName,
      'status': status,
      'assignmentStatus': assignmentStatus,
      'scheduledDeparture': scheduledDeparture,
      'scheduledArrival': scheduledArrival,
      'vehiclePlate': vehiclePlate,
      'distance': distance,
      'estimatedDuration': estimatedDuration,
      'departureLocation': departureLocation,
      'arrivalLocation': arrivalLocation,
    };
  }
}

class DriverTripDetail {
  final int tripId;
  final String? routeName;
  final String? status;
  final String? assignmentStatus;
  final String? scheduledDeparture;
  final String? scheduledArrival;
  final String? actualDeparture;
  final String? actualArrival;
  final String? vehiclePlate;
  final String? vehicleType;
  final double? distance;
  final int? estimatedDuration;
  final String? departureLocation;
  final String? arrivalLocation;
  final List<dynamic>? orders; // Could be typed further if needed
  final String? notes;

  const DriverTripDetail({
    required this.tripId,
    this.routeName,
    this.status,
    this.assignmentStatus,
    this.scheduledDeparture,
    this.scheduledArrival,
    this.actualDeparture,
    this.actualArrival,
    this.vehiclePlate,
    this.vehicleType,
    this.distance,
    this.estimatedDuration,
    this.departureLocation,
    this.arrivalLocation,
    this.orders,
    this.notes,
  });

  factory DriverTripDetail.fromJson(Map<String, dynamic> json) {
    return DriverTripDetail(
      tripId: json['tripId'],
      routeName: json['routeName'],
      status: json['status'],
      assignmentStatus: json['assignmentStatus'],
      scheduledDeparture: json['scheduledDeparture'],
      scheduledArrival: json['scheduledArrival'],
      actualDeparture: json['actualDeparture'],
      actualArrival: json['actualArrival'],
      vehiclePlate: json['vehiclePlate'],
      vehicleType: json['vehicleType'],
      distance: json['distance']?.toDouble(),
      estimatedDuration: json['estimatedDuration'],
      departureLocation: json['departureLocation'],
      arrivalLocation: json['arrivalLocation'],
      orders: json['orders'] as List<dynamic>?,
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'tripId': tripId,
      'routeName': routeName,
      'status': status,
      'assignmentStatus': assignmentStatus,
      'scheduledDeparture': scheduledDeparture,
      'scheduledArrival': scheduledArrival,
      'actualDeparture': actualDeparture,
      'actualArrival': actualArrival,
      'vehiclePlate': vehiclePlate,
      'vehicleType': vehicleType,
      'distance': distance,
      'estimatedDuration': estimatedDuration,
      'departureLocation': departureLocation,
      'arrivalLocation': arrivalLocation,
      'orders': orders,
      'notes': notes,
    };
  }
}
