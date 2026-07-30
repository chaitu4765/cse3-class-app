import db from '../config/firebase.js';

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

    // Find student in Firestore
    console.log('Searching for student with regNo in Firestore:', regNo);
    const normalizedRegNo = regNo.trim().toUpperCase();
    const studentsSnapshot = await db.collection('students')
      .where('regNo', '==', normalizedRegNo)
      .limit(1)
      .get();

    if (studentsSnapshot.empty) {
      console.error('Student not found');
      return res.status(404).json({ message: 'Student not found with registration number: ' + regNo });
    }

    const studentDoc = studentsSnapshot.docs[0];
    const student = { id: studentDoc.id, ...studentDoc.data() };

    console.log('Found student:', student.name, student.id);

    const now = new Date().toISOString();
    const newDocRef = db.collection('leave_requests').doc();

    // Create leave request object
    const leaveData = {
      id: newDocRef.id,
      studentId: student.id,
      studentName: student.name,
      regNo: student.regNo,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      reason: reason.trim(),
      status: 'Pending',
      reviewedAt: null,
      reviewedBy: 'CR',
      createdAt: now,
      updatedAt: now
    };

    console.log('Creating leave request with data in Firestore:', leaveData);

    await newDocRef.set(leaveData);

    console.log('✅ SUCCESS! Saved leave request:', newDocRef.id);

    return res.status(201).json({
      message: 'Leave request submitted successfully',
      leaveRequest: {
        id: leaveData.id,
        studentName: leaveData.studentName,
        regNo: leaveData.regNo,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        reason: leaveData.reason,
        status: leaveData.status
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
 * Access: Public for students (with regNo + Password), CR gets all
 */
export const getLeaveRequests = async (req, res) => {
  try {
    const { regNo, password } = req.query;

    // If regNo and Password provided, return only that student's requests
    if (regNo && password) {
      const normalizedRegNo = regNo.trim().toUpperCase();

      // Find student in Firestore
      const studentsSnapshot = await db.collection('students')
        .where('regNo', '==', normalizedRegNo)
        .limit(1)
        .get();

      if (studentsSnapshot.empty) {
        return res.status(401).json({
          message: 'Invalid credentials'
        });
      }

      const studentDoc = studentsSnapshot.docs[0];
      const student = { id: studentDoc.id, ...studentDoc.data() };

      // Compare password with mobileNumber
      // Fallback to regNo if mobileNumber isn't set
      const validPassword = student.mobileNumber ?
        password.trim() === student.mobileNumber.trim() :
        password.trim().toUpperCase() === student.regNo.toUpperCase();

      if (!validPassword) {
        return res.status(401).json({
          message: 'Invalid credentials'
        });
      }

      // Fetch student's leave requests from Firestore
      const leaveSnapshot = await db.collection('leave_requests')
        .where('studentId', '==', student.id)
        .get();

      const leaveRequests = [];
      leaveSnapshot.forEach(doc => {
        const data = doc.data();
        leaveRequests.push({
          id: data.id || doc.id,
          studentName: data.studentName,
          regNo: data.regNo,
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason,
          status: data.status,
          createdAt: data.createdAt,
          reviewedAt: data.reviewedAt
        });
      });

      // Sort by createdAt desc
      leaveRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.status(200).json({
        count: leaveRequests.length,
        leaveRequests
      });
    }

    // Otherwise, return all leave requests (for CR)
    const leaveSnapshot = await db.collection('leave_requests').get();
    const leaveRequests = [];
    leaveSnapshot.forEach(doc => {
      const data = doc.data();
      leaveRequests.push({
        id: data.id || doc.id,
        studentName: data.studentName,
        regNo: data.regNo,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        status: data.status,
        createdAt: data.createdAt,
        reviewedAt: data.reviewedAt
      });
    });

    // Sort by createdAt desc
    leaveRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.status(200).json({
      count: leaveRequests.length,
      leaveRequests
    });

  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({
      message: 'Server error while fetching leave requests from Firestore'
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

    // Find and update the leave request in Firestore
    const docRef = db.collection('leave_requests').doc(id);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return res.status(404).json({
        message: 'Leave request not found'
      });
    }

    const leaveRequest = docSnapshot.data();

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({
        message: `Leave request has already been ${leaveRequest.status.toLowerCase()}`
      });
    }

    const now = new Date().toISOString();
    await docRef.update({
      status: status,
      reviewedAt: now,
      updatedAt: now
    });

    res.status(200).json({
      message: `Leave request ${status.toLowerCase()} successfully`,
      leaveRequest: {
        id: id,
        studentName: leaveRequest.studentName,
        regNo: leaveRequest.regNo,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        reason: leaveRequest.reason,
        status: status,
        reviewedAt: now
      }
    });

  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({
      message: 'Server error while updating leave status in Firestore'
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

    const docRef = db.collection('leave_requests').doc(id);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return res.status(404).json({
        message: 'Leave request not found'
      });
    }

    await docRef.delete();

    res.status(200).json({
      message: 'Leave request deleted successfully'
    });

  } catch (error) {
    console.error('Delete leave request error:', error);
    res.status(500).json({
      message: 'Server error while deleting leave request in Firestore'
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

    const leaveSnapshot = await db.collection('leave_requests').get();
    const totalCount = leaveSnapshot.size;

    if (totalCount === 0) {
      return res.status(200).json({
        message: 'No leave requests to delete',
        deleted: 0
      });
    }

    // Delete in batches of 500 (Firestore transaction/batch limit is 500)
    const batch = db.batch();
    leaveSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();

    console.log(`✅ Deleted ${totalCount} leave requests`);

    res.status(200).json({
      message: 'All leave requests have been deleted successfully',
      deleted: totalCount
    });

  } catch (error) {
    console.error('❌ Reset all leaves error:', error);
    res.status(500).json({
      message: 'Server error while resetting leave requests in Firestore',
      error: error.message
    });
  }
};
