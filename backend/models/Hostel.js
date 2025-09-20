const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['boys', 'girls'],
  },
  type: {
    type: String,
    required: true,
    enum: ['undergraduate', 'postgraduate', 'research_scholar', 'faculty'],
    default: 'undergraduate'
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  currentOccupancy: {
    type: Number,
    default: 0,
    min: 0
  },
  floors: {
    type: Number,
    required: true,
    min: 1
  },
  roomsPerFloor: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Staff assignments
  incharge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  wardenAssigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Location and contact
  location: {
    latitude: Number,
    longitude: Number,
    address: {
      type: String,
      trim: true
    }
  },
  contactNumber: {
    type: String,
    trim: true
  },
  
  // Facilities
  facilities: [{
    name: { type: String, required: true },
    description: String,
    isAvailable: { type: Boolean, default: true }
  }],
  
  // Common areas
  commonAreas: [{
    name: { type: String, required: true },
    floor: { type: Number, required: true },
    capacity: Number,
    facilities: [String]
  }],
  
  // Rules and regulations
  rules: [{
    category: { type: String, required: true }, // e.g., 'entry_exit', 'visitor_policy', 'discipline'
    rule: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  }],
  
  // Operating details
  timings: {
    entryTime: { type: String, default: '06:00' },
    exitTime: { type: String, default: '22:00' },
    gateCloseTime: { type: String, default: '23:00' },
    isFlexible: { type: Boolean, default: false }
  },
  
  // Fee structure
  feeStructure: {
    monthlyRent: { type: Number, required: true },
    securityDeposit: { type: Number, required: true },
    maintenanceCharges: { type: Number, default: 0 },
    amenityCharges: { type: Number, default: 0 }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isUnderMaintenance: {
    type: Boolean,
    default: false
  },
  maintenanceReason: String,
  
  // Representatives
  representatives: {
    hostelRep: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    messRep: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Indexes
hostelSchema.index({ gender: 1, type: 1 });
hostelSchema.index({ isActive: 1 });
hostelSchema.index({ code: 1 });

// Virtual for available capacity
hostelSchema.virtual('availableCapacity').get(function() {
  return Math.max(0, this.capacity - this.currentOccupancy);
});

// Virtual for occupancy percentage
hostelSchema.virtual('occupancyPercentage').get(function() {
  return this.capacity > 0 ? Math.round((this.currentOccupancy / this.capacity) * 100) : 0;
});

// Static method to find hostels by gender
hostelSchema.statics.findByGender = function(gender) {
  return this.find({ gender, isActive: true });
};

// Static method to find available hostels
hostelSchema.statics.findAvailable = function(gender = null) {
  const query = { 
    isActive: true, 
    isUnderMaintenance: false,
    $expr: { $lt: ['$currentOccupancy', '$capacity'] }
  };
  
  if (gender) {
    query.gender = gender;
  }
  
  return this.find(query);
};

const Hostel = mongoose.model('Hostel', hostelSchema);

module.exports = Hostel;