import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rental_peshawar_mobile/main.dart';
import 'package:rental_peshawar_mobile/core/constants/peshawar_constants.dart';

void main() {
  testWidgets('App launches and displays app title and Peshawar localities list', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: PeshawarRentalApp()));
    await tester.pumpAndSettle();

    expect(find.text(PeshawarConstants.appName), findsOneWidget);
    expect(PeshawarConstants.localities.length, 15);
  });
}

