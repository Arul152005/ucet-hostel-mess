const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define role hierarchies and permissions
const STAFF_ROLES = {
  WARDEN: 'warden',
  DEPUTY_WARDEN_BOYS: 'deputy_warden_boys',
  DEPUTY_WARDEN_GIRLS: 'deputy_warden_girls',
  EXECUTIVE_WARDEN: 'executive_warden',
  RESIDENTIAL_COUNSELLOR_BOYS: 'residential_counsellor_boys', // RC for boys
  RESIDENTIAL_COUNSELLOR_GIRLS: 'residential_counsellor_girls', // RC for girls
  HOSTEL_INCHARGE: 'hostel_incharge',
  MESS_INCHARGE: 'mess_incharge'
};

const STUDENT_ROLES = {
  STUDENT: 'student',
  MESS_REPRESENTATIVE: 'mess_representative',
  HOSTEL_REPRESENTATIVE: 'hostel_representative'
};

const ALL_ROLES = { ...STAFF_ROLES, ...STUDENT_ROLES };

// Role permissions mapping
const ROLE_PERMISSIONS = {
  [STAFF_ROLES.WARDEN]: [
    'manage_all_hostels',
    'manage_all_staff',
    'manage_all_students',
    'view_all_reports',
    'manage_mess_operations',
    'approve_major_requests',
    'manage_finances'
  ],
  [STAFF_ROLES.DEPUTY_WARDEN_BOYS]: [
    'manage_boys_hostels',
    'manage_boys_students',
    'view_boys_reports',
    'approve_boys_requests',
    'manage_boys_disciplinary'
  ],
  [STAFF_ROLES.DEPUTY_WARDEN_GIRLS]: [
    'manage_girls_hostels',
    'manage_girls_students',
    'view_girls_reports',
    'approve_girls_requests',
    'manage_girls_disciplinary'
  ],
  [STAFF_ROLES.EXECUTIVE_WARDEN]: [
    'assist_warden',
    'manage_hostel_operations',
    'view_comprehensive_reports',
    'coordinate_departments',
    'handle_emergencies'
  ],
  [STAFF_ROLES.RESIDENTIAL_COUNSELLOR_BOYS]: [
    'counsel_boys_students',
    'handle_boys_student_issues',
    'create_boys_student_reports',
    'conduct_boys_wellness_programs',
    'manage_boys_student_activities'
  ],
  [STAFF_ROLES.RESIDENTIAL_COUNSELLOR_GIRLS]: [
    'counsel_girls_students',
    'handle_girls_student_issues',
    'create_girls_student_reports',
    'conduct_girls_wellness_programs',
    'manage_girls_student_activities'
  ],
  [STAFF_ROLES.HOSTEL_INCHARGE]: [
    'manage_assigned_hostel',
    'view_hostel_reports',
    'manage_hostel_maintenance',
    'handle_room_allocation',
    'manage_hostel_staff'
  ],
  [STAFF_ROLES.MESS_INCHARGE]: [
    'manage_mess_operations',
    'view_mess_reports',
    'manage_meal_plans',
    'handle_food_complaints',
    'manage_mess_staff'
  ],
  [STUDENT_ROLES.STUDENT]: [
    'view_own_profile',
    'book_rooms',
    'pay_fees',
    'submit_requests',
    'view_announcements'
  ],
  [STUDENT_ROLES.MESS_REPRESENTATIVE]: [
    'view_own_profile',
    'book_rooms',
    'pay_fees',
    'submit_requests',
    'view_announcements',
    'represent_mess_issues',
    'coordinate_with_mess_incharge',
    'gather_student_feedback'
  ],
  [STUDENT_ROLES.HOSTEL_REPRESENTATIVE]: [
    'view_own_profile',
    'book_rooms',
    'pay_fees',
    'submit_requests',
    'view_announcements',
    'represent_hostel_issues',
    'coordinate_with_hostel_incharge',
    'organize_hostel_events'
  ]
};

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: function() {
      return this.role && Object.values(STUDENT_ROLES).includes(this.role);
    }
  },
  
  // Role and Status
  role: {
    type: String,
    required: true,
    enum: Object.values(ALL_ROLES),
    default: STUDENT_ROLES.STUDENT
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Student-specific fields
  registerNumber: {
    type: String,
    sparse: true, // Optional field
    unique: true,
    trim: true
  },
  course: {
    type: String,
    trim: true
  },
  year: {
    type: Number,
    min: 1,
    max: 4
  },
  department: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'transgender'],
    lowercase: true
  },
  category: {
    type: String,
    enum: ['FC', 'BC', 'MBC', 'SC', 'ST']
  },
  messPreference: {
    type: String,
    enum: ['VEG', 'NON VEG']
  },
  registrationData: {
    parentInfo: {
      name: String,
      occupation: String,
      address: String,
      pin: String,
      contact: String
    },
    guardianInfo: {
      name: String,
      occupation: String,
      address: String,
      pin: String,
      contact: String
    },
    submittedAt: Date,
    paymentStatus: Boolean,
    declarationAccepted: Boolean,
    parentConsent: Boolean,
    registrationCompletedAt: Date,
    status: {
      type: String,
      enum: ['submitted', 'payment_pending', 'completed', 'approved', 'rejected'],
      default: 'submitted'
    }
  },
  parentContact: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true }
  },
  
  // Staff-specific fields
  employeeId: {
    type: String,
    sparse: true, // Only required for staff
    unique: true,
    trim: true
  },
  dateOfJoining: {
    type: Date
  },
  qualification: {
    type: String,
    trim: true
  },
  experience: {
    type: Number, // in years
    min: 0
  },
  
  // Hostel Assignment
  assignedHostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel'
  },
  assignedGender: {
    type: String,
    enum: ['boys', 'girls', 'both'],
    default: function() {
      // Auto-assign based on role
      if (this.role === STAFF_ROLES.DEPUTY_WARDEN_BOYS) return 'boys';
      if (this.role === STAFF_ROLES.DEPUTY_WARDEN_GIRLS) return 'girls';
      if (this.role === STAFF_ROLES.RESIDENTIAL_COUNSELLOR_BOYS) return 'boys';
      if (this.role === STAFF_ROLES.RESIDENTIAL_COUNSELLOR_GIRLS) return 'girls';
      return 'both';
    }
  },
  
  // Current Room Assignment (for students)
  currentRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  
  // Representative-specific fields
  representativeInfo: {
    electedDate: { type: Date },
    termEnd: { type: Date },
    responsibilities: [{ type: String }],
    achievements: [{ type: String }]
  },
  
  // Profile Information
  profilePicture: {
    type: String // URL to profile image
  },
  address: {
    permanent: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, default: 'India', trim: true }
    },
    current: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, default: 'India', trim: true }
    }
  },
  
  // Emergency Contact
  emergencyContact: {
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true }
  },
  
  // System fields
  lastLogin: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  verificationToken: String,
  verificationExpires: Date
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ registerNumber: 1 }, { sparse: true });
userSchema.index({ employeeId: 1 }, { sparse: true });
userSchema.index({ assignedHostel: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual to check if user is staff
userSchema.virtual('isStaff').get(function() {
  return Object.values(STAFF_ROLES).includes(this.role);
});

// Virtual to check if user is student
userSchema.virtual('isStudent').get(function() {
  return Object.values(STUDENT_ROLES).includes(this.role);
});

// Virtual to check if user is representative
userSchema.virtual('isRepresentative').get(function() {
  return this.role === STUDENT_ROLES.MESS_REPRESENTATIVE || 
         this.role === STUDENT_ROLES.HOSTEL_REPRESENTATIVE;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to set ID based on role
userSchema.pre('save', function(next) {
  if (this.isNew) {
    if (this.isStaff && !this.employeeId) {
      // Generate employee ID if not provided
      this.employeeId = generateEmployeeId();
    }
  }
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check permissions
userSchema.methods.hasPermission = function(permission) {
  const rolePermissions = ROLE_PERMISSIONS[this.role] || [];
  return rolePermissions.includes(permission);
};

// Instance method to get role permissions
userSchema.methods.getPermissions = function() {
  return ROLE_PERMISSIONS[this.role] || [];
};

// Instance method to check if can manage specific gender hostels
userSchema.methods.canManageGender = function(gender) {
  if (this.assignedGender === 'both') return true;
  return this.assignedGender === gender;
};

// Static method to find by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Static method to find staff members
userSchema.statics.findStaff = function() {
  return this.find({ 
    role: { $in: Object.values(STAFF_ROLES) }, 
    isActive: true 
  });
};

// Static method to find students
userSchema.statics.findStudents = function() {
  return this.find({ 
    role: { $in: Object.values(STUDENT_ROLES) }, 
    isActive: true 
  });
};

// Static method to find representatives
userSchema.statics.findRepresentatives = function() {
  return this.find({ 
    role: { 
      $in: [STUDENT_ROLES.MESS_REPRESENTATIVE, STUDENT_ROLES.HOSTEL_REPRESENTATIVE] 
    }, 
    isActive: true 
  });
};

// Helper functions for ID generation
function generateEmployeeId() {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `EMP${year}${random}`;
}

// Export constants for use in other modules
userSchema.statics.STAFF_ROLES = STAFF_ROLES;
userSchema.statics.STUDENT_ROLES = STUDENT_ROLES;
userSchema.statics.ALL_ROLES = ALL_ROLES;
userSchema.statics.ROLE_PERMISSIONS = ROLE_PERMISSIONS;

const User = mongoose.model('User', userSchema);

module.exports = User;