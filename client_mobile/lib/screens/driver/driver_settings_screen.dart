import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../services/gps/gps_tracking_service.dart';

class DriverSettingsScreen extends StatefulWidget {
  const DriverSettingsScreen({super.key});

  @override
  State<DriverSettingsScreen> createState() => _DriverSettingsScreenState();
}

class _DriverSettingsScreenState extends State<DriverSettingsScreen> {
  bool _gpsTrackingEnabled = true;
  bool _autoAcceptOrders = false;
  bool _darkModeEnabled = false;
  String _language = 'English';
  LocationPermission _locationPermission = LocationPermission.denied;
  PermissionStatus _notificationPermission = PermissionStatus.denied;

  @override
  void initState() {
    super.initState();
    _loadSettings();
    _checkLocationPermission();
    _checkNotificationPermission();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    final gpsEnabled = prefs.getBool('gps_tracking_enabled') ?? true;
    print('DEBUG: GPS tracking enabled: $gpsEnabled');

    setState(() {
      _gpsTrackingEnabled = gpsEnabled;
      _autoAcceptOrders = prefs.getBool('auto_accept_orders') ?? false;
      _darkModeEnabled = prefs.getBool('dark_mode_enabled') ?? false;
      _language = prefs.getString('language') ?? 'English';
    });
  }

  Future<void> _checkNotificationPermission() async {
    try {
      final status = await Permission.notification.status;
      print('DEBUG: Notification permission status: $status');
      if (mounted) {
        setState(() {
          _notificationPermission = status;
        });
      }
    } catch (e) {
      print('ERROR: Failed to check notification permission: $e');
    }
  }

  Future<void> _checkLocationPermission() async {
    try {
      final permission = await Geolocator.checkPermission();
      print('DEBUG: Location permission status: $permission');
      if (mounted) {
        setState(() {
          _locationPermission = permission;
        });
      }
    } catch (e) {
      print('ERROR: Failed to check location permission: $e');
    }
  }

  Future<void> _saveSetting(String key, dynamic value) async {
    final prefs = await SharedPreferences.getInstance();
    if (value is bool) {
      await prefs.setBool(key, value);
    } else if (value is String) {
      await prefs.setString(key, value);
    }
  }

