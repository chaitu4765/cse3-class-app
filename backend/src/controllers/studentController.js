import db from '../config/firebase.js';

/**
 * Get All Students Controller
 * Returns all students (basic info)
 * Access: CR only (JWT protected)
 */
export const getAllStudents = async (req, res) => {
  try {
    const studentsSnapshot = await db.collection('students').get();
    
    const students = [];
    studentsSnapshot.forEach(doc => {
      const data = doc.data();
      students.push({
        id: data.id || doc.id,
        name: data.name,
        regNo: data.regNo,
        email: data.email || null
      });
    });

    // Sort by regNo ascending
    students.sort((a, b) => {
      const regA = (a.regNo || '').toUpperCase();
      const regB = (b.regNo || '').toUpperCase();
      return regA.localeCompare(regB);
    });

    res.status(200).json(students);

  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({
      message: 'Server error while fetching students from Firestore'
    });
  }
};

/**
 * Get Students Count Controller
 * Returns total count of students
 * Access: Public (read-only)
 */
export const getStudentsCount = async (req, res) => {
  try {
    const countSnapshot = await db.collection('students').count().get();
    const count = countSnapshot.data().count;

    res.status(200).json({
      count: count
    });

  } catch (error) {
    console.error('Get students count error:', error);
    res.status(500).json({
      message: 'Server error while fetching student count from Firestore'
    });
  }
};
