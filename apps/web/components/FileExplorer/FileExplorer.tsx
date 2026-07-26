"use client";

import { FileCode2, FolderOpen } from "lucide-react";

import { useEditorStore } from "@/lib/editorStore";

export default function FileExplorer() {
  const files = useEditorStore((s) => s.files);
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const openFile = useEditorStore((s) => s.openFile);

  return (
    <div className="sleek-panel h-full border-r p-4 text-zinc-100">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-zinc-400">
        <FolderOpen size={16} className="text-zinc-300" />
        Project
      </h2>

      <div className="space-y-2">
        {(Object.keys(files) as (keyof typeof files)[]).map((file) => (
          <button
            key={file}
            onClick={() => openFile(file)}
            className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition ${
              selectedFile === file
                ? "sleek-button-active"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <FileCode2 size={15} />
            {file}
          </button>
        ))}
      </div>
    </div>
  );
}
