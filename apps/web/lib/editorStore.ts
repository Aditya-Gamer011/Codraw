"use client";

import { create } from "zustand";
import { ProjectFiles } from "./types";

const defaultFiles: ProjectFiles = {
  "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Preview</title>
</head>
<body>
  <main>
    <h1>Preview</h1>
    <p>Whatever you make will appear here.</p>
  </main>
</body>
</html>`,

  "style.css": `body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #0f172a;
  color: #f8fafc;
  text-align: center;
}

h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #38bdf8; /* Soft blue accent */
}

p {
  color: #94a3b8;
  max-width: 400px;
  line-height: 1.5;
  margin: 0;
}`,

  "script.js": ``,
};

interface EditorStore {
  files: ProjectFiles;

  setFiles: (
    files: ProjectFiles | ((prev: ProjectFiles) => ProjectFiles)
  ) => void;

  selectedFile: keyof ProjectFiles;
  setSelectedFile: (file: keyof ProjectFiles) => void;

  openTabs: (keyof ProjectFiles)[];
  setOpenTabs: (tabs: (keyof ProjectFiles)[]) => void;

  openFile: (file: keyof ProjectFiles) => void;
  closeTab: (file: keyof ProjectFiles) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  files: defaultFiles,

  setFiles: (files) =>
    set((state) => ({
      files:
        typeof files === "function"
          ? files(state.files)
          : files,
    })),

  selectedFile: "index.html",

  setSelectedFile: (file) =>
    set({
      selectedFile: file,
    }),

  openTabs: ["index.html"],

  setOpenTabs: (tabs) =>
    set({
      openTabs: tabs,
    }),

  openFile(file) {
    const { openTabs } = get();

    if (!openTabs.includes(file)) {
        set({
            openTabs: [...openTabs, file],
            selectedFile: file,
        });

        return;
    }

    set({
        selectedFile: file,
    });
},

  closeTab(file) {
    const { openTabs, selectedFile } = get();

    if (openTabs.length === 1) return;

    const closedIndex = openTabs.indexOf(file);

    const newTabs = openTabs.filter(
        (tab) => tab !== file
    );

    let nextSelected = selectedFile;

    if (selectedFile === file) {
        nextSelected =
            newTabs[
                Math.max(
                    0,
                    closedIndex - 1
                )
            ];
    }

    set({
        openTabs: newTabs,
        selectedFile: nextSelected,
    });
},
}));
