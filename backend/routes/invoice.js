const express = require('express');
const jwt = require('jsonwebtoken');
const invoiceService = require('../services/invoiceService');
const { authenticate } = require('../middleware/auth');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Get student's invoices
router.get('/student/:email', authenticate, async (req, res) => {
  try {
    const { email } = req.params;
    
    // Check if user is accessing their own invoices or is staff
    if (!req.user.isStaff && req.user.email !== email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Can only view own invoices.'
      });
    }

    const invoices = await invoiceService.getInvoicesByStudent(email);
    
    res.json({
      success: true,
      data: invoices
    });

  } catch (error) {
    console.error('Get student invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoices'
    });
  }
});

// Get invoice by ID
router.get('/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await invoiceService.getInvoice(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if this is a guest access (no auth header) and if invoice is recent
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      // Allow guest access for invoices created within last 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (invoice.createdAt < thirtyMinutesAgo) {
        return res.status(403).json({
          success: false,
          message: 'Authentication required to access this invoice'
        });
      }
    } else {
      // Verify authentication for older invoices
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check access permissions
        if (!decoded.isStaff && decoded.email !== invoice.studentDetails.email) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Can only view own invoices.'
          });
        }
      } catch (authError) {
        return res.status(401).json({
          success: false,
          message: 'Invalid authentication token'
        });
      }
    }

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoice'
    });
  }
});

// Download invoice
router.get('/:invoiceId/download', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await invoiceService.getInvoice(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if this is a guest access (no auth header) and if invoice is recent
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      // Allow guest access for invoices created within last 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (invoice.createdAt < thirtyMinutesAgo) {
        return res.status(403).json({
          success: false,
          message: 'Authentication required to download this invoice'
        });
      }
    } else {
      // Verify authentication for older invoices
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check access permissions
        if (!decoded.isStaff && decoded.email !== invoice.studentDetails.email) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Can only download own invoices.'
          });
        }
      } catch (authError) {
        return res.status(401).json({
          success: false,
          message: 'Invalid authentication token'
        });
      }
    }

    const downloadResult = await invoiceService.downloadInvoice(invoiceId);
    
    if (!downloadResult.success) {
      return res.status(404).json({
        success: false,
        message: 'Invoice file not found'
      });
    }

    // Check if file exists
    try {
      await fs.access(downloadResult.filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Invoice file not found on server'
      });
    }

    // Set headers for download
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadResult.fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    
    // Stream the file
    const fileContent = await fs.readFile(downloadResult.filePath, 'utf8');
    res.send(fileContent);

  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download invoice'
    });
  }
});

// View invoice in browser
router.get('/:invoiceId/view', authenticate, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await invoiceService.getInvoice(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check access permissions
    if (!req.user.isStaff && req.user.email !== invoice.studentDetails.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Can only view own invoices.'
      });
    }

    // Check if file exists
    try {
      await fs.access(invoice.pdfPath);
      const fileContent = await fs.readFile(invoice.pdfPath, 'utf8');
      
      // Set header to display in browser
      res.setHeader('Content-Type', 'text/html');
      res.send(fileContent);
      
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Invoice file not found on server'
      });
    }

  } catch (error) {
    console.error('View invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to view invoice'
    });
  }
});

// Get all invoices (admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!req.user.isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Staff privileges required.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await invoiceService.getAllInvoices(page, limit);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get all invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoices'
    });
  }
});

// Get invoice by invoice number
router.get('/number/:invoiceNumber', authenticate, async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const invoice = await invoiceService.getInvoiceByNumber(invoiceNumber);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check access permissions
    if (!req.user.isStaff && req.user.email !== invoice.studentDetails.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Can only view own invoices.'
      });
    }

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Get invoice by number error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoice'
    });
  }
});

module.exports = router;