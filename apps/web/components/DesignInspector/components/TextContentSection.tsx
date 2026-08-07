"use client";

import { Type } from "lucide-react";
import { useState } from "react";

type Props = {
  initialText: string;
  selectedTag: string;
  onApplyText: (text: string) => void;
};

export default function TextContentSection({
  initialText,
  selectedTag,
  onApplyText,
}: Props) {
  const [text, setText] = useState(initialText);

  const [prevText, setPrevText] = useState(initialText);
  if (prevText !== initialText) {
    setPrevText(initialText);
    setText(initialText);
  }

  function handleChange(val: string) {
    setText(val);
    onApplyText(val);
  }

  const isLongText = text.length > 40 || ["p", "blockquote"].includes(selectedTag.toLowerCase());

  return (
    <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3 space-y-2 text-xs">
      <div className="flex items-center gap-1.5 font-bold text-sky-300">
        <Type size={14} className="text-sky-400" />
        <span>Content & Text</span>
      </div>

      <p className="text-[11px] text-zinc-400 leading-snug">
        Edit text inside &lt;{selectedTag}&gt;:
      </p>

      {isLongText ? (
        <textarea
          rows={3}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter content..."
          className="w-full rounded-lg border border-zinc-700/80 bg-zinc-900 px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-sky-500 transition resize-y"
        />
      ) : (
        <input
          type="text"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter content..."
          className="w-full rounded-lg border border-zinc-700/80 bg-zinc-900 px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-sky-500 transition"
        />
      )}
    </div>
  );
}
