"use client";

import { useEditorStore } from "@/lib/editorStore";

export default function FileExplorer() {
  const files = useEditorStore((s) => s.files);
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const openFile = useEditorStore((s) => s.openFile);

  return (
    <div className="h-full p-4">
      <h2 className="mb-4 font-bold">
        📁 Project
      </h2>

      <div className="space-y-2">
        {(Object.keys(files) as (keyof typeof files)[]).map((file) => (
          <button
            key={file}
            onClick={() => openFile(file)}
            className={`w-full rounded px-3 py-2 text-left transition ${
              selectedFile === file
                ? "bg-blue-600 text-white"
                : "hover:bg-zinc-800"
            }`}
          >
            📄 {file}
          </button>
        ))}
      </div>
    </div>
  );
}