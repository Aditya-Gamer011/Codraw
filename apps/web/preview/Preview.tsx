"use client";

import { useEffect, useRef } from "react";

const html = `
<!DOCTYPE html>
<html>
<head>
<style>
body{
    margin:0;
    min-height:100vh;
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:system-ui, -apple-system, sans-serif;
    background:#fff;
    color:#111827;
    text-align:center;
}

h1{
    margin:0 0 8px;
    font-size:32px;
}

p{
    margin:0;
    color:#6b7280;
}
</style>
</head>

<body>
<main>
    <h1>Preview</h1>
    <p>Whatever you make will appear here.</p>
</main>

</body>
</html>
`;

export default function Preview() {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        let previous: HTMLElement | null = null;

        const handleLoad = () => {
            const doc = iframe.contentDocument;
            if (!doc) return;

            const handleClick = (e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();

                const target = e.target as HTMLElement;

                // Ignore clicking directly on the body or document frame root
                if (target === doc.body || target === doc.documentElement) {
                    return;
                }

                // Remove outline from previously selected element
                if (previous) {
                    previous.style.removeProperty("outline");
                    previous.style.removeProperty("outlineOffset");
                }

                // Highlight the new selection
                target.style.outline = "2px solid #3b82f6";
                target.style.outlineOffset = "2px";

                previous = target;

                console.log("Selected:", target.tagName);
            };

            doc.addEventListener("click", handleClick, true);
        };

        iframe.addEventListener("load", handleLoad);

        if (iframe.contentDocument?.readyState === "complete") {
            handleLoad();
        }

        return () => {
            iframe.removeEventListener("load", handleLoad);
        };
    }, []);

    return (
        <iframe
            ref={iframeRef}
            srcDoc={html}
            className="w-full h-full border-0"
            title="Preview"
        />
    );
}