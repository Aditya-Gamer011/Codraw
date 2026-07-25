export interface ProjectFiles {
  "index.html": string;
  "style.css": string;
  "script.js": string;
}

export function parseProject(text: string): ProjectFiles {
  const html =
    text.match(
      /=== index\.html ===([\s\S]*?)=== style\.css ===/
    )?.[1]?.trim() ?? "";

  const css =
    text.match(
      /=== style\.css ===([\s\S]*?)=== script\.js ===/
    )?.[1]?.trim() ?? "";

  const js =
    text.match(
      /=== script\.js ===([\s\S]*)/
    )?.[1]?.trim() ?? "";

  return {
    "index.html": html,
    "style.css": css,
    "script.js": js,
  };
}