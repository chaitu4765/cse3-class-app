import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import GlassCard from '../components/GlassCard';
import MobileMenu from '../components/MobileMenu';
import ParticleBackground from '../components/ParticleBackground';

const TimeTable = () => {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const [selectedDay, setSelectedDay] = useState(days[0]);

    const timetableData: { [key: string]: { [key: string]: string | null } } = {
        MON: {
            '09:00 - 10:40': 'DBMS LAB-1 / ALC LAB-2',
            '10:40 - 12:20': 'MP',
            '12:20 - 01:30': null,
            '01:30 - 03:10': 'ME',
            '03:10 - 04:00': 'NCC / NSS'
        },
        TUE: {
            '09:00 - 10:40': 'FLAT',
            '10:40 - 12:20': 'DAA',
            '12:20 - 01:30': null,
            '01:30 - 03:10': 'WT LAB-2 / ALC LAB-1',
            '03:10 - 04:00': 'NCC / NSS'
        },
        WED: {
            '09:00 - 10:40': 'PEHV',
            '10:40 - 12:20': 'DBMS',
            '12:20 - 01:30': null,
            '01:30 - 03:10': 'WT LAB-1 / DBMS LAB-2',
            '03:10 - 04:00': 'NCC / NSS'
        },
        THU: {
            '09:00 - 10:40': 'DAA',
            '10:40 - 12:20': 'MP',
            '12:20 - 01:30': null,
            '01:30 - 03:10': 'ME',
            '03:10 - 04:00': 'NCC / NSS'
        },
        FRI: {
            '09:00 - 10:40': 'FLAT',
            '10:40 - 12:20': 'DBMS',
            '12:20 - 01:30': null,
            '01:30 - 03:10': 'REMEDIAL CLASS',
            '03:10 - 04:00': 'NCC / NSS'
        },
        SAT: {
            '09:00 - 10:40': 'LIBRARY / SELF-STUDY',
            '10:40 - 12:20': 'LIBRARY / SELF-STUDY',
            '12:20 - 01:30': null,
            '01:30 - 04:00': 'SWATCH BHARATH'
        }
    };

    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-brand-light relative">
            <ParticleBackground />
            <Sidebar />
            <MobileMenu />
            <div className="flex-1 p-4 md:p-8 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center md:text-left mb-12">
                        <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-brand-muted border border-brand-dark/20 text-primary">
                            <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">Schedule</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-primary tracking-tight leading-none">
                            Timetable<span className="opacity-10">.</span>
                        </h1>
                    </div>
                    <p className="text-primary/40 font-black uppercase tracking-widest text-[10px] mb-10 text-center md:text-left">Weekly schedule for CSE 3</p>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-10">
                        {days.map((day) => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedDay === day
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                    : 'bg-white/50 text-secondary/40 border border-primary/5 hover:bg-primary/5 hover:text-primary'
                                    }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    <GlassCard className="p-0 overflow-hidden border-primary/10">
                        <div className="grid grid-cols-1 divide-y divide-primary/5">
                            {Object.entries(timetableData[selectedDay]).map(([timeSlot, subject], index) => (
                                <div
                                    key={index}
                                    className="group hover:bg-primary/5 transition-all p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 md:w-24 text-[10px] font-black text-primary/40 uppercase tracking-widest bg-primary/5 px-3 py-2 rounded-xl text-center group-hover:bg-primary/10 transition-colors">
                                            {timeSlot}
                                        </div>
                                        <div>
                                            <h3 className="text-xl md:text-2xl font-black text-secondary tracking-tight">
                                                {subject || (
                                                    <span className="text-secondary/20 italic font-medium">Free Period</span>
                                                )}
                                            </h3>
                                            {subject && (
                                                <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mt-1">Core Subject</p>
                                            )}
                                        </div>
                                    </div>
                                    {subject ? (
                                        <div className="flex items-center gap-2 self-end md:self-auto">
                                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                            <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Active Session</span>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-2 bg-secondary/5 rounded-xl text-[10px] font-black text-secondary/20 uppercase tracking-widest self-end md:self-auto">
                                            Break
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassCard className="p-8 border-primary/5">
                            <h3 className="text-xl font-black text-primary mb-6 flex items-center gap-3">
                                <span className="p-2 bg-accent/10 rounded-xl text-accent">ℹ️</span> General Information
                            </h3>
                            <ul className="space-y-3 text-text-secondary text-sm">
                                <li className="flex justify-between border-b border-primary/5 pb-2">
                                    <span>Class Mode</span>
                                    <span className="text-blue-600 font-semibold">OFFLINE</span>
                                </li>
                                <li className="flex justify-between border-b border-primary/5 pb-2">
                                    <span>Revised W.E.F</span>
                                    <span className="text-primary font-medium">19-01-2026</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Room Number</span>
                                    <span className="text-primary font-medium">NSFCL-1</span>
                                </li>
                            </ul>
                        </GlassCard>

                        <GlassCard className="p-8 border-primary/5">
                            <h3 className="text-xl font-black text-primary mb-6 flex items-center gap-3">
                                <span className="p-2 bg-primary/10 rounded-xl text-primary">📅</span> Special Notations
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                    <p className="text-accent font-bold mb-1">ALC LAB-1/2</p>
                                    <p className="text-text-secondary">Algorithms Lab through c++</p>
                                </div>
                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                    <p className="text-accent font-bold mb-1">WT LAB</p>
                                    <p className="text-text-secondary">Web Technologies Lab</p>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeTable;
