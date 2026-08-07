"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sliders, Smartphone, Tablet, Monitor } from "lucide-react";
import DesignInspector from "../DesignInspector/DesignInspector";
import FloatingActionBar from "./components/FloatingActionBar";
import ElementAiModal from "./components/ElementAiModal";
import SelectionOverlay from "./components/SelectionOverlay";
import HoverOverlay from "./components/HoverOverlay";
import SavePendingChangesBar from "./components/SavePendingChangesBar";
import {
  applyVisualEditsToCss,
  applyVisualTextEditsToHtml,
  buildPreviewHtml,
  HERO_PREVIEW_TEMPLATE,
  StyleEdit,
  TextEdit,
} from "./utils/previewBuilder";

type Props = {
  files: Record<string, string>;
  setFiles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  visualEditEnabled?: boolean;
};

type SelectedInfo = {
  selector: string;
  tagName: string;
  category?: "text" | "button" | "container" | "media" | "input";
  canEditText?: boolean;
  styles?: Record<string, string>;
};

function parseProject(rawHtml: string, existingFiles: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = { ...existingFiles };
  const cssMatch = rawHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  let htmlClean = rawHtml;
  if (cssMatch) {
    result["style.css"] = cssMatch[1].trim();
    htmlClean = rawHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  }
  result["index.html"] = htmlClean.trim();
  return result;
}

function normalizeTargetElement(el: HTMLElement): HTMLElement {
  let curr: HTMLElement | null = el;
  while (curr && curr !== curr.ownerDocument.body) {
    const tag = curr.tagName.toLowerCase();
    if (["path", "g", "svg", "use", "circle", "rect", "polygon", "polyline"].includes(tag)) {
      if (curr.parentElement) {
        curr = curr.parentElement as HTMLElement;
        continue;
      }
    }
    const interactiveParent = curr.closest("button, a, [role='button']");
    if (interactiveParent && interactiveParent !== curr) {
      return interactiveParent as HTMLElement;
    }
    break;
  }
  return curr || el;
}

function getElementSelectorFromDoc(el: Element): string {
  if (!el || el === el.ownerDocument.body || el === el.ownerDocument.documentElement) return "";

  const path: string[] = [];
  let curr: Element | null = el;

  while (
    curr &&
    curr.nodeType === Node.ELEMENT_NODE &&
    curr.tagName.toLowerCase() !== "body" &&
    curr.tagName.toLowerCase() !== "html"
  ) {
    const parent: Element | null = curr.parentElement;
    if (!parent) break;

    const currTag = curr.tagName.toLowerCase();
    const siblings = (Array.from(parent.children) as Element[]).filter(
      (c) => c.tagName.toLowerCase() === currTag
    );
    const index = Math.max(1, siblings.indexOf(curr) + 1);

    path.unshift(`${currTag}:nth-of-type(${index})`);
    curr = parent;
  }

  // Anchor at body to guarantee uniqueness - without this,
  // querySelector can match the same nth-of-type pattern in nested subtrees
  if (path.length > 0) {
    path.unshift("body");
  }

  return path.join(" > ");
}

function getElementInfoFromDoc(el: HTMLElement, win: Window) {
  const tag = el.tagName.toLowerCase();

  let category: "text" | "button" | "container" | "media" | "input" = "container";
  if (["button", "a"].includes(tag) || el.getAttribute("role") === "button") category = "button";
  else if (["h1","h2","h3","h4","h5","h6","p","span","li","label","strong","em"].includes(tag)) category = "text";
  else if (["img", "svg", "video", "canvas"].includes(tag)) category = "media";
  else if (["input", "textarea", "select"].includes(tag)) category = "input";

  const textTags = ["h1","h2","h3","h4","h5","h6","p","span","a","button","li","label","strong","em"];
  const canEditText = textTags.includes(tag) && el.children.length === 0;

  const comp = win.getComputedStyle(el);
  const styles: Record<string, string> = {
    fontSize: comp.fontSize,
    fontWeight: comp.fontWeight,
    padding: comp.padding,
    margin: comp.margin,
    borderRadius: comp.borderRadius,
    backgroundColor: comp.backgroundColor,
    color: comp.color,
    borderColor: comp.borderColor,
    borderWidth: comp.borderWidth,
    display: comp.display,
    gap: comp.gap,
    animation: el.style.animation || comp.animationName || comp.animation || "",
  };

  return { category, canEditText, styles };
}

