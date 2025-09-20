import 'package:flutter/material.dart';
import 'screens/common/role_selection_screen.dart';

void main() {
  runApp(const HostelManagementApp());
}

class HostelManagementApp extends StatelessWidget {
  const HostelManagementApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'UCET Hostel Management',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const RoleSelectionScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

