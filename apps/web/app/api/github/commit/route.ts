import { NextResponse } from "next/server";

import {
  getGitHubToken,
  getRepo,
  writeProjectFiles,
} from "@/lib/github";

export async function POST(req: Request) {
  const token = getGitHubToken(req);

  if (!token) {
    return NextResponse.json(
      { error: "Connect GitHub first." },
      { status: 401 }
    );
  }

  const body = await req.json();

  if (!body.owner || !body.repo || !body.files) {
    return NextResponse.json(
      { error: "Missing repository or project files." },
      { status: 400 }
    );
  }

  try {
    const repo = await getRepo(token, body.owner, body.repo);

    await writeProjectFiles(
      token,
      body.owner,
      body.repo,
      repo.default_branch,
      body.files,
      body.message ?? "Update website from Codraw"
    );

    return NextResponse.json({
      ok: true,
      branch: repo.default_branch,
      htmlUrl: repo.html_url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not commit changes.",
      },
      { status: 500 }
    );
  }
}
