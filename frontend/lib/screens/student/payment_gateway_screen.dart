import 'package:flutter/material.dart';
import '../../services/registration_service.dart';

class PaymentGatewayScreen extends StatefulWidget {
  final Map<String, dynamic> registrationData;
  
  const PaymentGatewayScreen({
    super.key,
    required this.registrationData,
  });

  @override
  State<PaymentGatewayScreen> createState() => _PaymentGatewayScreenState();
}

class _PaymentGatewayScreenState extends State<PaymentGatewayScreen> {
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Payment Gateway'),
        backgroundColor: Colors.green.shade600,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Payment Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.green.shade600, Colors.green.shade400],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.payment,
                    color: Colors.white,
                    size: 32,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Hostel Registration Fee',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Complete your payment to proceed with hostel admission',
                    style: TextStyle(
                      color: Colors.green.shade100,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Fee Breakdown
            Card(
              elevation: 3,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Fee Breakdown',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildFeeItem('Admission Fee', '₹500.00'),
                    _buildFeeItem('Hostel Amenities & Appliances Fund', '₹600.00'),
                    _buildFeeItem('Block Advance (Refundable)', '₹5,000.00'),
                    _buildFeeItem('Room Rent (Annual)', '₹600.00'),
                    _buildFeeItem('Electricity Charges (Annual)', '₹600.00'),
                    _buildFeeItem('Water Charges (Annual)', '₹500.00'),
                    _buildFeeItem('Establishment Charges (Annual)', '₹15,000.00'),
                    _buildFeeItem('Mess Advance (Annual)', '₹24,000.00'),
                    const Divider(thickness: 2),
                    _buildFeeItem('Total Amount', '₹46,800.00', isTotal: true),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Student Information
            Card(
              elevation: 3,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Student Information',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildInfoRow('Name', widget.registrationData['name'] ?? 'N/A'),
                    _buildInfoRow('Email', widget.registrationData['email'] ?? 'N/A'),
                    _buildInfoRow('Course', widget.registrationData['course'] ?? 'N/A'),
                    _buildInfoRow('Gender', widget.registrationData['gender'] ?? 'N/A'),
                    _buildInfoRow('Category', widget.registrationData['category'] ?? 'N/A'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Payment Buttons (Simulation)
            if (_isProcessing)
              const Center(
                child: Column(
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text(
                      'Processing Payment...',
                      style: TextStyle(fontSize: 16),
                    ),
                  ],
                ),
              )
            else
              Column(
                children: [
                  // Success Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton.icon(
                      onPressed: () => _handlePayment(true),
                      icon: const Icon(Icons.check_circle_outline),
                      label: const Text(
                        'Simulate Payment Success',
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
                  const SizedBox(height: 16),
                  
                  // Failed Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: OutlinedButton.icon(
                      onPressed: () => _handlePayment(false),
                      icon: const Icon(Icons.error_outline),
                      label: const Text(
                        'Simulate Payment Failed',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red.shade600,
                        side: BorderSide(color: Colors.red.shade600, width: 2),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 24),

            // Security Note
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.security,
                    color: Colors.blue.shade600,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'This is a simulation. In production, this would integrate with a real payment gateway like Razorpay, PayU, or Paytm.',
                      style: TextStyle(
                        color: Colors.blue.shade700,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeeItem(String label, String amount, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 18 : 16,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              color: isTotal ? Colors.green.shade700 : Colors.black87,
            ),
          ),
          Text(
            amount,
            style: TextStyle(
              fontSize: isTotal ? 18 : 16,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.w500,
              color: isTotal ? Colors.green.shade700 : Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                color: Colors.black54,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _handlePayment(bool isSuccess) {
    setState(() {
      _isProcessing = true;
    });

    // Simulate payment processing
    Future.delayed(const Duration(seconds: 2), () {
      setState(() {
        _isProcessing = false;
      });

      if (isSuccess) {
        _showDeclarationDialog();
      } else {
        _showPaymentFailedDialog();
      }
    });
  }

  void _showPaymentFailedDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Row(
          children: [
            Icon(Icons.error, color: Colors.red.shade600),
            const SizedBox(width: 8),
            const Text('Payment Failed'),
          ],
        ),
        content: const Text(
          'Your payment could not be processed. Please try again or contact support if the issue persists.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
            },
            child: const Text('Try Again'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Go back to registration form
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              foregroundColor: Colors.white,
            ),
            child: const Text('Go Back'),
          ),
        ],
      ),
    );
  }

  void _showDeclarationDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => DeclarationDialog(
        registrationData: widget.registrationData,
      ),
    );
  }
}

class DeclarationDialog extends StatefulWidget {
  final Map<String, dynamic> registrationData;

  const DeclarationDialog({
    super.key,
    required this.registrationData,
  });

  @override
  State<DeclarationDialog> createState() => _DeclarationDialogState();
}

class _DeclarationDialogState extends State<DeclarationDialog> {
  bool _studentDeclaration = false;
  bool _parentConsent = false;
  bool _isSubmitting = false;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      title: const Text(
        'Declaration and Undertaking',
        style: TextStyle(
          fontWeight: FontWeight.bold,
          color: Colors.orange,
        ),
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Please read and agree to the following declarations:',
              style: TextStyle(
                fontWeight: FontWeight.w500,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 16),
            
            // Student Declaration
            CheckboxListTile(
              value: _studentDeclaration,
              onChanged: (value) {
                setState(() {
                  _studentDeclaration = value!;
                });
              },
              title: const Text(
                'Student Declaration',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: const Text(
                'I state that all the above statements are true to the best of my knowledge and belief. If admitted, I shall abide by the hostel rules as in force at any time and accept to subject to any disciplinary action imposed by the Hostel authorities.',
                style: TextStyle(fontSize: 13),
              ),
              controlAffinity: ListTileControlAffinity.leading,
            ),
            
            // Parent Consent
            CheckboxListTile(
              value: _parentConsent,
              onChanged: (value) {
                setState(() {
                  _parentConsent = value!;
                });
              },
              title: const Text(
                'Parent/Guardian Consent',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: const Text(
                'I assure that my son/daughter will abide by the rules. The applicant may be admitted to the hostel.',
                style: TextStyle(fontSize: 13),
              ),
              controlAffinity: ListTileControlAffinity.leading,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.pop(context);
            Navigator.pop(context); // Go back to payment
          },
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: (_studentDeclaration && _parentConsent && !_isSubmitting)
              ? _submitRegistration
              : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.green.shade600,
            foregroundColor: Colors.white,
          ),
          child: _isSubmitting
              ? const SizedBox(
                  height: 16,
                  width: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : const Text('Submit Registration'),
        ),
      ],
    );
  }

  void _submitRegistration() async {
    setState(() {
      _isSubmitting = true;
    });

    try {
      // Submit complete registration with payment and declaration status
      final result = await RegistrationService.submitCompleteRegistration(
        registrationData: widget.registrationData,
        paymentStatus: true,
        declarationAccepted: _studentDeclaration,
        parentConsent: _parentConsent,
      );

      if (mounted) {
        Navigator.pop(context); // Close declaration dialog
        Navigator.pop(context); // Close payment screen
        Navigator.pop(context); // Go back to login screen

        if (result['success']) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message']),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 5),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message']),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error submitting registration: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }
}