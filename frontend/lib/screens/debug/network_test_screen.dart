import 'package:flutter/material.dart';
import '../../services/registration_service.dart';

class NetworkTestScreen extends StatefulWidget {
  const NetworkTestScreen({super.key});

  @override
  State<NetworkTestScreen> createState() => _NetworkTestScreenState();
}

class _NetworkTestScreenState extends State<NetworkTestScreen> {
  String _testResult = '';
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Network Connectivity Test'),
        backgroundColor: Colors.blue.shade600,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Current Configuration:',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text('Base URL: ${RegistrationService.baseUrl}'),
                    const SizedBox(height: 8),
                    const Text('Alternative URLs:'),
                    ...RegistrationService.alternativeBaseUrls.map(
                      (url) => Padding(
                        padding: const EdgeInsets.only(left: 16.0),
                        child: Text('• $url'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Center(
              child: ElevatedButton(
                onPressed: _isLoading ? null : _testConnectivity,
                child: _isLoading
                    ? const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            height: 16,
                            width: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          SizedBox(width: 8),
                          Text('Testing...'),
                        ],
                      )
                    : const Text('Test Backend Connectivity'),
              ),
            ),
            const SizedBox(height: 16),
            if (_testResult.isNotEmpty)
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Test Results:',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Expanded(
                          child: SingleChildScrollView(
                            child: Text(
                              _testResult,
                              style: const TextStyle(fontFamily: 'monospace'),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            const SizedBox(height: 16),
            Card(
              color: Colors.amber.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info, color: Colors.amber.shade700),
                        const SizedBox(width: 8),
                        const Text(
                          'Troubleshooting Tips:',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      '1. Ensure backend server is running: npm start or node index.js\n'
                      '2. Check server console for errors\n'
                      '3. For Android emulator: Use 10.0.2.2:3000\n'
                      '4. For iOS simulator: Use localhost:3000\n'
                      '5. For real device: Use your computer\'s IP address\n'
                      '6. Check firewall and antivirus settings',
                      style: TextStyle(fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _testConnectivity() async {
    setState(() {
      _isLoading = true;
      _testResult = '';
    });

    try {
      final result = await RegistrationService.testConnectivity();
      
      setState(() {
        _testResult = '''
Test Status: ${result['success'] ? 'SUCCESS ✅' : 'FAILED ❌'}
Message: ${result['message']}
${result['url'] != null ? 'URL: ${result['url']}' : ''}
${result['error'] != null ? 'Error: ${result['error']}' : ''}
Timestamp: ${DateTime.now()}
        ''';
      });
    } catch (e) {
      setState(() {
        _testResult = '''
Test Status: ERROR ❌
Error: $e
Timestamp: ${DateTime.now()}
        ''';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
}