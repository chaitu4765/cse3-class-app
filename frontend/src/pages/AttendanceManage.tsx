import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import GlassCard from '../components/GlassCard';
import MobileMenu from '../components/MobileMenu';
import api from '../api/axios';
import ParticleBackground from '../components/ParticleBackground';

interface Student {
  id: string;
  name: string;
  regNo: string;
}

interface AttendanceData {
  subject: string;
  attended: number;
  total: number;
  percentage: number;
  status: 'Eligible' | 'Condonation' | 'Detained';
}

const AttendanceManage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingAttendance, setFetchingAttendance] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAttendance = async (studentId: string) => {
    setFetchingAttendance(true);
    setError('');
    setAttendanceData([]);

    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      // Get attendance data for this specific student
      const response = await api.get(`/attendance/student/${studentId}`);
      setAttendanceData(response.data);
    } catch (err: any) {
      setError('Attendance data fetch endpoint not yet implemented. Use student lookup instead.');
      setAttendanceData([]);
    } finally {
      setFetchingAttendance(false);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId);
    if (studentId) {
      fetchStudentAttendance(studentId);
    } else {
      setAttendanceData([]);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Eligible':
        return 'status-eligible';
      case 'Condonation':
        return 'status-condonation';
      case 'Detained':
        return 'status-detained';
      default:
        return '';
    }
  };

  const filteredStudents = students.filter(
    student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.regNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-brand-light relative">
      <ParticleBackground />
      <Sidebar />
      <MobileMenu />
      <div className="flex-1 p-4 md:p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="text-center md:text-left mb-8 md:mb-0">
              <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-brand-muted border border-brand-dark/20 text-primary">
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Management Console</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight">
                Attendance <span className="opacity-10">Manage</span>
              </h1>
            </div>
            <p className="text-primary/40 font-black uppercase tracking-widest text-[10px]">View individual student academic trajectories</p>
          </div>

          <GlassCard className="p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-primary/80 mb-2 font-medium">Search Student</label>
                <input
                  type="text"
                  placeholder="Search by name or registration number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-primary/80 mb-2 font-medium">Select Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-primary focus:outline-none focus:border-accent/50 cursor-pointer"
                >
                  <option value="" className="bg-white text-primary py-2">-- Select a student --</option>
                  {filteredStudents.map(student => (
                    <option key={student.id} value={student.id} className="bg-white text-primary py-2">
                      {student.regNo} - {student.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </GlassCard>

          {error && (
            <GlassCard className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-600 px-4 py-3 rounded-lg mb-6">
              <p className="font-semibold mb-2">⚠️ Note:</p>
              <p>{error}</p>
              <p className="mt-2 text-sm">Students can use the "Attendance Lookup" page to view their attendance using Reg No + DOB.</p>
            </GlassCard>
          )}

          {loading ? (
            <GlassCard className="p-8 text-center">
              <p className="text-text-secondary/60">Loading students...</p>
            </GlassCard>
          ) : fetchingAttendance ? (
            <GlassCard className="p-8 text-center">
              <p className="text-text-secondary/60">Loading attendance data...</p>
            </GlassCard>
          ) : attendanceData.length > 0 ? (
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-primary mb-4">Attendance Summary</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-primary/5">
                      <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-primary/40">Subject</th>
                      <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-primary/40">Attended</th>
                      <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-primary/40">Total</th>
                      <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-primary/40">Percentage</th>
                      <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-primary/40">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {attendanceData.map((record, index) => (
                      <tr key={index} className="hover:bg-primary/5 transition-colors">
                        <td className="p-4 font-bold text-primary text-xs">{record.subject}</td>
                        <td className="p-4 text-xs text-primary/60">{record.attended}</td>
                        <td className="p-4 text-xs text-primary/60">{record.total}</td>
                        <td className="p-4">
                          <span
                            className={`text-sm font-black ${record.percentage >= 75
                              ? 'text-green-600'
                              : record.percentage >= 65
                                ? 'text-yellow-600'
                                : 'text-red-600'
                              }`}
                          >
                            {record.percentage.toFixed(2)}%
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusClass(record.status)}`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          ) : selectedStudent ? (
            <GlassCard className="p-8 text-center">
              <p className="text-text-secondary/60">No attendance records found for this student</p>
            </GlassCard>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AttendanceManage;
