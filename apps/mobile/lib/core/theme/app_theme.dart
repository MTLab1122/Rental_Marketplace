import 'package:flutter/material.dart';

class AppTheme {
  // Peshawar Emerald Green Primary & Terracotta Accents
  static const Color primaryEmerald = Color(0xFF10B981);
  static const Color primaryEmeraldDark = Color(0xFF047857);
  static const Color accentTerracotta = Color(0xFFF97316);
  static const Color backgroundLight = Color(0xFFF8FAFC);
  static const Color surfaceWhite = Color(0xFFFFFFFF);
  static const Color textDark = Color(0xFF0F172A);

  // Eligibility specific colors
  static const Color studentsOnlyBg = Color(0xFFE0F2FE);
  static const Color studentsOnlyText = Color(0xFF0369A1);
  static const Color familiesOnlyBg = Color(0xFFFEF3C7);
  static const Color familiesOnlyText = Color(0xFFB45309);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryEmerald,
        primary: primaryEmerald,
        secondary: accentTerracotta,
        surface: surfaceWhite,
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: backgroundLight,
      appBarTheme: const AppBarTheme(
        backgroundColor: surfaceWhite,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: textDark),
        titleTextStyle: TextStyle(
          color: textDark,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

