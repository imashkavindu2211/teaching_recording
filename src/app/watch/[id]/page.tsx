"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Dropdown, MenuProps } from 'antd';
import { Layout, Youtube, ChevronLeft, Calendar, FileText, Play, Pause, RotateCcw, FastForward, Rewind, Maximize, Settings, Gauge, RotateCw, GraduationCap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PdfFile {
  name: string;
  googleDriveFileId: string;
}

interface ClassEntry {
  id: string;
  date: string;
  topic: string;
  youtubeUrl: string;
  pdfFiles: PdfFile[];
}

const WatchPage = () => {
    const params = useParams();
    const router = useRouter();
    const classId = params?.id as string;
    const [classData, setClassData] = useState<ClassEntry | null>(null);
    const [dataError, setDataError] = useState(false);
    
    // Player states
    const [player, setPlayer] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [availableQualities, setAvailableQualities] = useState<string[]>([]);
    const [currentQuality, setCurrentQuality] = useState<string>('auto');
    const [availablePlaybackRates, setAvailablePlaybackRates] = useState<number[]>([1]);
    const [currentPlaybackRate, setCurrentPlaybackRate] = useState<number>(1);
    const [rotation, setRotation] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [skipFeedback, setSkipFeedback] = useState<{ show: boolean, type: 'forward' | 'rewind' }>({ show: false, type: 'forward' });
    
    // Refs
    const playerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastTapRef = useRef<{time: number, x: number}>({ time: 0, x: 0 });
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [allClasses, setAllClasses] = useState<ClassEntry[]>([]);

    // Parallel Initialization: Load script immediately on mount
    useEffect(() => {
        if (!(window as any).YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }
    }, []);

    useEffect(() => {
        if (!classId) return;

        async function fetchData() {
            try {
                // Fetch current class
                const { data, error } = await supabase
                    .from('classes')
                    .select('*, pdf_files(name, google_drive_file_id)')
                    .eq('id', classId)
                    .single();

                if (error || !data) {
                    setDataError(true);
                    return;
                }

                setClassData({
                    id: data.id,
                    date: data.date,
                    topic: data.topic,
                    youtubeUrl: data.youtube_url,
                    pdfFiles: data.pdf_files.map((p: any) => ({
                        name: p.name,
                        googleDriveFileId: p.google_drive_file_id
                    }))
                });

                // Fetch other classes for sidebar (related content like YouTube)
                const { data: others } = await supabase
                    .from('classes')
                    .select('id, topic, date, youtube_url')
                    .neq('id', classId)
                    .limit(8);
                
                if (others) setAllClasses(others as any);

            } catch (err) {
                console.error("Fetch error:", err);
                setDataError(true);
            }
        }

        fetchData();
    }, [classId]);

    // Redirect if invalid ID after some time
    useEffect(() => {
        if (dataError) {
            const timer = setTimeout(() => router.push('/'), 3000);
            return () => clearTimeout(timer);
        }
    }, [dataError, router]);

    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = classData ? getYouTubeId(classData.youtubeUrl) : null;

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    // YouTube IFrame API Initialization
    useEffect(() => {
        if (!videoId) return;

        const initPlayer = () => {
            if (player) {
                try { player.destroy(); } catch (e) {}
                setPlayer(null);
            }

            const element = document.getElementById('player-container');
            if (!element) return;

            new (window as any).YT.Player('player-container', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                    disablekb: 1,
                    origin: typeof window !== 'undefined' ? window.location.origin : '',
                    playsinline: 1,
                    fs: 1
                },
                events: {
                    onReady: (event: any) => {
                        setPlayer(event.target);
                        setDuration(event.target.getDuration());
                        setAvailableQualities(event.target.getAvailableQualityLevels());
                        setCurrentQuality(event.target.getPlaybackQuality());
                        setAvailablePlaybackRates(event.target.getAvailablePlaybackRates());
                        setCurrentPlaybackRate(event.target.getPlaybackRate());
                        setIsLoading(false);
                        event.target.playVideo();
                    },
                    onStateChange: (event: any) => {
                        const state = event.data;
                        setIsPlaying(state === (window as any).YT.PlayerState.PLAYING);
                        if (state === (window as any).YT.PlayerState.ENDED) {
                            setProgress(100);
                            setIsPlaying(false);
                        }
                    }
                }
            });
        };

        const checkYT = setInterval(() => {
            if ((window as any).YT && (window as any).YT.Player) {
                clearInterval(checkYT);
                initPlayer();
            }
        }, 50);

        return () => clearInterval(checkYT);
    }, [videoId]);

    // Keyboard Shortcuts (Standard YouTube Bindings)
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as any).tagName)) return;
            
            switch(e.key.toLowerCase()) {
                case 'k': e.preventDefault(); togglePlay(); break;
                case 'j': e.preventDefault(); skip(-10); break;
                case 'l': e.preventDefault(); skip(10); break;
                case 'f': e.preventDefault(); toggleFullScreen(); break;
                case 'm': e.preventDefault(); if(player) player.isMuted() ? player.unMute() : player.mute(); break;
                case 't': e.preventDefault(); setIsTheaterMode(!isTheaterMode); break;
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [player, isPlaying, isTheaterMode]);

    // Update progress state while playing
    useEffect(() => {
        let interval: any;
        if (player && isPlaying) {
            interval = setInterval(() => {
                const current = player.getCurrentTime();
                setCurrentTime(current);
                setProgress((current / duration) * 100);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [player, isPlaying, duration]);

    // Auto-hide controls
    useEffect(() => {
        if (isPlaying && showControls) {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        } else if (!isPlaying) {
            setShowControls(true);
        }
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, [isPlaying, showControls]);

    const togglePlay = () => {
        if (!player) return;
        if (isPlaying) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    };

    const skip = (seconds: number) => {
        if (!player) return;
        try {
            const current = player.getCurrentTime();
            const newTime = Math.max(0, Math.min(duration, current + seconds));
            player.seekTo(newTime, true);
            
            setSkipFeedback({ show: true, type: seconds > 0 ? 'forward' : 'rewind' });
            if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
            skipTimeoutRef.current = setTimeout(() => setSkipFeedback({ show: false, type: 'forward' }), 800);
        } catch (e) {
            console.error("Error seeking:", e);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!player) return;
        const seekTo = (parseFloat(e.target.value) / 100) * duration;
        player.seekTo(seekTo, true);
        setProgress(parseFloat(e.target.value));
        setCurrentTime(seekTo);
    };

    const toggleFullScreen = () => {
        const el = playerRef.current;
        if (!el) return;
        const doc = document as any;
        const element = el as any;
        if (!doc.fullscreenElement && !doc.webkitFullscreenElement && !doc.mozFullScreenElement && !doc.msFullscreenElement) {
            const requestMethod = element.requestFullscreen || element.webkitRequestFullscreen || element.mozRequestFullScreen || element.msRequestFullscreen;
            if (requestMethod) requestMethod.call(element).catch((err: any) => console.error(err));
        } else {
            const exitMethod = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
            if (exitMethod) exitMethod.call(doc);
        }
    };

    const handleRotate = () => {
        const newRotation = (rotation + 90) % 360;
        setRotation(newRotation);
        if ((newRotation === 90 || newRotation === 270) && typeof window !== 'undefined') {
          const doc = document as any;
          if (!doc.fullscreenElement && !doc.webkitFullscreenElement) toggleFullScreen();
        }
    };

    const settingsMenu: MenuProps = React.useMemo(() => ({
        items: [
          {
            key: 'speed',
            label: `Playback Speed: ${currentPlaybackRate === 1 ? 'Normal' : currentPlaybackRate + 'x'}`,
            icon: <Gauge size={16} />,
            children: availablePlaybackRates.map((rate) => ({
              key: `speed-${rate}`,
              label: rate === 1 ? 'Normal' : `${rate}x`,
              onClick: () => { player.setPlaybackRate(rate); setCurrentPlaybackRate(rate); },
              className: currentPlaybackRate === rate ? 'text-[#DC143C] font-black' : ''
            }))
          },
          {
            key: 'quality',
            label: `Quality: ${currentQuality.toUpperCase()}`,
            icon: <Settings size={16} />,
            children: availableQualities.map((q) => ({
              key: q,
              label: q.toUpperCase(),
              onClick: () => { player.setPlaybackQuality(q); setCurrentQuality(q); },
              className: currentQuality === q ? 'text-[#DC143C] font-black' : ''
            }))
          }
        ],
        className: "dark:bg-slate-900 border border-slate-700 font-bold min-w-[180px]"
    }), [currentPlaybackRate, availablePlaybackRates, currentQuality, availableQualities, player]);

    const getDownloadUrl = (fileId: string) => {
        if (fileId.startsWith('http')) return fileId;
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    };

    if (dataError) return (
        <div className="h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
            <div className="bg-rose-500/10 p-6 rounded-3xl border border-rose-500/20 text-center">
                <Youtube className="text-rose-500 mx-auto mb-4" size={48} />
                <h2 className="text-white font-black text-2xl mb-2">Class Access Error</h2>
                <p className="text-slate-400 font-bold max-w-md">The recording session you are looking for could not be found or access has been revoked.</p>
            </div>
            <Button onClick={() => router.push('/')} className="h-12 px-8 font-black rounded-xl">Back to Dashboard</Button>
        </div>
    );

    if (!classData) return <div className="h-screen bg-[#020617] flex items-center justify-center"><div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-white pb-20 overflow-x-hidden">
            {/* Minimal Header - Relative on mobile to let it scroll away, Sticky on PC */}
            <div className="relative md:sticky top-0 z-[150] bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3 md:px-8">
                <button 
                  onClick={() => router.push('/')} 
                  className="flex items-center gap-2 group hover:text-[#DC143C] transition-colors"
                >
                    <div className="bg-slate-100 dark:bg-slate-900 p-1.5 md:p-2 rounded-xl group-hover:bg-[#DC143C]/10 transition-all">
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                    <span className="font-bold text-xs md:text-sm tracking-tight">Back to Dashboard</span>
                </button>
            </div>

            <main className={`${isTheaterMode ? 'max-w-full px-0' : 'max-w-[1600px] mx-auto px-0 md:px-4 lg:px-8'} mt-0 md:mt-6 transition-all duration-500`}>
                <div className={`flex flex-col ${isTheaterMode ? 'lg:flex-col' : 'lg:flex-row'} gap-8`}>
                    {/* LEFT COLUMN: Main Video and Information */}
                    <div className="flex-1 w-full space-y-6 min-w-0">
                        {/* THE VIDEO PLAYER CONTAINER - Pinned at the very top for mobile views */}
                        <div className="sticky md:relative top-0 z-[100] bg-black shadow-2xl md:rounded-3xl overflow-hidden md:ring-1 md:ring-slate-200 md:dark:ring-slate-800 transition-all duration-500">
                            <div 
                              ref={playerRef} 
                              className={`w-full ${isTheaterMode ? 'aspect-[21/9] max-h-[80vh]' : 'aspect-video'} relative group/player isolation-isolate`}
                            >
                                {isLoading && (
                                    <div className="absolute inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center gap-4">
                                        <div className="w-12 h-12 border-4 border-[#DC143C]/20 border-t-[#DC143C] rounded-full animate-spin" />
                                        <div className="text-white/40 font-bold text-xs uppercase tracking-[0.3em] animate-pulse">Establishing Secure Stream...</div>
                                    </div>
                                )}

                                {/* Player Wrapper for Rotation */}
                                <div className="absolute inset-0 pointer-events-none select-none z-0">
                                    <div 
                                        id="player-container" 
                                        className="w-full h-full"
                                        style={{ 
                                            transform: `rotate(${rotation}deg)${rotation % 180 !== 0 ? ' scale(1.7777)' : ''}`,
                                            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                    />
                                </div>

                                {/* INTERACTION OVERLAY */}
                                <div 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const now = Date.now();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const xRatio = (e.clientX - rect.left) / rect.width;

                                        if (now - lastTapRef.current.time < 300) {
                                            if (xRatio < 0.45) skip(-10);
                                            else if (xRatio > 0.55) skip(10);
                                            else togglePlay();
                                            lastTapRef.current = { time: 0, x: 0 };
                                        } else {
                                            lastTapRef.current = { time: now, x: e.clientX };
                                            setShowControls(!showControls);
                                        }
                                    }}
                                    className="absolute inset-0 cursor-pointer z-10 bg-transparent flex items-center justify-center select-none touch-none"
                                >
                                    {skipFeedback.show && (
                                        <div className={`absolute ${skipFeedback.type === 'rewind' ? 'left-[15%]' : 'right-[15%]'} top-1/2 flex flex-col items-center gap-2 pointer-events-none animate-fade-in animate-zoom-in z-[70]`}>
                                            <div className="bg-[#DC143C]/20 backdrop-blur-2xl p-4 md:p-8 rounded-full border-2 border-white/20 shadow-2xl">
                                                {skipFeedback.type === 'rewind' ? <Rewind size={32} fill="white" className="md:w-12 md:h-12" /> : <FastForward size={32} fill="white" className="md:w-12 md:h-12" />}
                                            </div>
                                            <span className="text-white font-black text-lg md:text-2xl tracking-tighter drop-shadow-lg uppercase">{skipFeedback.type === 'rewind' ? '-10s' : '+10s'}</span>
                                        </div>
                                    )}

                                    <div className={`p-4 md:p-8 bg-[#DC143C]/95 backdrop-blur-xl text-white rounded-full shadow-[0_0_50px_rgba(220,20,60,0.5)] transition-all duration-500 transform ${showControls ? 'opacity-100 scale-100' : 'opacity-0 scale-50 rotate-90 pointer-events-none'}`}>
                                        {isPlaying ? <Pause size={24} fill="white" className="md:w-10 md:h-10" /> : <Play size={24} fill="white" className="ml-1 md:w-10 md:h-10" />}
                                    </div>

                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRotate(); }}
                                        className={`absolute top-2 right-2 md:top-4 md:right-4 z-[60] bg-black/60 backdrop-blur-md p-2 md:p-3 rounded-xl border border-white/10 transition-all flex items-center gap-2 group ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                    >
                                        <RotateCw size={14} className="md:w-5 md:h-5" />
                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest hidden md:block">Rotate</span>
                                    </button>
                                </div>

                                {/* CONTROLS */}
                                <div className={`absolute bottom-0 left-0 right-0 p-3 md:p-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent z-50 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                    <div className="space-y-2 md:space-y-4">
                                        <div className="relative h-10 md:h-8 flex items-center cursor-pointer group/timeline">
                                            <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30" />
                                            <div className="absolute left-0 right-0 h-1.5 md:h-1 bg-white/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#DC143C] shadow-[0_0_15px_rgba(220,20,60,0.8)]" style={{ width: `${progress}%` }} />
                                            </div>
                                            <div className="absolute w-4 h-4 bg-white rounded-full border-2 border-[#DC143C] shadow-lg transition-transform group-hover/timeline:scale-125" style={{ left: `calc(${progress}% - 8px)` }} />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 md:gap-6">
                                                <button onClick={() => skip(-10)} className="text-white hover:text-[#DC143C] transition-all p-2"><Rewind size={20} fill="currentColor" /></button>
                                                <button onClick={togglePlay} className="text-white hover:text-[#DC143C] transition-all p-2">{isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
                                                <button onClick={() => skip(10)} className="text-white hover:text-[#DC143C] transition-all p-2"><FastForward size={20} fill="currentColor" /></button>
                                                <span className="text-white font-black text-[10px] md:text-sm tabular-nums tracking-widest">{formatTime(currentTime)} / {formatTime(duration)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 md:gap-3">
                                                <button 
                                                  onClick={() => setIsTheaterMode(!isTheaterMode)} 
                                                  className="text-white hover:text-[#DC143C] p-2 hidden lg:block"
                                                  title="Theater Mode (T)"
                                                >
                                                  <Layout size={18} />
                                                </button>
                                                <Dropdown menu={settingsMenu} placement="topRight" trigger={['click']}>
                                                    <button className="text-white hover:text-[#DC143C] p-2"><Settings size={18} /></button>
                                                </Dropdown>
                                                <button onClick={toggleFullScreen} className="text-white hover:text-[#DC143C] p-2"><Maximize size={18} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* INFO & MATERIALS Column content */}
                        <div className="px-4 md:px-0 space-y-8">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#DC143C] p-2.5 rounded-2xl shadow-lg shadow-rose-900/20">
                                        <Youtube className="text-white" size={24} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] md:text-xs font-black text-[#DC143C] uppercase tracking-[0.3em]">Official Recording</span>
                                        <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">{classData.topic}</h1>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest bg-slate-100/50 dark:bg-slate-900/50 w-fit px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-[#DC143C]" />
                                        <span>Streamed: {classData.date}</span>
                                    </div>
                                    <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                                    <div className="flex items-center gap-2">
                                        <Layout size={14} className="text-[#DC143C]" />
                                        <span>Class ID: {classData.id}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg md:text-xl font-black flex items-center gap-3 decoration-[#DC143C] decoration-4">
                                        Class Materials
                                        <span className="bg-[#DC143C]/10 text-[#DC143C] text-[10px] px-2.5 py-1 rounded-full">{classData.pdfFiles.length} files</span>
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {classData.pdfFiles.map((pdf, idx) => (
                                        <a 
                                            key={idx}
                                            href={getDownloadUrl(pdf.googleDriveFileId)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#DC143C] rounded-2xl transition-all group group-hover:shadow-xl"
                                        >
                                            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 group-hover:bg-[#DC143C]/10 group-hover:border-[#DC143C]/20 transition-all shadow-sm">
                                                <FileText size={24} className="text-[#DC143C]" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="font-bold text-slate-800 dark:text-slate-200 truncate pr-4">{pdf.name}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">PDF Document</div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Maximize size={16} className="text-slate-400" />
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Sidebar (Like YouTube Suggestions) */}
                    <div className={`${isTheaterMode ? 'px-4 lg:px-32 xl:px-64' : 'lg:w-[400px] px-4 md:px-0'} shrink-0 space-y-8 pb-20`}>
                        <div className="bg-gradient-to-br from-[#DC143C]/5 to-rose-500/5 dark:from-[#DC143C]/10 dark:to-rose-500/10 border border-rose-100/50 dark:border-rose-900/10 p-6 rounded-3xl">
                            <h3 className="text-slate-900 dark:text-white font-black mb-1 flex items-center gap-2">
                                <GraduationCap size={18} className="text-[#DC143C]" />
                                Study Guide
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Focus on the topic mentioned in the video. Use the resources provided under Class Materials to complete your practice tests. 
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-black text-sm uppercase tracking-[0.2em] text-slate-400 pl-2">More Content</h3>
                            <div className="space-y-3">
                                {allClasses.map((item) => (
                                    <button 
                                        key={item.id}
                                        onClick={() => router.push(`/watch/${item.id}`)}
                                        className="flex gap-4 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group w-full text-left"
                                    >
                                        <div className="w-32 aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 relative">
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                                <Play size={20} fill="white" className="text-white" />
                                            </div>
                                            <Youtube size={24} className="absolute top-1 right-1 opacity-20" />
                                        </div>
                                        <div className="flex flex-col justify-center min-w-0">
                                            <div className="font-bold text-sm line-clamp-2 group-hover:text-[#DC143C] transition-colors">{item.topic}</div>
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">{item.date}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WatchPage;
