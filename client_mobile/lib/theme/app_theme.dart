import 'package:flutter/material.dart';

/// Shared visual language for LogiFlow's enterprise mobile experience.
/// Aligned with the web design system (asphalt dark navy chrome, cobalt primary,
/// safety route orange, slate 50 canvas, and high-contrast status feedback).
abstract final class AppTheme {
  // Brand & Chrome Colors - Aligned with Web Design Tokens (tokens.css)
  static const navy = Color(0xFF071A2E); // Asphalt Navy (Slate 950)
  static const navyRaised = Color(0xFF0D253E); // Asphalt Header Accent
  static const primary = Color(0xFF176FAE); // Enterprise Brand Cobalt 600
  static const primaryDark = Color(0xFF104A75); // Brand 800
  static const primaryLight = Color(0xFFEAF5FB); // Brand 50
  static const routeOrange = Color(0xFFFF6714); // Route & Velocity Safety Orange
  static const routeOrangeDark = Color(0xFFD94F08);
  static const routeCyan = Color(0xFF44C5E1);
  
  // Surfaces & Borders
  static const canvas = Color(0xFFF3F6F8); // Slate 50
  static const surface = Color(0xFFFFFFFF);
  static const surfaceMuted = Color(0xFFEAF0F4); // Slate 100
  static const border = Color(0xFFD4E0E8); // Slate 200
  static const borderStrong = Color(0xFFCBD5E1); // Slate 300
  
  // Typography Colors
  static const text = Color(0xFF071A2E); // Deep Asphalt Text
  static const textMuted = Color(0xFF64748B); // Slate 500
  
  // Status Colors
  static const success = Color(0xFF16A34A); // Green 600
  static const successBg = Color(0xFFF0FDF4); // Green 50
  static const successBorder = Color(0xFFBBF7D0); // Green 200
  static const warning = Color(0xFFD97706); // Amber 600
  static const warningBg = Color(0xFFFFFBEB); // Amber 50
  static const warningBorder = Color(0xFFFDE68A); // Amber 200
  static const danger = Color(0xFFDC2626); // Red 600
  static const dangerBg = Color(0xFFFEF2F2); // Red 50
  static const dangerBorder = Color(0xFFFECACA); // Red 200
  static const info = Color(0xFF0284C7); // Sky 600
  static const infoBg = Color(0xFFF0F9FF); // Sky 50
  static const infoBorder = Color(0xFFBAE6FD); // Sky 200

  static final ColorScheme _scheme = const ColorScheme.light(
    primary: primary,
    onPrimary: Colors.white,
    primaryContainer: primaryLight,
    onPrimaryContainer: primaryDark,
    secondary: routeOrange,
    onSecondary: Colors.white,
    secondaryContainer: Color(0xFFFFF3EC),
    onSecondaryContainer: routeOrangeDark,
    error: danger,
    onError: Colors.white,
    errorContainer: dangerBg,
    onErrorContainer: Color(0xFF991B1B),
    surface: surface,
    onSurface: text,
    surfaceContainerHighest: surfaceMuted,
    outline: borderStrong,
    outlineVariant: border,
    shadow: Color(0x0A071A2E),
  );

  static ThemeData get light {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: _scheme,
      scaffoldBackgroundColor: canvas,
      fontFamily: 'Inter',
      visualDensity: VisualDensity.standard,
    );

