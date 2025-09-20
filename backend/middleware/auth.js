const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hostel_management_secret');
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Authentication failed.' 
    });
  }
};

// Role-based authorization middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Permission-based authorization middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Permission '${permission}' required.` 
      });
    }

    next();
  };
};

// Staff-only middleware
const staffOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  if (!req.user.isStaff) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Staff access required.' 
    });
  }

  next();
};

// Student-only middleware
const studentOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  if (!req.user.isStudent) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Student access required.' 
    });
  }

  next();
};

// Representative-only middleware
const representativeOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  if (!req.user.isRepresentative) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Representative access required.' 
    });
  }

  next();
};

// Gender-specific access middleware
const genderAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  // Extract gender from request params or body
  const targetGender = req.params.gender || req.body.gender;
  
  if (targetGender && !req.user.canManageGender(targetGender)) {
    return res.status(403).json({ 
      success: false, 
      message: `Access denied. Cannot manage ${targetGender} hostels.` 
    });
  }

  next();
};

// Warden and above access
const wardenAccess = authorize(
  User.STAFF_ROLES.WARDEN,
  User.STAFF_ROLES.DEPUTY_WARDEN_BOYS,
  User.STAFF_ROLES.DEPUTY_WARDEN_GIRLS,
  User.STAFF_ROLES.EXECUTIVE_WARDEN
);

// Senior staff access (Warden, Deputy Wardens, Executive Warden, RCs)
const seniorStaffAccess = authorize(
  User.STAFF_ROLES.WARDEN,
  User.STAFF_ROLES.DEPUTY_WARDEN_BOYS,
  User.STAFF_ROLES.DEPUTY_WARDEN_GIRLS,
  User.STAFF_ROLES.EXECUTIVE_WARDEN,
  User.STAFF_ROLES.RESIDENTIAL_COUNSELLOR_BOYS,
  User.STAFF_ROLES.RESIDENTIAL_COUNSELLOR_GIRLS
);

// All staff access
const allStaffAccess = authorize(...Object.values(User.STAFF_ROLES));

// Self or staff access (for viewing/editing profiles)
const selfOrStaffAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  const targetUserId = req.params.userId || req.params.id;
  
  // Allow if user is staff or accessing their own data
  if (req.user.isStaff || req.user._id.toString() === targetUserId) {
    return next();
  }

  return res.status(403).json({ 
    success: false, 
    message: 'Access denied. Can only access own data.' 
  });
};

// Owner or admin access (for sensitive operations)
const ownerOrAdminAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  const targetUserId = req.params.userId || req.params.id;
  
  // Allow if user is warden/deputy warden or accessing their own data
  const isAuthorized = req.user._id.toString() === targetUserId ||
                       req.user.role === User.STAFF_ROLES.WARDEN ||
                       req.user.role === User.STAFF_ROLES.DEPUTY_WARDEN_BOYS ||
                       req.user.role === User.STAFF_ROLES.DEPUTY_WARDEN_GIRLS ||
                       req.user.role === User.STAFF_ROLES.EXECUTIVE_WARDEN;

  if (isAuthorized) {
    return next();
  }

  return res.status(403).json({ 
    success: false, 
    message: 'Access denied. Insufficient permissions.' 
  });
};

// Middleware to check if user can access specific hostel
const hostelAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    const hostelId = req.params.hostelId;
    
    if (!hostelId) {
      return next(); // No specific hostel check needed
    }

    const Hostel = require('../models/Hostel');
    const hostel = await Hostel.findById(hostelId);
    
    if (!hostel) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hostel not found.' 
      });
    }

    // Warden can access all hostels
    if (req.user.role === User.STAFF_ROLES.WARDEN) {
      return next();
    }

    // Check gender-specific access
    if (!req.user.canManageGender(hostel.gender)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Cannot access this hostel.' 
      });
    }

    // Hostel incharge can only access assigned hostel
    if (req.user.role === User.STAFF_ROLES.HOSTEL_INCHARGE) {
      if (req.user.assignedHostel?.toString() !== hostelId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Not assigned to this hostel.' 
        });
      }
    }

    req.hostel = hostel;
    next();
  } catch (error) {
    console.error('Hostel access check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Access check failed.' 
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  requirePermission,
  staffOnly,
  studentOnly,
  representativeOnly,
  genderAccess,
  wardenAccess,
  seniorStaffAccess,
  allStaffAccess,
  selfOrStaffAccess,
  ownerOrAdminAccess,
  hostelAccess
};