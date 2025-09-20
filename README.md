# UCET Hostel Management System

A comprehensive hostel management application for University College of Engineering Tindivanam (UCET) built with Node.js backend and Flutter frontend.

## 🚀 Features

### ✅ Implemented Features

#### Authentication & Role Management
- **Multi-role Authentication**: Separate login interfaces for admin/staff and students
- **Role-based Access Control**: 11 distinct roles with specific permissions
  - **Staff Roles**: Warden, Deputy Wardens (Boys/Girls), Executive Warden, Residential Counsellors (Boys/Girls), Hostel Incharge, Mess Incharge
  - **Student Roles**: Student, Mess Representative, Hostel Representative
- **JWT Token-based Security**: Secure authentication with token management
- **Password Validation**: Minimum 6 character requirement with bcrypt hashing

#### Registration System
- **Complete Registration Flow**: 
  1. Student fills detailed registration form with password
  2. Payment gateway simulation with success/failure options
  3. Declaration dialog with legal compliance checkboxes
  4. Final data storage in MongoDB
- **UCET Official Form**: Digital version of official UCET Tindivanam admission form
- **Comprehensive Data Collection**: Personal, parent/guardian, local guardian information
- **Fee Structure**: Complete breakdown (₹46,800 total fees)
- **Image Upload**: Profile photo with validation
- **Mobile-Responsive Design**: Optimized for mobile devices

#### Backend Infrastructure
- **MongoDB Integration**: Complete user and hostel data models
- **Database Seeding**: Sample data for all 18 users across 11 roles
- **API Endpoints**: Authentication, registration, dashboard data
- **Error Handling**: Comprehensive error management
- **Data Validation**: Mongoose schema validation

#### Frontend (Flutter)
- **Modern UI/UX**: Material Design 3 with responsive layouts
- **Role-based Dashboards**: Separate interfaces for admin and students
- **Form Validation**: Complete client-side validation
- **Navigation Flow**: Intuitive user journey
- **State Management**: Proper Flutter state handling

## 📁 Project Structure

```
UCET-Hostel-Management/
├── backend/                 # Node.js Backend API
│   ├── models/             # MongoDB data models
│   │   ├── User.js         # User model with 11 roles
│   │   └── Hostel.js       # Hostel management model
│   ├── routes/             # API route handlers
│   │   ├── auth.js         # Authentication endpoints
│   │   ├── dashboard.js    # Dashboard data
│   │   ├── staff.js        # Staff management
│   │   └── representatives.js # Student representatives
│   ├── middleware/         # Custom middleware
│   │   └── auth.js         # JWT authentication middleware
│   ├── seed.js            # Database seeding script
│   ├── index.js           # Main server file
│   └── package.json       # Backend dependencies
│
└── frontend/               # Flutter Mobile Application
    ├── lib/
    │   ├── screens/        # UI screens
    │   │   ├── common/     # Shared screens
    │   │   ├── admin/      # Admin/staff screens
    │   │   └── student/    # Student screens
    │   ├── services/       # API integration services
    │   │   ├── auth_service.dart
    │   │   └── registration_service.dart
    │   └── main.dart       # Main Flutter app
    └── pubspec.yaml        # Flutter dependencies
```

## 🛠 Setup Instructions

### Backend Setup

#### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

#### Installation
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```
   Configure your MongoDB connection in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/ucet_hostel_management
   JWT_SECRET=your_jwt_secret_key
   PORT=3000
   ```

4. Seed the database:
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The backend will be running on `http://localhost:3000`

### Frontend Setup

#### Prerequisites
- Flutter SDK (latest stable version)
- Dart SDK
- Android Studio / VS Code with Flutter extension

#### Installation
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Get Flutter dependencies:
   ```bash
   flutter pub get
   ```

3. Run the app:
   ```bash
   flutter run
   ```

## 🔑 Sample Login Credentials

After running the seed script, you can use these credentials to test the application:

### Staff/Admin Accounts
- **Warden**: `warden@ucet.edu.in` / `warden123`
- **Deputy Warden (Boys)**: `deputy.boys@ucet.edu.in` / `deputy123`
- **Deputy Warden (Girls)**: `deputy.girls@ucet.edu.in` / `deputy123`
- **RC (Boys)**: `rc.boys@ucet.edu.in` / `rc1234`
- **RC (Girls)**: `rc.girls@ucet.edu.in` / `rc1234`

### Student Accounts
- **Student**: `arjun.reddy@student.ucet.edu.in` / `student123`
- **Mess Rep**: `karthik.menon@student.ucet.edu.in` / `student123`
- **Hostel Rep**: `deepak.kumar@student.ucet.edu.in` / `student123`

## 🎯 User Journey

### For New Students (Registration)
1. Open Flutter app → Role Selection → Student Login
2. Click "Register for Hostel" button
3. Fill comprehensive registration form (name, email, password, course, etc.)
4. Upload passport size photo
5. Proceed to payment gateway (simulation)
6. Click "Payment Success" 
7. Accept declaration and consent terms
8. Registration completed and saved to MongoDB

### For Existing Users (Login)
1. Open Flutter app → Role Selection
2. Choose Admin/Staff or Student login
3. Enter credentials and login
4. Access role-specific dashboard

## 🗄 Database Schema

### User Roles & Permissions
- **11 Distinct Roles** with hierarchical permissions
- **Gender-specific roles** for Residential Counsellors
- **Automatic permission assignment** based on role
- **Hostel assignment** logic for staff members

### Registration Data Structure
```json
{
  "name": "Student Name",
  "email": "student@email.com",
  "password": "hashedPassword",
  "course": "B.Tech Computer Science",
  "gender": "Male/Female/Transgender",
  "category": "FC/BC/MBC/SC/ST",
  "messPreference": "VEG/NON VEG",
  "parentInfo": { /* parent details */ },
  "guardianInfo": { /* local guardian details */ },
  "paymentStatus": true,
  "declarationAccepted": true,
  "parentConsent": true
}
```

## 🔧 Available Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Populate database with sample data

### Frontend
- `flutter run` - Run app in debug mode
- `flutter build apk` - Build Android APK
- `flutter build ios` - Build iOS app
- `flutter test` - Run tests

## 🌟 Technical Highlights

- **Responsive Design**: Works seamlessly on mobile and tablet devices
- **Secure Authentication**: JWT tokens with role-based access control
- **Data Validation**: Both client-side and server-side validation
- **Professional UI**: Modern Material Design 3 interface
- **Complete Flow**: End-to-end registration with payment simulation
- **MongoDB Integration**: Structured data storage with relationships
- **Error Handling**: Comprehensive error management throughout

## 📱 Screenshots & Features

- **Role Selection Screen**: Choose between Admin/Staff and Student interfaces
- **Login Screens**: Separate themed interfaces (orange for admin, blue for students)
- **Registration Form**: 5-section comprehensive form with photo upload
- **Payment Gateway**: Professional payment interface with fee breakdown
- **Declaration Dialog**: Legal compliance with checkboxes
- **Dashboards**: Role-specific interfaces with relevant actions

## 🚧 Future Enhancements

- Real payment gateway integration (Razorpay/PayU)
- Push notifications
- Room allocation system
- Mess management features
- Maintenance request system
- Fee tracking and reports
- Admin panel for registration approval

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏫 About UCET

University College of Engineering Tindivanam (UCET) is a constituent college of Anna University, Chennai, located in Melpakkam, Tindivanam. This hostel management system is designed specifically for UCET's hostel administration and student needs.

---

**Built with ❤️ for UCET Students and Administration**