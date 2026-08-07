"use client";

import { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";

type Props = {
  initialAnimation?: string;
  applyStyle: (property: string, value: string) => void;
};

const ANIMATIONS = [
  { id: "none", label: "None", value: "none" },
  { id: "fadeIn", label: "Fade In", value: "fadeIn 0.8s ease-out forwards" },
  { id: "slideUp", label: "Slide Up", value: "slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" },
  { id: "zoomIn", label: "Zoom In", value: "zoomIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" },
  { id: "pulse", label: "Pulse", value: "pulseGlow 2s infinite ease-in-out" },
  { id: "float", label: "Float", value: "floatOrb 6s infinite ease-in-out alternate" },
];

function detectAnimationId(animStr?: string): string {
  if (!animStr || animStr === "none") return "none";
  if (animStr.includes("fadeIn")) return "fadeIn";
  if (animStr.includes("slideUp")) return "slideUp";
  if (animStr.includes("zoomIn")) return "zoomIn";
  if (animStr.includes("pulseGlow") || animStr.includes("pulse")) return "pulse";
  if (animStr.includes("floatOrb") || animStr.includes("float")) return "float";
  return "none";
}

export default function AnimationSection({ initialAnimation, applyStyle }: Props) {
  const [selectedAnim, setSelectedAnim] = useState("none");

  const [prevAnim, setPrevAnim] = useState(initialAnimation);
  if (prevAnim !== initialAnimation) {
    setPrevAnim(initialAnimation);
    setSelectedAnim(detectAnimationId(initialAnimation));
  }

  function handleSelect(anim: typeof ANIMATIONS[number]) {
    setSelectedAnim(anim.id);
    applyStyle("animation", anim.value);
  }

  const activeLabel = ANIMATIONS.find((a) => a.id === selectedAnim && a.id !== "none")?.label;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-purple-300">
        <div className="flex items-center gap-1.5">
          <Wand2 size={14} className="text-purple-400" />
          <span>Animations & Motion</span>
        </div>
        {activeLabel && (
          <span className="flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300 border border-purple-500/30 font-semibold">
            <Sparkles size={10} />
            {activeLabel}
          </span>
        )}
      </div>

      <p className="text-[11px] text-zinc-400">
        {activeLabel ? (
          <span className="text-purple-300 font-medium">Currently active: <strong>{activeLabel}</strong>. Click another to change or None to remove.</span>
        ) : (
          "Apply entrance animations & motion effects:"
        )}
      </p>

      <div className="grid grid-cols-3 gap-1.5 pt-1">
        {ANIMATIONS.map((anim) => (
          <button
            key={anim.id}
            onClick={() => handleSelect(anim)}
            className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
              selectedAnim === anim.id
                ? "border-purple-500/50 bg-purple-500/20 text-purple-300 shadow-sm"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white"
            }`}
          >
            {anim.label}
          </button>
        ))}
      </div>
    </div>
  );
}
