"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";

import { ProjectFiles } from "@/lib/types";

type Props = {
  files: ProjectFiles;
  setFiles: (
    files: ProjectFiles | ((prev: ProjectFiles) => ProjectFiles)
  ) => void;
  visualEditEnabled: boolean;
};

type VisualEdit = {
  type: "CODRAW_VISUAL_STAGE";
  styleEdits: PendingVisualStyleEdit[];
  textEdits: PendingVisualTextEdit[];
};

type VisualSelection = {
  type: "CODRAW_VISUAL_SELECT";
  selector: string;
  tagName: string;
  canEditText: boolean;
  styles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
  };
};

type VisualMessage = VisualEdit | VisualSelection;

type PendingVisualStyleEdit = {
  selector: string;
  styles: Record<string, string>;
};

type PendingVisualTextEdit = {
  selector: string;
  text: string;
};

type SelectedElementInfo = Omit<VisualSelection, "type">;

const visualEditStart = "/* Codraw visual edits */";
const visualEditEnd = "/* End Codraw visual edits */";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatRule(
  selector: string,
  styles: Record<string, string>
) {
  const declarations = Object.entries(styles)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join("\n");

  return `${selector} {\n${declarations}\n}`;
}

function applyVisualEditToCss(
  css: string,
  selector: string,
  styles: Record<string, string>
) {
  const nextRule = formatRule(selector, styles);
  const sectionPattern = new RegExp(
    `${escapeRegExp(visualEditStart)}[\\s\\S]*?${escapeRegExp(
      visualEditEnd
    )}`
  );
  const existingSection = css.match(sectionPattern)?.[0];

  if (!existingSection) {
    return `${css.trimEnd()}\n\n${visualEditStart}\n${nextRule}\n${visualEditEnd}`;
  }

  const rulePattern = new RegExp(
    `${escapeRegExp(selector)}\\s*\\{[\\s\\S]*?\\}`,
    "m"
  );
  const nextSection = rulePattern.test(existingSection)
    ? existingSection.replace(rulePattern, nextRule)
    : existingSection.replace(visualEditEnd, `${nextRule}\n${visualEditEnd}`);

  return css.replace(sectionPattern, nextSection);
}

function applyVisualEditsToCss(
  css: string,
  edits: PendingVisualStyleEdit[]
) {
  return edits.reduce(
    (nextCss, edit) =>
      applyVisualEditToCss(
        nextCss,
        edit.selector,
        edit.styles
      ),
    css
  );
}

function applyVisualTextEditsToHtml(
  html: string,
  edits: PendingVisualTextEdit[]
) {
  if (edits.length === 0) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  for (const edit of edits) {
    const element = doc.querySelector(edit.selector);

    if (element) {
      element.textContent = edit.text;
    }
  }

  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}

