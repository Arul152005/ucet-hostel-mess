const express = require('express');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const { 
  authenticate, 
  studentOnly, 
  representativeOnly,
  allStaffAccess,
  seniorStaffAccess,
  requirePermission
} = require('../middleware/auth');

const router = express.Router();

// Get all student representatives (Staff can view all, students can view their hostel/mess reps)
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, hostel } = req.query; // type: 'mess' or 'hostel'
    
    let query = {
      role: { 
        $in: [User.STUDENT_ROLES.MESS_REPRESENTATIVE, User.STUDENT_ROLES.HOSTEL_REPRESENTATIVE] 
      },
      isActive: true
    };

    // Filter by representative type
    if (type === 'mess') {
      query.role = User.STUDENT_ROLES.MESS_REPRESENTATIVE;
    } else if (type === 'hostel') {
      query.role = User.STUDENT_ROLES.HOSTEL_REPRESENTATIVE;
    }

    // Filter by hostel if specified
    if (hostel) {
      query.assignedHostel = hostel;
    }

    // If user is a student, they can only see representatives from their hostel
    if (req.user.isStudent && !req.user.isStaff) {
      if (req.user.assignedHostel) {
        query.assignedHostel = req.user.assignedHostel;
      } else {
        // Student not assigned to any hostel, return empty result
        return res.json({
          success: true,
          data: { representatives: [] }
        });
      }
    }

    const representatives = await User.find(query)
      .populate('assignedHostel', 'name code gender')
      .populate('currentRoom', 'number floor')
      .select('-password')
      .sort({ 'representativeInfo.electedDate': -1 });

    res.json({
      success: true,
      data: { representatives }
    });

  } catch (error) {
    console.error('Get representatives error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch representatives'
    });
  }
});

// Get representative by ID
router.get('/:repId', authenticate, async (req, res) => {
  try {
    const representative = await User.findOne({
      _id: req.params.repId,
      role: { 
        $in: [User.STUDENT_ROLES.MESS_REPRESENTATIVE, User.STUDENT_ROLES.HOSTEL_REPRESENTATIVE] 
      }
    })
    .populate('assignedHostel', 'name code gender capacity currentOccupancy')
    .populate('currentRoom', 'number floor type')
    .select('-password');

    if (!representative) {
      return res.status(404).json({
        success: false,
        message: 'Representative not found'
      });
    }

    // Check access permissions
    if (req.user.isStudent && !req.user.isStaff) {
      // Students can only view representatives from their hostel
      if (!req.user.assignedHostel || 
          req.user.assignedHostel.toString() !== representative.assignedHostel?._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: { representative }
    });

  } catch (error) {
    console.error('Get representative by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch representative'
    });
  }
});

// Nominate/elect a student as representative (Staff only)
router.post('/nominate', authenticate, allStaffAccess, async (req, res) => {
  try {
    const { 
      studentId, 
      representativeType, // 'mess' or 'hostel'
      hostelId,
      electedDate,
      termEnd,
      responsibilities 
    } = req.body;

    if (!['mess', 'hostel'].includes(representativeType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid representative type. Must be "mess" or "hostel"'
      });
    }

    // Find the student
    const student = await User.findOne({
      _id: studentId,
      role: User.STUDENT_ROLES.STUDENT,
      isActive: true
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or not eligible'
      });
    }

    // Verify hostel assignment
    if (hostelId) {
      const hostel = await Hostel.findById(hostelId);
      if (!hostel) {
        return res.status(404).json({
          success: false,
          message: 'Hostel not found'
        });
      }
    }

    // Check if there's already a representative of this type for this hostel
    const existingRep = await User.findOne({
      role: representativeType === 'mess' ? 
        User.STUDENT_ROLES.MESS_REPRESENTATIVE : 
        User.STUDENT_ROLES.HOSTEL_REPRESENTATIVE,
      assignedHostel: hostelId,
      isActive: true
    });

    if (existingRep) {
      return res.status(400).json({
        success: false,
        message: `A ${representativeType} representative already exists for this hostel`
      });
    }

    // Update student role and details
    const newRole = representativeType === 'mess' ? 
      User.STUDENT_ROLES.MESS_REPRESENTATIVE : 
      User.STUDENT_ROLES.HOSTEL_REPRESENTATIVE;

    const updateData = {
      role: newRole,
      assignedHostel: hostelId,
      representativeInfo: {
        electedDate: electedDate || new Date(),
        termEnd: termEnd || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
        responsibilities: responsibilities || []
      }
    };

    const representative = await User.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('assignedHostel', 'name code gender')
    .select('-password');

    // Update hostel representatives record
    if (hostelId) {
      const hostelUpdate = {};
      if (representativeType === 'mess') {
        hostelUpdate['representatives.messRep'] = studentId;
      } else {
        hostelUpdate['representatives.hostelRep'] = studentId;
      }
      
      await Hostel.findByIdAndUpdate(hostelId, hostelUpdate);
    }

    res.status(201).json({
      success: true,
      message: `${representativeType} representative nominated successfully`,
      data: { representative }
    });

  } catch (error) {
    console.error('Nominate representative error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to nominate representative'
    });
  }
});

