"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import type { Monaco } from "@monaco-editor/react";
import { Check, Copy, FileAudio, FileCode2, FileImage, FileVideo } from "lucide-react";

import { useEditorStore } from "@/lib/editorStore";

function getLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "html":
    case "htm":
      return "html";
    case "css":
      return "css";
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "json":
      return "json";
    case "md":
    case "markdown":
      return "markdown";
    case "svg":
    case "xml":
      return "xml";
    default:
      return "plaintext";
  }
}

export default function CodeEditor() {
  const files = useEditorStore((s) => s.files);
  const setFiles = useEditorStore((s) => s.setFiles);
  const selectedFile = useEditorStore((s) => s.selectedFile);

  const [copied, setCopied] = useState(false);

  if (!selectedFile || files[selectedFile] === undefined) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#0f0f11] p-6 text-center text-zinc-500">
        <FileCode2 size={40} className="mb-3 text-zinc-700 stroke-[1.5]" />
        <p className="text-sm font-medium text-zinc-400">No open files</p>
        <p className="mt-1 text-xs text-zinc-600">
          Select a file from the Project panel to start editing, or create a new file.
        </p>
      </div>
    );
  }

  const content = files[selectedFile] || "";
  const ext = selectedFile.split(".").pop()?.toLowerCase() || "";

  const isImage =
    content.startsWith("data:image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "svg"].includes(ext);

  const isAudio =
    content.startsWith("data:audio/") ||
    ["mp3", "wav", "ogg", "flac", "m4a"].includes(ext);

  const isVideo =
    content.startsWith("data:video/") ||
    ["mp4", "webm", "ogv", "mov"].includes(ext);

  function copySnippet(snippet: string) {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Render Image Preview Tab
  if (isImage) {
    const htmlSnippet = `<img src="${selectedFile}" alt="${selectedFile}" />`;

    return (
      <div className="flex h-full flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-100">
        <div className="mb-4 flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs text-zinc-400">
          <FileImage size={16} className="text-emerald-400" />
          <span>Image Asset: <strong className="text-white">{selectedFile}</strong></span>
          <button
            onClick={() => copySnippet(htmlSnippet)}
            className="sleek-button ml-3 flex items-center gap-1 rounded border px-2 py-1 text-xs text-zinc-300"
            title="Copy HTML Tag"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? "Copied Tag!" : "Copy HTML Tag"}
          </button>
        </div>

        <div className="flex max-h-[75%] max-w-[85%] items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-xl backdrop-blur-sm">
          {/* eslint-disable-next-html-element-suppress */}
          <img
            src={content}
            alt={selectedFile}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </div>
    );
  }

  // Render Audio Preview Tab
  if (isAudio) {
    const htmlSnippet = `<audio src="${selectedFile}" controls></audio>`;

    return (
      <div className="flex h-full flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-100">
        <div className="mb-6 flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs text-zinc-400">
          <FileAudio size={16} className="text-purple-400" />
          <span>Audio Asset: <strong className="text-white">{selectedFile}</strong></span>
          <button
            onClick={() => copySnippet(htmlSnippet)}
            className="sleek-button ml-3 flex items-center gap-1 rounded border px-2 py-1 text-xs text-zinc-300"
            title="Copy HTML Tag"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? "Copied Tag!" : "Copy HTML Tag"}
          </button>
        </div>

        <div className="flex w-full max-w-md flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
          <audio src={content} controls className="w-full" />
        </div>
      </div>
    );
  }

  // Render Video Preview Tab
  if (isVideo) {
    const htmlSnippet = `<video src="${selectedFile}" controls></video>`;

    return (
      <div className="flex h-full flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-100">
        <div className="mb-4 flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs text-zinc-400">
          <FileVideo size={16} className="text-rose-400" />
          <span>Video Asset: <strong className="text-white">{selectedFile}</strong></span>
          <button
            onClick={() => copySnippet(htmlSnippet)}
            className="sleek-button ml-3 flex items-center gap-1 rounded border px-2 py-1 text-xs text-zinc-300"
            title="Copy HTML Tag"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? "Copied Tag!" : "Copy HTML Tag"}
          </button>
        </div>

        <div className="flex max-h-[75%] max-w-[85%] items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-xl">
          <video src={content} controls className="max-h-full max-w-full rounded" />
        </div>
      </div>
    );
  }

  // Code / Text Editor
  return (
    <Editor
      height="100%"
      language={getLanguage(selectedFile)}
      theme="codraw-sleek"
      value={content}
      beforeMount={(monaco: Monaco) => {
        monaco.editor.defineTheme("codraw-sleek", {
          base: "vs-dark",
          inherit: true,
          rules: [
            { token: "comment", foreground: "71717a" },
            { token: "keyword", foreground: "60a5fa" },
            { token: "string", foreground: "a5b4fc" },
            { token: "number", foreground: "93c5fd" },
            { token: "tag", foreground: "60a5fa" },
            { token: "attribute.name", foreground: "d4d4d8" },
          ],
          colors: {
            "editor.background": "#0f0f11",
            "editor.foreground": "#f4f4f5",
            "editorLineNumber.foreground": "#52525b",
            "editorLineNumber.activeForeground": "#a1a1aa",
            "editorCursor.foreground": "#3b82f6",
            "editor.selectionBackground": "#2563eb55",
            "editor.inactiveSelectionBackground": "#27272a",
            "editor.lineHighlightBackground": "#18181b",
            "editorGutter.background": "#0f0f11",
          },
        });
      }}
      onChange={(value) =>
        setFiles((prev) => ({
          ...prev,
          [selectedFile]: value ?? "",
        }))
      }
      options={{
        minimap: {
          enabled: false,
        },
        fontSize: 14,
        automaticLayout: true,
        wordWrap: "on",
        scrollBeyondLastLine: false,
      }}
    />
  );
}
