import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from '../auth/PrivateRoute';
import StudentPrivateRoute from '../auth/StudentPrivateRoute';
import Navbar from '../components/Navbar';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import AdminDashboard from '../pages/AdminDashboard';
import StudentDashboard from '../pages/StudentDashboard';
import AttendanceLookup from '../pages/AttendanceLookup';
import AttendanceManage from '../pages/AttendanceManage';
import MarkAttendance from '../pages/MarkAttendance';
import ViewAllAttendance from '../pages/ViewAllAttendance';
import Students from '../pages/Students';
import Announcements from '../pages/Announcements';
import TimeTable from '../pages/TimeTable';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<><Navbar /><Home /></>} />
          <Route path="/login" element={<><Navbar /><Login /></>} />

          {/* Redirect old routes */}
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/student/login" element={<Navigate to="/login" replace />} />

          <Route path="/attendance/lookup" element={<><Navbar /><AttendanceLookup /></>} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute>
                <Navbar />
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <PrivateRoute>
                <Navbar />
                <Students />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/attendance"
            element={
              <PrivateRoute>
                <Navbar />
                <MarkAttendance />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/attendance/view"
            element={
              <PrivateRoute>
                <Navbar />
                <ViewAllAttendance />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/attendance/manage"
            element={
              <PrivateRoute>
                <Navbar />
                <AttendanceManage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <PrivateRoute>
                <Navbar />
                <Announcements />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/timetable"
            element={
              <PrivateRoute>
                <Navbar />
                <TimeTable />
              </PrivateRoute>
            }
          />

          {/* Protected Student Routes (Read-Only) */}
          <Route
            path="/student/dashboard"
            element={
              <StudentPrivateRoute>
                <Navbar />
                <StudentDashboard />
              </StudentPrivateRoute>
            }
          />
          <Route
            path="/student/timetable"
            element={
              <StudentPrivateRoute>
                <Navbar />
                <TimeTable />
              </StudentPrivateRoute>
            }
          />
          <Route
            path="/student/students"
            element={
              <StudentPrivateRoute>
                <Navbar />
                <Students />
              </StudentPrivateRoute>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <StudentPrivateRoute>
                <Navbar />
                <AttendanceLookup />
              </StudentPrivateRoute>
            }
          />
          <Route
            path="/student/announcements"
            element={
              <StudentPrivateRoute>
                <Navbar />
                <Announcements />
              </StudentPrivateRoute>
            }
          />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default AppRoutes;
