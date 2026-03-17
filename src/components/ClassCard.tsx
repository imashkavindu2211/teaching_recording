"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Modal, Dropdown, MenuProps } from 'antd';
import { PlayCircle, Download, FileText, Calendar, Youtube, Play, Pause, RotateCcw, FastForward, Rewind, Maximize, Settings } from 'lucide-react';

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

interface ClassCardProps {
  classData: ClassEntry;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const ClassCard: React.FC<ClassCardProps> = ({ classData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const playerRef = React.useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeId(classData.youtubeUrl);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let timer: any;

    const initPlayer = () => {
      if (player) {
        try { player.destroy(); } catch (e) {}
        setPlayer(null);
      }

      const el = document.getElementById(`player-${classData.id}`);
      if (!el) {
        timer = setTimeout(initPlayer, 100);
        return;
      }

      const newPlayer = new window.YT.Player(`player-${classData.id}`, {
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
            event.target.playVideo();
          },
          onStateChange: (event: any) => {
            const state = event.data;
            setIsPlaying(state === window.YT.PlayerState.PLAYING);
            if (state === window.YT.PlayerState.ENDED) {
              setProgress(100);
              setIsPlaying(false);
            }
            if (state === window.YT.PlayerState.PLAYING) {
              setAvailableQualities(event.target.getAvailableQualityLevels());
              setCurrentQuality(event.target.getPlaybackQuality());
            }
          }
        }
      });
    };

