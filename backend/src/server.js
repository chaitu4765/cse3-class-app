import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import sequelize from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import migrationRoutes from './routes/migrationRoutes.js';

// Import models to ensure they are registered for sync
import Student from './models/Student.js';
import './models/Attendance.js';
import './models/AttendanceRecord.js';
import './models/DailyAttendance.js';
import './models/DailyAttendanceRecord.js';
import './models/Announcement.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Diagnostics
console.log('--- Production Diagnostics ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL Present:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET Present:', !!process.env.JWT_SECRET);
console.log('CR_EMAIL Present:', !!process.env.CR_EMAIL);
console.log('------------------------------');

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'https://cse3-class-app.vercel.app',
  'https://cse3-class-app-production.up.railway.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (Object.keys(req.body).length > 0) {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '***';
    console.log('Body:', safeBody);
  }
  next();
});

// Routes - Mount both with and without /api to handle Vercel's varying prefix behavior
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/attendance', attendanceRoutes);
app.use('/attendance', attendanceRoutes);

app.use('/api/announcements', announcementRoutes);
app.use('/announcements', announcementRoutes);

app.use('/api/students', studentRoutes);
app.use('/students', studentRoutes);

app.use('/api/migrate', migrationRoutes);
app.use('/migrate', migrationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: process.env.DATABASE_URL ? 'Postgres' : 'SQLite',
    env: process.env.NODE_ENV
  });
});

// Debug DB - Check student count
app.get('/api/debug-db', async (req, res) => {
  try {
    const count = await Student.count();
    res.json({
      status: 'connected',
      studentCount: count,
      database: process.env.DATABASE_URL ? 'Postgres' : 'SQLite'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Class Management Backend API is running',
    database: process.env.DATABASE_URL ? 'Connected (Postgres)' : 'Connected (SQLite)'
  });
});

// For Vercel, we export the app
export default app;

// Only start the server if we're not running as a Vercel serverless function
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  console.log('🔄 Attempting to sync database...');
  sequelize.sync({ force: false })
    .then(() => {
      console.log('✅ Database synced successfully');
      app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ Database Sync Error:', err.message);
      if (err.parent) console.error('  Parent Error:', err.parent.message);
      console.error('  Dialect:', sequelize.getDialect());
      if (process.env.DATABASE_URL) {
        console.error('  DATABASE_URL is present');
      } else {
        console.error('  DATABASE_URL is missing! Falling back to SQLite.');
      }
    });
}