    return base.copyWith(
      textTheme: base.textTheme.copyWith(
        headlineMedium: const TextStyle(
          color: text,
          fontSize: 24,
          height: 1.2,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
        ),
        headlineSmall: const TextStyle(
          color: text,
          fontSize: 20,
          height: 1.25,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.3,
        ),
        titleLarge: const TextStyle(
          color: text,
          fontSize: 17,
          height: 1.3,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.2,
        ),
        titleMedium: const TextStyle(
          color: text,
          fontSize: 14.5,
          height: 1.35,
          fontWeight: FontWeight.w600,
        ),
        bodyLarge: const TextStyle(color: text, fontSize: 14.5, height: 1.5),
        bodyMedium: const TextStyle(color: text, fontSize: 13, height: 1.45),
        bodySmall: const TextStyle(color: textMuted, fontSize: 11.5, height: 1.4),
        labelLarge: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, letterSpacing: 0.1),
        labelMedium: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600),
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: navy,
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        titleSpacing: 16,
        shape: Border(bottom: BorderSide(color: Color(0xFF0F2B48), width: 1)),
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 17,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.3,
        ),
        iconTheme: IconThemeData(color: Colors.white, size: 20),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        elevation: 8,
        backgroundColor: navy,
        selectedItemColor: routeOrange,
        unselectedItemColor: Color(0xFF94A3B8),
        selectedLabelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
        unselectedLabelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
        type: BottomNavigationBarType.fixed,
      ),
      cardTheme: const CardThemeData(
        color: surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          side: BorderSide(color: border, width: 1),
        ),
      ),
      dividerTheme: const DividerThemeData(color: border, thickness: 1, space: 1),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 13.5),
        hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13.5),
        helperStyle: const TextStyle(color: textMuted, fontSize: 11.5),
        errorStyle: const TextStyle(color: danger, fontSize: 11.5),
        border: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
          borderSide: BorderSide(color: borderStrong),
        ),
        enabledBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
          borderSide: BorderSide(color: border),
        ),
        focusedBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
          borderSide: BorderSide(color: routeOrange, width: 1.8),
        ),
        errorBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
          borderSide: BorderSide(color: danger),
        ),
        focusedErrorBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
          borderSide: BorderSide(color: danger, width: 1.8),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          minimumSize: const Size(48, 44),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          foregroundColor: Colors.white,
          backgroundColor: routeOrange,
          disabledBackgroundColor: const Color(0xFFE2E8F0),
          disabledForegroundColor: const Color(0xFF94A3B8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, letterSpacing: 0.1),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(48, 44),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          foregroundColor: navy,
          side: const BorderSide(color: borderStrong),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }

  /// Reusable high-contrast status pill badge matching web console styling
  static Widget buildStatusPill(String status) {
    Color bg;
    Color fg;
    Color border;
    final s = status.toUpperCase();
    if (s.contains('PROGRESS') || s.contains('TRANSIT')) {
      bg = const Color(0xFFFFF3EC);
      fg = routeOrange;
      border = const Color(0xFFFFD8C2);
    } else if (s.contains('DELIVERED') || s.contains('COMPLIANT') || s.contains('COMPLETED')) {
      bg = successBg;
      fg = success;
      border = successBorder;
    } else if (s.contains('PENDING') || s.contains('ASSIGNED') || s.contains('SCHEDULED')) {
      bg = infoBg;
      fg = primary;
      border = infoBorder;
    } else if (s.contains('DELAY') || s.contains('WARNING')) {
      bg = warningBg;
      fg = warning;
      border = warningBorder;
    } else if (s.contains('CANCEL') || s.contains('ERROR') || s.contains('NON_COMPLIANT')) {
      bg = dangerBg;
      fg = danger;
      border = dangerBorder;
    } else {
      bg = surfaceMuted;
      fg = textMuted;
      border = AppTheme.border;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: border, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 5,
            height: 5,
            decoration: BoxDecoration(color: fg, shape: BoxShape.circle),
          ),
          const SizedBox(width: 5),
          Text(
            status.replaceAll('_', ' ').toUpperCase(),
            style: TextStyle(
              color: fg,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.4,
            ),
          ),
        ],
      ),
    );
  }
  /// Enterprise standardized section card matching the web dispatch terminal
  static Widget buildDispatchCard({
    required String title,
    IconData? icon,
    Widget? trailing,
    required List<Widget> children,
    EdgeInsetsGeometry padding = const EdgeInsets.all(16),
    Color? headerIconColor,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: border, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
            decoration: const BoxDecoration(
              color: Color(0xFFF8FAFC),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(9),
                topRight: Radius.circular(9),
              ),
              border: Border(bottom: BorderSide(color: border, width: 1)),
            ),
            child: Row(
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 15, color: headerIconColor ?? primary),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: Text(
                    title.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.6,
                      color: text,
                    ),
                  ),
                ),
                if (trailing != null) trailing,
              ],
            ),
          ),
          Padding(
            padding: padding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children,
            ),
          ),
        ],
      ),
    );
  }

  /// Compact telemetry metric block (e.g., Weight, Distance, ETA, Hours)
  static Widget buildMetricTile({
    required String label,
    required String value,
    IconData? icon,
    Color? iconColor,
    String? unit,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: surfaceMuted,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: border, width: 0.8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                Icon(icon, size: 13, color: iconColor ?? textMuted),
                const SizedBox(width: 4),
              ],
              Text(
                label.toUpperCase(),
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.4,
                  color: textMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w800,
                  color: text,
                  letterSpacing: -0.2,
                ),
              ),
              if (unit != null) ...[
                const SizedBox(width: 3),
                Text(
                  unit,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: textMuted,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
