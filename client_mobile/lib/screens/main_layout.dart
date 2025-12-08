import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/auth/auth_service.dart';
import '../services/notification/notification_service.dart';
import '../models/user.dart';
import 'auth/login_screen.dart';
import 'driver/driver_trips_screen.dart';
import 'driver/driver_schedule_screen.dart';
import 'driver/driver_compliance_screen.dart';
import 'customer/create_order_screen.dart';
import 'customer/track_orders_screen.dart';
import 'customer/order_history_screen.dart';
import 'customer/profile_screen.dart';
import 'home/home_screen.dart';

class MainLayout extends StatefulWidget {
  final Widget child;
  final String title;

  const MainLayout({
    super.key,
    required this.child,
    this.title = 'LogiFlow',
  });

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  User? _currentUser;
  bool _isLoading = true;
  final NotificationService _notificationService = NotificationService();
  late StreamSubscription<User?> _userSubscription;

  @override
  void initState() {
    super.initState();
    _loadUser();
    _userSubscription = authService.userStream.listen((user) {
      if (mounted) {
        setState(() => _currentUser = user);
      }
    });
  }

  Future<void> _loadUser() async {
    final user = await authService.getCurrentUser();
    if (mounted) {
      setState(() {
        _currentUser = user;
        _isLoading = false;
      });
      
      // Connect to notification service if user is a driver
      if (user != null && user.role.toUpperCase() == 'DRIVER') {
        await _connectNotifications(user.username);
      }
    }
  }

  Future<void> _connectNotifications(String driverId) async {
    _notificationService.onNotificationReceived = (notification) {
      // Show notification as SnackBar
      if (mounted) {
        final type = notification['type'] ?? 'INFO';
        final message = notification['message'] ?? 'New notification';
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: _getNotificationColor(type),
            duration: const Duration(seconds: 5),
            action: SnackBarAction(
              label: 'View',
              textColor: Colors.white,
              onPressed: () {
                // Navigate to trips screen
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const DriverTripsScreen()),
                );
              },
            ),
          ),
        );
      }
    };
    
    await _notificationService.connect(driverId);
  }

  Color _getNotificationColor(String type) {
    switch (type) {
      case 'TRIP_ASSIGNED':
        return Colors.blue;
      case 'TRIP_CANCELLED':
      case 'TRIP_CANCELLED_BY_DISPATCHER':
        return Colors.red;
      case 'TRIP_REROUTED':
      case 'TRIP_UPDATED':
        return Colors.orange;
      case 'TRIP_STATUS_UPDATE':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  @override
  void dispose() {
    _notificationService.disconnect();
    _userSubscription.cancel();
    super.dispose();
  }

  Future<void> _logout() async {
    await authService.logout();
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  String _getInitials(User? user) {
    if (user == null) return '';
    final name = user.username;
    return name.isNotEmpty
        ? name.substring(0, 1).toUpperCase()
        : '';
  }

  String _getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Base URL without /api (same as web client logic)
    return '${ApiClient.baseImageUrl}${imagePath.startsWith('/') ? '' : '/'}$imagePath';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            // Logo
            Image.asset(
              'assets/logiflow-smarter_logistics-seamless_flow.png',
              height: 40,
              width: 40,
              fit: BoxFit.contain,
            ),
            const SizedBox(width: 8),
            Text(widget.title),
          ],
        ),
      ),
      drawer: _buildDrawer(),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : widget.child,
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 50),
                const Text(
                  'LogiFlow',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Text(
                  'Smart Logistics Management',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          if (_currentUser != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              color: Theme.of(context).primaryColor.withOpacity(0.1),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundImage: _currentUser!.profilePictureUrl != null && _getImageUrl(_currentUser!.profilePictureUrl).isNotEmpty
                      ? NetworkImage(_getImageUrl(_currentUser!.profilePictureUrl))
                      : null,
                    backgroundColor: _currentUser!.profilePictureUrl != null ? null : Theme.of(context).primaryColor,
                    child: _currentUser!.profilePictureUrl != null ? null : Text(
                      _getInitials(_currentUser),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Hi, ${_currentUser!.username}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ListTile(
            leading: const Icon(Icons.home),
            title: const Text('Home'),
            onTap: () {
              Navigator.pop(context);
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (context) => const HomeScreen()),
              );
            },
          ),
          if (_currentUser != null && _currentUser!.role.toUpperCase() == 'DRIVER') ...[
            ListTile(
              leading: const Icon(Icons.local_shipping),
              title: const Text('My Trips'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const DriverTripsScreen()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.schedule),
              title: const Text('My Schedule'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const DriverScheduleScreen()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.verified_user),
              title: const Text('Compliance'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const DriverComplianceScreen()),
                );
              },
            ),
          ],
          if (_currentUser != null && _currentUser!.role.toUpperCase() == 'CUSTOMER') ...[
            ListTile(
              leading: const Icon(Icons.add_shopping_cart),
              title: const Text('Create Order'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const CreateOrderScreen()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.track_changes),
              title: const Text('Track Orders'),
              subtitle: const Text('Active deliveries'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const TrackOrdersScreen()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.history),
              title: const Text('Order History'),
              subtitle: const Text('Completed orders'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const OrderHistoryScreen()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.person),
              title: const Text('My Profile'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const CustomerProfileScreen()),
                );
              },
            ),
          ],
          if (_currentUser != null && _currentUser!.role.toUpperCase() == 'ADMIN') ...[
            ListTile(
              leading: const Icon(Icons.admin_panel_settings),
              title: const Text('Admin Dashboard'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Navigate to admin dashboard
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Admin dashboard coming soon')),
                );
              },
            ),
          ],
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Logout'),
            onTap: () {
              Navigator.pop(context);
              _logout();
            },
          ),
        ],
      ),
    );
  }
}
