# CANDLE - Stock Prediction Competition Platform

A full-stack application for stock earnings prediction competitions with user authentication, real-time leaderboards, and community features.

## Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- shadcn/ui components
- Lucide React icons

**Backend:**
- Node.js
- Express.js
- MongoDB Atlas
- JWT Authentication
- bcryptjs for password hashing

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Git

### Backend Setup

1. **Create backend directory and navigate to it:**
```bash
mkdir candle-backend
cd candle-backend
```

2. **Initialize package.json and install dependencies:**
```bash
npm init -y
npm install express mongoose bcryptjs jsonwebtoken cors dotenv helmet express-rate-limit express-validator morgan
npm install -D nodemon jest supertest
```

3. **Create the server.js file** (use the Backend Server artifact content)

4. **Create environment configuration:**
```bash
# Create .env file
cp .env.example .env
```

5. **Update .env with your MongoDB Atlas credentials:**
```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/candle?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

6. **Update package.json scripts:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  }
}
```

7. **Start the backend server:**
```bash
npm run dev
```

The server should start on http://localhost:5000

### Frontend Setup

1. **Navigate to your existing React project directory**

2. **Install additional dependencies for authentication:**
```bash
npm install axios
# axios is optional - we're using fetch API, but you might want it for more advanced HTTP handling
```

3. **Create the folder structure:**
```
src/
  contexts/
    AuthContext.jsx
  components/
    auth/
      Login.jsx
      Signup.jsx
    ui/
      (your existing shadcn components)
```

4. **Create the authentication files:**
   - Create `src/contexts/AuthContext.jsx` (use the Authentication Context artifact)
   - Create `src/components/auth/Login.jsx` (use the Login Component artifact)
   - Create `src/components/auth/Signup.jsx` (use the Signup Component artifact)

5. **Update your main App.jsx** (use the Updated App.jsx artifact)

6. **Update your main.jsx to ensure proper rendering:**
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

7. **Start the frontend development server:**
```bash
npm run dev
```

### MongoDB Atlas Setup

1. **Create a MongoDB Atlas account** at https://www.mongodb.com/cloud/atlas

2. **Create a new cluster:**
   - Choose the free tier (M0)
   - Select a region close to you
   - Create the cluster

3. **Set up database access:**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and strong password
   - Grant "Read and write to any database" permissions

4. **Set up network access:**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development, you can click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, add only specific IP addresses

5. **Get your connection string:**
   - Go to "Clusters" and click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with "candle" (or your preferred database name)

## API Endpoints

### Authentication Routes
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Prediction Routes (future expansion)
- `GET /api/predictions` - Get user predictions (protected)
- `POST /api/predictions` - Create new prediction (protected)

### Health Check
- `GET /api/health` - Server health check

## Features Implemented

### Authentication System
- ✅ User registration with validation
- ✅ User login with JWT tokens
- ✅ Password hashing with bcrypt
- ✅ Protected routes
- ✅ Auto-login on app refresh
- ✅ Logout functionality

### Frontend Features
- ✅ Responsive login/signup forms
- ✅ Form validation with real-time feedback
- ✅ Password strength indicator
- ✅ Loading states and error handling
- ✅ Protected dashboard access
- ✅ User context management

### Security Features
- ✅ CORS protection
- ✅ JWT token authentication
- ✅ Password hashing (bcrypt with salt rounds)
- ✅ Input validation
- ✅ Error handling

## Testing the Application

1. **Start both servers:**
   ```bash
   # Terminal 1 - Backend
   cd candle-backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd candle-frontend  # your React app directory
   npm run dev
   ```

2. **Test registration:**
   - Go to http://localhost:5173
   - Click "Sign up"
   - Fill in the form with valid data
   - Should redirect to dashboard after successful registration

3. **Test login:**
   - Click "Sign in" from the registration page
   - Use the credentials you just created
   - Should redirect to dashboard

4. **Test protected routes:**
   - Try accessing the dashboard while logged in
   - Logout and try accessing - should redirect to login

## Troubleshooting

### Common Issues

1. **CORS Error:**
   - Make sure backend is running on port 5000
   - Check that FRONTEND_URL in .env matches your React dev server

2. **MongoDB Connection Error:**
   - Verify your connection string in .env
   - Check that your IP is whitelisted in MongoDB Atlas
   - Ensure database user has correct permissions

3. **JWT Error:**
   - Make sure JWT_SECRET is set in .env
   - Check that token is being stored in localStorage

4. **Port Conflicts:**
   - Backend runs on port 5000
   - Frontend runs on port 5173 (Vite default)
   - Change ports in .env and vite config if needed

### Development Tips

1. **Check backend health:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **View database in MongoDB Atlas:**
   - Go to "Browse Collections" in your cluster
   - You should see a "candle" database with "users" collection

3. **Debug authentication:**
   - Check browser developer tools → Application → Local Storage
   - Should see "token" key when logged in

## Next Steps / Future Features

- [ ] Email verification
- [ ] Password reset functionality
- [ ] User profile management
- [ ] Prediction system implementation
- [ ] Real-time leaderboards
- [ ] Social features
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Advanced analytics

## Security Considerations for Production

1. **Environment Variables:**
   - Use strong, unique JWT_SECRET
   - Never commit .env files
   - Use environment-specific configurations

2. **Database Security:**
   - Restrict IP access to production servers only
   - Use strong database passwords
   - Enable MongoDB Atlas encryption

3. **HTTPS:**
   - Use SSL certificates in production
   - Update CORS settings for production domain

4. **Rate Limiting:**
   - Implement rate limiting on authentication endpoints
   - Add request validation middleware

This setup provides a complete authentication system that's ready for development and can be easily extended with additional features!