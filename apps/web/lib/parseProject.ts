import { ProjectFiles } from "./types";

const fileHeaderPattern = /^===\s*([a-zA-Z0-9_\-\.\/]+)\s*===\s*$/gim;



function extractJsonProperty(jsonStr: string, key: string): string | undefined {
  const keyRegex = new RegExp(`"${key}"\\s*:\\s*"`, "i");
  const match = keyRegex.exec(jsonStr);
  if (!match) return undefined;

  const startIdx = match.index + match[0].length;
  let result = "";
  let i = startIdx;
  let isEscaped = false;

  while (i < jsonStr.length) {
    const char = jsonStr[i];
    if (isEscaped) {
      if (char === "n") result += "\n";
      else if (char === "r") result += "\r";
      else if (char === "t") result += "\t";
      else result += char;
      isEscaped = false;
    } else if (char === "\\") {
      isEscaped = true;
    } else if (char === '"') {
      const rest = jsonStr.slice(i + 1).trim();
      if (rest.startsWith(",") || rest.startsWith("}") || rest.startsWith("]")) {
        return result;
      }
      result += '"';
    } else {
      result += char;
    }
    i++;
  }

  return result.trim() ? result : undefined;
}

function unpackJsonPayload(input: unknown): { html?: string; css?: string; js?: string } | null {
  if (!input) return null;

  // Case A: Direct JS object
  if (typeof input === "object" && input !== null) {
    const obj = input as Record<string, unknown>;
    if (typeof obj.html === "string" && (obj.html.trim().startsWith("{") || obj.html.includes('"html":'))) {
      const unpacked = unpackJsonPayload(obj.html);
      if (unpacked && (unpacked.html || unpacked.css || unpacked.js)) {
        return unpacked;
      }
    }
    if (obj.html || obj.css || obj.js) {
      return {
        html: typeof obj.html === "string" ? obj.html : undefined,
        css: typeof obj.css === "string" ? obj.css : undefined,
        js: typeof obj.js === "string" ? obj.js : undefined,
      };
    }
  }

  // Case B: String (JSON formatted or raw)
  if (typeof input === "string") {
    const clean = input
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(clean);
      if (parsed && typeof parsed === "object") {
        return unpackJsonPayload(parsed);
      }
    } catch {}

    // Extract properties cleanly using string scanner
    const htmlExtracted = extractJsonProperty(clean, "html");
    const cssExtracted = extractJsonProperty(clean, "css");
    const jsExtracted = extractJsonProperty(clean, "js");

    if (htmlExtracted || cssExtracted || jsExtracted) {
      return {
        html: htmlExtracted,
        css: cssExtracted,
        js: jsExtracted,
      };
    }
  }

  return null;
}

export function parseProject(input: unknown, currentFiles: ProjectFiles = {}): ProjectFiles {
  const result: ProjectFiles = { ...currentFiles };
  if (!input) return ensureModularFiles(result);

  // 1. Unpack JSON payload ({ html, css, js })
  const unpacked = unpackJsonPayload(input);
  if (unpacked) {
    if (unpacked.html) result["index.html"] = unpacked.html;
    if (unpacked.css !== undefined) result["style.css"] = unpacked.css;
    if (unpacked.js !== undefined) result["script.js"] = unpacked.js;
    return ensureModularFiles(result);
  }

  const text = String(input).trim();
  if (!text) return ensureModularFiles(result);

  // 2. Try parsing === filename === headers
  const matches = Array.from(text.matchAll(fileHeaderPattern));
  if (matches.length > 0) {
    for (let index = 0; index < matches.length; index += 1) {
      const fileName = matches[index][1]?.trim();
      if (!fileName) continue;

      const start = matches[index].index! + matches[index][0].length;
      const end = matches[index + 1]?.index ?? text.length;

      const rawContent = text.slice(start, end).trim();
      const cleanedContent = rawContent
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/\n?```$/i, "")
        .trim();

      result[fileName] = cleanedContent;
    }
    return ensureModularFiles(result);
  }

  // 3. Fallback string: Treat as index.html content
  let htmlContent = text;
  const codeBlockMatch = htmlContent.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch && codeBlockMatch[1].trim()) {
    htmlContent = codeBlockMatch[1].trim();
  }

  result["index.html"] = htmlContent;
  return ensureModularFiles(result);
}

function ensureModularFiles(files: ProjectFiles): ProjectFiles {
  const result = { ...files };

  let html = result["index.html"] || `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CoDraw Web App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <main class="hero"></main>
    <script src="script.js"></script>
</body>
</html>`;

  let css = result["style.css"] || `/* CoDraw Project Stylesheet */
:root {
  --primary: #38bdf8;
  --bg: #09090b;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--bg);
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
}`;

  let js = result["script.js"] || `// CoDraw Interactive JavaScript Logic
document.addEventListener("DOMContentLoaded", () => {
  console.log("CoDraw Application Initialized");
});`;

  // Process HTML string to extract any inline <style> and <script> tags and ensure linking tags exist
  if (html && typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Extract inline <style> tags into style.css
      const styleTags = doc.querySelectorAll("style");
      styleTags.forEach((styleEl) => {
        if (!styleEl.hasAttribute("data-filename")) {
          const content = styleEl.textContent || "";
          if (content.trim()) {
            css += `\n\n/* Extracted Inline Styles */\n${content.trim()}`;
          }
          styleEl.remove();
        }
      });

      // Ensure <link rel="stylesheet" href="style.css"> is present in <head>
      let hasStyleLink = false;
      doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
        if (link.getAttribute("href")?.includes("style.css")) {
          hasStyleLink = true;
        }
      });

      if (!hasStyleLink && doc.head) {
        const linkEl = doc.createElement("link");
        linkEl.setAttribute("rel", "stylesheet");
        linkEl.setAttribute("href", "style.css");
        doc.head.appendChild(linkEl);
      }

      // Extract inline custom <script> tags into script.js (skip CDN scripts with src)
      const scriptTags = doc.querySelectorAll("script");
      scriptTags.forEach((scriptEl) => {
        const src = scriptEl.getAttribute("src") || "";
        if (!src && !scriptEl.hasAttribute("data-filename") && !scriptEl.type?.includes("importmap")) {
          const content = scriptEl.textContent || "";
          if (content.trim() && !content.includes("__CODRAW_VISUAL_MODE__")) {
            js += `\n\n// Extracted Inline Script\n${content.trim()}`;
            scriptEl.remove();
          }
        }
      });

      // Ensure <script src="script.js"></script> is present before </body>
      let hasScriptTag = false;
      doc.querySelectorAll("script").forEach((script) => {
        if (script.getAttribute("src")?.includes("script.js")) {
          hasScriptTag = true;
        }
      });

      if (!hasScriptTag && doc.body) {
        const scriptEl = doc.createElement("script");
        scriptEl.setAttribute("src", "script.js");
        doc.body.appendChild(scriptEl);
      }

      html = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
    } catch (err) {
      console.error("Error modularizing HTML tags:", err);
    }
  }

  result["index.html"] = html.trim();
  result["style.css"] = css.trim();
  result["script.js"] = js.trim();

  return result;
}

export function isValidProject(files: ProjectFiles) {
  if (!files || Object.keys(files).length === 0) return false;
  return Object.values(files).some(
    (content) => typeof content === "string" && content.trim().length > 0
  );
}
