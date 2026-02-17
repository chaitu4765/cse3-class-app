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

interface AttendanceRecord {
  subject: string;
  attended: number;
  total: number;
  percentage: number;
  status: string;
}

const TIMETABLE_DATA = [
  { day: 'Monday', classes: [{ time: '09:00 - 10:40', sub: 'DBMS LAB-1 / ALC LAB-2', room: 'Lab' }, { time: '10:40 - 12:20', sub: 'MP', room: 'L-101' }, { time: '01:30 - 03:10', sub: 'ME', room: 'L-101' }] },
  { day: 'Tuesday', classes: [{ time: '09:00 - 10:40', sub: 'FLAT', room: 'L-101' }, { time: '10:40 - 12:20', sub: 'DAA', room: 'L-101' }, { time: '01:30 - 03:10', sub: 'WT LAB-2 / ALC LAB-1', room: 'Lab' }] },
  { day: 'Wednesday', classes: [{ time: '09:00 - 10:40', sub: 'PEHV', room: 'L-101' }, { time: '10:40 - 12:20', sub: 'DBMS', room: 'L-101' }, { time: '01:30 - 03:10', sub: 'WT LAB-1 / DBMS LAB-2', room: 'Lab' }] },
  { day: 'Thursday', classes: [{ time: '09:00 - 10:40', sub: 'DAA', room: 'L-101' }, { time: '10:40 - 12:20', sub: 'MP', room: 'L-101' }, { time: '01:30 - 03:10', sub: 'ME', room: 'L-101' }] },
  { day: 'Friday', classes: [{ time: '09:00 - 10:40', sub: 'FLAT', room: 'L-101' }, { time: '10:40 - 12:20', sub: 'DBMS', room: 'L-101' }, { time: '01:30 - 03:10', sub: 'REMEDIAL CLASS', room: 'L-101' }] },
  { day: 'Saturday', classes: [{ time: '09:00 - 10:40', sub: 'LIBRARY / SELF-STUDY', room: 'Lib' }, { time: '10:40 - 12:20', sub: 'LIBRARY / SELF-STUDY', room: 'Lib' }, { time: '01:30 - 04:00', sub: 'SWATCH BHARATH', room: 'Campus' }] },
];

