import sequelize from '../src/config/database.js';
import Student from '../src/models/Student.js';
import AttendanceRecord from '../src/models/AttendanceRecord.js';
import DailyAttendanceRecord from '../src/models/DailyAttendanceRecord.js';

const removeStudent = async (regNo) => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const student = await Student.findOne({ where: { regNo } });

        if (!student) {
            console.log(`Student with Registration Number ${regNo} not found.`);
            return;
        }

        console.log(`Found student: ${student.name} (${student.regNo})`);

        // Delete associated records first
        const attendanceDeleted = await AttendanceRecord.destroy({ where: { studentId: student.id } });
        console.log(`Deleted ${attendanceDeleted} attendance records.`);

        const dailyAttendanceDeleted = await DailyAttendanceRecord.destroy({ where: { studentId: student.id } });
        console.log(`Deleted ${dailyAttendanceDeleted} daily attendance records.`);

        // Delete the student
        await student.destroy();
        console.log(`Student ${student.name} deleted successfully.`);

    } catch (error) {
        console.error('Error removing student:', error);
    } finally {
        await sequelize.close();
    }
};

const regNoToRemove = '324506402160';
removeStudent(regNoToRemove);
