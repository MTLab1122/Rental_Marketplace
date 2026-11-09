import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/peshawar_constants.dart';
import '../../../../core/models/user_model.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/property_card.dart';
import '../../../../core/widgets/ui_feedback_widgets.dart';
import '../../../auth/application/providers/auth_provider.dart';
import '../../../favorites/application/providers/favorites_provider.dart';
import '../../application/providers/home_feed_provider.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 300) {
      ref.read(homeFeedProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final feedState = ref.watch(homeFeedProvider);
    final favoritesState = ref.watch(favoritesProvider);
    final isStudent = authState.currentTenantType == TenantType.student;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.location_city, color: AppTheme.primaryEmerald, size: 20),
                const SizedBox(width: 6),
                const Text(
                  PeshawarConstants.appName,
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
                const Spacer(),
                // Mode Toggle Pill
                GestureDetector(
                  onTap: () {
                    final nextType = isStudent ? TenantType.family : TenantType.student;
                    ref.read(authProvider.notifier).switchTenantType(nextType);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: isStudent ? AppTheme.studentsOnlyBg : AppTheme.familiesOnlyBg,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isStudent ? AppTheme.studentsOnlyText : AppTheme.familiesOnlyText,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isStudent ? Icons.school : Icons.family_restroom,
                          size: 14,
                          color: isStudent ? AppTheme.studentsOnlyText : AppTheme.familiesOnlyText,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          isStudent ? 'Student Mode' : 'Family Mode',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isStudent ? AppTheme.studentsOnlyText : AppTheme.familiesOnlyText,
                          ),
                        ),
                        const SizedBox(width: 2),
                        Icon(
                          Icons.swap_horiz,
                          size: 14,
                          color: isStudent ? AppTheme.studentsOnlyText : AppTheme.familiesOnlyText,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        color: AppTheme.primaryEmerald,
        onRefresh: () async {
          await ref.read(homeFeedProvider.notifier).fetchFeed(isRefresh: true);
        },
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            // Locality Filter Chips Horizontal Bar
            SliverToBoxAdapter(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: SizedBox(
                  height: 38,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: PeshawarConstants.localities.length + 1,
                    separatorBuilder: (context, index) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        final isSelected = feedState.selectedLocality == null;
                        return ChoiceChip(
                          label: const Text('All Localities'),
                          selected: isSelected,
                          onSelected: (_) {
                            ref.read(homeFeedProvider.notifier).selectLocality(null);
                          },
                          selectedColor: AppTheme.primaryEmerald,
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.white : AppTheme.textDark,
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                        );
                      }

                      final locality = PeshawarConstants.localities[index - 1];
                      final isSelected = feedState.selectedLocality == locality;
                      return ChoiceChip(
                        label: Text(locality),
                        selected: isSelected,
                        onSelected: (_) {
                          ref.read(homeFeedProvider.notifier).selectLocality(locality);
                        },
                        selectedColor: AppTheme.primaryEmerald,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : AppTheme.textDark,
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),

            // Mode Explanatory Notice
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isStudent ? AppTheme.studentsOnlyBg.withOpacity(0.5) : AppTheme.familiesOnlyBg.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      isStudent ? Icons.info_outline : Icons.family_restroom,
                      size: 16,
                      color: isStudent ? AppTheme.studentsOnlyText : AppTheme.familiesOnlyText,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        isStudent
                            ? 'Showing student hostels, shared rooms & single flats in Peshawar.'
                            : 'Showing family-only portions, full houses & residential apartments.',
                        style: TextStyle(
                          fontSize: 12,
                          color: isStudent ? AppTheme.studentsOnlyText : AppTheme.familiesOnlyText,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Feed Content
            if (feedState.isLoading && feedState.properties.isEmpty)
              const SliverFillRemaining(
                child: LoadingIndicator(message: 'Loading verified Peshawar rentals...'),
              )
            else if (feedState.error != null && feedState.properties.isEmpty)
              SliverFillRemaining(
                child: ErrorView(
                  message: feedState.error!,
                  onRetry: () => ref.read(homeFeedProvider.notifier).fetchFeed(),
                ),
              )
            else if (feedState.properties.isEmpty)
              SliverFillRemaining(
                child: EmptyView(
                  icon: Icons.apartment,
                  title: 'No Listings Found',
                  description: feedState.selectedLocality != null
                      ? 'No active ${isStudent ? 'student' : 'family'} properties currently in ${feedState.selectedLocality}.'
                      : 'No properties available right now.',
                  actionText: 'View All Localities',
                  onAction: () => ref.read(homeFeedProvider.notifier).selectLocality(null),
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    if (index == feedState.properties.length) {
                      return feedState.hasMore
                          ? const Padding(
                              padding: EdgeInsets.all(16.0),
                              child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                            )
                          : const SizedBox.shrink();
                    }

                    final property = feedState.properties[index];
                    final isFav = favoritesState.favoriteIds.contains(property.id);

                    return PropertyCard(
                      property: property,
                      isFavorited: isFav,
                      onTap: () {
                        context.push('/property/${property.slug}');
                      },
                      onFavoriteToggle: () {
                        if (!authState.isAuthenticated) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: const Text('Please sign in to save favorites'),
                              action: SnackBarAction(
                                label: 'Sign In',
                                onPressed: () => context.push('/login'),
                              ),
                            ),
                          );
                          return;
                        }
                        ref.read(favoritesProvider.notifier).toggleFavorite(property);
                      },
                    );
                  },
                  childCount: feedState.properties.length + (feedState.hasMore ? 1 : 0),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

