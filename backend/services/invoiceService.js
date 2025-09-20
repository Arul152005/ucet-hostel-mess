const fs = require('fs').promises;
const path = require('path');
const Invoice = require('../models/Invoice');

class InvoiceService {
  constructor() {
    this.invoicesDir = path.join(__dirname, '../invoices');
    this.ensureInvoiceDirectory();
  }

  // Ensure invoice directory exists
  async ensureInvoiceDirectory() {
    try {
      await fs.access(this.invoicesDir);
    } catch {
      await fs.mkdir(this.invoicesDir, { recursive: true });
    }
  }

  // Create invoice after successful payment
  async createInvoice(invoiceData) {
    try {
      // Calculate total amount
      const feeDetails = {
        admissionFee: 500,
        amenitiesFund: 600,
        blockAdvance: 5000,
        roomRent: 600,
        electricityCharges: 600,
        waterCharges: 500,
        establishmentCharges: 15000,
        messAdvance: 24000,
        totalAmount: 46800
      };

      // Generate invoice number manually
      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const invoiceNumber = `UCET-INV-${year}${month}${random}`;

      // Create invoice object
      const invoice = new Invoice({
        invoiceNumber,
        studentDetails: {
          name: invoiceData.studentName,
          email: invoiceData.studentEmail,
          registerNumber: invoiceData.registerNumber,
          course: invoiceData.course,
          year: invoiceData.year,
          gender: invoiceData.gender,
          category: invoiceData.category,
          hostelType: invoiceData.hostelType
        },
        feeDetails,
        paymentDetails: {
          paymentId: invoiceData.paymentId,
          transactionId: invoiceData.transactionId,
          paymentMethod: invoiceData.paymentMethod,
          paymentDate: invoiceData.paymentDate,
          paymentStatus: 'Completed'
        },
        tempRegistrationId: invoiceData.tempRegistrationId,
        studentId: invoiceData.studentId,
        studentCollection: invoiceData.studentCollection
      });

      // Save invoice to database
      await invoice.save();

      // Generate HTML invoice
      const htmlContent = await this.generateInvoiceHTML(invoice);
      
      // Save HTML file
      const htmlFilePath = path.join(this.invoicesDir, `${invoice.invoiceNumber}.html`);
      await fs.writeFile(htmlFilePath, htmlContent);
      
      // Update invoice with file path
      invoice.pdfPath = htmlFilePath;
      invoice.pdfGenerated = true;
      await invoice.save();

      return {
        success: true,
        invoice,
        filePath: htmlFilePath
      };
    } catch (error) {
      console.error('Invoice creation error:', error);
      throw error;
    }
  }

  // Generate HTML invoice with college letterhead
  async generateInvoiceHTML(invoice) {
    const currentDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang=\"en\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>Hostel Fee Invoice - ${invoice.invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #1e3a8a;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .college-logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 15px;
            background: #1e3a8a;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        
        .college-name {
            font-size: 28px;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 5px;
        }
        
        .college-address {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .affiliation {
            font-size: 12px;
            color: #888;
            font-style: italic;
        }
        
        .invoice-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #1e3a8a;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .info-section {
            flex: 1;
        }
        
        .info-section h3 {
            color: #1e3a8a;
            margin-bottom: 10px;
            font-size: 16px;
        }
        
        .info-item {
            margin-bottom: 5px;
            font-size: 14px;
        }
        
        .label {
            font-weight: bold;
            display: inline-block;
            width: 140px;
        }
        
        .fee-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
        }
        
        .fee-table th,
        .fee-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        .fee-table th {
            background-color: #1e3a8a;
            color: white;
            font-weight: bold;
        }
        
        .fee-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .amount {
            text-align: right;
            font-weight: bold;
        }
        
        .total-row {
            background-color: #1e3a8a !important;
            color: white;
            font-weight: bold;
        }
        
