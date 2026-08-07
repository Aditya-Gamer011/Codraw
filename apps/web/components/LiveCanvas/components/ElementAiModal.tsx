"use client";

import React from "react";
import { Sparkles, X } from "lucide-react";

type Props = {
  isOpen: boolean;
  selectedInfo: {
    selector: string;
    tagName: string;
  } | null;
  elementAiPrompt: string;
  setElementAiPrompt: (val: string) => void;
  elementAiLoading: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export default function ElementAiModal({
  isOpen,
  selectedInfo,
  elementAiPrompt,
  setElementAiPrompt,
  elementAiLoading,
  onClose,
  onSubmit,
}: Props) {
  if (!isOpen || !selectedInfo) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-zinc-950 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-purple-500/30 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Improve Element with AI
              </h3>
              <p className="text-xs text-zinc-400">Describe visual or structural changes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-sky-500/20 bg-sky-950/30 px-3.5 py-2.5 font-mono text-xs text-sky-300 flex items-center gap-2">
          <span className="text-zinc-500 uppercase font-semibold text-[10px]">Target:</span>
          <span className="truncate">&lt;{selectedInfo.tagName}&gt; {selectedInfo.selector}</span>
        </div>

        <textarea
          value={elementAiPrompt}
          onChange={(e) => setElementAiPrompt(e.target.value)}
          placeholder="e.g. Make this button feel premium with subtle glassmorphism and smooth hover state..."
          className="mb-5 h-28 w-full rounded-xl border border-white/10 bg-black/60 p-3.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/50 shadow-inner resize-none transition-all"
          autoFocus
        />

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={elementAiLoading}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-sky-500 px-5 py-2 text-xs font-semibold text-white shadow-[0_4px_20px_rgba(168,85,247,0.4)] transition-all hover:scale-105 hover:brightness-120 disabled:opacity-50"
          >
            {elementAiLoading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate Update
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
