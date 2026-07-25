import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prompt = body.prompt;
    const files = body.files;

    const project =
`=== index.html ===
${files["index.html"]}

=== style.css ===
${files["style.css"]}

=== script.js ===
${files["script.js"]}`;

    const response = await ai.models.generateContent({
      model: "models/gemini-3.5-flash",
      contents: `
You are an expert frontend engineer and award-winning UI/UX designer.

You are EDITING an existing website.

The user already has a working project.

Your job is to MODIFY it according to the user's request.

Current Project:

${project}

User Request:

${prompt}

Instructions:

- Preserve everything unrelated to the user's request.
- Only modify what is necessary.
- Do NOT randomly redesign the whole website.
- Keep the existing design language unless asked otherwise.
- Do NOT remove existing features unless requested.
- Return the COMPLETE updated project.

Return EXACTLY three files.

=== index.html ===
...

=== style.css ===
...

=== script.js ===
...

Rules:

- Return ONLY these three files.
- No markdown.
- No \`\`\`.
- index.html must link style.css.
- index.html must load script.js.
- Put all CSS in style.css.
- Put all JavaScript in script.js.
- Use semantic HTML.
- Use only HTML, CSS and vanilla JavaScript.
- No React.
- No Tailwind.
- No Bootstrap.
- No jQuery.
- No npm packages.
- No external JS libraries.
- No Font Awesome Kit URLs.
- No placeholder API keys.
- Do not reference local assets that do not exist.
- If icons are needed, use inline SVG.
- If images are needed, use https://images.unsplash.com/.
- The project must work immediately by opening index.html.

When the user asks for a small change, make ONLY that change while keeping everything else intact.
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