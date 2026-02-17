import fs from "fs";
import path from "path";
import csv from "csv-parser";
import sequelize from "../src/config/database.js";
import Student from "../src/models/Student.js";

const csvFilePath = path.join(process.cwd(), "data", "students.csv");

const students = [];

const importStudents = async () => {
  try {
    // Ensure DB is synced
    await sequelize.sync();
    console.log("SQLite connected and synced");

    console.log("\n📋 Reading CSV file...");

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        if (!row.Name || !row.RegNo || !row.DOB || !row.Email) {
          return;
        }

        students.push({
          name: row.Name.trim(),
          regNo: row.RegNo.trim(),
          dob: new Date(row.DOB),
          email: row.Email.trim()
        });
      })
      .on("end", async () => {
        try {
          let newCount = 0;
          let updatedCount = 0;
          let unchangedCount = 0;

          // Process each student - update if exists, create if new
          for (const studentData of students) {
            const existingStudent = await Student.findOne({ where: { regNo: studentData.regNo } });

            if (existingStudent) {
              // Check if any data changed
              const nameChanged = existingStudent.name !== studentData.name;
              const dobChanged = existingStudent.dob?.getTime() !== studentData.dob.getTime();
              const emailChanged = existingStudent.email !== studentData.email;

              if (nameChanged || dobChanged || emailChanged) {
                // Update existing student
                existingStudent.name = studentData.name;
                existingStudent.dob = studentData.dob;
                existingStudent.email = studentData.email;
                await existingStudent.save();
                updatedCount++;
              } else {
                unchangedCount++;
              }
            } else {
              // Create new student
              await Student.create(studentData);
              newCount++;
            }
          }

          console.log(`\n✅ Import completed successfully!`);
          console.log(`   📊 New students: ${newCount}`);
          console.log(`   🔄 Updated students: ${updatedCount}`);
          console.log(`   ✓  Unchanged students: ${unchangedCount}`);
          console.log(`   📝 Total in CSV: ${students.length}`);
          console.log("\n✨ Database updated!");
        } catch (error) {
          console.error("❌ Import failed:", error.message);
          process.exit(1);
        } finally {
          console.log("\n🔌 Import session finished");
          process.exit(0);
        }
      })
      .on("error", (error) => {
        console.error("❌ CSV read failed:", error.message);
        process.exit(1);
      });
  } catch (error) {
    console.error("❌ Import failed:", error.message);
    process.exit(1);
  }
};

importStudents();
