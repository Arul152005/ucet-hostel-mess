const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Girls Hostel User Schema
const girlsHostelUserSchema = new mongoose.Schema({
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
    required: true
  },
  
  // Academic Information
  registerNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  course: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  department: {
    type: String,
    trim: true
  },
  
  // Personal Information
  gender: {
    type: String,
    default: 'female',
    enum: ['female', 'transgender']
  },
  category: {
    type: String,
    required: true,
    enum: ['FC', 'BC', 'MBC', 'SC', 'ST']
  },
  messPreference: {
    type: String,
    required: true,
    enum: ['VEG', 'NON VEG']
  },
  
  // Contact Information
  parentContact: {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    occupation: { type: String, trim: true },
    address: { type: String, trim: true },
    pincode: { type: String, trim: true }
  },
  
  // Emergency Contact
  emergencyContact: {
    name: { type: String, required: true, trim: true },
    relationship: { type: String, default: 'Guardian', trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    occupation: { type: String, trim: true },
    address: { type: String, trim: true },
    pincode: { type: String, trim: true }
  },
  
  // Hostel Information
  hostelBlock: {
    type: String,
    enum: ['E', 'F', 'G', 'H'], // Girls hostel blocks
    default: null
  },
  roomNumber: {
    type: String,
    default: null
  },
  bedNumber: {
    type: String,
    default: null
  },
  
  // Payment Information
  paymentDetails: {
    tempRegistrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TempRegistration',
      required: true
    },
    paymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true },
    paymentMethod: { type: String, required: true },
    transactionId: { type: String, required: true },
    status: { type: String, default: 'completed' }
  },
  
  // Status Information
  role: {
    type: String,
    default: 'student',
    enum: ['student', 'mess_representative', 'hostel_representative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: true // Since payment is completed
  },
  
  // Profile Information
  profilePicture: {
    type: String
  },
  
  // Timestamps
  admissionDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
girlsHostelUserSchema.index({ email: 1 });
girlsHostelUserSchema.index({ registerNumber: 1 }, { sparse: true });
girlsHostelUserSchema.index({ roomNumber: 1 }, { sparse: true });

// Virtual for full name
girlsHostelUserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to generate register number
girlsHostelUserSchema.pre('save', function(next) {
  if (this.isNew && !this.registerNumber) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.registerNumber = `GH${year}${random}`; // GH = Girls Hostel
  }
  next();
});

// Instance method to compare password
girlsHostelUserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const GirlsHostelUser = mongoose.model('GirlsHostelUser', girlsHostelUserSchema);

module.exports = GirlsHostelUser;