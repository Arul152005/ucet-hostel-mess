const express = require('express');
const User = require('../models/User');
const TempRegistration = require('../models/TempRegistration');
const BoysHostelUser = require('../models/BoysHostelUser');
const GirlsHostelUser = require('../models/GirlsHostelUser');
const invoiceService = require('../services/invoiceService');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Submit hostel registration (temporary storage before payment)
router.post('/submit', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      dateOfBirth,
      course,
      year,
      gender,
      category,
      messPreference,
      parentInfo,
      guardianInfo,
      profileImagePath,
      submittedAt
    } = req.body;

    // Check if user already exists in temporary registrations
    const existingTempReg = await TempRegistration.findOne({ email });
    if (existingTempReg) {
      return res.status(400).json({
        success: false,
        message: 'Registration with this email already exists. Please complete payment or use a different email.'
      });
    }

    // Check if user already exists in permanent collections
    const existingBoysUser = await BoysHostelUser.findOne({ email });
    const existingGirlsUser = await GirlsHostelUser.findOne({ email });
    
    if (existingBoysUser || existingGirlsUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email is already registered and completed payment'
      });
    }

    // Create temporary registration object
    const tempRegistrationData = {
      name,
      email,
      password,
      dateOfBirth: new Date(dateOfBirth),
      course,
      year,
      gender: gender.toLowerCase(),
      category,
      messPreference,
      parentInfo,
      guardianInfo,
      profileImagePath,
      status: 'pending_payment',
      submittedAt: submittedAt || new Date()
    };

    const tempRegistration = new TempRegistration(tempRegistrationData);
    await tempRegistration.save();

    // Return success response without password
    const registrationResponse = tempRegistration.toObject();
    delete registrationResponse.password;

    res.status(201).json({
      success: true,
      message: 'Registration saved temporarily. Please complete payment to confirm your hostel admission.',
      data: {
        tempRegistration: registrationResponse,
        registrationId: tempRegistration._id,
        paymentRequired: true,
        expiresAt: tempRegistration.expiresAt
      }
    });

  } catch (error) {
    console.error('Registration submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration submission failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get registration status (checks both temporary and permanent collections)
router.get('/status/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    // First check temporary registrations
    const tempRegistration = await TempRegistration.findOne({ 
      $or: [
        { _id: identifier },
        { email: identifier }
      ]
    }).select('-password');

    if (tempRegistration) {
      return res.json({
        success: true,
        data: {
          registration: tempRegistration,
          status: tempRegistration.status,
          submittedAt: tempRegistration.submittedAt,
          isTemporary: true,
          paymentRequired: true,
          expiresAt: tempRegistration.expiresAt
        }
      });
    }

    // Check permanent collections
    const boysUser = await BoysHostelUser.findOne({ 
      $or: [
        { registerNumber: identifier },
        { _id: identifier },
        { email: identifier }
      ]
    }).select('-password');

    if (boysUser) {
      return res.json({
        success: true,
        data: {
          user: boysUser,
          status: 'completed',
          hostelType: 'Boys Hostel',
          submittedAt: boysUser.registrationData?.originalSubmissionDate,
          completedAt: boysUser.registrationData?.paymentCompletedAt,
          isVerified: boysUser.isVerified,
          isActive: boysUser.isActive,
          canLogin: true
        }
      });
    }

    const girlsUser = await GirlsHostelUser.findOne({ 
      $or: [
        { registerNumber: identifier },
        { _id: identifier },
        { email: identifier }
      ]
    }).select('-password');

    if (girlsUser) {
      return res.json({
        success: true,
        data: {
          user: girlsUser,
          status: 'completed',
          hostelType: 'Girls Hostel',
          submittedAt: girlsUser.registrationData?.originalSubmissionDate,
          completedAt: girlsUser.registrationData?.paymentCompletedAt,
          isVerified: girlsUser.isVerified,
          isActive: girlsUser.isActive,
          canLogin: true
        }
      });
    }

    // Not found in any collection
    return res.status(404).json({
      success: false,
      message: 'Registration not found'
    });

  } catch (error) {
    console.error('Registration status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get registration status'
    });
  }
});

