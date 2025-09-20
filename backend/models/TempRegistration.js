const mongoose = require('mongoose');

// Temporary registration schema for storing data before payment completion
const tempRegistrationSchema = new mongoose.Schema({
  // Basic Information
  name: {
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
  dateOfBirth: {
    type: Date,
    required: true
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
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'transgender'],
    lowercase: true
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
  
  // Parent Information
  parentInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    occupation: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    pin: {
      type: String,
      required: true,
      trim: true
    },
    contact: {
      type: String,
      required: true,
      trim: true
    }
  },
  
  // Guardian Information
  guardianInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    occupation: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    pin: {
      type: String,
      required: true,
      trim: true
    },
    contact: {
      type: String,
      required: true,
      trim: true
    }
  },
  
  // Additional Information
  profileImagePath: {
    type: String
  },
  
  // Registration Status
  status: {
    type: String,
    enum: ['pending_payment', 'payment_processing', 'payment_failed', 'completed'],
    default: 'pending_payment'
  },
  
  // Payment Information (will be updated after payment)
  paymentDetails: {
    paymentId: String,
    amount: {
      type: Number,
      default: 46800 // Total hostel fee
    },
    paymentDate: Date,
    paymentMethod: String,
    transactionId: String
  },
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  // Auto-expire temporary registrations after 24 hours if payment not completed
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours in seconds
  }
}, {
  timestamps: true
});

// Index for better performance
tempRegistrationSchema.index({ email: 1 });
tempRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to hash password
const bcrypt = require('bcryptjs');

tempRegistrationSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
tempRegistrationSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const TempRegistration = mongoose.model('TempRegistration', tempRegistrationSchema);

module.exports = TempRegistration;