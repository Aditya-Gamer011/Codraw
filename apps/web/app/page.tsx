"use client";

import { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

import Toolbar from "@/components/Toolbar/Toolbar";
import FileExplorer from "@/components/FileExplorer/FileExplorer";
import LiveCanvas from "@/components/LiveCanvas/LiveCanvas";
import AIPanel from "@/components/AIPanel/AIPanel";
import BottomPanel from "@/components/BottomPanel/BottomPanel";

import { useEditorStore } from "@/lib/editorStore";

export default function Home() {
  const files = useEditorStore((s) => s.files);
  const setFiles = useEditorStore((s) => s.setFiles);
  const [visualEditEnabled, setVisualEditEnabled] =
    useState(false);
  const [aiOpen, setAiOpen] = useState(true);    

  return (
    <main className="sleek-shell flex h-screen flex-col overflow-hidden">
      <Toolbar
  visualEditEnabled={visualEditEnabled}
  onVisualEditChange={setVisualEditEnabled}
  aiOpen={aiOpen}
  onAiToggle={() => setAiOpen((v) => !v)}
/>

      <Group orientation="vertical" className="flex-1">
        <Panel defaultSize={72} minSize={40}>
          <Group orientation="horizontal">
            <Panel defaultSize={18} minSize={12}>
              <FileExplorer />
            </Panel>

            <Separator className="w-1 transition-colors" />

            <Panel defaultSize={57} minSize={30}>
              <LiveCanvas
                files={files}
                setFiles={setFiles}
                visualEditEnabled={visualEditEnabled}
              />
            </Panel>

            {aiOpen && (
  <>
    <Separator className="w-1 transition-colors" />

    <Panel defaultSize={25} minSize={18}>
      <AIPanel
  onClose={() => setAiOpen(false)}
/>
    </Panel>
  </>
)}
          </Group>
        </Panel>

        <Separator className="h-1 transition-colors" />

        <Panel defaultSize={28} minSize={15}>
          <BottomPanel />
        </Panel>
      </Group>
    </main>
  );
}
