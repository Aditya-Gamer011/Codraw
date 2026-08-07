"use client";

import React from "react";
import { Minimize2 } from "lucide-react";
import SleekSlider from "./SleekSlider";

type Props = {
  borderRadius: string;
  setBorderRadius: (val: string) => void;
  borderWidth: string;
  setBorderWidth: (val: string) => void;
  borderColor: string;
  setBorderColor: (val: string) => void;
  applyStyle: (property: string, value: string) => void;
};

export default function BordersSection({
  borderRadius,
  setBorderRadius,
  borderWidth,
  setBorderWidth,
  borderColor,
  setBorderColor,
  applyStyle,
}: Props) {
  return (
    <div className="space-y-3.5 rounded-xl border border-white/5 bg-zinc-900/40 p-3.5 backdrop-blur-sm">
      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
        <Minimize2 size={14} className="text-emerald-400" />
        Borders & Corner Radius
      </h4>

      <SleekSlider
        label="Border Radius"
        value={parseInt(borderRadius) || 0}
        min={0}
        max={64}
        accentColor="emerald"
        onChange={(val) => {
          setBorderRadius(val.toString());
          applyStyle("borderRadius", `${val}px`);
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-zinc-400 mb-1 block font-medium">Width (px)</label>
          <input
            type="number"
            value={borderWidth}
            onChange={(e) => {
              setBorderWidth(e.target.value);
              applyStyle("borderWidth", `${e.target.value}px`);
              if (e.target.value !== "0") {
                applyStyle("borderStyle", "solid");
              }
            }}
            className="w-full rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500 shadow-inner"
          />
        </div>

        <div>
          <label className="text-[11px] text-zinc-400 mb-1 block font-medium">Border Color</label>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 p-1 shadow-inner">
            <input
              type="color"
              value={borderColor}
              onChange={(e) => {
                setBorderColor(e.target.value);
                applyStyle("borderColor", e.target.value);
              }}
              className="h-5 w-6 cursor-pointer border-0 bg-transparent"
            />
            <span className="font-mono text-[10px] text-zinc-300">{borderColor}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
