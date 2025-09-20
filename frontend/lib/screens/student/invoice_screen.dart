import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/invoice_service.dart';

class InvoiceScreen extends StatefulWidget {
  final String invoiceId;
  final String? userToken;
  
  const InvoiceScreen({
    super.key,
    required this.invoiceId,
    this.userToken,
  });

  @override
  State<InvoiceScreen> createState() => _InvoiceScreenState();
}

class _InvoiceScreenState extends State<InvoiceScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _invoice;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadInvoice();
  }

  void _loadInvoice() async {
    try {
      final result = await InvoiceService.getInvoice(widget.invoiceId, widget.userToken);
      
      if (result['success']) {
        setState(() {
          _invoice = result['data'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = result['message'];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error loading invoice: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Invoice Details'),
        backgroundColor: Colors.blue.shade600,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          if (_invoice != null)
            IconButton(
              icon: const Icon(Icons.download),
              onPressed: _downloadInvoice,
              tooltip: 'Download Invoice',
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? _buildErrorView()
              : _buildInvoiceView(),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              'Error Loading Invoice',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.red.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _isLoading = true;
                  _errorMessage = null;
                });
                _loadInvoice();
              },
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInvoiceView() {
    final invoice = _invoice!;
    final studentDetails = invoice['studentDetails'] ?? {};
    final feeDetails = invoice['feeDetails'] ?? {};
    final paymentDetails = invoice['paymentDetails'] ?? {};
    final collegeDetails = invoice['collegeDetails'] ?? {};

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // College Header
          Card(
            elevation: 3,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.blue.shade600, Colors.blue.shade400],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                    ),
                    child: Center(
                      child: Text(
                        'UCET',
                        style: TextStyle(
                          color: Colors.blue.shade600,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    collegeDetails['name'] ?? 'University College of Engineering Tindivanam',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    collegeDetails['address'] ?? 'Melpakkam, Tindivanam - 604 001, Villupuram District, Tamil Nadu',
                    style: TextStyle(
                      color: Colors.blue.shade100,
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Invoice Title
          Center(
            child: Text(
              'HOSTEL FEE INVOICE',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.blue.shade700,
                letterSpacing: 2,
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Invoice Information
          Row(
            children: [
              Expanded(
                child: _buildInfoCard(
                  'Invoice Details',
                  [
                    _InfoItem('Invoice Number', invoice['invoiceNumber'] ?? 'N/A'),
                    _InfoItem('Invoice Date', invoice['formattedInvoiceDate'] ?? 'N/A'),
                    _InfoItem('Academic Year', invoice['academicYear'] ?? 'N/A'),
                    _InfoItem('Payment Date', invoice['formattedPaymentDate'] ?? 'N/A'),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildInfoCard(
                  'Student Details',
                  [
                    _InfoItem('Name', studentDetails['name'] ?? 'N/A'),
                    _InfoItem('Register Number', studentDetails['registerNumber'] ?? 'N/A'),
                    _InfoItem('Course', studentDetails['course'] ?? 'N/A'),
                    _InfoItem('Year', studentDetails['year']?.toString() ?? 'N/A'),
                    _InfoItem('Gender', studentDetails['gender'] ?? 'N/A'),
                    _InfoItem('Hostel', studentDetails['hostelType'] ?? 'N/A'),
                  ],
                ),
              ),
            ],
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
                  Text(
                    'Fee Breakdown',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue.shade700,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildFeeItem('Admission Fee', feeDetails['admissionFee']),
                  _buildFeeItem('Hostel Amenities & Appliances Fund', feeDetails['amenitiesFund']),
                  _buildFeeItem('Block Advance (Refundable)', feeDetails['blockAdvance']),
                  _buildFeeItem('Room Rent (Annual)', feeDetails['roomRent']),
                  _buildFeeItem('Electricity Charges (Annual)', feeDetails['electricityCharges']),
                  _buildFeeItem('Water Charges (Annual)', feeDetails['waterCharges']),
                  _buildFeeItem('Establishment Charges (Annual)', feeDetails['establishmentCharges']),
                  _buildFeeItem('Mess Advance (Annual)', feeDetails['messAdvance']),
                  const Divider(thickness: 2),
                  _buildFeeItem('Total Amount', feeDetails['totalAmount'], isTotal: true),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Payment Status
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.green.shade100,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.green.shade300),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.check_circle,
                  color: Colors.green.shade600,
                  size: 32,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'PAYMENT COMPLETED SUCCESSFULLY',
                        style: TextStyle(
                          color: Colors.green.shade700,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Transaction ID: ${paymentDetails['transactionId'] ?? 'N/A'}',
                        style: TextStyle(
                          color: Colors.green.shade600,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Payment Information
          _buildInfoCard(
            'Payment Information',
            [
              _InfoItem('Payment ID', paymentDetails['paymentId'] ?? 'N/A'),
              _InfoItem('Transaction ID', paymentDetails['transactionId'] ?? 'N/A'),
              _InfoItem('Payment Method', paymentDetails['paymentMethod'] ?? 'N/A'),
              _InfoItem('Payment Status', paymentDetails['paymentStatus'] ?? 'N/A'),
            ],
          ),
          const SizedBox(height: 32),

          // Download Button
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton.icon(
              onPressed: _downloadInvoice,
              icon: const Icon(Icons.download),
              label: const Text(
                'Download Invoice',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue.shade600,
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
    );
  }

  Widget _buildInfoCard(String title, List<_InfoItem> items) {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.blue.shade700,
              ),
            ),
            const SizedBox(height: 12),
            ...items.map((item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 2,
                    child: Text(
                      '${item.label}:',
                      style: const TextStyle(
                        fontWeight: FontWeight.w500,
                        color: Colors.black54,
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 3,
                    child: Text(
                      item.value,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildFeeItem(String label, dynamic amount, {bool isTotal = false}) {
    final amountStr = amount != null ? '₹${amount.toString()}' : '₹0';
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: isTotal ? 18 : 16,
                fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
                color: isTotal ? Colors.blue.shade700 : Colors.black87,
              ),
            ),
          ),
          Text(
            amountStr,
            style: TextStyle(
              fontSize: isTotal ? 18 : 16,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.w500,
              color: isTotal ? Colors.blue.shade700 : Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  void _downloadInvoice() async {
    try {
      final downloadUrl = InvoiceService.getDownloadUrl(widget.invoiceId);
      
      // Show download dialog
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
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
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
            ElevatedButton.icon(
              onPressed: () {
                Clipboard.setData(ClipboardData(text: downloadUrl));
                Navigator.pop(context);
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

class _InfoItem {
  final String label;
  final String value;
  
  _InfoItem(this.label, this.value);
}