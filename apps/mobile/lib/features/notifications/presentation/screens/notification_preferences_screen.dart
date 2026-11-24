import 'package:flutter/material.dart';
import 'package:rental_peshawar_mobile/core/models/saved_search_model.dart';

class NotificationPreferencesScreen extends StatefulWidget {
  final NotificationPreferenceModel initialPreferences;
  final Function(NotificationPreferenceModel updated)? onSave;

  const NotificationPreferencesScreen({
    super.key,
    required this.initialPreferences,
    this.onSave,
  });

  @override
  State<NotificationPreferencesScreen> createState() =>
      _NotificationPreferencesScreenState();
}

class _NotificationPreferencesScreenState
    extends State<NotificationPreferencesScreen> {
  late bool _inAppAlerts;
  late bool _pushAlerts;
  late bool _emailAlerts;
  late bool _instantAlerts;
  late bool _dailyDigest;
  late bool _recommendations;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _inAppAlerts = widget.initialPreferences.inAppAlerts;
    _pushAlerts = widget.initialPreferences.pushAlerts;
    _emailAlerts = widget.initialPreferences.emailAlerts;
    _instantAlerts = widget.initialPreferences.instantAlerts;
    _dailyDigest = widget.initialPreferences.dailyDigest;
    _recommendations = widget.initialPreferences.recommendations;
  }

  void _handleSave() {
    setState(() => _isSaving = true);
    final updated = NotificationPreferenceModel(
      inAppAlerts: _inAppAlerts,
      pushAlerts: _pushAlerts,
      emailAlerts: _emailAlerts,
      instantAlerts: _instantAlerts,
      dailyDigest: _dailyDigest,
      recommendations: _recommendations,
    );

    widget.onSave?.call(updated);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Preferences saved successfully!')),
    );
    setState(() => _isSaving = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification Preferences'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0.5,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'DELIVERY CHANNELS',
            style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.black54,
                letterSpacing: 1),
          ),
          const SizedBox(height: 8),
          _buildSwitchTile(
            title: 'In-App Alerts',
            subtitle: 'Show notification badges and in-app alerts',
            value: _inAppAlerts,
            onChanged: (val) => setState(() => _inAppAlerts = val),
          ),
          _buildSwitchTile(
            title: 'Push Notifications (FCM)',
            subtitle: 'Receive instant match alerts on your mobile device',
            value: _pushAlerts,
            onChanged: (val) => setState(() => _pushAlerts = val),
          ),
          _buildSwitchTile(
            title: 'Email Notifications',
            subtitle: 'Receive verified property summaries in your inbox',
            value: _emailAlerts,
            onChanged: (val) => setState(() => _emailAlerts = val),
          ),
          const SizedBox(height: 24),
          const Text(
            'FREQUENCY & DISCOVERY',
            style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.black54,
                letterSpacing: 1),
          ),
          const SizedBox(height: 8),
          _buildSwitchTile(
            title: 'Instant Alerts',
            subtitle:
                'Notify immediately when matching properties are verified',
            value: _instantAlerts,
            onChanged: (val) => setState(() => _instantAlerts = val),
          ),
          _buildSwitchTile(
            title: 'Daily Digest',
            subtitle: 'Summary of newly approved listings once per day',
            value: _dailyDigest,
            onChanged: (val) => setState(() => _dailyDigest = val),
          ),
          _buildSwitchTile(
            title: 'AI Recommendations',
            subtitle:
                'Allow personalized property suggestions based on views and favorites',
            value: _recommendations,
            onChanged: (val) => setState(() => _recommendations = val),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: _isSaving ? null : _handleSave,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0284C7),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Save Preferences',
                style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required bool value,
    required Function(bool) onChanged,
  }) {
    return SwitchListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(title,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
      subtitle: Text(subtitle,
          style: const TextStyle(fontSize: 12, color: Colors.black54)),
      value: value,
      activeThumbColor: const Color(0xFF0284C7),
      onChanged: onChanged,
    );
  }
}
