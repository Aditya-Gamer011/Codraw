export interface ProjectFiles {
  "index.html": string;
  "style.css": string;
  "script.js": string;
}

const fileHeaderPattern =
  /^```[a-z]*\s*$|^===\s*(index\.html|style\.css|script\.js)\s*===\s*$/gim;

export function parseProject(text: string): ProjectFiles {
  const files: ProjectFiles = {
    "index.html": "",
    "style.css": "",
    "script.js": "",
  };
  const matches = Array.from(text.matchAll(fileHeaderPattern));

  for (let index = 0; index < matches.length; index += 1) {
    const fileName = matches[index][1] as keyof ProjectFiles | undefined;

    if (!fileName) continue;

    const start = matches[index].index! + matches[index][0].length;
    const end = matches[index + 1]?.index ?? text.length;

    files[fileName] = text
      .slice(start, end)
      .replace(/^```[a-z]*\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
  }

  return files;
}

export function isValidProject(files: ProjectFiles) {
  return files["index.html"].trim().length > 0;
}
