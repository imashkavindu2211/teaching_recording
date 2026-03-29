import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@/components/ThemeProvider';
import MainHeader from '@/components/MainHeader';
import { Suspense } from 'react';
import { Youtube, Facebook, MessageCircle } from 'lucide-react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Amarasri Herath - Modern LMS",
  description: "A professional Learning Management System for watching class recordings and downloading lecture notes.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300`}
      >
        <ThemeProvider>
            <div className="flex flex-col min-h-screen relative overflow-hidden">
              {/* Modern Background Elements */}
              <div className="fixed inset-0 -z-10 bg-white dark:bg-[#020617] transition-colors duration-500" />
              <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-40 dark:opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-100 dark:bg-rose-900/20 rounded-full blur-[120px] animate-blob" />
                <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] bg-crimson-50 dark:bg-rose-950/20 rounded-full blur-[80px] animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] bg-slate-100 dark:bg-slate-900/30 rounded-full blur-[100px] animate-blob animation-delay-4000" />
              </div>

              <Suspense fallback={<div className="h-20 w-full bg-white/60 dark:bg-[#020617]/60" />}>
                <MainHeader />
              </Suspense>

              <main className="flex-grow z-10 flex flex-col">
                <Suspense fallback={<div className="flex-1 flex items-center justify-center p-20 animate-pulse text-slate-300">MODERN LMS PROTOCOL INITIALIZING...</div>}>
                  {children}
                </Suspense>
              </main>
              <footer className="border-t border-slate-200/50 dark:border-slate-800/50 py-16 bg-white/30 dark:bg-[#020617]/30 backdrop-blur-md">
                <div className="container mx-auto px-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#DC143C] rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                          <span className="text-white font-black text-xl">A</span>
                        </div>
                        <span className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white">Amarasri Herath</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed">
                        Leading the way in professional teacher examinations with the largest online graduate community in Sri Lanka.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Social Registry</h4>
                      <div className="flex flex-col gap-4">
                        <a href="https://share.google/wmd5iJktEAde8MMzf" target="_blank" className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-[#DC143C] dark:hover:text-rose-400 transition-all font-bold group">
                          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm">
                            <Youtube size={18} className="text-[#DC143C] dark:text-rose-400" />
                          </div>
                          YouTube Channel
                        </a>
                        <a href="https://www.tiktok.com/@amarasri.hearath?_r=1&_t=ZS-94lHRFH7PUd" target="_blank" className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-all font-bold group">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm">
                            <span className="text-slate-900 dark:text-white text-[10px] font-black tracking-tighter">TIKTOK</span>
                          </div>
                          TikTok Profile
                        </a>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Facebook Connect</h4>
                      <div className="flex flex-col gap-4">
                        <a href="https://facebook.com/amarasriherath.lk" target="_blank" className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-all font-bold group">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm">
                            <Facebook size={18} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          Official Page
                        </a>
                        <a href="https://facebook.com/groups/1323185674446913" target="_blank" className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-all font-bold group">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm">
                            <Facebook size={18} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          Academic Group
                        </a>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Direct Communication</h4>
                      <div className="flex flex-col gap-4">
                        <a href="https://wa.me/94760919526" target="_blank" className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 transition-all font-bold group">
                          <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center group-hover:scale-110 transition-all shadow-sm">
                            <MessageCircle size={18} className="text-green-600 dark:text-green-400" />
                          </div>
                          WhatsApp Hotline
                        </a>
                        <div className="p-4 bg-green-500/5 rounded-2xl border border-green-500/10 flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">System Online</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-[0.3em] uppercase">© Copyright by Amarasri Herath Technical Team</p>
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest cursor-default hover:text-[#DC143C] transition-colors">Privacy</span>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest cursor-default hover:text-[#DC143C] transition-colors">Compliance</span>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
