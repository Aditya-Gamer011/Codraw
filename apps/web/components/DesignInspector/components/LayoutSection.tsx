"use client";

import React from "react";
import { LayoutGrid } from "lucide-react";
import SleekSlider from "./SleekSlider";

type Props = {
  displayMode: string;
  setDisplayMode: (val: string) => void;
  gap: string;
  setGap: (val: string) => void;
  applyStyle: (property: string, value: string) => void;
};

export default function LayoutSection({
  displayMode,
  setDisplayMode,
  gap,
  setGap,
  applyStyle,
}: Props) {
  return (
    <div className="space-y-3.5 rounded-xl border border-white/5 bg-zinc-900/40 p-3.5 backdrop-blur-sm">
      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
        <LayoutGrid size={14} className="text-sky-400" />
        Layout & Flex
      </h4>

      <div className="space-y-1.5">
        <label className="text-[11px] text-zinc-400 block font-medium">Display</label>
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-black/40 p-1 text-xs">
          {["flex", "block", "grid"].map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setDisplayMode(mode);
                applyStyle("display", mode);
              }}
              className={`rounded-md py-1 text-center font-mono text-[11px] transition-all ${
                displayMode === mode
                  ? "bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {displayMode === "flex" && (
        <SleekSlider
          label="Gap Spacing"
          value={parseInt(gap) || 0}
          min={0}
          max={64}
          accentColor="sky"
          onChange={(val) => {
            setGap(val.toString());
            applyStyle("gap", `${val}px`);
          }}
        />
      )}
    </div>
  );
}
