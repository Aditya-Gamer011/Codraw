"use client";

import React from "react";
import { Type } from "lucide-react";
import SleekSlider from "./SleekSlider";

type Props = {
  fontSize: string;
  setFontSize: (val: string) => void;
  fontWeight: string;
  setFontWeight: (val: string) => void;
  applyStyle: (property: string, value: string) => void;
};

export default function TypographySection({
  fontSize,
  setFontSize,
  fontWeight,
  setFontWeight,
  applyStyle,
}: Props) {
  return (
    <div className="space-y-3.5 rounded-xl border border-white/5 bg-zinc-900/40 p-3.5 backdrop-blur-sm">
      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
        <Type size={14} className="text-amber-400" />
        Typography
      </h4>

      <SleekSlider
        label="Font Size"
        value={parseInt(fontSize) || 16}
        min={8}
        max={96}
        accentColor="sky"
        onChange={(val) => {
          setFontSize(val.toString());
          applyStyle("fontSize", `${val}px`);
        }}
      />

      <div>
        <label className="text-[11px] text-zinc-400 mb-1 block font-medium">Weight</label>
        <select
          value={fontWeight}
          onChange={(e) => {
            setFontWeight(e.target.value);
            applyStyle("fontWeight", e.target.value);
          }}
          className="w-full rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500 shadow-inner"
        >
          <option value="300" className="bg-zinc-950">300 Light</option>
          <option value="400" className="bg-zinc-950">400 Normal</option>
          <option value="500" className="bg-zinc-950">500 Medium</option>
          <option value="600" className="bg-zinc-950">600 SemiBold</option>
          <option value="700" className="bg-zinc-950">700 Bold</option>
          <option value="800" className="bg-zinc-950">800 ExtraBold</option>
        </select>
      </div>
    </div>
  );
}
