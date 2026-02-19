import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const userType = localStorage.getItem('userType');
  const token = localStorage.getItem('token');

  // Fallback if userType is missing (for existing sessions)
  const effectiveUserType = userType || (token ? 'admin' : 'student');

  const menuItems = effectiveUserType === 'admin' ? [
    { title: 'Dashboard', path: '/admin/dashboard', icon: '🏠' },
    { title: 'Students', path: '/admin/students', icon: '👥' },
    { title: 'Mark Attendance', path: '/admin/attendance', icon: '📝' },
    { title: 'View All Attendance', path: '/admin/attendance/view', icon: '📊' },
    { title: 'Create Broadcast', path: '/admin/announcements', icon: '📢' },
    { title: 'Timetable', path: '/admin/timetable', icon: '📅' },
  ] : [
    { title: 'Dashboard', path: '/student/dashboard', icon: '🏠' },
    { title: 'My Attendance', path: '/attendance-lookup', icon: '📊' },
    { title: 'Broadcasts', path: '/announcements', icon: '📢' },
    { title: 'Timetable', path: '/timetable', icon: '📅' },
  ];

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-5 rounded-full shadow-[0_20px_50px_rgba(74,68,64,0.3)] hover:scale-110 active:scale-95 transition-all bg-primary text-white"
      >
        <span className="text-xl leading-none flex items-center justify-center w-6 h-6">{isOpen ? '✕' : '☰'}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-brand-light/80 backdrop-blur-md z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-24 right-6 z-50 bg-brand-light p-8 w-80 rounded-[2.5rem] shadow-[0_32px_100px_-20px_rgba(74,68,64,0.2)] border border-brand-dark/20 animate-in fade-in slide-in-from-bottom-4">
            <div className="mb-8 px-2">
              <h1 className="text-2xl font-black text-primary tracking-tighter">
                CSE <span className="opacity-10">3.</span>
              </h1>
              <p className="text-[10px] font-black text-primary/20 uppercase tracking-[0.4em] mt-1">Class Portal</p>
            </div>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-4 px-6 py-4 rounded-full transition-all duration-300 ${location.pathname === item.path
                    ? 'bg-primary text-white'
                    : 'text-primary/40 hover:bg-brand-muted hover:text-primary'
                    }`}
                >
                  <span className="text-lg filter sepia">{item.icon}</span>
                  <span className="font-black text-sm uppercase tracking-widest">{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileMenu;
