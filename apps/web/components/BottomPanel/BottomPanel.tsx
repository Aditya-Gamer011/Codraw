"use client";

import { X } from "lucide-react";

import CodeEditor from "./CodeEditor";
import { useEditorStore } from "@/lib/editorStore";

export default function BottomPanel() {
  const openTabs = useEditorStore((s) => s.openTabs);
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const openFile = useEditorStore((s) => s.openFile);
  const closeTab = useEditorStore((s) => s.closeTab);

  return (
    <div className="sleek-panel flex h-full flex-col border-t">
      <div className="flex border-b border-zinc-800 bg-zinc-950">
        {openTabs.map((file) => (
          <div
            key={file}
            className={`flex items-center border-r border-zinc-800 ${
              selectedFile === file
                ? "bg-zinc-900 text-white"
                : "text-zinc-500"
            }`}
          >
            <button
              onClick={() => openFile(file)}
              className="px-4 py-2 text-sm transition hover:text-white"
            >
              {file}
            </button>

            <button
              onClick={() => closeTab(file)}
              className="grid h-7 w-7 place-items-center text-zinc-600 transition hover:text-rose-400"
              aria-label={`Close ${file}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex-1">
        <CodeEditor />
      </div>
    </div>
  );
}
