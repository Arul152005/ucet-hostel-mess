import 'dart:convert';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class RegistrationService {
  // Use different URLs based on platform
  static String get baseUrl {
    if (kIsWeb) {
      // For web/desktop
      return 'http://localhost:3000/api';
    } else if (Platform.isIOS) {
      // For iOS simulator
      return 'http://localhost:3000/api';
    } else if (Platform.isAndroid) {
      // For Android emulator, use 10.0.2.2 to access host machine's localhost
      return 'http://10.0.2.2:3000/api';
    } else {
      // For real device or other platforms
      return 'http://localhost:3000/api';
    }
  }

  // Alternative base URLs to try if primary fails
  static List<String> get alternativeBaseUrls => [
    'http://localhost:3000/api',
    'http://127.0.0.1:3000/api',
    'http://10.0.2.2:3000/api',
  ];

  // Submit hostel registration with retry logic
  static Future<Map<String, dynamic>> submitRegistration({
    required String name,
    required String email,
    required String password,
    required String dateOfBirth,
    required String course,
    required String year,
    required String gender,
    required String category,
    required String messPreference,
    required String parentName,
    required String parentOccupation,
    required String parentAddress,
    required String parentPin,
    required String parentContact,
    required String guardianName,
    required String guardianOccupation,
    required String guardianAddress,
    required String guardianPin,
    required String guardianContact,
    String? profileImagePath,
  }) async {
    final requestBody = {
      'name': name,
      'email': email,
      'password': password,
      'dateOfBirth': dateOfBirth,
      'course': course,
      'year': int.parse(year),
      'gender': gender,
      'category': category,
      'messPreference': messPreference,
      'parentInfo': {
        'name': parentName,
        'occupation': parentOccupation,
        'address': parentAddress,
        'pin': parentPin,
        'contact': parentContact,
      },
      'guardianInfo': {
        'name': guardianName,
        'occupation': guardianOccupation,
        'address': guardianAddress,
        'pin': guardianPin,
        'contact': guardianContact,
      },
      'profileImagePath': profileImagePath,
      'submittedAt': DateTime.now().toIso8601String(),
    };

    // Try primary URL first
    final primaryUrl = '$baseUrl/registration/submit';
    print('Attempting to connect to: $primaryUrl');
    
    try {
      final response = await http.post(
        Uri.parse(primaryUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(requestBody),
      ).timeout(const Duration(seconds: 10));

      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': 'Registration submitted successfully!',
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Registration failed',
        };
      }
    } catch (e) {
      print('Primary URL failed: $e');
      
      // Try alternative URLs
      for (String altBaseUrl in alternativeBaseUrls) {
        if (altBaseUrl == baseUrl) continue; // Skip if same as primary
        
        final altUrl = '$altBaseUrl/registration/submit';
        print('Trying alternative URL: $altUrl');
        
        try {
          final response = await http.post(
            Uri.parse(altUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(requestBody),
          ).timeout(const Duration(seconds: 10));

          print('Alternative URL response status: ${response.statusCode}');
          
          final data = jsonDecode(response.body);

          if (response.statusCode == 200 || response.statusCode == 201) {
            return {
              'success': true,
              'message': 'Registration submitted successfully!',
              'data': data,
            };
          }
        } catch (altError) {
          print('Alternative URL $altUrl failed: $altError');
          continue;
        }
      }
      
      // If all URLs failed
      return {
        'success': false,
        'message': 'Network error: Unable to connect to server. Please check:\n'
            '1. Backend server is running (http://localhost:3000)\n'
            '2. Your network connection\n'
            '3. If on Android emulator, server should be accessible at 10.0.2.2:3000\n'
            'Error details: ${e.toString()}',
      };
    }
  }

  // Test network connectivity to backend
  static Future<Map<String, dynamic>> testConnectivity() async {
    // Try primary URL first
    String testUrl = '$baseUrl/../health';
    print('Testing connectivity to: $testUrl');
    
    try {
      final response = await http.get(
        Uri.parse(testUrl),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': 'Backend server is reachable',
          'url': testUrl,
        };
      } else {
        return {
          'success': false,
          'message': 'Server responded with status: ${response.statusCode}',
          'url': testUrl,
        };
      }
    } catch (e) {
      print('Primary connectivity test failed: $e');
      
      // Try alternative URLs
      for (String altBaseUrl in alternativeBaseUrls) {
        String altTestUrl = '$altBaseUrl/../health';
        print('Testing alternative URL: $altTestUrl');
        
        try {
          final response = await http.get(
            Uri.parse(altTestUrl),
            headers: {'Content-Type': 'application/json'},
          ).timeout(const Duration(seconds: 5));

          if (response.statusCode == 200) {
            return {
              'success': true,
              'message': 'Backend server is reachable via alternative URL',
              'url': altTestUrl,
            };
          }
        } catch (altError) {
          print('Alternative connectivity test failed: $altError');
          continue;
        }
      }
      
      return {
        'success': false,
        'message': 'Cannot reach backend server. Please ensure:\n'
            '1. Backend server is running on port 3000\n'
            '2. Network connection is active\n'
            '3. Firewall is not blocking the connection',
        'error': e.toString(),
      };
    }
  }

  // Get registration status
  static Future<Map<String, dynamic>> getRegistrationStatus(String identifier) async {
    try {
      print('Getting registration status for: $identifier');
      print('Using URL: $baseUrl/registration/status/$identifier');
      
      final response = await http.get(
        Uri.parse('$baseUrl/registration/status/$identifier'),
        headers: {'Content-Type': 'application/json'},
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to get status',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}',
      };
    }
  }

  // Submit complete registration after payment and declaration
  static Future<Map<String, dynamic>> submitCompleteRegistration({
    required Map<String, dynamic> registrationData,
    required bool paymentStatus,
    required bool declarationAccepted,
    required bool parentConsent,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/registration/complete'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          ...registrationData,
          'paymentStatus': paymentStatus,
          'declarationAccepted': declarationAccepted,
          'parentConsent': parentConsent,
          'registrationCompletedAt': DateTime.now().toIso8601String(),
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': 'Registration completed successfully!',
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Registration failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}',
      };
    }
  }

  // Complete payment and move data to permanent collection
  static Future<Map<String, dynamic>> completePayment({
    required String email,
    required String paymentId,
    required String transactionId,
    required String paymentMethod,
    required double amount,
  }) async {
    try {
      print('Completing payment for email: $email');
      print('Using URL: $baseUrl/registration/complete-payment');
      
      final response = await http.post(
        Uri.parse('$baseUrl/registration/complete-payment'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'paymentId': paymentId,
          'transactionId': transactionId,
          'paymentMethod': paymentMethod,
          'paymentDate': DateTime.now().toIso8601String(),
          'amount': amount,
        }),
      );

      print('Payment completion response status: ${response.statusCode}');
      print('Payment completion response body: ${response.body}');

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': data['message'] ?? 'Payment completed successfully!',
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Payment completion failed',
        };
      }
    } catch (e) {
      print('Payment completion error: $e');
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}',
      };
    }
  }

  // Get all registrations (for admin)
  static Future<Map<String, dynamic>> getAllRegistrations() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/registration/all'),
        headers: {'Content-Type': 'application/json'},
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to get registrations',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}',
      };
    }
  }
}