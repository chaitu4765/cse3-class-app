import express from 'express';
import { createAnnouncement, getAnnouncements, deleteAnnouncement } from '../controllers/announcementController.js';
import { protectCR } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/announcements
 * @desc    Create a new announcement
 * @access  CR only (JWT protected)
 */
router.post('/', protectCR, createAnnouncement);

/**
 * @route   GET /api/announcements
 * @desc    Get all announcements
 * @access  Public (students can view)
 */
router.get('/', getAnnouncements);

/**
 * @route   DELETE /api/announcements/:id
 * @desc    Delete an announcement
 * @access  CR only (JWT protected)
 */
router.delete('/:id', protectCR, deleteAnnouncement);

export default router;
