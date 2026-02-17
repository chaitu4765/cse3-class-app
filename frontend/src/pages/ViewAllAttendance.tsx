import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import GlassCard from '../components/GlassCard';
import MobileMenu from '../components/MobileMenu';
import api from '../api/axios';

interface SubjectAttendance {
  total: number;
  attended: number;
  percentage: number;
  status: string;
}

interface StudentSummaryAll {
  regNo: string;
  name: string;
  email: string;
  subjects: {
    [key: string]: SubjectAttendance;
  };
  overall: {
    total: number;
    attended: number;
    percentage: number;
  };
}

interface StudentSummarySingle {
  regNo: string;
  name: string;
  email: string;
  total: number;
  attended: number;
  percentage: number;
  status: string;
}

const SUBJECTS = ['ME', 'MP', 'DBMS', 'DAA', 'FLAT'];

const ViewAllAttendance = () => {
  const [attendanceData, setAttendanceData] = useState<(StudentSummaryAll | StudentSummarySingle)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Date range and subject filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');

  const fetchAttendanceSummary = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setError('Start date cannot be after end date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log(`Fetching attendance summary: ${fromDate} to ${toDate}, subject: ${selectedSubject}`);
      const response = await api.get('/attendance/summary', {
        params: {
          fromDate,
          toDate,
          subject: selectedSubject
        }
      });

      console.log('Attendance summary response:', response.data);

      if (response.data.data && response.data.data.length > 0) {
        setAttendanceData(response.data.data);
        setError('');
      } else {
        setAttendanceData([]);
        setError(response.data.message || 'No attendance records found for this date range');
      }
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      setError(err.response?.data?.message || 'Failed to fetch attendance records');
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both start and end dates');
      return;
    }

    setExporting(true);

    try {
      const response = await api.get('/attendance/export', {
        params: {
          fromDate,
          toDate,
          subject: selectedSubject,
          format: 'csv'
        },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${selectedSubject}_${fromDate}_to_${toDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('CSV exported successfully');
    } catch (err: any) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export CSV file');
    } finally {
      setExporting(false);
    }
  };

  const resetAllAttendance = async () => {
    setResetting(true);

    try {
      const response = await api.delete('/attendance/reset');

      console.log('Reset response:', response.data);

      // Clear local data
      setAttendanceData([]);
      setError('');

      // Show success message
      alert(`✅ ${response.data.message}\n\nDeleted:\n- ${response.data.deleted.attendance} attendance records\n- ${response.data.deleted.dailyAttendances} daily attendance records`);

      // Close confirmation dialog
      setShowResetConfirm(false);
    } catch (err: any) {
      console.error('Error resetting attendance:', err);
      alert('❌ Failed to reset attendance data: ' + (err.response?.data?.message || 'Server error'));
    } finally {
      setResetting(false);
    }
  };

  const filteredData = attendanceData.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.regNo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const isAllSubjects = selectedSubject === 'ALL';

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Eligible':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Ineligible':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'N/A':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-brand-light">
      <Sidebar />
      <MobileMenu />
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight mb-2">
                Unified <span className="opacity-10">Attendance</span>
              </h1>
              <p className="text-primary/40 font-black uppercase tracking-widest text-[10px]">Comprehensive subject-wise class records</p>
            </div>
            <div className="flex gap-3">
              {/* <button
                onClick={() => setShowResetConfirm(true)}
                disabled={resetting}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span>{resetting ? '⏳' : '🗑️'}</span>
                {resetting ? 'Resetting...' : 'Reset All Data'}
              </button> */}
              <button
                onClick={exportToCSV}
                disabled={loading || exporting || attendanceData.length === 0}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{exporting ? '⏳' : '📥'}</span>
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>

          {/* Reset Confirmation Modal */}
          {showResetConfirm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <GlassCard className="max-w-md w-full p-6 space-y-4">
                <div className="text-center">
                  <div className="text-5xl mb-4">⚠️</div>
                  <h2 className="text-2xl font-bold text-red-400 mb-2">Reset All Attendance?</h2>
                  <p className="text-white/80 mb-4">
                    This will permanently delete ALL attendance data including:
                  </p>
                  <ul className="text-left text-white/70 space-y-2 mb-4 bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                    <li>• All cumulative attendance records</li>
                    <li>• All daily attendance records</li>
                    <li>• All subject-wise attendance data</li>
                  </ul>
                  <p className="text-yellow-400 font-semibold mb-2">
                    ✅ Students will NOT be deleted
                  </p>
                  <p className="text-red-400 font-bold text-lg">
                    This action CANNOT be undone!
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    disabled={resetting}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={resetAllAttendance}
                    disabled={resetting}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/50 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    {resetting ? 'Deleting...' : 'Yes, Delete All'}
                  </button>
                </div>
              </GlassCard>
            </div>
          )}

          <GlassCard className="p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-primary/80 mb-2 font-medium">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-primary focus:outline-none focus:border-accent/50 [color-scheme:light]"
                />
              </div>
              <div>
                <label className="block text-primary/80 mb-2 font-medium">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-primary focus:outline-none focus:border-accent/50 [color-scheme:light]"
                />
              </div>
              <div>
                <label className="block text-primary/80 mb-2 font-medium">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-primary focus:outline-none focus:border-accent/50 cursor-pointer"
                >
                  <option value="ALL" className="bg-white text-primary py-2">All Subjects</option>
                  {SUBJECTS.map(subject => (
                    <option key={subject} value={subject} className="bg-white text-primary py-2">
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchAttendanceSummary}
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '🔄 Loading...' : '📊 View Summary'}
                </button>
              </div>
            </div>

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

            {attendanceData.length > 0 && (
              <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-2xl">
                <p className="text-xs text-accent-dark font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent"></span>
                  {selectedSubject === 'ALL' ? 'All subjects' : selectedSubject} Records from{' '}
                  {new Date(fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} —{' '}
                  {new Date(toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' • '} {filteredData.length} of {attendanceData.length} students found
                </p>
              </div>
            )}
          </GlassCard>

          {loading ? (
            <GlassCard className="p-8 text-center">
              <p className="text-text-secondary">Loading attendance summary...</p>
            </GlassCard>
          ) : error ? (
            <GlassCard className="p-8">
              <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-600 px-4 py-3 rounded-lg">
                <p className="font-semibold mb-2">📋 {error}</p>
                <p className="text-sm text-yellow-500">
                  Select date range and subject, then click "View Summary" to load records.
                </p>
              </div>
            </GlassCard>
          ) : attendanceData.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <div className="text-text-secondary space-y-4">
                <p className="text-xl">📋 No Records Yet</p>
                <p>Select a date range and subject, then click "View Summary" to load attendance data.</p>
              </div>
            </GlassCard>
          ) : isAllSubjects ? (
            // All subjects view
            <GlassCard className="p-6">
              <div className="mb-4 flex justify-between items-center">
                <p className="text-text-secondary">
                  Showing <span className="text-gold font-semibold">{filteredData.length}</span> students
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-primary/5 border-b border-primary/5">
                      <th className="sticky left-0 bg-white z-20 border-r border-primary/5 p-4 text-left text-primary font-black text-[10px] uppercase tracking-tighter">Reg No</th>
                      <th className="sticky left-0 bg-white z-20 border-r border-primary/5 p-4 text-left text-primary font-black text-[10px] uppercase tracking-tighter">Name</th>
                      <th className="sticky left-0 bg-white z-20 border-r border-primary/5 p-4 text-left text-primary font-black text-[10px] uppercase tracking-tighter">Email</th>
                      {SUBJECTS.map(subject => (
                        <th key={subject} colSpan={2} className="text-center border-l border-primary/5 p-4 text-primary/50 font-black text-[10px] uppercase tracking-widest">
                          {subject}
                        </th>
                      ))}
                      <th colSpan={2} className="text-center border-l border-primary/5 bg-accent/5 p-4 text-accent font-black text-[10px] uppercase tracking-widest">Overall</th>
                    </tr>
                    <tr className="text-[10px] font-black uppercase tracking-tighter bg-primary/5">
                      <th className="sticky left-0 bg-white border-r border-primary/5"></th>
                      <th className="sticky left-0 bg-white border-r border-primary/5"></th>
                      <th className="sticky left-0 bg-white border-r border-primary/5"></th>
                      {SUBJECTS.map(subject => (
                        <>
                          <th key={`${subject}-att`} className="border-l border-primary/5 p-2 text-primary/30">Att/Total (%)</th>
                          <th key={`${subject}-status`} className="p-2 text-primary/30">Status</th>
                        </>
                      ))}
                      <th className="border-l border-primary/5 bg-accent/5 p-2 text-accent/30">Att/Total (%)</th>
                      <th className="bg-primary/5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((student) => {
                      const studentAll = student as StudentSummaryAll;
                      return (
                        <tr key={studentAll.regNo} className="hover:bg-primary/5 transition-colors group">
                          <td className="font-bold text-xs p-4 sticky left-0 bg-white border-r border-primary/5 group-hover:bg-primary/5 whitespace-nowrap">{studentAll.regNo}</td>
                          <td className="text-xs p-4 sticky left-0 bg-white border-r border-primary/5 group-hover:bg-primary/5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{studentAll.name}</td>
                          <td className="text-[10px] p-4 sticky left-0 bg-white border-r border-primary/5 group-hover:bg-primary/5 italic text-text-secondary">{studentAll.email}</td>
                          {SUBJECTS.map(subject => {
                            const subj = studentAll.subjects[subject];
                            return (
                              <>
                                <td key={`${subject}-data`} className="text-center border-l border-primary/10">
                                  {subj.total > 0 ? (
                                    <div>
                                      <span className="text-primary/80">
                                        {subj.attended}/{subj.total}
                                      </span>
                                      <span
                                        className={`ml-2 font-semibold ${subj.percentage >= 75
                                          ? 'text-blue-600'
                                          : 'text-red-600'
                                          }`}
                                      >
                                        ({subj.percentage}%)
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-text-secondary">-</span>
                                  )}
                                </td>
                                <td key={`${subject}-status`} className="text-center">
                                  {subj.total > 0 ? (
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusClass(subj.status)}`}>
                                      {subj.status}
                                    </span>
                                  ) : (
                                    <span className="text-text-secondary">-</span>
                                  )}
                                </td>
                              </>
                            );
                          })}
                          <td className="text-center border-l border-primary/10 bg-accent/5">
                            <div>
                              <span className="text-primary/90 font-medium">
                                {studentAll.overall.attended}/{studentAll.overall.total}
                              </span>
                              <span
                                className={`ml-2 font-bold ${studentAll.overall.percentage >= 75
                                  ? 'text-blue-600'
                                  : 'text-red-600'
                                  }`}
                              >
                                ({studentAll.overall.percentage}%)
                              </span>
                            </div>
                          </td>
                          <td className="text-center bg-accent/5"></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          ) : (
            // Single subject view
            <GlassCard className="p-6">
              <div className="mb-4 flex justify-between items-center">
                <p className="text-text-secondary">
                  Showing <span className="text-gold font-semibold">{filteredData.length}</span> students
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Reg No</th>
                      <th className="text-left">Student Name</th>
                      <th className="text-left">Email</th>
                      <th className="text-center">Attended</th>
                      <th className="text-center">Total</th>
                      <th className="text-center">Percentage</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length > 0 ? (
                      filteredData.map((student) => {
                        const studentSingle = student as StudentSummarySingle;
                        return (
                          <tr key={studentSingle.regNo}>
                            <td className="font-medium">{studentSingle.regNo}</td>
                            <td>{studentSingle.name}</td>
                            <td className="text-xs italic text-text-secondary">{studentSingle.email}</td>
                            <td className="text-center font-semibold text-primary">{studentSingle.attended}</td>
                            <td className="text-center text-text-secondary">{studentSingle.total}</td>
                            <td className="text-center">
                              <span
                                className={`font-semibold ${studentSingle.percentage >= 75
                                  ? 'text-blue-600'
                                  : 'text-red-600'
                                  }`}
                              >
                                {studentSingle.percentage}%
                              </span>
                            </td>
                            <td className="text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusClass(studentSingle.status)}`}>
                                {studentSingle.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center text-white/60 py-8">
                          {searchTerm
                            ? 'No students match your search criteria'
                            : 'No students found in this attendance summary'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewAllAttendance;
