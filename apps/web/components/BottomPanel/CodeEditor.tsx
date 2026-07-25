"use client";

import Editor from "@monaco-editor/react";

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
      theme="vs-dark"
      value={files[selectedFile]}
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