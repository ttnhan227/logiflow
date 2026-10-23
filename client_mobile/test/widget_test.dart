import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:client_mobile/main.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('App smoke test loads and renders AuthWrapper', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify root MaterialApp and AuthWrapper are mounted
    expect(find.byType(MaterialApp), findsOneWidget);
    expect(find.byType(AuthWrapper), findsOneWidget);
  });
}