function getVisualEditorScript() {
  return `
(() => {
  const editableSelector = "body *:not(#codraw-editor-overlay):not(#codraw-editor-overlay *)";
  const textEditableSelector = "h1,h2,h3,h4,h5,h6,p,span,a,button,li,label,strong,em";
  let selectedElement = null;
  let selectedSelector = "";
  let interaction = null;
  let hoverElement = null;
  let operationStartSnapshot = null;
  let didDrag = false;
  const baseSnapshots = new Map();
  const textBaseSnapshots = new Map();
  const stagedStyleEdits = new Map();
  const stagedTextEdits = new Map();
  const undoStack = [];
  const redoStack = [];

  const overlay = document.createElement("div");
  overlay.id = "codraw-editor-overlay";
  overlay.innerHTML = [
    '<div data-label></div>',
    '<div data-size></div>',
    '<div data-handle="nw"></div>',
    '<div data-handle="n"></div>',
    '<div data-handle="ne"></div>',
    '<div data-handle="e"></div>',
    '<div data-handle="se"></div>',
    '<div data-handle="s"></div>',
    '<div data-handle="sw"></div>',
    '<div data-handle="w"></div>'
  ].join("");
  Object.assign(overlay.style, {
    position: "fixed",
    zIndex: "2147483647",
    border: "2px solid #2563eb",
    boxSizing: "border-box",
    pointerEvents: "none",
    display: "none",
    boxShadow: "0 0 0 1px rgba(255,255,255,.9), 0 10px 28px rgba(37,99,235,.22)"
  });

  const hoverBox = document.createElement("div");
  Object.assign(hoverBox.style, {
    position: "fixed",
    zIndex: "2147483646",
    border: "1px dashed rgba(37,99,235,.8)",
    background: "rgba(37,99,235,.08)",
    boxSizing: "border-box",
    pointerEvents: "none",
    display: "none"
  });

  const label = overlay.querySelector("[data-label]");
  Object.assign(label.style, {
    position: "absolute",
    left: "-2px",
    top: "-28px",
    maxWidth: "320px",
    height: "22px",
    padding: "0 8px",
    borderRadius: "4px",
    background: "#2563eb",
    color: "#ffffff",
    font: "12px/22px system-ui, -apple-system, sans-serif",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    pointerEvents: "none"
  });

  const sizeBadge = overlay.querySelector("[data-size]");
  Object.assign(sizeBadge.style, {
    position: "absolute",
    right: "-2px",
    bottom: "-26px",
    height: "20px",
    padding: "0 6px",
    borderRadius: "4px",
    background: "rgba(17, 24, 39, .94)",
    color: "#ffffff",
    font: "11px/20px system-ui, -apple-system, sans-serif",
    whiteSpace: "nowrap",
    pointerEvents: "none"
  });

  const handlePositions = {
    nw: { left: "-6px", top: "-6px", cursor: "nwse-resize" },
    n: { left: "50%", top: "-6px", transform: "translateX(-50%)", cursor: "ns-resize" },
    ne: { right: "-6px", top: "-6px", cursor: "nesw-resize" },
    e: { right: "-6px", top: "50%", transform: "translateY(-50%)", cursor: "ew-resize" },
    se: { right: "-6px", bottom: "-6px", cursor: "nwse-resize" },
    s: { left: "50%", bottom: "-6px", transform: "translateX(-50%)", cursor: "ns-resize" },
    sw: { left: "-6px", bottom: "-6px", cursor: "nesw-resize" },
    w: { left: "-6px", top: "50%", transform: "translateY(-50%)", cursor: "ew-resize" }
  };

  overlay.querySelectorAll("[data-handle]").forEach((handle) => {
    const position = handlePositions[handle.dataset.handle];
    Object.assign(handle.style, {
    position: "absolute",
    width: "12px",
    height: "12px",
    border: "2px solid #ffffff",
    background: "#2563eb",
      borderRadius: "3px",
    boxSizing: "border-box",
    pointerEvents: "auto",
      ...position
    });
  });

  document.documentElement.appendChild(hoverBox);
  document.documentElement.appendChild(overlay);

  function getEditableTarget(target) {
    if (!(target instanceof Element)) {
      return null;
    }

    return target.closest(editableSelector);
  }

  function getSelector(element) {
    if (element.id) {
      return "#" + CSS.escape(element.id);
    }

    const parts = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      const tag = current.tagName.toLowerCase();
      const siblings = Array.from(current.parentElement.children).filter(
        (sibling) => sibling.tagName === current.tagName
      );
      const index = siblings.indexOf(current) + 1;
      parts.unshift(tag + ":nth-of-type(" + index + ")");
      current = current.parentElement;
    }

    return "body > " + parts.join(" > ");
  }

  function getElementLabel(element) {
    const id = element.id ? "#" + element.id : "";
    const classes = Array.from(element.classList || []).slice(0, 2).map((name) => "." + name).join("");
    return element.tagName.toLowerCase() + id + classes;
  }

  function canEditText(element) {
    return (
      element.matches(textEditableSelector) &&
      Array.from(element.children).length === 0
    );
  }

  function normalizeColor(value) {
    const match = value.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);

    if (!match) return "#000000";

    return (
      "#" +
      [match[1], match[2], match[3]]
        .map((part) => Number(part).toString(16).padStart(2, "0"))
        .join("")
    );
  }

  function getPixelStyle(element, property) {
    const value = Number.parseFloat(getComputedStyle(element)[property]);
    return Number.isFinite(value) ? value : 0;
  }

  function getInlineSnapshot(element) {
    return {
      position: element.style.position,
      left: element.style.left,
      top: element.style.top,
      width: element.style.width,
      height: element.style.height,
      boxSizing: element.style.boxSizing,
      color: element.style.color,
      backgroundColor: element.style.backgroundColor,
      fontSize: element.style.fontSize
    };
  }

  function getCssStyles(element) {
    const style = element.style;
    const rect = element.getBoundingClientRect();

    const styles = {
      position: style.position || "relative",
      left: style.left || "0px",
      top: style.top || "0px",
      width: style.width || Math.round(rect.width) + "px",
      height: style.height || Math.round(rect.height) + "px",
      "box-sizing": style.boxSizing || "border-box"
    };

    if (style.color) {
      styles.color = style.color;
    }

    if (style.backgroundColor) {
      styles["background-color"] = style.backgroundColor;
    }

    if (style.fontSize) {
      styles["font-size"] = style.fontSize;
    }

    return styles;
  }

  function snapshotsMatch(first, second) {
    return (
      first.position === second.position &&
      first.left === second.left &&
      first.top === second.top &&
      first.width === second.width &&
      first.height === second.height &&
      first.boxSizing === second.boxSizing &&
      first.color === second.color &&
      first.backgroundColor === second.backgroundColor &&
      first.fontSize === second.fontSize
    );
  }

  function applyInlineSnapshot(element, snapshot) {
    element.style.position = snapshot.position;
    element.style.left = snapshot.left;
    element.style.top = snapshot.top;
    element.style.width = snapshot.width;
    element.style.height = snapshot.height;
    element.style.boxSizing = snapshot.boxSizing;
    element.style.color = snapshot.color;
    element.style.backgroundColor = snapshot.backgroundColor;
    element.style.fontSize = snapshot.fontSize;
    updateOverlay();
  }

  function ensureEditablePosition(element) {
    const computed = getComputedStyle(element);

    if (computed.position === "static") {
      element.style.position = "relative";
    }

    element.style.boxSizing = element.style.boxSizing || "border-box";
  }

  function setBox(left, top, width, height) {
    if (!selectedElement) return;

    ensureEditablePosition(selectedElement);
    selectedElement.style.left = Math.round(left) + "px";
    selectedElement.style.top = Math.round(top) + "px";
    selectedElement.style.width = Math.max(16, Math.round(width)) + "px";
    selectedElement.style.height = Math.max(16, Math.round(height)) + "px";
    updateOverlay();
  }

  function updateHover(target) {
    hoverElement = target && target !== selectedElement ? target : null;

    if (!hoverElement) {
      hoverBox.style.display = "none";
      return;
    }

    const rect = hoverElement.getBoundingClientRect();
    Object.assign(hoverBox.style, {
      display: "block",
      left: rect.left + "px",
      top: rect.top + "px",
      width: rect.width + "px",
      height: rect.height + "px"
    });
  }

  function updateOverlay() {
    if (!selectedElement) return;

    const rect = selectedElement.getBoundingClientRect();
    label.textContent = getElementLabel(selectedElement);
    sizeBadge.textContent = Math.round(rect.width) + " x " + Math.round(rect.height);
    Object.assign(overlay.style, {
      display: "block",
      left: rect.left + "px",
      top: rect.top + "px",
      width: rect.width + "px",
      height: rect.height + "px"
    });
  }

  function selectElement(element) {
    selectedElement = element;
    selectedSelector = getSelector(element);
    if (!baseSnapshots.has(selectedSelector)) {
      baseSnapshots.set(selectedSelector, getInlineSnapshot(element));
    }
    window.focus();
    updateHover(null);
    updateOverlay();
    syncSelection();
  }

  function syncPendingEdits() {
    window.parent.postMessage(
      {
        type: "CODRAW_VISUAL_STAGE",
        styleEdits: Array.from(stagedStyleEdits, ([selector, styles]) => ({
          selector,
          styles
        })),
        textEdits: Array.from(stagedTextEdits, ([selector, text]) => ({
          selector,
          text
        }))
      },
      "*"
    );
  }

  function syncSelection() {
    if (!selectedElement || !selectedSelector) return;

    const computed = getComputedStyle(selectedElement);
    window.parent.postMessage(
      {
        type: "CODRAW_VISUAL_SELECT",
        selector: selectedSelector,
        tagName: selectedElement.tagName.toLowerCase(),
        canEditText: canEditText(selectedElement),
        styles: {
          color: normalizeColor(computed.color),
          backgroundColor:
            computed.backgroundColor === "rgba(0, 0, 0, 0)"
              ? "#ffffff"
              : normalizeColor(computed.backgroundColor),
          fontSize: Math.round(Number.parseFloat(computed.fontSize)).toString()
        }
      },
      "*"
    );
  }

  function updateStagedEdit(selector, element, snapshot) {
    const baseSnapshot = baseSnapshots.get(selector);

    if (baseSnapshot && snapshotsMatch(snapshot, baseSnapshot)) {
      stagedStyleEdits.delete(selector);
    } else {
      stagedStyleEdits.set(selector, getCssStyles(element));
    }

    syncPendingEdits();
    syncSelection();
  }

  function stageEdit(beforeSnapshot) {
    if (!selectedElement || !selectedSelector) return;

    const afterSnapshot = getInlineSnapshot(selectedElement);

    if (
      beforeSnapshot &&
      snapshotsMatch(beforeSnapshot, afterSnapshot)
    ) {
      return;
    }

    if (beforeSnapshot) {
      undoStack.push({
        selector: selectedSelector,
        before: beforeSnapshot,
        after: afterSnapshot
      });
      redoStack.length = 0;
    }

    updateStagedEdit(
      selectedSelector,
      selectedElement,
      afterSnapshot
    );
  }

  function applyHistoryEntry(entry, snapshot) {
    const element = document.querySelector(entry.selector);
    if (!element) return;

    selectedElement = element;
    selectedSelector = entry.selector;

    if (entry.kind === "text") {
      element.textContent = snapshot;
      updateStagedTextEdit(entry.selector, snapshot);
      updateOverlay();
      return;
    }

    applyInlineSnapshot(element, snapshot);
    updateStagedEdit(entry.selector, element, snapshot);
  }

  function undoVisualEdit() {
    const entry = undoStack.pop();
    if (!entry) return;

    redoStack.push(entry);
    applyHistoryEntry(entry, entry.before);
  }

  function redoVisualEdit() {
    const entry = redoStack.pop();
    if (!entry) return;

    undoStack.push(entry);
    applyHistoryEntry(entry, entry.after);
  }

  function updateStagedTextEdit(selector, text) {
    const baseText = textBaseSnapshots.get(selector);

    if (text === baseText) {
      stagedTextEdits.delete(selector);
    } else {
      stagedTextEdits.set(selector, text);
    }

    syncPendingEdits();
    syncSelection();
  }

  function finishTextEdit(element, beforeText) {
    element.removeAttribute("contenteditable");
    element.style.outline = "";

    const afterText = element.textContent || "";

    if (beforeText !== afterText) {
      undoStack.push({
        kind: "text",
        selector: getSelector(element),
        before: beforeText,
        after: afterText
      });
      redoStack.length = 0;
      updateStagedTextEdit(getSelector(element), afterText);
    }

    updateOverlay();
  }

  function startTextEdit(element) {
    if (!canEditText(element)) return;

    selectElement(element);

    if (!textBaseSnapshots.has(selectedSelector)) {
      textBaseSnapshots.set(selectedSelector, element.textContent || "");
    }

    const beforeText = element.textContent || "";
    element.setAttribute("contenteditable", "plaintext-only");
    element.setAttribute("spellcheck", "false");
    element.style.outline = "2px solid #2563eb";
    element.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    function handleTextKeydown(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        element.blur();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        element.textContent = beforeText;
        element.blur();
      }
    }

    element.addEventListener("keydown", handleTextKeydown);

    element.addEventListener(
      "blur",
      () => {
        element.removeEventListener("keydown", handleTextKeydown);
        finishTextEdit(element, beforeText);
      },
      { once: true }
    );
  }

  document.addEventListener("pointerover", (event) => {
    const target = getEditableTarget(event.target);
    updateHover(target);
  }, true);

  document.addEventListener("pointerout", (event) => {
    if (!hoverElement || hoverElement.contains(event.relatedTarget)) return;
    updateHover(null);
  }, true);

  document.addEventListener("click", (event) => {
    const target = getEditableTarget(event.target);

    if (!target || target === document.body || target === document.documentElement) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    selectElement(target);

    if (!didDrag) {
      startTextEdit(target);
    }
  }, true);

  document.addEventListener("pointerdown", (event) => {
    if (document.activeElement?.isContentEditable) return;

    const handle = event.target.closest?.("[data-handle]");
    const target = getEditableTarget(event.target);

    if (!selectedElement && target) {
      selectElement(target);
    }

    if (target && selectedElement !== target && !handle) {
      selectElement(target);
    }

    if (!target && !handle) {
      selectedElement = null;
      selectedSelector = "";
      overlay.style.display = "none";
      return;
    }

    const isResize = Boolean(handle);
    const isMove = selectedElement && selectedElement.contains(event.target);

    if (!isResize && !isMove) return;

    event.preventDefault();
    event.stopPropagation();
    didDrag = false;

    const rect = selectedElement.getBoundingClientRect();
    ensureEditablePosition(selectedElement);

    interaction = {
      mode: isResize ? "resize" : "move",
      handle: handle?.dataset.handle || "",
      startX: event.clientX,
      startY: event.clientY,
      startLeft: getPixelStyle(selectedElement, "left"),
      startTop: getPixelStyle(selectedElement, "top"),
      startWidth: rect.width,
      startHeight: rect.height
    };
    operationStartSnapshot = getInlineSnapshot(selectedElement);

    event.target.setPointerCapture?.(event.pointerId);
  }, true);

  document.addEventListener("pointermove", (event) => {
    if (!interaction || !selectedElement) return;

    const deltaX = event.clientX - interaction.startX;
    const deltaY = event.clientY - interaction.startY;
    didDrag = didDrag || Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2;

    if (interaction.mode === "move") {
      setBox(
        interaction.startLeft + deltaX,
        interaction.startTop + deltaY,
        interaction.startWidth,
        interaction.startHeight
      );
    } else {
      let left = interaction.startLeft;
      let top = interaction.startTop;
      let width = interaction.startWidth;
      let height = interaction.startHeight;
      const handle = interaction.handle;

      if (handle.includes("e")) width += deltaX;
      if (handle.includes("s")) height += deltaY;
      if (handle.includes("w")) {
        left += deltaX;
        width -= deltaX;
      }
      if (handle.includes("n")) {
        top += deltaY;
        height -= deltaY;
      }

      setBox(left, top, width, height);
    }
  }, true);

  document.addEventListener("pointerup", () => {
    if (!interaction) return;

    interaction = null;
    updateOverlay();
    stageEdit(operationStartSnapshot);
    operationStartSnapshot = null;
    setTimeout(() => {
      didDrag = false;
    }, 0);
  }, true);

  document.addEventListener("keydown", (event) => {
    if (document.activeElement?.isContentEditable) return;

    const isUndo =
      (event.ctrlKey || event.metaKey) &&
      !event.shiftKey &&
      event.key.toLowerCase() === "z";
    const isRedo =
      (event.ctrlKey || event.metaKey) &&
      (event.key.toLowerCase() === "y" ||
        (event.shiftKey && event.key.toLowerCase() === "z"));

    if (isUndo || isRedo) {
      event.preventDefault();
      if (isUndo) {
        undoVisualEdit();
      } else {
        redoVisualEdit();
      }
      return;
    }

    if (!selectedElement) return;

    if (event.key === "Escape") {
      selectedElement = null;
      selectedSelector = "";
      overlay.style.display = "none";
      return;
    }

    const arrows = ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"];
    if (!arrows.includes(event.key)) return;

    event.preventDefault();

    const step = event.shiftKey ? 10 : 1;
    const dx = event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0;
    const dy = event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0;
    const rect = selectedElement.getBoundingClientRect();
    const beforeSnapshot = getInlineSnapshot(selectedElement);

    setBox(
      getPixelStyle(selectedElement, "left") + dx,
      getPixelStyle(selectedElement, "top") + dy,
      rect.width,
      rect.height
    );
    stageEdit(beforeSnapshot);
  }, true);

  window.addEventListener("scroll", updateOverlay, true);
  window.addEventListener("resize", () => {
    updateOverlay();
    updateHover(hoverElement);
  });

  window.addEventListener("message", (event) => {
    if (event.data?.type !== "CODRAW_VISUAL_APPLY_STYLE") return;
    if (!selectedElement || !selectedSelector) return;

    const beforeSnapshot = getInlineSnapshot(selectedElement);
    selectedElement.style[event.data.property] = event.data.value;
    updateOverlay();
    stageEdit(beforeSnapshot);
  });
})();
`;
}

