import Student from '../models/Student.js';

/**
 * Get All Students Controller
 * Returns all students (basic info)
 * Access: CR only (JWT protected)
 */
export const getAllStudents = async (req, res) => {
  try {
    // Get all students, include basic info and email
    const students = await Student.findAll({
      attributes: ['id', 'name', 'regNo', 'email'],
      order: [['regNo', 'ASC']],
      raw: true,
    });

    res.status(200).json(students);

  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({
      message: 'Server error while fetching students'
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
    const count = await Student.count();

    res.status(200).json({
      count: count
    });

  } catch (error) {
    console.error('Get students count error:', error);
    res.status(500).json({
      message: 'Server error while fetching student count'
    });
  }
};
