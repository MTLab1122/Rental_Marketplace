import 'package:flutter/material.dart';
import 'package:rental_peshawar_mobile/core/models/saved_search_model.dart';

class SavedSearchesScreen extends StatefulWidget {
  final List<SavedSearchModel> initialSearches;
  final Function(String id)? onDelete;
  final Function(String id, bool alertsEnabled, AlertFrequency frequency)? onToggleAlerts;
  final Function(SavedSearchModel search)? onRunSearch;

  const SavedSearchesScreen({
    super.key,
    this.initialSearches = const [],
    this.onDelete,
    this.onToggleAlerts,
    this.onRunSearch,
  });

  @override
  State<SavedSearchesScreen> createState() => _SavedSearchesScreenState();
}

class _SavedSearchesScreenState extends State<SavedSearchesScreen> {
  late List<SavedSearchModel> _searches;

  @override
  void initState() {
    super.initState();
    _searches = List.from(widget.initialSearches);
  }

  void _handleDelete(String id) {
    setState(() {
      _searches.removeWhere((s) => s.id == id);
    });
    widget.onDelete?.call(id);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Saved Searches & Alerts'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0.5,
      ),
      body: _searches.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.search_off, size: 64, color: Colors.black26),
                    const SizedBox(height: 16),
                    const Text(
                      'No Saved Searches',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Save searches when browsing properties in Peshawar to receive automatic match alerts.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: Colors.black54),
                    ),
                  ],
                ),
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _searches.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final search = _searches[index];
                return Card(
                  elevation: 1,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            Expanded(
                              child: Text(
                                search.name,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                              onPressed: () => _handleDelete(search.id),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: [
                            if (search.filters['localityId'] != null)
                              _buildPill('📍 Locality'),
                            if (search.filters['propertyType'] != null)
                              _buildPill('🏢 ${search.filters['propertyType']}'),
                            if (search.filters['bedrooms'] != null)
                              _buildPill('🛏️ ${search.filters['bedrooms']}+ Bed'),
                            if (search.filters['maxPrice'] != null)
                              _buildPill('💰 ≤ PKR ${search.filters['maxPrice']}'),
                          ],
                        ),
                        const Divider(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            Row(
                              children: [
                                Switch(
                                  value: search.alertsEnabled,
                                  activeColor: const Color(0xFF0284C7),
                                  onChanged: (val) {
                                    setState(() {
                                      _searches[index] = SavedSearchModel(
                                        id: search.id,
                                        userId: search.userId,
                                        name: search.name,
                                        filters: search.filters,
                                        filterSignature: search.filterSignature,
                                        alertsEnabled: val,
                                        frequency: search.frequency,
                                        createdAt: search.createdAt,
                                      );
                                    });
                                    widget.onToggleAlerts?.call(search.id, val, search.frequency);
                                  },
                                ),
                                Text(
                                  search.alertsEnabled ? search.frequency.label : 'Alerts Paused',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: search.alertsEnabled ? const Color(0xFF0284C7) : Colors.black45,
                                  ),
                                ),
                              ],
                            ),
                            ElevatedButton.icon(
                              onPressed: () => widget.onRunSearch?.call(search),
                              icon: const Icon(Icons.search, size: 16),
                              label: const Text('Search'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF0284C7),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  Widget _buildPill(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFCBD5E1)),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
      ),
    );
  }
}
