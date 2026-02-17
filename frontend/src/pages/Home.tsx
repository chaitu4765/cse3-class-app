import { Link } from 'react-router-dom';
import ParticleBackground from '../components/ParticleBackground';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div className="relative min-h-screen bg-brand-light overflow-hidden font-sans">
      <ParticleBackground />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <span className="px-4 py-1.5 rounded-full bg-brand-muted border border-brand-dark/20 text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">
            Official Class Portal
          </span>
        </motion.div>

        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-8xl md:text-[12rem] font-black text-primary tracking-tighter leading-none mb-8"
        >
          CSE <span className="opacity-10">3.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-primary/60 font-medium tracking-tight mb-16 max-w-2xl"
        >
          The next-generation interface for Computer Science & Engineering students
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <Link
            to="/login"
            className="px-12 py-5 bg-primary text-white rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-[0_20px_40px_-10px_rgba(83,125,150,0.3)]"
          >
            Enter Portal
          </Link>
        </motion.div>

      </div>
    </div>
  );
};

export default Home;
