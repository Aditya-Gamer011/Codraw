"use client";

import { useEffect, useState } from "react";
import { Sparkles, Sliders, Trash2, X } from "lucide-react";
import TypographySection from "./components/TypographySection";
import LayoutSection from "./components/LayoutSection";
import SpacingSection from "./components/SpacingSection";
import BordersSection from "./components/BordersSection";
import ColorsSection from "./components/ColorsSection";
import AnimationSection from "./components/AnimationSection";
import TextContentSection from "./components/TextContentSection";
import { useEditorStore } from "@/lib/editorStore";
import { parseProject } from "@/lib/parseProject";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  selectedSelector: string;
  selectedTag: string;
  category?: "text" | "button" | "container" | "media" | "input";
  initialStyles?: Record<string, string>;
  onApplyStyle?: (property: string, value: string) => void;
  onApplyText?: (text: string) => void;
};

function rgbToHex(colorStr: string): string {
  if (!colorStr) return "#000000";
  if (colorStr.startsWith("#")) return colorStr.length === 7 ? colorStr : colorStr.slice(0, 7);
  const match = colorStr.match(/\d+/g);
  if (!match || match.length < 3) return "#000000";
  const r = Math.min(255, parseInt(match[0], 10)).toString(16).padStart(2, "0");
  const g = Math.min(255, parseInt(match[1], 10)).toString(16).padStart(2, "0");
  const b = Math.min(255, parseInt(match[2], 10)).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

export default function DesignInspector({
  isOpen,
  onClose,
  selectedSelector,
  selectedTag,
  category = "container",
  initialStyles = {},
  onApplyStyle,
  onApplyText,
}: Props) {
  const [fontSize, setFontSize] = useState("16");
  const [fontWeight, setFontWeight] = useState("400");
  const [padding, setPadding] = useState("12");
  const [margin, setMargin] = useState("0");
  const [borderRadius, setBorderRadius] = useState("8");
  const [bgColor, setBgColor] = useState("#18181b");
  const [textColor, setTextColor] = useState("#ffffff");
  const [borderColor, setBorderColor] = useState("#3f3f46");
  const [borderWidth, setBorderWidth] = useState("1");
  const [displayMode, setDisplayMode] = useState("flex");
  const [gap, setGap] = useState("12");
  const [initialText, setInitialText] = useState("");

  // AI Functionality state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [prevStyles, setPrevStyles] = useState(initialStyles);
  if (prevStyles !== initialStyles) {
    setPrevStyles(initialStyles);
    if (initialStyles) {
      if (initialStyles.fontSize) setFontSize(initialStyles.fontSize);
      if (initialStyles.fontWeight) setFontWeight(initialStyles.fontWeight);
      if (initialStyles.padding) setPadding(initialStyles.padding);
      if (initialStyles.margin) setMargin(initialStyles.margin);
      if (initialStyles.borderRadius) setBorderRadius(initialStyles.borderRadius);
      if (initialStyles.backgroundColor) setBgColor(rgbToHex(initialStyles.backgroundColor));
      if (initialStyles.color) setTextColor(rgbToHex(initialStyles.color));
      if (initialStyles.borderColor) setBorderColor(rgbToHex(initialStyles.borderColor));
      if (initialStyles.borderWidth) setBorderWidth(initialStyles.borderWidth);
      if (initialStyles.display) setDisplayMode(initialStyles.display);
      if (initialStyles.gap) setGap(initialStyles.gap);
    }
  }

  useEffect(() => {

    // Extract text content from target element inside iframe
    const iframe = document.querySelector("iframe") as HTMLIFrameElement | null;
    if (iframe && iframe.contentWindow && selectedSelector) {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if (doc) {
        const el = doc.querySelector(selectedSelector);
        if (el) {
          const textContent = el.textContent || "";
          setTimeout(() => setInitialText(textContent), 0);
        }
      }
    }
  }, [selectedSelector, initialStyles]);

  function applyStyle(property: string, value: string) {
    if (onApplyStyle) {
      onApplyStyle(property, value);
    } else {
      const iframe = document.querySelector("iframe") as HTMLIFrameElement | null;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: "CODRAW_VISUAL_APPLY_STYLE",
            property,
            value,
          },
          "*"
        );
      }
    }
  }

  function applyText(text: string) {
    if (onApplyText) {
      onApplyText(text);
    } else {
      const iframe = document.querySelector("iframe") as HTMLIFrameElement | null;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: "CODRAW_VISUAL_APPLY_TEXT",
            text,
          },
          "*"
        );
      }
    }
  }

  function handleDeleteElement() {
    const files = useEditorStore.getState().files;
    const setFiles = useEditorStore.getState().setFiles;

    const originalHtml = files["index.html"] || "";
    if (typeof window === "undefined" || typeof DOMParser === "undefined" || !originalHtml) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(originalHtml, "text/html");
      const target = doc.querySelector(selectedSelector);
      if (target) {
        target.remove();
        const newHtml = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
        setFiles({
          ...files,
          "index.html": newHtml,
        });
        onClose();
      }
    } catch (err) {
      console.error("Failed to delete element:", err);
    }
  }

  async function handleImproveWithAi() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);

    try {
      const files = useEditorStore.getState().files;
      const setFiles = useEditorStore.getState().setFiles;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Focus edit on element '${selectedSelector}' (<${selectedTag}>): ${aiPrompt}`,
          files,
          modelMode: "smart",
        }),
      });
      const data = await res.json();
      if (data) {
        const updated = parseProject(data, files);
        setFiles(updated);
        setAiPrompt("");
      }
    } catch (err) {
      console.error("Improve with AI error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  if (!isOpen) return null;

  const textTags = ["h1","h2","h3","h4","h5","h6","p","span","button","a","blockquote","li","label","strong","em"];
  const canHaveText = textTags.includes(selectedTag.toLowerCase()) || category === "text" || category === "button";
  const showTypography = ["text", "button", "input"].includes(category) || canHaveText;
  const showLayout = ["container"].includes(category);
  const showSpacing = true;
  const showBorders = true;
  const showColors = true;

  return (
    <div className="animate-slideInRight flex h-full w-80 flex-col border-l border-white/15 bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-zinc-950 p-4 text-zinc-100 shadow-2xl backdrop-blur-3xl">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400">
            <Sliders size={14} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
              Design Inspector
            </h3>
            <p className="text-[10px] text-zinc-400">Visual Restyle & Content</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition"
        >
          <X size={15} />
        </button>
      </div>

      {/* Target Element Selector & Delete Action */}
      <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs backdrop-blur-md">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Target Element</span>
          <button
            onClick={handleDeleteElement}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-semibold hover:bg-rose-500 hover:text-white transition"
            title="Delete this element"
          >
            <Trash2 size={11} />
            <span>Delete</span>
          </button>
        </div>
        <div className="truncate font-mono text-xs text-white font-medium bg-black/40 px-2.5 py-1 rounded-md border border-white/5">
          &lt;{selectedTag || "element"}&gt; <span className="text-sky-400 font-normal">{selectedSelector}</span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {/* Text Content Editor */}
        {canHaveText && (
          <TextContentSection
            initialText={initialText}
            selectedTag={selectedTag || "element"}
            onApplyText={applyText}
          />
        )}

        {/* Improve with AI Section */}
        <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/30 to-sky-950/20 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
            <Sparkles size={14} className="text-purple-400" />
            <span>Improve with AI</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug">
            Focus AI edit on this target element:
          </p>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleImproveWithAi();
              }}
              placeholder="e.g. Add glowing glass style"
              className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-purple-500"
            />
            <button
              onClick={handleImproveWithAi}
              disabled={aiLoading || !aiPrompt.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-sky-500 hover:brightness-110 disabled:opacity-50 text-white font-semibold text-xs transition shrink-0"
            >
              {aiLoading ? <Sparkles size={13} className="animate-spin" /> : <span>Apply</span>}
            </button>
          </div>
        </div>

        {showTypography && (
          <TypographySection
            fontSize={fontSize}
            setFontSize={setFontSize}
            fontWeight={fontWeight}
            setFontWeight={setFontWeight}
            applyStyle={applyStyle}
          />
        )}

        {showLayout && (
          <LayoutSection
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
            gap={gap}
            setGap={setGap}
            applyStyle={applyStyle}
          />
        )}

        {showSpacing && (
          <SpacingSection
            padding={padding}
            setPadding={setPadding}
            margin={margin}
            setMargin={setMargin}
            applyStyle={applyStyle}
          />
        )}

        {showBorders && (
          <BordersSection
            borderRadius={borderRadius}
            setBorderRadius={setBorderRadius}
            borderWidth={borderWidth}
            setBorderWidth={setBorderWidth}
            borderColor={borderColor}
            setBorderColor={setBorderColor}
            applyStyle={applyStyle}
          />
        )}

        {showColors && (
          <ColorsSection
            bgColor={bgColor}
            setBgColor={setBgColor}
            textColor={textColor}
            setTextColor={setTextColor}
            showTypography={showTypography}
            applyStyle={applyStyle}
          />
        )}

        <AnimationSection initialAnimation={initialStyles?.animation} applyStyle={applyStyle} />
      </div>
    </div>
  );
}
