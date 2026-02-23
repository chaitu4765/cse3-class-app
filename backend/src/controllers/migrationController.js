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

    // Read CSV and parse
    const stream = fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
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

              if (nameChanged || dobChanged || emailChanged) {
                existingStudent.name = studentData.name;
                existingStudent.dob = studentData.dob;
                existingStudent.email = studentData.email;
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
