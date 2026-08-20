import 'package:flutter_test/flutter_test.dart';
import 'package:client_mobile/models/user.dart';
import 'package:client_mobile/models/driver/trip.dart';
import 'package:client_mobile/models/driver/order.dart';

void main() {
  group('User Model Tests', () {
    test('User.fromAuthResponse parses login payload correctly', () {
      final json = {
        'username': 'driver_john',
        'role': 'DRIVER',
        'token': 'jwt-mock-token-xyz',
        'message': 'Login successful',
        'profilePictureUrl': 'https://example.com/avatar.png',
      };

      final user = User.fromAuthResponse(json);

      expect(user.username, 'driver_john');
      expect(user.role, 'DRIVER');
      expect(user.token, 'jwt-mock-token-xyz');
      expect(user.message, 'Login successful');
      expect(user.profilePictureUrl, 'https://example.com/avatar.png');
      expect(user.isLoggedIn, isTrue);
    });

    test('User.fromStored creates user without token', () {
      final json = {
        'username': 'customer_alice',
        'role': 'CUSTOMER',
        'profilePictureUrl': null,
      };

      final user = User.fromStored(json);

      expect(user.username, 'customer_alice');
      expect(user.role, 'CUSTOMER');
      expect(user.token, isNull);
      expect(user.isLoggedIn, isFalse);
    });

    test('User.toJson serializes properties for local storage', () {
      final user = User(
        username: 'admin_user',
        role: 'ADMIN',
        token: 'should-not-be-in-toJson',
        profilePictureUrl: 'https://example.com/admin.png',
      );

      final json = user.toJson();

      expect(json['username'], 'admin_user');
      expect(json['role'], 'ADMIN');
      expect(json['profilePictureUrl'], 'https://example.com/admin.png');
      expect(json.containsKey('token'), isFalse);
    });
  });

  group('DriverTrip Model Tests', () {
    test('DriverTrip.fromJson parses trip payload properly', () {
      final json = {
        'tripId': 101,
        'routeName': 'Route North-South',
        'status': 'IN_PROGRESS',
        'assignmentStatus': 'ACCEPTED',
        'scheduledDeparture': '2026-08-20T08:00:00Z',
        'scheduledArrival': '2026-08-20T17:00:00Z',
        'vehiclePlate': '51A-99999',
        'distance': 120.5,
        'estimatedDuration': 180,
        'departureLocation': 'Warehouse A',
        'arrivalLocation': 'Port B',
        'pickupTypes': 'CONTAINER',
      };

      final trip = DriverTrip.fromJson(json);

      expect(trip.tripId, 101);
      expect(trip.routeName, 'Route North-South');
      expect(trip.status, 'IN_PROGRESS');
      expect(trip.distance, 120.5);
      expect(trip.estimatedDuration, 180);
      expect(trip.vehiclePlate, '51A-99999');
    });

    test('DriverTripDetail.fromJson parses nested orders correctly', () {
      final json = {
        'tripId': 202,
        'routeName': 'Route East',
        'status': 'ASSIGNED',
        'tripType': 'STANDARD',
        'vehiclePlate': '29C-12345',
        'vehicleCapacity': 15,
        'orders': [
          {
            'orderId': 501,
            'customerName': 'Logistics Corp',
            'pickupAddress': '123 Harbor St',
            'deliveryAddress': '456 Market St',
            'weightTons': 8.5,
            'status': 'PENDING',
          }
        ],
        'driverLat': 10.7769,
        'driverLng': 106.7009,
      };

      final tripDetail = DriverTripDetail.fromJson(json);

      expect(tripDetail.tripId, 202);
      expect(tripDetail.vehicleCapacity, 15);
      expect(tripDetail.driverLat, 10.7769);
      expect(tripDetail.driverLng, 106.7009);
      expect(tripDetail.orders, isNotNull);
      expect(tripDetail.orders!.length, 1);
      expect(tripDetail.orders![0].orderId, 501);
      expect(tripDetail.orders![0].customerName, 'Logistics Corp');
    });
  });

  group('DriverOrder Model Tests', () {
    test('DriverOrder.fromJson parses and serializes order correctly', () {
      final json = {
        'orderId': 301,
        'customerName': 'Acme Supply',
        'customerPhone': '+84901234567',
        'pickupAddress': 'Point A',
        'deliveryAddress': 'Point B',
        'pickupLat': 10.8231,
        'pickupLng': 106.6297,
        'deliveryLat': 10.7626,
        'deliveryLng': 106.6602,
        'weightTons': 5.0,
        'packageValue': 15000.0,
        'distanceKm': 25.4,
        'status': 'DELIVERED',
        'priority': 'HIGH',
      };

      final order = DriverOrder.fromJson(json);

      expect(order.orderId, 301);
      expect(order.customerName, 'Acme Supply');
      expect(order.customerPhone, '+84901234567');
      expect(order.weightTons, 5.0);
      expect(order.distanceKm, 25.4);
      expect(order.status, 'DELIVERED');

      final serialized = order.toJson();
      expect(serialized['orderId'], 301);
      expect(serialized['customerName'], 'Acme Supply');
      expect(serialized['status'], 'DELIVERED');
    });
  });
}
