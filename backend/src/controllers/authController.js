import jwt from 'jsonwebtoken';

/**
 * CR Login Controller
 * Authenticates CR using environment variables (NO database)
 */
export const loginCR = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    // Get CR credentials from environment variables
    const CR_EMAIL = process.env.CR_EMAIL;
    const CR_PASSWORD = process.env.CR_PASSWORD;
    const JWT_SECRET = process.env.JWT_SECRET;

    // Check if environment variables are set
    if (!CR_EMAIL || !CR_PASSWORD || !JWT_SECRET) {
      return res.status(500).json({
        message: 'Server configuration error'
      });
    }

    // Normalize email (trim and lowercase)
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCREmail = CR_EMAIL.trim().toLowerCase();

    // Compare email with environment variable
    if (normalizedEmail !== normalizedCREmail) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Compare password - PLAIN TEXT (no bcrypt)
    if (password !== CR_PASSWORD) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token with 8-hour expiry
    const token = jwt.sign(
      { role: 'CR', email: CR_EMAIL },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Send response
    res.status(200).json({
      token,
      user: {
        email: CR_EMAIL,
        role: 'CR'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login'
    });
  }
};

import Student from '../models/Student.js';

/**
 * Unified Login Controller
 * Handles both CR (Admin) and Student login
 */
export const unifiedLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Validate request body
    if (!identifier || !password) {
      return res.status(400).json({
        message: 'Identifier and password are required'
      });
    }

    // 1. Try Admin (CR) Login first
    const CR_EMAIL = process.env.CR_EMAIL;
    const CR_PASSWORD = process.env.CR_PASSWORD;
    const JWT_SECRET = process.env.JWT_SECRET;

    if (CR_EMAIL && CR_PASSWORD && JWT_SECRET) {
      const normalizedInput = identifier.trim().toLowerCase();
      const normalizedCREmail = CR_EMAIL.trim().toLowerCase();

      if (normalizedInput === normalizedCREmail && password === CR_PASSWORD) {
        // Generate JWT token with 8-hour expiry
        const token = jwt.sign(
          { role: 'CR', email: CR_EMAIL },
          JWT_SECRET,
          { expiresIn: '8h' }
        );

        return res.status(200).json({
          token,
          user: {
            email: CR_EMAIL,
            role: 'CR'
          },
          role: 'CR'
        });
      }
    }

    // 2. Try Student Login
    // Lookup by RegNo
    const normalizedRegNo = identifier.trim().toUpperCase();
    const student = await Student.findOne({ where: { regNo: normalizedRegNo } });

    if (student) {
      // Validate Password (Mobile Number or RegNo fallback)
      const validPassword = student.mobileNumber ?
        password.trim() === student.mobileNumber.trim() :
        password.trim().toUpperCase() === student.regNo.toUpperCase();

      if (validPassword) {
        return res.status(200).json({
          user: {
            name: student.name,
            regNo: student.regNo,
            attendance: [] // Frontend will fetch real attendance later
          },
          role: 'student'
        });
      }
    }

    // Both failed
    console.log(`❌ Unified Login failed for identifier: "${identifier?.trim()}"`);
    return res.status(401).json({
      message: 'Invalid Username or Security Key',
      details: 'Check if you entered the Roll Number correctly.'
    });

  } catch (error) {
    console.error('🔥 CRITICAL AUTH ERROR:', error);

    // Check for specific database errors
    let errorMessage = 'Server error during login.';
    if (error.name === 'SequelizeConnectionError') {
      errorMessage = 'Database connection failed. Please check your Supabase link.';
    } else if (error.name === 'SequelizeDatabaseError') {
      errorMessage = 'Database table not found. Did you run the seed command?';
    }

    res.status(500).json({
      message: errorMessage,
      error_type: error.name,
      debug_info: error.message.substring(0, 50)
    });
  }
};
