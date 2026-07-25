"use client";

import CodeEditor from "./CodeEditor";
import { useEditorStore } from "@/lib/editorStore";

export default function BottomPanel() {
  const openTabs = useEditorStore((s) => s.openTabs);
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const openFile = useEditorStore((s) => s.openFile);
  const closeTab = useEditorStore((s) => s.closeTab);

  return (
    <div className="flex h-full flex-col bg-neutral-900">
      <div className="flex border-b border-neutral-800 bg-neutral-950">
        {openTabs.map((file) => (
          <div
            key={file}
            className={`flex items-center border-r border-neutral-800 ${
              selectedFile === file
                ? "bg-neutral-900"
                : ""
            }`}
          >
            <button
              onClick={() => openFile(file)}
              className="px-4 py-2 text-sm"
            >
              {file}
            </button>

            <button
              onClick={() => closeTab(file)}
              className="px-2 text-neutral-500 hover:text-red-400"
            >
              ×
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