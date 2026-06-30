'use client';

import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, Variants } from 'framer-motion';
import { Heart } from 'lucide-react';
import { TextConfig } from '@/utils/db';
import EditableText from './EditableText';
import EditableTextArea from './EditableTextArea';

interface HeroSectionProps {
  textConfig: TextConfig;
  isEditMode: boolean;
  onTextChange: (newConfig: TextConfig) => void;
}

export default function HeroSection({
  textConfig,
  isEditMode,
  onTextChange,
}: HeroSectionProps) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth) - 0.5;
      const y = (e.clientY / innerHeight) - 0.5;
      rawX.set(x);
      rawY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [rawX, rawY]);

  const parallaxTextX = useTransform(rawX, (v) => v * 30);
  const parallaxTextY = useTransform(rawY, (v) => v * 30);
  const parallaxCardX = useTransform(rawX, (v) => v * -18);
  const parallaxCardY = useTransform(rawY, (v) => v * -18);

  const textContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className="relative min-h-[85vh] w-full flex flex-col items-center justify-center py-20 px-4">
      {/* Decorative light bloom panels */}
      <motion.div 
        style={{ x: parallaxCardX, y: parallaxCardY }}
        className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-cream/15 blur-3xl pointer-events-none" 
      />
      <motion.div 
        style={{ x: parallaxTextX, y: parallaxTextY, animationDelay: '-4s' }}
        className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-sakura/15 blur-3xl pointer-events-none animate-pulse" 
      />

      {/* Main glass container */}
      <motion.div
        style={{ x: parallaxCardX, y: parallaxCardY }}
        className="dream-glass w-full max-w-3xl p-8 md:p-16 rounded-[40px] shadow-sm relative overflow-hidden flex flex-col items-center border border-sakura/40 z-25"
      >
        <motion.div
          variants={textContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col items-center text-center w-full"
        >
          {/* Heart icon */}
          <motion.div variants={itemVariants} className="mb-6 text-dream-pink animate-pulse" style={{ color: '#E8B7C8' }}>
            <Heart className="w-5 h-5 fill-current" />
          </motion.div>

          {/* Heading */}
          <div className="w-full mb-3 z-30">
            <EditableText
              value={textConfig.heroTitle}
              isEditMode={isEditMode}
              onChange={(val) => {
                const newConfig = { ...textConfig };
                newConfig.heroTitle = val;
                onTextChange(newConfig);
              }}
              as="h2"
              className="serif-heading text-3xl md:text-4xl lg:text-5xl font-light text-dusty-plum leading-snug w-full"
            />
          </div>
          
          <div className="w-full mb-8 z-30">
            <EditableText
              value={textConfig.heroSubtitle}
              isEditMode={isEditMode}
              onChange={(val) => {
                const newConfig = { ...textConfig };
                newConfig.heroSubtitle = val;
                onTextChange(newConfig);
              }}
              as="p"
              className="text-[10px] uppercase tracking-[0.2em] text-dusty-plum/60 font-semibold w-full"
            />
          </div>

          <motion.div variants={itemVariants} className="w-12 h-[1px] bg-sakura/60 mb-8" />

          {/* Paragraph logs */}
          <div className="space-y-6 text-dusty-plum/80 text-sm md:text-base font-light leading-relaxed max-w-xl text-center w-full z-30">
            {textConfig.heroParagraphs.map((para, idx) => (
              <div key={idx} className="w-full">
                <EditableTextArea
                  value={para}
                  isEditMode={isEditMode}
                  onChange={(val) => {
                    const newConfig = { ...textConfig };
                    newConfig.heroParagraphs[idx] = val;
                    onTextChange(newConfig);
                  }}
                  className="w-full text-center text-dusty-plum/80 font-light"
                />
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
