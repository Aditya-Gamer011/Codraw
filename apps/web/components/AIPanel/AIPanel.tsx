"use client";

import { useState } from "react";

import {
  isValidProject,
  parseProject,
} from "@/lib/parseProject";
import { useEditorStore } from "@/lib/editorStore";

const modelOptions = [
  { id: "lightning", label: "Lightning" },
  { id: "balanced", label: "Balanced" },
  { id: "hardcore", label: "Hardcore" },
] as const;

type ModelMode = (typeof modelOptions)[number]["id"];

export default function AIPanel() {
  const files = useEditorStore((s) => s.files);
  const setFiles = useEditorStore((s) => s.setFiles);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelMode, setModelMode] =
    useState<ModelMode>("lightning");

  const suggestions = [
    "Modern SaaS landing page",
    "Personal portfolio",
    "Dashboard UI",
    "Restaurant website",
    "Coffee shop homepage",
    "Travel blog",
  ];

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
        alert(data.error || "API Error");
        return;
      }

      const updatedFiles = parseProject(data.html);

      if (!isValidProject(updatedFiles)) {
        console.error("Invalid AI response:", data.html);
        alert(
          "The AI returned an invalid project. Please try again."
        );
        return;
      }

      setFiles(updatedFiles);

      setPrompt("");
    } catch (err) {
      console.error(err);
      alert("Failed to generate website.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sleek-panel flex h-full flex-col border-l text-zinc-100">
      <div className="border-b border-zinc-800 p-4">
        <h2 className="text-lg font-semibold text-white">
          AI Assistant
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Describe the website you want to build.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 p-4">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setPrompt(suggestion)}
            className="sleek-button rounded-full border px-3 py-1 text-xs transition"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="sleek-panel-soft grid grid-cols-3 overflow-hidden rounded border p-1">
          {modelOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={loading}
              onClick={() => setModelMode(option.id)}
              className={`h-8 text-xs font-medium transition ${
                modelMode === option.id
                  ? "rounded bg-blue-600 text-white"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <textarea
          className="sleek-input flex-1 resize-none rounded-lg border p-3 outline-none transition"
          placeholder="Build me a modern landing page for an AI startup..."
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
    </div>
  );
}
