"use client";

import Editor from "@monaco-editor/react";
import type { Monaco } from "@monaco-editor/react";

import { useEditorStore } from "@/lib/editorStore";

export default function CodeEditor() {
  const files = useEditorStore((s) => s.files);
  const setFiles = useEditorStore((s) => s.setFiles);
  const selectedFile = useEditorStore(
    (s) => s.selectedFile
  );

  const language =
    selectedFile === "index.html"
      ? "html"
      : selectedFile === "style.css"
      ? "css"
      : "javascript";

  return (
    <Editor
      height="100%"
      language={language}
      theme="codraw-sleek"
      value={files[selectedFile]}
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
