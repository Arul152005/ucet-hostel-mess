import 'dart:convert';
import 'package:http/http.dart' as http;

class RegistrationService {
  static const String baseUrl = 'http://localhost:3000/api';

  // Submit hostel registration
  static Future<Map<String, dynamic>> submitRegistration({
    required String name,
    required String email,
    required String password,
    required String course,
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
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/registration/submit'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'email': email,
          'password': password,
          'course': course,
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
        }),
      );

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
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}',
      };
    }
  }

  // Get registration status
  static Future<Map<String, dynamic>> getRegistrationStatus(String studentId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/registration/status/$studentId'),
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