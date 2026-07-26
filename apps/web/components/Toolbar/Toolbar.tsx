"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  FolderOpen,
  MousePointer2,
  Redo2,
  Undo2,
  Rocket,
  Sparkles,
  UserCircle2,
} from "lucide-react";

type Props = {
  visualEditEnabled: boolean;
  onVisualEditChange: (enabled: boolean) => void;

  aiOpen: boolean;
  onAiToggle: () => void;
};

export default function Toolbar({
  visualEditEnabled,
  onVisualEditChange,
  aiOpen,
  onAiToggle,
}: Props) {
  const [projectOpen, setProjectOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const projectRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;

      if (!projectRef.current?.contains(target)) {
        setProjectOpen(false);
      }

      if (!accountRef.current?.contains(target)) {
        setAccountOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClick);

    return () =>
      window.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="sleek-panel flex h-12 items-center border-b px-4 text-white">

      {/* Logo */}
      <div className="mr-6 text-sm font-semibold tracking-wide text-zinc-100">
        Codraw
      </div>

      {/* ---------------- Project ---------------- */}

      <div className="relative" ref={projectRef}>
        <button
          onClick={() => setProjectOpen((v) => !v)}
          className="sleek-button flex h-8 items-center gap-2 rounded px-3"
        >
          Project
          <ChevronDown size={15} />
        </button>

        {projectOpen && (
          <div className="absolute left-0 top-10 z-50 w-64 rounded-lg border border-zinc-800 bg-zinc-950 py-1 shadow-xl">

            <button className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-900">
              <FolderOpen size={16} />
              Open Project...
            </button>

            <button className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-900">
              Save Project As...
            </button>

            <div className="my-1 border-t border-zinc-800" />

            <button className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-900">
              <Download size={16} />
              Export Website (.zip)
            </button>

          </div>
        )}
      </div>

      <div className="mx-4 h-5 w-px bg-zinc-700" />

      {/* Undo */}

      <button
        disabled
        className="sleek-button grid h-8 w-8 place-items-center rounded opacity-50"
        title="Undo"
      >
        <Undo2 size={16} />
      </button>

      {/* Redo */}

      <button
        disabled
        className="sleek-button ml-2 grid h-8 w-8 place-items-center rounded opacity-50"
        title="Redo"
      >
        <Redo2 size={16} />
      </button>

      <div className="mx-4 h-5 w-px bg-zinc-700" />

      {/* Visual Edit */}

      <button
        aria-pressed={visualEditEnabled}
        onClick={() =>
          onVisualEditChange(!visualEditEnabled)
        }
        className={`flex h-8 items-center gap-2 rounded border px-3 transition ${
          visualEditEnabled
            ? "sleek-button-active"
            : "sleek-button"
        }`}
      >
        <MousePointer2 size={15} />
        Visual Edit
      </button>

      {/* Push everything else to the right */}


      <div className="mx-4 h-5 w-px bg-zinc-700" />

{/* AI */}

<button
  aria-pressed={aiOpen}
  onClick={onAiToggle}
  className={`flex h-8 items-center gap-2 rounded border px-3 transition ${
    aiOpen
      ? "sleek-button-active"
      : "sleek-button"
  }`}
>
  <Sparkles size={15} />
  AI
</button>

      <div className="ml-auto flex items-center gap-3">

        {/* Publish */}

        <button className="flex h-8 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200">
          <Rocket size={15} />
          Publish
        </button>

        {/* Account */}

        <div className="relative" ref={accountRef}>
          <button
            onClick={() => setAccountOpen((v) => !v)}
            className="sleek-button flex h-8 items-center gap-2 rounded px-3"
          >
            <UserCircle2 size={18} />
            Account
            <ChevronDown size={15} />
          </button>

          {accountOpen && (
            <div className="absolute right-0 top-10 z-50 w-56 rounded-lg border border-zinc-800 bg-zinc-950 py-1 shadow-xl">

              <button className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-900">
                Log in
              </button>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}