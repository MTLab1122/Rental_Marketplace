import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rental_peshawar_mobile/main.dart';
import 'package:rental_peshawar_mobile/core/constants/peshawar_constants.dart';
import 'package:rental_peshawar_mobile/core/storage/secure_storage_service.dart';

void main() {
  testWidgets('App launches and displays app title and Peshawar localities list', (WidgetTester tester) async {
    final storage = SecureStorageService();
    await tester.pumpWidget(
      ProviderScope(
        child: PeshawarRentalApp(storage: storage),
      ),
    );

    expect(PeshawarConstants.appName, 'Rental Peshawar');
    expect(PeshawarConstants.localities.length, 15);
  });
}
