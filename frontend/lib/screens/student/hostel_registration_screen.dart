import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../../services/registration_service.dart';
import 'payment_gateway_screen.dart';

class HostelRegistrationScreen extends StatefulWidget {
  const HostelRegistrationScreen({super.key});

  @override
  State<HostelRegistrationScreen> createState() => _HostelRegistrationScreenState();
}

class _HostelRegistrationScreenState extends State<HostelRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _scrollController = ScrollController();
  
  // Controllers for form fields
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _courseController = TextEditingController();
  final _parentNameController = TextEditingController();
  final _parentOccupationController = TextEditingController();
  final _parentAddressController = TextEditingController();
  final _parentPinController = TextEditingController();
  final _parentContactController = TextEditingController();
  final _guardianNameController = TextEditingController();
  final _guardianOccupationController = TextEditingController();
  final _guardianAddressController = TextEditingController();
  final _guardianPinController = TextEditingController();
  final _guardianContactController = TextEditingController();
  
  // Form data
  String _selectedGender = '';
  String _selectedCategory = '';
  String _selectedMess = '';
  File? _profileImage;
  bool _declarationAccepted = false;
  bool _parentConsent = false;
  bool _obscurePassword = true;
  String _academicYear = '2024-2025';
  
  final ImagePicker _picker = ImagePicker();

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _courseController.dispose();
    _parentNameController.dispose();
    _parentOccupationController.dispose();
    _parentAddressController.dispose();
    _parentPinController.dispose();
    _parentContactController.dispose();
    _guardianNameController.dispose();
    _guardianOccupationController.dispose();
    _guardianAddressController.dispose();
    _guardianPinController.dispose();
    _guardianContactController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 300,
      maxHeight: 300,
    );
    
    if (image != null) {
      setState(() {
        _profileImage = File(image.path);
      });
    }
  }

  Widget _buildSectionTitle(String title) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        vertical: MediaQuery.of(context).size.width > 600 ? 16 : 12,
        horizontal: 16,
      ),
      margin: EdgeInsets.only(
        top: MediaQuery.of(context).size.width > 600 ? 20 : 16,
        bottom: MediaQuery.of(context).size.width > 600 ? 12 : 8,
      ),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Text(
        title,
        style: TextStyle(
          fontSize: MediaQuery.of(context).size.width > 600 ? 18 : 16,
          fontWeight: FontWeight.bold,
          color: Colors.blue,
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    String? hint,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return Container(
      margin: EdgeInsets.only(
        bottom: MediaQuery.of(context).size.width > 600 ? 20 : 16,
      ),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        inputFormatters: inputFormatters,
        maxLines: maxLines,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.blue.shade600, width: 2),
          ),
          filled: true,
          fillColor: Colors.grey.shade50,
          contentPadding: EdgeInsets.symmetric(
            horizontal: 16,
            vertical: MediaQuery.of(context).size.width > 600 ? 16 : 12,
          ),
          labelStyle: TextStyle(
            fontSize: MediaQuery.of(context).size.width > 600 ? 16 : 14,
          ),
        ),
        style: TextStyle(
          fontSize: MediaQuery.of(context).size.width > 600 ? 16 : 14,
        ),
        validator: validator ?? (value) {
          if (value == null || value.isEmpty) {
            return 'Please enter $label';
          }
          return null;
        },
      ),
    );
  }

  Widget _buildPasswordField() {
    return Container(
      margin: EdgeInsets.only(
        bottom: MediaQuery.of(context).size.width > 600 ? 20 : 16,
      ),
      child: TextFormField(
        controller: _passwordController,
        obscureText: _obscurePassword,
        decoration: InputDecoration(
          labelText: 'Password',
          hintText: 'Enter your password',
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.blue.shade600, width: 2),
          ),
          filled: true,
          fillColor: Colors.grey.shade50,
          contentPadding: EdgeInsets.symmetric(
            horizontal: 16,
            vertical: MediaQuery.of(context).size.width > 600 ? 16 : 12,
          ),
          labelStyle: TextStyle(
            fontSize: MediaQuery.of(context).size.width > 600 ? 16 : 14,
          ),
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePassword ? Icons.visibility : Icons.visibility_off,
              color: Colors.grey.shade600,
            ),
            onPressed: () {
              setState(() {
                _obscurePassword = !_obscurePassword;
              });
            },
          ),
        ),
        style: TextStyle(
          fontSize: MediaQuery.of(context).size.width > 600 ? 16 : 14,
        ),
        validator: (value) {
          if (value == null || value.isEmpty) {
            return 'Please enter your password';
          }
          if (value.length < 6) {
            return 'Password must be at least 6 characters long';
          }
          return null;
        },
      ),
    );
  }

  Widget _buildGenderSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Gender *',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: RadioListTile<String>(
                title: const Text('Male'),
                value: 'Male',
                groupValue: _selectedGender,
                onChanged: (value) {
                  setState(() {
                    _selectedGender = value!;
                  });
                },
              ),
            ),
            Expanded(
              child: RadioListTile<String>(
                title: const Text('Female'),
                value: 'Female',
                groupValue: _selectedGender,
                onChanged: (value) {
                  setState(() {
                    _selectedGender = value!;
                  });
                },
              ),
            ),
          ],
        ),
        RadioListTile<String>(
          title: const Text('Transgender'),
          value: 'Transgender',
          groupValue: _selectedGender,
          onChanged: (value) {
            setState(() {
              _selectedGender = value!;
            });
          },
        ),
        if (_selectedGender.isEmpty)
          const Padding(
            padding: EdgeInsets.only(left: 12, top: 4),
            child: Text(
              'Please select gender',
              style: TextStyle(color: Colors.red, fontSize: 12),
            ),
          ),
      ],
    );
  }

  Widget _buildCategorySelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Category *',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 8),
        Wrap(
          children: ['FC', 'BC', 'MBC', 'SC', 'ST'].map((category) {
            return Container(
              margin: const EdgeInsets.only(right: 8, bottom: 8),
              child: FilterChip(
                label: Text(category),
                selected: _selectedCategory == category,
                onSelected: (bool selected) {
                  setState(() {
                    _selectedCategory = selected ? category : '';
                  });
                },
                selectedColor: Colors.blue.shade100,
              ),
            );
          }).toList(),
        ),
        if (_selectedCategory.isEmpty)
          const Padding(
            padding: EdgeInsets.only(left: 12, top: 4),
            child: Text(
              'Please select category',
              style: TextStyle(color: Colors.red, fontSize: 12),
            ),
          ),
      ],
    );
  }

  Widget _buildMessSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Mess Preference *',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: RadioListTile<String>(
                title: const Text('VEG'),
                value: 'VEG',
                groupValue: _selectedMess,
                onChanged: (value) {
                  setState(() {
                    _selectedMess = value!;
                  });
                },
              ),
            ),
            Expanded(
              child: RadioListTile<String>(
                title: const Text('NON VEG'),
                value: 'NON VEG',
                groupValue: _selectedMess,
                onChanged: (value) {
                  setState(() {
                    _selectedMess = value!;
                  });
                },
              ),
            ),
          ],
        ),
        if (_selectedMess.isEmpty)
          const Padding(
            padding: EdgeInsets.only(left: 12, top: 4),
            child: Text(
              'Please select mess preference',
              style: TextStyle(color: Colors.red, fontSize: 12),
            ),
          ),
      ],
    );
  }

  Widget _buildPhotoSection() {
    final isTablet = MediaQuery.of(context).size.width > 600;
    final photoHeight = isTablet ? 180.0 : 160.0;
    final photoWidth = isTablet ? 140.0 : 120.0;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Passport Size Photograph *',
          style: TextStyle(
            fontSize: isTablet ? 18 : 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        SizedBox(height: isTablet ? 12 : 8),
        Center(
          child: Container(
            height: photoHeight,
            width: photoWidth,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300, width: 2),
              borderRadius: BorderRadius.circular(12),
              color: Colors.grey.shade50,
            ),
            child: _profileImage != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.file(
                      _profileImage!,
                      fit: BoxFit.cover,
                    ),
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.camera_alt_outlined,
                        size: isTablet ? 48 : 40,
                        color: Colors.grey.shade500,
                      ),
                      SizedBox(height: isTablet ? 12 : 8),
                      Text(
                        'Tap to add photo',
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: isTablet ? 14 : 12,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
          ),
        ),
        SizedBox(height: isTablet ? 16 : 12),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _pickImage,
            icon: const Icon(Icons.upload_outlined),
            label: const Text('Upload Photo'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue.shade100,
              foregroundColor: Colors.blue.shade700,
              padding: EdgeInsets.symmetric(
                vertical: isTablet ? 16 : 12,
                horizontal: 16,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFeesTable() {
    final fees = [
      {'detail': 'Admission fee', 'amount': '500.00'},
      {'detail': 'Hostel Amenities & Appliances Fund', 'amount': '600.00'},
      {'detail': 'Block Advance (Refundable)', 'amount': '5,000.00'},
      {'detail': 'Room Rent (Every Year)', 'amount': '600.00'},
      {'detail': 'Electricity Charges - (Every Year)', 'amount': '600.00'},
      {'detail': 'Water Charges-(Every Year)', 'amount': '500.00'},
      {'detail': 'Establishment Charges (Every Year)', 'amount': '15,000.00'},
      {'detail': 'Mess Advance - (Every Year)', 'amount': '24,000.00'},
    ];

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(8),
                topRight: Radius.circular(8),
              ),
            ),
            child: const Text(
              'Fees Particulars',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
          ),
          Table(
            columnWidths: const {
              0: FlexColumnWidth(1),
              1: FlexColumnWidth(3),
              2: FlexColumnWidth(2),
            },
            children: [
              const TableRow(
                decoration: BoxDecoration(color: Colors.grey),
                children: [
                  Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Text('SI.No.', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                  Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Text('Details', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                  Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Text('Amount (Rs.)', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              ...fees.asMap().entries.map((entry) {
                return TableRow(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Text('${entry.key + 1}.'),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Text(entry.value['detail']!),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Text(entry.value['amount']!),
                    ),
                  ],
                );
              }).toList(),
              const TableRow(
                decoration: BoxDecoration(color: Colors.green),
                children: [
                  Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Text('Total', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                  Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Text('', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                  Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Text('46,800.00', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDeclarationSection() {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        border: Border.all(color: Colors.orange.shade200),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'DECLARATION AND UNDERTAKING',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.orange,
            ),
          ),
          const SizedBox(height: 12),
          CheckboxListTile(
            value: _declarationAccepted,
            onChanged: (value) {
              setState(() {
                _declarationAccepted = value!;
              });
            },
            title: const Text(
              'I state that all the above statements are true to the best of my knowledge and belief. If admitted, I shall abide by the hostel rules as in force at any time and accept to subject to any disciplinary action imposed by the Hostel authorities.',
              style: TextStyle(fontSize: 14),
            ),
            controlAffinity: ListTileControlAffinity.leading,
          ),
          const SizedBox(height: 8),
          CheckboxListTile(
            value: _parentConsent,
            onChanged: (value) {
              setState(() {
                _parentConsent = value!;
              });
            },
            title: const Text(
              'Parent/Guardian Consent: I assure that my son/daughter will abide by the rules. The applicant may be admitted to the hostel.',
              style: TextStyle(fontSize: 14),
            ),
            controlAffinity: ListTileControlAffinity.leading,
          ),
        ],
      ),
    );
  }

  void _submitForm() async {
    if (_formKey.currentState!.validate()) {
      if (_selectedGender.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select gender')),
        );
        return;
      }
      if (_selectedCategory.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select category')),
        );
        return;
      }
      if (_selectedMess.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select mess preference')),
        );
        return;
      }

      // Prepare registration data
      final registrationData = {
        'name': _nameController.text,
        'email': _emailController.text,
        'password': _passwordController.text,
        'course': _courseController.text,
        'gender': _selectedGender,
        'category': _selectedCategory,
        'messPreference': _selectedMess,
        'parentName': _parentNameController.text,
        'parentOccupation': _parentOccupationController.text,
        'parentAddress': _parentAddressController.text,
        'parentPin': _parentPinController.text,
        'parentContact': _parentContactController.text,
        'guardianName': _guardianNameController.text,
        'guardianOccupation': _guardianOccupationController.text,
        'guardianAddress': _guardianAddressController.text,
        'guardianPin': _guardianPinController.text,
        'guardianContact': _guardianContactController.text,
        'profileImagePath': _profileImage?.path,
        'submittedAt': DateTime.now().toIso8601String(),
      };

      // Navigate to payment gateway
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => PaymentGatewayScreen(
            registrationData: registrationData,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Hostel Registration'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          controller: _scrollController,
          padding: EdgeInsets.symmetric(
            horizontal: MediaQuery.of(context).size.width > 600 ? 24 : 16,
            vertical: 12,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.blue.shade700, Colors.blue.shade500],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    const Text(
                      'UNIVERSITY COLLEGE OF ENGINEERING TINDIVANAM',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      '(A Constituent College of Anna University, Chennai)',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white70,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'MELPAKKAM 604 307. TINDIVANAM',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white70,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Application for admission to hostel for the year $_academicYear',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),

              // Basic Information
              _buildSectionTitle('1. Basic Information'),
              
              // Responsive layout for mobile vs tablet
              MediaQuery.of(context).size.width > 600
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 2,
                          child: Column(
                            children: [
                              _buildTextField(
                                controller: _nameController,
                                label: 'Name of the Applicant',
                                hint: 'Enter your full name',
                              ),
                              _buildTextField(
                                controller: _emailController,
                                label: 'Email Address',
                                hint: 'Enter your email address',
                                keyboardType: TextInputType.emailAddress,
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Please enter your email address';
                                  }
                                  if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                                    return 'Please enter a valid email address';
                                  }
                                  return null;
                                },
                              ),
                              _buildPasswordField(),
                              _buildTextField(
                                controller: _courseController,
                                label: 'Course',
                                hint: 'e.g., B.Tech Computer Science',
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 24),
                        Expanded(
                          flex: 1,
                          child: _buildPhotoSection(),
                        ),
                      ],
                    )
                  : Column(
                      children: [
                        _buildTextField(
                          controller: _nameController,
                          label: 'Name of the Applicant',
                          hint: 'Enter your full name',
                        ),
                        _buildTextField(
                          controller: _emailController,
                          label: 'Email Address',
                          hint: 'Enter your email address',
                          keyboardType: TextInputType.emailAddress,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your email address';
                            }
                            if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                              return 'Please enter a valid email address';
                            }
                            return null;
                          },
                        ),
                        _buildPasswordField(),
                        _buildTextField(
                          controller: _courseController,
                          label: 'Course',
                          hint: 'e.g., B.Tech Computer Science',
                        ),
                        const SizedBox(height: 16),
                        _buildPhotoSection(),
                      ],
                    ),
              
              const SizedBox(height: 16),
              _buildGenderSelection(),
              const SizedBox(height: 16),
              _buildCategorySelection(),

              // Parent/Guardian Information
              _buildSectionTitle('2. Parent/Guardian Information'),
              _buildTextField(
                controller: _parentNameController,
                label: 'Name of the Parent/Guardian',
                hint: 'Enter parent/guardian name',
              ),
              _buildTextField(
                controller: _parentOccupationController,
                label: 'Occupation',
                hint: 'Enter occupation',
              ),
              _buildTextField(
                controller: _parentAddressController,
                label: 'Residential Address',
                hint: 'Enter complete address',
                maxLines: 3,
              ),
              // Responsive row for PIN and Contact
              MediaQuery.of(context).size.width > 600
                  ? Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _parentPinController,
                            label: 'PIN Code',
                            hint: 'Enter PIN code',
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(6),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildTextField(
                            controller: _parentContactController,
                            label: 'Contact Number',
                            hint: 'Enter mobile number',
                            keyboardType: TextInputType.phone,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(10),
                            ],
                          ),
                        ),
                      ],
                    )
                  : Column(
                      children: [
                        _buildTextField(
                          controller: _parentPinController,
                          label: 'PIN Code',
                          hint: 'Enter PIN code',
                          keyboardType: TextInputType.number,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            LengthLimitingTextInputFormatter(6),
                          ],
                        ),
                        _buildTextField(
                          controller: _parentContactController,
                          label: 'Contact Number',
                          hint: 'Enter mobile number',
                          keyboardType: TextInputType.phone,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            LengthLimitingTextInputFormatter(10),
                          ],
                        ),
                      ],
                    ),

              // Local Guardian Information
              _buildSectionTitle('3. Local Guardian Information'),
              _buildTextField(
                controller: _guardianNameController,
                label: 'Name of the Local Guardian',
                hint: 'Enter local guardian name',
              ),
              _buildTextField(
                controller: _guardianOccupationController,
                label: 'Occupation',
                hint: 'Enter occupation',
              ),
              _buildTextField(
                controller: _guardianAddressController,
                label: 'Residential Address',
                hint: 'Enter complete address',
                maxLines: 3,
              ),
              // Responsive row for Guardian PIN and Contact
              MediaQuery.of(context).size.width > 600
                  ? Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _guardianPinController,
                            label: 'PIN Code',
                            hint: 'Enter PIN code',
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(6),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildTextField(
                            controller: _guardianContactController,
                            label: 'Contact Number',
                            hint: 'Enter mobile number',
                            keyboardType: TextInputType.phone,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(10),
                            ],
                          ),
                        ),
                      ],
                    )
                  : Column(
                      children: [
                        _buildTextField(
                          controller: _guardianPinController,
                          label: 'PIN Code',
                          hint: 'Enter PIN code',
                          keyboardType: TextInputType.number,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            LengthLimitingTextInputFormatter(6),
                          ],
                        ),
                        _buildTextField(
                          controller: _guardianContactController,
                          label: 'Contact Number',
                          hint: 'Enter mobile number',
                          keyboardType: TextInputType.phone,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            LengthLimitingTextInputFormatter(10),
                          ],
                        ),
                      ],
                    ),

              // Mess Preference
              _buildSectionTitle('4. Mess Preference'),
              _buildMessSelection(),

              // Fees Information
              _buildSectionTitle('5. Fees Information'),
              _buildFeesTable(),

              // Submit Button
              Container(
                width: double.infinity,
                margin: EdgeInsets.symmetric(
                  vertical: MediaQuery.of(context).size.width > 600 ? 32 : 24,
                ),
                child: ElevatedButton(
                  onPressed: _submitForm,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue.shade600,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(
                      vertical: MediaQuery.of(context).size.width > 600 ? 20 : 16,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 3,
                  ),
                  child: Text(
                    'Proceed to Payment',
                    style: TextStyle(
                      fontSize: MediaQuery.of(context).size.width > 600 ? 20 : 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}