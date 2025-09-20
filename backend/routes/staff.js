const express = require('express');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const { 
  authenticate, 
  allStaffAccess, 
  wardenAccess, 
  seniorStaffAccess,
  requirePermission,
  genderAccess,
  hostelAccess
} = require('../middleware/auth');

const router = express.Router();

// Get all staff members (Warden and above)
router.get('/', authenticate, seniorStaffAccess, async (req, res) => {
  try {
    const { role, gender, hostel, page = 1, limit = 10 } = req.query;
    
    let query = { 
      role: { $in: Object.values(User.STAFF_ROLES) }, 
      isActive: true 
    };

    // Filter by role if specified
    if (role && Object.values(User.STAFF_ROLES).includes(role)) {
      query.role = role;
    }

    // Filter by gender assignment if specified
    if (gender && ['boys', 'girls', 'both'].includes(gender)) {
      query.assignedGender = gender;
    }

    // Filter by hostel assignment if specified
    if (hostel) {
      query.assignedHostel = hostel;
    }

    const skip = (page - 1) * limit;
    
    const staff = await User.find(query)
      .populate('assignedHostel', 'name code gender')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        staff,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff members'
    });
  }
});

// Get staff member by ID
router.get('/:staffId', authenticate, seniorStaffAccess, async (req, res) => {
  try {
    const staff = await User.findOne({
      _id: req.params.staffId,
      role: { $in: Object.values(User.STAFF_ROLES) }
    })
    .populate('assignedHostel', 'name code gender capacity currentOccupancy')
    .select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      data: { staff }
    });

  } catch (error) {
    console.error('Get staff by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff member'
    });
  }
});

// Create new staff member (Warden only)
router.post('/', authenticate, wardenAccess, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      employeeId,
      dateOfJoining,
      qualification,
      experience,
      assignedHostel,
      assignedGender
    } = req.body;

    // Validate role is a staff role
    if (!Object.values(User.STAFF_ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff role specified'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check for duplicate employee ID
    if (employeeId) {
      const existingEmployee = await User.findOne({ employeeId });
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: 'Employee with this ID already exists'
        });
      }
    }

    // Validate hostel assignment if provided
    if (assignedHostel) {
      const hostel = await Hostel.findById(assignedHostel);
      if (!hostel) {
        return res.status(400).json({
          success: false,
          message: 'Invalid hostel assignment'
        });
      }
    }

    const staffData = {
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      employeeId,
      dateOfJoining,
      qualification,
      experience,
      assignedHostel,
      assignedGender
    };

    const staff = new User(staffData);
    await staff.save();

    // Return staff data without password
    const staffResponse = await User.findById(staff._id)
      .populate('assignedHostel', 'name code gender')
      .select('-password');

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: { staff: staffResponse }
    });

  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create staff member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update staff member (Warden only)
router.put('/:staffId', authenticate, wardenAccess, async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Remove sensitive fields
    delete updateData.password;
    delete updateData.role; // Role changes should be handled separately
    delete updateData.employeeId; // ID changes should be handled separately

    const staff = await User.findOneAndUpdate(
      { 
        _id: req.params.staffId,
        role: { $in: Object.values(User.STAFF_ROLES) }
      },
      updateData,
      { new: true, runValidators: true }
    )
    .populate('assignedHostel', 'name code gender')
    .select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: { staff }
    });

  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff member'
    });
  }
});

