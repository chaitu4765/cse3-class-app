import { Navigate } from 'react-router-dom';

interface StudentPrivateRouteProps {
  children: React.ReactNode;
}

const StudentPrivateRoute = ({ children }: StudentPrivateRouteProps) => {
  const student = localStorage.getItem('student');
  const userType = localStorage.getItem('userType');

  // Check if student data exists and userType is 'student'
  if (!student || userType !== 'student') {
    return <Navigate to="/student/login" replace />;
  }

  return <>{children}</>;
};

export default StudentPrivateRoute;
