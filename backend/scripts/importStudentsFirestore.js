import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import db from '../src/config/firebase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function importStudents() {
  console.log('🏁 Starting direct import of students from CSV to Firestore...');
  
  const csvFilePath = path.join(__dirname, '../data/students.csv');

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV file not found at: ${csvFilePath}`);
    process.exit(1);
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
      regNo: String(regNo).trim().toUpperCase(),
      dob: dobValue ? new Date(dobValue).toISOString() : null,
      email: String(email).trim(),
      mobileNumber: mobileNumber ? String(mobileNumber).trim() : null
    };
  };

  // Read CSV and parse
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      const student = mapRowToStudent(row);
      if (student) {
        students.push(student);
      }
    })
    .on('end', async () => {
      try {
        const now = new Date().toISOString();

        for (const studentData of students) {
          // Find student by regNo
          const studentQuerySnap = await db.collection('students')
            .where('regNo', '==', studentData.regNo)
            .limit(1)
            .get();

          if (!studentQuerySnap.empty) {
            const studentDoc = studentQuerySnap.docs[0];
            const existingStudent = studentDoc.data();

            const nameChanged = existingStudent.name !== studentData.name;
            const dobChanged = existingStudent.dob !== studentData.dob;
            const emailChanged = existingStudent.email !== studentData.email;
            const mobileChanged = (existingStudent.mobileNumber || null) !== (studentData.mobileNumber || null);

            if (nameChanged || dobChanged || emailChanged || mobileChanged) {
              await studentDoc.ref.update({
                name: studentData.name,
                dob: studentData.dob,
                email: studentData.email,
                mobileNumber: studentData.mobileNumber,
                updatedAt: now
              });
              updatedCount++;
            } else {
              unchangedCount++;
            }
          } else {
            // Create a new student doc
            const newDocRef = db.collection('students').doc();
            await newDocRef.set({
              id: newDocRef.id,
              ...studentData,
              createdAt: now,
              updatedAt: now
            });
            newCount++;
          }
        }

        console.log(`\n🎉 IMPORT COMPLETED SUCCESSFULLY!`);
        console.log(`---------------------------------`);
        console.log(`New Students Added : ${newCount}`);
        console.log(`Students Updated    : ${updatedCount}`);
        console.log(`Students Unchanged  : ${unchangedCount}`);
        console.log(`Total in CSV        : ${students.length}`);
        console.log(`---------------------------------`);
        process.exit(0);
      } catch (error) {
        console.error('❌ Firestore import error:', error);
        process.exit(1);
      }
    })
    .on('error', (error) => {
      console.error('❌ CSV read error:', error);
      process.exit(1);
    });
}

importStudents();