const StudentDashboard = () => {
  const student = JSON.parse(localStorage.getItem('student') || '{}');
  const [stats, setStats] = useState([
    { label: 'Broadcasts', value: '...', icon: '📢', gradient: 'from-primary-light to-primary' },
  ]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [subjectAttendance, setSubjectAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch student's data from localStorage
      const studentData = JSON.parse(localStorage.getItem('student') || '{}');
      let overallAttendance = 0;
      let hasAttendanceData = false;
      let attendanceData: AttendanceRecord[] = [];

      console.log('Fetching dashboard data for:', studentData.regNo);

      // Fetch real-time attendance data from database via API
      if (studentData.regNo && studentData.password) {
        try {
          console.log('Fetching attendance from database...');
          const attendanceResponse = await api.post('/attendance/lookup', {
            regNo: studentData.regNo,
            password: studentData.password
          });

          console.log('Full Attendance API response:', JSON.stringify(attendanceResponse.data, null, 2));
          console.log('Attendance API response:', attendanceResponse.data);
          console.log('Attendance field:', attendanceResponse.data.attendance);
          console.log('Attendance array:', attendanceResponse.data.attendance);
          console.log('Is array?', Array.isArray(attendanceResponse.data.attendance));

          // The API might return attendance in different fields
          const attendanceArray = attendanceResponse.data.attendance ||
            attendanceResponse.data.overallAttendance ||
            [];

          console.log('Using attendance array:', attendanceArray);

          if (attendanceArray && Array.isArray(attendanceArray)) {
            attendanceData = attendanceArray;
            console.log('Attendance data length:', attendanceData.length);

            // If attendance array has records (even if empty), we have data
            if (attendanceData.length > 0) {
              hasAttendanceData = true;

              // Calculate overall attendance percentage from all subjects in DB
              // This aggregates attended/total across all subjects to get overall %
              let totalAttended = 0;
              let totalClasses = 0;

              attendanceData.forEach((record: any) => {
                console.log('Processing record:', record);
                totalAttended += record.attended || 0;
                totalClasses += record.total || 0;
              });

              console.log('Total calculation:', { totalAttended, totalClasses });

              if (totalClasses > 0) {
                overallAttendance = Math.round((totalAttended / totalClasses) * 100);
                console.log('Calculated attendance=' + overallAttendance + '%');
              } else {
                // Has records but no classes conducted yet
                overallAttendance = 0;
                console.log('Has attendance records but totalClasses=0, showing 0%');
              }

              console.log('Overall attendance from DB:', `${totalAttended}/${totalClasses} = ${overallAttendance}%`);

              // Set subject-wise attendance with dynamic data from DB
              setSubjectAttendance(attendanceData);
            } else {
              console.log('Attendance array is empty - no records found in database for this student');
            }
          } else {
            console.log('No attendance data in response or not an array');
          }
        } catch (attendanceError: any) {
          console.error('Error fetching attendance:', attendanceError);
          console.error('Error details:', attendanceError.response?.data);
          // Fallback to localStorage data if API call fails
          if (studentData.attendance && Array.isArray(studentData.attendance)) {
            console.log('Using fallback localStorage data');
            attendanceData = studentData.attendance;

            let totalAttended = 0;
            let totalClasses = 0;

            attendanceData.forEach((record: any) => {
              totalAttended += record.attended || 0;
              totalClasses += record.total || 0;
            });

            if (totalClasses > 0) {
              hasAttendanceData = true;
              overallAttendance = Math.round((totalAttended / totalClasses) * 100);
            }

            setSubjectAttendance(attendanceData);
          }
        }

      }

      // Fetch announcements dynamically
      try {
        console.log('Fetching announcements from API...');
        const announcementsResponse = await api.get('/announcements');
        console.log('Announcements API response:', announcementsResponse.data);

        const allAnnouncements = announcementsResponse.data.announcements || [];
        const announcementsCount = allAnnouncements.length || 0;

        // Get recent 3 announcements
        setRecentAnnouncements(allAnnouncements.slice(0, 3));

        console.log('Updating stats with:', { overallAttendance, hasAttendanceData, announcementsCount });

        // Update stats with real data
        setStats([
          {
            label: 'Broadcasts',
            value: announcementsCount.toString(),
            icon: '📢',
            gradient: 'from-primary-light to-primary'
          },
        ]);
      } catch (announcementsError) {
        console.error('Error fetching announcements:', announcementsError);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-brand-light relative">
      <ParticleBackground />
      <Sidebar />
      <MobileMenu />
      <div className="flex-1 p-4 md:p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-2">
            Welcome, <span className="opacity-60">{student.name?.split(' ')[0] || 'Student'}!</span>
          </h1>

          <p className="text-primary/40 font-black mb-10 tracking-widest uppercase text-[10px] opacity-70">Acknowledge your progress today</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            {stats.map((stat, index) => (
              <GlassCard key={index} className="p-6 group hover:scale-105 transition-transform border-primary/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm font-bold mb-1 uppercase tracking-tight">{stat.label}</p>
                    <p className={`text-4xl font-extrabold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>{stat.value}</p>
                  </div>
                  <div className="text-4xl group-hover:scale-110 transition-transform opacity-80 group-hover:opacity-100">{stat.icon}</div>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Timetable Section */}
            <div className="lg:col-span-2">
              <GlassCard className="p-8 h-full border-primary/10">
                <div className="items-center justify-between mb-8 flex">
                  <h2 className="text-2xl font-bold text-primary tracking-tight">Weekly Timetable</h2>
                  <div className="px-3 py-1 bg-accent/10 rounded-full">
                    <span className="text-xs font-bold text-accent uppercase tracking-widest">Semester Standard</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  {TIMETABLE_DATA.map((day, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="text-center py-2 bg-secondary/5 rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-widest text-accent-dark">{day.day.substring(0, 3)}</span>
                      </div>
                      <div className="space-y-2">
                        {day.classes.map((cls, cIdx) => (
                          <div key={cIdx} className="bg-secondary/10 p-2.5 rounded-xl border border-primary/5 hover:border-accent/30 transition-colors group/item">
                            <p className="text-[10px] font-bold text-accent mb-0.5">{cls.time}</p>
                            <p className="text-xs font-black text-primary group-hover/item:text-accent transition-colors">{cls.sub}</p>
                            <p className="text-[9px] font-medium text-primary/30">{cls.room}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Quick Actions/Info */}
            <div className="space-y-6">
              <GlassCard className="p-8 border-primary/10 h-full">
                <h2 className="text-2xl font-bold text-primary mb-8 tracking-tight">Quick Actions</h2>
                <div className="flex flex-col gap-4">
                  <Link
                    to="/student/attendance"
                    className="btn-secondary text-sm py-4 flex items-center justify-center gap-2 group"
                  >
                    <span>📊</span> View Attendance <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">→</span>
                  </Link>
                  <Link
                    to="/student/announcements"
                    className="btn-secondary text-sm py-4 flex items-center justify-center gap-2 group"
                  >
                    <span>📢</span> View Broadcasts <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">→</span>
                  </Link>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Subject-wise Attendance */}
          {subjectAttendance.length > 0 && (
            <GlassCard className="p-8 md:p-10 mb-10 border-primary/10">
              <h2 className="text-2xl font-bold text-primary mb-8 tracking-tight">Subject-wise Attendance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjectAttendance.map((record, index) => (
                  <div key={index} className="bg-glass-border/20 rounded-2xl p-6 border border-glass-border backdrop-blur-md hover:border-primary/30 transition-colors">
                    <h3 className="text-xl font-bold text-primary mb-4">{record.subject}</h3>
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <p className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-1">{record.subject}</p>
                        <h3 className="text-xl font-black text-primary leading-tight">{record.subject}</h3>
                      </div>
                      <div className="text-right">
                        <span className={`text-3xl font-black tracking-tighter ${record.percentage >= 75 ? 'text-blue-600' : 'text-red-600'}`}>
                          {record.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-text-secondary text-sm font-medium">Attended</span>
                      <span className="text-primary font-bold">{record.attended} / {record.total}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-text-secondary text-sm font-medium">Percentage</span>
                      <span className={`text-xl font-black ${record.percentage >= 75 ? 'text-emerald-600' :
                        'text-red-600'
                        }`}>
                        {record.percentage}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${record.status === 'Eligible' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                        }`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          <GlassCard className="p-8 md:p-10 border-indigo-500/10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-primary tracking-tight">Recent Broadcasts</h2>
              <a href="/student/announcements" className="text-accent hover:text-accent-dark text-sm font-bold tracking-tight px-4 py-2 bg-accent/10 rounded-full transition-colors">
                View All →
              </a>
            </div>
            <div className="space-y-6">
              {recentAnnouncements.map((announcement, index) => (
                <div key={index} className="bg-glass-border/20 rounded-2xl p-6 border border-glass-border backdrop-blur-md">
                  <div className="flex justify-between items-start mb-4">
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
        </div>
      </div>
    </div >
  );
};

export default StudentDashboard;
