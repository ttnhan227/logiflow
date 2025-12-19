import 'dart:convert';
import '../api_client.dart';
import '../../models/customer/order.dart';
import '../../models/customer/customer_profile.dart';
import '../../models/customer/order_tracking.dart';
import '../../models/customer/order_history.dart';

class CustomerService {
  static const String baseEndpoint = '/customer/me';

  // Create new order
  Future<Order> createOrder(CreateOrderRequest request) async {
    try {
      final response = await apiClient.post(
        '$baseEndpoint/orders',
        body: request.toJson(),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return Order.fromJson(data);
      } else {
        throw Exception('Failed to create order: ${response.body}');
      }
    } catch (e) {
      throw Exception('Failed to create order: $e');
    }
  }

  // Get all my orders (summaries)
  Future<List<OrderSummary>> getMyOrders() async {
    try {
      final response = await apiClient.get('$baseEndpoint/orders');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as List;
        return data.map((item) => OrderSummary.fromJson(item)).toList();
      } else {
        throw Exception('Failed to get orders: ${response.body}');
      }
    } catch (e) {
      throw Exception('Failed to get orders: $e');
    }
  }

  // Get specific order details
  Future<Order> getOrderById(int orderId) async {
    try {
      final response = await apiClient.get('$baseEndpoint/orders/$orderId');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return Order.fromJson(data);
      } else {
        throw Exception('Failed to get order: ${response.body}');
      }
    } catch (e) {
      throw Exception('Failed to get order: $e');
    }
  }

  // Track order in real-time
  Future<TrackOrderResponse> trackOrder(int orderId) async {
    try {
      final response = await apiClient.get('$baseEndpoint/orders/$orderId/track');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return TrackOrderResponse.fromJson(data);
      } else {
        throw Exception('Failed to track order: ${response.body}');
      }
    } catch (e) {
      throw Exception('Failed to track order: $e');
    }
  }

  // Get customer profile
  Future<CustomerProfile> getProfile() async {
    try {
      final response = await apiClient.get('$baseEndpoint/profile');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return CustomerProfile.fromJson(data);
      } else {
        throw Exception('Failed to get profile: ${response.body}');
      }
    } catch (e) {
      throw Exception('Failed to get profile: $e');
    }
  }

  // Update customer profile
  Future<CustomerProfile> updateProfile(UpdateProfileRequest request) async {
    try {
      final response = await apiClient.put(
        '$baseEndpoint/profile',
        body: request.toJson(),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return CustomerProfile.fromJson(data);
      } else {
        throw Exception('Failed to update profile: ${response.body}');
      }
    } catch (e) {
      throw Exception('Failed to update profile: $e');
    }
  }

  // Get order history
  Future<List<OrderHistory>> getOrderHistory() async {
    try {
      final response = await apiClient.get('$baseEndpoint/history');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as List;
        return data.map((item) => OrderHistory.fromJson(item)).toList();
      } else {
        throw Exception('Failed to get order history: ${response.body}');
      }
    } catch (e) {
      throw Exception('Failed to get order history: $e');
    }
  }
}

// Singleton instance
final customerService = CustomerService();
