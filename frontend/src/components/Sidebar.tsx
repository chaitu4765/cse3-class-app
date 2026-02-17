import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const student = localStorage.getItem('student');
  const userType = localStorage.getItem('userType');

  // If no user is logged in, hide sidebar entirely
  if (!token && !student) return null;

  // Simplified navigation based on user type
  const baseMenuItems = userType === 'admin' ? [
    { title: 'Dashboard', path: '/admin/dashboard', icon: '🏠' },
    { title: 'Mark Attendance', path: '/mark-attendance', icon: '📝' },
    { title: 'Manage Attendance', path: '/attendance-manage', icon: '⚙️' },
    { title: 'View All records', path: '/view-all-attendance', icon: '📊' },
    { title: 'Students', path: '/students', icon: '👥' },
    { title: 'Broadcasts', path: '/announcements', icon: '📢' },
    { title: 'Timetable', path: '/timetable', icon: '📅' },
  ] : [
    { title: 'Dashboard', path: '/student/dashboard', icon: '🏠' },
    { title: 'My Attendance', path: '/attendance-lookup', icon: '📊' },
    { title: 'Broadcasts', path: '/announcements', icon: '📢' },
    { title: 'Timetable', path: '/timetable', icon: '📅' },
  ];

  return (
    <aside className="w-80 h-screen sticky top-0 bg-brand-light border-r border-brand-dark/20 p-10 hidden md:flex flex-col">
      <div className="mb-20">
        <h1 className="text-4xl font-black text-primary tracking-tighter leading-none">
          CSE <span className="opacity-10">3.</span>
        </h1>
        <p className="text-[10px] font-black text-primary/70 uppercase tracking-[0.4em] mt-4 leading-relaxed">Advanced Class Portal</p>
      </div>
      <div className="space-y-1 flex-1">
        {baseMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-4 px-6 py-4 rounded-full transition-all duration-500 group ${location.pathname === item.path
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-primary/70 hover:text-primary hover:bg-brand-muted'
              }`}
          >
            <span className="text-lg filter sepia group-hover:opacity-100 opacity-90 transition-all">{item.icon}</span>
            <span className="font-black text-sm uppercase tracking-widest leading-none">{item.title}</span>
          </Link>
        ))}
      </div>
      <div className="pt-8 border-t border-brand-dark/20">
        <p className="text-[8px] font-black text-primary/50 uppercase tracking-[0.3em]">System v2.5.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
