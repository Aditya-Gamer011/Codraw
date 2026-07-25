"use client";

import { useEffect, useRef, useState } from "react";

import { ProjectFiles } from "@/lib/types";

type Props = {
  files: ProjectFiles;
  setFiles: (
    files: ProjectFiles | ((prev: ProjectFiles) => ProjectFiles)
  ) => void;
  visualEditEnabled: boolean;
};

type VisualEdit = {
  type: "CODRAW_VISUAL_EDIT";
  selector: string;
  styles: Record<string, string>;
};

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

function getVisualEditorScript() {
  return `
(() => {
  const editableSelector = "body *:not(#codraw-editor-overlay):not(#codraw-editor-overlay *)";
  let selectedElement = null;
  let selectedSelector = "";
  let interaction = null;
  let hoverElement = null;

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
    border: "2px solid #22d3ee",
    boxSizing: "border-box",
    pointerEvents: "none",
    display: "none",
    boxShadow: "0 0 0 1px rgba(240,253,250,.9), 0 0 26px rgba(34,211,238,.42), inset 0 0 22px rgba(103,232,249,.08)"
  });

  const hoverBox = document.createElement("div");
  Object.assign(hoverBox.style, {
    position: "fixed",
    zIndex: "2147483646",
    border: "1px dashed rgba(34,211,238,.82)",
    background: "rgba(34,211,238,.08)",
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
    background: "linear-gradient(180deg, #67e8f9, #0891b2)",
    color: "#00151f",
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
    background: "rgba(2, 18, 31, .92)",
    color: "#cffafe",
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
    background: "#22d3ee",
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

  function getPixelStyle(element, property) {
    const value = Number.parseFloat(getComputedStyle(element)[property]);
    return Number.isFinite(value) ? value : 0;
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
    window.focus();
    updateHover(null);
    updateOverlay();
  }

  function commitEdit() {
    if (!selectedElement || !selectedSelector) return;

    const style = selectedElement.style;
    window.parent.postMessage(
      {
        type: "CODRAW_VISUAL_EDIT",
        selector: selectedSelector,
        styles: {
          position: style.position || "relative",
          left: style.left || "0px",
          top: style.top || "0px",
          width: style.width || Math.round(selectedElement.getBoundingClientRect().width) + "px",
          height: style.height || Math.round(selectedElement.getBoundingClientRect().height) + "px",
          "box-sizing": style.boxSizing || "border-box"
        }
      },
      "*"
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
  }, true);

  document.addEventListener("pointerdown", (event) => {
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

    event.target.setPointerCapture?.(event.pointerId);
  }, true);

  document.addEventListener("pointermove", (event) => {
    if (!interaction || !selectedElement) return;

    const deltaX = event.clientX - interaction.startX;
    const deltaY = event.clientY - interaction.startY;

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
    commitEdit();
  }, true);

  document.addEventListener("keydown", (event) => {
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

    setBox(
      getPixelStyle(selectedElement, "left") + dx,
      getPixelStyle(selectedElement, "top") + dy,
      rect.width,
      rect.height
    );
    commitEdit();
  }, true);

  window.addEventListener("scroll", updateOverlay, true);
  window.addEventListener("resize", () => {
    updateOverlay();
    updateHover(hoverElement);
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
  const pendingVisualCssRef = useRef<string | null>(null);
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
    function handleMessage(event: MessageEvent<VisualEdit>) {
      if (event.data?.type !== "CODRAW_VISUAL_EDIT") return;

      setFiles((prev) => {
        const nextCss = applyVisualEditToCss(
          prev["style.css"],
          event.data.selector,
          event.data.styles
        );

        pendingVisualCssRef.current = nextCss;

        return {
          ...prev,
          "style.css": nextCss,
        };
      });
    }

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [setFiles]);

  return (
    <div className="h-full bg-[radial-gradient(circle_at_50%_0%,rgba(103,232,249,.18),transparent_32rem),rgba(1,15,26,.56)] p-3">
      <iframe
        title="Live Preview"
        className="h-full w-full rounded border border-cyan-200/20 bg-white shadow-[0_18px_50px_rgba(0,0,0,.32)]"
        srcDoc={srcDoc}
        sandbox="allow-scripts"
      />
    </div>
  );
}
