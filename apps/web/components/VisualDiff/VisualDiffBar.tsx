"use client";

import { Check, Sparkles, X } from "lucide-react";

type Props = {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  modifiedFilesCount?: number;
};

export default function VisualDiffBar({
  isOpen,
  onAccept,
  onReject,
  modifiedFilesCount = 1,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full border border-zinc-700 bg-zinc-950/95 px-5 py-2.5 shadow-2xl backdrop-blur-xl animate-bounceIn">
      <div className="flex items-center gap-2.5 text-xs text-zinc-200">
        <div className="grid h-6 w-6 place-items-center rounded-full bg-cyan-950 border border-cyan-700/60 text-cyan-400">
          <Sparkles size={13} />
        </div>
        <span className="font-medium text-white">AI Code Update</span>
        <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-400 border border-zinc-700">
          {modifiedFilesCount} {modifiedFilesCount === 1 ? "file" : "files"} modified
        </span>
      </div>

      <div className="h-4 w-px bg-zinc-800" />

      <div className="flex items-center gap-2">
        <button
          onClick={onReject}
          className="flex items-center gap-1.5 rounded-full border border-rose-800/80 bg-rose-950/50 px-3 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-900/80 hover:text-white transition"
          title="Rollback AI changes to previous version"
        >
          <X size={14} />
          Reject
        </button>

        <button
          onClick={onAccept}
          className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-1 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
          title="Accept and keep AI changes"
        >
          <Check size={14} />
          Accept Changes
        </button>
      </div>
    </div>
  );
}
