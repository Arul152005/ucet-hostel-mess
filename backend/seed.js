const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Hostel = require('./models/Hostel');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ucet_hostel_management');
    console.log('✅ Connected to MongoDB for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample hostels data
const hostelsData = [
  {
    name: 'A-Block Boys Hostel',
    code: 'A-BOYS',
    gender: 'boys',
    type: 'undergraduate',
    capacity: 200,
    currentOccupancy: 150,
    floors: 4,
    roomsPerFloor: 50,
    location: {
      address: 'Near Main Gate, UCET Campus'
    },
    contactNumber: '+91-9876543210',
    facilities: [
      { name: 'WiFi', description: 'High-speed internet', isAvailable: true },
      { name: 'Laundry', description: 'Washing machines available', isAvailable: true },
      { name: 'Common Room', description: 'TV and recreation area', isAvailable: true },
      { name: 'Study Room', description: '24/7 study facility', isAvailable: true }
    ],
    rules: [
      { category: 'entry_exit', rule: 'Entry allowed till 10 PM', isActive: true },
      { category: 'visitor_policy', rule: 'Visitors allowed with prior permission', isActive: true },
      { category: 'discipline', rule: 'No smoking or alcohol in premises', isActive: true }
    ],
    timings: {
      entryTime: '06:00',
      exitTime: '22:00',
      gateCloseTime: '23:00',
      isFlexible: false
    },
    feeStructure: {
      monthlyRent: 3500,
      securityDeposit: 5000,
      maintenanceCharges: 500,
      amenityCharges: 300
    }
  },
  {
    name: 'B-Block Girls Hostel',
    code: 'B-GIRLS',
    gender: 'girls',
    type: 'undergraduate',
    capacity: 180,
    currentOccupancy: 120,
    floors: 4,
    roomsPerFloor: 45,
    location: {
      address: 'Near Library, UCET Campus'
    },
    contactNumber: '+91-9876543211',
    facilities: [
      { name: 'WiFi', description: 'High-speed internet', isAvailable: true },
      { name: 'Laundry', description: 'Washing machines available', isAvailable: true },
      { name: 'Common Room', description: 'TV and recreation area', isAvailable: true },
      { name: 'Gym', description: 'Basic fitness equipment', isAvailable: true }
    ],
    rules: [
      { category: 'entry_exit', rule: 'Entry allowed till 9 PM', isActive: true },
      { category: 'visitor_policy', rule: 'Female visitors allowed with permission', isActive: true },
      { category: 'discipline', rule: 'Quiet hours after 10 PM', isActive: true }
    ],
    timings: {
      entryTime: '06:00',
      exitTime: '21:00',
      gateCloseTime: '22:00',
      isFlexible: false
    },
    feeStructure: {
      monthlyRent: 3500,
      securityDeposit: 5000,
      maintenanceCharges: 500,
      amenityCharges: 300
    }
  },
  {
    name: 'C-Block Boys Hostel',
    code: 'C-BOYS',
    gender: 'boys',
    type: 'postgraduate',
    capacity: 100,
    currentOccupancy: 75,
    floors: 3,
    roomsPerFloor: 34,
    location: {
      address: 'Near Research Block, UCET Campus'
    },
    contactNumber: '+91-9876543212',
    facilities: [
      { name: 'WiFi', description: 'High-speed internet', isAvailable: true },
      { name: 'Research Room', description: 'Dedicated research space', isAvailable: true },
      { name: 'Conference Room', description: 'For group studies', isAvailable: true }
    ],
    rules: [
      { category: 'entry_exit', rule: 'Entry allowed till 11 PM', isActive: true },
      { category: 'research', rule: 'Research activities allowed 24/7', isActive: true }
    ],
    timings: {
      entryTime: '06:00',
      exitTime: '23:00',
      gateCloseTime: '24:00',
      isFlexible: true
    },
    feeStructure: {
      monthlyRent: 4000,
      securityDeposit: 6000,
      maintenanceCharges: 600,
      amenityCharges: 400
    }
  }
];

// Sample users data
const usersData = [
  // Warden
  {
    firstName: 'Dr. Rajesh',
    lastName: 'Kumar',
    email: 'warden@ucet.edu.in',
    password: 'warden123',
    phone: '+91-9876543200',
    role: 'warden',
    employeeId: 'EMP24001',
    dateOfJoining: new Date('2020-01-15'),
    qualification: 'Ph.D. in Administration',
    experience: 15,
    assignedGender: 'both'
  },
  
  // Deputy Wardens
  {
    firstName: 'Mr. Suresh',
    lastName: 'Patel',
    email: 'deputy.boys@ucet.edu.in',
    password: 'deputy123',
    phone: '+91-9876543201',
    role: 'deputy_warden_boys',
    employeeId: 'EMP24002',
    dateOfJoining: new Date('2021-03-20'),
    qualification: 'M.A. in Management',
    experience: 10,
    assignedGender: 'boys'
  },
  {
    firstName: 'Mrs. Priya',
    lastName: 'Sharma',
    email: 'deputy.girls@ucet.edu.in',
    password: 'deputy123',
    phone: '+91-9876543202',
    role: 'deputy_warden_girls',
    employeeId: 'EMP24003',
    dateOfJoining: new Date('2021-04-10'),
    qualification: 'M.A. in Psychology',
    experience: 8,
    assignedGender: 'girls'
  },
  
  // Executive Warden
  {
    firstName: 'Mr. Anil',
    lastName: 'Gupta',
    email: 'executive.warden@ucet.edu.in',
    password: 'executive123',
    phone: '+91-9876543203',
    role: 'executive_warden',
    employeeId: 'EMP24004',
    dateOfJoining: new Date('2022-01-05'),
    qualification: 'MBA in Operations',
    experience: 12,
    assignedGender: 'both'
  },
  
  // Residential Counsellors
  {
    firstName: 'Mr. Vikram',
    lastName: 'Singh',
    email: 'rc.boys@ucet.edu.in',
    password: 'rc1234',
    phone: '+91-9876543204',
    role: 'residential_counsellor_boys',
    employeeId: 'EMP24005',
    dateOfJoining: new Date('2022-06-15'),
    qualification: 'M.Sc. in Psychology',
    experience: 5,
    assignedGender: 'boys'
  },
  {
    firstName: 'Mrs. Meera',
    lastName: 'Joshi',
    email: 'rc.girls@ucet.edu.in',
    password: 'rc1234',
    phone: '+91-9876543205',
    role: 'residential_counsellor_girls',
    employeeId: 'EMP24006',
    dateOfJoining: new Date('2022-07-01'),
    qualification: 'M.A. in Counselling',
    experience: 6,
    assignedGender: 'girls'
  },
  
  // Hostel Incharges
  {
    firstName: 'Mr. Ramesh',
    lastName: 'Yadav',
    email: 'incharge.aboys@ucet.edu.in',
    password: 'incharge123',
    phone: '+91-9876543206',
    role: 'hostel_incharge',
    employeeId: 'EMP24007',
    dateOfJoining: new Date('2023-01-10'),
    qualification: 'B.A. in Administration',
    experience: 7,
    assignedGender: 'boys'
  },
  {
    firstName: 'Mrs. Sunita',
    lastName: 'Verma',
    email: 'incharge.bgirls@ucet.edu.in',
    password: 'incharge123',
    phone: '+91-9876543207',
    role: 'hostel_incharge',
    employeeId: 'EMP24008',
    dateOfJoining: new Date('2023-02-15'),
    qualification: 'B.A. in Management',
    experience: 5,
    assignedGender: 'girls'
  },
  
  // Mess Incharges
  {
    firstName: 'Mr. Ganesh',
    lastName: 'Rao',
    email: 'mess.aboys@ucet.edu.in',
    password: 'mess123',
    phone: '+91-9876543208',
    role: 'mess_incharge',
    employeeId: 'EMP24009',
    dateOfJoining: new Date('2023-03-01'),
    qualification: 'Diploma in Catering',
    experience: 10,
    assignedGender: 'boys'
  },
  {
    firstName: 'Mrs. Kavita',
    lastName: 'Nair',
    email: 'mess.bgirls@ucet.edu.in',
    password: 'mess123',
    phone: '+91-9876543209',
    role: 'mess_incharge',
    employeeId: 'EMP24010',
    dateOfJoining: new Date('2023-03-15'),
    qualification: 'Diploma in Food Management',
    experience: 8,
    assignedGender: 'girls'
  },
  
  // Regular Students
  {
    firstName: 'Arjun',
    lastName: 'Reddy',
    email: 'arjun.reddy@student.ucet.edu.in',
    password: 'student123',
    phone: '+91-9876543300',
    role: 'student',
    // registerNumber: 'REG24001', // Optional field, not set during registration
    course: 'B.Tech Computer Science',
    year: 2,
    department: 'Computer Science',
    parentContact: {
      name: 'Mr. Krishna Reddy',
      phone: '+91-9876543301',
      email: 'krishna.reddy@gmail.com'
    }
  },
  {
    firstName: 'Priyanka',
    lastName: 'Agarwal',
    email: 'priyanka.agarwal@student.ucet.edu.in',
    password: 'student123',
    phone: '+91-9876543302',
    role: 'student',
    // registerNumber: 'REG24002', // Optional field, not set during registration
    course: 'B.Tech Electronics',
    year: 3,
    department: 'Electronics',
    parentContact: {
      name: 'Mr. Suresh Agarwal',
      phone: '+91-9876543303',
      email: 'suresh.agarwal@gmail.com'
    }
  },
  {
    firstName: 'Rohit',
    lastName: 'Sharma',
    email: 'rohit.sharma@student.ucet.edu.in',
    password: 'student123',
    phone: '+91-9876543304',
    role: 'student',
    // registerNumber: 'REG24003', // Optional field, not set during registration
    course: 'B.Tech Mechanical',
    year: 1,
    department: 'Mechanical',
    parentContact: {
      name: 'Mr. Vijay Sharma',
      phone: '+91-9876543305',
      email: 'vijay.sharma@gmail.com'
    }
  },
  {
    firstName: 'Anjali',
    lastName: 'Singh',
    email: 'anjali.singh@student.ucet.edu.in',
    password: 'student123',
    phone: '+91-9876543306',
    role: 'student',
    // registerNumber: 'REG24004', // Optional field, not set during registration
    course: 'B.Tech Civil',
    year: 2,
    department: 'Civil',
    parentContact: {
      name: 'Mrs. Rekha Singh',
      phone: '+91-9876543307',
      email: 'rekha.singh@gmail.com'
    }
  },
  
  // Mess Representatives
  {
    firstName: 'Karthik',
    lastName: 'Menon',
    email: 'karthik.menon@student.ucet.edu.in',
    password: 'student123',
    phone: '+91-9876543308',
    role: 'mess_representative',
    // registerNumber: 'REG24005', // Optional field, not set during registration
    course: 'B.Tech Computer Science',
    year: 3,
    department: 'Computer Science',
    representativeInfo: {
      electedDate: new Date('2024-08-01'),
      termEnd: new Date('2025-07-31'),
      responsibilities: ['Coordinate with mess incharge', 'Gather feedback from students', 'Organize mess meetings'],
      achievements: ['Improved breakfast menu', 'Reduced food wastage by 20%']
    },
    parentContact: {
      name: 'Mr. Sunil Menon',
      phone: '+91-9876543309',
      email: 'sunil.menon@gmail.com'
    }
  },
  {
    firstName: 'Sneha',
    lastName: 'Patil',
    email: 'sneha.patil@student.ucet.edu.in',
    password: 'student123',
    phone: '+91-9876543310',
    role: 'mess_representative',
    // registerNumber: 'REG24006', // Optional field, not set during registration
    course: 'B.Tech Electronics',
    year: 4,
    department: 'Electronics',
    representativeInfo: {
      electedDate: new Date('2024-08-01'),
      termEnd: new Date('2025-07-31'),
      responsibilities: ['Coordinate with mess incharge', 'Gather feedback from students', 'Monitor food quality'],
      achievements: ['Introduced healthy food options', 'Organized nutrition awareness']
    },
    parentContact: {
      name: 'Mr. Prakash Patil',
      phone: '+91-9876543311',
      email: 'prakash.patil@gmail.com'
    }
  },
  
  // Hostel Representatives
  {
    firstName: 'Deepak',
    lastName: 'Kumar',
    email: 'deepak.kumar@student.ucet.edu.in',
    password: 'student123',
    phone: '+91-9876543312',
    role: 'hostel_representative',
    // registerNumber: 'REG24007', // Optional field, not set during registration
    course: 'B.Tech Mechanical',
    year: 3,
    department: 'Mechanical',
    representativeInfo: {
      electedDate: new Date('2024-08-01'),
      termEnd: new Date('2025-07-31'),
      responsibilities: ['Coordinate with hostel incharge', 'Organize events', 'Address student concerns'],
      achievements: ['Organized cultural night', 'Improved hostel WiFi', 'Set up study groups']
    },
    parentContact: {
      name: 'Mr. Ram Kumar',
      phone: '+91-9876543313',
      email: 'ram.kumar@gmail.com'
    }
  },
  {
    firstName: 'Riya',
    lastName: 'Gupta',
    email: 'riya.gupta@student.ucet.edu.in',
    password: 'student123',
    phone: '+91-9876543314',
    role: 'hostel_representative',
    // registerNumber: 'REG24008', // Optional field, not set during registration
    course: 'B.Tech Civil',
    year: 2,
    department: 'Civil',
    representativeInfo: {
      electedDate: new Date('2024-08-01'),
      termEnd: new Date('2025-07-31'),
      responsibilities: ['Coordinate with hostel incharge', 'Organize events', 'Maintain hostel discipline'],
      achievements: ['Started fitness program', 'Organized safety workshop', 'Improved common room facilities']
    },
    parentContact: {
      name: 'Mrs. Sita Gupta',
      phone: '+91-9876543315',
      email: 'sita.gupta@gmail.com'
    }
  }
];

// Seed hostels
const seedHostels = async () => {
  try {
    console.log('🏠 Seeding hostels...');
    
    // Clear existing hostels
    await Hostel.deleteMany({});
    
    // Insert new hostels
    const hostels = await Hostel.insertMany(hostelsData);
    console.log(`✅ Created ${hostels.length} hostels`);
    
    return hostels;
  } catch (error) {
    console.error('❌ Error seeding hostels:', error);
    throw error;
  }
};

// Seed users
const seedUsers = async (hostels) => {
  try {
    console.log('👥 Seeding users...');
    
    // Clear existing users
    await User.deleteMany({});
    
    // Create users one by one to trigger pre-save middleware for password hashing
    const users = [];
    
    for (let i = 0; i < usersData.length; i++) {
      const userData = { ...usersData[i] };
      
      // Assign hostels to users
      const assignHostels = (userData) => {
        // Assign hostels to hostel incharges
        if (userData.role === 'hostel_incharge') {
          if (userData.assignedGender === 'boys') {
            userData.assignedHostel = hostels.find(h => h.gender === 'boys')?._id;
          } else if (userData.assignedGender === 'girls') {
            userData.assignedHostel = hostels.find(h => h.gender === 'girls')?._id;
          }
        }
        
        // Assign hostels to mess incharges
        if (userData.role === 'mess_incharge') {
          if (userData.assignedGender === 'boys') {
            userData.assignedHostel = hostels.find(h => h.gender === 'boys')?._id;
          } else if (userData.assignedGender === 'girls') {
            userData.assignedHostel = hostels.find(h => h.gender === 'girls')?._id;
          }
        }
        
        // Assign hostels to students based on gender (alternate assignment for demo)
        if (userData.role === 'student' || userData.role === 'mess_representative' || userData.role === 'hostel_representative') {
          const isMale = ['Arjun', 'Rohit', 'Karthik', 'Deepak'].includes(userData.firstName);
          const isFemale = ['Priyanka', 'Anjali', 'Sneha', 'Riya'].includes(userData.firstName);
          
          if (isMale) {
            userData.assignedHostel = hostels.find(h => h.gender === 'boys')?._id;
          } else if (isFemale) {
            userData.assignedHostel = hostels.find(h => h.gender === 'girls')?._id;
          }
        }
        
        return userData;
      };
      
      // Apply hostel assignments
      assignHostels(userData);
      
      // Create user instance to trigger pre-save middleware for password hashing
      const user = new User(userData);
      await user.save();
      users.push(user);
      
      console.log(`Created user: ${userData.firstName} ${userData.lastName} (${userData.role})`);
    }
    
    console.log(`✅ Created ${users.length} users`);
    
    // Update hostel representatives
    await updateHostelRepresentatives(users, hostels);
    
    return users;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

// Update hostel representatives
const updateHostelRepresentatives = async (users, hostels) => {
  try {
    console.log('🔄 Updating hostel representatives...');
    
    for (const hostel of hostels) {
      const hostelRep = users.find(u => 
        u.role === 'hostel_representative' && 
        u.assignedHostel?.toString() === hostel._id.toString()
      );
      
      const messRep = users.find(u => 
        u.role === 'mess_representative' && 
        u.assignedHostel?.toString() === hostel._id.toString()
      );
      
      const updateData = {};
      if (hostelRep) updateData['representatives.hostelRep'] = hostelRep._id;
      if (messRep) updateData['representatives.messRep'] = messRep._id;
      
      if (Object.keys(updateData).length > 0) {
        await Hostel.findByIdAndUpdate(hostel._id, updateData);
      }
    }
    
    console.log('✅ Updated hostel representatives');
  } catch (error) {
    console.error('❌ Error updating representatives:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await connectDB();
    
    const hostels = await seedHostels();
    const users = await seedUsers(hostels);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Hostels: ${hostels.length}`);
    console.log(`   Users: ${users.length}`);
    console.log('');
    console.log('👥 Sample Login Credentials:');
    console.log('   Warden: warden@ucet.edu.in / warden123');
    console.log('   Deputy (Boys): deputy.boys@ucet.edu.in / deputy123');
    console.log('   Deputy (Girls): deputy.girls@ucet.edu.in / deputy123');
    console.log('   RC (Boys): rc.boys@ucet.edu.in / rc1234');
    console.log('   RC (Girls): rc.girls@ucet.edu.in / rc1234');
    console.log('   Student: arjun.reddy@student.ucet.edu.in / student123');
    console.log('   Mess Rep: karthik.menon@student.ucet.edu.in / student123');
    console.log('   Hostel Rep: deepak.kumar@student.ucet.edu.in / student123');
    console.log('');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };