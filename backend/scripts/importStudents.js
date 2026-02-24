import dotenv from 'dotenv';
dotenv.config();

import fs from "fs";
import path from "path";
import csv from "csv-parser";
import sequelize from "../src/config/database.js";
import Student from "../src/models/Student.js";

const csvFilePath = path.join(process.cwd(), "data", "students.csv");

const students = [];

const mapRowToStudent = (row) => {
  const firstName = row['FIRST NAME:'] || row.FirstName || row.firstName;
  const lastName = row['LAST NAME:'] || row.LastName || row.lastName;
  const fullName = row.Name || row.name || [firstName, lastName].filter(Boolean).join(' ').trim();
  const regNo = row.RegNo || row.regNo || row['REISTRATION NO:'];
  const email = row.Email || row.email || row['PERSONAL MAIL ID:'];
  const dobValue = row.DOB || row.dob;
  const mobileNumber = row.MobileNumber || row.mobileNumber || row['MOBILE NUMBER:'];

  if (!fullName || !regNo || !email) {
    return null;
  }

  return {
    name: String(fullName).trim(),
    regNo: String(regNo).trim(),
    dob: dobValue ? new Date(dobValue) : null,
    email: String(email).trim(),
    mobileNumber: mobileNumber ? String(mobileNumber).trim() : null
  };
};

const importStudents = async () => {
  try {
    // Ensure DB is synced
    await sequelize.sync();
    console.log("SQLite connected and synced");

    console.log("\n📋 Reading CSV file...");
    console.log(`📁 CSV Path: ${csvFilePath}`);

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        const student = mapRowToStudent(row);
        if (!student) {
          console.log("⚠️  Skipping invalid row:", row);
          return;
        }

        students.push(student);
      })
      .on("end", async () => {
        console.log(`\n✅ CSV parsing complete. Found ${students.length} students.`);
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
              const existingDobTime = existingStudent.dob ? existingStudent.dob.getTime() : null;
              const incomingDobTime = studentData.dob ? studentData.dob.getTime() : null;
              const dobChanged = existingDobTime !== incomingDobTime;
              const emailChanged = existingStudent.email !== studentData.email;
              const mobileChanged = (existingStudent.mobileNumber || null) !== (studentData.mobileNumber || null);

              if (nameChanged || dobChanged || emailChanged || mobileChanged) {
                // Update existing student
                existingStudent.name = studentData.name;
                existingStudent.dob = studentData.dob;
                existingStudent.email = studentData.email;
                existingStudent.mobileNumber = studentData.mobileNumber;
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
