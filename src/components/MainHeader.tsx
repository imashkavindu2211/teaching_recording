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
    sessionStorage.removeItem('unlocked_months');
    sessionStorage.removeItem('admin_authenticated');
    setUser(null);
    window.location.href = '/'; 
  };

  const setView = (newView: string) => {
    router.push(`/?view=${newView}`);
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-white/5 bg-slate-950 transition-all h-20 flex items-center shadow-2xl">
      <div className="container mx-auto px-6 flex items-center justify-between">
        
        {/* Brand Logo - RKR */}
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#DC143C] to-rose-700 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-all">
            <span className="text-white font-black text-lg md:text-xl tracking-tighter">A</span>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl md:text-2xl tracking-tighter text-white leading-none">Stream <span className="text-[#DC143C]">LMS</span></span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-8 mr-6">
                <a href="/" className="text-sm font-black text-slate-300 hover:text-[#DC143C] transition-all tracking-tight">
                  Dashboard
                </a>
                <a href="/admin" className="text-sm font-black text-slate-300 hover:text-[#DC143C] transition-all tracking-tight">
                  Admin Portal
                </a>
              </div>
              
              <button 
                onClick={onLogout}
                className="hidden md:flex px-6 py-2.5 bg-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#DC143C] transition-all shadow-sm items-center gap-2"
              >
                <LogOut size={14} /> Log Out
              </button>

              {/* HIGH-VISIBILITY MOBILE TOGGLE */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 z-[2000] border-2 
                  ${isMobileMenuOpen 
                    ? 'bg-[#DC143C] border-[#DC143C] rotate-90 shadow-lg' 
                    : 'bg-white border-white shadow-xl shadow-white/10'}
                `}
              >
                <div className="relative w-6 h-5 flex flex-col justify-between items-center transition-transform">
                    <span className={`block h-0.5 w-6 rounded-full transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'bg-white rotate-45 translate-y-2' : 'bg-slate-950'}`} />
                    <span className={`block h-0.5 w-6 rounded-full transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'bg-white opacity-0' : 'bg-slate-950'}`} />
                    <span className={`block h-0.5 w-6 rounded-full transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'bg-white -rotate-45 -translate-y-2.5' : 'bg-slate-950'}`} />
                </div>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 scale-90 md:scale-100">
              <button 
                onClick={() => setView('login')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${
                  view === 'login' 
                    ? 'bg-white text-slate-900 shadow-xl scale-100' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn size={14} className="hidden sm:block" /> Log In
              </button>
              <button 
                onClick={() => setView('register')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${
                  view === 'register' 
                    ? 'bg-white text-slate-900 shadow-xl scale-100' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus size={14} className="hidden sm:block" /> Register
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Premium Mobile Menu Overlay */}
      <div className={`
        md:hidden fixed inset-0 z-50 transition-all duration-500 ease-in-out
        ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}>
        {/* Backdrop Backdrop */}
        <div 
          className="absolute inset-0 bg-[#020617]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Menu Content */}
        <div className={`
          absolute top-0 right-0 h-full w-[80%] max-w-[400px] bg-[#020617] border-l border-white/10 shadow-2xl transition-transform duration-500 ease-out flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#DC143C] rounded-xl flex items-center justify-center">
                    <span className="text-white font-black">A</span>
                </div>
                <span className="text-white font-black text-lg tracking-tight">Main Menu</span>
            </div>
          </div>

          {/* User Profile Info */}
          <div className="p-8 bg-gradient-to-br from-[#DC143C]/10 to-transparent">
             <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                    <ShieldCheck className="text-[#DC143C]" size={28} />
                </div>
                <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Active Student</span>
                    <span className="text-white font-black text-lg truncate w-32">{user?.fullname?.split(' ')[0] || 'Member'}</span>
                </div>
             </div>
          </div>

          {/* Nav Links */}
          <div className="flex-1 p-8 space-y-4">
            <a 
              href="/" 
              className="group flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-[#DC143C]/30 transition-all"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-900 rounded-lg group-hover:bg-[#DC143C] transition-colors">
                    <Youtube size={18} className="text-white" />
                </div>
                <span className="text-white font-black tracking-tight">Student Dashboard</span>
              </div>
              <LogIn size={14} className="text-slate-500 group-hover:text-white transition-colors" />
            </a>
            
            <div className="pt-8">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 pl-2">Social Hub</div>
                <div className="grid grid-cols-2 gap-3">
                    <a href="#" className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-[#DC143C]/10 transition-all">
                        <Facebook size={20} className="text-blue-500" />
                        <span className="text-[10px] font-black text-white uppercase">Community</span>
                    </a>
                    <a href="#" className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-green-500/10 transition-all">
                        <MessageCircle size={20} className="text-green-500" />
                        <span className="text-[10px] font-black text-white uppercase">WhatsApp</span>
                    </a>
                </div>
            </div>
          </div>

          {/* Footer / Logout */}
          <div className="p-8 mt-auto">
            <button 
                onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                className="w-full py-5 bg-[#DC143C] text-white rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-xl shadow-rose-950/40 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
                <LogOut size={16} /> Logout Session
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
