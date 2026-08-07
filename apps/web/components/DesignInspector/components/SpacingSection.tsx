"use client";

import React from "react";
import { Maximize2 } from "lucide-react";
import SleekSlider from "./SleekSlider";

type Props = {
  padding: string;
  setPadding: (val: string) => void;
  margin: string;
  setMargin: (val: string) => void;
  applyStyle: (property: string, value: string) => void;
};

export default function SpacingSection({
  padding,
  setPadding,
  margin,
  setMargin,
  applyStyle,
}: Props) {
  return (
    <div className="space-y-3.5 rounded-xl border border-white/5 bg-zinc-900/40 p-3.5 backdrop-blur-sm">
      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
        <Maximize2 size={14} className="text-purple-400" />
        Spacing
      </h4>

      <SleekSlider
        label="Padding"
        value={parseInt(padding) || 0}
        min={0}
        max={80}
        accentColor="cyan"
        onChange={(val) => {
          setPadding(val.toString());
          applyStyle("padding", `${val}px`);
        }}
      />

      <SleekSlider
        label="Margin"
        value={parseInt(margin) || 0}
        min={0}
        max={80}
        accentColor="purple"
        onChange={(val) => {
          setMargin(val.toString());
          applyStyle("margin", `${val}px`);
        }}
      />
    </div>
  );
}
