'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Film, Edit, Upload, Trash2, X } from 'lucide-react';
import { TextConfig, MediaEntry, saveVideo, deleteVideo } from '@/utils/db';
import EditableText from './EditableText';

interface CinemaRoomProps {
  textConfig: TextConfig;
  isEditMode: boolean;
  video: MediaEntry | null;
  onTextChange: (newConfig: TextConfig) => void;
  onRefreshVideo: () => void;
}

export default function CinemaRoom({
  textConfig,
  isEditMode,
  video,
  onTextChange,
  onRefreshVideo,
}: CinemaRoomProps) {
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isImmersive, setIsImmersive] = useState(false);
  const [videoUrl, setVideoUrl] = useState('/videos/birthday-film.mp4');

  // Modal & Upload States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Convert wishes video Blob to browser stream URL
  useEffect(() => {
    let url = '/videos/birthday-film.mp4';
    if (video) {
      url = URL.createObjectURL(video.blob);
    }
    setVideoUrl(url);

    // Reset playing state
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);

    return () => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [video]);

  // Clean up upload previews
  useEffect(() => {
    return () => {
      if (previewSrc && previewSrc.startsWith('blob:')) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  // Sync play states
  const handlePlay = () => {
    setIsPlaying(true);
    if (mainVideoRef.current) {
      mainVideoRef.current.play().catch((e) => console.log(e));
    }
    if (bgVideoRef.current) {
      bgVideoRef.current.muted = true;
      bgVideoRef.current.play().catch(() => {});
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (mainVideoRef.current) mainVideoRef.current.pause();
    if (bgVideoRef.current) bgVideoRef.current.pause();
  };

  const togglePlay = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const toggleMute = () => {
    if (!mainVideoRef.current) return;
    mainVideoRef.current.muted = !mainVideoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!mainVideoRef.current) return;
    const time = mainVideoRef.current.currentTime;
    setCurrentTime(time);
    setProgress((time / mainVideoRef.current.duration) * 100);

    // Keep dynamic blur video in sync
    if (bgVideoRef.current && Math.abs(bgVideoRef.current.currentTime - time) > 0.3) {
      bgVideoRef.current.currentTime = time;
    }
  };

  const handleLoadedMetadata = () => {
    if (!mainVideoRef.current) return;
    setDuration(mainVideoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!mainVideoRef.current) return;
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    mainVideoRef.current.currentTime = seekTime;
    if (bgVideoRef.current) bgVideoRef.current.currentTime = seekTime;
    setProgress(parseFloat(e.target.value));
  };

  const handleFullscreen = () => {
    setIsImmersive(!isImmersive);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Video File Processing & auto-save
  const processVideoFile = async (file: File) => {
    if (file.type !== 'video/mp4' && !file.name.endsWith('.mov')) {
      alert('Only MP4 and MOV videos are accepted.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreviewSrc(previewUrl);

    setIsUploading(true);
    setUploadProgress(0);

    // Smooth UI progress simulation
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          saveVideo(file, file.name).then(() => {
            setIsUploading(false);
            onRefreshVideo();
          });
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processVideoFile(file);
  };

  const handleDeleteVideo = async () => {
    if (confirm('Delete custom video and restore default local wishes film?')) {
      await deleteVideo();
      setPreviewSrc(null);
      onRefreshVideo();
    }
  };

  useEffect(() => {
    const mainVideo = mainVideoRef.current;
    if (!mainVideo) return;

    const onPlayEvent = () => {
      setIsPlaying(true);
      if (bgVideoRef.current) bgVideoRef.current.play().catch(() => {});
    };
    const onPauseEvent = () => {
      setIsPlaying(false);
      if (bgVideoRef.current) bgVideoRef.current.pause();
    };

    mainVideo.addEventListener('play', onPlayEvent);
    mainVideo.addEventListener('pause', onPauseEvent);

    return () => {
      mainVideo.removeEventListener('play', onPlayEvent);
      mainVideo.removeEventListener('pause', onPauseEvent);
    };
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-0 py-12 flex flex-col items-center">
      {/* Title Header */}
      <div className="text-center mb-16 space-y-3 z-35 w-full">
        <span className="text-xs uppercase tracking-[0.25em] text-sakura font-bold" style={{ color: '#E8B7C8' }}>
          Section 4
        </span>
        <div className="w-full max-w-md mx-auto">
          <EditableText
            value={textConfig.sectionTitles.cinema}
            isEditMode={isEditMode}
            onChange={(val) => {
              const newConfig = { ...textConfig };
              newConfig.sectionTitles.cinema = val;
              onTextChange(newConfig);
            }}
            as="h2"
            className="serif-heading text-3xl md:text-4xl text-dusty-plum font-light"
          />
        </div>
        <div className="w-12 h-[1px] bg-sakura/60 mx-auto mt-4" />
      </div>

      {/* Immersive Theater screen frame */}
      <motion.div
        animate={{
          maxWidth: isImmersive ? '100%' : '896px',
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full bg-[#17111D]/90 rounded-[32px] overflow-hidden shadow-2xl relative border border-sakura/40 aspect-video group z-20"
      >
        {/* Floating Edit Icon (Visible only in Edit Mode) */}
        {isEditMode && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="absolute top-4 right-4 z-40 w-9 h-9 rounded-full bg-sakura hover:bg-sakura/80 border border-sakura/50 flex items-center justify-center text-dream-pink hover:scale-105 transition-all shadow-md cursor-pointer"
            title="Upload Wishes Video"
          >
            <Edit className="w-4 h-4 text-dream-pink" style={{ color: '#E8B7C8' }} />
          </button>
        )}

        {/* Dynamic Backing Glow (ambient bloom) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none scale-105 z-0 opacity-40 blur-3xl">
          <video
            ref={bgVideoRef}
            src={videoUrl}
            loop
            muted
            className="w-full h-full object-cover"
            playsInline
          />
        </div>

        {/* Video Player */}
        <div className="relative w-full h-full z-10 cinema-video-container">
          <video
            ref={mainVideoRef}
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer"
            playsInline
          />
        </div>

        {/* Big play button overlay */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/10 cursor-pointer z-20 pointer-events-auto"
            >
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-sakura text-cream hover:scale-105 transition-transform duration-500 shadow-md">
                <Play className="w-5 h-5 fill-cream/20 translate-x-[1.5px]" style={{ color: '#F7D6E0' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls HUD Panel */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#0E0911]/95 via-[#0E0911]/60 to-transparent flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-auto">
          
          {/* Progress Seek bar */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-cloud-pink/85 font-mono">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={progress || 0}
              onChange={handleSeek}
              className="w-full accent-dream-pink h-1 bg-cloud-pink/20 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-cloud-pink/85 font-mono">{formatTime(duration || 0)}</span>
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-sakura/20 hover:bg-sakura/40 border border-sakura/30 flex items-center justify-center text-sakura cursor-pointer transition-colors"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-sakura/10 translate-x-[0.5px]" />}
              </button>

              <button
                onClick={toggleMute}
                className="text-cloud-pink hover:text-sakura transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-4">
              {/* Fullscreen trigger */}
              <button
                onClick={handleFullscreen}
                className="text-cloud-pink hover:text-sakura transition-colors cursor-pointer"
                title={isImmersive ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Small details badge */}
        <div className="absolute top-4 left-4 z-25 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 text-[8px] uppercase tracking-widest text-dream-pink border border-sakura/25 font-mono select-none">
          <Film className="w-2.5 h-2.5" />
          <span>{video ? "Custom Video Film" : "Local Wishes Film"}</span>
        </div>
      </motion.div>

      {/* DEDICATED VIDEO UPLOAD MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0E0911]/85 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md p-6 rounded-3xl border border-sakura/50 bg-[#17111D]/95 relative text-center flex flex-col gap-6"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-sakura/25 hover:bg-sakura/40 text-dusty-plum border border-sakura/30 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <span className="text-[10px] uppercase tracking-widest text-dream-pink font-bold">Section Video Manager</span>
                <h3 className="serif-heading text-lg text-dusty-plum font-semibold">Upload Birthday Film</h3>
              </div>

              {/* Upload Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) processVideoFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-sakura/35 rounded-2xl p-6 text-center hover:bg-sakura/5 hover:border-dream-pink/50 transition-all cursor-pointer group"
              >
                <Upload className="w-8 h-8 text-sakura group-hover:scale-105 transition-transform mx-auto mb-3" />
                <span className="text-xs font-semibold text-dusty-plum/85 block mb-1">Click or drag video file</span>
                <span className="text-[9px] text-dusty-plum/45 uppercase tracking-wider block">MP4 or MOV formats supported</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Progress HUD */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-dream-pink font-mono">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-cloud-pink rounded-full overflow-hidden border border-sakura/20">
                    <div
                      className="h-full bg-sakura transition-all duration-100"
                      style={{ width: `${uploadProgress}%`, backgroundColor: '#E8B7C8' }}
                    />
                  </div>
                </div>
              )}

              {/* Current Asset Details & Preview / Delete */}
              {previewSrc || video ? (
                <div className="p-4 rounded-2xl bg-cloud-pink/15 border border-sakura/20 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="truncate font-mono text-[10px] text-dusty-plum/70 max-w-[220px]">
                      {video ? video.name : "Loaded Video Preview"}
                    </span>
                    <button
                      onClick={handleDeleteVideo}
                      className="text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                  
                  {/* Small preview block */}
                  <div className="w-full aspect-video rounded-xl overflow-hidden border border-sakura/20 bg-black">
                    <video
                      src={previewSrc || videoUrl}
                      controls
                      className="w-full h-full object-contain"
                      playsInline
                    />
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
