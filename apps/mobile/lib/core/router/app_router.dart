import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../storage/secure_storage_service.dart';
import '../../features/onboarding/presentation/screens/onboarding_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/search/presentation/screens/search_screen.dart';
import '../../features/favorites/presentation/screens/favorites_screen.dart';
import '../../features/inquiries/presentation/screens/inquiries_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/property/presentation/screens/property_detail_screen.dart';
import '../../features/notifications/presentation/screens/notifications_screen.dart';
import '../../features/messages/presentation/screens/messages_screen.dart';
import '../../features/landlord/presentation/screens/landlord_dashboard_screen.dart';
import '../../features/landlord/presentation/screens/my_listings_screen.dart';
import '../../features/landlord/presentation/screens/create_listing_wizard_screen.dart';
import '../../features/landlord/presentation/screens/edit_listing_screen.dart';
import '../../features/landlord/presentation/screens/listing_analytics_screen.dart';
import '../../features/landlord/presentation/screens/landlord_inquiries_screen.dart';
import '../../features/landlord/presentation/screens/landlord_verification_screen.dart';
import '../theme/app_theme.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

GoRouter createAppRouter(SecureStorageService storage) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    redirect: (context, state) async {
      final onboardingDone = await storage.isOnboardingCompleted();
      final isOnboarding = state.matchedLocation == '/onboarding';

      if (!onboardingDone && !isOnboarding) {
        return '/onboarding';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/property/:idOrSlug',
        builder: (context, state) {
          final idOrSlug = state.pathParameters['idOrSlug'] ?? '';
          return PropertyDetailScreen(slugOrId: idOrSlug);
        },
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/messages',
        builder: (context, state) => const MessagesScreen(),
      ),
      GoRoute(
        path: '/landlord',
        builder: (context, state) => const LandlordDashboardScreen(),
      ),
      GoRoute(
        path: '/landlord/properties',
        builder: (context, state) => const MyListingsScreen(),
      ),
      GoRoute(
        path: '/landlord/properties/new',
        builder: (context, state) => const CreateListingWizardScreen(),
      ),
      GoRoute(
        path: '/landlord/properties/:id/edit',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return EditListingScreen(propertyId: id);
        },
      ),
      GoRoute(
        path: '/landlord/properties/:id/analytics',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return ListingAnalyticsScreen(propertyId: id);
        },
      ),
      GoRoute(
        path: '/landlord/inquiries',
        builder: (context, state) => const LandlordInquiriesScreen(),
      ),
      GoRoute(
        path: '/landlord/verification',
        builder: (context, state) => const LandlordVerificationScreen(),
      ),

      // Shell route for Bottom Navigation Bar
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) {
          return MainShellScaffold(child: child);
        },
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/search',
            builder: (context, state) => const SearchScreen(),
          ),
          GoRoute(
            path: '/favorites',
            builder: (context, state) => const FavoritesScreen(),
          ),
          GoRoute(
            path: '/inquiries',
            builder: (context, state) => const InquiriesScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
    ],
  );
}

class MainShellScaffold extends StatelessWidget {
  final Widget child;
  const MainShellScaffold({super.key, required this.child});

  int _calculateSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/search')) return 1;
    if (location.startsWith('/favorites')) return 2;
    if (location.startsWith('/inquiries')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go('/');
        break;
      case 1:
        context.go('/search');
        break;
      case 2:
        context.go('/favorites');
        break;
      case 3:
        context.go('/inquiries');
        break;
      case 4:
        context.go('/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _calculateSelectedIndex(context);

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (idx) => _onItemTapped(idx, context),
        indicatorColor: AppTheme.primaryEmerald.withValues(alpha: 0.15),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.explore_outlined),
            selectedIcon: Icon(Icons.explore, color: AppTheme.primaryEmerald),
            label: 'Explore',
          ),
          NavigationDestination(
            icon: Icon(Icons.search),
            selectedIcon: Icon(Icons.search, color: AppTheme.primaryEmerald),
            label: 'Search',
          ),
          NavigationDestination(
            icon: Icon(Icons.favorite_border),
            selectedIcon: Icon(Icons.favorite, color: AppTheme.primaryEmerald),
            label: 'Saved',
          ),
          NavigationDestination(
            icon: Icon(Icons.send_outlined),
            selectedIcon: Icon(Icons.send, color: AppTheme.primaryEmerald),
            label: 'Inquiries',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: AppTheme.primaryEmerald),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