export default function LiveCanvas({ files, setFiles, visualEditEnabled = false }: Props) {
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "phone">("desktop");
  const srcDoc = useMemo(
    () => buildPreviewHtml(files, visualEditEnabled),
    [files, visualEditEnabled]
  );
  const [frameKey, setFrameKey] = useState(0);

  const [selectedInfo, setSelectedInfo] = useState<SelectedInfo | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const [pendingStyleEdits, setPendingStyleEdits] = useState<StyleEdit[]>([]);
  const [pendingTextEdits, setPendingTextEdits] = useState<TextEdit[]>([]);
  const pendingVisualCssRef = useRef<string>("");

  const [elementAiModalOpen, setElementAiModalOpen] = useState(false);
  const [elementAiPrompt, setElementAiPrompt] = useState("");
  const [elementAiLoading, setElementAiLoading] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const glassPaneRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const [hoverRect, setHoverRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [selectedRect, setSelectedRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  // Clear selections & overlays whenever visual edit mode is disabled
  const [prevVisualEditEnabled, setPrevVisualEditEnabled] = useState(visualEditEnabled);
  if (prevVisualEditEnabled !== visualEditEnabled) {
    setPrevVisualEditEnabled(visualEditEnabled);
    if (!visualEditEnabled) {
      setSelectedInfo(null);
      setSelectedRect(null);
      setHoverRect(null);
      setInspectorOpen(false);
    }
  }

  const updateSelectionRect = useCallback(() => {
    if (!selectedInfo || !iframeRef.current || !canvasContainerRef.current) {
      setSelectedRect(null);
      return;
    }
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    const el = doc.querySelector(selectedInfo.selector);
    if (!el) {
      setSelectedRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const iframeR = iframeRef.current.getBoundingClientRect();
    const containerR = canvasContainerRef.current.getBoundingClientRect();

    setSelectedRect({
      left: iframeR.left - containerR.left + r.left,
      top: iframeR.top - containerR.top + r.top,
      width: r.width,
      height: r.height,
    });
  }, [selectedInfo]);

  // NOTE: We intentionally do NOT have a useEffect that calls updateSelectionRect
  // on selectedInfo change. The rect is set directly by handleGlassPointerDown and
  // attemptSelect from the exact clicked element. Re-querying the selector via
  // querySelector can return a DIFFERENT element if the selector matches multiple
  // nodes, causing the overlay to "jump" to the wrong element.

  const [isEditingInlineText, setIsEditingInlineText] = useState(false);

  // Listen for component selection from Component Tree & Elements Library
  useEffect(() => {
    function handleWindowMessage(e: MessageEvent) {
      if (!e.data || e.data.type !== "CODRAW_SELECT_COMPONENT") return;

      const { selector, tag } = e.data;
      if (!selector) return;

      function attemptSelect(attemptsLeft = 10) {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        const win = iframe.contentWindow;
        if (!doc || !win) return;

        const el = doc.querySelector(selector) as HTMLElement | null;
        if (el) {
          const info = getElementInfoFromDoc(el, win);
          setSelectedInfo({
            selector,
            tagName: tag || el.tagName.toLowerCase(),
            category: info.category,
            canEditText: info.canEditText,
            styles: info.styles,
          });

          // Scroll into view FIRST, then compute the rect AFTER scroll
          // to avoid the overlay appearing at the pre-scroll position and jumping
          try {
            el.scrollIntoView({ behavior: "auto", block: "center" });
          } catch {}

          // Compute rect after scroll has completed
          requestAnimationFrame(() => {
            if (!iframeRef.current || !canvasContainerRef.current) return;
            const rect = el.getBoundingClientRect();
            const iframeRect = iframeRef.current.getBoundingClientRect();
            const containerR = canvasContainerRef.current.getBoundingClientRect();
            setSelectedRect({
              left: iframeRect.left - containerR.left + rect.left,
              top: iframeRect.top - containerR.top + rect.top,
              width: rect.width,
              height: rect.height,
            });
          });

          setInspectorOpen(true);
        } else if (attemptsLeft > 0) {
          setTimeout(() => attemptSelect(attemptsLeft - 1), 100);
        }
      }

      attemptSelect();
    }

    window.addEventListener("message", handleWindowMessage);
    return () => window.removeEventListener("message", handleWindowMessage);
  }, [updateSelectionRect]);

  // Keep selection overlay position in sync when iframe window scrolls
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function attachScrollListener() {
      const win = iframe?.contentWindow;
      if (win) {
        win.addEventListener("scroll", updateSelectionRect);
      }
    }

    attachScrollListener();
    iframe.addEventListener("load", attachScrollListener);

    return () => {
      const win = iframe?.contentWindow;
      if (win) {
        win.removeEventListener("scroll", updateSelectionRect);
      }
      iframe.removeEventListener("load", attachScrollListener);
    };
  }, [updateSelectionRect]);

  // Apply live style edit to DOM & pending state
  const handleApplyStyle = useCallback((property: string, value: string) => {
    if (!selectedInfo || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    const el = doc.querySelector(selectedInfo.selector) as HTMLElement | null;
    if (el) {
      if (property === "animation") {
        el.style.animation = "none";
        void el.offsetHeight; // Force DOM reflow so animation restarts cleanly
      }
      (el.style as unknown as Record<string, string>)[property] = value;

      setSelectedInfo((prev) => prev ? { ...prev, styles: { ...prev.styles, [property]: value } } : null);

      setPendingStyleEdits((prev) => {
        const existing = prev.find((item) => item.selector === selectedInfo.selector);
        if (existing) {
          return prev.map((item) =>
            item.selector === selectedInfo.selector
              ? { ...item, styles: { ...item.styles, [property]: value } }
              : item
          );
        }
        return [...prev, { selector: selectedInfo.selector, styles: { [property]: value } }];
      });
      requestAnimationFrame(updateSelectionRect);
    }
  }, [selectedInfo, updateSelectionRect]);

  // Apply live text edit to DOM & pending state
  const handleApplyText = useCallback((text: string) => {
    if (!selectedInfo || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    const el = doc.querySelector(selectedInfo.selector) as HTMLElement | null;
    if (el) {
      el.textContent = text;
      setPendingTextEdits((prev) => {
        const filtered = prev.filter((t) => t.selector !== selectedInfo.selector);
        return [...filtered, { selector: selectedInfo.selector, text }];
      });
      requestAnimationFrame(updateSelectionRect);
    }
  }, [selectedInfo, updateSelectionRect]);

  // Reset selection & overlays whenever site files change (e.g. AI generates a new site)
  const prevFilesHtmlRef = useRef(files["index.html"]);
  useEffect(() => {
    if (files["index.html"] !== prevFilesHtmlRef.current) {
      prevFilesHtmlRef.current = files["index.html"];
      setSelectedInfo(null);
      setSelectedRect(null);
      setHoverRect(null);
      setPendingStyleEdits([]);
      setPendingTextEdits([]);
      setInspectorOpen(false);
    }
  }, [files]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const iframeWin = iframeRef.current?.contentWindow;
    if (iframeWin) {
      iframeWin.scrollBy({
        top: e.deltaY,
        left: e.deltaX,
        behavior: "auto",
      });
      requestAnimationFrame(updateSelectionRect);
    }
  }, [updateSelectionRect]);

  const handleGlassPointerMove = useCallback((e: React.PointerEvent) => {
    if (isEditingInlineText) return;
    const iframe = iframeRef.current;
    const container = canvasContainerRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !container || !doc) return;

    const iframeR = iframe.getBoundingClientRect();
    const containerR = container.getBoundingClientRect();
    const x = e.clientX - iframeR.left;
    const y = e.clientY - iframeR.top;

    const rawEl = doc.elementFromPoint(x, y) as HTMLElement | null;
    if (rawEl && rawEl !== doc.body && rawEl !== doc.documentElement && !rawEl.id?.startsWith("codraw-visual")) {
      const el = normalizeTargetElement(rawEl);
      const r = el.getBoundingClientRect();
      setHoverRect({
        left: iframeR.left - containerR.left + r.left,
        top: iframeR.top - containerR.top + r.top,
        width: r.width,
        height: r.height,
      });
    } else {
      setHoverRect(null);
    }
  }, [isEditingInlineText]);

  const handleGlassPointerDown = useCallback((e: React.PointerEvent) => {
    if (isEditingInlineText) return;
    e.preventDefault();
    const iframe = iframeRef.current;
    const container = canvasContainerRef.current;
    const doc = iframe?.contentDocument;
    const win = iframe?.contentWindow as (Window & typeof globalThis) | null;
    if (!iframe || !container || !doc || !win) return;

    const iframeR = iframe.getBoundingClientRect();
    const x = e.clientX - iframeR.left;
    const y = e.clientY - iframeR.top;
    const rawEl = doc.elementFromPoint(x, y) as HTMLElement | null;

    if (!rawEl || rawEl === doc.body || rawEl === doc.documentElement) {
      setSelectedInfo(null);
      setSelectedRect(null);
      return;
    }

    const el = normalizeTargetElement(rawEl);
    const selector = getElementSelectorFromDoc(el);
    if (!selector) {
      setSelectedInfo(null);
      setSelectedRect(null);
      return;
    }
    const tag = el.tagName.toLowerCase();
    const { category, canEditText, styles } = getElementInfoFromDoc(el, win);

    setSelectedInfo({ selector, tagName: tag, category, canEditText, styles });

    // Immediately compute and set the selection rect so the overlay shows instantly
    const r = el.getBoundingClientRect();
    const containerR = container.getBoundingClientRect();
    setSelectedRect({
      left: iframeR.left - containerR.left + r.left,
      top: iframeR.top - containerR.top + r.top,
      width: r.width,
      height: r.height,
    });
  }, [isEditingInlineText]);

  const handleGlassDblClick = useCallback((_e: React.MouseEvent) => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const win = iframe?.contentWindow;
    if (!iframe || !doc || !win || !selectedInfo) return;

    const targetEl = doc.querySelector(selectedInfo.selector) as HTMLElement | null;
    if (!targetEl) return;

    const textTags = ["h1","h2","h3","h4","h5","h6","p","span","a","button","li","label","strong","em"];
    if (textTags.includes(targetEl.tagName.toLowerCase()) && targetEl.children.length === 0) {
      const origText = targetEl.textContent || "";
      targetEl.contentEditable = "true";
      setIsEditingInlineText(true);

      setTimeout(() => {
        targetEl.focus();
        try {
          const sel = win.getSelection();
          const range = doc.createRange();
          range.selectNodeContents(targetEl);
          sel?.removeAllRanges();
          sel?.addRange(range);
        } catch {}
      }, 20);

      const onBlurOrDone = () => {
        targetEl.contentEditable = "false";
        setIsEditingInlineText(false);
        const newText = targetEl.textContent || "";
        if (newText !== origText) {
          handleApplyText(newText);
        }
        targetEl.removeEventListener("blur", onBlurOrDone);
        targetEl.removeEventListener("keydown", onKeyDown);
      };

      const onKeyDown = (ev: KeyboardEvent) => {
        if (ev.key === "Enter" && !ev.shiftKey && targetEl.tagName.toLowerCase() !== "p") {
          ev.preventDefault();
          targetEl.blur();
        } else if (ev.key === "Escape") {
          targetEl.textContent = origText;
          targetEl.blur();
        }
      };

      targetEl.addEventListener("blur", onBlurOrDone);
      targetEl.addEventListener("keydown", onKeyDown);
    }
  }, [selectedInfo, handleApplyText]);



  const handleResizeStart = useCallback((e: React.PointerEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedInfo || !iframeRef.current || !canvasContainerRef.current) return;

    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    const el = doc.querySelector(selectedInfo.selector) as HTMLElement | null;
    if (!el) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = el.offsetWidth;
    const startHeight = el.offsetHeight;
    const iframeR = iframeRef.current.getBoundingClientRect();
    const containerR = canvasContainerRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const baseLeft = iframeR.left - containerR.left + elRect.left;
    const baseTop = iframeR.top - containerR.top + elRect.top;

    let rafId: number | null = null;

    const handlePointerMove = (moveEv: PointerEvent) => {
      const dx = moveEv.clientX - startX;
      const dy = moveEv.clientY - startY;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        let newW = startWidth;
        let newH = startHeight;

        if (direction.includes("e")) newW = Math.max(1, startWidth + dx);
        if (direction.includes("w")) newW = Math.max(1, startWidth - dx);
        if (direction.includes("s")) newH = Math.max(1, startHeight + dy);
        if (direction.includes("n")) newH = Math.max(1, startHeight - dy);

        el.style.width = `${Math.round(newW)}px`;
        el.style.height = `${Math.round(newH)}px`;

        setSelectedRect({
          left: baseLeft,
          top: baseTop,
          width: newW,
          height: newH,
        });
      });
    };

    const handlePointerUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      setPendingStyleEdits((prev) => {
        const existing = prev.find((p) => p.selector === selectedInfo.selector);
        const updatedStyles = {
          ...(existing?.styles || {}),
          width: el.style.width,
          height: el.style.height,
        };
        return [
          ...prev.filter((p) => p.selector !== selectedInfo.selector),
          { selector: selectedInfo.selector, styles: updatedStyles },
        ];
      });
      updateSelectionRect();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }, [selectedInfo, updateSelectionRect]);

  const handleMoveStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedInfo || !iframeRef.current || !canvasContainerRef.current) return;

    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    const el = doc.querySelector(selectedInfo.selector) as HTMLElement | null;
    if (!el) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const compStyle = window.getComputedStyle(el);
    const startLeft = parseFloat(compStyle.left) || 0;
    const startTop = parseFloat(compStyle.top) || 0;

    if (compStyle.position === "static") {
      el.style.position = "relative";
    }

    const iframeR = iframeRef.current.getBoundingClientRect();
    const containerR = canvasContainerRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const baseLeft = iframeR.left - containerR.left + elRect.left;
    const baseTop = iframeR.top - containerR.top + elRect.top;

    let rafId: number | null = null;

    const handlePointerMove = (moveEv: PointerEvent) => {
      const dx = moveEv.clientX - startX;
      const dy = moveEv.clientY - startY;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const nextLeft = Math.round(startLeft + dx);
        const nextTop = Math.round(startTop + dy);

        el.style.left = `${nextLeft}px`;
        el.style.top = `${nextTop}px`;

        setSelectedRect({
          left: baseLeft + dx,
          top: baseTop + dy,
          width: elRect.width,
          height: elRect.height,
        });
      });
    };

    const handlePointerUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      setPendingStyleEdits((prev) => {
        const existing = prev.find((p) => p.selector === selectedInfo.selector);
        const updatedStyles = {
          ...(existing?.styles || {}),
          position: el.style.position,
          left: el.style.left,
          top: el.style.top,
        };
        return [
          ...prev.filter((p) => p.selector !== selectedInfo.selector),
          { selector: selectedInfo.selector, styles: updatedStyles },
        ];
      });
      updateSelectionRect();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }, [selectedInfo, updateSelectionRect]);

  const pendingCount = pendingStyleEdits.length + pendingTextEdits.length;

  function saveVisualChanges() {
    if (pendingCount === 0) return;

    const baseFiles = Object.keys(files).length > 0 ? files : HERO_PREVIEW_TEMPLATE;
    const htmlKey = Object.keys(baseFiles).find((k) => k.endsWith(".html") || k.endsWith(".htm")) || "index.html";
    const cssKey = Object.keys(baseFiles).find((k) => k.endsWith(".css")) || "style.css";

    const originalHtml = baseFiles[htmlKey] || HERO_PREVIEW_TEMPLATE["index.html"] || "";
    const originalCss = baseFiles[cssKey] || HERO_PREVIEW_TEMPLATE["style.css"] || "";

    const nextCss = applyVisualEditsToCss(originalCss, pendingStyleEdits);
    const nextHtml = applyVisualTextEditsToHtml(originalHtml, pendingTextEdits);

    pendingVisualCssRef.current = nextCss;

    const updatedFiles = {
      ...baseFiles,
      [htmlKey]: nextHtml,
      [cssKey]: nextCss,
    };

    setFiles(updatedFiles);
    setPendingStyleEdits([]);
    setPendingTextEdits([]);
    setSelectedInfo(null);
    setSelectedRect(null);
    setHoverRect(null);
    setInspectorOpen(false);
    setFrameKey((current) => current + 1);
  }

  function discardVisualChanges() {
    setPendingStyleEdits([]);
    setPendingTextEdits([]);
    setSelectedInfo(null);
    setSelectedRect(null);
    setHoverRect(null);
    setInspectorOpen(false);
    setFrameKey((current) => current + 1);
  }

  async function handleElementAiSubmit() {
    if (!elementAiPrompt.trim() || !selectedInfo) return;
    setElementAiLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Focus edit on element ${selectedInfo.selector} (<${selectedInfo.tagName}>): ${elementAiPrompt}`,
          files,
          modelMode: "fast",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "AI generation error");
        return;
      }

      const updatedFiles = parseProject(data.html, files);
      setFiles(updatedFiles);
      setElementAiModalOpen(false);
      setElementAiPrompt("");
      setSelectedInfo(null);
      setSelectedRect(null);
      setHoverRect(null);
      setPendingStyleEdits([]);
      setPendingTextEdits([]);
      setInspectorOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update element with AI.");
    } finally {
      setElementAiLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950 select-none">
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-4 py-2 text-xs backdrop-blur-xl">
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
          <button
            onClick={() => setDeviceMode("desktop")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition ${
              deviceMode === "desktop" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Monitor size={14} />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => setDeviceMode("tablet")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition ${
              deviceMode === "tablet" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Tablet size={14} />
            <span>Tablet</span>
          </button>
          <button
            onClick={() => setDeviceMode("phone")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition ${
              deviceMode === "phone" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Smartphone size={14} />
            <span>Phone</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selectedInfo && (
            <button
              onClick={() => setInspectorOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-medium transition ${
                inspectorOpen
                  ? "border-cyan-500 bg-cyan-950/60 text-cyan-300"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <Sliders size={14} />
              Inspector
            </button>
          )}
        </div>
      </div>

      <div ref={canvasContainerRef} className="relative flex flex-1 items-center justify-center overflow-hidden">
        {/* Floating Apple Glassmorphic Menu Bar (Hides when Inspector is open) */}
        {visualEditEnabled && selectedInfo && !inspectorOpen && (
          <FloatingActionBar
            selectedInfo={selectedInfo}
            inspectorOpen={inspectorOpen}
            onToggleInspector={() => setInspectorOpen(true)}
          />
        )}

        {/* Visual Changes Save Bar */}
        <SavePendingChangesBar
          pendingCount={pendingCount}
          onSave={saveVisualChanges}
          onDiscard={discardVisualChanges}
        />

        {/* Responsive Canvas Frame Container */}
        <div
          className={`h-full w-full transition-all duration-300 flex items-center justify-center ${
            deviceMode === "phone"
              ? "max-w-[375px] py-4"
              : deviceMode === "tablet"
              ? "max-w-[768px] py-2"
              : "max-w-full"
          }`}
        >
          {/* Glass Pane: parent-side transparent overlay that intercepts ALL pointer events */}
          {visualEditEnabled && (
            <div
              ref={glassPaneRef}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 15,
                cursor: "crosshair",
                pointerEvents: isEditingInlineText ? "none" : "auto",
              }}
              onPointerDown={handleGlassPointerDown}
              onPointerMove={handleGlassPointerMove}
              onPointerLeave={() => setHoverRect(null)}
              onDoubleClick={handleGlassDblClick}
              onWheel={handleWheel}
            />
          )}

          {/* Parent-Side Hover Highlight Overlay */}
          {visualEditEnabled && hoverRect && !selectedRect && (
            <HoverOverlay hoverRect={hoverRect} />
          )}

          {/* Parent-Side Selected Element Overlay */}
          {(visualEditEnabled || inspectorOpen) && selectedInfo && selectedRect && (
            <SelectionOverlay
              selectedInfo={selectedInfo}
              selectedRect={selectedRect}
              onMoveStart={handleMoveStart}
              onResizeStart={handleResizeStart}
              onWheel={handleWheel}
            />
          )}

          <iframe
            ref={iframeRef}
            key={frameKey}
            title="Live Preview"
            className={`h-full w-full transition-all duration-300 rounded border border-zinc-800/80 bg-zinc-950 shadow-[0_18px_50px_rgba(0,0,0,.4)] ${
              deviceMode !== "desktop" ? "border-2 border-zinc-700 shadow-2xl" : ""
            }`}
            srcDoc={srcDoc}
            sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
          />
        </div>

        {/* Design Inspector Sidebar Panel */}
        {inspectorOpen && selectedInfo && (
          <div className="absolute right-0 top-0 bottom-0 z-30">
            <DesignInspector
              isOpen={inspectorOpen}
              onClose={() => setInspectorOpen(false)}
              selectedSelector={selectedInfo.selector}
              selectedTag={selectedInfo.tagName}
              category={selectedInfo.category}
              initialStyles={selectedInfo.styles}
              onApplyStyle={handleApplyStyle}
              onApplyText={handleApplyText}
            />
          </div>
        )}
      </div>

      {/* Screen-Centered Glassmorphic AI Prompt Modal */}
      <ElementAiModal
        isOpen={elementAiModalOpen}
        selectedInfo={selectedInfo}
        elementAiPrompt={elementAiPrompt}
        setElementAiPrompt={setElementAiPrompt}
        elementAiLoading={elementAiLoading}
        onClose={() => setElementAiModalOpen(false)}
        onSubmit={handleElementAiSubmit}
      />
    </div>
  );
}
