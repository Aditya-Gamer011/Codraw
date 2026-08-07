"use client";

import { create } from "zustand";
import { ProjectFiles } from "./types";

interface EditorStore {
  files: ProjectFiles;

  setFiles: (
    files: ProjectFiles | ((prev: ProjectFiles) => ProjectFiles)
  ) => void;

  selectedFile: string;
  setSelectedFile: (file: string) => void;

  openTabs: string[];
  setOpenTabs: (tabs: string[]) => void;

  openFile: (file: string) => void;
  closeTab: (file: string) => void;
  addFile: (filename: string, content?: string) => void;
  deleteFile: (filename: string) => void;
  renameFile: (oldFilename: string, newFilename: string) => void;

  history: ProjectFiles[];
  future: ProjectFiles[];
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  files: {},
  history: [],
  future: [],
  canUndo: false,
  canRedo: false,

  setFiles: (filesAction) => {
    const { files, history, openTabs, selectedFile } = get();
    const newFiles =
      typeof filesAction === "function"
        ? filesAction(files)
        : filesAction;

    if (JSON.stringify(files) === JSON.stringify(newFiles)) return;

    const newHistory = [...history, files].slice(-30);
    const validTabs = openTabs.filter((tab) => newFiles[tab] !== undefined);
    const nextSelected = newFiles[selectedFile] !== undefined ? selectedFile : (validTabs[0] || "");

    set({
      files: newFiles,
      history: newHistory,
      future: [],
      canUndo: newHistory.length > 0,
      canRedo: false,
      openTabs: validTabs,
      selectedFile: nextSelected,
    });
  },

  undo: () => {
    const { files, history, future } = get();
    if (history.length === 0) return;

    const previousFiles = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);
    const newFuture = [files, ...future];

    set({
      files: previousFiles,
      history: newHistory,
      future: newFuture,
      canUndo: newHistory.length > 0,
      canRedo: true,
    });
  },

  redo: () => {
    const { files, history, future } = get();
    if (future.length === 0) return;

    const nextFiles = future[0];
    const newFuture = future.slice(1);
    const newHistory = [...history, files];

    set({
      files: nextFiles,
      history: newHistory,
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
    });
  },

  selectedFile: "",

  setSelectedFile: (file) =>
    set({
      selectedFile: file,
    }),

  openTabs: [],

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

    const closedIndex = openTabs.indexOf(file);
    const newTabs = openTabs.filter((tab) => tab !== file);

    let nextSelected = selectedFile;

    if (selectedFile === file) {
      if (newTabs.length === 0) {
        nextSelected = "";
      } else {
        nextSelected = newTabs[Math.max(0, closedIndex - 1)];
      }
    }

    set({
      openTabs: newTabs,
      selectedFile: nextSelected,
    });
  },

  addFile(filename, content = "") {
    const { files, openTabs, history } = get();
    if (files[filename]) return;

    const newFiles = { ...files, [filename]: content };
    const newHistory = [...history, files].slice(-30);

    set({
      files: newFiles,
      history: newHistory,
      future: [],
      canUndo: newHistory.length > 0,
      canRedo: false,
      openTabs: openTabs.includes(filename) ? openTabs : [...openTabs, filename],
      selectedFile: filename,
    });
  },

  deleteFile(filename) {
    const { files, openTabs, selectedFile, history } = get();
    const newFiles = { ...files };
    delete newFiles[filename];

    const newHistory = [...history, files].slice(-30);
    const newTabs = openTabs.filter((t) => t !== filename && newFiles[t] !== undefined);
    let nextSelected = selectedFile;

    if (selectedFile === filename || newFiles[selectedFile] === undefined) {
      nextSelected = newTabs.length > 0 ? newTabs[newTabs.length - 1] : "";
    }

    set({
      files: newFiles,
      history: newHistory,
      future: [],
      canUndo: newHistory.length > 0,
      canRedo: false,
      openTabs: newTabs,
      selectedFile: nextSelected,
    });
  },

  renameFile(oldFilename, newFilename) {
    if (!newFilename || oldFilename === newFilename) return;

    const { files, openTabs, selectedFile, history } = get();
    if (files[newFilename]) return;

    const content = files[oldFilename];
    const newFiles = { ...files };
    delete newFiles[oldFilename];
    newFiles[newFilename] = content;

    const newHistory = [...history, files].slice(-30);
    const newTabs = openTabs.map((t) => (t === oldFilename ? newFilename : t));
    const nextSelected = selectedFile === oldFilename ? newFilename : selectedFile;

    set({
      files: newFiles,
      history: newHistory,
      future: [],
      canUndo: newHistory.length > 0,
      canRedo: false,
      openTabs: newTabs,
      selectedFile: nextSelected,
    });
  },
}));
