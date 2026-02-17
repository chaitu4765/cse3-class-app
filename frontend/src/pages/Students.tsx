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

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userType = localStorage.getItem('userType');
  const isStudent = userType === 'student';

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

  const filteredStudents = students.filter(
    (student) =>
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
          {isStudent && (
            <div className="mb-8 p-4 bg-brand-muted border border-brand-dark/20 rounded-2xl backdrop-blur-md">
              <p className="text-[10px] text-primary font-bold tracking-widest flex items-center gap-2 uppercase">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Read-Only Student View
              </p>
            </div>
          )}

          <div className="text-center md:text-left mb-12">
            <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-brand-muted border border-brand-dark/20">
              <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">Directory</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-primary tracking-tight leading-none">
              Students<span className="opacity-10">.</span>
            </h1>
          </div>
          <p className="text-primary/40 font-black uppercase tracking-widest text-[10px] mb-10">Manage and view entire class profile</p>

          <GlassCard className="p-6 mb-8 border-primary/10">
            <input
              type="text"
              placeholder="Search by name or registration number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/50 border-primary/10 focus:border-primary/50"
            />
          </GlassCard>

          {loading ? (
            <GlassCard className="p-12 text-center border-primary/10">
              <div className="animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-4"></div>
              <p className="text-secondary/40 font-bold uppercase tracking-widest text-xs">Loading students...</p>
            </GlassCard>
          ) : error ? (
            <GlassCard className="p-8 border-red-500/20">
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-0 overflow-hidden border-primary/10">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-primary/5">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-secondary/40">Registration No</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-secondary/40 text-left">Name</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-secondary/40 text-left">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-primary/5 transition-colors">
                          <td className="p-6 font-black text-primary tracking-tight">{student.regNo}</td>
                          <td className="p-6 font-bold text-secondary">{student.name}</td>
                          <td className="p-6 text-secondary/60 font-medium">{student.email}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-12 text-center text-secondary/20 font-bold uppercase tracking-widest text-xs">
                          No students found matching your search
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

export default Students;
