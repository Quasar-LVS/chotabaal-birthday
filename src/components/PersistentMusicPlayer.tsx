'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';
import { MediaEntry } from '@/utils/db';

interface PersistentMusicPlayerProps {
  isActive: boolean;
  music: MediaEntry | null;
}

export default function PersistentMusicPlayer({ isActive, music }: PersistentMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthIntervalRef = useRef<any>(null);
  const synthCtxRef = useRef<AudioContext | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [isExpanded, setIsExpanded] = useState(false);
  const [useSynthFallback, setUseSynthFallback] = useState(false);

  // Web Audio Synth Fallback
  const startSynth = () => {
    if (synthIntervalRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      synthCtxRef.current = ctx;

      const chords = [
        [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
        [261.63, 329.63, 392.00, 493.88], // Cmaj7 (C4, E4, G4, B4)
        [220.00, 261.63, 329.63, 392.00], // Am7 (A3, C4, E4, G4)
        [196.00, 246.94, 293.66, 392.00]  // G6 (G3, B3, D4, G4)
      ];
      
      let chordIndex = 0;
      
      const playChord = () => {
        if (!synthCtxRef.current || synthCtxRef.current.state === 'suspended') return;
        const now = synthCtxRef.current.currentTime;
        const notes = chords[chordIndex];
        chordIndex = (chordIndex + 1) % chords.length;
        
        notes.forEach((freq, i) => {
          const osc = synthCtxRef.current!.createOscillator();
          const gainNode = synthCtxRef.current!.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.15);
          
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(volume * 0.08, now + 2 + i * 0.2); // scale by volume setting
          gainNode.gain.setValueAtTime(volume * 0.08, now + 5);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 8);
          
          const filter = synthCtxRef.current!.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(600, now);
          
          osc.connect(filter);
          filter.connect(gainNode);
          gainNode.connect(synthCtxRef.current!.destination);
          
          osc.start(now);
          osc.stop(now + 8.5);
        });
      };

      playChord();
      synthIntervalRef.current = setInterval(playChord, 7500);
      setIsPlaying(true);
    } catch (e) {
      console.warn("Synth fallback failed", e);
    }
  };

  const stopSynth = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    if (synthCtxRef.current) {
      synthCtxRef.current.close();
      synthCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  // Play audio track
  useEffect(() => {
    if (!isActive) return;

    let srcUrl = '/music/theme.mp3';
    let isBlobUrl = false;

    if (music) {
      srcUrl = URL.createObjectURL(music.blob);
      isBlobUrl = true;
      setUseSynthFallback(false);
    }

    const audio = new Audio(srcUrl);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    
    const onError = () => {
      if (!isBlobUrl) {
        console.warn("Theme file not found in /music/theme.mp3, starting synthesizer loop.");
        setUseSynthFallback(true);
        startSynth();
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('error', onError);

    // Initial play trigger
    audio.play().catch((err) => {
      console.warn("Autoplay block or missing theme file, falling back to synth.");
      if (!isBlobUrl) {
        setUseSynthFallback(true);
        startSynth();
      }
    });

    return () => {
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('error', onError);
      if (isBlobUrl) {
        URL.revokeObjectURL(srcUrl);
      }
      stopSynth();
    };
  }, [isActive, music]);

  // Handle Play/Pause toggling
  const handleTogglePlay = () => {
    if (useSynthFallback) {
      if (isPlaying) {
        stopSynth();
      } else {
        startSynth();
      }
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(() => {
          setUseSynthFallback(true);
          startSynth();
        });
      }
    }
  };

  // Handle Mute
  const handleToggleMute = () => {
    if (useSynthFallback) {
      if (isMuted) {
        if (synthCtxRef.current && synthCtxRef.current.state === 'suspended') {
          synthCtxRef.current.resume();
        }
        setIsMuted(false);
      } else {
        setIsMuted(true);
      }
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      audio.muted = !audio.muted;
      setIsMuted(audio.muted);
    }
  };

  // Handle Volume Change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (!useSynthFallback && audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  // Handle Seek Change
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (useSynthFallback || !audioRef.current) return;
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  if (!isActive) return null;

  const percentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className="fixed bottom-6 left-6 z-40"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <motion.div
        animate={{
          width: isExpanded ? (useSynthFallback ? 160 : 250) : 48,
          height: 48,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 180 }}
        className="dream-glass flex items-center gap-3 px-3 py-2 rounded-full shadow-lg pointer-events-auto border border-sakura/50 overflow-hidden relative"
      >
        {/* Simple Progress Ring (Collapsed Mode) */}
        {!isExpanded && (
          <div className="absolute inset-0 p-1 pointer-events-none">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke="rgba(255, 182, 213, 0.2)"
                strokeWidth="1.5"
                fill="transparent"
              />
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke="#FFB6D5"
                strokeWidth="1.8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - percentage / 100)}
              />
            </svg>
          </div>
        )}

        {/* Play/Pause Button */}
        <button
          onClick={handleTogglePlay}
          className="w-8 h-8 rounded-full bg-sakura/20 hover:bg-sakura/40 text-dusty-plum border border-sakura/30 flex items-center justify-center cursor-pointer transition-colors z-10 shrink-0"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-dusty-plum/10 translate-x-[0.5px]" />}
        </button>

        {/* Expanded Controls */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 w-full"
            >
              {/* Seek Slider (only for actual file stream) */}
              {!useSynthFallback ? (
                <div className="flex-1 flex items-center min-w-0">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={percentage || 0}
                    onChange={handleSeekChange}
                    className="w-full accent-sakura h-1 bg-dusty-plum/10 rounded-lg cursor-pointer min-w-0 shrink"
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center truncate">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-sakura animate-pulse">
                    Dream Synth Loop
                  </span>
                </div>
              )}

              {/* Volume Slider & Mute */}
              <div className="flex items-center gap-1.5 shrink-0 pr-1">
                <button
                  onClick={handleToggleMute}
                  className="text-dusty-plum/70 hover:text-sakura transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-12 accent-sakura h-0.5 bg-dusty-plum/10 rounded-lg cursor-pointer"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed Music Icon */}
        {!isExpanded && (
          <div className="absolute right-3.5 pointer-events-none text-sakura">
            <Music className={`w-3.5 h-3.5 ${isPlaying ? 'animate-pulse' : 'opacity-40'}`} />
          </div>
        )}
      </motion.div>
    </div>
  );
}
