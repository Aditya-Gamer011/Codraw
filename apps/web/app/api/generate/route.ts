import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const modelByMode = {
  lightning: "gemini-3.5-flash-lite",
  balanced: "gemini-3.6-flash",
  hardcore: "gemini-3.1-pro-preview",
} as const;

type ModelMode = keyof typeof modelByMode;

const maxAttempts = 3;

function getModel(mode: unknown) {
  if (
    typeof mode === "string" &&
    mode in modelByMode
  ) {
    return modelByMode[mode as ModelMode];
  }

  return process.env.GEMINI_MODEL ?? modelByMode.lightning;
}

function isTransientError(error: unknown) {
  const message =
    error instanceof Error ? error.message : String(error);
  const cause =
    error instanceof Error && "cause" in error
      ? String(error.cause)
      : "";
  const text = `${message} ${cause}`.toLowerCase();

  return (
    text.includes("fetch failed") ||
    text.includes("econnreset") ||
    text.includes("etimedout") ||
    text.includes("temporarily unavailable") ||
    text.includes("503") ||
    text.includes("502") ||
    text.includes("429")
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function generateWithRetry(
  contents: string,
  model: string
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await ai.models.generateContent({
        model,
        contents,
      });
    } catch (error) {
      lastError = error;

      if (
        attempt === maxAttempts ||
        !isTransientError(error)
      ) {
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, attempt * 750)
      );
    }
  }

  throw lastError;
}

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Missing GEMINI_API_KEY. Add it to apps/web/.env.local and restart the dev server.",
        },
        {
          status: 500,
        }
      );
    }

    const body = await req.json();

    const prompt = body.prompt;
    const files = body.files;
    const model = getModel(body.modelMode);

    if (!prompt || !files) {
      return NextResponse.json(
        {
          error: "Missing prompt or project files.",
        },
        {
          status: 400,
        }
      );
    }

    const project =
`=== index.html ===
${files["index.html"]}

=== style.css ===
${files["style.css"]}

=== script.js ===
${files["script.js"]}`;

    const response = await generateWithRetry(
      `Edit this website.

Current files:
${project}

User request:
${prompt}

Return only these three complete files, with these exact headers:
=== index.html ===
...
=== style.css ===
...
=== script.js ===
...

Rules: preserve unrelated code, use only HTML/CSS/vanilla JS, no markdown, no extra text.`,
      model
    );

    return NextResponse.json({
      html: response.text,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          isTransientError(error)
            ? "The AI provider connection was interrupted. Please try again in a moment."
            : getErrorMessage(error),
      },
      {
        status: 500,
      }
    );
  }
}
