import 'dart:async';
import 'package:flutter/material.dart';
import 'screens/auth/login_screen.dart';
import 'screens/main_layout.dart';
import 'services/auth/auth_service.dart';
import 'models/user.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LogiFlow Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool? _isLoggedIn;
  late StreamSubscription<User?> _userSubscription;

  @override
  void initState() {
    super.initState();
    _checkAuthStatus();
    _userSubscription = authService.userStream.listen((user) {
      print('AuthWrapper: User stream updated - user: ${user?.username}');
      if (mounted) {
        setState(() {
          _isLoggedIn = user != null;
        });
        print('AuthWrapper: State updated - isLoggedIn: $_isLoggedIn');
      }
    });
  }

  Future<void> _checkAuthStatus() async {
    final isLoggedIn = await authService.isLoggedIn();
    if (mounted) {
      setState(() {
        _isLoggedIn = isLoggedIn;
      });
    }
  }

  @override
  void dispose() {
    _userSubscription.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Show loading while checking auth status
    if (_isLoggedIn == null) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    // Show appropriate screen based on auth status
    return _isLoggedIn! ? const MainLayout() : const LoginScreen();
  }
}
