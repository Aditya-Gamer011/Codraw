"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  pulseSpeed: number;
  pulseVal: number;
  color: string;
}

export default function AmbientParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    // Warm atmospheric palette: gold, amber, cyan sparks
    const colors = [
      "rgba(251, 191, 36, ",  // amber-400
      "rgba(245, 158, 11, ",  // amber-500
      "rgba(252, 211, 77, ",  // amber-300
      "rgba(56, 189, 248, ",  // cyan-400 (magic spark)
      "rgba(238, 242, 255, ", // white glow
    ];

    const particleCount = 45;
    const particles: Particle[] = [];

    // Cave region estimate: center-ish area (x: 45%-55%, y: 50%-65%)
    const createParticle = (): Particle => {
      const isCaveSource = Math.random() > 0.3;
      const x = isCaveSource
        ? width * (0.45 + Math.random() * 0.1)
        : Math.random() * width;
      const y = isCaveSource
        ? height * (0.5 + Math.random() * 0.2)
        : Math.random() * height;

      const maxAlpha = 0.3 + Math.random() * 0.6;
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.3 - Math.random() * 0.7, // Slow upward float
        size: 1 + Math.random() * 2.5,
        alpha: Math.random() * maxAlpha,
        maxAlpha,
        pulseSpeed: 0.01 + Math.random() * 0.03,
        pulseVal: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx + Math.sin(p.pulseVal) * 0.2;
        p.y += p.vy;
        p.pulseVal += p.pulseSpeed;
        p.alpha = Math.abs(Math.sin(p.pulseVal)) * p.maxAlpha;

        // Reset if offscreen
        if (p.y < -20 || p.x < -20 || p.x > width + 20) {
          Object.assign(p, createParticle());
          p.y = height * (0.55 + Math.random() * 0.2); // Start near cave
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.shadowColor = p.color + "1)";
        ctx.shadowBlur = p.size * 4;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-20 h-full w-full opacity-90"
    />
  );
}
