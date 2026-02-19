import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import GlassCard from '../components/GlassCard';
import MobileMenu from '../components/MobileMenu';
import api from '../api/axios';
import ParticleBackground from '../components/ParticleBackground';

interface Announcement {
  title: string;
  message: string;
  createdAt: string;
}

interface StudentAttendance {
  _id: string;
  name: string;
  regNo: string;
  email: string;
  attendance: {
    subject: string;
    attended: number;
    total: number;
    percentage: number;
    status: string;
  }[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState([
    { label: 'Total Students', value: '...', icon: '👥', gradient: 'from-accent-light to-accent' },
    { label: 'Announcements', value: '...', icon: '📢', gradient: 'from-primary-light to-primary' },
  ]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState<StudentAttendance[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total students count
      const studentsResponse = await api.get('/students/count');
      const totalStudents = studentsResponse.data.count || 0;

      // Fetch all attendance data
      const attendanceResponse = await api.get('/attendance/all');
      const allStudentsData: StudentAttendance[] = attendanceResponse.data.students || [];

      // Calculate average attendance and find low attendance students
      let totalAttendanceSum = 0;
      let studentsWithAttendance = 0;
      const lowAttendance: StudentAttendance[] = [];

      allStudentsData.forEach((student) => {
        if (student.attendance && student.attendance.length > 0) {
          let studentTotalAttended = 0;
          let studentTotalClasses = 0;
          let hasLowAttendance = false;

          student.attendance.forEach((record) => {
            studentTotalAttended += record.attended || 0;
            studentTotalClasses += record.total || 0;

            // Check if any subject has low attendance
            if (record.percentage < 75) {
              hasLowAttendance = true;
            }
          });

          if (studentTotalClasses > 0) {
            const studentAvg = (studentTotalAttended / studentTotalClasses) * 100;
            totalAttendanceSum += studentAvg;
            studentsWithAttendance++;

            if (hasLowAttendance) {
              lowAttendance.push(student);
            }
          }
        }
      });

      // Fetch announcements
      const announcementsResponse = await api.get('/announcements');
      const allAnnouncements = announcementsResponse.data.announcements || [];
      const announcementsCount = allAnnouncements.length || 0;

      // Get recent 3 announcements
      setRecentAnnouncements(allAnnouncements.slice(0, 3));

      // Get top 5 low attendance students
      setLowAttendanceStudents(lowAttendance.slice(0, 5));

      // Update stats with real data
      setStats([
        {
          label: 'Total Students',
          value: totalStudents.toString(),
          icon: '👥',
          gradient: 'from-accent-light to-accent'
        },
        {
          label: 'Broadcasts',
          value: announcementsCount.toString(),
          icon: '📢',
          gradient: 'from-primary-light to-primary'
        },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleResetAttendance = async () => {
    if (resetConfirmText !== 'RESET') {
      return;
    }

    setResetting(true);
    try {
      const response = await api.delete('/attendance/reset');
      setResetSuccess(`Backup saved: ${response.data.backup.filename}. ${response.data.backup.recordsDeleted.attendance + response.data.backup.recordsDeleted.dailyAttendance + response.data.backup.recordsDeleted.dailyRecords} records deleted.`);
      setShowResetModal(false);
      setResetConfirmText('');
      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Reset error:', error);
      alert(error.response?.data?.message || 'Failed to reset attendance');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-brand-light relative">
      <ParticleBackground />
      <Sidebar />
      <MobileMenu />
      <div className="flex-1 p-4 md:p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="px-3 py-1 rounded-full bg-brand-muted text-[10px] font-black uppercase tracking-[0.3em] text-primary border border-brand-dark/20">Console</span>
            <h1 className="text-6xl md:text-8xl font-black text-primary tracking-tighter leading-none mt-4">
              Admin <span className="opacity-10">Control.</span>
            </h1>
            <p className="text-primary/90 font-medium tracking-tight mt-4">Managing class performance and broadcasts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="p-8 rounded-[2rem] bg-white/80 backdrop-blur-xl border border-brand-dark/20 hover:border-primary/50 transition-all shadow-sm group">
                <div className="flex items-center justify-between pointer-events-none">
                  <div>
                    <p className="text-primary/80 text-[10px] font-black uppercase tracking-widest mb-2">{stat.label}</p>
                    <p className="text-5xl font-black text-primary">{stat.value}</p>
                  </div>
                  <div className="text-4xl filter sepia opacity-80 group-hover:opacity-100 transition-all">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <GlassCard className="p-8 md:p-10 mb-10 border-primary/10">
            <h2 className="text-2xl font-bold text-primary mb-8 tracking-tight">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/admin/attendance"
                className="btn-secondary text-center"
              >
                Mark Attendance
              </Link>
              <Link
                to="/admin/attendance/view"
                className="btn-secondary text-center"
              >
                View All Attendance
              </Link>
              <Link
                to="/admin/announcements"
                className="btn-secondary text-center"
              >
                Create Broadcast
              </Link>
              <button
                onClick={() => setShowResetModal(true)}
                className="btn-secondary text-center !bg-transparent !border-red-500/40 !text-red-400 hover:!bg-red-500 hover:!text-white hover:!border-transparent transition-all duration-300"
              >
                ⚠️ Reset Attendance
              </button>
            </div>
          </GlassCard>

          {/* Reset Confirmation Modal */}
          {showResetModal && (
            <div className="fixed inset-0 bg-primary/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <GlassCard className="max-w-md w-full p-8 border-red-500/30 backdrop-blur-3xl">
                <h2 className="text-2xl font-black text-primary mb-4 flex items-center gap-2">
                  <span className="text-red-500">⚠️</span> Reset All Attendance
                </h2>
                <div className="space-y-6">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                    <p className="text-red-500 text-sm font-bold mb-2 uppercase tracking-tight">DANGER: Critical Action</p>
                    <ul className="text-red-400/90 text-sm space-y-2 ml-4 list-disc font-medium">
                      <li>Export all attendance data to CSV backup</li>
                      <li>Permanently delete all attendance records</li>
                      <li>This action <span className="underline decoration-2">cannot</span> be undone</li>
                    </ul>
                  </div>

                  <div>
                    <label className="block text-text-secondary text-xs font-bold uppercase tracking-widest mb-3">
                      Type <span className="text-red-500 underline font-black">RESET</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={resetConfirmText}
                      onChange={(e) => setResetConfirmText(e.target.value)}
                      placeholder="Type RESET"
                      className="w-full !rounded-2xl"
                      disabled={resetting}
                    />
                  </div>

                  {resetSuccess && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm">
                      {resetSuccess}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowResetModal(false);
                        setResetConfirmText('');
                        setResetSuccess(null);
                      }}
                      className="btn-secondary flex-1"
                      disabled={resetting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResetAttendance}
                      disabled={resetConfirmText !== 'RESET' || resetting}
                      className="btn-primary flex-1 !bg-transparent !border-red-500 !text-red-500 hover:!bg-red-500 hover:!text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {resetting ? 'Resetting...' : 'Confirm Reset'}
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Low Attendance Students */}
          {lowAttendanceStudents.length > 0 && (
            <GlassCard className="p-8 md:p-10 mb-10 border-accent/20">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-primary tracking-tight">Students with Low Attendance</h2>
                <Link to="/admin/attendance/view" className="text-accent hover:text-accent-dark text-sm font-bold tracking-tight px-4 py-2 bg-accent/10 rounded-full transition-colors">
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {lowAttendanceStudents.map((student, index) => (
                  <div key={index} className="bg-glass-border/20 rounded-2xl p-6 border border-orange-500/20 backdrop-blur-md">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-primary mb-1">{student.name}</h3>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-semibold text-primary/80">{student.regNo}</p>
                          <p className="text-xs font-medium text-primary/70 italic">{student.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {student.attendance.filter(a => a.percentage < 75).slice(0, 3).map((att, idx) => (
                        <span key={idx} className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${'bg-red-500/20 text-red-400'
                          }`}>
                          {att.subject}: {att.percentage}%
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Recent Announcements */}
          {recentAnnouncements.length > 0 && (
            <GlassCard className="p-8 md:p-10 border-primary/10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-primary tracking-tight">Recent Broadcasts</h2>
                <a href="/admin/announcements" className="text-accent hover:text-accent-dark text-sm font-bold tracking-tight px-4 py-2 bg-accent/10 rounded-full transition-colors">
                  View All →
                </a>
              </div>
              <div className="space-y-4">
                {recentAnnouncements.map((announcement, index) => (
                  <div key={index} className="bg-glass-border/20 rounded-2xl p-6 border border-glass-border backdrop-blur-md">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-primary">{announcement.title}</h3>
                      <span className="text-xs font-bold text-text-secondary opacity-60 uppercase tracking-widest">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-text-secondary font-medium leading-relaxed">{announcement.message}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
