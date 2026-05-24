"use client";

import React from 'react';
import { Lock, GraduationCap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen pb-20 bg-transparent flex items-center justify-center px-4">
      <div className="container mx-auto max-w-3xl relative z-20 mt-10 md:mt-0">
        <div className="relative group rounded-[3rem] p-[3px] overflow-hidden shadow-[0_0_40px_rgba(220,20,60,0.15)] dark:shadow-[0_0_40px_rgba(220,20,60,0.3)]">
          {/* Animated Glowing Border Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-[#DC143C] to-indigo-600 opacity-80 animate-pulse"></div>
          
          <div className="relative bg-white/95 dark:bg-[#0a0205]/95 backdrop-blur-3xl px-6 py-16 md:py-24 md:px-12 rounded-[2.8rem] text-center overflow-hidden">
            
            {/* Ambient Background Orbs */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-[#DC143C]/10 dark:bg-[#DC143C]/20 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mb-8 border border-rose-100 dark:border-rose-900/50 shadow-inner">
                <Lock size={32} className="text-[#DC143C]" />
              </div>

              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 shadow-sm backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC143C] animate-ping absolute" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC143C] relative" />
                <span className="text-[#DC143C] dark:text-rose-400 text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase">System Notice</span>
              </div>

              {/* Main Text */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-[1px] mb-6">
                Platform <span className="text-[#DC143C] dark:text-rose-500 relative">
                  Closed
                  <span className="absolute bottom-2 left-0 w-full h-3 bg-[#DC143C]/10 -z-10 rounded-full" />
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto mb-10">
                The Graduate Teachers' Exam has concluded. Thank you to everyone who participated, and we wish you the best of luck with your results!
              </p>

              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
                <GraduationCap size={18} className="text-[#DC143C]" />
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Amarasri Herath Education Institute
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
