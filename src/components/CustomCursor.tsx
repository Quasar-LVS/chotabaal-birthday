'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, Variants } from 'framer-motion';

export default function CustomCursor() {
  const [hoverState, setHoverState] = useState<'default' | 'button' | 'photo' | 'video'>('default');
  const [isMobile, setIsMobile] = useState(true);

  // Mouse position hooks using framer-motion values
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth springs for outer ring lag
  const springConfig = { damping: 28, stiffness: 220, mass: 0.5 };
  const outerX = useSpring(mouseX, springConfig);
  const outerY = useSpring(mouseY, springConfig);

  const [stretch, setStretch] = useState({ scaleX: 1, scaleY: 1, rotate: 0 });

  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    if (isDesktop) {
      document.documentElement.classList.add('custom-cursor-active');
    }
    return () => {
      document.documentElement.classList.remove('custom-cursor-active');
    };
  }, []);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);

    if (window.innerWidth < 1024) return;

    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      mouseX.set(clientX);
      mouseY.set(clientY);

      // Velocity calculation
      const dx = clientX - lastX;
      const dy = clientY - lastY;
      const speed = Math.sqrt(dx * dx + dy * dy);

      if (speed > 1.5) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const stretchAmount = Math.min(speed * 0.012, 0.4); // max 40% stretch
        setStretch({
          scaleX: 1 + stretchAmount,
          scaleY: 1 - stretchAmount * 0.8,
          rotate: angle,
        });
      } else {
        setStretch({ scaleX: 1, scaleY: 1, rotate: 0 });
      }

      lastX = clientX;
      lastY = clientY;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const closestButton = target.closest('button, a, [role="button"], label, input[type="range"]');
      const closestPhoto = target.closest('img, [data-hover="photo"]');
      const closestVideo = target.closest('video, [data-hover="video"], .cinema-video-container');

      if (closestButton) {
        setHoverState('button');
      } else if (closestPhoto) {
        setHoverState('photo');
      } else if (closestVideo) {
        setHoverState('video');
      } else {
        setHoverState('default');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [mouseX, mouseY]);

  if (isMobile) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Outer Circle Ring */}
      {hoverState !== 'photo' ? (
        <motion.div
          style={{
            x: outerX,
            y: outerY,
            translateX: '-50%',
            translateY: '-50%',
            scaleX: stretch.scaleX,
            scaleY: stretch.scaleY,
            rotate: stretch.rotate,
          }}
          animate={{
            width: hoverState === 'button' ? 52 : hoverState === 'video' ? 64 : 26,
            height: hoverState === 'button' ? 52 : hoverState === 'video' ? 64 : 26,
            backgroundColor: hoverState === 'video' ? 'rgba(235, 203, 255, 0.25)' : 'rgba(255, 255, 255, 0)',
            borderColor: hoverState === 'button' ? '#FFB6D5' : hoverState === 'video' ? '#FFF2E7' : '#FFD1E0',
            borderWidth: hoverState === 'video' ? 2 : 1.2,
          }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
          className="rounded-full border pointer-events-none fixed shadow-sm flex items-center justify-center"
        >
          {hoverState === 'video' && (
            <span className="text-[9px] uppercase tracking-widest text-dusty-berry font-bold select-none" style={{ color: '#654B62' }}>
              Play
            </span>
          )}
        </motion.div>
      ) : (
        // Photo Hover: turns cursor into floating sparkles
        <motion.div
          style={{
            x: mouseX,
            y: mouseY,
            translateX: '-50%',
            translateY: '-50%',
          }}
          className="fixed"
        >
          <div className="relative">
            <motion.span
              animate={{ scale: [0, 1.2, 0], y: [-15, -25], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              className="absolute text-[8px]"
              style={{ color: '#FFD1E0' }}
            >
              ✦
            </motion.span>
            <motion.span
              animate={{ scale: [0, 1, 0], x: [15, 25], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }}
              className="absolute text-[6px]"
              style={{ color: '#FFF2E7' }}
            >
              ✦
            </motion.span>
            <motion.span
              animate={{ scale: [0, 1.2, 0], x: [-15, -22], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 0.7, delay: 0.25 }}
              className="absolute text-[7px]"
              style={{ color: '#FFB6D5' }}
            >
              ✦
            </motion.span>
          </div>
        </motion.div>
      )}

      {/* Inner Heart */}
      {hoverState !== 'photo' && hoverState !== 'video' && (
        <motion.div
          style={{
            x: mouseX,
            y: mouseY,
            translateX: '-50%',
            translateY: '-50%',
          }}
          className="fixed flex items-center justify-center pointer-events-none"
        >
          <motion.span
            animate={{
              scale: hoverState === 'button' ? 1.4 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="text-[9px] select-none font-bold"
            style={{ color: '#FFB6D5' }}
          >
            ♥
          </motion.span>
        </motion.div>
      )}
    </div>
  );

}
