'use client';

import React, { useEffect, useRef } from 'react';

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  angle: number;
  spinSpeed: number;
  opacity: number;
}

interface TwinkleStar {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  maxOpacity: number;
}

export default function SparklePetals() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const petals: Petal[] = [];
    const stars: TwinkleStar[] = [];

    const isMobile = width < 768;
    const petalCount = isMobile ? 8 : 22;
    const starCount = isMobile ? 15 : 45;

    // Create drifting petals
    const createPetal = (startYAtTop = false): Petal => {
      return {
        x: Math.random() * width,
        y: startYAtTop ? -20 : Math.random() * height,
        size: Math.random() * 8 + 5, // size 5 to 13
        speedY: Math.random() * 0.6 + 0.4, // drift down
        speedX: Math.random() * 0.4 - 0.1, // drift slightly right
        angle: Math.random() * Math.PI * 2,
        spinSpeed: Math.random() * 0.015 - 0.007,
        opacity: Math.random() * 0.45 + 0.2, // soft transparent pink
      };
    };

    // Create twinkling stars
    const createStar = (): TwinkleStar => {
      const maxOpacity = Math.random() * 0.6 + 0.25;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * maxOpacity,
        twinkleSpeed: Math.random() * 0.012 + 0.004,
        maxOpacity,
      };
    };

    // Populating initially
    for (let i = 0; i < petalCount; i++) petals.push(createPetal());
    for (let i = 0; i < starCount; i++) stars.push(createStar());

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const drawPetalShape = (c: CanvasRenderingContext2D, p: Petal) => {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.angle);
      c.globalAlpha = p.opacity;
      c.fillStyle = '#E8B7C8'; // Highlight Muted Rose Gold
      
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(p.size * 0.6, -p.size * 0.5, 0, -p.size * 1.3);
      c.quadraticCurveTo(-p.size * 0.6, -p.size * 0.5, 0, 0);
      c.closePath();
      c.fill();
      
      // Draw subtle rib lines
      c.strokeStyle = '#F7D6E0';
      c.lineWidth = 0.5;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, -p.size * 0.95);
      c.stroke();

      c.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Twinkle Stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.opacity += s.twinkleSpeed;
        
        // Bounce opacity to create twinkle
        if (s.opacity > s.maxOpacity || s.opacity < 0.05) {
          s.twinkleSpeed *= -1;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = '#F7D6E0'; // Soft Light Pink Twinkle Glow
        ctx.globalAlpha = Math.max(0, s.opacity);
        ctx.fill();
      }

      // 2. Fall Petals
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.y += p.speedY;
        p.x += p.speedX;
        p.angle += p.spinSpeed;

        // Reset if off bottom or sides
        if (p.y > height + 20) {
          petals[i] = createPetal(true);
        }
        if (p.x > width + 20) {
          p.x = -10;
        } else if (p.x < -20) {
          p.x = width + 10;
        }

        drawPetalShape(ctx, p);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-15 block"
    />
  );
}
