import express from 'express';
import { createLeaveRequest, getLeaveRequests, updateLeaveStatus, deleteLeaveRequest, resetAllLeaves } from '../controllers/leaveController.js';
import { protectCR } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/leaves
 * @desc    Create a new leave request (Student submits)
 * @access  Public (validates using regNo + DOB)
 */
router.post('/', createLeaveRequest);

/**
 * @route   GET /api/leaves
 * @desc    Get leave requests (All for CR, filtered by regNo+DOB for students)
 * @access  Public (students use query params: ?regNo=XXX&dob=YYYY-MM-DD)
 */
router.get('/', getLeaveRequests);

/**
 * @route   PUT /api/leaves/:id
 * @desc    Update leave request status (Approve/Reject)
 * @access  CR only (JWT protected)
 */
router.put('/:id', protectCR, updateLeaveStatus);

/**
 * @route   DELETE /api/leaves/reset
 * @desc    Delete ALL leave requests (Reset)
 * @access  CR only (JWT protected)
 */
router.delete('/reset', protectCR, resetAllLeaves);

/**
 * @route   DELETE /api/leaves/:id
 * @desc    Delete a leave request
 * @access  CR only (JWT protected)
 */
router.delete('/:id', protectCR, deleteLeaveRequest);

export default router;
