import { Op } from 'sequelize';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import DailyAttendance from '../models/DailyAttendance.js';
import DailyAttendanceRecord from '../models/DailyAttendanceRecord.js';

// Allowed subjects list
const ALLOWED_SUBJECTS = ['ME', 'MP', 'DBMS', 'DAA', 'FLAT'];

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

    // Validate records array
    if (records.length === 0) {
      return res.status(400).json({
        message: 'Records array cannot be empty'
      });
    }

    // Check if attendance already exists for this date + subject
    const existingAttendance = await DailyAttendance.findOne({
      where: { date, subject },
      include: [{
        model: DailyAttendanceRecord,
        as: 'records',
        include: [{ model: Student, attributes: ['id', 'name', 'regNo'] }]
      }]
    });

    if (existingAttendance) {
      // Return existing attendance data for edit mode
      const formattedRecords = existingAttendance.records.map(record => ({
        studentId: record.Student.id,
        name: record.Student.name,
        regNo: record.Student.regNo,
        status: record.status
      }));

      return res.status(409).json({
        message: `Attendance already marked for ${subject} on ${date}`,
        alreadyMarked: true,
        date,
        subject,
        records: formattedRecords,
        markedBy: existingAttendance.markedBy,
        markedAt: existingAttendance.createdAt
      });
    }

    // Create DailyAttendance entry
    const dailyAttendance = await DailyAttendance.create({
      date,
      subject,
      markedBy: req.user?.email || 'CR'
    });

    // Process each student record
    const results = [];
    const errors = [];

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

        // Verify student exists
        const student = await Student.findByPk(studentId);
        if (!student) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        // Create DailyAttendanceRecord
        await DailyAttendanceRecord.create({
          dailyAttendanceId: dailyAttendance.id,
          studentId,
          status
        });

        // Find or create attendance summary for this student and subject
        let attendanceRecord = await Attendance.findOne({
          where: { studentId, subject }
        });

        if (!attendanceRecord) {
          // Create new attendance record
          attendanceRecord = await Attendance.create({
            studentId,
            subject,
            attended: String(status).toLowerCase() === 'present' ? 1 : 0,
            total: 1
          });
        } else {
          // Update existing record
          attendanceRecord.total += 1;
          if (String(status).toLowerCase() === 'present') {
            attendanceRecord.attended += 1;
          }
          await attendanceRecord.save();
        }

        results.push({
          studentId,
          regNo: student.regNo,
          name: student.name,
          subject,
          attended: attendanceRecord.attended,
          total: attendanceRecord.total,
          percentage: attendanceRecord.percentage,
          status: attendanceRecord.status
        });

      } catch (error) {
        console.error(`Error processing student ${record.studentId}:`, error);
        errors.push({
          studentId: record.studentId,
          error: error.message || 'Failed to update attendance'
        });
      }
    }

    // Send response
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

    // Validate records array
    if (records.length === 0) {
      return res.status(400).json({
        message: 'Records array cannot be empty'
      });
    }

    // Check if attendance exists for this date + subject
    const existingDailyAttendance = await DailyAttendance.findOne({
      where: { date, subject },
      include: [{ model: DailyAttendanceRecord, as: 'records' }]
    });

    if (!existingDailyAttendance) {
      return res.status(404).json({
        message: `No attendance found for ${subject} on ${date}. Please mark attendance first.`
      });
    }

    // Create a map of old records for comparison
    const oldRecordsMap = new Map();
    existingDailyAttendance.records.forEach(record => {
      oldRecordsMap.set(record.studentId, record.status);
    });

    // Process each student record
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

        // Verify student exists
        const student = await Student.findByPk(studentId);
        if (!student) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        // Check if status changed
        const oldStatusStr = String(oldStatus || '').toLowerCase();
        const newStatusStr = String(status || '').toLowerCase();
        const statusChanged = oldStatusStr !== newStatusStr;

        if (statusChanged) {
          changedRecords.push({
            studentId,
            regNo: student.regNo,
            name: student.name,
            oldStatus,
            newStatus: status
          });

          // Update DailyAttendanceRecord
          let dailyRecord = await DailyAttendanceRecord.findOne({
            where: { dailyAttendanceId: existingDailyAttendance.id, studentId }
          });

          if (dailyRecord) {
            dailyRecord.status = status;
            await dailyRecord.save();
          } else {
            // Case where a record might have been missing
            await DailyAttendanceRecord.create({
              dailyAttendanceId: existingDailyAttendance.id,
              studentId,
              status
            });
          }

          // Find and update attendance summary for this student and subject
          let attendanceRecord = await Attendance.findOne({
            where: { studentId, subject }
          });

          if (!attendanceRecord) {
            attendanceRecord = await Attendance.create({
              studentId,
              subject,
              attended: newStatusStr === 'present' ? 1 : 0,
              total: 1
            });
          } else {
            // Update the record based on status change
            if (oldStatusStr === 'present' && newStatusStr === 'absent') {
              attendanceRecord.attended = Math.max(0, attendanceRecord.attended - 1);
            } else if (oldStatusStr === 'absent' && newStatusStr === 'present') {
              attendanceRecord.attended += 1;
            } else if (oldStatus === undefined) {
              // If it was missing from daily records but exists in summary, increment total
              attendanceRecord.total += 1;
              if (newStatusStr === 'present') attendanceRecord.attended += 1;
            }
            await attendanceRecord.save();
          }

          results.push({
            studentId,
            regNo: student.regNo,
            name: student.name,
            subject,
            attended: attendanceRecord.attended,
            total: attendanceRecord.total,
            percentage: attendanceRecord.percentage,
            status: attendanceRecord.status,
            changed: true
          });
        } else {
          // No change, but include in results
          const attendanceRecord = await Attendance.findOne({ where: { studentId, subject } });
          results.push({
            studentId,
            regNo: student.regNo,
            name: student.name,
            subject,
            attended: attendanceRecord?.attended || 0,
            total: attendanceRecord?.total || 0,
            percentage: attendanceRecord?.percentage || 0,
            status: attendanceRecord?.status || 'N/A',
            changed: false
          });
        }

      } catch (error) {
        console.error(`Error processing student ${record.studentId}:`, error);
        errors.push({
          studentId: record.studentId,
          error: error.message || 'Failed to update attendance'
        });
      }
    }

    // Send response
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

    // Validate query parameters
    if (!date || !subject) {
      return res.status(400).json({
        message: 'Date and subject are required'
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

    // Find existing attendance
    const existingAttendance = await DailyAttendance.findOne({
      where: { date, subject },
      include: [{
        model: DailyAttendanceRecord,
        as: 'records',
        include: [{ model: Student, attributes: ['id', 'name', 'regNo'] }]
      }]
    });

    if (!existingAttendance) {
      return res.status(404).json({
        message: 'No attendance found for this date and subject',
        alreadyMarked: false
      });
    }

    // Format the response
    const records = existingAttendance.records.map(record => ({
      studentId: record.Student.id,
      name: record.Student.name,
      regNo: record.Student.regNo,
      status: record.status
    }));

    res.status(200).json({
      alreadyMarked: true,
      date,
      subject,
      records,
      markedBy: existingAttendance.markedBy,
      markedAt: existingAttendance.createdAt
    });

  } catch (error) {
    console.error('Get attendance for edit error:', error);
    res.status(500).json({
      message: 'Server error while fetching attendance'
    });
  }
};

/**
 * Student Attendance Lookup Controller
 * Validates registration number and DOB, returns student info and attendance
 * Can optionally filter by specific date
 * This is NOT authentication - it's a read-only lookup
 */
export const lookupAttendance = async (req, res) => {
  try {
    const { regNo, password, date } = req.body;

    // Validate request body
    if (!regNo || !password) {
      return res.status(400).json({
        message: 'Registration number and password are required'
      });
    }

    // Normalize regNo
    const normalizedRegNo = regNo.trim().toUpperCase();

    // Find student ONLY by registration number
    const student = await Student.findOne({ where: { regNo: normalizedRegNo } });

    if (!student) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }


    // Compare password with mobileNumber (New Requirement)
    // Fallback to regNo if mobileNumber isn't set (for legacy/unpopulated data)
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

    // If date is provided, return date-specific attendance
    if (date) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      // Get all subjects conducted on this date
      const dailyAttendances = await DailyAttendance.findAll({
        where: { date },
        include: [{
          model: DailyAttendanceRecord,
          as: 'records',
          where: { studentId: student.id },
          required: false
        }]
      });

      if (dailyAttendances.length === 0) {
        return res.status(200).json({
          name: student.name,
          regNo: student.regNo,
          date,
          message: 'No classes conducted on this date',
          subjects: []
        });
      }

      // Extract this student's attendance for the date
      const subjects = dailyAttendances.map(dailyAtt => {
        const record = dailyAtt.records && dailyAtt.records[0];
        return {
          subject: dailyAtt.subject,
          status: record ? record.status : 'Not Marked'
        };
      });

      // Get overall attendance summary
      const attendanceSummary = await Attendance.findAll({
        where: { studentId: student.id },
        attributes: ['subject', 'attended', 'total', 'percentage', 'status'],
        raw: true,
      });

      return res.status(200).json({
        name: student.name,
        regNo: student.regNo,
        date,
        subjects,
        overallAttendance: attendanceSummary
      });
    }

    // Default: return overall attendance summary
    const attendanceRecords = await Attendance.findAll({
      where: { studentId: student.id },
      attributes: ['subject', 'attended', 'total', 'percentage', 'status'],
      raw: true,
    });

    // Send response
    res.status(200).json({
      name: student.name,
      regNo: student.regNo,
      attendance: attendanceRecords
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
    // Get all students
    const students = await Student.findAll({
      attributes: ['id', 'name', 'regNo', 'email'],
      order: [['regNo', 'ASC']],
      raw: true,
    });

    if (students.length === 0) {
      return res.status(200).json({
        count: 0,
        data: [],
        message: 'No students found. Please import students first.'
      });
    }

    // Get all attendance summary records
    const attendanceRecords = await Attendance.findAll({ raw: true });

    // Build a map of attendance by studentId
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      const sId = record.studentId;
      if (!attendanceMap[sId]) {
        attendanceMap[sId] = [];
      }
      attendanceMap[sId].push(record);
    });

    // Combine students with their attendance
    const studentsWithAttendance = students.map(student => {
      const studentId = student.id;
      const attendance = attendanceMap[studentId] || [];

      const attendanceArray = ALLOWED_SUBJECTS.map(subject => {
        const subjectAttendance = attendance.find(a => a.subject === subject);
        return {
          subject,
          attended: subjectAttendance ? subjectAttendance.attended : 0,
          total: subjectAttendance ? subjectAttendance.total : 0,
          percentage: subjectAttendance ? subjectAttendance.percentage : 0,
          status: subjectAttendance ? subjectAttendance.status : 'N/A'
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
      message: 'Server error while fetching attendance records',
      error: error.message
    });
  }
};

/**
 * Get Attendance by Date (CR Only)
 * Returns attendance records for a specific date and subject
 * Shows all students with their attendance status for that day
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

    const dailyAttendance = await DailyAttendance.findOne({
      where: { date, subject },
      include: [{
        model: DailyAttendanceRecord,
        as: 'records',
        include: [{ model: Student, attributes: ['id', 'regNo', 'name', 'email'] }]
      }]
    });

    if (!dailyAttendance) {
      return res.status(200).json({
        date,
        subject,
        message: `No attendance records found for ${subject} on ${date}`,
        data: []
      });
    }

    const data = [];
    for (const record of dailyAttendance.records) {
      // Get overall summary for this subject
      const summary = await Attendance.findOne({
        where: { studentId: record.studentId, subject }
      });

      data.push({
        regNo: record.Student.regNo,
        name: record.Student.name,
        subject: subject,
        status: record.status,
        attended: summary ? summary.attended : 0,
        total: summary ? summary.total : 0,
        percentage: summary ? summary.percentage : 0,
        overallStatus: summary ? summary.status : 'N/A'
      });
    }

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
      message: 'Server error while fetching attendance by date',
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

    const students = await Student.findAll({ order: [['regNo', 'ASC']], raw: true });

    // Find daily records in range
    const dailyQuery = {
      date: { [Op.between]: [fromDate, toDate] }
    };
    if (subject !== 'ALL') {
      dailyQuery.subject = subject;
    }

    const dailyAttendances = await DailyAttendance.findAll({
      where: dailyQuery,
      include: [{ model: DailyAttendanceRecord, as: 'records' }]
    });

    if (dailyAttendances.length === 0) {
      return res.status(200).json({
        fromDate,
        toDate,
        subject,
        count: 0,
        data: [],
        message: `No attendance records found for ${subject} between ${fromDate} and ${toDate}`
      });
    }

    const data = [];

    const studentIds = students.map(student => student.id);
    const attendanceWhere = { studentId: studentIds };
    if (subject !== 'ALL') {
      attendanceWhere.subject = subject;
    }

    const summaries = await Attendance.findAll({ where: attendanceWhere, raw: true });
    const summaryMap = new Map();
    summaries.forEach(summary => {
      summaryMap.set(`${summary.studentId}|${summary.subject}`, summary);
    });

    const totalsBySubject = {};
    const attendedByStudentSubject = new Map();

    for (const dailyAttendance of dailyAttendances) {
      const subj = dailyAttendance.subject;
      totalsBySubject[subj] = (totalsBySubject[subj] || 0) + 1;

      (dailyAttendance.records || []).forEach(record => {
        if (String(record.status).toLowerCase() !== 'present') {
          return;
        }

        const key = `${record.studentId}|${subj}`;
        attendedByStudentSubject.set(key, (attendedByStudentSubject.get(key) || 0) + 1);
      });
    }

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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Export Attendance as CSV (CR Only)
 */
export const exportAttendanceCSV = async (req, res) => {
  try {
    const { fromDate, toDate, subject } = req.query;

    const students = await Student.findAll({ order: [['regNo', 'ASC']] });
    const dailyQuery = { date: { [Op.between]: [fromDate, toDate] } };
    if (subject !== 'ALL') dailyQuery.subject = subject;

    const dailyAttendances = await DailyAttendance.findAll({
      where: dailyQuery,
      include: [{ model: DailyAttendanceRecord, as: 'records' }]
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
          const days = dailyAttendances.filter(da => da.subject === subj);
          const total = days.length;
          let att = 0;
          days.forEach(da => {
            const r = da.records.find(rec => rec.studentId === student.id);
            if (r && r.status === 'Present') att++;
          });
          const summary = await Attendance.findOne({ where: { studentId: student.id, subject: subj } });
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
        const days = dailyAttendances.filter(da => da.subject === subject);
        const total = days.length;
        let att = 0;
        days.forEach(da => {
          const r = da.records.find(rec => rec.studentId === student.id);
          if (r && r.status === 'Present') att++;
        });
        const summary = await Attendance.findOne({ where: { studentId: student.id, subject } });
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
    // Step 1: Fetch all data for CSV export
    const students = await Student.findAll({ order: [['regNo', 'ASC']] });
    const dailyAttendances = await DailyAttendance.findAll({
      include: [{ model: DailyAttendanceRecord, as: 'records' }],
      order: [['date', 'ASC']]
    });

    // Step 2: Generate CSV content
    let csvContent = 'RegNo,Name,Subject,Date,Status,Total,Attended,Percentage,EligibilityStatus\n';

    for (const student of students) {
      for (const subject of ALLOWED_SUBJECTS) {
        const subjectDays = dailyAttendances.filter(da => da.subject === subject);
        const total = subjectDays.length;
        let attended = 0;

        subjectDays.forEach(da => {
          const record = da.records.find(rec => rec.studentId === student.id);
          if (record && record.status === 'Present') {
            attended++;
          }
        });

        const percentage = total > 0 ? ((attended / total) * 100).toFixed(2) : '0.00';
        const summary = await Attendance.findOne({ where: { studentId: student.id, subject } });
        const status = summary ? summary.status : 'N/A';

        // Add row for each subject
        csvContent += `${student.regNo},"${student.name}",${subject},${total > 0 ? 'Multiple' : 'None'},${total > 0 ? 'Varied' : 'N/A'},${total},${attended},${percentage},${status}\n`;
      }
    }

    // Step 3: Create backups directory if it doesn't exist
    const fs = await import('fs');
    const path = await import('path');
    const backupsDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Step 4: Save CSV with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `attendance_backup_${timestamp}.csv`;
    const filepath = path.join(backupsDir, filename);

    fs.writeFileSync(filepath, csvContent);

    // Step 5: Delete all attendance data
    const deletedAttendance = await Attendance.destroy({ where: {} });
    const deletedDailyRecords = await DailyAttendanceRecord.destroy({ where: {} });
    const deletedDaily = await DailyAttendance.destroy({ where: {} });

    res.status(200).json({
      message: 'All attendance data has been reset successfully',
      backup: {
        filename,
        path: filepath,
        recordsDeleted: {
          attendance: deletedAttendance,
          dailyAttendance: deletedDaily,
          dailyRecords: deletedDailyRecords
        }
      }
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ message: 'Reset failed', error: error.message });
  }
};
