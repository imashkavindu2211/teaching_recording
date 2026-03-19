"use client";

import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { supabase } from '@/lib/supabase';
import { normalizeNIC } from '@/lib/utils';
import ClassCard from '@/components/ClassCard';
import AuthPage from '@/components/AuthPage';
import { PlayCircle, BookOpen, GraduationCap, ArrowRight, Youtube, Calendar, LogOut, Lock, Unlock } from 'lucide-react';
import { Modal, Form, Input, message, App } from 'antd';

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
  access_code?: string;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [months, setMonths] = useState<Month[]>([]);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [unlockedMonths, setUnlockedMonths] = useState<string[]>([]);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [pendingMonth, setPendingMonth] = useState<Month | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessForm] = Form.useForm();
  const { message: messageApi } = App.useApp();

  // Check for session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('student_session');
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }

    // Load unlocked months from session storage (optional, keeps them unlocked until tab closed)
    const savedUnlocked = sessionStorage.getItem('unlocked_months');
    if (savedUnlocked) {
      setUnlockedMonths(JSON.parse(savedUnlocked));
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

        if (monthsData) {
          setMonths(monthsData);
          if (monthsData.length > 0 && !selectedMonth) {
            setSelectedMonth(monthsData[0].id);
          }
        }
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
    sessionStorage.removeItem('unlocked_months');
    setUser(null);
  };

  const verifyAccess = (monthId: string) => {
    if (monthId === 'all') {
      setSelectedMonth('all');
      return;
    }

    const month = months.find(m => m.id === monthId);
    if (!month) return;

    if (unlockedMonths.includes(monthId)) {
      setSelectedMonth(monthId);
    } else {
      setPendingMonth(month);
      setIsAccessModalOpen(true);
    }
  };

  const handleAccessSubmit = (values: any) => {
    if (!pendingMonth) return;

    // 1. Verify ID Number (NIC) match
    if (normalizeNIC(values.nic) !== normalizeNIC(user?.nic)) {
      messageApi.error("ID Number (NIC) does not match your registered identity.");
      return;
    }

    // 2. Verify Access Code
    if (values.accessCode.toUpperCase() !== pendingMonth.access_code?.toUpperCase()) {
      messageApi.error("Incorrect Access Code for this month.");
      return;
    }

    // 3. Unlock & Select
    const newUnlocked = [...unlockedMonths, pendingMonth.id];
    setUnlockedMonths(newUnlocked);
    sessionStorage.setItem('unlocked_months', JSON.stringify(newUnlocked));
    setSelectedMonth(pendingMonth.id);
    setIsAccessModalOpen(false);
    setPendingMonth(null);
    accessForm.resetFields();
    messageApi.success(`${pendingMonth.name} recordings unlocked!`);
  };

  if (!user) {
    return <AuthPage onLoginSuccess={(u) => setUser(u)} />;
  }

  // Filter and sort classes
  const isMonthUnlocked = unlockedMonths.includes(selectedMonth) || selectedMonth === 'all';
  const filteredClasses = isMonthUnlocked ? classes.filter(c => c.monthId === selectedMonth) : [];
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 dark:bg-rose-950/30 text-[#DC143C] dark:text-rose-400 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-rose-100 dark:border-rose-900/40 shadow-sm shadow-rose-200/20">
              <GraduationCap size={14} />
              <span>Amarasri Herath Education Institute</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-[1px] mb-2">
              Recording <span className="text-[#DC143C] dark:text-rose-500 relative">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[
            { label: 'Available Classes', value: sortedClasses.length, sub: 'Total premium sessions', icon: <PlayCircle size={20} className="text-[#DC143C]" /> },
            { label: 'Enrollment Status', value: 'Active', sub: 'Verified student access', icon: <GraduationCap size={20} className="text-[#DC143C]" /> },
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[3rem] shadow-sm border border-white dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 transition-all duration-700 group relative overflow-hidden`}
            >
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
              <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 relative z-10">{stat.value}</p>
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
                <p className="text-slate-600 dark:text-slate-300 font-bold text-lg leading-relaxed">
                  ඔබට මෙම සියලු Recordings <span className="text-[#DC143C] dark:text-rose-500 font-black">YouTube පැකේජය</span> ඔස්සේ නැරඹීමට අවස්ථාව ලබා දී ඇත.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Month Selection */}
      <div className="container mx-auto px-4 mb-12">
        <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
          {months.map((month) => {
            const isUnlocked = unlockedMonths.includes(month.id);
            return (
              <button
                key={month.id}
                onClick={() => verifyAccess(month.id)}
                className={`flex-shrink-0 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all relative ${selectedMonth === month.id
                  ? 'bg-[#DC143C] text-white shadow-xl shadow-rose-500/20'
                  : 'bg-white/40 dark:bg-slate-900/40 text-slate-400 hover:text-[#DC143C] backdrop-blur-md border border-white dark:border-slate-800'
                  }`}
              >
                <div className="flex items-center gap-2">
                  {isUnlocked ? <Unlock size={14} className="text-emerald-500" /> : <Lock size={14} className="opacity-50" />}
                  {month.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Classes Grid */}
      <main className="container mx-auto px-4">
        {sortedClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {sortedClasses.map((classItem) => (
              <ClassCard key={classItem.id} classData={classItem} />
            ))}
          </div>
        ) : (
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 py-24 text-center">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300 dark:text-slate-700 shadow-inner">
              {!isMonthUnlocked ? <Lock size={48} className="text-[#DC143C] animate-pulse" /> : <BookOpen size={48} />}
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
              {!isMonthUnlocked ? "Access Restricted" : "No recordings found"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-3 font-bold max-w-md mx-auto leading-relaxed px-6">
              {!isMonthUnlocked
                ? "This month's recordings are protected by a secure protocol. Please click the month tab above and enter your security code to unlock access."
                : selectedMonth === 'all'
                  ? "There are currently no free sessions available for preview."
                  : "Recordings for this period have not been deployed yet. Please check back later."}
            </p>
          </div>
        )}
      </main>

      {/* Access Verification Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#DC143C] rounded-xl flex items-center justify-center text-white shadow-xl">
              <Lock size={20} />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight dark:text-white">Protocol Verification</div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Unlock {pendingMonth?.name}</div>
            </div>
          </div>
        }
        open={isAccessModalOpen}
        onCancel={() => setIsAccessModalOpen(false)}
        footer={null}
        centered
        width={450}
        destroyOnHidden
        styles={{
          mask: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(2, 6, 23, 0.4)' },
          body: { padding: '24px', background: 'transparent' }
        }}
        className="dark:bg-slate-900/90 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden border border-white/20"
      >
        <Form form={accessForm} layout="vertical" onFinish={handleAccessSubmit} className="space-y-6 pt-4">
          <Form.Item
            name="nic"
            label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Student ID Number (NIC)</span>}
            rules={[{ required: true, message: 'ID Number required' }]}
          >
            <Input
              placeholder="Enter your registered NIC Number"
              className="h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-black px-6"
            />
          </Form.Item>
          <Form.Item
            name="accessCode"
            label={<span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Monthly Secure Code</span>}
            rules={[{ required: true, message: 'Access code required' }]}
          >
            <Input
              placeholder="6-digit code"
              className="h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-black px-6 uppercase tracking-[0.5em] text-center"
              maxLength={6}
            />
          </Form.Item>

          <div className="flex flex-col gap-4 pt-4">
            <Button
              type="primary"
              htmlType="submit"
              block
              className="h-16 bg-[#DC143C] hover:bg-rose-700 active:scale-95 transition-all rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-rose-600/20"
            >
              Unlock Access
            </Button>
            <Button
              type="text"
              block
              onClick={() => setIsAccessModalOpen(false)}
              className="h-12 font-bold text-slate-400 hover:text-slate-200"
            >
              Cancel Access Request
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
