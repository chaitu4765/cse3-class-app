import sequelize from './src/config/database.js';
import Student from './src/models/Student.js';
import Attendance from './src/models/Attendance.js';
import Announcement from './src/models/Announcement.js';
import DailyAttendance from './src/models/DailyAttendance.js';
import DailyAttendanceRecord from './src/models/DailyAttendanceRecord.js';

// Constants
const ALLOWED_SUBJECTS = ['ME', 'MP', 'DBMS', 'DAA', 'FLAT'];
const START_REG_NO = 324506402160;
const END_REG_NO = 324506402240;
const TOTAL_DAYS = 10;

// Generate student data
const sampleStudents = [];
for (let i = START_REG_NO; i <= END_REG_NO; i++) {
  const regStr = i.toString();
  sampleStudents.push({
    name: `Student ${regStr.slice(-3)}`,
    regNo: regStr,
    dob: new Date("2003-01-01"),
    email: `student${regStr.slice(-3)}@example.com`,
    mobileNumber: `12345${regStr.slice(-5)}`
  });
}

const seedDatabase = async () => {
  try {
    console.log('⏳ Syncing database...');
    // Sync database (force: true will drop tables)
    await sequelize.sync({ force: true });
    console.log('✅ SQLite database synced successfully');

    // Insert students
    const students = await Student.bulkCreate(sampleStudents);
    console.log(`✅ Inserted ${students.length} students`);

    // Generate dates for the last 10 days
    const dates = [];
    const today = new Date();
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (!dates.includes(dateStr)) {
        dates.push(dateStr);
      }
    }
    console.log('📅 Dates to seed:', dates);

    console.log('⏳ Generating daily attendance records...');

    // Store summary counts
    const summaryDataMap = new Map(); // key: studentId-subject, value: { attended, total }

    const dailySessions = [];
    for (const date of dates) {
      for (const subject of ALLOWED_SUBJECTS) {
        dailySessions.push({ date, subject });
      }
    }

    for (const session of dailySessions) {
      console.log(`  Creating session: ${session.date} - ${session.subject}`);
      // Create DailyAttendance entry
      const dailyAttendance = await DailyAttendance.create({
        date: session.date,
        subject: session.subject,
        markedBy: 'CR'
      });

      const dailyRecords = [];
      for (const student of students) {
        // Randomized status (mostly present)
        const status = Math.random() > 0.15 ? 'Present' : 'Absent';

        dailyRecords.push({
          dailyAttendanceId: dailyAttendance.id,
          studentId: student.id,
          status
        });

        // Update summary map
        const key = `${student.id}|${session.subject}`;
        if (!summaryDataMap.has(key)) {
          summaryDataMap.set(key, { attended: 0, total: 0 });
        }
        const summary = summaryDataMap.get(key);
        summary.total += 1;
        if (status === 'Present') {
          summary.attended += 1;
        }
      }
      await DailyAttendanceRecord.bulkCreate(dailyRecords);
    }

    console.log(`✅ Inserted ${dailySessions.length} daily attendance sessions`);

    // Insert summary attendance records
    const summaryRecords = [];
    for (const [key, value] of summaryDataMap.entries()) {
      const [studentId, subject] = key.split('|');
      summaryRecords.push({
        studentId,
        subject,
        attended: value.attended,
        total: value.total
      });
    }

    await Attendance.bulkCreate(summaryRecords, { individualHooks: true });
    console.log(`✅ Inserted ${summaryRecords.length} attendance summary records`);

    // Add a sample announcement
    await Announcement.create({
      title: "Welcome to Class App",
      message: "The application is now running on SQLite with complete seeded data!"
    });

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    if (error.errors) {
      error.errors.forEach(err => console.error(`  - ${err.message}`));
    }
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
