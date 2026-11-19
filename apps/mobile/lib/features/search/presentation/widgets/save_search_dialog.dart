import 'package:flutter/material.dart';
import 'package:rental_peshawar_mobile/core/models/saved_search_model.dart';

class SaveSearchDialog extends StatefulWidget {
  final Map<String, dynamic> filters;
  final Function(String name, bool alertsEnabled, AlertFrequency frequency) onSave;

  const SaveSearchDialog({
    super.key,
    required this.filters,
    required this.onSave,
  });

  @override
  State<SaveSearchDialog> createState() => _SaveSearchDialogState();
}

class _SaveSearchDialogState extends State<SaveSearchDialog> {
  final _nameController = TextEditingController();
  bool _alertsEnabled = true;
  AlertFrequency _frequency = AlertFrequency.instant;
  bool _isSaving = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  void _handleSave() {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;

    setState(() => _isSaving = true);
    widget.onSave(name, _alertsEnabled, _frequency);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Row(
        children: [
          Icon(Icons.notifications_active, color: Color(0xFF0284C7)),
          SizedBox(width: 8),
          Text(
            'Save Search & Alerts',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Get notified when new verified properties in Peshawar match these criteria.',
              style: TextStyle(fontSize: 12, color: Colors.black54),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: 'Search Name',
                hintText: 'e.g. 2 Bed in University Town',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
            const SizedBox(height: 16),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text(
                'Enable Real-Time Alerts',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
              ),
              subtitle: const Text(
                'Receive notifications for new listings',
                style: TextStyle(fontSize: 11, color: Colors.black54),
              ),
              value: _alertsEnabled,
              activeColor: const Color(0xFF0284C7),
              onChanged: (val) => setState(() => _alertsEnabled = val),
            ),
            if (_alertsEnabled) ...[
              const SizedBox(height: 8),
              const Text(
                'Alert Frequency',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<AlertFrequency>(
                value: _frequency,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                items: AlertFrequency.values.map((f) {
                  return DropdownMenuItem(
                    value: f,
                    child: Text(f.label, style: const TextStyle(fontSize: 13)),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _frequency = val);
                },
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _isSaving ? null : _handleSave,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0284C7),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: const Text('Save Search'),
        ),
      ],
    );
  }
}
