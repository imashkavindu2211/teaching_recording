"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Youtube, Facebook, MessageCircle, LogOut, ShieldCheck, UserPlus, LogIn } from 'lucide-react';

export default function MainHeader() {
  const [user, setUser] = useState<any>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get('view') || 'login';

  useEffect(() => {
    const savedUser = localStorage.getItem('student_session');
    if (savedUser) setUser(JSON.parse(savedUser));

    // Listen for storage changes (for sync across tabs/components)
    const handleStorage = () => {
      const updatedUser = localStorage.getItem('student_session');
      setUser(updatedUser ? JSON.parse(updatedUser) : null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const onLogout = () => {
    localStorage.removeItem('student_session');
    setUser(null);
    window.location.href = '/'; 
  };

  const setView = (newView: string) => {
    router.push(`/?view=${newView}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950 backdrop-blur-xl transition-all h-20 flex items-center shadow-2xl">
      <div className="container mx-auto px-6 flex items-center justify-between">
        
        {/* Brand Logo - RKR */}
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-12 h-12 bg-gradient-to-br from-[#DC143C] to-rose-700 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-all">
            <span className="text-white font-black text-xl tracking-tighter">A</span>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter text-white leading-none">Stream <span className="text-[#DC143C]">LMS</span></span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-8 mr-6">
                <a href="/" className="text-sm font-black text-slate-300 hover:text-[#DC143C] transition-all tracking-tight flex items-center gap-2">
                  Dashboard
                </a>
                <a href="/admin" className="text-sm font-black text-slate-300 hover:text-[#DC143C] transition-all tracking-tight flex items-center gap-2">
                  Admin Portal
                </a>
              </div>
              <button 
                onClick={onLogout}
                className="px-6 py-2.5 bg-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#DC143C] transition-all shadow-sm flex items-center gap-2"
              >
                <LogOut size={14} /> Log Out
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10">
              <button 
                onClick={() => setView('login')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                  view === 'login' 
                    ? 'bg-white text-slate-900 shadow-xl scale-100' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn size={14} /> Log In
              </button>
              <button 
                onClick={() => setView('register')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                  view === 'register' 
                    ? 'bg-white text-slate-900 shadow-xl scale-100' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus size={14} /> Register
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
