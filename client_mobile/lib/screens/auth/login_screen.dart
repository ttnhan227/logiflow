import 'package:flutter/material.dart';
import '../../services/auth/auth_service.dart';
import '../../theme/app_theme.dart';
import '../main_layout.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _fillDemoCredentials(String username) {
    setState(() {
      _usernameController.text = username;
      _passwordController.text = 'password123';
      _errorMessage = null;
    });
  }

  Future<void> _login() async {
    if (_usernameController.text.trim().isEmpty || _passwordController.text.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter both username and password';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await authService.login(
        _usernameController.text.trim(),
        _passwordController.text,
      );

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const MainLayout()),
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.canvas,
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                  side: const BorderSide(color: AppTheme.border, width: 1.2),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
                  child: AutofillGroup(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Web-Aligned Brand Logotype
                        Row(
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: AppTheme.navy,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFF1E3A5F), width: 1),
                              ),
                              child: const Center(
                                child: Icon(
                                  Icons.hub_rounded,
                                  color: AppTheme.routeOrange,
                                  size: 20,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                RichText(
                                  text: const TextSpan(
                                    children: [
                                      TextSpan(
                                        text: 'LOGI',
                                        style: TextStyle(
                                          fontSize: 22,
                                          fontWeight: FontWeight.w900,
                                          color: AppTheme.navy,
                                          letterSpacing: -0.5,
                                        ),
                                      ),
                                      TextSpan(
                                        text: 'FLOW',
                                        style: TextStyle(
                                          fontSize: 22,
                                          fontWeight: FontWeight.w900,
                                          color: AppTheme.routeOrange,
                                          letterSpacing: -0.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Text(
                                  'ENTERPRISE FREIGHT PLATFORM',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.textMuted,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 22),
                        const Text(
                          'Operations Sign In',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.navy,
                            letterSpacing: -0.3,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Access linehaul dispatch, GPS radar, and customer manifests.',
                          style: TextStyle(
                            fontSize: 12.5,
                            color: AppTheme.textMuted,
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Quick 1-Tap Demo Credentials
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppTheme.canvas,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'QUICK DEMO ACCESS (1-TAP)',
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.textMuted,
                                  letterSpacing: 0.6,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    child: InkWell(
                                      onTap: () => _fillDemoCredentials('driver.mike'),
                                      borderRadius: BorderRadius.circular(6),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: AppTheme.borderStrong),
                                        ),
                                        child: const Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Icon(Icons.local_shipping_rounded, size: 14, color: AppTheme.primary),
                                            SizedBox(width: 4),
                                            Text(
                                              'Driver',
                                              style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppTheme.navy),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: InkWell(
                                      onTap: () => _fillDemoCredentials('alice.customer'),
                                      borderRadius: BorderRadius.circular(6),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: AppTheme.borderStrong),
                                        ),
                                        child: const Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Icon(Icons.business_rounded, size: 14, color: AppTheme.routeOrange),
                                            SizedBox(width: 4),
                                            Text(
                                              'Shipper',
                                              style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppTheme.navy),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),

                        TextField(
                          controller: _usernameController,
                          autofillHints: const [AutofillHints.username],
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            labelText: 'Username or ID',
                            prefixIcon: Icon(Icons.person_outline_rounded, size: 18),
                          ),
                          enabled: !_isLoading,
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _passwordController,
                          autofillHints: const [AutofillHints.password],
                          textInputAction: TextInputAction.done,
                          onSubmitted: (_) {
                            if (!_isLoading) _login();
                          },
                          decoration: const InputDecoration(
                            labelText: 'Password',
                            prefixIcon: Icon(Icons.lock_outline_rounded, size: 18),
                          ),
                          obscureText: true,
                          enabled: !_isLoading,
                        ),
                        if (_errorMessage != null) ...[
                          const SizedBox(height: 14),
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppTheme.dangerBg,
                              border: Border.all(
                                color: AppTheme.dangerBorder,
                              ),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(
                                  Icons.error_outline_rounded,
                                  size: 16,
                                  color: AppTheme.danger,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: const TextStyle(
                                      color: AppTheme.danger,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: _isLoading ? null : _login,
                          child: _isLoading
                              ? const SizedBox.square(
                                  dimension: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('Sign in to Operations'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
