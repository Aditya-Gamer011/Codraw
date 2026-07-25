"use client";

import { MonitorSmartphone } from "lucide-react";

type Props = {
  files: {
    "index.html": string;
    "style.css": string;
    "script.js": string;
  };
};

export default function LiveCanvas({ files }: Props) {
  const html = `
    ${files["index.html"]}
    <style>${files["style.css"]}</style>
    <script>${files["script.js"]}<\/script>
  `;

  const isDefaultProject =
    files["index.html"].includes("Hello CodeDraw!") &&
    files["style.css"].includes("font-family") &&
    files["script.js"].includes("Hello CodeDraw");

  if (isDefaultProject) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-950 p-8">
        <div className="flex w-full max-w-lg flex-col items-center rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 p-10 text-center">
          <MonitorSmartphone
            size={64}
            className="mb-6 text-neutral-500"
          />

          <h2 className="mb-2 text-2xl font-semibold text-white">
            Live Preview
          </h2>

          <p className="mb-8 text-neutral-400">
            Your generated website will appear here.
            <br />
            Start editing below or ask the AI to build something.
          </p>

          <div className="w-full rounded-lg bg-neutral-950 p-4 text-left text-sm text-neutral-400">
            <p>💡 Try asking:</p>

            <ul className="mt-3 space-y-2">
              <li>• Build a modern SaaS landing page</li>
              <li>• Create a personal portfolio</li>
              <li>• Design a coffee shop homepage</li>
              <li>• Make a beautiful dashboard UI</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <iframe
      title="Live Preview"
      className="h-full w-full bg-white"
      srcDoc={html}
      sandbox="allow-scripts"
    />
  );
}