const express = require('express');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const { 
  authenticate, 
  allStaffAccess, 
  seniorStaffAccess,
  studentOnly,
  requirePermission 
} = require('../middleware/auth');

const router = express.Router();

// Get dashboard data for current user
router.get('/', authenticate, async (req, res) => {
  try {
    let dashboardData = {};

    if (req.user.isStaff) {
      dashboardData = await getStaffDashboardData(req.user);
    } else if (req.user.isStudent) {
      dashboardData = await getStudentDashboardData(req.user);
    }

    res.json({
      success: true,
      data: {
        user: {
          name: req.user.fullName,
          role: req.user.role,
          permissions: req.user.getPermissions()
        },
        ...dashboardData
      }
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get staff-specific dashboard data
async function getStaffDashboardData(user) {
  const data = {
    role: user.role,
    assignedGender: user.assignedGender,
    assignedHostel: null,
    stats: {},
    recentActivities: [],
    pendingTasks: []
  };

  try {
    // Get assigned hostel info
    if (user.assignedHostel) {
      data.assignedHostel = await Hostel.findById(user.assignedHostel)
        .select('name code gender capacity currentOccupancy');
    }

    // Role-specific dashboard data
    switch (user.role) {
      case User.STAFF_ROLES.WARDEN:
        data.stats = await getWardenStats();
        break;
      
      case User.STAFF_ROLES.DEPUTY_WARDEN_BOYS:
      case User.STAFF_ROLES.DEPUTY_WARDEN_GIRLS:
        data.stats = await getDeputyWardenStats(user.assignedGender);
        break;
      
      case User.STAFF_ROLES.EXECUTIVE_WARDEN:
        data.stats = await getExecutiveWardenStats();
        break;
      
      case User.STAFF_ROLES.HOSTEL_INCHARGE:
        data.stats = await getHostelInchargeStats(user.assignedHostel);
        break;
      
      case User.STAFF_ROLES.MESS_INCHARGE:
        data.stats = await getMessInchargeStats(user.assignedHostel);
        break;
      
      case User.STAFF_ROLES.RESIDENTIAL_COUNSELLOR_BOYS:
      case User.STAFF_ROLES.RESIDENTIAL_COUNSELLOR_GIRLS:
        data.stats = await getCounsellorStats(user.assignedGender);
        break;
      
      default:
        data.stats = await getBasicStaffStats();
    }

    // Get recent activities (simplified for now)
    data.recentActivities = await getRecentActivities(user.role, user.assignedHostel);

  } catch (error) {
    console.error('Staff dashboard data error:', error);
  }

  return data;
}

// Get student-specific dashboard data
async function getStudentDashboardData(user) {
  const data = {
    role: user.role,
    studentInfo: {
      registerNumber: user.registerNumber,
      course: user.course,
      year: user.year,
      department: user.department
    },
    hostelInfo: null,
    roomInfo: null,
    stats: {},
    announcements: [],
    upcomingEvents: []
  };

  try {
    // Get hostel information
    if (user.assignedHostel) {
      data.hostelInfo = await Hostel.findById(user.assignedHostel)
        .populate('representatives.hostelRep', 'firstName lastName phone')
        .populate('representatives.messRep', 'firstName lastName phone')
        .select('name code gender facilities rules timings representatives');
    }

    // Get basic student stats
    data.stats = await getStudentStats(user);

    // Role-specific data for representatives
    if (user.isRepresentative) {
      data.representativeInfo = {
        responsibilities: user.representativeInfo?.responsibilities || [],
        achievements: user.representativeInfo?.achievements || [],
        electedDate: user.representativeInfo?.electedDate,
        termEnd: user.representativeInfo?.termEnd
      };
    }

  } catch (error) {
    console.error('Student dashboard data error:', error);
  }

  return data;
}

// Warden dashboard stats
async function getWardenStats() {
  const totalStudents = await User.countDocuments({
    role: { $in: Object.values(User.STUDENT_ROLES) },
    isActive: true
  });

  const totalStaff = await User.countDocuments({
    role: { $in: Object.values(User.STAFF_ROLES) },
    isActive: true
  });

  const totalHostels = await Hostel.countDocuments({ isActive: true });

  const hostelsData = await Hostel.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalCapacity: { $sum: '$capacity' },
        totalOccupancy: { $sum: '$currentOccupancy' },
        boysHostels: {
          $sum: { $cond: [{ $eq: ['$gender', 'boys'] }, 1, 0] }
        },
        girlsHostels: {
          $sum: { $cond: [{ $eq: ['$gender', 'girls'] }, 1, 0] }
        }
      }
    }
  ]);

  const hostelStats = hostelsData[0] || { 
    totalCapacity: 0, 
    totalOccupancy: 0, 
    boysHostels: 0, 
    girlsHostels: 0 
  };

  return {
    totalStudents,
    totalStaff,
    totalHostels,
    totalCapacity: hostelStats.totalCapacity,
    totalOccupancy: hostelStats.totalOccupancy,
    availableRooms: hostelStats.totalCapacity - hostelStats.totalOccupancy,
    occupancyRate: hostelStats.totalCapacity > 0 ? 
      Math.round((hostelStats.totalOccupancy / hostelStats.totalCapacity) * 100) : 0,
    boysHostels: hostelStats.boysHostels,
    girlsHostels: hostelStats.girlsHostels
  };
}

// Deputy Warden dashboard stats
async function getDeputyWardenStats(gender) {
  const hostels = await Hostel.find({ gender, isActive: true });
  const hostelIds = hostels.map(h => h._id);

  const students = await User.countDocuments({
    role: { $in: Object.values(User.STUDENT_ROLES) },
    assignedHostel: { $in: hostelIds },
    isActive: true
  });

  const totalCapacity = hostels.reduce((sum, h) => sum + h.capacity, 0);
  const totalOccupancy = hostels.reduce((sum, h) => sum + h.currentOccupancy, 0);

  return {
    managedHostels: hostels.length,
    totalStudents: students,
    totalCapacity,
    totalOccupancy,
    availableRooms: totalCapacity - totalOccupancy,
    occupancyRate: totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0,
    gender
  };
}

// Executive Warden dashboard stats
async function getExecutiveWardenStats() {
  // Similar to warden but focused on operations
  const wardenStats = await getWardenStats();
  
  // Add operational metrics
  const maintenanceRequests = 5; // Placeholder - would come from maintenance model
  const pendingApprovals = 3; // Placeholder - would come from requests model

  return {
    ...wardenStats,
    maintenanceRequests,
    pendingApprovals,
    emergencyAlerts: 0
  };
}

// Hostel Incharge dashboard stats
async function getHostelInchargeStats(hostelId) {
  if (!hostelId) {
    return { message: 'No hostel assigned' };
  }

  const hostel = await Hostel.findById(hostelId);
  if (!hostel) {
    return { message: 'Hostel not found' };
  }

  const students = await User.countDocuments({
    assignedHostel: hostelId,
    role: { $in: Object.values(User.STUDENT_ROLES) },
    isActive: true
  });

  const representatives = await User.find({
    assignedHostel: hostelId,
    role: { 
      $in: [User.STUDENT_ROLES.MESS_REPRESENTATIVE, User.STUDENT_ROLES.HOSTEL_REPRESENTATIVE] 
    },
    isActive: true
  }).select('firstName lastName role');

  return {
    hostelName: hostel.name,
    hostelCode: hostel.code,
    capacity: hostel.capacity,
    currentOccupancy: hostel.currentOccupancy,
    availableRooms: hostel.capacity - hostel.currentOccupancy,
    occupancyRate: Math.round((hostel.currentOccupancy / hostel.capacity) * 100),
    totalStudents: students,
    representatives: representatives,
    maintenanceRequests: 2, // Placeholder
    complaints: 1 // Placeholder
  };
}

// Mess Incharge dashboard stats
async function getMessInchargeStats(hostelId) {
  if (!hostelId) {
    return { message: 'No hostel assigned' };
  }

  const hostel = await Hostel.findById(hostelId);
  if (!hostel) {
    return { message: 'Hostel not found' };
  }

  // Placeholder mess statistics
  return {
    hostelName: hostel.name,
    dailyMeals: hostel.currentOccupancy * 3, // Breakfast, lunch, dinner
    monthlyBudget: 50000, // Placeholder
    foodComplaints: 2, // Placeholder
    menuRequests: 5, // Placeholder
    wastagePercentage: 8, // Placeholder
    messRating: 4.2 // Placeholder
  };
}

// Counsellor dashboard stats
async function getCounsellorStats(gender) {
  const hostels = await Hostel.find({ gender, isActive: true });
  const hostelIds = hostels.map(h => h._id);

  const students = await User.countDocuments({
    role: { $in: Object.values(User.STUDENT_ROLES) },
    assignedHostel: { $in: hostelIds },
    isActive: true
  });

  return {
    assignedStudents: students,
    counsellingSessions: 15, // Placeholder - would come from sessions model
    pendingAppointments: 3, // Placeholder
    urgentCases: 1, // Placeholder
    wellnessProgramsThisMonth: 4, // Placeholder
    gender
  };
}

// Basic staff stats
async function getBasicStaffStats() {
  return {
    message: 'Welcome to the staff dashboard'
  };
}

// Student stats
async function getStudentStats(user) {
  const stats = {
    hasRoom: !!user.currentRoom,
    feesPaid: true, // Placeholder - would come from payments model
    pendingRequests: 2, // Placeholder - would come from requests model
    messBalance: 1500 // Placeholder - would come from mess payments model
  };

  if (user.isRepresentative) {
    stats.representativeRole = user.role;
    stats.studentsRepresented = 150; // Placeholder
    stats.issuesResolved = 12; // Placeholder
  }

  return stats;
}

// Get recent activities
async function getRecentActivities(role, hostelId) {
  // Placeholder activities - in real app, this would come from activity logs
  const activities = [
    {
      type: 'info',
      message: 'New student registered',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      icon: 'user-plus'
    },
    {
      type: 'warning',
      message: 'Maintenance request submitted',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      icon: 'tool'
    },
    {
      type: 'success',
      message: 'Room allocation completed',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      icon: 'check-circle'
    }
  ];

  return activities;
}

// Get specific dashboard data by role (for admin viewing other roles)
router.get('/role/:role', authenticate, seniorStaffAccess, async (req, res) => {
  try {
    const { role } = req.params;
    
    if (!Object.values(User.ALL_ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    let data = {};

    if (Object.values(User.STAFF_ROLES).includes(role)) {
      // Create a mock user object for staff role
      const mockUser = { role, assignedGender: 'both', assignedHostel: null };
      data = await getStaffDashboardData(mockUser);
    } else {
      // Student role data
      data = {
        role,
        generalStats: await getStudentStats({ role })
      };
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Role dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role dashboard data'
    });
  }
});

// Get system-wide statistics (Warden only)
router.get('/system/stats', authenticate, requirePermission('view_all_reports'), async (req, res) => {
  try {
    const systemStats = await getWardenStats();
    
    // Additional system metrics
    const usersByRole = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const hostelsByGender = await Hostel.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 },
          totalCapacity: { $sum: '$capacity' },
          totalOccupancy: { $sum: '$currentOccupancy' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        systemStats,
        usersByRole,
        hostelsByGender,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system statistics'
    });
  }
});

module.exports = router;