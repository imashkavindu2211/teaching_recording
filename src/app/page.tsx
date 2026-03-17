"use client";

import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { supabase } from '@/lib/supabase';
import ClassCard from '@/components/ClassCard';
import AuthPage from '@/components/AuthPage';
import { PlayCircle, BookOpen, GraduationCap, ArrowRight, Youtube, Calendar, LogOut } from 'lucide-react';

interface PdfFile {
  name: string;
  googleDriveFileId: string;
}

interface ClassEntry {
  id: string;
  monthId: string;
  date: string;
  topic: string;
  youtubeUrl: string;
  pdfFiles: PdfFile[];
}

interface Month {
  id: string;
  name: string;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [months, setMonths] = useState<Month[]>([]);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Check for session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('student_session');
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }
  }, []);

  useEffect(() => {
    if (!user) return; // Don't fetch if not logged in

    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch months
        const { data: monthsData } = await supabase
          .from('months')
          .select('*')
          .order('id', { ascending: false });
        
        // Fetch classes with related pdf_files
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*, pdf_files(name, google_drive_file_id)')
          .order('date', { ascending: false });

        if (monthsData) setMonths(monthsData);
        if (classesData) {
          // Transform naming from DB to component expectations
          const transformed = classesData.map(c => ({
            id: c.id,
            monthId: c.month_id,
            date: c.date,
            topic: c.topic,
            youtubeUrl: c.youtube_url,
            pdfFiles: c.pdf_files.map((p: any) => ({
              name: p.name,
              googleDriveFileId: p.google_drive_file_id
            }))
          }));
          setClasses(transformed);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('student_session');
    setUser(null);
  };

  if (!user) {
    return <AuthPage onLoginSuccess={(u) => setUser(u)} />;
  }

  // Filter and sort classes
  const filteredClasses = classes.filter(c => selectedMonth === 'all' || c.monthId === selectedMonth);
  const sortedClasses = filteredClasses; // Already sorted by query

  return (
    <div className="min-h-screen pb-20 bg-transparent transition-colors duration-300">
      {/* Navbar / Header */}
      <div className="container mx-auto px-4 pt-10 flex justify-end">
        <Button 
          onClick={handleLogout}
          icon={<LogOut size={16} />}
          className="rounded-xl font-black text-[10px] uppercase tracking-widest h-12 px-6 border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex items-center gap-2 hover:text-[#DC143C] transition-all"
        >
          Logout Session
        </Button>
      </div>

      {/* Stats/Quick Info */}
      <div className="container mx-auto px-4 py-8 mb-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 dark:bg-rose-950/30 text-[#DC143C] dark:text-rose-400 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-rose-100 dark:border-rose-900/40">
              <GraduationCap size={14} />
              <span>Academic Workspace</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-[1px] mb-2">
              Learning <span className="text-[#DC143C] dark:text-rose-500 relative">
                Dashboard
                <span className="absolute bottom-2 left-0 w-full h-3 bg-[#DC143C]/10 -z-10 rounded-full" />
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 font-bold text-xl leading-relaxed max-w-2xl">
              උපාධිධාරීන් වැඩිම පිරිසක් සහභාගීවන ලංකාවේ අති දැවැන්තම online උපාධි ගුරු විභාග පන්තිය
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-3 rounded-3xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none">
            <span className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest pl-4">Priority</span>
            <div className="px-6 py-3 bg-gradient-to-r from-[#DC143C] to-rose-500 rounded-2xl text-[10px] font-black text-white shadow-xl shadow-rose-600/20 cursor-default uppercase tracking-[0.2em]">
              Newest Content
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {[
            { label: 'Available Classes', value: sortedClasses.length, sub: 'Total premium sessions', icon: <PlayCircle size={20} className="text-[#DC143C]" /> },
            { label: 'Enrollment Status', value: 'Active', sub: 'Verified student access', icon: <GraduationCap size={20} className="text-[#DC143C]" /> }
          ].map((stat, i) => (
            <div key={i} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[3rem] shadow-sm border border-white dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 transition-all duration-700 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-rose-500/10 transition-colors" />
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-[#DC143C] dark:text-rose-400">
                    {stat.icon}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">{stat.label}</p>
                </div>
                <div className="w-10 h-10 rounded-2xl border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:bg-[#DC143C] group-hover:border-[#DC143C] transition-all duration-500 rotate-12 group-hover:rotate-0">
                  <ArrowRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-white" />
                </div>
              </div>
              <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 relative z-10">{stat.value}</p>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-tight relative z-10">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* YouTube Package Ad */}
        <div className="mt-12 relative group cursor-pointer">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#DC143C] to-indigo-600 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white/60 dark:bg-slate-950/60 backdrop-blur-2xl p-8 md:p-12 rounded-[3rem] border border-white dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Youtube size={200} strokeWidth={1} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 bg-[#DC143C] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-600/40">
                <Youtube className="text-white" size={40} strokeWidth={2.5} />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                  Save Your Data
                </h3>
                <p className="text-slate-600 dark:text-slate-300 font-bold text-lg">
                  You can watch all these recordings using your standard <span className="text-[#DC143C] dark:text-rose-500 font-black">YouTube Data Package</span> with regular data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Month Selection */}
      <div className="container mx-auto px-4 mb-12">
        <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
          <button
            onClick={() => setSelectedMonth('all')}
            className={`flex-shrink-0 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              selectedMonth === 'all'
                ? 'bg-[#DC143C] text-white shadow-xl shadow-rose-500/20'
                : 'bg-white/40 dark:bg-slate-900/40 text-slate-400 hover:text-[#DC143C] backdrop-blur-md border border-white dark:border-slate-800'
            }`}
          >
            All Sessions
          </button>
          {months.map((month) => (
            <button
              key={month.id}
              onClick={() => setSelectedMonth(month.id)}
              className={`flex-shrink-0 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                selectedMonth === month.id
                  ? 'bg-[#DC143C] text-white shadow-xl shadow-rose-500/20'
                  : 'bg-white/40 dark:bg-slate-900/40 text-slate-400 hover:text-[#DC143C] backdrop-blur-md border border-white dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                {month.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Classes Grid */}
      <main className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {sortedClasses.map((classItem) => (
            <ClassCard key={classItem.id} classData={classItem} />
          ))}
        </div>

        {sortedClasses.length === 0 && (
          <div className="bg-white dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 py-24 text-center">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300 dark:text-slate-700 shadow-inner">
              <BookOpen size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">No classes found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Check back later for new recordings and resources.</p>
          </div>
        )}
      </main>
    </div>
  );
}