        .payment-status {
            text-align: center;
            margin: 30px 0;
            padding: 15px;
            background-color: #10b981;
            color: white;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 40px;
            border-top: 2px solid #1e3a8a;
            padding-top: 20px;
        }
        
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
        }
        
        .signature {
            text-align: center;
            width: 200px;
        }
        
        .signature-line {
            border-bottom: 1px solid #333;
            margin-bottom: 5px;
            height: 40px;
        }
        
        .notes {
            background-color: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #1e3a8a;
            margin: 20px 0;
        }
        
        .notes h4 {
            color: #1e3a8a;
            margin-bottom: 10px;
        }
        
        .notes ul {
            margin-left: 20px;
        }
        
        .notes li {
            margin-bottom: 5px;
            font-size: 12px;
        }
        
        @media print {
            .invoice-container {
                box-shadow: none;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class=\"invoice-container\">
        <!-- College Header -->
        <div class=\"header\">
            <div class=\"college-logo\">UCET</div>
            <div class=\"college-name\">${invoice.collegeDetails.name}</div>
            <div class=\"college-address\">${invoice.collegeDetails.address}</div>
            <div class=\"college-address\">Phone: ${invoice.collegeDetails.phone} | Email: ${invoice.collegeDetails.email}</div>
            <div class=\"college-address\">Website: ${invoice.collegeDetails.website}</div>
            <div class=\"affiliation\">Affiliated to ${invoice.collegeDetails.affiliatedTo}</div>
        </div>
        
        <!-- Invoice Title -->
        <div class=\"invoice-title\">Hostel Fee Invoice</div>
        
        <!-- Invoice Information -->
        <div class=\"invoice-info\">
            <div class=\"info-section\">
                <h3>Invoice Details</h3>
                <div class=\"info-item\">
                    <span class=\"label\">Invoice Number:</span> ${invoice.invoiceNumber}
                </div>
                <div class=\"info-item\">
                    <span class=\"label\">Invoice Date:</span> ${invoice.formattedInvoiceDate}
                </div>
                <div class=\"info-item\">
                    <span class=\"label\">Academic Year:</span> ${invoice.academicYear}
                </div>
                <div class=\"info-item\">
                    <span class=\"label\">Payment Date:</span> ${invoice.formattedPaymentDate}
                </div>
            </div>
            
            <div class=\"info-section\">
                <h3>Student Details</h3>
                <div class=\"info-item\">
                    <span class=\"label\">Name:</span> ${invoice.studentDetails.name}
                </div>
                <div class=\"info-item\">
                    <span class=\"label\">Register Number:</span> ${invoice.studentDetails.registerNumber}
                </div>
                <div class=\"info-item\">
                    <span class=\"label\">Course:</span> ${invoice.studentDetails.course}
                </div>
                <div class=\"info-item\">
                    <span class=\"label\">Year:</span> ${invoice.studentDetails.year}
                </div>
                <div class=\"info-item\">
                    <span class=\"label\">Gender:</span> ${invoice.studentDetails.gender}
                </div>
                <div class=\"info-item\">
                    <span class=\"label\">Hostel:</span> ${invoice.studentDetails.hostelType}
                </div>
            </div>
        </div>
        
        <!-- Fee Breakdown Table -->
        <table class=\"fee-table\">
            <thead>
                <tr>
                    <th>Fee Description</th>
                    <th>Amount (₹)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Admission Fee</td>
                    <td class=\"amount\">${invoice.feeDetails.admissionFee.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td>Hostel Amenities & Appliances Fund</td>
                    <td class=\"amount\">${invoice.feeDetails.amenitiesFund.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td>Block Advance (Refundable)</td>
                    <td class=\"amount\">${invoice.feeDetails.blockAdvance.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td>Room Rent (Annual)</td>
                    <td class=\"amount\">${invoice.feeDetails.roomRent.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td>Electricity Charges (Annual)</td>
                    <td class=\"amount\">${invoice.feeDetails.electricityCharges.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td>Water Charges (Annual)</td>
                    <td class=\"amount\">${invoice.feeDetails.waterCharges.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td>Establishment Charges (Annual)</td>
                    <td class=\"amount\">${invoice.feeDetails.establishmentCharges.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td>Mess Advance (Annual)</td>
                    <td class=\"amount\">${invoice.feeDetails.messAdvance.toLocaleString('en-IN')}</td>
                </tr>
                <tr class=\"total-row\">
                    <td><strong>Total Amount</strong></td>
                    <td class=\"amount\"><strong>₹ ${invoice.feeDetails.totalAmount.toLocaleString('en-IN')}</strong></td>
                </tr>
            </tbody>
        </table>
        
        <!-- Payment Status -->
        <div class=\"payment-status\">
            ✓ PAYMENT COMPLETED SUCCESSFULLY
        </div>
        
        <!-- Payment Information -->
        <div class=\"info-section\">
            <h3>Payment Information</h3>
            <div class=\"info-item\">
                <span class=\"label\">Payment ID:</span> ${invoice.paymentDetails.paymentId}
            </div>
            <div class=\"info-item\">
                <span class=\"label\">Transaction ID:</span> ${invoice.paymentDetails.transactionId}
            </div>
            <div class=\"info-item\">
                <span class=\"label\">Payment Method:</span> ${invoice.paymentDetails.paymentMethod}
            </div>
            <div class=\"info-item\">
                <span class=\"label\">Payment Status:</span> ${invoice.paymentDetails.paymentStatus}
            </div>
        </div>
        
        <!-- Important Notes -->
        <div class=\"notes\">
            <h4>Important Notes:</h4>
            <ul>
                <li>This is a computer-generated invoice and does not require a physical signature.</li>
                <li>Block advance of ₹5,000 is refundable at the end of the academic year.</li>
                <li>Hostel allocation will be confirmed separately by the hostel administration.</li>
                <li>All fees are for the academic year ${invoice.academicYear}.</li>
                <li>For any queries, please contact the hostel office.</li>
                <li>Keep this invoice for future reference and hostel admission process.</li>
            </ul>
        </div>
        
        <!-- Footer -->
        <div class=\"footer\">
            <div class=\"signature-section\">
                <div class=\"signature\">
                    <div class=\"signature-line\"></div>
                    <div>Accounts Officer</div>
                    <div>UCET</div>
                </div>
                
                <div class=\"signature\">
                    <div class=\"signature-line\"></div>
                    <div>Hostel Warden</div>
                    <div>UCET</div>
                </div>
            </div>
            
            <div style=\"text-align: center; margin-top: 30px; font-size: 12px; color: #666;\">
                Generated on: ${currentDate} | Invoice Number: ${invoice.invoiceNumber}
            </div>
        </div>
    </div>
</body>
</html>`;

    return htmlContent;
  }

  // Get invoice by ID
  async getInvoice(invoiceId) {
    try {
      const invoice = await Invoice.findById(invoiceId);
      return invoice;
    } catch (error) {
      console.error('Get invoice error:', error);
      throw error;
    }
  }

  // Get invoice by invoice number
  async getInvoiceByNumber(invoiceNumber) {
    try {
      const invoice = await Invoice.findOne({ invoiceNumber });
      return invoice;
    } catch (error) {
      console.error('Get invoice by number error:', error);
      throw error;
    }
  }

  // Get invoices by student email
  async getInvoicesByStudent(studentEmail) {
    try {
      const invoices = await Invoice.find({ 
        'studentDetails.email': studentEmail 
      }).sort({ createdAt: -1 });
      return invoices;
    } catch (error) {
      console.error('Get invoices by student error:', error);
      throw error;
    }
  }

  // Download invoice
  async downloadInvoice(invoiceId) {
    try {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Track download
      await invoice.trackDownload();

      // Return file path
      return {
        success: true,
        filePath: invoice.pdfPath,
        fileName: `${invoice.invoiceNumber}.html`,
        invoice
      };
    } catch (error) {
      console.error('Download invoice error:', error);
      throw error;
    }
  }

  // Get all invoices (for admin)
  async getAllInvoices(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const invoices = await Invoice.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Invoice.countDocuments();
      
      return {
        invoices,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalInvoices: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Get all invoices error:', error);
      throw error;
    }
  }
}

module.exports = new InvoiceService();