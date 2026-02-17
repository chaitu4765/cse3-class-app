import LeaveRequest from '../models/LeaveRequest.js';
import Student from '../models/Student.js';

/**
 * Create Leave Request Controller
 * Students submit leave requests using only regNo
 * Access: Public (no authentication required)
 */
export const createLeaveRequest = async (req, res) => {
  console.log('\n=== NEW LEAVE REQUEST ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { regNo, startDate, endDate, reason } = req.body;

    // Validate fields
    if (!regNo) {
      console.error('Missing regNo');
      return res.status(400).json({ message: 'Registration number is required' });
    }
    if (!startDate) {
      console.error('Missing startDate');
      return res.status(400).json({ message: 'Start date is required' });
    }
    if (!endDate) {
      console.error('Missing endDate');
      return res.status(400).json({ message: 'End date is required' });
    }
    if (!reason) {
      console.error('Missing reason');
      return res.status(400).json({ message: 'Reason is required' });
    }

    // Find student
    console.log('Searching for student with regNo:', regNo);
    const normalizedRegNo = regNo.trim().toUpperCase();
    const student = await Student.findOne({ where: { regNo: normalizedRegNo } });

    if (!student) {
      console.error('Student not found');
      return res.status(404).json({ message: 'Student not found with registration number: ' + regNo });
    }

    console.log('Found student:', student.name, student.id);

    // Parse dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    console.log('Parsed dates:', { start: startDateObj, end: endDateObj });

    // Create leave request object
    const leaveData = {
      studentId: student.id,
      studentName: student.name,
      regNo: student.regNo,
      startDate: startDateObj,
      endDate: endDateObj,
      reason: reason.trim(),
      status: 'Pending'
    };

    console.log('Creating leave request with data:', leaveData);

    const leaveRequest = await LeaveRequest.create(leaveData);

    console.log('✅ SUCCESS! Saved leave request:', leaveRequest.id);

    return res.status(201).json({
      message: 'Leave request submitted successfully',
      leaveRequest: {
        id: leaveRequest.id,
        studentName: leaveRequest.studentName,
        regNo: leaveRequest.regNo,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        reason: leaveRequest.reason,
        status: leaveRequest.status
      }
    });

  } catch (error) {
    console.error('\n❌ FULL ERROR:');
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);

    return res.status(500).json({
      message: 'Server error: ' + error.message,
      error: error.message
    });
  }
};

/**
 * Get Leave Requests Controller
 * Retrieves all leave requests (CR) or student's own requests (Students)
 * Access: Public for students (with regNo + DOB), CR gets all
 */
export const getLeaveRequests = async (req, res) => {
  try {
    const { regNo, password } = req.query;

    // If regNo and Password provided, return only that student's requests
    if (regNo && password) {
      const normalizedRegNo = regNo.trim().toUpperCase();

      // Validate student
      const student = await Student.findOne({ where: { regNo: normalizedRegNo } });

      if (!student) {
        return res.status(401).json({
          message: 'Invalid credentials'
        });
      }

      // Compare password with mobileNumber (New Requirement)
      // Fallback to regNo if mobileNumber isn't set
      const validPassword = student.mobileNumber ?
        password.trim() === student.mobileNumber.trim() :
        password.trim().toUpperCase() === student.regNo.toUpperCase();

      if (!validPassword) {
        return res.status(401).json({
          message: 'Invalid credentials'
        });
      }

      // Fetch student's leave requests
      const leaveRequests = await LeaveRequest.findAll({
        where: { studentId: student.id },
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'studentName', 'regNo', 'startDate', 'endDate', 'reason', 'status', 'createdAt', 'reviewedAt'],
        raw: true,
      });

      return res.status(200).json({
        count: leaveRequests.length,
        leaveRequests
      });
    }

    // Otherwise, return all leave requests (for CR)
    const leaveRequests = await LeaveRequest.findAll({
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'studentName', 'regNo', 'startDate', 'endDate', 'reason', 'status', 'createdAt', 'reviewedAt'],
      raw: true,
    });

    res.status(200).json({
      count: leaveRequests.length,
      leaveRequests
    });

  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({
      message: 'Server error while fetching leave requests'
    });
  }
};

/**
 * Update Leave Request Status Controller
 * CR approves or rejects leave requests
 * Access: CR only (JWT protected)
 */
export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        message: 'Leave request ID is required'
      });
    }

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Status must be either "Approved" or "Rejected"'
      });
    }

    // Find and update the leave request
    const leaveRequest = await LeaveRequest.findByPk(id);

    if (!leaveRequest) {
      return res.status(404).json({
        message: 'Leave request not found'
      });
    }

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({
        message: `Leave request has already been ${leaveRequest.status.toLowerCase()}`
      });
    }

    leaveRequest.status = status;
    leaveRequest.reviewedAt = new Date();
    await leaveRequest.save();

    res.status(200).json({
      message: `Leave request ${status.toLowerCase()} successfully`,
      leaveRequest: {
        id: leaveRequest.id,
        studentName: leaveRequest.studentName,
        regNo: leaveRequest.regNo,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        reason: leaveRequest.reason,
        status: leaveRequest.status,
        reviewedAt: leaveRequest.reviewedAt
      }
    });

  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({
      message: 'Server error while updating leave status'
    });
  }
};

/**
 * Delete Leave Request Controller
 * CR can delete leave requests
 * Access: CR only (JWT protected)
 */
export const deleteLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: 'Leave request ID is required'
      });
    }

    const deletedCount = await LeaveRequest.destroy({
      where: { id }
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        message: 'Leave request not found'
      });
    }

    res.status(200).json({
      message: 'Leave request deleted successfully'
    });

  } catch (error) {
    console.error('Delete leave request error:', error);
    res.status(500).json({
      message: 'Server error while deleting leave request'
    });
  }
};

/**
 * Reset All Leave Requests Controller
 * Deletes ALL leave requests from the database
 * Access: CR only (JWT protected)
 */
export const resetAllLeaves = async (req, res) => {
  try {
    console.log('\n=== RESETTING ALL LEAVE REQUESTS ===');

    // Delete all leave requests
    const deletedCount = await LeaveRequest.destroy({ where: {} });

    console.log(`✅ Deleted ${deletedCount} leave requests`);

    res.status(200).json({
      message: 'All leave requests have been deleted successfully',
      deleted: deletedCount
    });

  } catch (error) {
    console.error('❌ Reset all leaves error:', error);
    res.status(500).json({
      message: 'Server error while resetting leave requests',
      error: error.message
    });
  }
};
