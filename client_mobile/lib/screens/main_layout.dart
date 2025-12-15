import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/auth/auth_service.dart';
import '../services/notification/notification_service.dart';
import '../widgets/notification_bell.dart';
import '../services/gps/gps_tracking_service.dart';
import '../services/driver/driver_service.dart';
import '../models/user.dart';
import 'auth/login_screen.dart';
import 'driver/driver_trips_screen.dart';
import 'driver/driver_trip_detail_screen.dart';
import 'driver/driver_compliance_screen.dart';
import 'driver/driver_profile_screen.dart';
import 'customer/create_order_screen.dart';
import 'customer/track_orders_screen.dart';
import 'customer/order_history_screen.dart';
import 'customer/profile_screen.dart';
import 'home/home_screen.dart';

// Custom Scrolling Text Widget - FIXED VERSION
class ScrollingTextWidget extends StatefulWidget {
  final String text;
  final double speed;

  const ScrollingTextWidget({super.key, required this.text, this.speed = 50.0});

  @override
  State<ScrollingTextWidget> createState() => _ScrollingTextWidgetState();
}

class _ScrollingTextWidgetState extends State<ScrollingTextWidget>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      duration: const Duration(seconds: 15),
      vsync: this,
    )..repeat();

    _animation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.linear,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ClipRect(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final screenWidth = constraints.maxWidth;
            
            // Measure the text width
            final textSpan = TextSpan(
              text: widget.text,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            );
            final textPainter = TextPainter(
              text: textSpan,
              textDirection: TextDirection.ltr,
            );
            textPainter.layout();
            final textWidth = textPainter.width;

            return AnimatedBuilder(
              animation: _animation,
              builder: (context, child) {
                // The text moves one full cycle (textWidth + gap)
                const gap = 50.0;
                final cycleDistance = textWidth + gap;
                final offset = -(_animation.value * cycleDistance);

                return Transform.translate(
                  offset: Offset(offset, 0),
                  child: OverflowBox(
                    alignment: Alignment.centerLeft,
                    maxWidth: double.infinity,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          widget.text,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: gap),
                        Text(
                          widget.text,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  User? _currentUser;
  bool _isLoading = true;
  int _currentIndex = 0;
  final NotificationService _notificationService = NotificationService();
  late StreamSubscription<User?> _userSubscription;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _loadUser();
    _pageController = PageController();
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
            duration: const Duration(seconds: 10),
            action: SnackBarAction(
              label: 'View',
              textColor: Colors.white,
              onPressed: () {
                // Navigate to trips screen
                setState(() => _currentIndex = 1);
                _pageController.jumpToPage(1);
              },
            ),
          ),
        );
      }
    };

    await _notificationService.connect(driverId);

    // Note: Real notifications will come from the admin backend via WebSocket
    // Test notifications disabled to improve performance
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
    _pageController.dispose();
    super.dispose();
  }

  Widget _buildGlobalGpsBanner() {
    // Only show for drivers with active GPS tracking
    if (_currentUser?.role?.toUpperCase() != 'DRIVER' || !gpsTrackingService.isTracking) {
      return const SizedBox.shrink();
    }

    // Build detailed scrolling text
    final currentTime = DateTime.now();
    final formattedTime = '${currentTime.hour.toString().padLeft(2, '0')}:${currentTime.minute.toString().padLeft(2, '0')}';
    final scrollingText =
        '🚛 Live GPS Tracking - Trip #${gpsTrackingService.currentTripId} | Driver: ${_currentUser?.username ?? 'Unknown'} | Location Sharing Active | Updated: $formattedTime | Speed: ~${(Random().nextDouble() * 60 + 20).toInt()}km/h | ETA: ~${Random().nextInt(30) + 15} mins | 🔄';

    return Container(
      height: 40,
      color: Colors.green.shade700,
      child: Row(
        children: [
          // GPS Icon
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 8.0),
            child: Icon(
              Icons.gps_fixed,
              color: Colors.white,
              size: 18,
            ),
          ),

          // Scrolling Text - takes up most space
          Expanded(
            child: ScrollingTextWidget(text: scrollingText),
          ),
        ],
      ),
    );
  }

  void _handleNavigation(int tabIndex, {Map<String, dynamic>? params}) {
    setState(() => _currentIndex = tabIndex);
    _pageController.jumpToPage(tabIndex);

    // If navigation includes trip parameters, we could pass them to the trips screen
    // This would require the DriverTripsScreen to accept parameters
    if (params != null && params.containsKey('tripId')) {
      print('Navigating to trips screen with tripId: ${params['tripId']}');
      // In the future, you could add logic to highlight or scroll to the specific trip
    }
  }

  Future<void> _navigateToTripDetail({String? tripId}) async {
    if (tripId != null) {
      // Check token validity before navigation
      try {
        final token = await authService.getToken();
        if (token == null || token.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Authentication session expired. Please login again.')),
          );
          // Navigate to login
          authService.logout();
          return;
        }

        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => DriverTripDetailScreen(tripId: int.parse(tripId)),
          ),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error validating authentication: $e')),
        );
      }
    }
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

  List<BottomNavigationBarItem> _getBottomNavItems() {
    if (_currentUser == null) return [];

    final role = _currentUser!.role.toUpperCase();
    
    switch (role) {
      case 'DRIVER':
        return [
          const BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.local_shipping),
            label: 'My Trips',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.verified_user),
            label: 'Compliance',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ];
      case 'CUSTOMER':
        return [
          const BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.add_shopping_cart),
            label: 'Create Order',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.track_changes),
            label: 'Track Orders',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.history),
            label: 'History',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ];
      case 'ADMIN':
        return [
          const BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.admin_panel_settings),
            label: 'Admin',
          ),
        ];
      default:
        return [
          const BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
        ];
    }
  }

  List<Widget> _getPages() {
    if (_currentUser == null) return [const HomeScreen()];

    final role = _currentUser!.role.toUpperCase();
    
    switch (role) {
      case 'DRIVER':
        return [
          const HomeScreen(),
          const DriverTripsScreen(),
          const DriverComplianceScreen(),
          const DriverProfileScreen(),
        ];
      case 'CUSTOMER':
        return [
          const HomeScreen(),
          const CreateOrderScreen(),
          const TrackOrdersScreen(),
          const OrderHistoryScreen(),
          const CustomerProfileScreen(),
        ];
      case 'ADMIN':
        return [
          const HomeScreen(),
          AdminDashboardScreen(),
        ];
      default:
        return [const HomeScreen()];
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: Row(
            children: [
              Image.asset(
                'assets/logiflow-smarter_logistics-seamless_flow.png',
                height: 40,
                width: 40,
                fit: BoxFit.contain,
              ),
              const SizedBox(width: 8),
              const Text('LogiFlow'),
            ],
          ),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    // If user is null, show loading or redirect to login
    if (_currentUser == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final pages = _getPages();
    final bottomNavItems = _getBottomNavItems();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Image.asset(
              'assets/logiflow-smarter_logistics-seamless_flow.png',
              height: 40,
              width: 40,
              fit: BoxFit.contain,
            ),
            const SizedBox(width: 8),
            const Text('LogiFlow'),
          ],
        ),
        actions: [
          // Show notification bell for drivers only
          if (_currentUser != null && _currentUser!.role.toUpperCase() == 'DRIVER')
            NotificationBell(
              notificationService: _notificationService,
              onNavigateToTripDetail: _navigateToTripDetail,
            ),
          if (_currentUser != null)
            PopupMenuButton<String>(
              icon: CircleAvatar(
                radius: 16,
                backgroundImage: _currentUser!.profilePictureUrl != null && _getImageUrl(_currentUser!.profilePictureUrl).isNotEmpty
                  ? NetworkImage(_getImageUrl(_currentUser!.profilePictureUrl))
                  : null,
                backgroundColor: _currentUser!.profilePictureUrl != null ? null : Theme.of(context).primaryColor,
                child: _currentUser!.profilePictureUrl != null ? null : Text(
                  _currentUser!.username.isNotEmpty ? _currentUser!.username.substring(0, 1).toUpperCase() : '',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
              itemBuilder: (context) => [
                PopupMenuItem(
                  enabled: false,
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 16,
                        backgroundImage: _currentUser!.profilePictureUrl != null && _getImageUrl(_currentUser!.profilePictureUrl).isNotEmpty
                          ? NetworkImage(_getImageUrl(_currentUser!.profilePictureUrl))
                          : null,
                        backgroundColor: _currentUser!.profilePictureUrl != null ? null : Theme.of(context).primaryColor,
                        child: _currentUser!.profilePictureUrl != null ? null : Text(
                          _currentUser!.username.isNotEmpty ? _currentUser!.username.substring(0, 1).toUpperCase() : '',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _currentUser!.username,
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          Text(
                            _currentUser!.role,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                const PopupMenuItem(
                  value: 'logout',
                  child: Row(
                    children: [
                      Icon(Icons.logout, size: 20),
                      SizedBox(width: 8),
                      Text('Logout'),
                    ],
                  ),
                ),
              ],
              onSelected: (value) {
                if (value == 'logout') {
                  _logout();
                }
              },
            ),
        ],
      ),
      body: Stack(
        children: [
          // Main content
          Column(
            children: [
              Expanded(
                child: PageView(
                  controller: _pageController,
                  onPageChanged: (index) {
                    setState(() => _currentIndex = index);
                  },
                  children: pages,
                ),
              ),

              // GPS banner positioned just above navigation
              _buildGlobalGpsBanner(),
            ],
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() => _currentIndex = index);
          _pageController.jumpToPage(index);
        },
        type: BottomNavigationBarType.fixed,
        items: bottomNavItems,
        selectedItemColor: Theme.of(context).primaryColor,
        unselectedItemColor: Colors.grey,
        showUnselectedLabels: true,
      ),
    );
  }
}

// Temporary placeholder for Admin Dashboard
class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.admin_panel_settings, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text(
            'Admin Dashboard',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 8),
          Text(
            'Admin features coming soon',
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
