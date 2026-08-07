"use client";

import React from "react";

type Props = {
  hoverRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};

export default function HoverOverlay({ hoverRect }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        left: hoverRect.left,
        top: hoverRect.top,
        width: hoverRect.width,
        height: hoverRect.height,
        pointerEvents: "none",
        zIndex: 20,
        border: "1.5px dashed #38bdf8",
        backgroundColor: "rgba(56, 189, 248, 0.05)",
      }}
    />
  );
}
