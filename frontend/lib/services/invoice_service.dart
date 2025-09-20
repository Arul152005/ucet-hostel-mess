import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class InvoiceService {
  // Use different URLs based on platform
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:3000/api';
    } else {
      return 'http://10.0.2.2:3000/api';
    }
  }

  // Get student's invoices
  static Future<Map<String, dynamic>> getStudentInvoices(String email, String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/invoices/student/$email'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data['data'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to get invoices',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}',
      };
    }
  }

  // Get invoice by ID (can work without token for recent invoices)
  static Future<Map<String, dynamic>> getInvoice(String invoiceId, [String? token]) async {
    try {
      final headers = {'Content-Type': 'application/json'};
      
      // Add authorization header only if token is provided
      if (token != null && token.isNotEmpty && token != 'demo_token') {
        headers['Authorization'] = 'Bearer $token';
      }
      
      final response = await http.get(
        Uri.parse('$baseUrl/invoices/$invoiceId'),
        headers: headers,
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data['data'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to get invoice',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}',
      };
    }
  }

  // Download invoice
  static Future<Map<String, dynamic>> downloadInvoice(String invoiceId, [String? token]) async {
    try {
      final headers = <String, String>{};
      
      // Add authorization header only if token is provided
      if (token != null && token.isNotEmpty && token != 'demo_token') {
        headers['Authorization'] = 'Bearer $token';
      }
      
      final response = await http.get(
        Uri.parse('$baseUrl/invoices/$invoiceId/download'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': response.body,
          'fileName': 'UCET_Invoice_$invoiceId.html',
          'downloadUrl': '$baseUrl/invoices/$invoiceId/download',
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to download invoice',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}',
      };
    }
  }

  // Get download URL for invoice
  static String getDownloadUrl(String invoiceId) {
    return '$baseUrl/invoices/$invoiceId/download';
  }

  // Get invoice view URL
  static String getInvoiceViewUrl(String invoiceId, String token) {
    return '$baseUrl/invoices/$invoiceId/view';
  }
}