"use client";

import React from "react";
import { Paintbrush } from "lucide-react";

type Props = {
  bgColor: string;
  setBgColor: (val: string) => void;
  textColor: string;
  setTextColor: (val: string) => void;
  showTypography: boolean;
  applyStyle: (property: string, value: string) => void;
};

export default function ColorsSection({
  bgColor,
  setBgColor,
  textColor,
  setTextColor,
  showTypography,
  applyStyle,
}: Props) {
  return (
    <div className="space-y-3.5 rounded-xl border border-white/5 bg-zinc-900/40 p-3.5 backdrop-blur-sm">
      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
        <Paintbrush size={14} className="text-rose-400" />
        Colors & Background
      </h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-zinc-400 mb-1 block font-medium">Background</label>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 p-1 shadow-inner">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => {
                setBgColor(e.target.value);
                applyStyle("backgroundColor", e.target.value);
              }}
              className="h-5 w-6 cursor-pointer border-0 bg-transparent"
            />
            <span className="font-mono text-[10px] text-zinc-300">{bgColor}</span>
          </div>
        </div>

        {showTypography && (
          <div>
            <label className="text-[11px] text-zinc-400 mb-1 block font-medium">Text Color</label>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 p-1 shadow-inner">
              <input
                type="color"
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value);
                  applyStyle("color", e.target.value);
                }}
                className="h-5 w-6 cursor-pointer border-0 bg-transparent"
              />
              <span className="font-mono text-[10px] text-zinc-300">{textColor}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
