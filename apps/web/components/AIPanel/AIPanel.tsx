"use client";

import { useState } from "react";

interface AIPanelProps {
  setHtml: (html: string) => void;
}

export default function AIPanel({ setHtml }: AIPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

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
        }),
      });

      const data = await res.json();

console.log(data);

setHtml(data.html);
    } catch (err) {
      console.error(err);
      alert("Failed to generate website.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full border-l p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold">
        AI Assistant
      </h2>

      <textarea
        className="border rounded p-2 h-40"
        placeholder="Build me a modern portfolio..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        onClick={generateWebsite}
        disabled={loading}
        className="rounded bg-blue-600 text-white py-2"
      >
        {loading ? "Generating..." : "Generate"}
      </button>
    </div>
  );
}