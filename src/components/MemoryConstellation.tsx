'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Image as ImageIcon, Film, Play } from 'lucide-react';
import Image from 'next/image';
import { TextConfig, PhotoEntry, MediaEntry } from '@/utils/db';
import EditableText from './EditableText';

interface StarNode {
  id: number;
  left: string; // percentage positions
  top: string;
  type: 'photo' | 'video';
  src: string;
}

const STAR_POSITIONS = [
  { id: 1, left: "15%", top: "32%", type: "photo" as const },
  { id: 2, left: "45%", top: "18%", type: "photo" as const },
  { id: 3, left: "76%", top: "28%", type: "photo" as const },
  { id: 4, left: "28%", top: "68%", type: "photo" as const },
  { id: 5, left: "58%", top: "62%", type: "video" as const },
  { id: 6, left: "82%", top: "76%", type: "photo" as const }
];

interface MemoryConstellationProps {
  textConfig: TextConfig;
  isEditMode: boolean;
  photos: PhotoEntry[];
  video: MediaEntry | null;
  onTextChange: (newConfig: TextConfig) => void;
}

export default function MemoryConstellation({
  textConfig,
  isEditMode,
  photos,
  video,
  onTextChange,
}: MemoryConstellationProps) {
  const [activeNode, setActiveNode] = useState<StarNode | null>(null);

  const handleNodeClick = (pos: typeof STAR_POSITIONS[0]) => {
    let srcUrl = '';

    if (pos.type === 'video') {
      if (video) {
        srcUrl = video.blob ? URL.createObjectURL(video.blob) : (video.path || '/videos/birthday-film.mp4');
      } else {
        srcUrl = '/videos/birthday-film.mp4';
      }
    } else if (photos.length > 0) {
      const idx = (pos.id - 1) % photos.length;
      const photo = photos[idx];
      srcUrl = photo.blob ? URL.createObjectURL(photo.blob) : (photo.path || '');
    }

    setActiveNode({
      ...pos,
      src: srcUrl,
    });
  };

  const handleCloseModal = () => {
    if (activeNode && activeNode.src && activeNode.src.startsWith('blob:')) {
      URL.revokeObjectURL(activeNode.src);
    }
    setActiveNode(null);
  };

  // Interactive 3D Tilt Hook/Effect for the expanded Modal photo
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, shineX: 0, shineY: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    
    // Normalised positions (-0.5 to 0.5)
    const normX = (x / box.width) - 0.5;
    const normY = (y / box.height) - 0.5;
    
    setTilt({
      rotateX: -normY * 18,
      rotateY: normX * 18,
      shineX: (x / box.width) * 100,
      shineY: (y / box.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, shineX: 50, shineY: 50 });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-0 py-12 flex flex-col items-center">
      {/* Title Header */}
      <div className="text-center mb-16 space-y-3 z-30 w-full">
        <span className="text-xs uppercase tracking-[0.25em] text-sakura font-bold" style={{ color: '#E8B7C8' }}>
          Section 2
        </span>
        <div className="w-full max-w-md mx-auto">
          <EditableText
            value={textConfig.sectionTitles.constellation}
            isEditMode={isEditMode}
            onChange={(val) => {
              const newConfig = { ...textConfig };
              newConfig.sectionTitles.constellation = val;
              onTextChange(newConfig);
            }}
            as="h2"
            className="serif-heading text-3xl md:text-4xl text-dusty-plum font-light"
          />
        </div>
        <div className="w-12 h-[1px] bg-sakura/60 mx-auto mt-4" />
      </div>

      {/* Constellation Space */}
      <div className="relative w-full h-[520px] md:h-[600px] bg-sakura/5 rounded-[40px] border border-sakura/40 overflow-hidden shadow-inner z-20">
        {/* Soft background glow clouds */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-sakura/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-cream/10 blur-3xl pointer-events-none" />

        {/* Twinkling Star Lines */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none stroke-sakura/45"
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
        >
          <line x1="15" y1="32" x2="45" y2="18" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="45" y1="18" x2="76" y2="28" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="45" y1="18" x2="58" y2="62" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="58" y1="62" x2="82" y2="76" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="15" y1="32" x2="28" y2="68" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="28" y1="68" x2="58" y2="62" strokeWidth="0.8" strokeDasharray="3 3" />
        </svg>

        {/* Nodes */}
        {STAR_POSITIONS.map((pos) => {
          const hasPhoto = pos.type === 'video' ? video !== null : photos.length > 0;
          return (
            <div
              key={pos.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: pos.left, top: pos.top }}
            >
              {/* Outer pulsing ring */}
              <motion.div
                animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0.7, 0.35] }}
                transition={{ repeat: Infinity, duration: 2.2 + pos.id % 2, ease: "easeInOut" }}
                className="absolute inset-[-12px] bg-sakura/30 rounded-full blur-sm pointer-events-none"
              />
              
              {/* Node Button */}
              <motion.button
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNodeClick(pos)}
                className="relative w-8 h-8 rounded-full bg-cloud-pink border border-dream-pink/70 flex items-center justify-center shadow-md cursor-pointer hover:border-dream-pink transition-all z-10 animate-pulse"
              >
                {pos.type === 'video' ? (
                  <Film className="w-3.5 h-3.5 text-dream-pink" style={{ color: '#E8B7C8' }} />
                ) : hasPhoto ? (
                  <Star className="w-3.5 h-3.5 text-dream-pink fill-sakura/10" style={{ color: '#E8B7C8' }} />
                ) : (
                  <ImageIcon className="w-3 h-3 text-dusty-plum/30" />
                )}
              </motion.button>
            </div>
          );
        })}
      </div>

      {/* Immersive Photo Overlay Modal */}
      <AnimatePresence>
        {activeNode !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0E0911]/85 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          >
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-xl relative flex flex-col items-center"
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-cloud-pink/15 hover:bg-cloud-pink/30 flex items-center justify-center text-cloud-pink border border-cloud-pink/20 cursor-pointer transition-colors z-40"
              >
                <X className="w-5 h-5" />
              </button>

              {/* 3D Tilting Card container */}
              <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="relative w-full aspect-square md:aspect-[4/3] rounded-[32px] overflow-hidden shadow-2xl border border-sakura/40 bg-rose-mist transition-all duration-300 transform"
                style={{
                  transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Dynamic light reflection sweep */}
                <div 
                  className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay opacity-25 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at ${tilt.shineX}% ${tilt.shineY}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 60%)`
                  }}
                />

                {/* Render Media with absolutely no text, tags, dates, or overlays */}
                {activeNode.type === 'video' ? (
                  <video
                    src={activeNode.src}
                    controls
                    autoPlay
                    className="w-full h-full object-cover relative z-10"
                    playsInline
                  />
                ) : activeNode.src ? (
                  <div className="relative w-full h-full">
                    <img
                      src={activeNode.src}
                      alt=""
                      className="w-full h-full object-cover relative z-10"
                    />
                  </div>
                ) : (
                  // Empty Placeholder Frame with Camera Glyphs
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-dusty-plum/45 bg-[#221726]/40 z-10 relative">
                    <ImageIcon className="w-12 h-12 stroke-[1.2] text-dream-pink animate-pulse" style={{ color: '#E8B7C8' }} />
                    <span className="text-[10px] uppercase tracking-widest font-semibold font-sans text-dusty-plum/50">
                      Empty Photo Node #{activeNode.id}
                    </span>
                    <p className="text-[9px] text-dusty-plum/40 max-w-[220px] text-center font-light leading-relaxed px-4">
                      Toggle Edit Mode and upload images into the Photos tab to populate.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
