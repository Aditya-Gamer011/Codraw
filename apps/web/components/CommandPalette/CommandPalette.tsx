"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Command,
  FilePlus,
  FolderDown,
  FolderGit2,
  GitCommit,
  Globe,
  MousePointerClick,
  Plus,
  Redo2,
  Search,
  Sparkles,
  Undo2,
  Upload,
  X,
} from "lucide-react";

import { useEditorStore } from "@/lib/editorStore";

export type CommandAction = {
  id: string;
  label: string;
  description: string;
  category: "Git & Repo" | "AI & Tools" | "Files & Project" | "History";
  icon: React.ReactNode;
  iconBg: string;
  shortcut?: string;
  run: () => void;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onRunAction: (actionId: string) => void;
};

export default function CommandPalette({ isOpen, onClose, onRunAction }: Props) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Adjust state during render when props or search change (React 19 pattern)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
    }
  }

  const [prevSearch, setPrevSearch] = useState(search);
  if (prevSearch !== search) {
    setPrevSearch(search);
    setSelectedIndex(0);
  }

  const files = useEditorStore((s) => s.files);
  const openFile = useEditorStore((s) => s.openFile);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);

  const baseActions: CommandAction[] = [
    {
      id: "generate_website",
      label: "Generate Website with AI",
      description: "Use Gemini AI to build or redesign your website",
      category: "AI & Tools",
      icon: <Sparkles size={16} className="text-amber-300" />,
      iconBg: "bg-amber-500/20 border-amber-500/30",
      shortcut: "⌘AI",
      run: () => onRunAction("generate_website"),
    },
    {
      id: "toggle_elements",
      label: "Open Elements Library",
      description: "Add shapes, cards, text boxes, buttons & hero components",
      category: "AI & Tools",
      icon: <Box size={16} className="text-purple-300" />,
      iconBg: "bg-purple-500/20 border-purple-500/30",
      run: () => onRunAction("toggle_elements"),
    },
    {
      id: "toggle_visual",
      label: "Toggle Visual Edit Mode",
      description: "Enable direct click-to-edit restyling on canvas",
      category: "AI & Tools",
      icon: <MousePointerClick size={16} className="text-cyan-300" />,
      iconBg: "bg-cyan-500/20 border-cyan-500/30",
      run: () => onRunAction("toggle_visual"),
    },
    {
      id: "create_repo",
      label: "Create GitHub Repository",
      description: "Create a new GitHub repository for this project",
      category: "Git & Repo",
      icon: <FolderGit2 size={16} className="text-emerald-300" />,
      iconBg: "bg-emerald-500/20 border-emerald-500/30",
      run: () => onRunAction("create_repo"),
    },
    {
      id: "commit",
      label: "Commit & Push Changes",
      description: "Commit all modified project files to GitHub",
      category: "Git & Repo",
      icon: <GitCommit size={16} className="text-blue-300" />,
      iconBg: "bg-blue-500/20 border-blue-500/30",
      run: () => onRunAction("commit"),
    },
    {
      id: "publish",
      label: "Publish Live to GitHub Pages",
      description: "Deploy and host your site live on GitHub Pages",
      category: "Git & Repo",
      icon: <Globe size={16} className="text-pink-300" />,
      iconBg: "bg-pink-500/20 border-pink-500/30",
      run: () => onRunAction("publish"),
    },
    {
      id: "add_file",
      label: "Create New File",
      description: "Add a new HTML, CSS, JS or JSON file",
      category: "Files & Project",
      icon: <Plus size={16} className="text-emerald-300" />,
      iconBg: "bg-emerald-500/20 border-emerald-500/30",
      shortcut: "N",
      run: () => onRunAction("add_file"),
    },
    {
      id: "upload_asset",
      label: "Upload Media Asset",
      description: "Upload images, audio, video or media files",
      category: "Files & Project",
      icon: <Upload size={16} className="text-rose-300" />,
      iconBg: "bg-rose-500/20 border-rose-500/30",
      run: () => onRunAction("upload_asset"),
    },
    {
      id: "save_project",
      label: "Export Project ZIP",
      description: "Export project folder or download ZIP archive",
      category: "Files & Project",
      icon: <FolderDown size={16} className="text-sky-300" />,
      iconBg: "bg-sky-500/20 border-sky-500/30",
      run: () => onRunAction("save_project"),
    },
    {
      id: "undo",
      label: "Undo Edit",
      description: "Revert the last code or file edit",
      category: "History",
      icon: <Undo2 size={16} className="text-zinc-300" />,
      iconBg: "bg-zinc-800 border-zinc-700",
      shortcut: "Ctrl+Z",
      run: () => {
        if (canUndo) undo();
      },
    },
    {
      id: "redo",
      label: "Redo Edit",
      description: "Restore the next reverted code edit",
      category: "History",
      icon: <Redo2 size={16} className="text-zinc-300" />,
      iconBg: "bg-zinc-800 border-zinc-700",
      shortcut: "Ctrl+Y",
      run: () => {
        if (canRedo) redo();
      },
    },
  ];

  // Add file open actions dynamically
  const fileActions: CommandAction[] = Object.keys(files).map((filename) => ({
    id: `open_file_${filename}`,
    label: `Open ${filename}`,
    description: `Switch editor view to ${filename}`,
    category: "Files & Project",
    icon: <FilePlus size={16} className="text-blue-300" />,
    iconBg: "bg-blue-500/20 border-blue-500/30",
    run: () => openFile(filename),
  }));

  const allActions = [...baseActions, ...fileActions];

  const filteredActions = allActions.filter(
    (action) =>
      action.label.toLowerCase().includes(search.toLowerCase()) ||
      action.description.toLowerCase().includes(search.toLowerCase()) ||
      action.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex, isOpen]);

  const safeSelectedIndex = Math.min(selectedIndex, Math.max(0, filteredActions.length - 1));

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredActions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredActions.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredActions[safeSelectedIndex];
        if (selected) {
          selected.run();
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredActions, safeSelectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 pt-16 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-zinc-950 shadow-2xl backdrop-blur-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center border-b border-white/10 px-4 py-3 bg-white/5">
          <Search size={18} className="mr-3 text-purple-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commands or files (e.g. Commit, Publish, Elements)..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none font-medium"
          />
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action List */}
        <div
          ref={listRef}
          className="max-h-84 overflow-y-auto p-2 space-y-1"
        >
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No commands matching &quot;{search}&quot;
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const isSelected = idx === safeSelectedIndex;
              return (
                <div
                  key={action.id}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    action.run();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-all ${
                    isSelected
                      ? "bg-gradient-to-r from-purple-500/20 to-sky-500/10 border border-purple-500/40 text-white shadow-md"
                      : "text-zinc-300 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`grid h-8 w-8 place-items-center rounded-lg border ${action.iconBg} shadow-sm shrink-0`}>
                      {action.icon}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-zinc-100">
                        {action.label}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        {action.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono text-zinc-300 border border-white/10">
                      {action.category}
                    </span>
                    {action.shortcut && (
                      <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 border border-zinc-700">
                        {action.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-white/10 bg-black/40 px-4 py-2 text-[11px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span><kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-300 border border-zinc-700">↑↓</kbd> navigate</span>
            <span><kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-300 border border-zinc-700">↵</kbd> select</span>
            <span><kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-300 border border-zinc-700">esc</kbd> close</span>
          </div>
          <div className="flex items-center gap-1 text-purple-400 font-semibold">
            <Command size={12} />
            <span>CoDraw Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
}