function buildPreviewHtml(
  files: ProjectFiles,
  visualEditEnabled: boolean
) {
  if (!files["index.html"].trim()) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <body style="margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui;color:#111827;background:#fff;text-align:center">
        <main>
          <h1 style="margin:0 0 8px;font-size:24px">Preview could not render</h1>
          <p style="margin:0;color:#6b7280">The generated HTML was empty. Try generating again.</p>
        </main>
      </body>
      </html>
    `;
  }

  return `
    ${files["index.html"]}
    <style>${files["style.css"]}</style>
    <script>${files["script.js"]}<\/script>
    ${
      visualEditEnabled
        ? `<script>${getVisualEditorScript()}<\/script>`
        : ""
    }
  `;
}

export default function LiveCanvas({
  files,
  setFiles,
  visualEditEnabled,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pendingVisualCssRef = useRef<string | null>(null);
  const [pendingStyleEdits, setPendingStyleEdits] = useState<
    PendingVisualStyleEdit[]
  >([]);
  const [pendingTextEdits, setPendingTextEdits] = useState<
    PendingVisualTextEdit[]
  >([]);
  const [selectedInfo, setSelectedInfo] =
    useState<SelectedElementInfo | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [srcDoc, setSrcDoc] = useState(() =>
    buildPreviewHtml(files, visualEditEnabled)
  );

  useEffect(() => {
    if (pendingVisualCssRef.current === files["style.css"]) {
      pendingVisualCssRef.current = null;
      return;
    }

    setSrcDoc(buildPreviewHtml(files, visualEditEnabled));
  }, [files, visualEditEnabled]);

  useEffect(() => {
    function handleMessage(event: MessageEvent<VisualMessage>) {
      if (event.data?.type === "CODRAW_VISUAL_STAGE") {
        setPendingStyleEdits(event.data.styleEdits);
        setPendingTextEdits(event.data.textEdits);
        return;
      }

      if (event.data?.type === "CODRAW_VISUAL_SELECT") {
        setSelectedInfo({
          selector: event.data.selector,
          tagName: event.data.tagName,
          canEditText: event.data.canEditText,
          styles: event.data.styles,
        });
      }
    }

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const pendingCount =
    pendingStyleEdits.length + pendingTextEdits.length;

  function saveVisualChanges() {
    if (pendingCount === 0) return;

    setFiles((prev) => {
      const nextCss = applyVisualEditsToCss(
        prev["style.css"],
        pendingStyleEdits
      );
      const nextHtml = applyVisualTextEditsToHtml(
        prev["index.html"],
        pendingTextEdits
      );

      pendingVisualCssRef.current = nextCss;

      return {
        ...prev,
        "index.html": nextHtml,
        "style.css": nextCss,
      };
    });
    setPendingStyleEdits([]);
    setPendingTextEdits([]);
  }

  function discardVisualChanges() {
    setPendingStyleEdits([]);
    setPendingTextEdits([]);
    setSelectedInfo(null);
    setSrcDoc(buildPreviewHtml(files, visualEditEnabled));
    setFrameKey((current) => current + 1);
  }

  function applySelectedStyle(
    property: "color" | "backgroundColor" | "fontSize",
    value: string
  ) {
    if (!selectedInfo) return;

    const nextValue =
      property === "fontSize" ? `${value}px` : value;

    setSelectedInfo((current) =>
      current
        ? {
            ...current,
            styles: {
              ...current.styles,
              [property]: value,
            },
          }
        : current
    );

    iframeRef.current?.contentWindow?.postMessage(
      {
        type: "CODRAW_VISUAL_APPLY_STYLE",
        property,
        value: nextValue,
      },
      "*"
    );
  }

  return (
    <div className="relative h-full bg-zinc-950 p-3">
      {pendingCount > 0 && (
        <div className="absolute right-5 top-5 z-10 flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/95 p-1 shadow-lg">
          <span className="px-2 text-xs text-zinc-400">
            Save changes
          </span>

          <button
            type="button"
            onClick={saveVisualChanges}
            className="grid h-8 w-8 place-items-center rounded bg-emerald-600 text-white transition hover:bg-emerald-500"
            aria-label="Save visual changes to code"
            title="Save visual changes to code"
          >
            <Check size={16} />
          </button>

          <button
            type="button"
            onClick={discardVisualChanges}
            className="grid h-8 w-8 place-items-center rounded bg-zinc-800 text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
            aria-label="Discard visual changes"
            title="Discard visual changes"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {visualEditEnabled && selectedInfo && (
        <div className="absolute bottom-5 left-5 z-10 flex items-center gap-3 rounded border border-zinc-800 bg-zinc-950/95 p-2 text-xs text-zinc-400 shadow-lg">
          <span className="min-w-14 uppercase tracking-wide">
            {selectedInfo.tagName}
          </span>

          <label className="flex items-center gap-2">
            Size
            <input
              type="number"
              min="8"
              max="160"
              value={selectedInfo.styles.fontSize}
              onChange={(event) =>
                applySelectedStyle(
                  "fontSize",
                  event.target.value
                )
              }
              className="h-8 w-16 rounded border border-zinc-700 bg-zinc-900 px-2 text-white outline-none focus:border-blue-500"
            />
          </label>

          <label className="flex items-center gap-2">
            Text
            <input
              type="color"
              value={selectedInfo.styles.color}
              onChange={(event) =>
                applySelectedStyle("color", event.target.value)
              }
              className="h-8 w-9 cursor-pointer rounded border border-zinc-700 bg-zinc-900 p-1"
            />
          </label>

          <label className="flex items-center gap-2">
            Fill
            <input
              type="color"
              value={selectedInfo.styles.backgroundColor}
              onChange={(event) =>
                applySelectedStyle(
                  "backgroundColor",
                  event.target.value
                )
              }
              className="h-8 w-9 cursor-pointer rounded border border-zinc-700 bg-zinc-900 p-1"
            />
          </label>
        </div>
      )}

      <iframe
        ref={iframeRef}
        key={frameKey}
        title="Live Preview"
        className="h-full w-full rounded border border-zinc-800 bg-white shadow-[0_18px_50px_rgba(0,0,0,.24)]"
        srcDoc={srcDoc}
        sandbox="allow-scripts"
      />
    </div>
  );
}
