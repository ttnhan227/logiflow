import 'order.dart';

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
  final String? pickupTypes;

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
    this.pickupTypes,
  });

  factory DriverTrip.fromJson(Map<String, dynamic> json) {
    return DriverTrip(
      tripId: (json['tripId'] as num).toInt(),
      routeName: json['routeName'],
      status: json['status'],
      assignmentStatus: json['assignmentStatus'],
      scheduledDeparture: json['scheduledDeparture'],
      scheduledArrival: json['scheduledArrival'],
      vehiclePlate: json['vehiclePlate'],
      distance: json['distance']?.toDouble(),
      estimatedDuration: (json['estimatedDuration'] as num?)?.toInt(),
      departureLocation: json['departureLocation'],
      arrivalLocation: json['arrivalLocation'],
      pickupTypes: json['pickupTypes'],
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
      'pickupTypes': pickupTypes,
    };
  }
}

class DriverTripDetail {
  final int tripId;
  final String? routeName;
  final String? status;
  final String? assignmentStatus;
  final String? tripType;
  final String? scheduledDeparture;
  final String? scheduledArrival;
  final String? actualDeparture;
  final String? actualArrival;
  final String? vehiclePlate;
  final String? vehicleType;
  final int? vehicleCapacity;
  final String? delayReason;
  final int? slaExtensionMinutes;
  final String? delayStatus;
  final String? delayAdminComment;
  final List<DriverOrder>? orders;
  final String? notes;
  final double? driverLat;
  final double? driverLng;

  const DriverTripDetail({
    required this.tripId,
    this.routeName,
    this.status,
    this.assignmentStatus,
    this.tripType,
    this.scheduledDeparture,
    this.scheduledArrival,
    this.actualDeparture,
    this.actualArrival,
    this.vehiclePlate,
    this.vehicleType,
    this.vehicleCapacity,
    this.delayReason,
    this.slaExtensionMinutes,
    this.delayStatus,
    this.delayAdminComment,
    this.orders,
    this.notes,
    this.driverLat,
    this.driverLng,
  });

  factory DriverTripDetail.fromJson(Map<String, dynamic> json) {
    return DriverTripDetail(
      tripId: (json['tripId'] as num).toInt(),
      routeName: json['routeName'],
      status: json['status'],
      assignmentStatus: json['assignmentStatus'],
      tripType: json['tripType'],
      scheduledDeparture: json['scheduledDeparture'],
      scheduledArrival: json['scheduledArrival'],
      actualDeparture: json['actualDeparture'],
      actualArrival: json['actualArrival'],
      vehiclePlate: json['vehiclePlate'],
      vehicleType: json['vehicleType'],
      vehicleCapacity: json['vehicleCapacity'] is int
          ? json['vehicleCapacity']
          : (json['vehicleCapacity'] as num?)?.toInt(),
      delayReason: json['delayReason'],
      slaExtensionMinutes: json['slaExtensionMinutes'] is int
          ? json['slaExtensionMinutes']
          : (json['slaExtensionMinutes'] as num?)?.toInt(),
      delayStatus: json['delayStatus'],
      delayAdminComment: json['delayAdminComment'],
      orders: json['orders'] != null
          ? (json['orders'] as List)
                .map((o) => DriverOrder.fromJson(o))
                .toList()
          : null,
      notes: json['notes'],
      driverLat: json['driverLat']?.toDouble(),
      driverLng: json['driverLng']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'tripId': tripId,
      'routeName': routeName,
      'status': status,
      'assignmentStatus': assignmentStatus,
      'tripType': tripType,
      'scheduledDeparture': scheduledDeparture,
      'scheduledArrival': scheduledArrival,
      'actualDeparture': actualDeparture,
      'actualArrival': actualArrival,
      'vehiclePlate': vehiclePlate,
      'vehicleType': vehicleType,
      'vehicleCapacity': vehicleCapacity,
      'delayReason': delayReason,
      'slaExtensionMinutes': slaExtensionMinutes,
      'delayStatus': delayStatus,
      'delayAdminComment': delayAdminComment,
      'orders': orders?.map((o) => o.toJson()).toList(),
      'notes': notes,
      'driverLat': driverLat,
      'driverLng': driverLng,
    };
  }
}
