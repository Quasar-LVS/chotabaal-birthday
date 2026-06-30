'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PhotoEntry } from '@/utils/db';

interface FloatingThumb {
  id: number;
  left: string;
  top: string;
  rotateStart: number;
  duration: number;
}

const DRIFT_PRESETS = [
  { left: "10%", top: "15%", rotateStart: -8, duration: 11 },
  { left: "80%", top: "20%", rotateStart: 6, duration: 13 },
  { left: "15%", top: "70%", rotateStart: 5, duration: 10 },
  { left: "85%", top: "65%", rotateStart: -6, duration: 12 },
  { left: "30%", top: "10%", rotateStart: 4, duration: 14 },
  { left: "65%", top: "80%", rotateStart: -4, duration: 11 },
  { left: "45%", top: "85%", rotateStart: 8, duration: 10 },
];

interface FinalScreenProps {
  photos: PhotoEntry[];
}

export default function FinalScreen({ photos }: FinalScreenProps) {
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = photos.map((p) => p.blob ? URL.createObjectURL(p.blob) : (p.path || ''));
    setPhotoUrls(urls);

    return () => {
      urls.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [photos]);

  return (
    <div className="relative min-h-[90vh] w-full flex flex-col items-center justify-center overflow-hidden bg-cloud-pink">
      {/* Dynamic Floating Photo Grid */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {DRIFT_PRESETS.map((preset, index) => {
          const hasPhoto = photoUrls.length > 0;
          const src = hasPhoto ? photoUrls[index % photoUrls.length] : '';

          return (
            <motion.div
              key={index}
              style={{ left: preset.left, top: preset.top }}
              animate={{
                y: [0, -22, 0],
                rotate: [preset.rotateStart, preset.rotateStart + 4, preset.rotateStart],
              }}
              transition={{
                repeat: Infinity,
                duration: preset.duration,
                ease: "easeInOut",
              }}
              className="absolute w-20 h-24 bg-white p-1.5 rounded shadow-sm border border-sakura/20 opacity-20 select-none flex flex-col items-center justify-center"
            >
              <div className="relative w-full h-[80%] overflow-hidden rounded-xs bg-[#221726]/10 flex items-center justify-center text-sakura/35">
                {src ? (
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] select-none text-dream-pink" style={{ color: '#E8B7C8' }}>♥</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Ambient gradient overlay that blends bottom of page into background */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-cloud-pink to-transparent pointer-events-none z-10" />
    </div>
  );
}
