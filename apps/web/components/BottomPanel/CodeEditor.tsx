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
      theme="codraw-ocean"
      value={files[selectedFile]}
      beforeMount={(monaco: Monaco) => {
        monaco.editor.defineTheme("codraw-ocean", {
          base: "vs-dark",
          inherit: true,
          rules: [
            { token: "comment", foreground: "6bb6c9" },
            { token: "keyword", foreground: "67e8f9" },
            { token: "string", foreground: "7dd3fc" },
            { token: "number", foreground: "34d399" },
            { token: "tag", foreground: "22d3ee" },
            { token: "attribute.name", foreground: "a7f3ff" },
          ],
          colors: {
            "editor.background": "#02111c",
            "editor.foreground": "#dffbff",
            "editorLineNumber.foreground": "#2f7182",
            "editorLineNumber.activeForeground": "#67e8f9",
            "editorCursor.foreground": "#67e8f9",
            "editor.selectionBackground": "#0e749066",
            "editor.inactiveSelectionBackground": "#0e749033",
            "editor.lineHighlightBackground": "#08334466",
            "editorGutter.background": "#02111c",
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
