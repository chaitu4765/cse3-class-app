import db from '../config/firebase.js';

// Allowed subjects list
const ALLOWED_SUBJECTS = ['ME', 'MP', 'DBMS', 'DAA', 'FLAT'];

const calculatePercentageAndStatus = (attended, total) => {
  if (total <= 0) {
    return { percentage: 0, status: 'Eligible' };
  }
  const percentage = Math.round((attended / total) * 100);
  const status = percentage >= 75 ? 'Eligible' : 'Ineligible';
  return { percentage, status };
};

/**
 * CR Attendance Marking Controller
 * Marks attendance for a specific subject and date
 * Access: CR only (JWT protected)
 */
export const markAttendance = async (req, res) => {
  try {
    const { subject, date, records } = req.body;

    // Validate request body
    if (!subject || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({
        message: 'Subject, date, and records array are required'
      });
    }

    // Validate subject against allowed list
    if (!ALLOWED_SUBJECTS.includes(subject)) {
      return res.status(400).json({
        message: `Invalid subject. Allowed subjects: ${ALLOWED_SUBJECTS.join(', ')}`
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    if (records.length === 0) {
      return res.status(400).json({
        message: 'Records array cannot be empty'
      });
    }

    const dailyAttendanceId = `${date}_${subject}`;
    const dailyAttendanceRef = db.collection('daily_attendance').doc(dailyAttendanceId);
    const dailyAttendanceSnap = await dailyAttendanceRef.get();

    if (dailyAttendanceSnap.exists) {
      // Fetch existing records for this daily attendance
      const recordsSnap = await db.collection('daily_attendance_records')
        .where('dailyAttendanceId', '==', dailyAttendanceId)
        .get();

      // Fetch all students to match names & regNos
      const studentsSnap = await db.collection('students').get();
      const studentMap = {};
      studentsSnap.forEach(doc => {
        studentMap[doc.id] = doc.data();
      });

      const formattedRecords = [];
      recordsSnap.forEach(doc => {
        const rec = doc.data();
        const studentInfo = studentMap[rec.studentId] || {};
        formattedRecords.push({
          studentId: rec.studentId,
          name: studentInfo.name || 'Unknown',
          regNo: studentInfo.regNo || 'Unknown',
          status: rec.status
        });
      });

      const dailyData = dailyAttendanceSnap.data();

      return res.status(409).json({
        message: `Attendance already marked for ${subject} on ${date}`,
        alreadyMarked: true,
        date,
        subject,
        records: formattedRecords,
        markedBy: dailyData.markedBy || 'CR',
        markedAt: dailyData.createdAt
      });
    }

    const now = new Date().toISOString();

    // Create DailyAttendance entry
    await dailyAttendanceRef.set({
      id: dailyAttendanceId,
      date,
      subject,
      markedBy: req.user?.email || 'CR',
      createdAt: now,
      updatedAt: now
    });

    const results = [];
    const errors = [];

    // Fetch all students to check existence and build a map
    const studentsSnap = await db.collection('students').get();
    const studentMap = {};
    studentsSnap.forEach(doc => {
      studentMap[doc.id] = doc.data();
    });

    // Execute updates. We can use batch writes for speed and consistency
    const batch = db.batch();

    for (const record of records) {
      try {
        const { studentId, status } = record;

        if (!studentId) {
          errors.push({ studentId: 'unknown', error: 'Student ID is required' });
          continue;
        }

        if (!status || !['Present', 'Absent'].includes(status)) {
          errors.push({ studentId, error: 'Status must be "Present" or "Absent"' });
          continue;
        }

        const student = studentMap[studentId];
        if (!student) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        // 1. Create DailyAttendanceRecord document
        const dailyRecordId = `${dailyAttendanceId}_${studentId}`;
        const dailyRecordRef = db.collection('daily_attendance_records').doc(dailyRecordId);
        batch.set(dailyRecordRef, {
          id: dailyRecordId,
          dailyAttendanceId,
          studentId,
          status,
          createdAt: now,
          updatedAt: now
        });

        // 2. Fetch/Update Attendance Summary
        const summaryId = `${studentId}_${subject}`;
        const summaryRef = db.collection('attendance').doc(summaryId);
        
        // We will read and perform the calculation. Since batch is commit-only,
        // we'll run transactions or simple reads before batching.
        // For simplicity and correctness with batching, we will fetch summary status.
        // To do this efficiently, let's fetch all summaries for this subject.
      } catch (err) {
        errors.push({ studentId: record.studentId, error: err.message });
      }
    }

    // Rather than single reads, let's fetch all summaries for this subject first to avoid parallel read/write issues.
    const summariesSnap = await db.collection('attendance').where('subject', '==', subject).get();
    const summaryMap = {};
    summariesSnap.forEach(doc => {
      summaryMap[doc.data().studentId] = doc.data();
    });

    for (const record of records) {
      const { studentId, status } = record;
      const student = studentMap[studentId];
      if (!student || !['Present', 'Absent'].includes(status)) continue;

      const dailyRecordId = `${dailyAttendanceId}_${studentId}`;
      const dailyRecordRef = db.collection('daily_attendance_records').doc(dailyRecordId);
      batch.set(dailyRecordRef, {
        id: dailyRecordId,
        dailyAttendanceId,
        studentId,
        status,
        createdAt: now,
        updatedAt: now
      });

      const summaryId = `${studentId}_${subject}`;
      const summaryRef = db.collection('attendance').doc(summaryId);
      const existingSummary = summaryMap[studentId];

      let newAttended = status === 'Present' ? 1 : 0;
      let newTotal = 1;

      if (existingSummary) {
        newAttended = Number(existingSummary.attended || 0) + (status === 'Present' ? 1 : 0);
        newTotal = Number(existingSummary.total || 0) + 1;
      }

      const { percentage, status: eligibilityStatus } = calculatePercentageAndStatus(newAttended, newTotal);

      const summaryData = {
        id: existingSummary?.id || summaryId,
        studentId,
        subject,
        attended: newAttended,
        total: newTotal,
        percentage,
        status: eligibilityStatus,
        createdAt: existingSummary?.createdAt || now,
        updatedAt: now
      };

      batch.set(summaryRef, summaryData);

      results.push({
        studentId,
        regNo: student.regNo,
        name: student.name,
        subject,
        attended: newAttended,
        total: newTotal,
        percentage,
        status: eligibilityStatus
      });
    }

    await batch.commit();

    res.status(200).json({
      message: 'Attendance marking completed',
      subject,
      date,
      processed: results.length,
      errors: errors.length,
      results,
      failedRecords: errors
    });

  } catch (error) {
    console.error('Attendance marking error:', error);
    res.status(500).json({
      message: 'Server error during attendance marking',
      error: error.message
    });
  }
};

/**
 * Update Existing Attendance Controller
 * Updates attendance for a specific subject and date that was already marked
 * Access: CR only (JWT protected)
 */
export const updateAttendance = async (req, res) => {
  try {
    const { subject, date, records } = req.body;

    // Validate request body
    if (!subject || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({
        message: 'Subject, date, and records array are required'
      });
    }

    if (!ALLOWED_SUBJECTS.includes(subject)) {
      return res.status(400).json({
        message: `Invalid subject. Allowed subjects: ${ALLOWED_SUBJECTS.join(', ')}`
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    if (records.length === 0) {
      return res.status(400).json({
        message: 'Records array cannot be empty'
      });
    }

    const dailyAttendanceId = `${date}_${subject}`;
    const dailyAttendanceRef = db.collection('daily_attendance').doc(dailyAttendanceId);
    const dailyAttendanceSnap = await dailyAttendanceRef.get();

    if (!dailyAttendanceSnap.exists) {
      return res.status(404).json({
        message: `No attendance found for ${subject} on ${date}. Please mark attendance first.`
      });
    }

    // Fetch existing records for this daily attendance
    const oldRecordsSnap = await db.collection('daily_attendance_records')
      .where('dailyAttendanceId', '==', dailyAttendanceId)
      .get();

    const oldRecordsMap = new Map();
    oldRecordsSnap.forEach(doc => {
      oldRecordsMap.set(doc.data().studentId, doc.data());
    });

    // Fetch student maps and summary maps
    const studentsSnap = await db.collection('students').get();
    const studentMap = {};
    studentsSnap.forEach(doc => {
      studentMap[doc.id] = doc.data();
    });

    const summariesSnap = await db.collection('attendance').where('subject', '==', subject).get();
    const summaryMap = {};
    summariesSnap.forEach(doc => {
      summaryMap[doc.data().studentId] = doc.data();
    });

    const now = new Date().toISOString();
    const batch = db.batch();
    
    const results = [];
    const errors = [];
    const changedRecords = [];

    for (const record of records) {
      try {
        const { studentId, status } = record;

        if (!studentId) {
          errors.push({ studentId: 'unknown', error: 'Student ID is required' });
          continue;
        }

        if (!status || !['Present', 'Absent'].includes(status)) {
          errors.push({ studentId, error: 'Status must be "Present" or "Absent"' });
          continue;
        }

        const student = studentMap[studentId];
        if (!student) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        const oldRecord = oldRecordsMap.get(studentId);
        const oldStatus = oldRecord ? oldRecord.status : undefined;
        
        const oldStatusStr = String(oldStatus || '').toLowerCase();
        const newStatusStr = String(status || '').toLowerCase();
        const statusChanged = oldStatusStr !== newStatusStr;

        if (statusChanged) {
          changedRecords.push({
            studentId,
            regNo: student.regNo,
            name: student.name,
            oldStatus: oldStatus || 'N/A',
            newStatus: status
          });

          // Update DailyAttendanceRecord
          const dailyRecordId = `${dailyAttendanceId}_${studentId}`;
          const dailyRecordRef = db.collection('daily_attendance_records').doc(dailyRecordId);
          batch.set(dailyRecordRef, {
            id: dailyRecordId,
            dailyAttendanceId,
            studentId,
            status,
            createdAt: oldRecord?.createdAt || now,
            updatedAt: now
          });

          // Update summary record
          const summaryId = `${studentId}_${subject}`;
          const summaryRef = db.collection('attendance').doc(summaryId);
          const existingSummary = summaryMap[studentId];

          let newAttended = existingSummary ? Number(existingSummary.attended || 0) : 0;
          let newTotal = existingSummary ? Number(existingSummary.total || 0) : 0;

          if (!existingSummary) {
            newTotal = 1;
            newAttended = newStatusStr === 'present' ? 1 : 0;
          } else {
            if (oldStatusStr === 'present' && newStatusStr === 'absent') {
              newAttended = Math.max(0, newAttended - 1);
            } else if (oldStatusStr === 'absent' && newStatusStr === 'present') {
              newAttended += 1;
            } else if (oldStatus === undefined) {
              newTotal += 1;
              if (newStatusStr === 'present') newAttended += 1;
            }
          }

          const { percentage, status: eligibilityStatus } = calculatePercentageAndStatus(newAttended, newTotal);

          const updatedSummary = {
            id: existingSummary?.id || summaryId,
            studentId,
            subject,
            attended: newAttended,
            total: newTotal,
            percentage,
            status: eligibilityStatus,
            createdAt: existingSummary?.createdAt || now,
            updatedAt: now
          };

          batch.set(summaryRef, updatedSummary);

          // Update summaryMap in case student has duplicate records in loop
          summaryMap[studentId] = updatedSummary;

          results.push({
            studentId,
            regNo: student.regNo,
            name: student.name,
            subject,
            attended: newAttended,
            total: newTotal,
            percentage,
            status: eligibilityStatus,
            changed: true
          });
        } else {
          // No status change
          const existingSummary = summaryMap[studentId];
          results.push({
            studentId,
            regNo: student.regNo,
            name: student.name,
            subject,
            attended: existingSummary?.attended || 0,
            total: existingSummary?.total || 0,
            percentage: existingSummary?.percentage || 0,
            status: existingSummary?.status || 'N/A',
            changed: false
          });
        }

      } catch (err) {
        errors.push({ studentId: record.studentId, error: err.message });
      }
    }

    await batch.commit();

    res.status(200).json({
      message: 'Attendance updated successfully',
      subject,
      date,
      processed: results.length,
      changed: changedRecords.length,
      errors: errors.length,
      results,
      changedRecords,
      failedRecords: errors
    });

  } catch (error) {
    console.error('Attendance update error:', error);
    res.status(500).json({
      message: 'Server error during attendance update',
      error: error.message
    });
  }
};

/**
 * Get Attendance for Specific Date and Subject
 * Returns attendance records if already marked
 * Access: CR only (JWT protected)
 */
export const getAttendanceForEdit = async (req, res) => {
  try {
    const { date, subject } = req.query;

    if (!date || !subject) {
      return res.status(400).json({
        message: 'Date and subject are required'
      });
    }

    if (!ALLOWED_SUBJECTS.includes(subject)) {
      return res.status(400).json({
        message: `Invalid subject. Allowed subjects: ${ALLOWED_SUBJECTS.join(', ')}`
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const dailyAttendanceId = `${date}_${subject}`;
    const dailyAttendanceSnap = await db.collection('daily_attendance').doc(dailyAttendanceId).get();

    if (!dailyAttendanceSnap.exists) {
      return res.status(200).json({
        alreadyMarked: false,
        date,
        subject,
        records: []
      });
    }

    // Get daily records
    const recordsSnap = await db.collection('daily_attendance_records')
      .where('dailyAttendanceId', '==', dailyAttendanceId)
      .get();

    // Get students to join in-memory
    const studentsSnap = await db.collection('students').get();
    const studentMap = {};
    studentsSnap.forEach(doc => {
      studentMap[doc.id] = doc.data();
    });

    const records = [];
    recordsSnap.forEach(doc => {
      const rec = doc.data();
      const studentInfo = studentMap[rec.studentId] || {};
      records.push({
        studentId: rec.studentId,
        name: studentInfo.name || 'Unknown',
        regNo: studentInfo.regNo || 'Unknown',
        status: rec.status
      });
    });

    // Sort by regNo
    records.sort((a, b) => (a.regNo || '').localeCompare(b.regNo || ''));

    const dailyData = dailyAttendanceSnap.data();

    res.status(200).json({
      alreadyMarked: true,
      date,
      subject,
      records,
      markedBy: dailyData.markedBy || 'CR',
      markedAt: dailyData.createdAt
    });

  } catch (error) {
    console.error('Get attendance for edit error:', error);
    res.status(500).json({
      message: 'Server error while fetching attendance from Firestore'
    });
  }
};

/**
 * Student Attendance Lookup Controller
 * Validates registration number and password, returns student info and attendance
 * Can optionally filter by specific date
 */
export const lookupAttendance = async (req, res) => {
  try {
    const { regNo, password, date } = req.body;

    if (!regNo || !password) {
      return res.status(400).json({
        message: 'Registration number and password are required'
      });
    }

    const normalizedRegNo = regNo.trim().toUpperCase();
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

    const validPassword = student.mobileNumber ?
      password.trim() === student.mobileNumber.trim() :
      password.trim().toUpperCase() === student.regNo.toUpperCase();

    if (!validPassword) {
      return res.status(401).json({
        message: student.mobileNumber
          ? 'Invalid credentials (Mobile Number mismatch)'
          : 'Invalid credentials (RegNo mismatch)'
      });
    }

    // Get overall attendance summaries
    const summariesSnap = await db.collection('attendance')
      .where('studentId', '==', student.id)
      .get();

    const overallAttendance = [];
    summariesSnap.forEach(doc => {
      const data = doc.data();
      overallAttendance.push({
        subject: data.subject,
        attended: data.attended,
        total: data.total,
        percentage: data.percentage,
        status: data.status
      });
    });

    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      // Find all conducted classes on this date
      const dailyConductedSnap = await db.collection('daily_attendance')
        .where('date', '==', date)
        .get();

      if (dailyConductedSnap.empty) {
        return res.status(200).json({
          name: student.name,
          regNo: student.regNo,
          date,
          message: 'No classes conducted on this date',
          subjects: []
        });
      }

      const conductedIds = [];
      const conductedMap = {};
      dailyConductedSnap.forEach(doc => {
        conductedIds.push(doc.id);
        conductedMap[doc.id] = doc.data().subject;
      });

      // Find records for this student on those conducted classes
      const studentDailyRecords = [];
      // Firestore does not easily support multiple OR statements for doc IDs unless we query records
      const dailyRecordsSnap = await db.collection('daily_attendance_records')
        .where('studentId', '==', student.id)
        .get();

      const matchedRecords = [];
      dailyRecordsSnap.forEach(doc => {
        const rec = doc.data();
        if (conductedIds.includes(rec.dailyAttendanceId)) {
          matchedRecords.push({
            subject: conductedMap[rec.dailyAttendanceId],
            status: rec.status
          });
        }
      });

      // Fill in conducteds that have no status marked for the student
      const subjects = [];
      Object.keys(conductedMap).forEach(cId => {
        const subj = conductedMap[cId];
        const record = matchedRecords.find(r => r.subject === subj);
        subjects.push({
          subject: subj,
          status: record ? record.status : 'Not Marked'
        });
      });

      return res.status(200).json({
        name: student.name,
        regNo: student.regNo,
        date,
        subjects,
        overallAttendance
      });
    }

    res.status(200).json({
      name: student.name,
      regNo: student.regNo,
      attendance: overallAttendance
    });

  } catch (error) {
    console.error('Attendance lookup error:', error);
    res.status(500).json({
      message: 'Server error during attendance lookup'
    });
  }
};

/**
 * Get All Attendance Records (CR Only)
 * Returns all students with their attendance records
 * Access: CR only (JWT protected)
 */
export const getAllAttendance = async (req, res) => {
  try {
    const studentsSnap = await db.collection('students').get();
    
    if (studentsSnap.empty) {
      return res.status(200).json({
        count: 0,
        data: [],
        message: 'No students found. Please import students first.'
      });
    }

    const students = [];
    studentsSnap.forEach(doc => {
      students.push({
        id: doc.id,
        regNo: doc.data().regNo,
        name: doc.data().name,
        email: doc.data().email || null
      });
    });

    students.sort((a, b) => (a.regNo || '').localeCompare(b.regNo || ''));

    // Fetch all attendance summaries
    const summariesSnap = await db.collection('attendance').get();
    const attendanceMap = {};
    summariesSnap.forEach(doc => {
      const rec = doc.data();
      if (!attendanceMap[rec.studentId]) {
        attendanceMap[rec.studentId] = [];
      }
      attendanceMap[rec.studentId].push(rec);
    });

    const studentsWithAttendance = students.map(student => {
      const summaryList = attendanceMap[student.id] || [];

      const attendanceArray = ALLOWED_SUBJECTS.map(subject => {
        const match = summaryList.find(s => s.subject === subject);
        return {
          subject,
          attended: match ? Number(match.attended) : 0,
          total: match ? Number(match.total) : 0,
          percentage: match ? Number(match.percentage) : 0,
          status: match ? match.status : 'N/A'
        };
      });

      return {
        _id: student.id,
        id: student.id,
        regNo: student.regNo,
        name: student.name,
        email: student.email,
        attendance: attendanceArray
      };
    });

    res.status(200).json({
      count: studentsWithAttendance.length,
      students: studentsWithAttendance
    });

  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({
      message: 'Server error while fetching attendance records from Firestore',
      error: error.message
    });
  }
};

/**
 * Get Attendance by Date (CR Only)
 * Returns attendance records for a specific date and subject
 * Access: CR only (JWT protected)
 */
export const getAttendanceByDate = async (req, res) => {
  try {
    const { date, subject } = req.query;

    if (!date || !subject) {
      return res.status(400).json({ message: 'Date and subject are required' });
    }

    if (!ALLOWED_SUBJECTS.includes(subject)) {
      return res.status(400).json({ message: 'Invalid subject' });
    }

    const dailyAttendanceId = `${date}_${subject}`;
    const dailyAttendanceSnap = await db.collection('daily_attendance').doc(dailyAttendanceId).get();

    if (!dailyAttendanceSnap.exists) {
      return res.status(200).json({
        date,
        subject,
        message: `No attendance records found for ${subject} on ${date}`,
        data: []
      });
    }

    // Get records
    const recordsSnap = await db.collection('daily_attendance_records')
      .where('dailyAttendanceId', '==', dailyAttendanceId)
      .get();

    const studentsSnap = await db.collection('students').get();
    const studentMap = {};
    studentsSnap.forEach(doc => {
      studentMap[doc.id] = doc.data();
    });

    const summariesSnap = await db.collection('attendance').where('subject', '==', subject).get();
    const summaryMap = {};
    summariesSnap.forEach(doc => {
      summaryMap[doc.data().studentId] = doc.data();
    });

    const data = [];
    recordsSnap.forEach(doc => {
      const rec = doc.data();
      const student = studentMap[rec.studentId];
      if (!student) return;

      const summary = summaryMap[rec.studentId];

      data.push({
        regNo: student.regNo,
        name: student.name,
        subject: subject,
        status: rec.status,
        attended: summary ? Number(summary.attended) : 0,
        total: summary ? Number(summary.total) : 0,
        percentage: summary ? Number(summary.percentage) : 0,
        overallStatus: summary ? summary.status : 'N/A'
      });
    });

    data.sort((a, b) => a.regNo.localeCompare(b.regNo));

    res.status(200).json({
      date,
      subject,
      count: data.length,
      data
    });

  } catch (error) {
    console.error('Get attendance by date error:', error);
    res.status(500).json({
      message: 'Server error while fetching attendance by date from Firestore',
      error: error.message
    });
  }
};

/**
 * Get Attendance Summary by Date Range (CR Only)
 * Returns aggregated attendance for students within a date range
 * Access: CR only (JWT protected)
 */
export const getAttendanceSummary = async (req, res) => {
  try {
    const { fromDate, toDate, subject } = req.query;

    if (!fromDate || !toDate || !subject) {
      return res.status(400).json({ message: 'fromDate, toDate, and subject are required' });
    }

    // Get all students
    const studentsSnap = await db.collection('students').get();
    const students = [];
    studentsSnap.forEach(doc => {
      students.push({
        id: doc.id,
        regNo: doc.data().regNo,
        name: doc.data().name
      });
    });

    students.sort((a, b) => a.regNo.localeCompare(b.regNo));

    // Get all conducted classes in date range
    let dailyQuery = db.collection('daily_attendance')
      .where('date', '>=', fromDate)
      .where('date', '<=', toDate);

    const dailySnap = await dailyQuery.get();
    
    // Filter by subject in JS if not ALL to avoid index issues, or because Firestore doesn't support inequality queries with range filters
    let dailyDocs = [];
    dailySnap.forEach(doc => {
      const data = doc.data();
      if (subject === 'ALL' || data.subject === subject) {
        dailyDocs.push(data);
      }
    });

    if (dailyDocs.length === 0) {
      return res.status(200).json({
        fromDate,
        toDate,
        subject,
        count: 0,
        data: [],
        message: `No attendance records found for ${subject} between ${fromDate} and ${toDate}`
      });
    }

    const conductedIds = dailyDocs.map(d => d.id);

    // Fetch daily records for these conducted class IDs
    // Since "in" query has a limit of 30, we can fetch all daily records and filter in memory if size is small,
    // or batch fetch. Since it is a classroom app, fetching matching records in memory is extremely safe.
    const allRecordsSnap = await db.collection('daily_attendance_records').get();
    const matchedRecords = [];
    allRecordsSnap.forEach(doc => {
      const data = doc.data();
      if (conductedIds.includes(data.dailyAttendanceId)) {
        matchedRecords.push(data);
      }
    });

    // Fetch summaries to get current eligibility status
    const summariesSnap = await db.collection('attendance').get();
    const summaryMap = new Map();
    summariesSnap.forEach(doc => {
      const s = doc.data();
      summaryMap.set(`${s.studentId}|${s.subject}`, s);
    });

    const totalsBySubject = {};
    dailyDocs.forEach(d => {
      totalsBySubject[d.subject] = (totalsBySubject[d.subject] || 0) + 1;
    });

    const attendedByStudentSubject = new Map();
    matchedRecords.forEach(r => {
      if (String(r.status).toLowerCase() !== 'present') return;
      
      // Look up subject of this dailyAttendanceId
      const dailyClass = dailyDocs.find(d => d.id === r.dailyAttendanceId);
      if (!dailyClass) return;

      const key = `${r.studentId}|${dailyClass.subject}`;
      attendedByStudentSubject.set(key, (attendedByStudentSubject.get(key) || 0) + 1);
    });

    const data = [];

    if (subject === 'ALL') {
      for (const student of students) {
        const studentData = {
          regNo: student.regNo,
          name: student.name,
          subjects: {},
          overall: { total: 0, attended: 0, percentage: 0 }
        };

        let totalClassesAll = 0;
        let totalAttendedAll = 0;

        for (const subj of ALLOWED_SUBJECTS) {
          const total = totalsBySubject[subj] || 0;
          const attended = attendedByStudentSubject.get(`${student.id}|${subj}`) || 0;
          const summary = summaryMap.get(`${student.id}|${subj}`);

          studentData.subjects[subj] = {
            total,
            attended,
            percentage: total > 0 ? parseFloat(((attended / total) * 100).toFixed(2)) : 0,
            status: summary ? summary.status : 'N/A'
          };

          totalClassesAll += total;
          totalAttendedAll += attended;
        }

        studentData.overall = {
          total: totalClassesAll,
          attended: totalAttendedAll,
          percentage: totalClassesAll > 0 ? parseFloat(((totalAttendedAll / totalClassesAll) * 100).toFixed(2)) : 0
        };

        data.push(studentData);
      }
    } else {
      const total = totalsBySubject[subject] || 0;

      for (const student of students) {
        const attended = attendedByStudentSubject.get(`${student.id}|${subject}`) || 0;
        const summary = summaryMap.get(`${student.id}|${subject}`);

        data.push({
          regNo: student.regNo,
          name: student.name,
          total,
          attended,
          percentage: total > 0 ? parseFloat(((attended / total) * 100).toFixed(2)) : 0,
          status: summary ? summary.status : 'N/A'
        });
      }
    }

    res.status(200).json({
      fromDate,
      toDate,
      subject,
      count: data.length,
      data
    });

  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ message: 'Server error while calculating summary from Firestore', error: error.message });
  }
};

/**
 * Export Attendance as CSV (CR Only)
 */
export const exportAttendanceCSV = async (req, res) => {
  try {
    const { fromDate, toDate, subject } = req.query;

    const studentsSnap = await db.collection('students').get();
    const students = [];
    studentsSnap.forEach(doc => {
      students.push({ id: doc.id, regNo: doc.data().regNo, name: doc.data().name });
    });
    students.sort((a, b) => a.regNo.localeCompare(b.regNo));

    const dailySnap = await db.collection('daily_attendance')
      .where('date', '>=', fromDate)
      .where('date', '<=', toDate)
      .get();

    const dailyDocs = [];
    dailySnap.forEach(doc => {
      const data = doc.data();
      if (subject === 'ALL' || data.subject === subject) {
        dailyDocs.push(data);
      }
    });

    const conductedIds = dailyDocs.map(d => d.id);
    
    // Fetch records
    const allRecordsSnap = await db.collection('daily_attendance_records').get();
    const matchedRecords = [];
    allRecordsSnap.forEach(doc => {
      const data = doc.data();
      if (conductedIds.includes(data.dailyAttendanceId)) {
        matchedRecords.push(data);
      }
    });

    const summariesSnap = await db.collection('attendance').get();
    const summaryMap = new Map();
    summariesSnap.forEach(doc => {
      const s = doc.data();
      summaryMap.set(`${s.studentId}|${s.subject}`, s);
    });

    let csvContent = '';

    if (subject === 'ALL') {
      const headers = ['RegNo', 'Name'];
      ALLOWED_SUBJECTS.forEach(subj => {
        headers.push(`${subj} Total`, `${subj} Attended`, `${subj} %`, `${subj} Status`);
      });
      headers.push('Overall Total', 'Overall Attended', 'Overall %');
      csvContent += headers.join(',') + '\n';

      for (const student of students) {
        const row = [student.regNo, `"${student.name}"`];
        let totalAll = 0;
        let attAll = 0;

        for (const subj of ALLOWED_SUBJECTS) {
          const days = dailyDocs.filter(da => da.subject === subj);
          const total = days.length;
          
          let att = 0;
          days.forEach(da => {
            const r = matchedRecords.find(rec => rec.dailyAttendanceId === da.id && rec.studentId === student.id);
            if (r && r.status === 'Present') att++;
          });

          const summary = summaryMap.get(`${student.id}|${subj}`);
          row.push(total, att, total > 0 ? ((att / total) * 100).toFixed(2) : '0.00', summary ? summary.status : 'N/A');
          totalAll += total;
          attAll += att;
        }
        row.push(totalAll, attAll, totalAll > 0 ? ((attAll / totalAll) * 100).toFixed(2) : '0.00');
        csvContent += row.join(',') + '\n';
      }
    } else {
      csvContent += 'RegNo,Name,Total,Attended,Percentage,Status\n';
      for (const student of students) {
        const days = dailyDocs.filter(da => da.subject === subject);
        const total = days.length;
        
        let att = 0;
        days.forEach(da => {
          const r = matchedRecords.find(rec => rec.dailyAttendanceId === da.id && rec.studentId === student.id);
          if (r && r.status === 'Present') att++;
        });

        const summary = summaryMap.get(`${student.id}|${subject}`);
        csvContent += `${student.regNo},"${student.name}",${total},${att},${total > 0 ? ((att / total) * 100).toFixed(2) : '0.00'},${summary ? summary.status : 'N/A'}\n`;
      }
    }

    const filename = `attendance_${subject}_${fromDate}_to_${toDate}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Export failed' });
  }
};

/**
 * Reset All Attendance Data (CR Only)
 * Exports all attendance to CSV before deletion
 */
export const resetAttendance = async (req, res) => {
  try {
    // Fetch data for CSV backup
    const studentsSnap = await db.collection('students').get();
    const students = [];
    studentsSnap.forEach(doc => {
      students.push({ id: doc.id, regNo: doc.data().regNo, name: doc.data().name });
    });
    students.sort((a, b) => a.regNo.localeCompare(b.regNo));

    const dailySnap = await db.collection('daily_attendance').get();
    const dailyDocs = [];
    dailySnap.forEach(doc => {
      dailyDocs.push(doc.data());
    });

    const allRecordsSnap = await db.collection('daily_attendance_records').get();
    const allRecords = [];
    allRecordsSnap.forEach(doc => {
      allRecords.push(doc.data());
    });

    const summariesSnap = await db.collection('attendance').get();
    const summaryMap = new Map();
    summariesSnap.forEach(doc => {
      const s = doc.data();
      summaryMap.set(`${s.studentId}|${s.subject}`, s);
    });

    let csvContent = 'RegNo,Name,Subject,Date,Status,Total,Attended,Percentage,EligibilityStatus\n';

    for (const student of students) {
      for (const subject of ALLOWED_SUBJECTS) {
        const subjectDays = dailyDocs.filter(da => da.subject === subject);
        const total = subjectDays.length;
        let attended = 0;

        subjectDays.forEach(da => {
          const record = allRecords.find(rec => rec.dailyAttendanceId === da.id && rec.studentId === student.id);
          if (record && record.status === 'Present') {
            attended++;
          }
        });

        const percentage = total > 0 ? ((attended / total) * 100).toFixed(2) : '0.00';
        const summary = summaryMap.get(`${student.id}|${subject}`);
        const status = summary ? summary.status : 'N/A';

        csvContent += `${student.regNo},"${student.name}",${subject},${total > 0 ? 'Multiple' : 'None'},${total > 0 ? 'Varied' : 'N/A'},${total},${attended},${percentage},${status}\n`;
      }
    }

    const fs = await import('fs');
    const path = await import('path');
    const backupsDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `attendance_backup_${timestamp}.csv`;
    const filepath = path.join(backupsDir, filename);

    fs.writeFileSync(filepath, csvContent);

    // Delete collections using batch (Firestore limits batches to 500 actions)
    const collectionsToClear = ['attendance', 'daily_attendance', 'daily_attendance_records'];
    let deletedCount = { attendance: 0, dailyAttendance: 0, dailyRecords: 0 };

    for (const collName of collectionsToClear) {
      const snap = await db.collection(collName).get();
      if (snap.empty) continue;

      // Delete in chunks of 400
      let batch = db.batch();
      let count = 0;
      for (const doc of snap.docs) {
        batch.delete(doc.ref);
        count++;
        if (count >= 400) {
          await batch.commit();
          batch = db.batch();
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }

      if (collName === 'attendance') deletedCount.attendance = snap.size;
      if (collName === 'daily_attendance') deletedCount.dailyAttendance = snap.size;
      if (collName === 'daily_attendance_records') deletedCount.dailyRecords = snap.size;
    }

    res.status(200).json({
      message: 'All attendance data has been reset successfully',
      backup: {
        filename,
        path: filepath,
        recordsDeleted: {
          attendance: deletedCount.attendance,
          dailyAttendance: deletedCount.dailyAttendance,
          dailyRecords: deletedCount.dailyRecords
        }
      }
    });

  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ message: 'Reset failed', error: error.message });
  }
};
