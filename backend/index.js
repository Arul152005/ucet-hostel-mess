const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Import routes
const authRoutes = require('./routes/auth');
const staffRoutes = require('./routes/staff');
const representativeRoutes = require('./routes/representatives');
const dashboardRoutes = require('./routes/dashboard');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'UCET Hostel Management System Backend API',
        version: '2.0.0',
        status: 'Running',
        features: [
            'Role-based authentication',
            'Staff management',
            'Student representatives',
            'Dashboard analytics',
            'Hostel management'
        ],
        roles: {
            staff: [
                'Warden',
                'Deputy Warden (Boys)',
                'Deputy Warden (Girls)',
                'Executive Warden',
                'Residential Counsellor (RC)',
                'Hostel Incharge',
                'Mess Incharge'
            ],
            students: [
                'Student',
                'Mess Representative',
                'Hostel Representative'
            ]
        }
    });
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/representatives', representativeRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ucet_hostel_management')
    .then(() => {
        console.log('✅ Connected to MongoDB');
        console.log('📊 Database:', mongoose.connection.name);
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Start server
app.listen(PORT, () => {
    console.log('🚀 Server is running on port', PORT);
    console.log('🏠 UCET Hostel Management System API');
    console.log('🔗 API Documentation: http://localhost:' + PORT);
    console.log('❤️  Health Check: http://localhost:' + PORT + '/health');
    console.log('\n📊 Available Roles:');
    console.log('   Staff: Warden, Deputy Warden, Executive Warden, RC, Hostel Incharge, Mess Incharge');
    console.log('   Students: Student, Mess Representative, Hostel Representative');
});

module.exports = app;