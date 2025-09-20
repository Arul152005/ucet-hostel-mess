const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
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
      role,
      studentId,
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

    // Check for duplicate student ID or employee ID
    if (role && Object.values(User.STUDENT_ROLES).includes(role)) {
      if (studentId) {
        const existingStudent = await User.findOne({ studentId });
        if (existingStudent) {
          return res.status(400).json({
            success: false,
            message: 'Student with this ID already exists'
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

    // Add role-specific fields
    if (Object.values(User.STUDENT_ROLES).includes(role)) {
      if (studentId) userData.studentId = studentId;
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

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
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
      const isStaffRole = Object.values(User.STAFF_ROLES).includes(user.role);
      const isStudentRole = Object.values(User.STUDENT_ROLES).includes(user.role);
      
      if (role === 'admin' && !isStaffRole) {
        return res.status(401).json({
          success: false,
          message: 'Invalid role for this account'
        });
      }
      
      if (role === 'student' && !isStudentRole) {
        return res.status(401).json({
          success: false,
          message: 'Invalid role for this account'
        });
      }
    }

    // Update last login
    user.lastLogin = new Date();
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

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
        permissions: user.getPermissions()
      }
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

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('assignedHostel', 'name code gender')
      .populate('currentRoom', 'number floor type')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user,
        permissions: user.getPermissions()
      }
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
    delete updateData.studentId;
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
    delete updateData.studentId;
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