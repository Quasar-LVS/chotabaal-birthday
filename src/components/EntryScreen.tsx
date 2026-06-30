'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { TextConfig } from '@/utils/db';
import EditableText from './EditableText';

interface EntryScreenProps {
  onEnter: () => void;
  textConfig: TextConfig;
  isEditMode: boolean;
  onTextChange: (key: string, val: string) => void;
}

export default function EntryScreen({
  onEnter,
  textConfig,
  isEditMode,
  onTextChange,
}: EntryScreenProps) {
  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-cloud-pink z-50 px-4">
      {/* Soft light bloom backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-cream/20 blur-3xl light-bloom" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-sakura/20 blur-3xl light-bloom" style={{ animationDelay: '-6s' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full"
      >
        <div className="dream-glass text-center py-16 px-8 md:px-12 rounded-3xl shadow-lg relative overflow-hidden flex flex-col items-center">
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="w-10 h-10 rounded-full bg-sakura/20 flex items-center justify-center text-dream-pink mb-6"
            style={{ color: '#E8B7C8' }}
          >
            <Heart className="w-4 h-4 fill-current" />
          </motion.div>

          <EditableText
            value={textConfig.title}
            isEditMode={isEditMode}
            onChange={(val) => onTextChange('title', val)}
            as="p"
            className="text-[10px] uppercase tracking-[0.25em] text-dusty-plum/60 font-semibold mb-2"
          />

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 1 }}
            className="serif-heading text-4xl md:text-5xl font-light text-dusty-plum leading-tight mb-8"
          >
            Happy <br />
            <span className="font-serif italic text-dream-pink" style={{ color: '#E8B7C8' }}>Birthday</span>
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="w-16 h-[1.2px] bg-sakura/60 mb-8"
          />

          {isEditMode ? (
            <div className="w-full max-w-[240px] z-30">
              <EditableText
                value={textConfig.enterButton}
                isEditMode={isEditMode}
                onChange={(val) => onTextChange('enterButton', val)}
                className="text-xs uppercase font-bold text-center block text-dusty-plum"
              />
            </div>
          ) : (
            <motion.button
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={onEnter}
              className="pink-glow-hover px-10 py-3.5 bg-sakura text-dusty-plum text-xs uppercase tracking-[0.2em] font-semibold rounded-full hover:bg-sakura/80 cursor-pointer shadow-md z-30 transition-all border border-sakura/60"
            >
              {textConfig.enterButton}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
