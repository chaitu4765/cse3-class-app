import express from 'express';
import { getAllStudents, getStudentsCount } from '../controllers/studentController.js';
import { protectCR } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/students/count
 * @desc    Get count of all students
 * @access  Public (read-only)
 */
router.get('/count', getStudentsCount);

/**
 * @route   GET /api/students
 * @desc    Get all students
 * @access  CR only (JWT protected)
 */
router.get('/', protectCR, getAllStudents);

export default router;
