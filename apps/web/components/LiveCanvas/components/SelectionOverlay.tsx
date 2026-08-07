"use client";

import React from "react";

type Props = {
  selectedInfo: {
    selector: string;
    tagName: string;
  };
  selectedRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  onMoveStart: (e: React.PointerEvent) => void;
  onResizeStart: (e: React.PointerEvent, direction: string) => void;
  onWheel: (e: React.WheelEvent) => void;
};

export default function SelectionOverlay({
  selectedInfo,
  selectedRect,
  onMoveStart,
  onResizeStart,
  onWheel,
}: Props) {
  return (
    <div
      style={{
        position: "absolute",
        left: selectedRect.left,
        top: selectedRect.top,
        width: selectedRect.width,
        height: selectedRect.height,
        pointerEvents: "auto",
        zIndex: 25,
        border: "2px solid #38bdf8",
        boxShadow: "none",
        cursor: "move",
      }}
      onPointerDown={onMoveStart}
      onWheel={onWheel}
    >
      {/* Tag Label Badge */}
      <div
        style={{
          position: "absolute",
          left: "-2px",
          top: "-25px",
          height: "22px",
          padding: "0 8px",
          borderRadius: "4px",
          backgroundColor: "#09090b",
          border: "1px solid rgba(56, 189, 248, 0.5)",
          color: "#38bdf8",
          font: "11px/20px system-ui, sans-serif",
          fontWeight: 600,
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        &lt;{selectedInfo.tagName}&gt; {selectedInfo.selector}
      </div>

      {/* Size Badge */}
      <div
        style={{
          position: "absolute",
          right: "-2px",
          bottom: "-23px",
          height: "20px",
          padding: "0 6px",
          borderRadius: "4px",
          backgroundColor: "#09090b",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          color: "#e4e4e7",
          font: "10px/20px system-ui, sans-serif",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        {Math.round(selectedRect.width)} x {Math.round(selectedRect.height)}
      </div>

      {/* 8 Clean Crisp Resize Handles (No Glow) */}
      {[
        { dir: "nw", style: { left: "-5px", top: "-5px", cursor: "nwse-resize" } },
        { dir: "n",  style: { left: "50%", top: "-5px", transform: "translateX(-50%)", cursor: "ns-resize" } },
        { dir: "ne", style: { right: "-5px", top: "-5px", cursor: "nesw-resize" } },
        { dir: "e",  style: { right: "-5px", top: "50%", transform: "translateY(-50%)", cursor: "ew-resize" } },
        { dir: "se", style: { right: "-5px", bottom: "-5px", cursor: "nwse-resize" } },
        { dir: "s",  style: { left: "50%", bottom: "-5px", transform: "translateX(-50%)", cursor: "ns-resize" } },
        { dir: "sw", style: { left: "-5px", bottom: "-5px", cursor: "nesw-resize" } },
        { dir: "w",  style: { left: "-5px", top: "50%", transform: "translateY(-50%)", cursor: "ew-resize" } },
      ].map(({ dir, style }) => (
        <div
          key={dir}
          onPointerDown={(e) => onResizeStart(e, dir)}
          style={{
            position: "absolute",
            width: "10px",
            height: "10px",
            backgroundColor: "#ffffff",
            border: "1.5px solid #38bdf8",
            borderRadius: "2px",
            boxSizing: "border-box",
            boxShadow: "none",
            zIndex: 30,
            ...style,
          }}
        />
      ))}
    </div>
  );
}
