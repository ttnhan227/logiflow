import 'package:flutter/material.dart';

/// Shared visual language for LogiFlow's operational mobile experience.
/// The palette is deliberately restrained so status and task priority remain
/// more prominent than decoration.
abstract final class AppTheme {
  static const navy = Color(0xFF172033);
  static const navyRaised = Color(0xFF242F44);
  static const primary = Color(0xFF1D4ED8);
  static const primaryDark = Color(0xFF1E3A8A);
  static const canvas = Color(0xFFF3F5F7);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceMuted = Color(0xFFF8F9FB);
  static const border = Color(0xFFD9DEE7);
  static const borderStrong = Color(0xFFC4CAD5);
  static const text = Color(0xFF172033);
  static const textMuted = Color(0xFF5B667A);
  static const success = Color(0xFF15803D);
  static const warning = Color(0xFFB45309);
  static const danger = Color(0xFFB42318);

  static final ColorScheme _scheme = const ColorScheme.light(
    primary: primary,
    onPrimary: Colors.white,
    primaryContainer: Color(0xFFEAF0FB),
    onPrimaryContainer: primaryDark,
    secondary: Color(0xFF475467),
    onSecondary: Colors.white,
    secondaryContainer: Color(0xFFEAECF0),
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
    shadow: Color(0x1A101828),
  );

  static ThemeData get light {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: _scheme,
      scaffoldBackgroundColor: canvas,
      fontFamily: 'Roboto',
      visualDensity: VisualDensity.standard,
    );

    return base.copyWith(
      textTheme: base.textTheme.copyWith(
        headlineSmall: const TextStyle(
          color: text,
          fontSize: 22,
          height: 1.25,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.25,
        ),
        titleLarge: const TextStyle(
          color: text,
          fontSize: 20,
          height: 1.3,
          fontWeight: FontWeight.w600,
        ),
        titleMedium: const TextStyle(
          color: text,
          fontSize: 16,
          height: 1.35,
          fontWeight: FontWeight.w600,
        ),
        bodyLarge: const TextStyle(color: text, fontSize: 16, height: 1.5),
        bodyMedium: const TextStyle(color: text, fontSize: 14, height: 1.45),
        bodySmall: const TextStyle(color: textMuted, fontSize: 12, height: 1.4),
        labelLarge: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        labelMedium: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 1,
        backgroundColor: surface,
        foregroundColor: text,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        titleSpacing: 16,
        shape: Border(bottom: BorderSide(color: border)),
        titleTextStyle: TextStyle(
          color: text,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        iconTheme: IconThemeData(color: Color(0xFF344054), size: 22),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        elevation: 0,
        backgroundColor: surface,
        selectedItemColor: primaryDark,
        unselectedItemColor: Color(0xFF667085),
        selectedLabelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        unselectedLabelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
        type: BottomNavigationBarType.fixed,
      ),
      navigationBarTheme: NavigationBarThemeData(
        elevation: 0,
        height: 68,
        backgroundColor: surface,
        indicatorColor: const Color(0xFFEAF0FB),
        labelTextStyle: WidgetStateProperty.resolveWith((states) => TextStyle(
          color: states.contains(WidgetState.selected) ? primaryDark : textMuted,
          fontSize: 11,
          fontWeight: states.contains(WidgetState.selected)
              ? FontWeight.w600
              : FontWeight.w500,
        )),
      ),
      cardTheme: const CardThemeData(
        color: surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(6)),
          side: BorderSide(color: border),
        ),
      ),
      dividerTheme: const DividerThemeData(color: border, thickness: 1, space: 1),
      inputDecorationTheme: const InputDecorationTheme(
        filled: true,
        fillColor: surface,
        isDense: true,
        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 13),
        labelStyle: TextStyle(color: Color(0xFF475467), fontSize: 14),
        hintStyle: TextStyle(color: Color(0xFF98A2B3), fontSize: 14),
        helperStyle: TextStyle(color: textMuted, fontSize: 12),
        errorStyle: TextStyle(color: danger, fontSize: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(4)),
          borderSide: BorderSide(color: borderStrong),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(4)),
          borderSide: BorderSide(color: borderStrong),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(4)),
          borderSide: BorderSide(color: primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(4)),
          borderSide: BorderSide(color: danger),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(4)),
          borderSide: BorderSide(color: danger, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          minimumSize: const Size(48, 44),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          foregroundColor: Colors.white,
          backgroundColor: primary,
          disabledBackgroundColor: const Color(0xFFD0D5DD),
          disabledForegroundColor: const Color(0xFF667085),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(48, 44),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          backgroundColor: primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(48, 44),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          foregroundColor: const Color(0xFF344054),
          side: const BorderSide(color: borderStrong),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryDark,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        elevation: 1,
        highlightElevation: 2,
        backgroundColor: primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(6))),
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: const Color(0xFFF2F4F7),
        selectedColor: const Color(0xFFEAF0FB),
        disabledColor: const Color(0xFFF2F4F7),
        side: const BorderSide(color: border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        labelStyle: const TextStyle(color: Color(0xFF344054), fontSize: 12, fontWeight: FontWeight.w600),
        padding: const EdgeInsets.symmetric(horizontal: 6),
      ),
      dialogTheme: const DialogThemeData(
        elevation: 6,
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(6)),
          side: BorderSide(color: border),
        ),
        titleTextStyle: TextStyle(color: text, fontSize: 18, fontWeight: FontWeight.w600),
        contentTextStyle: TextStyle(color: text, fontSize: 14, height: 1.5),
      ),
      snackBarTheme: const SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        elevation: 2,
        backgroundColor: navy,
        contentTextStyle: TextStyle(color: Colors.white, fontSize: 14),
        actionTextColor: Color(0xFFBFDBFE),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(4))),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: primary,
        linearTrackColor: Color(0xFFE4E7EC),
        circularTrackColor: Color(0xFFE4E7EC),
      ),
      popupMenuTheme: const PopupMenuThemeData(
        elevation: 4,
        color: surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(6)),
          side: BorderSide(color: border),
        ),
      ),
      listTileTheme: const ListTileThemeData(
        dense: true,
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 2),
        iconColor: Color(0xFF475467),
        textColor: text,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(4))),
      ),
      dataTableTheme: const DataTableThemeData(
        headingRowColor: WidgetStatePropertyAll(surfaceMuted),
        headingTextStyle: TextStyle(
          color: Color(0xFF475467),
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
