'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { TextConfig, PhotoEntry } from '@/utils/db';
import EditableText from './EditableText';

interface PhotoCardProps {
  id: number;
  src: string;
  rotation: string;
  onClick: () => void;
}

function PhotoCard({ id, src, rotation, onClick }: PhotoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, shineX: 50, shineY: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    
    const normX = (x / box.width) - 0.5;
    const normY = (y / box.height) - 0.5;
    
    setTilt({
      rotateX: -normY * 15,
      rotateY: normX * 15,
      shineX: (x / box.width) * 100,
      shineY: (y / box.height) * 100
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, shineX: 50, shineY: 50 });
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: -15, right: 15, top: -15, bottom: 15 }}
      dragElastic = {0.15}
      whileDrag={{ scale: 1.05, zIndex: 30 }}
      whileHover={{ scale: 1.03, zIndex: 20 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`break-inside-avoid w-full max-w-[280px] p-4 bg-white rounded-md shadow-md border border-sakura/20 select-none ${rotation} cursor-none transition-all duration-300 relative z-10`}
      style={{
        transform: `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Tape detail at top */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5.5 bg-white/40 backdrop-blur-xs border border-sakura/25 transform rotate-2 select-none pointer-events-none z-10" />

      {/* Interactive Photo Area */}
      <div 
        onClick={onClick}
        className="relative w-full aspect-square bg-rose-mist/10 rounded-xs overflow-hidden border border-sakura/20 group cursor-pointer"
        data-hover="photo"
      >
        {/* Dynamic shine sweep */}
        <div 
          className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay opacity-25 group-hover:opacity-40 transition-opacity"
          style={{
            background: `radial-gradient(circle at ${tilt.shineX}% ${tilt.shineY}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 60%)`
          }}
        />

        <img
          src={src}
          alt=""
          className="w-full h-full object-cover relative z-10"
        />

        {/* Soft Hover Zoom Glow */}
        <div className="absolute inset-0 bg-dusty-plum/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-15">
          <Maximize2 className="w-5 h-5 text-cloud-pink drop-shadow-xs" />
        </div>
      </div>
    </motion.div>
  );
}

interface DreamGalleryProps {
  textConfig: TextConfig;
  isEditMode: boolean;
  photos: PhotoEntry[];
  onTextChange: (newConfig: TextConfig) => void;
}

export default function DreamGallery({
  textConfig,
  isEditMode,
  photos,
  onTextChange,
}: DreamGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  // Convert binary Blobs or use paths cleanly
  useEffect(() => {
    const urls = photos.map((p) => p.blob ? URL.createObjectURL(p.blob) : (p.path || ''));
    setPhotoUrls(urls);

    // Garbage collection: revoke Blob URLs to prevent memory leaks
    return () => {
      urls.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [photos]);

  const navigateLightbox = (direction: 'next' | 'prev') => {
    if (lightboxIndex === null || photoUrls.length === 0) return;
    let nextIdx = direction === 'next' ? lightboxIndex + 1 : lightboxIndex - 1;

    // Wrap around
    if (nextIdx >= photoUrls.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = photoUrls.length - 1;

    setLightboxIndex(nextIdx);
  };

  const rotations = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3", "-rotate-2", "rotate-1"];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-0 py-12 flex flex-col items-center">
      {/* Title Header */}
      <div className="text-center mb-16 space-y-3 z-30 w-full">
        <span className="text-xs uppercase tracking-[0.25em] text-sakura font-bold" style={{ color: '#E8B7C8' }}>
          Section 3
        </span>
        <div className="w-full max-w-md mx-auto">
          <EditableText
            value={textConfig.sectionTitles.gallery}
            isEditMode={isEditMode}
            onChange={(val) => {
              const newConfig = { ...textConfig };
              newConfig.sectionTitles.gallery = val;
              onTextChange(newConfig);
            }}
            as="h2"
            className="serif-heading text-3xl md:text-4xl text-dusty-plum font-light"
          />
        </div>
        <div className="w-12 h-[1px] bg-sakura/60 mx-auto mt-4" />
      </div>

      {/* Photo grid - Polaroid style, draggable & tiltable */}
      {photoUrls.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8 w-full justify-items-center pb-16 z-20">
          {photoUrls.map((src, idx) => (
            <PhotoCard
              key={idx}
              id={idx + 1}
              src={src}
              rotation={rotations[idx % rotations.length]}
              onClick={() => setLightboxIndex(idx)}
            />
          ))}
        </div>
      ) : (
        // Empty Placeholder state
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 w-full justify-items-center py-16 z-20">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`w-full max-w-[260px] p-4 bg-white/5 border border-sakura/35 rounded-md shadow-sm flex flex-col gap-4 items-center justify-center aspect-[4/5] relative ${rotations[i % rotations.length]}`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5.5 bg-white/10 backdrop-blur-xs border border-sakura/15 rotate-1 pointer-events-none" />
              <ImageIcon className="w-10 h-10 stroke-[1.2] text-dream-pink/55 animate-pulse" style={{ color: '#E8B7C8' }} />
              <div className="text-center space-y-1">
                <span className="text-[9px] uppercase tracking-widest font-semibold text-dusty-plum/45">
                  Empty Scrapbook Slot #{i}
                </span>
                <p className="text-[8px] text-dusty-plum/30 max-w-[170px] mx-auto leading-relaxed">
                  Toggle Edit Mode and upload images into the Photos tab.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pure visual lightbox modal - absolutely clean, no description, no text */}
      <AnimatePresence>
        {lightboxIndex !== null && photoUrls.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0E0911]/90 flex items-center justify-center p-4 md:p-8"
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-cloud-pink/15 hover:bg-cloud-pink/30 flex items-center justify-center text-cloud-pink border border-cloud-pink/20 cursor-pointer transition-colors z-45"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Nav */}
            <button
              onClick={() => navigateLightbox('prev')}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-cloud-pink/5 hover:bg-cloud-pink/10 flex items-center justify-center text-cloud-pink border border-cloud-pink/10 cursor-pointer transition-colors z-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Right Nav */}
            <button
              onClick={() => navigateLightbox('next')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-cloud-pink/5 hover:bg-cloud-pink/10 flex items-center justify-center text-cloud-pink border border-cloud-pink/10 cursor-pointer transition-colors z-30"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Pure Photo Frame - No headers, no captions, no writing */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-3xl aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-sakura/30 bg-white/5"
            >
              <img
                src={photoUrls[lightboxIndex]}
                alt=""
                className="w-full h-full object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
