import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const student = localStorage.getItem('student');
  // const userType = localStorage.getItem('userType');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('studentToken');
    localStorage.removeItem('student');
    localStorage.removeItem('userType');
    navigate('/');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const showBackButton = location.pathname !== '/' && location.pathname !== '/admin/dashboard' && location.pathname !== '/student/dashboard';

  return (
    <nav className="bg-brand-light/80 backdrop-blur-xl border-b border-brand-dark/20 px-4 md:px-6 py-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="md:hidden text-primary/40 hover:text-primary transition-colors"
              title="Go back"
            >
              ← Back
            </button>
          )}
          <Link to="/" className="text-2xl font-black text-primary tracking-tighter">
            CSE <span className="opacity-10">3.</span>
          </Link>
        </div>

        {(token || student) && (
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="text-primary/80 hover:text-accent transition-colors text-sm md:text-base font-bold uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-primary/5"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
