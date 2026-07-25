"use client";

import { useState } from "react";

import Toolbar from "../components/Toolbar/Toolbar";
import FileExplorer from "../components/FileExplorer/FileExplorer";
import LiveCanvas from "../components/LiveCanvas/LiveCanvas";
import AIPanel from "../components/AIPanel/AIPanel";
import BottomPanel from "../components/BottomPanel/BottomPanel";

const defaultHtml = `
<!DOCTYPE html>
<html>
<head>
<style>
body{
    margin:0;
    padding:40px;
    font-family:Arial,sans-serif;
    background:#111827;
    color:white;
}
button{
    padding:12px 24px;
    background:#2563eb;
    color:white;
    border:none;
    border-radius:8px;
}
</style>
</head>
<body>
<h1>Hello from CodeDraw 🚀</h1>
<p>Your AI-generated website will appear here.</p>
<button>Click Me</button>
</body>
</html>
`;

export default function Home() {
  const [html, setHtml] = useState(defaultHtml);

  return (
    <div className="flex h-screen flex-col">
      <Toolbar />

      <div className="flex flex-1">
        <div className="w-64 border-r">
          <FileExplorer />
        </div>

        <div className="flex-1">
          <LiveCanvas html={html} />
        </div>

        <div className="w-80 border-l">
          <AIPanel setHtml={setHtml} />
        </div>
      </div>

      <div className="h-48 border-t">
        <BottomPanel />
      </div>
    </div>
  );
}