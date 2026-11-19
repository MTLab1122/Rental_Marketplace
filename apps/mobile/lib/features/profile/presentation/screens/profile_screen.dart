import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/peshawar_constants.dart';
import '../../../../core/models/user_model.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/application/providers/auth_provider.dart';
import '../../landlord/presentation/screens/landlord_subscription_screen.dart';
import 'referral_screen.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final isStudent = authState.currentTenantType == TenantType.student;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Profile Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: AppTheme.primaryEmerald.withOpacity(0.1),
                  child: const Icon(Icons.person, size: 36, color: AppTheme.primaryEmerald),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        authState.isAuthenticated && authState.user != null
                            ? authState.user!.fullName
                            : 'Guest Tenant',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        authState.isAuthenticated && authState.user != null
                            ? authState.user!.email
                            : 'Sign in to access inquiries & favorites',
                        style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                      ),
                    ],
                  ),
                ),
                if (!authState.isAuthenticated)
                  ElevatedButton(
                    onPressed: () => context.push('/login'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryEmerald,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Sign In'),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Active Mode Selector Box
          const Text('Search Mode Preference', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isStudent ? AppTheme.studentsOnlyBg.withOpacity(0.4) : AppTheme.familiesOnlyBg.withOpacity(0.4),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isStudent ? AppTheme.studentsOnlyText.withOpacity(0.3) : AppTheme.familiesOnlyText.withOpacity(0.3),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isStudent ? '🎓 Student Mode Active' : '👨‍👩‍👧 Family Mode Active',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: isStudent ? AppTheme.studentsOnlyText : AppTheme.familiesOnlyText,
                      ),
                    ),
                    Switch(
                      value: !isStudent,
                      activeColor: AppTheme.familiesOnlyText,
                      onChanged: (isFamily) {
                        ref
                            .read(authProvider.notifier)
                            .switchTenantType(isFamily ? TenantType.family : TenantType.student);
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  isStudent
                      ? 'You are viewing student-only listings (hostels, rooms, shared apartments). Toggle switch to view family properties.'
                      : 'You are viewing family-only listings (independent portions, full houses). Toggle switch to view student properties.',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Landlord Section
          const Text('Landlord & Property Manager', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          _buildListTile(
            icon: Icons.dashboard_outlined,
            title: 'Landlord Dashboard',
            subtitle: 'Overview, analytics, inquiry leads & verification',
            onTap: () => context.push('/landlord'),
          ),
          _buildListTile(
            icon: Icons.add_home_outlined,
            title: 'Post New Property',
            subtitle: '7-step wizard with duplicate protection & boundary check',
            onTap: () => context.push('/landlord/properties/new'),
          ),
          _buildListTile(
            icon: Icons.holiday_village_outlined,
            title: 'Manage My Listings',
            subtitle: 'Availability controls, pricing, photos & analytics',
            onTap: () => context.push('/landlord/properties'),
          ),
          _buildListTile(
            icon: Icons.verified_user_outlined,
            title: 'CNIC & Identity Verification',
            subtitle: 'NADRA document upload & liveness submission',
            onTap: () => context.push('/landlord/verification'),
          ),
          _buildListTile(
            icon: Icons.workspace_premium_outlined,
            title: 'Subscriptions & Listing Boosts',
            subtitle: 'Pro Landlord tiers, offline invoices & featured badges',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const LandlordSubscriptionScreen()),
              );
            },
          ),
          const SizedBox(height: 24),

          // Settings / Navigation List
          const Text('Marketplace Information', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          _buildListTile(
            icon: Icons.card_giftcard,
            title: 'Refer & Earn (PKR 500)',
            subtitle: 'Invite students & landlords for real cash rewards',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ReferralScreen()),
              );
            },
          ),
          const SizedBox(height: 8),
          _buildListTile(
            icon: Icons.map,
            title: '15 Peshawar Municipal Localities',
            subtitle: 'University Town, Hayatabad, Cantt, Saddar, etc.',
            onTap: () {
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Verified Localities'),
                  content: SizedBox(
                    width: double.maxFinite,
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: PeshawarConstants.localities.length,
                      itemBuilder: (context, idx) => ListTile(
                        leading: const Icon(Icons.location_on, color: AppTheme.primaryEmerald),
                        title: Text(PeshawarConstants.localities[idx]),
                      ),
                    ),
                  ),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
                  ],
                ),
              );
            },
          ),
          _buildListTile(
            icon: Icons.shield_outlined,
            title: 'Safety & CNIC Verification Policy',
            subtitle: 'All Peshawar landlords undergo identity moderation.',
            onTap: () {},
          ),
          _buildListTile(
            icon: Icons.phone_in_talk_outlined,
            title: 'Peshawar Helpline & Support',
            subtitle: 'support@rentalpeshawar.pk',
            onTap: () {},
          ),

          if (authState.isAuthenticated) ...[
            const SizedBox(height: 24),
            OutlinedButton.icon(
              icon: const Icon(Icons.logout, color: Colors.red),
              label: const Text('Sign Out', style: TextStyle(color: Colors.red)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.red),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: () async {
                await ref.read(authProvider.notifier).logout();
              },
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 8),
      color: Colors.grey.shade50,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: ListTile(
        leading: Icon(icon, color: AppTheme.primaryEmerald),
        title: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
        trailing: const Icon(Icons.chevron_right, size: 20),
        onTap: onTap,
      ),
    );
  }
}

