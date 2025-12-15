import 'package:flutter/material.dart';
import '../services/notification/notification_service.dart';

class NotificationBell extends StatefulWidget {
  final NotificationService notificationService;
  final Function({String? tripId})? onNavigateToTripDetail;

  const NotificationBell({
    Key? key,
    required this.notificationService,
    this.onNavigateToTripDetail,
  }) : super(key: key);

  @override
  _NotificationBellState createState() => _NotificationBellState();
}

class _NotificationBellState extends State<NotificationBell> {
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    // Listen for notification updates
    widget.notificationService.onNotificationReceived = _onNotificationReceived;
    _updateUnreadCount();
  }

  void _onNotificationReceived(Map<String, dynamic> notification) {
    setState(() {
      _updateUnreadCount();
    });
  }

  void _updateUnreadCount() {
    setState(() {
      _unreadCount = widget.notificationService.getUnreadNotificationCount();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        IconButton(
          icon: const Icon(Icons.notifications, size: 28),
          onPressed: () {
            // Navigate to a full notifications screen instead of bottom sheet
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => _NotificationsScreen(
                  notificationService: widget.notificationService,
                  onNavigateToTripDetail: widget.onNavigateToTripDetail,
                  onMarkAllRead: () {
                    setState(() {
                      _unreadCount = 0;
                    });
                  },
                ),
              ),
            );
          },
        ),
        if (_unreadCount > 0)
          Positioned(
            right: 8,
            top: 8,
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(10),
              ),
              constraints: const BoxConstraints(minWidth: 20, minHeight: 20),
              child: Text(
                _unreadCount > 99 ? '99+' : _unreadCount.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }

  String _formatTimestamp(dynamic timestamp) {
    if (timestamp == null) return '';
    try {
      final DateTime dateTime = DateTime.parse(timestamp.toString());
      final Duration diff = DateTime.now().difference(dateTime);

      if (diff.inMinutes < 1) {
        return 'Just now';
      } else if (diff.inMinutes < 60) {
        return '${diff.inMinutes}m ago';
      } else if (diff.inHours < 24) {
        return '${diff.inHours}h ago';
      } else {
        return '${diff.inDays}d ago';
      }
    } catch (e) {
      return '';
    }
  }
}

/// Full-screen notifications view
class _NotificationsScreen extends StatelessWidget {
  final NotificationService notificationService;
  final Function({String? tripId})? onNavigateToTripDetail;
  final VoidCallback onMarkAllRead;

  const _NotificationsScreen({
    Key? key,
    required this.notificationService,
    required this.onNavigateToTripDetail,
    required this.onMarkAllRead,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final notifications = notificationService.getAllNotifications();
    final unreadCount = notificationService.getUnreadNotificationCount();

    return Scaffold(
      appBar: AppBar(
        title: Text('Notifications (${notifications.length})'),
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: () async {
                await notificationService.markAllNotificationsAsRead();
                onMarkAllRead();
                Navigator.of(context).pop();
              },
              child: const Text(
                'Mark all read',
                style: TextStyle(color: Colors.white),
              ),
            ),
        ],
      ),
      body: notifications.isEmpty
          ? _buildEmptyState(context)
          : ListView.builder(
              itemCount: notifications.length,
              itemBuilder: (context, index) {
                final notification = notifications[index];
                return _buildNotificationItem(context, notification);
              },
            ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.notifications_off, size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'No notifications yet',
            style: TextStyle(fontSize: 18, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 8),
          Text(
            'Delay responses will appear here',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationItem(BuildContext context, Map<String, dynamic> notification) {
    // Determine notification type for styling
    final String message = notification['message'] ?? 'New notification';
    final bool isDelayResponse =
        message.contains('delay') || message.contains('SLA');
    final bool isApproved =
        message.contains('approved') || message.contains('extended');
    final bool isRead = notification['isRead'] == true;

    // Extract trip ID from message (e.g., "Trip #123")
    final RegExp tripRegExp = RegExp(r'Trip #(\d+)');
    final String? tripId = tripRegExp.firstMatch(message)?.group(1);

    return GestureDetector(
      onTap: () {
        if (tripId != null && onNavigateToTripDetail != null) {
          Navigator.of(context).pop();
          onNavigateToTripDetail!(tripId: tripId);
        } else if (tripId != null) {
          Navigator.of(context).pop();
          print('Navigate to trip details: $tripId');
        }
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        decoration: BoxDecoration(
          color: isRead
              ? Colors.grey.withOpacity(0.08)
              : (isApproved
                  ? Colors.green.withOpacity(0.1)
                  : message.contains('not be approved')
                      ? Colors.red.withOpacity(0.1)
                      : Colors.blue.withOpacity(0.1)),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isRead
                ? Colors.grey.withOpacity(0.2)
                : (isApproved
                    ? Colors.green.withOpacity(0.2)
                    : message.contains('not be approved')
                        ? Colors.red.withOpacity(0.2)
                        : Colors.blue.withOpacity(0.2)),
          ),
        ),
        child: ListTile(
          leading: Icon(
            isDelayResponse
                ? Icons.schedule
                : message.contains('approved')
                ? Icons.check_circle
                : message.contains('not be approved')
                ? Icons.cancel
                : Icons.info,
            color: isApproved
                ? Colors.green
                : message.contains('not be approved')
                ? Colors.red
                : Colors.blue,
            size: 28,
          ),
          title: Row(
            children: [
              Text(
                isDelayResponse ? 'Delay Response' : 'Notification',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              if (tripId != null) ...[
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                    print('Navigate to trip details: $tripId');
                  },
                  icon: const Icon(Icons.arrow_forward, size: 16),
                  label: Text('Trip #$tripId'),
                  style: TextButton.styleFrom(
                    foregroundColor: isApproved
                        ? Colors.green
                        : message.contains('not be approved')
                        ? Colors.red
                        : Colors.blue,
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              ],
            ],
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 4),
              Text(
                message,
                style: TextStyle(fontSize: 14, color: Colors.grey.shade800),
              ),
              const SizedBox(height: 4),
              Text(
                _formatTimestamp(notification['timestamp']),
                style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
              ),
            ],
          ),
          contentPadding: const EdgeInsets.all(16),
          isThreeLine: true,
        ),
      ),
    );
  }

  String _formatTimestamp(dynamic timestamp) {
    if (timestamp == null) return '';
    try {
      final DateTime dateTime = DateTime.parse(timestamp.toString());
      final Duration diff = DateTime.now().difference(dateTime);

      if (diff.inMinutes < 1) {
        return 'Just now';
      } else if (diff.inMinutes < 60) {
        return '${diff.inMinutes}m ago';
      } else if (diff.inHours < 24) {
        return '${diff.inHours}h ago';
      } else {
        return '${diff.inDays}d ago';
      }
    } catch (e) {
      return '';
    }
  }
}
