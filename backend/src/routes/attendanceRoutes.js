import express from 'express';
import { 
  lookupAttendance, 
  markAttendance,
  updateAttendance,
  getAttendanceForEdit,
  getAllAttendance, 
  getAttendanceByDate,
  getAttendanceSummary,
  exportAttendanceCSV,
  resetAttendance
} from '../controllers/attendanceController.js';
import { protectCR } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/attendance/mark
 * @desc    Mark attendance for a subject (CR only)
 * @access  CR only (JWT protected)
 */
router.post('/mark', protectCR, markAttendance);

/**
 * @route   PUT /api/attendance/update
 * @desc    Update existing attendance for a subject (CR only)
 * @access  CR only (JWT protected)
 */
router.put('/update', protectCR, updateAttendance);

/**
 * @route   GET /api/attendance/for-edit
 * @desc    Get attendance for a specific date and subject to edit (CR only)
 * @access  CR only (JWT protected)
 * @query   date (required, YYYY-MM-DD), subject (required, ME/MP/DBMS/DAA/FLAT)
 */
router.get('/for-edit', protectCR, getAttendanceForEdit);

/**
 * @route   GET /api/attendance/all
 * @desc    Get all students attendance records (CR only)
 * @access  CR only (JWT protected)
 */
router.get('/all', protectCR, getAllAttendance);

/**
 * @route   GET /api/attendance/by-date
 * @desc    Get attendance records by date with optional subject filter (CR only)
 * @access  CR only (JWT protected)
 * @query   date (required, YYYY-MM-DD), subject (optional, ME/MP/DBMS/DAA/FLAT)
 */
router.get('/by-date', protectCR, getAttendanceByDate);

/**
 * @route   GET /api/attendance/summary
 * @desc    Get aggregated attendance summary by date range (CR only)
 * @access  CR only (JWT protected)
 * @query   fromDate (required, YYYY-MM-DD), toDate (required, YYYY-MM-DD), subject (required, specific or "ALL")
 */
router.get('/summary', protectCR, getAttendanceSummary);

/**
 * @route   GET /api/attendance/export
 * @desc    Export attendance as CSV file (CR only)
 * @access  CR only (JWT protected)
 * @query   fromDate (required), toDate (required), subject (required), format=csv
 */
router.get('/export', protectCR, exportAttendanceCSV);

/**
 * @route   DELETE /api/attendance/reset
 * @desc    Reset all attendance data (testing only, CR only)
 * @access  CR only (JWT protected)
 * @warning Deletes all attendance and dailyattendances documents
 */
router.delete('/reset', protectCR, resetAttendance);

/**
 * @route   POST /api/attendance/lookup
 * @desc    Student attendance lookup using regNo and DOB
 * @access  Public (read-only, no authentication)
 */
router.post('/lookup', lookupAttendance);

export default router;
