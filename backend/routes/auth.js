const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BoysHostelUser = require('../models/BoysHostelUser');
const GirlsHostelUser = require('../models/GirlsHostelUser');
const { authenticate, selfOrStaffAccess } = require('../middleware/auth');

const router = express.Router();

// Register new user (staff/student)
router.post('/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      role,
      registerNumber,
      employeeId,
      course,
      year,
      department,
      dateOfJoining,
      qualification,
      experience,
      assignedHostel,
      assignedGender
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate role
    if (!Object.values(User.ALL_ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Check for duplicate register number or employee ID
    if (role && Object.values(User.STUDENT_ROLES).includes(role)) {
      if (registerNumber) {
        const existingStudent = await User.findOne({ registerNumber });
        if (existingStudent) {
          return res.status(400).json({
            success: false,
            message: 'Student with this register number already exists'
          });
        }
      }
    } else if (role && Object.values(User.STAFF_ROLES).includes(role)) {
      if (employeeId) {
        const existingEmployee = await User.findOne({ employeeId });
        if (existingEmployee) {
          return res.status(400).json({
            success: false,
            message: 'Employee with this ID already exists'
          });
        }
      }
    }

    // Create user object
    const userData = {
      firstName,
      lastName,
      email,
      password,
      phone,
      role
    };

    // Add dateOfBirth if provided
    if (dateOfBirth) {
      userData.dateOfBirth = new Date(dateOfBirth);
    }

    // Add role-specific fields
    if (Object.values(User.STUDENT_ROLES).includes(role)) {
      if (registerNumber) userData.registerNumber = registerNumber;
      if (course) userData.course = course;
      if (year) userData.year = year;
      if (department) userData.department = department;
    } else if (Object.values(User.STAFF_ROLES).includes(role)) {
      if (employeeId) userData.employeeId = employeeId;
      if (dateOfJoining) userData.dateOfJoining = dateOfJoining;
      if (qualification) userData.qualification = qualification;
      if (experience) userData.experience = experience;
      if (assignedHostel) userData.assignedHostel = assignedHostel;
      if (assignedGender) userData.assignedGender = assignedGender;
    }

    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        isStaff: user.isStaff,
        isStudent: user.isStudent
      },
      process.env.JWT_SECRET || 'hostel_management_secret',
      { expiresIn: '24h' }
    );

    // Return user data without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login user (checks all collections: User, BoysHostelUser, GirlsHostelUser)
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    let user = null;
    let userType = null;
    let hostelType = null;

    // First, try to find user in the main User model (staff)
    user = await User.findOne({ email });
    if (user) {
      userType = 'staff';
    } else {
      // Check Boys Hostel Users
      user = await BoysHostelUser.findOne({ email });
      if (user) {
        userType = 'boys_student';
        hostelType = 'Boys Hostel';
      } else {
        // Check Girls Hostel Users
        user = await GirlsHostelUser.findOne({ email });
        if (user) {
          userType = 'girls_student';
          hostelType = 'Girls Hostel';
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or registration not completed. Please complete payment first.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Optional role validation for frontend role selection
    if (role) {
      if (userType === 'staff') {
        const isStaffRole = Object.values(User.STAFF_ROLES).includes(user.role);
        if (role === 'admin' && !isStaffRole) {
          return res.status(401).json({
            success: false,
            message: 'Invalid role for this account'
          });
        }
      } else {
        // Student from hostel collections
        if (role === 'admin') {
          return res.status(401).json({
            success: false,
            message: 'Invalid role for this account. Students cannot access admin panel.'
          });
        }
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const tokenPayload = { 
      userId: user._id, 
      userType: userType,
      isStaff: userType === 'staff' ? user.isStaff : false,
      isStudent: userType !== 'staff'
    };

    if (userType === 'staff') {
      tokenPayload.role = user.role;
    } else {
      tokenPayload.role = 'student';
      tokenPayload.gender = user.gender;
      tokenPayload.hostelType = hostelType;
    }

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'hostel_management_secret',
      { expiresIn: '24h' }
    );

    // Return user data without password
    const userResponse = user.toObject();
    delete userResponse.password;

    // Add additional info for response
    userResponse.userType = userType;
    userResponse.isStaff = userType === 'staff' ? user.isStaff : false;
    userResponse.isStudent = userType !== 'staff';
    
    if (userType !== 'staff') {
      userResponse.hostelType = hostelType;
      userResponse.role = 'student';
    }

    const responseData = {
      user: userResponse,
      token,
      userType,
      hostelType
    };

    // Add permissions for staff users
    if (userType === 'staff' && user.getPermissions) {
      responseData.permissions = user.getPermissions();
    }

    res.json({
      success: true,
      message: `Login successful${hostelType ? ` - Welcome to ${hostelType}` : ''}`,
      data: responseData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user profile (checks all collections)
router.get('/profile', authenticate, async (req, res) => {
  try {
    let user = null;

    // Find user in appropriate collection based on userType
    if (req.user.userType === 'staff') {
      user = await User.findById(req.user._id)
        .populate('assignedHostel', 'name code gender')
        .populate('currentRoom', 'number floor type')
        .select('-password');
    } else if (req.user.userType === 'boys_student') {
      user = await BoysHostelUser.findById(req.user._id)
        .select('-password');
    } else if (req.user.userType === 'girls_student') {
      user = await GirlsHostelUser.findById(req.user._id)
        .select('-password');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add user type info
    user.userType = req.user.userType;
    user.isStaff = req.user.isStaff;
    user.isStudent = req.user.isStudent;

    const responseData = {
      user
    };

    // Add permissions for staff users
    if (req.user.userType === 'staff' && user.getPermissions) {
      responseData.permissions = user.getPermissions();
    }

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/profile/:userId', authenticate, selfOrStaffAccess, async (req, res) => {
  try {
    const userId = req.params.userId;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.role;
    delete updateData.isActive;
    delete updateData.registerNumber;
    delete updateData.employeeId;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Update own profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.role;
    delete updateData.isActive;
    delete updateData.registerNumber;
    delete updateData.employeeId;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Change password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// Logout (client-side token invalidation)
router.post('/logout', authenticate, async (req, res) => {
  try {
    // In a more secure implementation, you might want to blacklist tokens
    // For now, we'll just send a success response
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Get role information
router.get('/roles', (req, res) => {
  res.json({
    success: true,
    data: {
      staffRoles: User.STAFF_ROLES,
      studentRoles: User.STUDENT_ROLES,
      allRoles: User.ALL_ROLES,
      rolePermissions: User.ROLE_PERMISSIONS
    }
  });
});

// Verify token
router.get('/verify', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        isStaff: req.user.isStaff,
        isStudent: req.user.isStudent
      },
      permissions: req.user.getPermissions()
    }
  });
});

module.exports = router;