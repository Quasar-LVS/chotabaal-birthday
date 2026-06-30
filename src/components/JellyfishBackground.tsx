'use client';

import React, { useEffect, useRef } from 'react';

interface Tentacle {
  xOffset: number;
  length: number;
  speed: number;
  amplitude: number;
}

interface Jellyfish {
  x: number;
  y: number;
  baseRadius: number;
  radius: number;
  color: string;
  opacity: number;
  speedX: number;
  speedY: number;
  pulsePhase: number;
  pulseSpeed: number;
  tentacles: Tentacle[];
  parallaxFactor: number;
}

export default function JellyfishBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Color definitions in RGB format
    const colors = [
      '232, 183, 200', // Highlight Muted Rose Pink
      '122, 77, 104',  // Glow Magenta
      '247, 214, 224', // Soft Light Pink
      '74, 46, 71',    // Accent Muted Plum
    ];

    const jellyfishList: Jellyfish[] = [];
    // Spawn count depending on device screen width
    const maxJellyfish = width < 768 ? 6 : 14;

    const createJellyfish = (startY: number | null = null): Jellyfish => {
      const baseRadius = Math.random() * 25 + 15; // bell radius (15px to 40px)
      const color = colors[Math.floor(Math.random() * colors.length)];
      const opacity = Math.random() * 0.12 + 0.05; // very subtle and transparent
      
      const tentacles: Tentacle[] = [];
      const tentacleCount = Math.floor(Math.random() * 3) + 4; // 4 to 6 tentacles
      for (let i = 0; i < tentacleCount; i++) {
        tentacles.push({
          xOffset: ((i / (tentacleCount - 1)) - 0.5) * baseRadius * 1.5,
          length: baseRadius * (Math.random() * 3 + 2.5),
          speed: Math.random() * 0.04 + 0.02,
          amplitude: Math.random() * 4 + 2,
        });
      }

      return {
        x: Math.random() * width,
        y: startY !== null ? startY : Math.random() * height,
        baseRadius,
        radius: baseRadius,
        color,
        opacity,
        speedX: Math.random() * 0.2 - 0.1,
        speedY: -(Math.random() * 0.15 + 0.05), // drift upwards
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.015 + 0.008,
        tentacles,
        parallaxFactor: Math.random() * 0.4 + 0.2, // layers
      };
    };

    // Pre-populate list
    for (let i = 0; i < maxJellyfish; i++) {
      jellyfishList.push(createJellyfish());
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const drawJellyfish = (ctx: CanvasRenderingContext2D, jelly: Jellyfish) => {
      ctx.save();
      ctx.translate(jelly.x, jelly.y);

      // Pulse bell size
      const pulseFactor = 1 + Math.sin(jelly.pulsePhase) * 0.15;
      const w = jelly.baseRadius * 1.3 * pulseFactor;
      const h = jelly.baseRadius * 0.95 / pulseFactor;

      // Draw tentacles first (so they are drawn underneath the bell)
      ctx.lineWidth = 1.2;
      jelly.tentacles.forEach((t) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${jelly.color}, ${jelly.opacity * 0.7})`;
        
        ctx.moveTo(t.xOffset * pulseFactor, h * 0.2);
        
        const segments = 18;
        const segmentLen = t.length / segments;
        
        for (let j = 1; j <= segments; j++) {
          const segY = j * segmentLen;
          // Apply sinusoidal wave relative to segment depth and pulse time
          const wave = Math.sin(jelly.pulsePhase * 2.2 + j * 0.35) * t.amplitude * (j / segments) * pulseFactor;
          // Curve backward slightly based on upward velocity
          const drag = (j / segments) * (j / segments) * 8 * Math.abs(jelly.speedY);
          
          ctx.lineTo(t.xOffset * pulseFactor + wave - drag, h * 0.2 + segY);
        }
        ctx.stroke();
      });

      // Draw main Bell (cap)
      ctx.beginPath();
      // Gradient for 3D glow effect
      const grad = ctx.createRadialGradient(0, -h * 0.2, 2, 0, -h * 0.2, w);
      grad.addColorStop(0, `rgba(${jelly.color}, ${jelly.opacity * 1.5})`);
      grad.addColorStop(0.5, `rgba(${jelly.color}, ${jelly.opacity * 0.8})`);
      grad.addColorStop(1, `rgba(${jelly.color}, 0)`);
      ctx.fillStyle = grad;

      // Bell shape
      ctx.moveTo(-w, 0);
      ctx.bezierCurveTo(-w, -h * 1.3, w, -h * 1.3, w, 0);
      ctx.bezierCurveTo(w * 0.7, h * 0.25, -w * 0.7, h * 0.25, -w, 0);
      ctx.closePath();
      ctx.fill();

      // Rim edge shine highlight
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${jelly.color}, ${jelly.opacity * 1.8})`;
      ctx.lineWidth = 1.5;
      ctx.moveTo(-w, 0);
      ctx.bezierCurveTo(-w * 0.6, h * 0.2, w * 0.6, h * 0.2, w, 0);
      ctx.stroke();

      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      jellyfishList.forEach((jelly, index) => {
        // Update phase
        jelly.pulsePhase += jelly.pulseSpeed;

        // Apply upward drift physics, slightly accelerated during pulse contraction
        const pulsePush = Math.max(0, Math.sin(jelly.pulsePhase)) * 0.15;
        jelly.y += jelly.speedY * (1 + pulsePush);
        jelly.x += jelly.speedX;

        // Interactive mouse push behavior
        const dx = jelly.x - mouse.x;
        const dy = jelly.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 180) {
          const force = (180 - dist) / 180; // normalized weight (0 to 1)
          // Gently push jellyfish away from cursor
          jelly.x += (dx / dist) * force * 1.8;
          jelly.y += (dy / dist) * force * 1.2;
        }

        // Wrap or respawn once they drift off screen
        if (jelly.y < -150) {
          // Recycle back to bottom
          jellyfishList[index] = createJellyfish(height + 100);
        }
        if (jelly.x < -100) {
          jelly.x = width + 50;
        } else if (jelly.x > width + 100) {
          jelly.x = -50;
        }

        drawJellyfish(ctx, jelly);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-10 block"
    />
  );
}
