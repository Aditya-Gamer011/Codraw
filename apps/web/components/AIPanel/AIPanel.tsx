"use client";

import { useState } from "react";

import { parseProject } from "@/lib/parseProject";
import { useEditorStore } from "@/lib/editorStore";

export default function AIPanel() {
  const files = useEditorStore((s) => s.files);
  const setFiles = useEditorStore((s) => s.setFiles);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "API Error");
        return;
      }

      const updatedFiles = parseProject(data.html);

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
    <div className="flex h-full flex-col border-l border-neutral-800 bg-neutral-950">
      <div className="border-b border-neutral-800 p-4">
        <h2 className="text-lg font-semibold text-white">
          AI Assistant
        </h2>

        <p className="mt-1 text-sm text-neutral-400">
          Describe the website you'd like to build.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 p-4">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setPrompt(suggestion)}
            className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300 transition hover:border-blue-500 hover:text-white"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <textarea
          className="flex-1 resize-none rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-white outline-none transition focus:border-blue-500"
          placeholder="Build me a modern landing page for an AI startup..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          onClick={generateWebsite}
          disabled={loading}
          className="flex items-center justify-center rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-700"
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