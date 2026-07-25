"use client";

interface LiveCanvasProps {
  html: string;
}

export default function LiveCanvas({ html }: LiveCanvasProps) {
  return (
    <iframe
      srcDoc={html}
      title="Live Preview"
      className="w-full h-full border-0"
    />
  );
}