import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import Sidebar from '../components/Sidebar';
import MobileMenu from '../components/MobileMenu';
import GlassCard from '../components/GlassCard';
import api from '../api/axios';
import ParticleBackground from '../components/ParticleBackground';

interface AttendanceSubject {
  subject: string;
  attended: number;
  total: number;
  percentage: number;
  status: string;
}

interface DateSubject {
  subject: string;
  status: string;
}

interface AttendanceResponse {
  name: string;
  regNo: string;
  attendance: AttendanceSubject[];
  date?: string;
  subjects?: DateSubject[];
  overallAttendance?: AttendanceSubject[];
}

const AttendanceLookup = () => {
  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-fill regNo and password if student is logged in
  useEffect(() => {
    const studentData = localStorage.getItem('student');
    if (studentData) {
      try {
        const student = JSON.parse(studentData);
        if (student.regNo) {
          setRegNo(student.regNo);
        }
        if (student.password) {
          setPassword(student.password);
        }
      } catch (err) {
        console.error('Error parsing student data:', err);
      }
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setData(null);

    if (!regNo || !password || !selectedDate) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const requestBody: any = {
        regNo,
        password
      };

      // Add date if selected
      if (selectedDate) {
        requestBody.date = selectedDate;
      }

      const response = await api.post('/attendance/lookup', requestBody);

      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch attendance. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Eligible':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Ineligible':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Determine which attendance to display
  const displayAttendance = data?.overallAttendance || data?.attendance || [];

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-brand-light relative">
      <ParticleBackground />
      <Sidebar />
      <MobileMenu />
      <div className="flex-1 p-4 md:p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 lg:text-left text-center">
            <div className="text-center md:text-left mb-8 md:mb-0">
              <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-brand-muted border border-brand-dark/20 text-primary">
                <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">Personal Records</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight">
                Attendance <span className="opacity-10">Lookup</span>
              </h1>
            </div>
            <p className="text-primary/40 font-black uppercase tracking-widest text-[10px]">Access your detailed academic records</p>
          </div>

          <GlassCard className="p-8 mb-8 border-primary/10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-secondary/50 text-xs font-bold uppercase tracking-wider ml-1 mb-2">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    placeholder="e.g., 324506402***"
                    className="placeholder:text-secondary/10 w-full px-4 py-2 rounded-xl bg-white border border-primary/10 focus:outline-none focus:border-primary/50"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-secondary/50 text-xs font-bold uppercase tracking-wider ml-1 mb-2">
                    Mobile Number (Password) *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your mobile number"
                    className="placeholder:text-secondary/10 w-full px-4 py-2 rounded-xl bg-white border border-primary/10 focus:outline-none focus:border-primary/50"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-secondary/50 text-xs font-bold uppercase tracking-wider ml-1 mb-2">
                    Specific Date *
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-white border border-primary/10 focus:outline-none focus:border-primary/50 [color-scheme:light]"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full md:w-fit"
                >
                  {loading ? 'Searching...' : 'Lookup Records'}
                </button>
              </div>
            </form>
          </GlassCard>

          {data && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                {/* Student Info */}
                <GlassCard className="p-6 lg:col-span-1 border-primary/20">
                  <div className="text-center lg:text-left">
                    <p className="text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1">Student Name</p>
                    <h2 className="text-xl font-bold text-secondary mb-4 leading-tight">
                      {data.name}
                    </h2>
                    <p className="text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1">Reg No</p>
                    <p className="text-primary font-bold">{data.regNo}</p>
                  </div>
                </GlassCard>

                {/* Overall Attendance by Subject */}
                <div className="lg:col-span-3">
                  <GlassCard className="p-6 h-full border-primary/10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-primary tracking-tight">
                        {data.date ? `📅 Classes on ${data.date}` : '📊 Attendance Summary'}
                      </h3>
                      {data.date && (
                        <div className="px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                          <span className="text-[10px] font-black text-accent uppercase tracking-widest">{data.date}</span>
                        </div>
                      )}
                    </div>

                    {/* If date-specific view, show subjects for that date */}
                    {data.date && data.subjects && data.subjects.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {data.subjects.map((subj, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-2xl border backdrop-blur-md transition-all hover:scale-[1.02] ${subj.status === 'Present'
                              ? 'bg-green-500/5 border-green-500/20'
                              : 'bg-red-500/5 border-red-500/20'
                              }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="font-bold text-primary">{subj.subject}</div>
                              <div
                                className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${subj.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}
                              >
                                {subj.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Overall attendance table */}
                    {displayAttendance.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-black text-primary/40 uppercase tracking-widest">Cumulative Progress</h4>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-primary/5">
                          <table className="w-full text-left">
                            <thead className="bg-primary/5">
                              <tr>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-primary/40">Subject</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-primary/40 text-center">Stats</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-primary/40 text-center">Progress</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-primary/40 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-primary/5">
                              {displayAttendance.map((subject, index) => (
                                <tr key={index} className="hover:bg-primary/5 transition-colors group">
                                  <td className="p-4">
                                    <div className="font-bold text-primary text-xs">{subject.subject}</div>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className="text-xs font-medium text-primary/60">{subject.attended} / {subject.total}</span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span
                                      className={`text-sm font-black ${subject.percentage >= 75
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                        }`}
                                    >
                                      {subject.percentage.toFixed(0)}%
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusClass(subject.status)}`}>
                                      {subject.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* No data message */}
                    {displayAttendance.length === 0 && (!data.subjects || data.subjects.length === 0) && (
                      <div className="text-center text-white/30 py-12 flex flex-col items-center">
                        <span className="text-4xl mb-4">📭</span>
                        <p className="font-bold uppercase tracking-widest text-[10px]">
                          {data.date ? `No records found for ${data.date}` : 'No attendance data available'}
                        </p>
                      </div>
                    )}
                  </GlassCard>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceLookup;
