import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/peshawar_constants.dart';
import '../../../../core/models/user_model.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/application/providers/auth_provider.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  TenantType _selectedType = TenantType.student;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              // App Icon & City Badge
              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryEmerald,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.location_city, color: Colors.white, size: 36),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                PeshawarConstants.appName,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textDark,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Verified Rentals Across Peshawar, KP',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 36),

              const Text(
                'Select Your Profile Mode',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textDark,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'To maintain a safe and comfortable marketplace, student and family rentals are strictly separated.',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 20),

              // Student Mode Card
              _buildModeOption(
                type: TenantType.student,
                title: 'Student Mode',
                subtitle: 'Hostels, shared flats, and single rooms near University Town, UOP, and medical colleges.',
                icon: Icons.school,
                isSelected: _selectedType == TenantType.student,
                accentColor: AppTheme.studentsOnlyText,
                bgColor: AppTheme.studentsOnlyBg,
              ),

              const SizedBox(height: 16),

              // Family Mode Card
              _buildModeOption(
                type: TenantType.family,
                title: 'Family Mode',
                subtitle: 'Full houses, portions, and residential apartments in Hayatabad, Cantt, and gated communities.',
                icon: Icons.family_restroom,
                isSelected: _selectedType == TenantType.family,
                accentColor: AppTheme.familiesOnlyText,
                bgColor: AppTheme.familiesOnlyBg,
              ),

              const Spacer(),

              // Locality Highlight Strip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.verified, size: 18, color: AppTheme.primaryEmerald),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '15 Peshawar municipal localities geo-fenced & verified.',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Continue Button
              ElevatedButton(
                onPressed: () async {
                  await ref.read(authProvider.notifier).switchTenantType(_selectedType);
                  final storage = ref.read(secureStorageProvider);
                  await storage.setOnboardingCompleted(true);
                  if (context.mounted) {
                    context.go('/');
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryEmerald,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: const Text(
                  'Explore Rentals',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModeOption({
    required TenantType type,
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isSelected,
    required Color accentColor,
    required Color bgColor,
  }) {
    return InkWell(
      onTap: () {
        setState(() {
          _selectedType = type;
        });
      },
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? bgColor.withOpacity(0.4) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? accentColor : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: accentColor, size: 28),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? accentColor : AppTheme.textDark,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600, height: 1.3),
                  ),
                ],
              ),
            ),
            Radio<TenantType>(
              value: type,
              groupValue: _selectedType,
              activeColor: accentColor,
              onChanged: (val) {
                if (val != null) {
                  setState(() => _selectedType = val);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

