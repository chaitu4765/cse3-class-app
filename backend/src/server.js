import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import db from './config/firebase.js';
import authRoutes from './routes/authRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import migrationRoutes from './routes/migrationRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200,
  maxAge: 86400
};

// Apply CORS to all routes
app.use(cors(corsOptions));
// Handle preflight for all routes
app.options('*', cors(corsOptions));

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

app.use('/api/leaves', leaveRoutes);
app.use('/leaves', leaveRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Check Firestore connection
    await db.collection('students').limit(1).get();
    res.json({
      status: 'ok',
      database: 'Firestore',
      env: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'Firestore Connection Failed',
      error: error.message
    });
  }
});

// Debug DB - Check student count in Firestore
app.get('/api/debug-db', async (req, res) => {
  try {
    const countSnapshot = await db.collection('students').count().get();
    const count = countSnapshot.data().count;
    res.json({
      status: 'connected',
      studentCount: count,
      database: 'Firestore'
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
    message: 'Class Management Backend API is running on Firebase Firestore',
    database: 'Connected (Firestore)'
  });
});

// For Vercel, we export the app
export default app;

// Only start the server if we're not running as a Vercel serverless function or Firebase Function
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running locally on port ${PORT}`);
  });
}
