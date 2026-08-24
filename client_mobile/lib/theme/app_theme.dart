import 'package:flutter/material.dart';

/// Shared visual language for LogiFlow's operational mobile experience.
/// Aligned with the enterprise design system (slate chrome, brand-600 accent,
/// refined typography, and high-contrast status feedback).
abstract final class AppTheme {
  // Brand & Chrome Colors
  static const navy = Color(0xFF0F172A); // Slate 900
  static const navyRaised = Color(0xFF1E293B); // Slate 800
  static const primary = Color(0xFF2563EB); // Brand 600
  static const primaryDark = Color(0xFF1D4ED8); // Brand 700
  static const primaryLight = Color(0xFFEFF6FF); // Brand 50
  
  // Surfaces & Borders
  static const canvas = Color(0xFFF8FAFC); // Slate 50
  static const surface = Color(0xFFFFFFFF);
  static const surfaceMuted = Color(0xFFF1F5F9); // Slate 100
  static const border = Color(0xFFE2E8F0); // Slate 200
  static const borderStrong = Color(0xFFCBD5E1); // Slate 300
  
  // Typography Colors
  static const text = Color(0xFF0F172A); // Slate 900
  static const textMuted = Color(0xFF64748B); // Slate 500
  
  // Status Colors
  static const success = Color(0xFF16A34A); // Green 600
  static const successBg = Color(0xFFF0FDF4); // Green 50
  static const warning = Color(0xFFD97706); // Amber 600
  static const warningBg = Color(0xFFFFFBEB); // Amber 50
  static const danger = Color(0xFFDC2626); // Red 600
  static const dangerBg = Color(0xFFFEF2F2); // Red 50

  static final ColorScheme _scheme = const ColorScheme.light(
    primary: primary,
    onPrimary: Colors.white,
    primaryContainer: Color(0xFFDBEAFE),
    onPrimaryContainer: primaryDark,
    secondary: Color(0xFF475569),
    onSecondary: Colors.white,
    secondaryContainer: Color(0xFFF1F5F9),
    onSecondaryContainer: text,
    error: danger,
    onError: Colors.white,
    errorContainer: Color(0xFFFEF2F2),
    onErrorContainer: Color(0xFF991B1B),
    surface: surface,
    onSurface: text,
    surfaceContainerHighest: surfaceMuted,
    outline: borderStrong,
    outlineVariant: border,
    shadow: Color(0x0D0F172A),
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
          fontSize: 26,
          height: 1.2,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.5,
        ),
        headlineSmall: const TextStyle(
          color: text,
          fontSize: 22,
          height: 1.25,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.3,
        ),
        titleLarge: const TextStyle(
          color: text,
          fontSize: 18,
          height: 1.3,
          fontWeight: FontWeight.w600,
        ),
        titleMedium: const TextStyle(
          color: text,
          fontSize: 15,
          height: 1.35,
          fontWeight: FontWeight.w600,
        ),
        bodyLarge: const TextStyle(color: text, fontSize: 15, height: 1.5),
        bodyMedium: const TextStyle(color: text, fontSize: 13.5, height: 1.45),
        bodySmall: const TextStyle(color: textMuted, fontSize: 12, height: 1.4),
        labelLarge: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        labelMedium: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: surface,
        foregroundColor: text,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        titleSpacing: 16,
        shape: Border(bottom: BorderSide(color: border, width: 1)),
        titleTextStyle: TextStyle(
          color: text,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
        iconTheme: IconThemeData(color: Color(0xFF334155), size: 22),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        elevation: 0,
        backgroundColor: surface,
        selectedItemColor: primary,
        unselectedItemColor: Color(0xFF64748B),
        selectedLabelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
        unselectedLabelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
        type: BottomNavigationBarType.fixed,
      ),
      navigationBarTheme: NavigationBarThemeData(
        elevation: 0,
        height: 68,
        backgroundColor: surface,
        indicatorColor: const Color(0xFFEFF6FF),
        labelTextStyle: WidgetStateProperty.resolveWith((states) => TextStyle(
          color: states.contains(WidgetState.selected) ? primary : textMuted,
          fontSize: 11,
          fontWeight: states.contains(WidgetState.selected)
              ? FontWeight.w700
              : FontWeight.w500,
        )),
      ),
      cardTheme: const CardTheme(
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
        labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 14),
        hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
        helperStyle: const TextStyle(color: textMuted, fontSize: 12),
        errorStyle: const TextStyle(color: danger, fontSize: 12),
        border: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(10)),
          borderSide: BorderSide(color: borderStrong),
        ),
        enabledBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(10)),
          borderSide: BorderSide(color: border),
        ),
        focusedBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(10)),
          borderSide: BorderSide(color: primary, width: 2),
        ),
        errorBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(10)),
          borderSide: BorderSide(color: danger),
        ),
        focusedErrorBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(10)),
          borderSide: BorderSide(color: danger, width: 2),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          minimumSize: const Size(48, 46),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          foregroundColor: Colors.white,
          backgroundColor: primary,
          disabledBackgroundColor: const Color(0xFFE2E8F0),
          disabledForegroundColor: const Color(0xFF94A3B8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, letterSpacing: 0.1),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(48, 46),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          backgroundColor: primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(48, 46),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          foregroundColor: const Color(0xFF334155),
          side: const BorderSide(color: borderStrong),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        elevation: 2,
        highlightElevation: 4,
        backgroundColor: primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: const Color(0xFFF1F5F9),
        selectedColor: const Color(0xFFEFF6FF),
        disabledColor: const Color(0xFFF1F5F9),
        side: const BorderSide(color: border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        labelStyle: const TextStyle(color: Color(0xFF334155), fontSize: 12, fontWeight: FontWeight.w600),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      ),
      dialogTheme: const DialogTheme(
        elevation: 6,
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
          side: BorderSide(color: border),
        ),
        titleTextStyle: TextStyle(color: text, fontSize: 18, fontWeight: FontWeight.w700),
        contentTextStyle: TextStyle(color: text, fontSize: 14, height: 1.5),
      ),
      snackBarTheme: const SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        elevation: 3,
        backgroundColor: navy,
        contentTextStyle: TextStyle(color: Colors.white, fontSize: 14),
        actionTextColor: Color(0xFF93C5FD),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: primary,
        linearTrackColor: Color(0xFFE2E8F0),
        circularTrackColor: Color(0xFFE2E8F0),
      ),
      popupMenuTheme: const PopupMenuThemeData(
        elevation: 4,
        color: surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          side: BorderSide(color: border),
        ),
      ),
      listTileTheme: const ListTileThemeData(
        dense: true,
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        iconColor: Color(0xFF475569),
        textColor: text,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
      ),
      dataTableTheme: const DataTableThemeData(
        headingRowColor: WidgetStatePropertyAll(surfaceMuted),
        headingTextStyle: TextStyle(
          color: Color(0xFF475569),
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: .4,
        ),
        dataTextStyle: TextStyle(color: text, fontSize: 13),
        dividerThickness: 1,
        horizontalMargin: 12,
        columnSpacing: 20,
      ),
    );
  }
}
