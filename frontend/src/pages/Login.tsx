import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { motion } from 'framer-motion';
import ParticleBackground from '../components/ParticleBackground';

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (!identifier || !password) {
            setError('Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            const response = await api.post('/auth/unified-login', {
                identifier: identifier.trim(),
                password: password.trim()
            });
            const { role, token, user } = response.data;
            localStorage.clear();
            if (role === 'CR') {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                navigate('/admin/dashboard');
            } else if (role === 'student') {
                localStorage.setItem('student', JSON.stringify(user));
                localStorage.setItem('userType', 'student');
                navigate('/student/dashboard');
            } else {
                setError('Unknown role returned from server');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-brand-light overflow-hidden font-sans">
            <ParticleBackground />

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
                {/* Hero Title */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-center max-w-4xl mb-16"
                >
                    <h1 className="text-7xl md:text-9xl font-black text-primary tracking-tighter leading-none mb-6">
                        Welcome <span className="inline-block hover:scale-105 transition-transform duration-500">🏛️</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-primary/60 font-medium tracking-tight">
                        Authenticating into your class portal
                    </p>
                </motion.div>

                {/* Login Pill Form */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 shadow-[0_32px_100px_-20px_rgba(83,125,150,0.1)] border border-brand-light/20">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="Username or ID"
                                    className="w-full h-16 px-8 rounded-full bg-brand-light border border-primary/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-lg font-bold placeholder:text-primary/20 text-primary"
                                />
                            </div>

                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Security Key"
                                    className="w-full h-16 px-8 rounded-full bg-brand-light border border-primary/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-lg font-bold placeholder:text-primary/20 text-primary"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest"
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-red-500 text-sm font-bold ml-6"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 bg-primary text-white rounded-full font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                                >
                                    {loading ? 'Entering...' : 'Enter Console'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
