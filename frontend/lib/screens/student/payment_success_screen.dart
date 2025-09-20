import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'invoice_screen.dart';
import '../../services/invoice_service.dart';

class PaymentSuccessScreen extends StatelessWidget {
  final Map<String, dynamic> registrationData;
  final Map<String, dynamic> paymentResult;
  
  const PaymentSuccessScreen({
    super.key,
    required this.registrationData,
    required this.paymentResult,
  });

  @override
  Widget build(BuildContext context) {
    final hostelType = paymentResult['data']?['hostelType'] ?? 'Hostel';
    final registerNumber = paymentResult['data']?['registerNumber'] ?? 'N/A';
    final invoice = paymentResult['data']?['invoice'];
    final userName = registrationData['name'] ?? 'Student';
    
    // Debug prints
    print('📄 Success Screen - Payment Result: ${paymentResult.toString()}');
    print('🧦 Success Screen - Invoice Info: ${invoice.toString()}');
    print('👤 Success Screen - User Name: $userName');

    return Scaffold(
      backgroundColor: Colors.green.shade50,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Success Icon
                      Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          color: Colors.green.shade600,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check,
                          color: Colors.white,
                          size: 60,
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Success Title
                      Text(
                        'Payment Successful!',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: Colors.green.shade700,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      
                      // Debug indicator
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '🔴 SUCCESS SCREEN LOADED - BUTTONS SHOULD BE BELOW',
                          style: TextStyle(
                            color: Colors.orange.shade800,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Welcome Message
                      Text(
                        'Congratulations $userName!\nYour hostel registration is complete.',
                        style: const TextStyle(
                          fontSize: 18,
                          color: Colors.black87,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),

                      // Registration Details Card
                      Card(
                        elevation: 4,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            children: [
                              _buildDetailRow(
                                'Hostel Assignment',
                                hostelType,
                                Icons.home,
                                Colors.blue.shade600,
                              ),
                              const SizedBox(height: 16),
                              _buildDetailRow(
                                'Register Number',
                                registerNumber,
                                Icons.badge,
                                Colors.orange.shade600,
                              ),
                              if (invoice != null) ...[
                                const SizedBox(height: 16),
                                _buildDetailRow(
                                  'Invoice Number',
                                  invoice['invoiceNumber'] ?? 'N/A',
                                  Icons.receipt,
                                  Colors.purple.shade600,
                                ),
                                const SizedBox(height: 16),
                                _buildDetailRow(
                                  'Total Amount',
                                  '₹${invoice['totalAmount']?.toString() ?? '46,800'}',
                                  Icons.payments,
                                  Colors.green.shade600,
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Invoice Actions (Always visible)
                      // Show buttons even for test payments with appropriate handling
                      // View Invoice Button
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton.icon(
                          onPressed: invoice != null 
                            ? () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => InvoiceScreen(
                                      invoiceId: invoice['invoiceId'],
                                      userToken: null, // Allow guest access for recent invoices
                                    ),
                                  ),
                                );
                              }
                            : () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Test payments don\'t generate real invoices. Use live payment for actual invoice.'),
                                    backgroundColor: Colors.orange,
                                    duration: Duration(seconds: 4),
                                  ),
                                );
                              },
                          icon: const Icon(Icons.receipt_long),
                          label: Text(
                            invoice != null ? 'View Invoice' : 'View Invoice (Test Mode)',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: invoice != null ? Colors.blue.shade600 : Colors.grey.shade500,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 3,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Download Invoice Button
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: OutlinedButton.icon(
                          onPressed: invoice != null 
                            ? () => _downloadInvoice(context, invoice['invoiceId'])
                            : () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Test payments don\'t generate downloadable invoices. Use live payment for PDF download.'),
                                    backgroundColor: Colors.orange,
                                    duration: Duration(seconds: 4),
                                  ),
                                );
                              },
                          icon: const Icon(Icons.download),
                          label: Text(
                            invoice != null ? 'Download Invoice' : 'Download Invoice (Test Mode)',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: invoice != null ? Colors.blue.shade600 : Colors.grey.shade500,
                            side: BorderSide(
                              color: invoice != null ? Colors.blue.shade600 : Colors.grey.shade500, 
                              width: 2
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Important Note
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.amber.shade200),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.info_outline,
                              color: Colors.amber.shade700,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Important',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.amber.shade700,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Save your invoice and registration details. You can now login using your email and password.',
                                    style: TextStyle(
                                      color: Colors.amber.shade700,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Continue to Login Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: () {
                    // Navigate back to login screen
                    Navigator.of(context).popUntil((route) => route.isFirst);
                  },
                  icon: const Icon(Icons.login),
                  label: const Text(
                    'Continue to Login',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green.shade600,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 3,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, IconData icon, Color color) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.black54,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  color: Colors.black87,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _downloadInvoice(BuildContext context, String invoiceId) async {
    try {
      final downloadUrl = InvoiceService.getDownloadUrl(invoiceId);
      
      // Show download dialog
      showDialog(
        context: context,
        builder: (dialogContext) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Row(
            children: [
              Icon(Icons.download, color: Colors.blue.shade600),
              const SizedBox(width: 8),
              const Text('Download Invoice'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Your invoice is ready for download.'),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: SelectableText(
                  downloadUrl,
                  style: const TextStyle(fontSize: 12),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Close'),
            ),
            ElevatedButton.icon(
              onPressed: () {
                Clipboard.setData(ClipboardData(text: downloadUrl));
                Navigator.pop(dialogContext);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Download URL copied to clipboard'),
                    backgroundColor: Colors.green,
                  ),
                );
              },
              icon: const Icon(Icons.copy),
              label: const Text('Copy URL'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue.shade600,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}