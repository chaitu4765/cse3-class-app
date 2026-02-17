import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import api from '../api/axios';
import ParticleBackground from '../components/ParticleBackground';

const StudentLogin = () => {
  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regNo || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      console.log('Sending request:', { regNo: regNo.trim(), password });

      // Call the attendance lookup API (no JWT token returned)
      const response = await api.post('/attendance/lookup', {
        regNo: regNo.trim(),
        password: password.trim()
      });

      console.log('Response received:', response.data);

      const { name, regNo: studentRegNo, attendance } = response.data;

      // Store student info (no token for students - just lookup data)
      const studentData = {
        name,
        regNo: studentRegNo,
        password: password.trim(), // Store password for future use/verification
        attendance
      };

      console.log('Storing student data:', studentData);

      // Clear any existing admin session
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      localStorage.setItem('student', JSON.stringify(studentData));
      localStorage.setItem('userType', 'student');

      console.log('Navigating to dashboard...');
      navigate('/student/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-brand-light">
      <ParticleBackground />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>

      <GlassCard className="w-full max-w-md p-10 relative z-10 border-primary/10 bg-white/80">
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-primary/10 border border-primary/20 text-primary">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Student Access</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-primary tracking-tight mb-3">
            Student<span className="opacity-10">.</span>
          </h1>
          <p className="text-secondary/60 font-black uppercase tracking-widest text-[10px]">Enter credentials for academic records</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-secondary/50 text-xs font-bold uppercase tracking-wider ml-1">Registration Number</label>
            <input
              type="text"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              placeholder="324506402***"
              disabled={loading}
              className="w-full h-14 px-6 rounded-xl bg-brand-light border border-primary/10 focus:border-primary/50 text-secondary placeholder:text-secondary/20 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-secondary/50 text-xs font-bold uppercase tracking-wider ml-1">Mobile Number (Password)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your 10-digit mobile number"
              disabled={loading}
              className="w-full h-14 px-6 rounded-xl bg-brand-light border border-primary/10 focus:border-primary/50 text-secondary placeholder:text-secondary/20 outline-none transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-2xl text-xs font-medium backdrop-blur-md animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-lg"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                Verifying...
              </div>
            ) : 'Login to Dashboard'}
          </button>
        </form>
      </GlassCard>
    </div>
  );
};

export default StudentLogin;