// Update representative information (Staff or self)
router.put('/:repId', authenticate, async (req, res) => {
  try {
    const { responsibilities, achievements } = req.body;
    
    const representative = await User.findOne({
      _id: req.params.repId,
      role: { 
        $in: [User.STUDENT_ROLES.MESS_REPRESENTATIVE, User.STUDENT_ROLES.HOSTEL_REPRESENTATIVE] 
      }
    });

    if (!representative) {
      return res.status(404).json({
        success: false,
        message: 'Representative not found'
      });
    }

    // Check permissions - staff or self
    if (!req.user.isStaff && req.user._id.toString() !== representative._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateData = {};
    if (responsibilities) {
      updateData['representativeInfo.responsibilities'] = responsibilities;
    }
    if (achievements) {
      updateData['representativeInfo.achievements'] = achievements;
    }

    const updatedRepresentative = await User.findByIdAndUpdate(
      req.params.repId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('assignedHostel', 'name code gender')
    .select('-password');

    res.json({
      success: true,
      message: 'Representative information updated successfully',
      data: { representative: updatedRepresentative }
    });

  } catch (error) {
    console.error('Update representative error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update representative'
    });
  }
});

// Remove representative role (Staff only)
router.put('/:repId/remove', authenticate, allStaffAccess, async (req, res) => {
  try {
    const representative = await User.findOne({
      _id: req.params.repId,
      role: { 
        $in: [User.STUDENT_ROLES.MESS_REPRESENTATIVE, User.STUDENT_ROLES.HOSTEL_REPRESENTATIVE] 
      }
    });

    if (!representative) {
      return res.status(404).json({
        success: false,
        message: 'Representative not found'
      });
    }

    const oldRole = representative.role;
    const hostelId = representative.assignedHostel;

    // Revert to student role
    const updatedStudent = await User.findByIdAndUpdate(
      req.params.repId,
      { 
        role: User.STUDENT_ROLES.STUDENT,
        $unset: { representativeInfo: 1 }
      },
      { new: true, runValidators: true }
    )
    .populate('assignedHostel', 'name code gender')
    .select('-password');

    // Update hostel representatives record
    if (hostelId) {
      const hostelUpdate = {};
      if (oldRole === User.STUDENT_ROLES.MESS_REPRESENTATIVE) {
        hostelUpdate['representatives.messRep'] = null;
      } else {
        hostelUpdate['representatives.hostelRep'] = null;
      }
      
      await Hostel.findByIdAndUpdate(hostelId, hostelUpdate);
    }

    res.json({
      success: true,
      message: 'Representative role removed successfully',
      data: { student: updatedStudent }
    });

  } catch (error) {
    console.error('Remove representative error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove representative role'
    });
  }
});

// Get representatives by hostel
router.get('/hostel/:hostelId', authenticate, async (req, res) => {
  try {
    const { hostelId } = req.params;

    // Verify hostel exists
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }

    // Check access permissions for students
    if (req.user.isStudent && !req.user.isStaff) {
      if (!req.user.assignedHostel || 
          req.user.assignedHostel.toString() !== hostelId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const representatives = await User.find({
      assignedHostel: hostelId,
      role: { 
        $in: [User.STUDENT_ROLES.MESS_REPRESENTATIVE, User.STUDENT_ROLES.HOSTEL_REPRESENTATIVE] 
      },
      isActive: true
    })
    .populate('assignedHostel', 'name code gender')
    .populate('currentRoom', 'number floor')
    .select('-password')
    .sort({ role: 1 });

    res.json({
      success: true,
      data: { 
        hostel: {
          _id: hostel._id,
          name: hostel.name,
          code: hostel.code,
          gender: hostel.gender
        },
        representatives 
      }
    });

  } catch (error) {
    console.error('Get representatives by hostel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hostel representatives'
    });
  }
});

// Submit representative report (Representatives only)
router.post('/report', authenticate, representativeOnly, async (req, res) => {
  try {
    const { title, description, category, priority, targetAudience } = req.body;

    // Create a simple report object (in a real app, you'd have a separate Report model)
    const report = {
      submittedBy: req.user._id,
      submitterRole: req.user.role,
      hostel: req.user.assignedHostel,
      title,
      description,
      category,
      priority: priority || 'medium',
      targetAudience: targetAudience || 'staff',
      submittedAt: new Date(),
      status: 'submitted'
    };

    // In a real implementation, save to Reports collection
    // For now, we'll just return success

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: { report }
    });

  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report'
    });
  }
});

// Get representative statistics (Staff only)
router.get('/stats/overview', authenticate, seniorStaffAccess, async (req, res) => {
  try {
    const totalRepresentatives = await User.countDocuments({
      role: { 
        $in: [User.STUDENT_ROLES.MESS_REPRESENTATIVE, User.STUDENT_ROLES.HOSTEL_REPRESENTATIVE] 
      },
      isActive: true
    });

    const repsByType = await User.aggregate([
      {
        $match: {
          role: { 
            $in: [User.STUDENT_ROLES.MESS_REPRESENTATIVE, User.STUDENT_ROLES.HOSTEL_REPRESENTATIVE] 
          },
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

    const repsByHostel = await User.aggregate([
      {
        $match: {
          role: { 
            $in: [User.STUDENT_ROLES.MESS_REPRESENTATIVE, User.STUDENT_ROLES.HOSTEL_REPRESENTATIVE] 
          },
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'hostels',
          localField: 'assignedHostel',
          foreignField: '_id',
          as: 'hostel'
        }
      },
      {
        $unwind: '$hostel'
      },
      {
        $group: {
          _id: {
            hostelId: '$hostel._id',
            hostelName: '$hostel.name',
            gender: '$hostel.gender'
          },
          representatives: {
            $push: {
              name: { $concat: ['$firstName', ' ', '$lastName'] },
              role: '$role'
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalRepresentatives,
        repsByType,
        repsByHostel
      }
    });

  } catch (error) {
    console.error('Get representative stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch representative statistics'
    });
  }
});

module.exports = router;