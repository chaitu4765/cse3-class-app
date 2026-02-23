import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import Student from '../models/Student.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Import students from CSV file
 */
export const importStudentsFromCSV = async (req, res) => {
  try {
    const csvFilePath = path.join(__dirname, '../../data/students.csv');

    if (!fs.existsSync(csvFilePath)) {
      return res.status(400).json({
        message: 'CSV file not found at data/students.csv'
      });
    }

    const students = [];
    let newCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;

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

    // Read CSV and parse
    const stream = fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const student = mapRowToStudent(row);
        if (!student) {
          return;
        }

        students.push(student);
      })
      .on('end', async () => {
        try {
          // Process each student
          for (const studentData of students) {
            const existingStudent = await Student.findOne({ 
              where: { regNo: studentData.regNo } 
            });

            if (existingStudent) {
              const nameChanged = existingStudent.name !== studentData.name;
              const dobChanged = existingStudent.dob?.getTime() !== studentData.dob.getTime();
              const emailChanged = existingStudent.email !== studentData.email;
              const mobileChanged = (existingStudent.mobileNumber || null) !== (studentData.mobileNumber || null);

              if (nameChanged || dobChanged || emailChanged || mobileChanged) {
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
              await Student.create(studentData);
              newCount++;
            }
          }

          res.status(200).json({
            message: 'Import completed successfully!',
            summary: {
              newStudents: newCount,
              updatedStudents: updatedCount,
              unchangedStudents: unchangedCount,
              totalInCSV: students.length
            }
          });
        } catch (error) {
          console.error('Import error:', error);
          res.status(500).json({
            message: 'Error importing students',
            error: error.message
          });
        }
      })
      .on('error', (error) => {
        console.error('CSV read error:', error);
        res.status(500).json({
          message: 'Error reading CSV file',
          error: error.message
        });
      });

  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      message: 'Migration failed',
      error: error.message
    });
  }
};
