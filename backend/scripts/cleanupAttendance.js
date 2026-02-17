import sequelize from "../src/config/database.js";
import Attendance from "../src/models/Attendance.js";
import DailyAttendance from "../src/models/DailyAttendance.js";
import DailyAttendanceRecord from "../src/models/DailyAttendanceRecord.js";

const cleanupAttendance = async () => {
  try {
    await sequelize.sync();
    console.log("✅ SQLite connected and synced");

    console.log("🧹 Cleaning up attendance records...");
    console.log("⚠️  This will delete ALL attendance history.");
    console.log("⚠️  Students will NOT be affected.\n");

    // Delete all attendance summary records
    const attendanceResult = await Attendance.destroy({ where: {} });
    console.log(`✅ Deleted ${attendanceResult} attendance summary records`);

    // Delete all daily attendance records
    await DailyAttendanceRecord.destroy({ where: {} });
    const dailyAttendanceResult = await DailyAttendance.destroy({ where: {} });
    console.log(`✅ Deleted ${dailyAttendanceResult} daily attendance records`);

    console.log("\n✨ Cleanup completed successfully!");
    console.log("✅ All student data preserved!");
    console.log("\n📝 Use this when starting a new semester or fixing attendance errors.");
    console.log("You can now mark fresh attendance for all subjects.");

  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
    process.exit(1);
  } finally {
    console.log("\n🔌 Database session finished");
    process.exit(0);
  }
};

cleanupAttendance();
