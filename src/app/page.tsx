'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Edit, Hammer } from 'lucide-react';

import JellyfishBackground from '@/components/JellyfishBackground';
import SparklePetals from '@/components/SparklePetals';
import CustomCursor from '@/components/CustomCursor';
import PersistentMusicPlayer from '@/components/PersistentMusicPlayer';
import CreatorPanel from '@/components/CreatorPanel';

import EntryScreen from '@/components/EntryScreen';
import HeroSection from '@/components/HeroSection';
import MemoryConstellation from '@/components/MemoryConstellation';
import DreamGallery from '@/components/DreamGallery';
import CinemaRoom from '@/components/CinemaRoom';
import FinalScreen from '@/components/FinalScreen';

import { TextConfig, PhotoEntry, MediaEntry, getTextConfig, getPhotos, getVideo, getMusic, saveTextConfig, savePhoto, saveVideo, saveMusic, DEFAULT_TEXT_CONFIG } from '@/utils/db';

const SECTIONS = [
  { id: 'hero', key: 'hero' as const },
  { id: 'constellation', key: 'constellation' as const },
  { id: 'scrapbook', key: 'gallery' as const },
  { id: 'cinema', key: 'cinema' as const },
  { id: 'final', key: 'final' as const },
];

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Database States (Draft)
  const [localTextConfig, setLocalTextConfig] = useState<TextConfig>(DEFAULT_TEXT_CONFIG);
  const [localPhotos, setLocalPhotos] = useState<PhotoEntry[]>([]);
  const [localVideo, setLocalVideo] = useState<MediaEntry | null>(null);
  const [localMusic, setLocalMusic] = useState<MediaEntry | null>(null);

  // Published States (Server)
  const [publishedTextConfig, setPublishedTextConfig] = useState<TextConfig>(DEFAULT_TEXT_CONFIG);
  const [publishedPhotos, setPublishedPhotos] = useState<any[]>([]);
  const [publishedVideo, setPublishedVideo] = useState<any | null>(null);
  const [publishedMusic, setPublishedMusic] = useState<any | null>(null);
  const [hasPublishedData, setHasPublishedData] = useState<boolean>(false);

  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Active States used for rendering (viewer sees published, creator sees local draft)
  const activeTextConfig = (editMode || !hasPublishedData) ? localTextConfig : publishedTextConfig;
  const activePhotos = (editMode || !hasPublishedData) ? localPhotos : publishedPhotos;
  const activeVideo = (editMode || !hasPublishedData) ? localVideo : publishedVideo;
  const activeMusic = (editMode || !hasPublishedData) ? localMusic : publishedMusic;

  // Load backend published universe data and IndexedDB contents
  const loadUniverseData = async () => {
    try {
      // 1. Fetch server config
      const serverRes = await fetch('/api/publish')
        .then((r) => r.json())
        .catch(() => ({ success: false }));

      let currentLocalPhotos = await getPhotos();
      let currentLocalConfig = await getTextConfig();
      let currentLocalVideo = await getVideo();
      let currentLocalMusic = await getMusic();

      if (serverRes.success) {
        setLastUpdated(serverRes.lastUpdated);
        setHasPublishedData(true);

        setPublishedTextConfig(serverRes.textConfig || DEFAULT_TEXT_CONFIG);
        setPublishedPhotos(serverRes.photos || []);
        setPublishedVideo(serverRes.video || null);
        setPublishedMusic(serverRes.music || null);

        // If local IndexedDB has no custom elements yet, sync server published items into IndexedDB
        if (currentLocalPhotos.length === 0 && !currentLocalVideo && !currentLocalMusic) {
          console.log('Syncing server published assets into IndexedDB...');
          // Save Text config
          await saveTextConfig(serverRes.textConfig);

          // Save Photos
          if (serverRes.photos && Array.isArray(serverRes.photos)) {
            for (const p of serverRes.photos) {
              const res = await fetch(p.path).catch(() => null);
              if (res) {
                const blob = await res.blob();
                await savePhoto(p.id, p.name, blob, p.order);
              }
            }
          }

          // Save Wishes Video
          if (serverRes.video) {
            const res = await fetch(serverRes.video.path).catch(() => null);
            if (res) {
              const blob = await res.blob();
              await saveVideo(blob, serverRes.video.name);
            }
          }

          // Save Theme soundtrack
          if (serverRes.music) {
            const res = await fetch(serverRes.music.path).catch(() => null);
            if (res) {
              const blob = await res.blob();
              await saveMusic(blob, serverRes.music.name);
            }
          }

          // Reload states after sync
          currentLocalPhotos = await getPhotos();
          currentLocalConfig = await getTextConfig();
          currentLocalVideo = await getVideo();
          currentLocalMusic = await getMusic();
        }
      } else {
        setHasPublishedData(false);
      }

      setLocalTextConfig(currentLocalConfig);
      setLocalPhotos(currentLocalPhotos);
      setLocalVideo(currentLocalVideo);
      setLocalMusic(currentLocalMusic);
    } catch (e) {
      console.error('Failed to initialize state configs:', e);
    } finally {
      setIsDbLoading(false);
    }
  };

  useEffect(() => {
    loadUniverseData();
  }, []);

  const handleEnter = () => {
    setEntered(true);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Inline changes handler
  const handleInlineTextChange = async (key: string, val: string) => {
    const newConfig = { ...localTextConfig };
    (newConfig as any)[key] = val;
    setLocalTextConfig(newConfig);
    await saveTextConfig(newConfig);
  };

  // Direct config setter
  const handleTextConfigSave = async (newConfig: TextConfig) => {
    setLocalTextConfig(newConfig);
    await saveTextConfig(newConfig);
  };

  // Observer to highlight active navigation dot
  useEffect(() => {
    if (!entered) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -40% 0px',
      threshold: 0.1,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [entered]);

  if (isDbLoading) {
    return (
      <div className="fixed inset-0 w-full h-full flex flex-col gap-4 items-center justify-center bg-cloud-pink text-dusty-plum">
        <div className="w-6 h-6 border-2 border-sakura border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] uppercase tracking-widest font-semibold opacity-60">Opening Memory Universe...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative bg-cloud-pink text-dusty-plum selection:bg-sakura/50 selection:text-dusty-plum overflow-x-hidden">
      
      {/* Background canvas layers */}
      <JellyfishBackground />
      <SparklePetals />

      {/* Custom interactive mouse cursor - globally rendered */}
      <CustomCursor />

      <AnimatePresence>
        {!entered ? (
          <motion.div
            key="welcome-entry"
            exit={{ opacity: 0, y: -45 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50"
          >
            <EntryScreen 
              onEnter={handleEnter} 
              textConfig={activeTextConfig}
              isEditMode={editMode}
              onTextChange={handleInlineTextChange}
            />
          </motion.div>
        ) : (
          <motion.div
            key="main-memory-box"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="w-full flex flex-col relative"
          >
            {/* Persistent Audio soundtrack player */}
            <PersistentMusicPlayer isActive={entered} music={activeMusic} />

            {/* Creator Mode panel drawer */}
            <AnimatePresence>
              {editMode && (
                <CreatorPanel
                  textConfig={localTextConfig}
                  photos={localPhotos}
                  video={localVideo}
                  music={localMusic}
                  lastUpdated={lastUpdated}
                  onRefreshData={loadUniverseData}
                  onClose={() => setEditMode(false)}
                  onTextChange={handleTextConfigSave}
                />
              )}
            </AnimatePresence>

            {/* Header Menu */}
            <header className="sticky top-0 z-40 w-full bg-cloud-pink/60 backdrop-blur-md border-b border-sakura/30 py-3.5 px-6 md:px-12 flex justify-between items-center shadow-xs">
              <div 
                className="flex items-center gap-1.5 cursor-pointer text-dusty-plum hover:text-dream-pink transition-colors"
                onClick={() => scrollToSection('hero')}
              >
                <span className="serif-heading text-lg font-light tracking-wide">Memory Box of</span>
                <span className="serif-heading text-lg font-serif italic text-dream-pink font-semibold" style={{ color: '#E8B7C8' }}>You</span>
              </div>

              {/* Horizontal Menu */}
              <div className="hidden md:flex items-center gap-6">
                {SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`text-[10px] uppercase tracking-widest font-semibold transition-all cursor-pointer ${
                      activeSection === sec.id
                        ? 'scale-105'
                        : 'text-dusty-plum/55 hover:text-dream-pink'
                    }`}
                    style={{ color: activeSection === sec.id ? '#E8B7C8' : '' }}
                  >
                    {activeTextConfig.navigation[sec.key]}
                  </button>
                ))}
              </div>

              {/* Mobile details tag */}
              <div className="md:hidden flex items-center gap-1 text-[9px] uppercase tracking-widest font-semibold" style={{ color: '#E8B7C8' }}>
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>{activeTextConfig.navigation[SECTIONS.find(s => s.id === activeSection)?.key || 'hero']}</span>
              </div>
            </header>

            {/* Floating Navigation Dots (Desktop Only) */}
            <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-6 bg-cloud-pink/30 backdrop-blur-xs p-3 rounded-full border border-sakura/30 shadow-xs">
              {SECTIONS.map((sec) => {
                const isActive = activeSection === sec.id;
                const label = activeTextConfig.navigation[sec.key];
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className="relative flex items-center justify-center group cursor-pointer"
                    title={label}
                  >
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="active-dot-outline"
                          className="absolute w-5 h-5 rounded-full border"
                          style={{ borderColor: '#E8B7C8' }}
                          transition={{ type: 'spring', damping: 20, stiffness: 220 }}
                        />
                      )}
                    </AnimatePresence>

                    <div 
                      className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 z-10 ${
                        isActive ? 'bg-dream-pink' : 'bg-sakura group-hover:bg-dream-pink'
                      }`}
                      style={{ backgroundColor: isActive ? '#E8B7C8' : '' }}
                    />

                    <span className="absolute right-8 text-[9px] uppercase tracking-widest font-bold bg-sakura text-dusty-plum py-1 px-2.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-sm border border-sakura/30">
                      {label}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Section flows */}
            <div className="flex flex-col w-full z-20">
              
              <section id="hero" className="border-b border-sakura/10">
                <HeroSection 
                  textConfig={activeTextConfig} 
                  isEditMode={editMode} 
                  onTextChange={handleTextConfigSave} 
                />
              </section>

              <section id="constellation" className="border-b border-sakura/10">
                <MemoryConstellation 
                  textConfig={activeTextConfig} 
                  isEditMode={editMode} 
                  photos={activePhotos} 
                  video={activeVideo} 
                  onTextChange={handleTextConfigSave} 
                />
              </section>

              <section id="scrapbook" className="border-b border-sakura/10">
                <DreamGallery 
                  textConfig={activeTextConfig} 
                  isEditMode={editMode} 
                  photos={activePhotos} 
                  onTextChange={handleTextConfigSave} 
                />
              </section>

              <section id="cinema" className="border-b border-sakura/10">
                <CinemaRoom 
                  textConfig={activeTextConfig} 
                  isEditMode={editMode} 
                  video={activeVideo} 
                  onTextChange={handleTextConfigSave} 
                  onRefreshVideo={loadUniverseData}
                />
              </section>

              <section id="final">
                <FinalScreen photos={activePhotos} />
              </section>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Floating Edit Toggle Trigger */}
      {entered && (
        <button
          onClick={() => setEditMode(!editMode)}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-45 bg-sakura hover:bg-sakura/80 text-dream-pink px-4.5 py-3 rounded-full shadow-lg border border-sakura/50 font-bold uppercase text-[9px] tracking-widest cursor-pointer hover:scale-105 transition-all flex items-center gap-1.5"
          style={{ color: '#E8B7C8' }}
        >
          <Hammer className="w-3.5 h-3.5" />
          <span>{editMode ? 'Lock Universe' : '✦ Edit My Universe'}</span>
        </button>
      )}
    </main>
  );
}
