const mongoose = require('mongoose');

// Invoice schema for hostel registration fees
const invoiceSchema = new mongoose.Schema({
  // Invoice Identification
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  academicYear: {
    type: String,
    required: true,
    default: () => {
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${currentYear + 1}`;
    }
  },
  
  // Student Information
  studentDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    registerNumber: { type: String, required: true },
    course: { type: String, required: true },
    year: { type: Number, required: true },
    gender: { type: String, required: true },
    category: { type: String, required: true },
    hostelType: { type: String, required: true }
  },
  
  // Fee Breakdown
  feeDetails: {
    admissionFee: { type: Number, default: 500 },
    amenitiesFund: { type: Number, default: 600 },
    blockAdvance: { type: Number, default: 5000 },
    roomRent: { type: Number, default: 600 },
    electricityCharges: { type: Number, default: 600 },
    waterCharges: { type: Number, default: 500 },
    establishmentCharges: { type: Number, default: 15000 },
    messAdvance: { type: Number, default: 24000 },
    totalAmount: { type: Number, required: true }
  },
  
  // Payment Information
  paymentDetails: {
    paymentId: { type: String, required: true },
    transactionId: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    paymentDate: { type: Date, required: true },
    paymentStatus: { type: String, default: 'Completed' },
    gatewayResponse: { type: String }
  },
  
  // College Information
  collegeDetails: {
    name: {
      type: String,
      default: 'University College of Engineering Tindivanam'
    },
    address: {
      type: String,
      default: 'Melpakkam, Tindivanam - 604 001, Villupuram District, Tamil Nadu'
    },
    phone: {
      type: String,
      default: '+91-4147-238100'
    },
    email: {
      type: String,
      default: 'principal@ucet.ac.in'
    },
    website: {
      type: String,
      default: 'www.ucet.ac.in'
    },
    affiliatedTo: {
      type: String,
      default: 'Anna University, Chennai'
    }
  },
  
  // References to related documents
  tempRegistrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TempRegistration',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  studentCollection: {
    type: String,
    enum: ['BoysHostelUser', 'GirlsHostelUser'],
    required: true
  },
  
  // Invoice Status
  status: {
    type: String,
    enum: ['generated', 'sent', 'downloaded', 'archived'],
    default: 'generated'
  },
  
  // Additional Information
  remarks: {
    type: String,
    default: 'Payment received successfully. This is a computer-generated invoice.'
  },
  
  // File Information
  pdfPath: {
    type: String
  },
  pdfGenerated: {
    type: Boolean,
    default: false
  },
  
  // Download tracking
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: {
    type: Date
  }
  
}, {
  timestamps: true
});

// Indexes for better performance
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ 'studentDetails.email': 1 });
invoiceSchema.index({ 'studentDetails.registerNumber': 1 });
invoiceSchema.index({ 'paymentDetails.paymentId': 1 });
invoiceSchema.index({ invoiceDate: -1 });

// Pre-save middleware to generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.invoiceNumber = `UCET-INV-${year}${month}${random}`;
  }
  next();
});

// Virtual for formatted invoice date
invoiceSchema.virtual('formattedInvoiceDate').get(function() {
  return this.invoiceDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for formatted payment date
invoiceSchema.virtual('formattedPaymentDate').get(function() {
  return this.paymentDetails.paymentDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Method to calculate total amount
invoiceSchema.methods.calculateTotal = function() {
  const fees = this.feeDetails;
  const total = fees.admissionFee + fees.amenitiesFund + fees.blockAdvance + 
                fees.roomRent + fees.electricityCharges + fees.waterCharges + 
                fees.establishmentCharges + fees.messAdvance;
  this.feeDetails.totalAmount = total;
  return total;
};

// Method to update download tracking
invoiceSchema.methods.trackDownload = function() {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  if (this.status === 'generated') {
    this.status = 'downloaded';
  }
  return this.save();
};

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;