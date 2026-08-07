"use client";

import React, { useRef } from "react";

type SleekSliderProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  accentColor?: "sky" | "cyan" | "purple" | "emerald";
  onChange: (val: number) => void;
};

export default function SleekSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = "px",
  accentColor = "sky",
  onChange,
}: SleekSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const rectRef = useRef<{ left: number; width: number } | null>(null);

  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const updateFromPointer = (clientX: number) => {
    if (!rectRef.current) return;
    const rawRatio = (clientX - rectRef.current.left) / rectRef.current.width;
    const clampedRatio = Math.min(1, Math.max(0, rawRatio));
    const rawVal = min + clampedRatio * (max - min);
    const steppedVal = Math.round(rawVal / step) * step;
    const finalVal = Math.min(max, Math.max(min, steppedVal));
    onChange(finalVal);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!trackRef.current) return;
    rectRef.current = trackRef.current.getBoundingClientRect();
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      updateFromPointer(e.clientX);
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    rectRef.current = null;
  };

  const gradients = {
    sky: "from-sky-500 to-blue-500",
    cyan: "from-cyan-500 to-teal-400",
    purple: "from-purple-500 to-indigo-500",
    emerald: "from-emerald-500 to-teal-400",
  };

  const thumbStyles = {
    sky: "bg-white border-2 border-sky-500",
    cyan: "bg-white border-2 border-cyan-500",
    purple: "bg-white border-2 border-purple-500",
    emerald: "bg-white border-2 border-emerald-500",
  };

  return (
    <div className="space-y-1.5 select-none">
      <div className="flex justify-between text-[11px]">
        <span className="text-zinc-400 font-medium">{label}</span>
        <span className="font-mono text-[11px] text-zinc-200 font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 shadow-inner">
          {value}{unit}
        </span>
      </div>

      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="group relative flex h-6 w-full cursor-pointer items-center touch-none"
      >
        {/* Track Background */}
        <div className="h-1.5 w-full rounded-full bg-black/60 border border-white/10 overflow-hidden relative shadow-inner">
          {/* Active Gradient Fill */}
          <div
            className={`h-full bg-gradient-to-r ${gradients[accentColor]} transition-all duration-75`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Floating Custom Thumb (No Glow, Clean White Circle) */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full ${thumbStyles[accentColor]} transition-transform group-hover:scale-125 active:scale-110`}
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
