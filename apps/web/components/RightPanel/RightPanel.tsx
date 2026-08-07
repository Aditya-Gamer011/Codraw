"use client";

import { Boxes, Sparkles, X } from "lucide-react";
import AIPanel from "../AIPanel/AIPanel";
import ElementsPanel from "../ElementsPanel/ElementsPanel";
import { ProjectFiles } from "@/lib/types";

type Props = {
  activeTab: "ai" | "elements";
  onTabChange: (tab: "ai" | "elements") => void;
  onClose: () => void;
  onAiSuccess?: (previousFiles: ProjectFiles) => void;
  onVisualEditEnable?: () => void;
};

export default function RightPanel({
  activeTab,
  onTabChange,
  onClose,
  onAiSuccess,
  onVisualEditEnable,
}: Props) {
  return (
    <div className="flex h-full flex-col bg-zinc-950 border-l border-zinc-800 shadow-2xl">
      {/* VS Code Style Tab Header Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/90 bg-zinc-900/90 px-2 pt-1">
        <div className="flex items-center gap-1">
          {/* AI Helper Tab */}
          <button
            onClick={() => onTabChange("ai")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === "ai"
                ? "border-sky-400 bg-zinc-950 text-sky-400"
                : "border-transparent text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
            }`}
          >
            <Sparkles size={14} className={activeTab === "ai" ? "text-sky-400" : "text-zinc-500"} />
            <span>AI Assistant</span>
          </button>

          {/* Elements Library Tab */}
          <button
            onClick={() => onTabChange("elements")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === "elements"
                ? "border-sky-400 bg-zinc-950 text-sky-400"
                : "border-transparent text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
            }`}
          >
            <Boxes size={14} className={activeTab === "elements" ? "text-sky-400" : "text-zinc-500"} />
            <span>Elements Library</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="sleek-button grid h-7 w-7 place-items-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-white"
          title="Close Panel"
        >
          <X size={15} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "ai" ? (
          <AIPanel onAiSuccess={onAiSuccess} />
        ) : (
          <ElementsPanel onVisualEditEnable={onVisualEditEnable} />
        )}
      </div>
    </div>
  );
}
