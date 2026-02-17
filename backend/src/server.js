import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import sequelize from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

// Import models to ensure they are registered for sync
import './models/Student.js';
import './models/Attendance.js';
import './models/AttendanceRecord.js';
import './models/DailyAttendance.js';
import './models/DailyAttendanceRecord.js';
import './models/Announcement.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://cse1class.app",
    "https://www.cse1class.app"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight for 10 minutes
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/students', studentRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Class Management Backend API is running',
    sqlite: 'Connected'
  });
});

// Sync Database and Start server
sequelize.sync({ force: false }) // use force: true to reset DB during development
  .then(() => {
    console.log('SQLite database synced successfully');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to sync SQLite database:', err);
  });