    if (isModalOpen && videoId) {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        
        // This is the correct way to wait for the API
        const checkYT = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(checkYT);
            initPlayer();
          }
        }, 100);
        return () => clearInterval(checkYT);
      } else {
        const timer = setTimeout(initPlayer, 100);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      clearTimeout(timer);
      if (player) {
        try { player.destroy(); } catch (e) {}
        setPlayer(null);
      }
    };
  }, [isModalOpen, videoId]);

  React.useEffect(() => {
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

  useEffect(() => {
    if (isPlaying && isModalOpen) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      setShowControls(true);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, isModalOpen]);

  const toggleFullScreen = () => {
    if (!playerRef.current) return;
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

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
    const current = player.getCurrentTime();
    player.seekTo(current + seconds, true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) return;
    const seekTo = (parseFloat(e.target.value) / 100) * duration;
    player.seekTo(seekTo, true);
    setProgress(parseFloat(e.target.value));
    setCurrentTime(seekTo);
  };

  const handleQualityChange = (quality: string) => {
    if (!player) return;
    player.setPlaybackQuality(quality);
    setCurrentQuality(quality);
  };

  const qualityMenu: MenuProps = {
    items: availableQualities.map((q) => ({
      key: q,
      label: q.toUpperCase(),
      onClick: () => handleQualityChange(q),
      className: currentQuality === q ? 'text-[#DC143C] font-black' : ''
    })),
    className: "dark:bg-slate-900 border border-slate-700 font-bold"
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen || !player) return;
      
      switch(e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, player, isPlaying, duration]); // Re-bind when player state changes

  const getDownloadUrl = (fileId: string) => {
    if (fileId.startsWith('http')) return fileId;
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  };

  const pdfMenuItems: MenuProps['items'] = classData.pdfFiles.map((pdf, index) => ({
    key: index.toString(),
    label: (
      <a 
        href={getDownloadUrl(pdf.googleDriveFileId)} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 py-1 px-1"
      >
        <FileText size={16} className="text-[#DC143C]" />
        <span className="font-medium text-slate-700 dark:text-slate-300">{pdf.name}</span>
      </a>
    ),
  }));

  return (
    <>
      <Card 
        className="overflow-hidden border-slate-200 dark:border-slate-800 !bg-white dark:!bg-slate-900/60 hover:border-rose-200 dark:hover:border-rose-900 transition-all duration-300 hover:shadow-2xl hover:shadow-rose-50/50 dark:hover:shadow-rose-900/10 group rounded-3xl"
        styles={{ body: { padding: '2rem' } }}
      >
        <div className="flex flex-col h-full gap-5">
          <div className="flex items-start justify-between">
            <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl text-[#DC143C] dark:text-rose-400 group-hover:bg-[#DC143C] group-hover:text-white transition-all duration-500 shadow-sm">
              <Youtube size={28} strokeWidth={2.5} />
            </div>
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
              <Calendar size={12} strokeWidth={3} />
              {classData.date}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-[#DC143C] dark:group-hover:text-rose-400 transition-colors duration-300">
              {classData.topic}
            </h3>
          </div>

          <div className="mt-auto pt-6 flex flex-wrap gap-3">
            <Button 
              type="primary" 
              icon={<PlayCircle size={20} />} 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 h-12 px-6 font-bold shadow-lg shadow-rose-100 dark:shadow-rose-950/20 bg-[#DC143C] hover:bg-rose-700 active:scale-95 transition-all rounded-xl border-none"
              block={classData.pdfFiles.length === 0}
            >
              Watch Video
            </Button>

            {classData.pdfFiles.length === 1 ? (
              <Button 
                icon={<Download size={20} />} 
                href={getDownloadUrl(classData.pdfFiles[0].googleDriveFileId)}
                target="_blank"
                className="flex items-center gap-2 h-12 px-6 font-bold border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#DC143C] dark:hover:text-rose-400 hover:border-[#DC143C] dark:hover:border-rose-900 active:scale-95 transition-all rounded-xl shadow-sm bg-transparent"
              >
                Notes
              </Button>
            ) : classData.pdfFiles.length > 1 ? (
              <Dropdown menu={{ items: pdfMenuItems }} placement="bottomRight" trigger={['click']}>
                <Button 
                  icon={<Download size={20} />}
                  className="flex items-center gap-2 h-12 px-6 font-bold border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#DC143C] dark:hover:text-rose-400 hover:border-[#DC143C] dark:hover:border-rose-900 active:scale-95 transition-all rounded-xl shadow-sm bg-transparent"
                >
                  Resources
                </Button>
              </Dropdown>
            ) : null}
          </div>
        </div>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2 md:gap-3 px-0 md:px-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#DC143C] rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-rose-200 dark:shadow-rose-900/40">
              <Youtube className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className="text-base md:text-xl font-black tracking-tight text-slate-900 dark:text-white truncate">{classData.topic}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setIsPlaying(false);
          if (player) player.pauseVideo();
        }}
        footer={null}
        width={1000}
        centered
        destroyOnHidden
        styles={{ 
          mask: { backdropFilter: 'blur(12px)', backgroundColor: 'rgba(2, 6, 23, 0.4)' },
          body: { padding: 'clamp(12px, 3vw, 32px)', background: 'transparent' }
        }}
        className="dark:bg-slate-900/90 backdrop-blur-3xl rounded-2xl md:rounded-3xl overflow-hidden border border-white/20 mobile-full-modal"
      >
        <div ref={playerRef} className="aspect-video w-full rounded-xl md:rounded-2xl overflow-hidden shadow-2xl bg-black border-2 md:border-4 border-slate-50 dark:border-slate-800 relative group/player isolation-isolate">
          {videoId ? (
            <div className="absolute inset-0 w-full h-full flex flex-col">
              {/* YouTube Container */}
              <div 
                id={`player-${classData.id}`} 
                className="absolute inset-0 w-full h-full pointer-events-none select-none z-0"
              ></div>
              
              {/* INTERACTION OVERLAY - Handles Play/Pause & Hover Toggle */}
              <div 
                onClick={() => {
                  if (!showControls) {
                    setShowControls(true);
                  } else {
                    togglePlay();
                  }
                }} 
                onMouseMove={() => setShowControls(true)}
                className="absolute inset-0 cursor-pointer z-10 bg-transparent flex items-center justify-center group/playbtn"
              >
                <div className={`p-8 bg-[#DC143C]/95 backdrop-blur-md text-white rounded-full shadow-2xl transition-all duration-300 ${isPlaying && !showControls ? 'opacity-0' : 'opacity-100 scale-100'} ${isPlaying ? 'scale-75' : ''}`}>
                  {isPlaying ? <Pause size={48} fill="white" /> : <Play size={48} fill="white" className="ml-2" />}
                </div>
              </div>

              {/* CONTROLS BAR (ABSOLUTE OVERLAY) */}
              <div 
                className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent z-50 pointer-events-auto transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowControls(true);
                }}
              >
                <div className="flex flex-col gap-2 md:gap-3">
                  {/* TIMELINE */}
                  <div className="relative group/timeline h-8 flex items-center cursor-pointer">
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="0.1"
                      value={progress}
                      onChange={handleSeek}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                    />
                    <div className="absolute left-0 right-0 h-1 bg-white/20 rounded-full group-hover/timeline:h-1.5 transition-all">
                      <div 
                        className="h-full bg-[#DC143C] shadow-[0_0_15px_rgba(220,20,60,0.8)]" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div 
                      className="absolute w-4 h-4 bg-white rounded-full border-2 border-[#DC143C] shadow-lg transition-transform group-hover/timeline:scale-125"
                      style={{ left: `calc(${progress}% - 8px)` }}
                    />
                  </div>

                  {/* BOTTOM BUTTONS */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 md:gap-6">
                      <button onClick={() => skip(-10)} className="text-white hover:text-[#DC143C] transition-all">
                        <Rewind size={20} className="md:w-6 md:h-6" fill="currentColor" />
                      </button>
                      <button onClick={togglePlay} className="text-white hover:text-[#DC143C] transition-all">
                        {isPlaying ? <Pause size={24} className="md:w-8 md:h-8" fill="currentColor" /> : <Play size={24} className="md:w-8 md:h-8" fill="currentColor" />}
                      </button>
                      <button onClick={() => skip(10)} className="text-white hover:text-[#DC143C] transition-all">
                        <FastForward size={20} className="md:w-6 md:h-6" fill="currentColor" />
                      </button>
                      <button onClick={() => player?.seekTo(0)} className="hidden md:block text-white/40 hover:text-white transition-all ml-2">
                        <RotateCcw size={20} />
                      </button>
                      <div className="ml-1 md:ml-2">
                        <span className="text-white font-black text-[10px] md:text-sm tabular-nums tracking-wider truncate max-w-[80px] md:max-w-none block">
                          {formatTime(currentTime)} <span className="text-white/30 font-bold mx-0.5 md:mx-1">/</span> {formatTime(duration)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Dropdown menu={qualityMenu} placement="topRight" trigger={['click']}>
                        <button className="text-white hover:text-[#DC143C] transition-all p-1" title="Quality Settings">
                          <Settings size={20} className="md:w-6 md:h-6" />
                        </button>
                      </Dropdown>
                      <button onClick={toggleFullScreen} className="text-white hover:text-[#DC143C] transition-all p-1" title="Fullscreen">
                        <Maximize size={20} className="md:w-6 md:h-6" />
                      </button>
                      <div className="hidden sm:block px-3 py-1 bg-[#DC143C] rounded-lg text-[9px] text-white font-black uppercase tracking-[0.1em] border border-white/30">
                        SECURE
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white bg-slate-900 font-bold">
              Invalid Video URL
            </div>
          )}
        </div>
        <div className="mt-4 md:mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 p-4 md:p-6 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800 backdrop-blur-md">
          <div>
            <div className="text-[9px] md:text-[10px] text-[#DC143C] font-black uppercase tracking-[0.2em] mb-1">RECORDING DATE</div>
            <div className="font-bold text-slate-900 dark:text-white text-base md:text-lg">{classData.date}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            {classData.pdfFiles.map((pdf, idx) => (
              <Button 
                key={idx}
                type="text"
                icon={<FileText size={18} className="text-[#DC143C]" />}
                href={getDownloadUrl(pdf.googleDriveFileId)}
                target="_blank"
                className="bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-[#DC143C] dark:hover:text-rose-400 font-bold h-11 px-4 rounded-xl shadow-sm transition-all"
              >
                {pdf.name}
              </Button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ClassCard;
