import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const response = await ai.models.generateContent({
      model: "models/gemini-3.5-flash",
      contents: `
You are an expert frontend engineer.

Generate a complete HTML page.

Rules:
- Return ONLY HTML.
- Return a complete <!DOCTYPE html> document.
- Use inline CSS only.
- Make it modern and responsive.
- Do not use markdown.
- Do not explain anything.

User request:
${prompt}
`,
    });

    return NextResponse.json({
      html: response.text,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}