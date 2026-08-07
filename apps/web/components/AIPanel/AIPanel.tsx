"use client";

import { useState } from "react";
import { BrainCircuit, Sparkles, Zap } from "lucide-react";
import CustomModal, { ModalState } from "@/components/Modal/CustomModal";

import {
  isValidProject,
  parseProject,
} from "@/lib/parseProject";
import { useEditorStore } from "@/lib/editorStore";
import { ProjectFiles } from "@/lib/types";

const modelOptions = [
  { id: "fast", label: "Fast", icon: Zap, activeColor: "bg-amber-500/20 border-amber-500/50 text-amber-400" },
  { id: "smart", label: "Balanced", icon: Sparkles, activeColor: "bg-sky-500/20 border-sky-500/50 text-sky-400" },
  { id: "deep", label: "Deep", icon: BrainCircuit, activeColor: "bg-purple-500/20 border-purple-500/50 text-purple-400" },
] as const;

type ModelMode = (typeof modelOptions)[number]["id"];

type Props = {
  onClose?: () => void;
  onAiSuccess?: (previousFiles: ProjectFiles) => void;
};

const placeholders = [
  "Build me a modern SaaS landing page with smooth animations.",
  "Create a personal portfolio for a software engineer.",
  "Design a futuristic AI startup homepage.",
  "Make this website feel more premium and modern.",
  "Turn this into an Apple-inspired website.",
  "Redesign the hero section to improve conversions.",
  "Build a beautiful restaurant website with an online menu.",
  "Create a dashboard for a finance analytics platform.",
  "Design a landing page for my indie game.",
  "Build a minimalist portfolio using glassmorphism.",
  "Create a sleek e-commerce homepage for sneakers.",
  "Make this page mobile-friendly.",
  "Improve the typography and spacing across the site.",
  "Add subtle animations and micro-interactions.",
  "Give this website a cyberpunk aesthetic.",
  "Design a homepage for a luxury hotel.",
  "Create a modern coffee shop website.",
  "Build a clean travel blog homepage.",
  "Generate a startup website that feels like Linear.",
  "Help me build something awesome.",
];

export default function AIPanel({
  onClose,
  onAiSuccess,
}: Props) {
  const files = useEditorStore((s) => s.files);
  const setFiles = useEditorStore((s) => s.setFiles);
  const openFile = useEditorStore((s) => s.openFile);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelMode, setModelMode] =
    useState<ModelMode>("fast");

  const [modalState, setModalState] = useState<ModalState | null>(null);

  function requestAlert(title: string, description: string) {
    setModalState({
      isOpen: true,
      mode: "alert",
      title,
      description,
      icon: "alert",
      variant: "danger",
    });
  }

  const [placeholder] = useState(
    () => placeholders[Math.floor(Math.random() * placeholders.length)]
  );

  async function generateWebsite() {
    if (!prompt.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          files,
          modelMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        requestAlert("Generation Error", data.error || "AI provider returned an error.");
        return;
      }

      const updatedFiles = parseProject(data, files);

      if (!isValidProject(updatedFiles)) {
        console.error("Invalid AI response:", data.html);
        requestAlert(
          "Invalid Project Response",
          "The AI returned an invalid project structure. Please try again."
        );
        return;
      }

      const previousSnapshot = { ...files };
      setFiles(updatedFiles);
      if (onAiSuccess) {
        onAiSuccess(previousSnapshot);
      }
      Object.keys(updatedFiles).forEach((filename) => {
        openFile(filename);
      });
      openFile("index.html");
      setPrompt("");
    } catch (err) {
      console.error(err);
      requestAlert("Connection Error", "Failed to generate website. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sleek-panel animate-slideInRight flex h-full flex-col border-l text-zinc-100">
      <div className="border-b border-zinc-800 p-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            AI Assistant
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Describe what you&apos;d like to build or improve.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="sleek-panel-soft grid grid-cols-3 gap-1.5 rounded-lg border border-zinc-800 p-1 bg-zinc-950/60">
          {modelOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = modelMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={loading}
                onClick={() => setModelMode(option.id)}
                className={`flex h-8 items-center justify-center gap-1.5 rounded-md border text-xs font-semibold transition-all ${
                  isSelected
                    ? `${option.activeColor} shadow-sm`
                    : "border-transparent text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
                }`}
              >
                <Icon size={13} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        <textarea
          className="sleek-input flex-1 resize-none rounded-lg border p-3 outline-none transition"
          placeholder={placeholder}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          onClick={generateWebsite}
          disabled={loading}
          className="flex items-center justify-center rounded-lg border border-blue-500 bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {loading ? (
            <>
              <svg
                className="mr-2 h-5 w-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  opacity="0.25"
                />
                <path
                  d="M22 12a10 10 0 0 1-10 10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
              </svg>

              Generating...
            </>
          ) : (
            "Generate Website"
          )}
        </button>
      </div>

      <CustomModal modal={modalState} onClose={() => setModalState(null)} />
    </div>
  );
}
