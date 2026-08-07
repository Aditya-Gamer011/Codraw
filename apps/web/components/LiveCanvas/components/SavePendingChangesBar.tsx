"use client";

import React from "react";
import { Check, X } from "lucide-react";

type Props = {
  pendingCount: number;
  onSave: () => void;
  onDiscard: () => void;
};

export default function SavePendingChangesBar({
  pendingCount,
  onSave,
  onDiscard,
}: Props) {
  if (pendingCount === 0) return null;

  return (
    <div className="absolute right-5 top-5 z-40 flex items-center gap-2 rounded-full border border-white/20 bg-zinc-950/80 px-3 py-1 text-xs backdrop-blur-xl shadow-xl select-none">
      <span className="px-2 text-xs text-zinc-300 font-medium">
        Save changes ({pendingCount})
      </span>
      <button
        type="button"
        onClick={onSave}
        className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-500 shadow-md"
        title="Save visual changes to code"
      >
        <Check size={14} />
      </button>
      <button
        type="button"
        onClick={onDiscard}
        className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-zinc-300 transition hover:bg-white/20 hover:text-white"
        title="Discard visual changes"
      >
        <X size={14} />
      </button>
    </div>
  );
}
