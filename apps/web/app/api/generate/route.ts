import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const modelByMode = {
  fast: "gemini-3.1-flash-lite",
  smart: "gemini-3.5-flash",
  deep: "gemini-3.6-flash",
} as const;

type ModelMode = keyof typeof modelByMode;

const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
];

function getPreferredModel(mode: unknown) {
  if (typeof mode === "string" && mode in modelByMode) {
    return modelByMode[mode as ModelMode];
  }
  return process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite";
}

async function generateWithFallback(contents: string, preferredModel: string) {
  const modelsToTry = Array.from(
    new Set([preferredModel, ...FALLBACK_MODELS])
  );

  let lastError: unknown;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            responseMimeType: "application/json",
          },
        });
        if (response && response.text) {
          return response;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model ${model} attempt ${attempt} failed:`, err instanceof Error ? err.message : String(err));
        // Short pause before retry/fallback
        await new Promise((r) => setTimeout(r, 300 * attempt));
      }
    }
  }

  throw lastError;
}

export async function POST(req: Request) {
  try {
    const { prompt, files, modelMode } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on server." },
        { status: 500 }
      );
    }

    const preferredModel = getPreferredModel(modelMode);

    const systemPrompt = `You are CoDraw AI, an elite modular full-stack web developer and designer.
Generate or edit clean, modern, responsive web applications split into THREE separate modular linked files:
1. "html": "Clean HTML5 index.html referencing <link rel="stylesheet" href="style.css"> in <head> and <script src="script.js"></script> before </body>."
2. "css": "All CSS styles, color tokens, animations, layout styles, and responsive media queries for style.css."
3. "js": "All interactive JavaScript logic, event listeners, dynamic UI state, and behavior for script.js."

Return ONLY a valid JSON object matching this schema:
{
  "html": "<full index.html code>",
  "css": "<full style.css code>",
  "js": "<full script.js code>"
}

Do not include markdown code block formatting like \`\`\`json in your response if possible, but if you do, ensure the JSON inside is parseable.`;

    const contextMessage = files && Object.keys(files).length > 0
      ? `Existing Project Files:\n${JSON.stringify(files, null, 2)}\n\nUser Request: ${prompt}`
      : `User Request: ${prompt}`;

    const response = await generateWithFallback(
      `${systemPrompt}\n\n${contextMessage}`,
      preferredModel
    );

    const rawText = response.text || "";

    // Clean markdown formatting if present
    const cleanedText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleanedText);
      return NextResponse.json(parsed);
    } catch {
      // If AI returned raw HTML instead of JSON
      return NextResponse.json({
        html: rawText,
      });
    }
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    const errMessage = error instanceof Error ? error.message : "The AI provider connection was interrupted. Please try again in a moment.";
    return NextResponse.json(
      {
        error: errMessage,
      },
      { status: 500 }
    );
  }
}