// Complete registration after payment success
router.post('/complete-payment', async (req, res) => {
  try {
    const {
      email,
      paymentId,
      transactionId,
      paymentMethod,
      paymentDate,
      amount
    } = req.body;

    // Find temporary registration
    const tempRegistration = await TempRegistration.findOne({ email });
    if (!tempRegistration) {
      return res.status(404).json({
        success: false,
        message: 'Temporary registration not found or has expired'
      });
    }

    // Update payment details in temporary registration
    tempRegistration.paymentDetails = {
      paymentId,
      transactionId,
      paymentMethod,
      paymentDate: paymentDate || new Date(),
      amount: amount || 46800
    };
    tempRegistration.status = 'completed';
    await tempRegistration.save();

    // Parse name into first and last name
    const nameParts = tempRegistration.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Create user data for permanent collection
    const permanentUserData = {
      firstName,
      lastName: lastName || firstName,
      email: tempRegistration.email,
      password: tempRegistration.password, // Already hashed
      phone: tempRegistration.parentInfo.contact,
      dateOfBirth: tempRegistration.dateOfBirth,
      course: tempRegistration.course,
      year: tempRegistration.year,
      gender: tempRegistration.gender,
      category: tempRegistration.category,
      messPreference: tempRegistration.messPreference,
      parentContact: {
        name: tempRegistration.parentInfo.name,
        occupation: tempRegistration.parentInfo.occupation,
        phone: tempRegistration.parentInfo.contact,
        address: tempRegistration.parentInfo.address,
        pincode: tempRegistration.parentInfo.pin
      },
      emergencyContact: {
        name: tempRegistration.guardianInfo.name,
        occupation: tempRegistration.guardianInfo.occupation,
        phone: tempRegistration.guardianInfo.contact,
        address: tempRegistration.guardianInfo.address,
        pincode: tempRegistration.guardianInfo.pin,
        relationship: 'Guardian'
      },
      profilePicture: tempRegistration.profileImagePath,
      paymentDetails: {
        tempRegistrationId: tempRegistration._id,
        paymentId,
        transactionId,
        paymentMethod,
        paymentDate: paymentDate || new Date(),
        amount: amount || 46800,
        status: 'completed'
      },
      registrationData: {
        originalSubmissionDate: tempRegistration.submittedAt,
        paymentCompletedAt: new Date(),
        status: 'completed_with_payment'
      },
      isVerified: true,
      isActive: true
    };

    let permanentUser;
    let hostelType;

    // Save to appropriate collection based on gender
    if (tempRegistration.gender === 'male') {
      permanentUser = new BoysHostelUser(permanentUserData);
      hostelType = 'Boys Hostel';
    } else {
      // female or transgender go to girls hostel
      permanentUser = new GirlsHostelUser(permanentUserData);
      hostelType = 'Girls Hostel';
    }

    await permanentUser.save();

    // Generate invoice after successful payment
    try {
      const invoiceData = {
        studentName: permanentUser.firstName + ' ' + permanentUser.lastName,
        studentEmail: permanentUser.email,
        registerNumber: permanentUser.registerNumber,
        course: permanentUser.course,
        year: permanentUser.year,
        gender: permanentUser.gender,
        category: permanentUser.category,
        hostelType: hostelType,
        paymentId: paymentId,
        transactionId: transactionId,
        paymentMethod: paymentMethod,
        paymentDate: paymentDate || new Date(),
        tempRegistrationId: tempRegistration._id,
        studentId: permanentUser._id,
        studentCollection: tempRegistration.gender === 'male' ? 'BoysHostelUser' : 'GirlsHostelUser'
      };

      const invoiceResult = await invoiceService.createInvoice(invoiceData);
      
      if (invoiceResult.success) {
        console.log('Invoice generated successfully:', invoiceResult.invoice.invoiceNumber);
      }
    } catch (invoiceError) {
      console.error('Invoice generation failed:', invoiceError);
      // Don't fail the registration if invoice generation fails
    }

    // Remove temporary registration after successful migration
    await TempRegistration.findByIdAndDelete(tempRegistration._id);

    // Return success response without password
    const userResponse = permanentUser.toObject();
    delete userResponse.password;

    // Try to get the generated invoice
    let invoiceInfo = null;
    try {
      const invoices = await invoiceService.getInvoicesByStudent(permanentUser.email);
      if (invoices && invoices.length > 0) {
        const latestInvoice = invoices[0];
        invoiceInfo = {
          invoiceNumber: latestInvoice.invoiceNumber,
          invoiceId: latestInvoice._id,
          totalAmount: latestInvoice.feeDetails.totalAmount,
          invoiceDate: latestInvoice.formattedInvoiceDate
        };
      }
    } catch (invoiceRetrievalError) {
      console.error('Failed to retrieve invoice info:', invoiceRetrievalError);
    }

    res.status(201).json({
      success: true,
      message: `Registration completed successfully! Welcome to ${hostelType}.`,
      data: {
        user: userResponse,
        hostelType,
        registerNumber: permanentUser.registerNumber,
        canLogin: true,
        invoice: invoiceInfo
      }
    });

  } catch (error) {
    console.error('Payment completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete registration after payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all registrations (for admin) - includes temporary and permanent
router.get('/all', authenticate, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!req.user.isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Staff privileges required.'
      });
    }

    // Get temporary registrations
    const tempRegistrations = await TempRegistration.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    // Get boys hostel users
    const boysUsers = await BoysHostelUser.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    // Get girls hostel users
    const girlsUsers = await GirlsHostelUser.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    // Format response
    const response = {
      temporary: tempRegistrations.map(reg => ({
        ...reg.toObject(),
        type: 'temporary',
        paymentStatus: reg.status
      })),
      boysHostel: boysUsers.map(user => ({
        ...user.toObject(),
        type: 'permanent',
        hostelType: 'Boys Hostel',
        paymentStatus: 'completed'
      })),
      girlsHostel: girlsUsers.map(user => ({
        ...user.toObject(),
        type: 'permanent',
        hostelType: 'Girls Hostel',
        paymentStatus: 'completed'
      })),
      summary: {
        totalTemporary: tempRegistrations.length,
        totalBoysHostel: boysUsers.length,
        totalGirlsHostel: girlsUsers.length,
        totalCompleted: boysUsers.length + girlsUsers.length
      }
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Get all registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get registrations'
    });
  }
});

module.exports = router;