import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/constants/peshawar_constants.dart';
import 'core/router/app_router.dart';
import 'core/storage/secure_storage_service.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/application/providers/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final secureStorage = SecureStorageService();

  runApp(
    ProviderScope(
      overrides: [
        secureStorageProvider.overrideWithValue(secureStorage),
      ],
      child: PeshawarRentalApp(storage: secureStorage),
    ),
  );
}

class PeshawarRentalApp extends StatelessWidget {
  final SecureStorageService storage;
  const PeshawarRentalApp({super.key, required this.storage});

  @override
  Widget build(BuildContext context) {
    final router = createAppRouter(storage);

    return MaterialApp.router(
      title: PeshawarConstants.appName,
      theme: AppTheme.lightTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
