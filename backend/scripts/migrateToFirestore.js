import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../src/config/database.js';
import Student from '../src/models/Student.js';
import Attendance from '../src/models/Attendance.js';
import DailyAttendance from '../src/models/DailyAttendance.js';
import DailyAttendanceRecord from '../src/models/DailyAttendanceRecord.js';
import LeaveRequest from '../src/models/LeaveRequest.js';
import Announcement from '../src/models/Announcement.js';
import { db } from '../src/config/firebase.js';

async function migrate() {
  console.log('🏁 Starting migration from SQL database to Firestore...');

  try {
    // Sync database schema to ensure everything exists
    await sequelize.authenticate();
    console.log('✅ Connected to SQL Database successfully.');

    // 1. Migrate Students
    console.log('🔄 Migrating Students...');
    const students = await Student.findAll();
    console.log(`Found ${students.length} students to migrate.`);
    
    let studentCount = 0;
    for (const student of students) {
      const data = {
        id: student.id,
        name: student.name,
        regNo: student.regNo,
        dob: student.dob ? student.dob.toISOString() : null,
        email: student.email || null,
        mobileNumber: student.mobileNumber || null,
        createdAt: student.createdAt ? student.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: student.updatedAt ? student.updatedAt.toISOString() : new Date().toISOString(),
      };
      await db.collection('students').doc(student.id).set(data);
      studentCount++;
    }
    console.log(`✅ Successfully migrated ${studentCount} students.`);

    // 2. Migrate Attendance Summaries
    console.log('🔄 Migrating Attendance Summaries...');
    const summaries = await Attendance.findAll();
    console.log(`Found ${summaries.length} attendance summary records.`);
    
    let summaryCount = 0;
    for (const summary of summaries) {
      const docId = `${summary.studentId}_${summary.subject}`;
      const data = {
        id: summary.id,
        studentId: summary.studentId,
        subject: summary.subject,
        attended: Number(summary.attended),
        total: Number(summary.total),
        percentage: Number(summary.percentage),
        status: summary.status || 'Eligible',
        createdAt: summary.createdAt ? summary.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: summary.updatedAt ? summary.updatedAt.toISOString() : new Date().toISOString(),
      };
      await db.collection('attendance').doc(docId).set(data);
      summaryCount++;
    }
    console.log(`✅ Successfully migrated ${summaryCount} attendance summaries.`);

    // 3. Migrate Daily Attendance (Conducted Classes)
    console.log('🔄 Migrating Daily Attendance...');
    const dailyConducted = await DailyAttendance.findAll();
    console.log(`Found ${dailyConducted.length} daily attendance events.`);
    
    let dailyCount = 0;
    for (const daily of dailyConducted) {
      const docId = `${daily.date}_${daily.subject}`;
      const data = {
        id: daily.id,
        date: daily.date,
        subject: daily.subject,
        markedBy: daily.markedBy || 'CR',
        createdAt: daily.createdAt ? daily.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: daily.updatedAt ? daily.updatedAt.toISOString() : new Date().toISOString(),
      };
      await db.collection('daily_attendance').doc(docId).set(data);
      dailyCount++;
    }
    console.log(`✅ Successfully migrated ${dailyCount} daily attendance events.`);

    // 4. Migrate Daily Attendance Records
    console.log('🔄 Migrating Daily Attendance Records...');
    const dailyRecords = await DailyAttendanceRecord.findAll();
    console.log(`Found ${dailyRecords.length} daily attendance records.`);
    
    let recordCount = 0;
    for (const record of dailyRecords) {
      const docId = `${record.dailyAttendanceId}_${record.studentId}`;
      const data = {
        id: record.id,
        dailyAttendanceId: record.dailyAttendanceId,
        studentId: record.studentId,
        status: record.status,
        createdAt: record.createdAt ? record.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: record.updatedAt ? record.updatedAt.toISOString() : new Date().toISOString(),
      };
      await db.collection('daily_attendance_records').doc(docId).set(data);
      recordCount++;
    }
    console.log(`✅ Successfully migrated ${recordCount} daily attendance records.`);

    // 5. Migrate Leave Requests
    console.log('🔄 Migrating Leave Requests...');
    const leaveRequests = await LeaveRequest.findAll();
    console.log(`Found ${leaveRequests.length} leave requests.`);
    
    let leaveCount = 0;
    for (const leave of leaveRequests) {
      const data = {
        id: leave.id,
        studentId: leave.studentId,
        studentName: leave.studentName,
        regNo: leave.regNo,
        startDate: leave.startDate ? leave.startDate.toISOString() : null,
        endDate: leave.endDate ? leave.endDate.toISOString() : null,
        reason: leave.reason,
        status: leave.status || 'Pending',
        reviewedAt: leave.reviewedAt ? leave.reviewedAt.toISOString() : null,
        reviewedBy: leave.reviewedBy || 'CR',
        createdAt: leave.createdAt ? leave.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: leave.updatedAt ? leave.updatedAt.toISOString() : new Date().toISOString(),
      };
      await db.collection('leave_requests').doc(leave.id).set(data);
      leaveCount++;
    }
    console.log(`✅ Successfully migrated ${leaveCount} leave requests.`);

    // 6. Migrate Announcements
    console.log('🔄 Migrating Announcements...');
    const announcements = await Announcement.findAll();
    console.log(`Found ${announcements.length} announcements.`);
    
    let announceCount = 0;
    for (const announce of announcements) {
      const data = {
        id: announce.id,
        title: announce.title,
        message: announce.message,
        createdAt: announce.createdAt ? announce.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: announce.updatedAt ? announce.updatedAt.toISOString() : new Date().toISOString(),
      };
      await db.collection('announcements').doc(announce.id).set(data);
      announceCount++;
    }
    console.log(`✅ Successfully migrated ${announceCount} announcements.`);

    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    process.exit(0);

  } catch (error) {
    console.error('🔥 MIGRATION FAILED:', error);
    process.exit(1);
  }
}

migrate();
