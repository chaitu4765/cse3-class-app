import jwt from 'jsonwebtoken';

/**
 * Middleware to protect CR-only routes
 * Verifies JWT token and checks for CR role
 */
export const protectCR = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'No token provided. Authorization denied.' 
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided. Authorization denied.' 
      });
    }

    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      return res.status(500).json({ 
        message: 'Server configuration error' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if role is CR
    if (decoded.role !== 'CR') {
      return res.status(403).json({ 
        message: 'Access denied. CR role required.' 
      });
    }

    // Attach decoded data to request
    req.user = decoded;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired. Please login again.' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token. Authorization denied.' 
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Server error during authentication' 
    });
  }
};
