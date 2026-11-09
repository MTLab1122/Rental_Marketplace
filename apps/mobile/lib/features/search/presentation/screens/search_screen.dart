import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/peshawar_constants.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/property_card.dart';
import '../../../../core/widgets/ui_feedback_widgets.dart';
import '../../../auth/application/providers/auth_provider.dart';
import '../../../favorites/application/providers/favorites_provider.dart';
import '../../application/providers/search_provider.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showFilterModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return const _FilterBottomSheet();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final searchState = ref.watch(searchProvider);
    final authState = ref.watch(authProvider);
    final favState = ref.watch(favoritesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Search Peshawar'),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune),
            onPressed: () => _showFilterModal(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by keyword or address...',
                prefixIcon: const Icon(Icons.search, color: AppTheme.primaryEmerald),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          ref.read(searchProvider.notifier).setKeyword('');
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.grey.shade100,
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
              onSubmitted: (value) {
                ref.read(searchProvider.notifier).setKeyword(value.trim());
              },
            ),
          ),

          // Active filter indicator if any
          if (searchState.filters.localityName != null || searchState.filters.minRent != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  Text(
                    'Filters active: ',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                  if (searchState.filters.localityName != null)
                    Chip(
                      label: Text(searchState.filters.localityName!),
                      onDeleted: () {
                        ref.read(searchProvider.notifier).updateFilters(
                              searchState.filters.copyWith(localityName: null),
                            );
                      },
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      labelStyle: const TextStyle(fontSize: 11),
                    ),
                ],
              ),
            ),

          // Search Results Counter
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${searchState.results.length} Properties Found',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textDark),
                ),
                Text(
                  authState.currentTenantType.name.toUpperCase(),
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey.shade500),
                ),
              ],
            ),
          ),

          // Search Results List
          Expanded(
            child: searchState.isLoading
                ? const LoadingIndicator(message: 'Searching rentals...')
                : searchState.results.isEmpty
                    ? EmptyView(
                        icon: Icons.search_off,
                        title: 'No Matching Rentals',
                        description: 'Try adjusting your filters or search keywords.',
                        actionText: 'Reset Filters',
                        onAction: () {
                          _searchController.clear();
                          ref.read(searchProvider.notifier).updateFilters(SearchFilterState());
                        },
                      )
                    : ListView.builder(
                        itemCount: searchState.results.length,
                        itemBuilder: (context, index) {
                          final prop = searchState.results[index];
                          final isFav = favState.favoriteIds.contains(prop.id);
                          return PropertyCard(
                            property: prop,
                            isFavorited: isFav,
                            onTap: () => context.push('/property/${prop.slug}'),
                            onFavoriteToggle: () {
                              if (authState.isAuthenticated) {
                                ref.read(favoritesProvider.notifier).toggleFavorite(prop);
                              }
                            },
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class _FilterBottomSheet extends ConsumerStatefulWidget {
  const _FilterBottomSheet();

  @override
  ConsumerState<_FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends ConsumerState<_FilterBottomSheet> {
  String? _selectedLocality;
  RangeValues _rentRange = const RangeValues(5000, 150000);

  @override
  void initState() {
    super.initState();
    final filters = ref.read(searchProvider).filters;
    _selectedLocality = filters.localityName;
    if (filters.minRent != null || filters.maxRent != null) {
      _rentRange = RangeValues(
        (filters.minRent ?? 5000).toDouble(),
        (filters.maxRent ?? 150000).toDouble(),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Filter Rentals', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const SizedBox(height: 12),

          // Locality Dropdown
          const Text('Locality', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            value: _selectedLocality,
            hint: const Text('All 15 Localities'),
            isExpanded: true,
            decoration: InputDecoration(
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
            items: [
              const DropdownMenuItem(value: null, child: Text('All Localities')),
              ...PeshawarConstants.localities.map(
                (loc) => DropdownMenuItem(value: loc, child: Text(loc)),
              ),
            ],
            onChanged: (val) => setState(() => _selectedLocality = val),
          ),
          const SizedBox(height: 16),

          // Price Range
          Text(
            'Monthly Rent: PKR ${_rentRange.start.toInt()} - ${_rentRange.end.toInt()}',
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          ),
          RangeSlider(
            values: _rentRange,
            min: 5000,
            max: 200000,
            divisions: 39,
            activeColor: AppTheme.primaryEmerald,
            onChanged: (val) => setState(() => _rentRange = val),
          ),
          const SizedBox(height: 20),

          // Apply button
          ElevatedButton(
            onPressed: () {
              ref.read(searchProvider.notifier).updateFilters(
                    ref.read(searchProvider).filters.copyWith(
                          localityName: _selectedLocality,
                          minRent: _rentRange.start.toInt(),
                          maxRent: _rentRange.end.toInt(),
                        ),
                  );
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryEmerald,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Apply Filters', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
