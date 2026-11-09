import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/models/user_model.dart';
import '../../../../core/theme/app_theme.dart';
import '../../application/providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _institutionController = TextEditingController();

  TenantType _tenantType = TenantType.student;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _institutionController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref.read(authProvider.notifier).register(
          fullName: _fullNameController.text.trim(),
          email: _emailController.text.trim(),
          phoneNumber: _phoneController.text.trim(),
          password: _passwordController.text,
          tenantType: _tenantType,
          institutionName: _tenantType == TenantType.student ? _institutionController.text.trim() : null,
        );

    if (success && mounted) {
      context.go('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Account'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (authState.error != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Text(
                      authState.error!,
                      style: TextStyle(color: Colors.red.shade800, fontSize: 13),
                    ),
                  ),

                // Tenant Category Segmented Toggle
                const Text(
                  'I am searching for rentals as a:',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.school, size: 18),
                        label: const Text('Student'),
                        onPressed: () => setState(() => _tenantType = TenantType.student),
                        style: OutlinedButton.styleFrom(
                          backgroundColor: _tenantType == TenantType.student
                              ? AppTheme.studentsOnlyBg
                              : Colors.white,
                          foregroundColor: _tenantType == TenantType.student
                              ? AppTheme.studentsOnlyText
                              : Colors.grey.shade700,
                          side: BorderSide(
                            color: _tenantType == TenantType.student
                                ? AppTheme.studentsOnlyText
                                : Colors.grey.shade300,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.family_restroom, size: 18),
                        label: const Text('Family'),
                        onPressed: () => setState(() => _tenantType = TenantType.family),
                        style: OutlinedButton.styleFrom(
                          backgroundColor: _tenantType == TenantType.family
                              ? AppTheme.familiesOnlyBg
                              : Colors.white,
                          foregroundColor: _tenantType == TenantType.family
                              ? AppTheme.familiesOnlyText
                              : Colors.grey.shade700,
                          side: BorderSide(
                            color: _tenantType == TenantType.family
                                ? AppTheme.familiesOnlyText
                                : Colors.grey.shade300,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Full Name
                TextFormField(
                  controller: _fullNameController,
                  decoration: InputDecoration(
                    labelText: 'Full Name',
                    prefixIcon: const Icon(Icons.badge_outlined),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  validator: (v) => v == null || v.trim().length < 2 ? 'Please enter your name' : null,
                ),
                const SizedBox(height: 14),

                // Email
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: 'Email Address',
                    prefixIcon: const Icon(Icons.email_outlined),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  validator: (v) => v == null || !v.contains('@') ? 'Enter a valid email' : null,
                ),
                const SizedBox(height: 14),

                // Mobile Number
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: 'Mobile Number (e.g. 03001234567)',
                    prefixIcon: const Icon(Icons.phone_outlined),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  validator: (v) => v == null || v.length < 11 ? 'Enter an 11-digit mobile number' : null,
                ),
                const SizedBox(height: 14),

                // Institution Name (for Student mode)
                if (_tenantType == TenantType.student) ...[
                  TextFormField(
                    controller: _institutionController,
                    decoration: InputDecoration(
                      labelText: 'University / College Name',
                      hintText: 'e.g. University of Peshawar, KMC',
                      prefixIcon: const Icon(Icons.account_balance_outlined),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Institution name is required' : null,
                  ),
                  const SizedBox(height: 14),
                ],

                // Password
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Password (min 8 chars)',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(_obscurePassword ? Icons.visibility : Icons.visibility_off),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  validator: (v) => v == null || v.length < 8 ? 'Password must be at least 8 characters' : null,
                ),
                const SizedBox(height: 24),

                ElevatedButton(
                  onPressed: authState.isLoading ? null : _handleRegister,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryEmerald,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: authState.isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Create Account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 16),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Already have an account?', style: TextStyle(color: Colors.grey.shade600)),
                    TextButton(
                      onPressed: () => context.pop(),
                      child: const Text('Sign In', style: TextStyle(color: AppTheme.primaryEmerald, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