  Future<void> _requestLocationPermission() async {
    print('DEBUG: Requesting location permission...');

    // First check current permission
    var currentPermission = await Geolocator.checkPermission();
    print('DEBUG: Current permission before request: $currentPermission');

    // If we don't have any permission, request foreground first
    if (currentPermission == LocationPermission.denied || currentPermission == LocationPermission.deniedForever) {
      print('DEBUG: Requesting foreground permission first...');
      currentPermission = await Geolocator.requestPermission();
      print('DEBUG: Foreground permission result: $currentPermission');

      if (currentPermission == LocationPermission.denied || currentPermission == LocationPermission.deniedForever) {
        // User denied foreground permission
        setState(() {
          _locationPermission = currentPermission;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Location permission denied. Go to Settings → Apps → LogiFlow → Permissions'),
            duration: Duration(seconds: 5),
          ),
        );
        return;
      }
    }

    // If we have foreground permission, guide user to system settings for background
    if (currentPermission == LocationPermission.whileInUse) {
      print('DEBUG: Have foreground permission, guiding to system settings for background...');

      // Show dialog explaining they need to go to settings
      showDialog(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Text('Background Location Required'),
            content: const Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('For GPS tracking to work when the app is closed, you need to allow background location.'),
                SizedBox(height: 16),
                Text('Please go to:'),
                Text('Settings → Apps → LogiFlow → Permissions → Location'),
                Text('Then select "Allow all the time"'),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  // Open app settings
                  openAppSettings();
                },
                child: const Text('Open Settings'),
              ),
            ],
          );
        },
      );
      return;
    }

    // If we already have background permission, just update state
    setState(() {
      _locationPermission = currentPermission;
    });

    if (currentPermission == LocationPermission.always) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Background location permission granted!')),
      );
    }
  }

  Future<void> _requestNotificationPermission() async {
    final status = await Permission.notification.request();
    setState(() {
      _notificationPermission = status;
    });

    if (status == PermissionStatus.granted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Notification permission granted')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Notification permission needed for order alerts')),
      );
    }
  }

  String _getNotificationPermissionStatusText() {
    switch (_notificationPermission) {
      case PermissionStatus.granted:
        return 'Granted (Notifications enabled)';
      case PermissionStatus.denied:
        return 'Denied (No notifications)';
      case PermissionStatus.permanentlyDenied:
        return 'Permanently denied (Enable in settings)';
      case PermissionStatus.restricted:
        return 'Restricted (Limited notifications)';
      case PermissionStatus.limited:
        return 'Limited (Some notifications)';
      default:
        return 'Unknown';
    }
  }

  Color _getNotificationPermissionStatusColor() {
    switch (_notificationPermission) {
      case PermissionStatus.granted:
        return Colors.green;
      case PermissionStatus.denied:
      case PermissionStatus.permanentlyDenied:
        return Colors.red;
      case PermissionStatus.restricted:
      case PermissionStatus.limited:
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String _getPermissionStatusText() {
    switch (_locationPermission) {
      case LocationPermission.always:
        return 'Always (Background tracking enabled)';
      case LocationPermission.whileInUse:
        return 'While using app (Limited tracking)';
      case LocationPermission.denied:
        return 'Denied (GPS tracking disabled)';
      case LocationPermission.deniedForever:
        return 'Permanently denied (Enable in settings)';
      default:
        return 'Unknown';
    }
  }

  Color _getPermissionStatusColor() {
    switch (_locationPermission) {
      case LocationPermission.always:
        return Colors.green;
      case LocationPermission.whileInUse:
        return Colors.orange;
      case LocationPermission.denied:
      case LocationPermission.deniedForever:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () async {
              await _checkLocationPermission();
              await _checkNotificationPermission();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Permissions refreshed')),
              );
            },
            tooltip: 'Refresh permissions',
          ),
        ],
      ),
      body: ListView(
        children: [
          _buildSectionHeader('Permissions'),
          _buildSwitchTile(
            'Notifications',
            'Allow notifications for order updates and alerts',
            _notificationPermission == PermissionStatus.granted,
            (value) async {
              if (value && _notificationPermission != PermissionStatus.granted) {
                await _requestNotificationPermission();
              } else if (!value) {
                // Can't programmatically disable permissions, but show message
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Disable notifications in system settings')),
                );
              }
            },
          ),
          ListTile(
            title: const Text('Location Access'),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_locationPermission == LocationPermission.always
                    ? '✅ Background location enabled - GPS works even when app is closed'
                    : _locationPermission == LocationPermission.whileInUse
                        ? '⚠️ Limited location - GPS stops when app is closed'
                        : '❌ Location access needed for delivery tracking'),
                if (_locationPermission != LocationPermission.always) ...[
                  const SizedBox(height: 4),
                  const Text(
                    'Required for tracking deliveries when app is not open',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ],
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_locationPermission == LocationPermission.always)
                  const Icon(Icons.check_circle, color: Colors.green)
                else
                  ElevatedButton(
                    onPressed: _requestLocationPermission,
                    child: Text(_locationPermission == LocationPermission.denied
                        ? 'Grant Access'
                        : 'Allow Always'),
                  ),
                IconButton(
                  icon: const Icon(Icons.settings, size: 20),
                  onPressed: () => openAppSettings(),
                  tooltip: 'Open app settings',
                ),
              ],
            ),
            onTap: _locationPermission != LocationPermission.always
                ? _requestLocationPermission
                : null,
          ),

          _buildSectionHeader('GPS & Location'),
          SwitchListTile(
            title: const Text('GPS Tracking'),
            subtitle: Text(_locationPermission == LocationPermission.always
                ? 'Allow the app to track your location during deliveries'
                : 'Background location permission required for GPS tracking'),
            value: _gpsTrackingEnabled && _locationPermission == LocationPermission.always,
            onChanged: _locationPermission == LocationPermission.always
                ? (value) async {
                    setState(() => _gpsTrackingEnabled = value);
                    await _saveSetting('gps_tracking_enabled', value);

                    // If disabling GPS tracking, stop any current tracking
                    if (!value && gpsTrackingService.isTracking) {
                      print('User disabled GPS tracking - stopping current tracking');
                      gpsTrackingService.disconnect();
                    }
                  }
                : null, // Disable toggle if no background permission
          ),

          _buildSectionHeader('Delivery Preferences'),
          _buildSwitchTile(
            'Auto-accept Orders',
            'Automatically accept incoming delivery orders',
            _autoAcceptOrders,
            (value) {
              setState(() => _autoAcceptOrders = value);
              _saveSetting('auto_accept_orders', value);
            },
          ),

          _buildSectionHeader('Appearance'),
          _buildSwitchTile(
            'Dark Mode',
            'Use dark theme for the app interface',
            _darkModeEnabled,
            (value) {
              setState(() => _darkModeEnabled = value);
              _saveSetting('dark_mode_enabled', value);
              // Note: Actual theme switching would require app restart or theme provider
            },
          ),

          _buildSectionHeader('Language'),
          _buildDropdownTile(
            'Language',
            'Select your preferred language',
            _language,
            ['English', 'Vietnamese', 'Spanish'],
            (value) {
              setState(() => _language = value!);
              _saveSetting('language', value);
            },
          ),

          _buildSectionHeader('Account'),
          _buildListTile(
            'Privacy Policy',
            'Read our privacy policy',
            Icons.privacy_tip,
            () {
              // TODO: Navigate to privacy policy
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Privacy policy not implemented yet')),
              );
            },
          ),
          _buildListTile(
            'Terms of Service',
            'Read our terms of service',
            Icons.description,
            () {
              // TODO: Navigate to terms of service
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Terms of service not implemented yet')),
              );
            },
          ),
          _buildListTile(
            'About',
            'App version and information',
            Icons.info,
            () {
              showAboutDialog(
                context: context,
                applicationName: 'LogiFlow Driver',
                applicationVersion: '1.0.0',
                applicationLegalese: '© 2025 LogiFlow',
              );
            },
          ),

          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Settings are saved automatically',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Colors.blue,
        ),
      ),
    );
  }

  Widget _buildSwitchTile(String title, String subtitle, bool value, ValueChanged<bool> onChanged) {
    return SwitchListTile(
      title: Text(title),
      subtitle: Text(subtitle),
      value: value,
      onChanged: onChanged,
    );
  }

  Widget _buildInfoTile(String title, String subtitle, Color color, {Widget? trailing}) {
    return ListTile(
      title: Text(title),
      subtitle: Text(
        subtitle,
        style: TextStyle(color: color),
      ),
      trailing: trailing,
    );
  }

  Widget _buildDropdownTile(String title, String subtitle, String value, List<String> items, ValueChanged<String?> onChanged) {
    return ListTile(
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: DropdownButton<String>(
        value: value,
        items: items.map((item) {
          return DropdownMenuItem<String>(
            value: item,
            child: Text(item),
          );
        }).toList(),
        onChanged: onChanged,
      ),
    );
  }

  Widget _buildListTile(String title, String subtitle, IconData icon, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
