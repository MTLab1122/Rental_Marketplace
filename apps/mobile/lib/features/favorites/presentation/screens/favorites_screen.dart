import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/widgets/property_card.dart';
import '../../../../core/widgets/ui_feedback_widgets.dart';
import '../../../auth/application/providers/auth_provider.dart';
import '../../application/providers/favorites_provider.dart';

class FavoritesScreen extends ConsumerStatefulWidget {
  const FavoritesScreen({super.key});

  @override
  ConsumerState<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends ConsumerState<FavoritesScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(favoritesProvider.notifier).loadFavoriteProperties();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final favState = ref.watch(favoritesProvider);

    if (!authState.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Saved Rentals')),
        body: EmptyView(
          icon: Icons.favorite_border,
          title: 'Sign In to View Saved Rentals',
          description:
              'Keep track of your favorite Peshawar properties across sessions.',
          actionText: 'Sign In',
          onAction: () => context.push('/login'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Saved Rentals'),
      ),
      body: favState.isLoading
          ? const LoadingIndicator(message: 'Loading saved properties...')
          : favState.favoriteProperties.isEmpty
              ? EmptyView(
                  icon: Icons.favorite_border,
                  title: 'No Saved Properties',
                  description:
                      'Tap the heart icon on any Peshawar rental listing to save it here.',
                  actionText: 'Explore Rentals',
                  onAction: () => context.go('/'),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: favState.favoriteProperties.length,
                  itemBuilder: (context, index) {
                    final prop = favState.favoriteProperties[index];
                    return PropertyCard(
                      property: prop,
                      isFavorited: true,
                      onTap: () => context.push('/property/${prop.slug}'),
                      onFavoriteToggle: () {
                        ref
                            .read(favoritesProvider.notifier)
                            .toggleFavorite(prop);
                      },
                    );
                  },
                ),
    );
  }
}
