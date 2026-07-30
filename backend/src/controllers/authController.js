import jwt from 'jsonwebtoken';
import db from '../config/firebase.js';

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

    // 2. Try Student Login (RegNo + Mobile Number) via Firestore
    const normalizedRegNo = identifier.trim().toUpperCase();
    const studentsSnapshot = await db.collection('students')
      .where('regNo', '==', normalizedRegNo)
      .limit(1)
      .get();

    if (!studentsSnapshot.empty) {
      const studentDoc = studentsSnapshot.docs[0];
      const student = { id: studentDoc.id, ...studentDoc.data() };
      
      const passwordTrimmed = password.trim();
      const mobileStored = student.mobileNumber?.trim();

      if (mobileStored && passwordTrimmed === mobileStored) {
        if (!JWT_SECRET) {
          console.error('❌ JWT_SECRET is missing!');
          return res.status(500).json({ message: 'Server Security Error: Contact Admin' });
        }

        // Generate JWT token for student
        const token = jwt.sign(
          { role: 'student', regNo: student.regNo, name: student.name },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.status(200).json({
          token,
          user: {
            name: student.name,
            regNo: student.regNo,
            attendance: []
          },
          role: 'student'
        });
      }

      if (!mobileStored) {
        return res.status(401).json({
          message: 'Mobile number not set for this student',
          details: 'Ask the admin to update your mobile number before login.'
        });
      }

      console.log(`❌ Mobile mismatch for ${identifier}. Input: "${passwordTrimmed}", Stored Mobile: "${mobileStored}"`);
    }

    // Both failed
    return res.status(401).json({
      message: 'Invalid registration number or mobile number',
      details: 'Use your registration number as username and mobile number as password.'
    });

  } catch (error) {
    console.error('🔥 CRITICAL AUTH ERROR:', error);

    res.status(500).json({
      message: 'Server error during login. Check Firebase connection.',
      error_type: error.name,
      debug_info: error.message.substring(0, 50)
    });
  }
};
