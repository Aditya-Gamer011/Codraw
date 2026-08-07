"use client";

import React from "react";
import { Sliders } from "lucide-react";

type Props = {
  selectedInfo: {
    selector: string;
    tagName: string;
    category?: string;
  };
  inspectorOpen: boolean;
  onToggleInspector: () => void;
};

export default function FloatingActionBar({
  selectedInfo,
  inspectorOpen: _inspectorOpen,
  onToggleInspector,
}: Props) {
  return (
    <div className="absolute top-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/15 bg-black/60 p-1.5 pl-4 text-xs text-white shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl transition-all select-none">
      <span className="font-mono text-[11px] text-sky-200 font-semibold px-3 py-1 rounded-full bg-white/10 border border-white/15 truncate max-w-[200px] shadow-inner">
        &lt;{selectedInfo.tagName}&gt; {selectedInfo.selector}
      </span>

      <div className="h-4 w-px bg-white/20" />

      <button
        onClick={onToggleInspector}
        className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white border border-white/30 hover:bg-white/30 transition-all active:scale-95 shadow-md"
        title="Open Design Inspector Restyle Menu"
      >
        <Sliders size={13} className="text-sky-300" />
        <span>Restyle</span>
      </button>
    </div>
  );
}
