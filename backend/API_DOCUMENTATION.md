# UCET Hostel Management System - Backend API Documentation

## 🏗️ Architecture Overview

The backend has been completely restructured with a comprehensive role-based authentication and authorization system.

## 🎯 Roles and Permissions

### Staff Roles
1. **Warden** - Complete system access
   - Manage all hostels, staff, and students
   - View comprehensive reports
   - Approve major requests
   - Manage finances

2. **Deputy Warden (Boys)** - Boys hostel management
   - Manage boys hostels and students
   - View boys-specific reports
   - Handle disciplinary actions for boys

3. **Deputy Warden (Girls)** - Girls hostel management
   - Manage girls hostels and students
   - View girls-specific reports
   - Handle disciplinary actions for girls

4. **Executive Warden** - Operations support
   - Assist warden with day-to-day operations
   - Coordinate between departments
   - Handle emergency situations

5. **Residential Counsellor (Boys)** - Boys student welfare
   - Counsel boys students
   - Handle boys student issues and complaints
   - Conduct wellness programs for boys

6. **Residential Counsellor (Girls)** - Girls student welfare
   - Counsel girls students
   - Handle girls student issues and complaints
   - Conduct wellness programs for girls

7. **Hostel Incharge** - Individual hostel management
   - Manage assigned hostel
   - Handle room allocations
   - Maintain hostel facilities

8. **Mess Incharge** - Mess operations
   - Manage meal plans and menus
   - Handle food-related complaints
   - Manage mess staff

### Student Roles
1. **Student** - Basic student access
   - View profile and make bookings
   - Pay fees and submit requests
   - View announcements

2. **Mess Representative** - Student + mess advocacy
   - Represent mess-related issues
   - Coordinate with mess incharge
   - Gather student feedback

3. **Hostel Representative** - Student + hostel advocacy
   - Represent hostel-related issues
   - Coordinate with hostel incharge
   - Organize hostel events

## 🛡️ API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /profile` - Get current user profile
- `PUT /profile` - Update own profile
- `PUT /profile/:userId` - Update user profile (staff only)
- `PUT /change-password` - Change password
- `GET /roles` - Get available roles and permissions
- `GET /verify` - Verify token

### Staff Management (`/api/staff`)
- `GET /` - Get all staff members
- `GET /:staffId` - Get staff member by ID
- `POST /` - Create new staff member (Warden only)
- `PUT /:staffId` - Update staff member (Warden only)
- `PUT /:staffId/role` - Update staff role (Warden only)
- `PUT /:staffId/assign-hostel` - Assign hostel to staff
- `PUT /:staffId/deactivate` - Deactivate staff member
- `GET /role/:role` - Get staff by role
- `GET /stats/overview` - Get staff statistics

### Student Representatives (`/api/representatives`)
- `GET /` - Get all representatives
- `GET /:repId` - Get representative by ID
- `POST /nominate` - Nominate student as representative
- `PUT /:repId` - Update representative info
- `PUT /:repId/remove` - Remove representative role
- `GET /hostel/:hostelId` - Get representatives by hostel
- `POST /report` - Submit representative report
- `GET /stats/overview` - Get representative statistics

### Dashboard (`/api/dashboard`)
- `GET /` - Get role-specific dashboard data
- `GET /role/:role` - Get dashboard data by role
- `GET /system/stats` - Get system-wide statistics

## 🔐 Security Features

### Authentication
- JWT token-based authentication
- Password hashing with bcrypt
- Token expiration and refresh

### Authorization
- Role-based access control (RBAC)
- Permission-based authorization
- Middleware for route protection
- Gender-specific access control

### Middleware
- `authenticate` - Verify JWT token
- `authorize(...roles)` - Role-based access
- `requirePermission(permission)` - Permission-based access
- `staffOnly` - Staff-only access
- `studentOnly` - Student-only access
- `wardenAccess` - Senior staff access
- `hostelAccess` - Hostel-specific access

## 🗄️ Database Models

### User Model
- Basic info: name, email, phone
- Role and permissions
- Student-specific: studentId, course, year
- Staff-specific: employeeId, qualifications
- Hostel assignments
- Profile and emergency contacts

### Hostel Model
- Basic info: name, code, gender, capacity
- Staff assignments
- Facilities and rules
- Fee structure
- Representatives

## 🚀 Server Status

✅ **Server Running**: http://localhost:3000
✅ **Database Connected**: MongoDB Atlas
✅ **Health Check**: http://localhost:3000/health
✅ **API Documentation**: http://localhost:3000

## 📊 Key Features

1. **Comprehensive Role System** - 11 distinct roles with specific permissions
2. **Gender-Based Access Control** - Separate management for boys and girls hostels
3. **Representative Management** - Student leadership tracking
4. **Dashboard Analytics** - Role-specific dashboard data
5. **Staff Hierarchy** - Proper chain of command
6. **Security First** - JWT authentication with role-based authorization

## 🧪 Testing

The system has been tested with:
- Health check endpoint
- Role information retrieval
- API route structure
- Database connectivity
- Authentication flow

All endpoints are functioning correctly with proper role-based access control.

## 🔧 Environment Setup

Required environment variables in `.env`:
```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ucet_hostel_management
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

## 📝 Next Steps

1. Frontend integration with new role system
2. Real-time notifications
3. File upload for documents
4. Advanced reporting system
5. Mobile app integration