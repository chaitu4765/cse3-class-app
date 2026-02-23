import express from 'express';
import { importStudentsFromCSV } from '../controllers/migrationController.js';

const router = express.Router();

/**
 * @route   POST /api/migrate/import-students
 * @desc    Import students from CSV file to database
 * @access  Public (One-time use)
 */
router.post('/import-students', importStudentsFromCSV);

export default router;
