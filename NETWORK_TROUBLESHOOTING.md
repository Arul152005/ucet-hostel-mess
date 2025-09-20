# Network Troubleshooting Guide

## Common Solutions for "Network Error While Fetching Submit API"

### 1. **Backend Server Issues**
```bash
# Ensure backend server is running
cd "c:\Users\User\Pictures\UCET\Hostel\Version 1\backend"
npm start
# OR
node index.js

# Server should show:
# 🚀 Server is running on port 3000
# ✅ Connected to MongoDB
```

### 2. **Platform-Specific Fixes**

#### Android Emulator:
- Use `http://10.0.2.2:3000/api` (automatically configured)
- Ensure emulator can access host network

#### iOS Simulator:
- Use `http://localhost:3000/api` (automatically configured)

#### Web/Desktop:
- Use `http://localhost:3000/api` (automatically configured)

#### Real Device (Android/iOS):
- Replace `localhost` with your computer's IP address
- Example: `http://192.168.1.100:3000/api`
- Ensure device and computer are on same network

### 3. **Firewall/Network Issues**
- Disable Windows Firewall temporarily
- Check antivirus software
- Ensure port 3000 is not blocked

### 4. **Code Fix (Manual URL Override)**
If automatic detection fails, manually set the URL in:
`frontend/lib/services/registration_service.dart`

```dart
static String get baseUrl {
  // Override with your specific URL
  return 'http://YOUR_COMPUTER_IP:3000/api';
}
```

### 5. **Test Connectivity**
Use the Network Test Screen (bug icon in registration screen) to:
- Test all URL combinations
- See detailed error messages
- Verify platform detection

### 6. **Backend Logs**
Check backend console for:
- CORS errors
- Request received confirmations
- Database connection issues

### 7. **Last Resort - Direct IP**
```bash
# Find your computer's IP
ipconfig
# Use that IP in the frontend
```

## Quick Verification Steps:
1. ✅ Backend server running and showing "Connected to MongoDB"
2. ✅ Can access http://localhost:3000/health in browser
3. ✅ Network Test Screen shows successful connectivity
4. ✅ Registration form submission succeeds