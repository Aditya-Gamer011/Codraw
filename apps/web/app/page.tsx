"use client";

import { useEffect, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Boxes, Eye, FolderOpen, Sparkles } from "lucide-react";

import Toolbar from "@/components/Toolbar/Toolbar";
import FileExplorer from "@/components/FileExplorer/FileExplorer";
import LiveCanvas from "@/components/LiveCanvas/LiveCanvas";
import RightPanel from "@/components/RightPanel/RightPanel";
import BottomPanel from "@/components/BottomPanel/BottomPanel";
import CinematicLanding from "@/components/CinematicLanding/CinematicLanding";
import VisualDiffBar from "@/components/VisualDiff/VisualDiffBar";
import { useEditorStore } from "@/lib/editorStore";
import { ProjectFiles } from "@/lib/types";

export default function Home() {
  const files = useEditorStore((s) => s.files);
  const setFiles = useEditorStore((s) => s.setFiles);

  const [showLanding, setShowLanding] = useState(true);
  const [visualEditEnabled, setVisualEditEnabled] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState<"ai" | "elements">("ai");

  // Mobile navigation tab state
  const [mobileTab, setMobileTab] = useState<"canvas" | "files" | "right">("canvas");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-enable visual edit mode when a component is selected from the tree
  useEffect(() => {
    function handleComponentSelect(e: MessageEvent) {
      if (e.data?.type === "CODRAW_SELECT_COMPONENT") {
        setVisualEditEnabled(true);
      }
    }
    window.addEventListener("message", handleComponentSelect);
    return () => window.removeEventListener("message", handleComponentSelect);
  }, []);

  const [diffState, setDiffState] = useState<{
    isOpen: boolean;
    previousFiles: ProjectFiles | null;
  }>({
    isOpen: false,
    previousFiles: null,
  });

  if (showLanding) {
    return <CinematicLanding onEnterApp={() => setShowLanding(false)} />;
  }

  return (
    <main className="sleek-shell flex h-screen flex-col overflow-hidden">
      <Toolbar
        onReplayIntro={() => setShowLanding(true)}
        visualEditEnabled={visualEditEnabled}
        onVisualEditChange={setVisualEditEnabled}
        aiOpen={rightPanelOpen && activeRightTab === "ai"}
        onAiToggle={() => {
          if (isMobile) {
            setMobileTab("right");
            setRightPanelOpen(true);
            setActiveRightTab("ai");
          } else if (rightPanelOpen && activeRightTab === "ai") {
            setRightPanelOpen(false);
          } else {
            setRightPanelOpen(true);
            setActiveRightTab("ai");
          }
        }}
        elementsOpen={rightPanelOpen && activeRightTab === "elements"}
        onElementsToggle={() => {
          if (isMobile) {
            setMobileTab("right");
            setRightPanelOpen(true);
            setActiveRightTab("elements");
          } else if (rightPanelOpen && activeRightTab === "elements") {
            setRightPanelOpen(false);
          } else {
            setRightPanelOpen(true);
            setActiveRightTab("elements");
          }
        }}
      />

      <VisualDiffBar
        isOpen={diffState.isOpen}
        onAccept={() =>
          setDiffState({
            isOpen: false,
            previousFiles: null,
          })
        }
        onReject={() => {
          if (diffState.previousFiles) {
            setFiles(diffState.previousFiles);
          }
          setDiffState({
            isOpen: false,
            previousFiles: null,
          });
        }}
      />

      {/* Desktop Multi-Panel Layout (>= 768px) */}
      <div className="hidden md:flex flex-1 overflow-hidden">
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

              {rightPanelOpen && (
                <>
                  <Separator className="w-1 transition-colors" />

                  <Panel defaultSize={25} minSize={18}>
                    <RightPanel
                      activeTab={activeRightTab}
                      onTabChange={setActiveRightTab}
                      onClose={() => setRightPanelOpen(false)}
                      onVisualEditEnable={() => setVisualEditEnabled(true)}
                      onAiSuccess={(prevFiles) =>
                        setDiffState({
                          isOpen: true,
                          previousFiles: prevFiles,
                        })
                      }
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
      </div>

      {/* Mobile Responsive Layout (< 768px) */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden relative">
        <div className="flex-1 overflow-hidden">
          {mobileTab === "canvas" && (
            <LiveCanvas
              files={files}
              setFiles={setFiles}
              visualEditEnabled={visualEditEnabled}
            />
          )}

          {mobileTab === "files" && (
            <FileExplorer />
          )}

          {mobileTab === "right" && (
            <RightPanel
              activeTab={activeRightTab}
              onTabChange={setActiveRightTab}
              onClose={() => setMobileTab("canvas")}
              onVisualEditEnable={() => setVisualEditEnabled(true)}
              onAiSuccess={(prevFiles) => {
                setDiffState({
                  isOpen: true,
                  previousFiles: prevFiles,
                });
                setMobileTab("canvas");
              }}
            />
          )}
        </div>

        {/* Mobile Floating Bottom Bar */}
        <div className="flex h-12 items-center justify-around border-t border-zinc-800 bg-zinc-950/95 px-2 backdrop-blur-lg">
          <button
            onClick={() => setMobileTab("canvas")}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition ${
              mobileTab === "canvas" ? "text-sky-400" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Eye size={16} />
            <span>Canvas</span>
          </button>

          <button
            onClick={() => setMobileTab("files")}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition ${
              mobileTab === "files" ? "text-sky-400" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FolderOpen size={16} />
            <span>Files</span>
          </button>

          <button
            onClick={() => {
              setMobileTab("right");
              setActiveRightTab("ai");
            }}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition ${
              mobileTab === "right" && activeRightTab === "ai" ? "text-sky-400" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles size={16} />
            <span>AI</span>
          </button>

          <button
            onClick={() => {
              setMobileTab("right");
              setActiveRightTab("elements");
            }}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition ${
              mobileTab === "right" && activeRightTab === "elements" ? "text-sky-400" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Boxes size={16} />
            <span>Elements</span>
          </button>
        </div>
      </div>
    </main>
  );
}