// Update staff role (Warden only)
router.put('/:staffId/role', authenticate, wardenAccess, async (req, res) => {
  try {
    const { role, assignedGender } = req.body;

    if (!Object.values(User.STAFF_ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff role specified'
      });
    }

    const updateData = { role };
    
    // Update assigned gender based on role
    if (role === User.STAFF_ROLES.DEPUTY_WARDEN_BOYS) {
      updateData.assignedGender = 'boys';
    } else if (role === User.STAFF_ROLES.DEPUTY_WARDEN_GIRLS) {
      updateData.assignedGender = 'girls';
    } else if (role === User.STAFF_ROLES.RESIDENTIAL_COUNSELLOR_BOYS) {
      updateData.assignedGender = 'boys';
    } else if (role === User.STAFF_ROLES.RESIDENTIAL_COUNSELLOR_GIRLS) {
      updateData.assignedGender = 'girls';
    } else if (assignedGender) {
      updateData.assignedGender = assignedGender;
    }

    const staff = await User.findOneAndUpdate(
      { 
        _id: req.params.staffId,
        role: { $in: Object.values(User.STAFF_ROLES) }
      },
      updateData,
      { new: true, runValidators: true }
    )
    .populate('assignedHostel', 'name code gender')
    .select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff role updated successfully',
      data: { staff }
    });

  } catch (error) {
    console.error('Update staff role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff role'
    });
  }
});

// Assign hostel to staff (Warden only)
router.put('/:staffId/assign-hostel', authenticate, wardenAccess, async (req, res) => {
  try {
    const { hostelId } = req.body;

    if (!hostelId) {
      return res.status(400).json({
        success: false,
        message: 'Hostel ID is required'
      });
    }

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }

    const staff = await User.findOneAndUpdate(
      { 
        _id: req.params.staffId,
        role: { $in: Object.values(User.STAFF_ROLES) }
      },
      { assignedHostel: hostelId },
      { new: true, runValidators: true }
    )
    .populate('assignedHostel', 'name code gender')
    .select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Update hostel incharge if applicable
    if (staff.role === User.STAFF_ROLES.HOSTEL_INCHARGE) {
      await Hostel.findByIdAndUpdate(hostelId, { incharge: staff._id });
    }

    res.json({
      success: true,
      message: 'Hostel assigned successfully',
      data: { staff }
    });

  } catch (error) {
    console.error('Assign hostel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign hostel'
    });
  }
});

// Deactivate staff member (Warden only)
router.put('/:staffId/deactivate', authenticate, wardenAccess, async (req, res) => {
  try {
    const staff = await User.findOneAndUpdate(
      { 
        _id: req.params.staffId,
        role: { $in: Object.values(User.STAFF_ROLES) }
      },
      { isActive: false },
      { new: true }
    )
    .select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff member deactivated successfully',
      data: { staff }
    });

  } catch (error) {
    console.error('Deactivate staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate staff member'
    });
  }
});

// Reactivate staff member (Warden only)
router.put('/:staffId/activate', authenticate, wardenAccess, async (req, res) => {
  try {
    const staff = await User.findOneAndUpdate(
      { 
        _id: req.params.staffId,
        role: { $in: Object.values(User.STAFF_ROLES) }
      },
      { isActive: true },
      { new: true }
    )
    .select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff member activated successfully',
      data: { staff }
    });

  } catch (error) {
    console.error('Activate staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate staff member'
    });
  }
});

// Get staff by role
router.get('/role/:role', authenticate, seniorStaffAccess, async (req, res) => {
  try {
    const { role } = req.params;

    if (!Object.values(User.STAFF_ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff role'
      });
    }

    const staff = await User.find({ 
      role, 
      isActive: true 
    })
    .populate('assignedHostel', 'name code gender')
    .select('-password')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { staff }
    });

  } catch (error) {
    console.error('Get staff by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff by role'
    });
  }
});

// Get staff statistics (Warden only)
router.get('/stats/overview', authenticate, wardenAccess, async (req, res) => {
  try {
    const totalStaff = await User.countDocuments({
      role: { $in: Object.values(User.STAFF_ROLES) },
      isActive: true
    });

    const staffByRole = await User.aggregate([
      {
        $match: {
          role: { $in: Object.values(User.STAFF_ROLES) },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const staffByGender = await User.aggregate([
      {
        $match: {
          role: { $in: Object.values(User.STAFF_ROLES) },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$assignedGender',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalStaff,
        staffByRole,
        staffByGender
      }
    });

  } catch (error) {
    console.error('Get staff stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff statistics'
    });
  }
});

module.exports = router;