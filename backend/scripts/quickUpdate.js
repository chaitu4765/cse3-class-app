import dotenv from 'dotenv';
dotenv.config();

import fs from "fs";
import csv from "csv-parser";
import sequelize from "../src/config/database.js";
import Student from "../src/models/Student.js";

const csvFilePath = "./data/students.csv";

const updateStudentsFromCSV = async () => {
  try {
    console.log("⏳ Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Database connected\n");

    const students = [];

    // Read CSV  
    console.log("📋 Reading CSV file...");
    const stream = fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        const firstName = (row['FIRST NAME:'] || '').trim();
        const lastName = (row['LAST NAME:'] || '').trim();
        const name = `${firstName} ${lastName}`.trim();
        const regNo = (row['REISTRATION NO:'] || '').trim();
        const mobileNumber = (row['MOBILE NUMBER:'] || '').trim();
        const email = (row['PERSONAL MAIL ID:'] || '').trim();
        
        if (regNo && name && email) {
          students.push({ name, regNo, mobileNumber, email });
        }
      })
      .on("end", async () => {
        console.log(`✅ Found ${students.length} students in CSV\n`);
        
        let updated = 0;
        let created = 0;
        let skipped = 0;

        for (const studentData of students) {
          const existing = await Student.findOne({ where: { regNo: studentData.regNo } });
          
          if (existing) {
            // Update mobile number
            existing.name = studentData.name;
            existing.mobileNumber = studentData.mobileNumber;
            existing.email = studentData.email;
            await existing.save();
            updated++;
            console.log(`✓ Updated: ${studentData.regNo} - ${studentData.name}`);
          } else {
            // Create new student
            await Student.create({
              name: studentData.name,
              regNo: studentData.regNo,
              email: studentData.email,
              mobileNumber: studentData.mobileNumber,
              dob: new Date("2003-01-01")
            });
            created++;
            console.log(`+ Created: ${studentData.regNo} - ${studentData.name}`);
          }
        }

        console.log(`\n✅ Import complete!`);
        console.log(`   Updated: ${updated}`);
        console.log(`   Created: ${created}`);
        console.log(`   Skipped: ${skipped}`);
        
        process.exit(0);
      })
      .on("error", (err) => {
        console.error("❌ CSV Error:", err.message);
        process.exit(1);
      });

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
};

updateStudentsFromCSV();
