# Class Management Backend - CR Authentication

Backend authentication system for Class Representative (CR) login using environment variables.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Generate Password Hash
```bash
node generateHash.js
```
Copy the generated hash and update the `CR_PASSWORD` in your `.env` file.

### 3. Update .env File
Your `.env` should look like this:
```env
CR_EMAIL=cse3.cr@gmail.com
CR_PASSWORD=$2a$10$XxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx
JWT_SECRET=supersecretkey
PORT=5000
```

### 4. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

## 📡 API Endpoints

### Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "cse1.cr@gmail.com",
  "password": "StrongPassword123"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "CR"
}
```

**Error Response (401):**
```json
{
  "message": "Invalid credentials"
}
```

## 🛡️ Protected Routes

Use the `protectCR` middleware to protect routes:

```javascript
import { protectCR } from './middleware/authMiddleware.js';

router.get('/protected', protectCR, (req, res) => {
  res.json({ message: 'Access granted', user: req.user });
});
```

### Authorization Header
```
Authorization: Bearer <your_jwt_token>
```

## 🔑 Authentication Flow

1. CR sends email and password to `/api/auth/login`
2. Server validates credentials against environment variables
3. If valid, generates JWT token with `{ role: "CR" }` payload
4. Token expires in 8 hours
5. Protected routes verify token using `protectCR` middleware

## ⚠️ Important Notes

- **No Database:** CR credentials are stored ONLY in `.env`
- **No Signup:** Only one CR login exists
- **Environment Variables:** Never commit `.env` to version control
- **Password Security:** Always use bcrypt-hashed passwords

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── authController.js      # Login logic
│   ├── routes/
│   │   └── authRoutes.js           # Auth endpoints
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT protection
│   └── server.js                   # Express app
├── .env                            # Environment variables
├── .gitignore                      # Git ignore file
├── package.json                    # Dependencies
└── generateHash.js                 # Password hasher
```

## 🧪 Testing with cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cse1.cr@gmail.com","password":"StrongPassword123"}'

# Access protected route
curl http://localhost:5000/api/protected \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔧 Tech Stack

- Node.js
- Express.js
- JWT (jsonwebtoken)
- bcryptjs
- dotenv
- cors

## 📝 License

ISC
