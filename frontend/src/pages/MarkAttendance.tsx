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
  email: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'Present' | 'Absent';
}

const ALLOWED_SUBJECTS = ['ME', 'MP', 'DBMS', 'DAA', 'FLAT'];

const MarkAttendance = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAlreadyMarkedModal, setShowAlreadyMarkedModal] = useState(false);
  const [alreadyMarkedMessage, setAlreadyMarkedMessage] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  // Check for existing attendance when subject or date changes
  useEffect(() => {
    if (selectedSubject && selectedDate) {
      checkExistingAttendance();
    }
  }, [selectedSubject, selectedDate]);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data);

      // Initialize all students as present by default
      const initialAttendance = new Map<string, boolean>();
      response.data.forEach((student: Student) => {
        initialAttendance.set(student.id, true);
      });
      setAttendance(initialAttendance);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingAttendance = async () => {
    try {
      const response = await api.get('/attendance/for-edit', {
        params: { date: selectedDate, subject: selectedSubject }
      });

      if (response.data.alreadyMarked) {
        // Load existing attendance data
        setAlreadyMarked(true);
        setIsReadOnly(true);
        setIsEditMode(false);

        // Update attendance map with existing data
        const existingAttendance = new Map<string, boolean>();
        response.data.records.forEach((record: any) => {
          existingAttendance.set(record.studentId, record.status === 'Present');
        });
        setAttendance(existingAttendance);
      }
    } catch (err: any) {
      // If 404, attendance not marked yet - this is fine
      if (err.response?.status === 404) {
        setAlreadyMarked(false);
        setIsReadOnly(false);
        setIsEditMode(false);

        // Reset to all present
        const resetAttendance = new Map<string, boolean>();
        students.forEach((student) => {
          resetAttendance.set(student.id, true);
        });
        setAttendance(resetAttendance);
      }
    }
  };

  const toggleAttendance = (studentId: string) => {
    if (isReadOnly) return; // Don't allow changes in read-only mode

    setAttendance(prev => {
      const newMap = new Map(prev);
      newMap.set(studentId, !newMap.get(studentId));
      return newMap;
    });
  };

  const markAllPresent = () => {
    if (isReadOnly) return; // Don't allow changes in read-only mode

    setAttendance(prev => {
      const newMap = new Map(prev);
      students.forEach(student => newMap.set(student.id, true));
      return newMap;
    });
  };

  const markAllAbsent = () => {
    if (isReadOnly) return; // Don't allow changes in read-only mode

    setAttendance(prev => {
      const newMap = new Map(prev);
      students.forEach(student => newMap.set(student.id, false));
      return newMap;
    });
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setIsReadOnly(false);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setIsReadOnly(true);
    // Reload existing attendance
    checkExistingAttendance();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedSubject) {
      setError('Please select a subject');
      return;
    }

    if (!selectedDate) {
      setError('Please select a date');
      return;
    }

    setSubmitting(true);

    try {
      const records: AttendanceRecord[] = students.map(student => ({
        studentId: student.id,
        status: attendance.get(student.id) ? 'Present' : 'Absent'
      }));

      let response;

      // Use update endpoint if already marked and in edit mode
      if (alreadyMarked && isEditMode) {
        response = await api.put('/attendance/update', {
          subject: selectedSubject,
          date: selectedDate,
          records
        });

        setSuccessMessage(`Attendance updated successfully! ${response.data.changed} records changed.`);
        setShowSuccessModal(true);

        // Exit edit mode and return to read-only
        setIsEditMode(false);
        setIsReadOnly(true);
        setAlreadyMarked(true);
      } else {
        // Mark new attendance
        response = await api.post('/attendance/mark', {
          subject: selectedSubject,
          date: selectedDate,
          records
        });

        setSuccessMessage(`Attendance submitted successfully!`); // Processed: ${response.data.processed} students
        setShowSuccessModal(true);

        // Now it's marked, switch to read-only mode
        setAlreadyMarked(true);
        setIsReadOnly(true);
        setIsEditMode(false);
      }

      setSuccess(`Operation completed successfully!`);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to process attendance';

      // Check if attendance already marked (409 status)
      if (err.response?.status === 409 && err.response?.data?.alreadyMarked) {
        // Load the existing attendance data
        const existingData = err.response.data;
        setAlreadyMarked(true);
        setIsReadOnly(true);
        setIsEditMode(false);

        // Update attendance map with existing data
        const existingAttendance = new Map<string, boolean>();
        existingData.records.forEach((record: any) => {
          existingAttendance.set(record.studentId, record.status === 'Present');
        });
        setAttendance(existingAttendance);

        setAlreadyMarkedMessage(errorMessage);
        setShowAlreadyMarkedModal(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(
    student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.regNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = Array.from(attendance.values()).filter(p => p).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-brand-light relative">
      <ParticleBackground />
      <Sidebar />
      <MobileMenu />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-light border-2 border-primary/50 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-[slideIn_0.3s_ease-out]">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Success Title */}
              <h2 className="text-2xl font-bold text-primary mb-2">Successfully Submitted!</h2>

              {/* Success Message */}
              <p className="text-primary/60 mb-6">{successMessage}</p>

              {/* Close Button */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-6 py-3 bg-primary/20 border border-primary/50 text-primary rounded-lg hover:bg-primary/30 transition-colors font-semibold"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Already Marked Modal */}
      {showAlreadyMarkedModal && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-light border-2 border-yellow-500/50 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-[slideIn_0.3s_ease-out]">
            <div className="text-center">
              {/* Info Icon */}
              <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              {/* Info Title */}
              <h2 className="text-2xl font-bold text-primary mb-2">Already Marked</h2>

              {/* Info Message */}
              <p className="text-yellow-600 mb-6">{alreadyMarkedMessage}</p>

              {/* Close Button */}
              <button
                onClick={() => setShowAlreadyMarkedModal(false)}
                className="w-full px-6 py-3 bg-yellow-500/20 border border-yellow-500/50 text-yellow-600 rounded-lg hover:bg-yellow-500/30 transition-colors font-semibold"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 p-4 md:p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight mb-2">
                Mark <span className="opacity-10">Attendance</span>
              </h1>
              <p className="text-primary/70 font-black uppercase tracking-widest text-[10px]">Digital register for daily records</p>
            </div>
            {isEditMode && (
              <div className="px-4 py-2 bg-accent/10 border border-accent/20 text-accent rounded-2xl text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent"></span> Edit Mode Active
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <GlassCard className="p-8 mb-8 border-primary/5">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-primary tracking-tight">1. Session Configuration</h2>
                {alreadyMarked && (
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-400/20 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    Record Exists
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-primary mb-2 font-medium">Subject *</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-primary focus:outline-none focus:border-accent/50 cursor-pointer"
                    required
                  >
                    <option value="" className="bg-white text-primary">Select Subject</option>
                    {ALLOWED_SUBJECTS.map(subject => (
                      <option key={subject} value={subject} className="bg-white text-primary py-2">
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-primary mb-2 font-medium">Date *</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-primary focus:outline-none focus:border-accent/50 [color-scheme:light]"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-8">
                <button
                  type="button"
                  onClick={markAllPresent}
                  disabled={isReadOnly}
                  className="px-6 py-2 bg-primary/10 border border-primary/20 text-primary rounded-xl hover:bg-primary/20 transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm All Present
                </button>
                <button
                  type="button"
                  onClick={markAllAbsent}
                  disabled={isReadOnly}
                  className="px-6 py-2 bg-primary/5 border border-primary/10 text-text-secondary rounded-xl hover:bg-primary/10 transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark All Absent
                </button>
              </div>

              <div className="flex gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-primary/80">Present:</span>
                  <span className="text-primary bg-primary/5 px-2 py-0.5 rounded-md">{presentCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                  <span className="text-primary/80">Absent:</span>
                  <span className="text-primary bg-primary/5 px-2 py-0.5 rounded-md">{absentCount}</span>
                </div>
              </div>
            </GlassCard>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-600 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-600 px-4 py-3 rounded-lg mb-6">
                {success}
              </div>
            )}

            <GlassCard className="p-6 mb-6">
              <input
                type="text"
                placeholder="Search by name or registration number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </GlassCard>

            {loading ? (
              <GlassCard className="p-8 text-center">
                <p className="text-text-secondary/60">Loading students...</p>
              </GlassCard>
            ) : (
              <>
                <GlassCard className="p-8 mb-8 border-primary/5">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black text-primary tracking-tight">2. Student Roster</h2>
                    <p className="text-[10px] text-primary/70 font-black uppercase tracking-widest">{filteredStudents.length} Students Listed</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr className="bg-primary/5">
                          <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-primary/70">Reg No</th>
                          <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-primary/70 hidden md:table-cell">Name</th>
                          <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-primary/70 hidden md:table-cell">Email</th>
                          <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-primary/70">Current Status</th>
                          <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-primary/70">Quick Toggle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map((student) => {
                            const isPresent = attendance.get(student.id) || false;
                            return (
                              <tr key={student.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors group">
                                <td className="p-4 font-bold text-xs text-primary">{student.regNo}</td>
                                <td className="p-4 text-xs font-medium text-primary/80 hidden md:table-cell">{student.name}</td>
                                <td className="p-4 text-xs font-medium text-primary/70 italic hidden md:table-cell">{student.email}</td>
                                <td className="p-4">
                                  <span
                                    className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${isPresent
                                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                      : 'bg-primary/10 text-text-secondary border border-primary/20'
                                      }`}
                                  >
                                    {isPresent ? 'Present' : 'Absent'}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => toggleAttendance(student.id)}
                                    disabled={isReadOnly}
                                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isPresent
                                      ? 'bg-primary/5 text-text-secondary hover:bg-primary/10 hover:text-primary'
                                      : 'bg-accent text-white shadow-lg shadow-accent/20'
                                      }`}
                                  >
                                    Mark {isPresent ? 'Absent' : 'Present'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-center text-white/60">
                              No students found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>

                <div className="flex justify-end gap-4">
                  <a
                    href="/admin/attendance/view"
                    className="btn-secondary px-6 py-3"
                  >
                    View All Attendance
                  </a>

                  {alreadyMarked && isReadOnly && !isEditMode && (
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="px-8 py-3 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors font-semibold text-lg"
                    >
                      Edit Attendance
                    </button>
                  )}

                  {alreadyMarked && isEditMode && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-3 bg-gray-500/20 border border-gray-500/50 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                  )}

                  {(!alreadyMarked || isEditMode) && (
                    <button
                      type="submit"
                      disabled={submitting || !selectedSubject || (alreadyMarked && !isEditMode)}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 text-lg"
                    >
                      {submitting
                        ? (isEditMode ? 'Updating...' : 'Submitting...')
                        : (isEditMode ? 'Save Changes' : 'Submit Attendance')
                      }
                    </button>
                  )}
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
