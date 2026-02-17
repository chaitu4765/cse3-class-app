# CSE1 Class Management Application

A comprehensive full-stack web application designed to streamline class management activities including attendance tracking, student information management, and broadcasts for CSE Section 1.

---

## 👨‍💻 Author

**Developed by G KRISHNA CHAITANYA**

This project was entirely designed, developed, and integrated by G KRISHNA CHAITANYA as a complete solution for managing class activities and data.

---

## 📖 Overview

The CSE1 Class Management Application is a modern web-based system built to help manage daily classroom operations efficiently. It provides distinct interfaces for students and administrators, enabling seamless attendance tracking and communication through broadcasts. All data is securely stored and easily accessible.

---

## ✨ Features

### Student Features
- **Unified Login**: Secure access via Registration Number and Mobile Number.
- **Attendance Lookup**: View personal attendance records and subject-wise calculations.
- **Student Dashboard**: Access personalized statistics and visual analytics.
- **Broadcasts**: Stay updated with class notifications and important messages.
- **Time Table**: View class schedules easily.

### Administrator Features (Class Representatives)
- **Secure Authentication**: JWT-based admin login system.
- **Unified Login**: Seamless access via Email and Password.
- **Dashboard Overview**: Real-time statistics and class insights.
- **Student Management**: View, search, and manage student records.
- **Attendance Management**: Mark, edit, and track attendance with automatic status calculation.
- **Broadcasts**: Create and manage class-wide broadcasts.
- **Data Export**: Export attendance data for reporting.

---

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first styling
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API communication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **SQLite** - SQL database (via Sequelize)
- **Sequelize** - ORM for database interactions
- **JWT** - JSON Web Tokens for authentication

### Tools & Libraries
- **ESLint** - Code linting
- **Git** - Version control

---

## 🏗 Architecture Overview

The application follows a three-tier architecture:

1. **Presentation Layer (Frontend)**
   - React-based SPA with TypeScript
   - Responsive UI with Tailwind CSS ("Deep Ocean & Emerald" Theme)
   - Client-side routing and state management

2. **Application Layer (Backend)**
   - RESTful API built with Express.js
   - JWT-based authentication
   - Business logic and data validation
   - Controller-based request handling

3. **Data Layer (Database)**
   - SQLite for reliable, serverless, and self-contained storage
   - Sequelize models for structured data handling

**Communication**: Frontend communicates with backend via HTTP REST API calls. Authentication tokens are included in request headers for secured endpoints.

---

## 📦 Installation & Setup

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **Git**

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   - Create a `.env` file in the `frontend` directory
   - Add the following configuration:
   ```
   VITE_API_BASE_URL=<your_backend_api_url>
   ```
   Example: `VITE_API_BASE_URL=http://localhost:5000/api`

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   - Create a `.env` file in the `backend` directory
   - Add the following configuration:
   ```
   PORT=5000
   JWT_SECRET=<your_jwt_secret_key>
   CR_EMAIL=<admin_email>
   CR_PASSWORD=<admin_password>
   NODE_ENV=development
   ```

### Database Setup

1. **Initialize Database**:
   The application uses SQLite, so no external database server is required. The database file will be created automatically.

2. **Seed the Database** (Optional):
   Populate the database with initial student and attendance data.
   ```bash
   cd backend
   node seedDatabase.js
   ```

---

## 🚀 Running the Project Locally

### Start Backend Server

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Start the server:
   ```bash
   npm run dev
   ```
   
   The backend server will run on `http://localhost:5000` (or your configured port).

### Start Frontend Application

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

3. Open your browser and navigate to `http://localhost:5173`

### Production Build

To create a production build of the frontend:
```bash
cd frontend
npm run build
```

The optimized files will be generated in the `dist` directory.

---

## 📂 Folder Structure Overview

```
classapp/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── api/                 # API configuration
│   │   ├── auth/                # Authentication wrappers
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Application pages/views
│   │   ├── routes/              # Routing configuration
│   │   ├── styles/              # Global styles and Tailwind config
│   │   ├── App.tsx              # Root component
│   │   └── main.tsx             # Application entry point
│   ├── public/                  # Static assets
│   └── package.json             # Frontend dependencies
│
├── backend/                     # Express.js backend API
│   ├── src/
│   │   ├── controllers/         # Request handlers
│   │   ├── models/              # Sequelize models (Student, Attendance, etc.)
│   │   ├── routes/              # API routes
│   │   ├── middleware/          # Custom middleware
│   │   └── server.js            # Server entry point
│   ├── database.sqlite          # SQLite database file
│   ├── seedDatabase.js          # Data seeding script
│   └── package.json             # Backend dependencies
│
└── README.md                    # Project documentation
```

---

## 🎯 Key Features Explained

### Attendance System
- Real-time attendance marking and tracking
- Automatic calculation of attendance percentage
- Status classification (Eligible, Condonation, Detained)
- Historical attendance records
- CSV export functionality

### Unified Login
- Intelligent authentication system
- Single entry point for all users
- Role-based redirection (Student vs Admin)

### Security
- JWT-based authentication for Admins
- Secure credential validation for Students
- Protected API endpoints
- Role-based access control
- Secure session management

---

## 📄 License

**License**: MIT

**Copyright © G KRISHNA CHAITANYA**

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## ⚠️ Disclaimer

This is an educational project developed for class management purposes. Internal documentation, sensitive configurations, environment variables, and credentials are intentionally excluded from this public repository for security reasons.

For internal setup documentation and configuration details, please refer to the private internal documentation or contact the developer directly.

---

## 🤝 Support

For questions, issues, or suggestions regarding this project, please reach out to the developer.

**Developed with dedication by G KRISHNA CHAITANYA**
