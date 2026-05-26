const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load our .env file variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Allow requests from the React frontend (CORS)
app.use(cors());

// So we can read JSON data from request body
app.use(express.json());

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'Leave Management API is running!' });
});

// Load routes
const authRoutes = require('./routes/auth-routes');
const leaveRoutes = require('./routes/leave-routes');

app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);

// Handle unexpected errors so server doesn't crash
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
