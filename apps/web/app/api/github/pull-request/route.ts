import { NextResponse } from "next/server";

import {
  createUpdateBranch,
  getGitHubToken,
  getRepo,
  githubFetch,
  writeProjectFiles,
} from "@/lib/github";

type PullRequest = {
  html_url: string;
  number: number;
};

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
    const branch = await createUpdateBranch(
      token,
      body.owner,
      body.repo,
      repo.default_branch
    );

    await writeProjectFiles(
      token,
      body.owner,
      body.repo,
      branch,
      body.files,
      body.message ?? "Update website from Codraw"
    );

    const pullRequest = await githubFetch<PullRequest>(
      token,
      `/repos/${body.owner}/${body.repo}/pulls`,
      {
        method: "POST",
        body: JSON.stringify({
          title: body.title ?? "Update website from Codraw",
          body: "This PR was created from Codraw.",
          head: branch,
          base: repo.default_branch,
        }),
      }
    );

    return NextResponse.json({
      branch,
      number: pullRequest.number,
      htmlUrl: pullRequest.html_url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create pull request.",
      },
      { status: 500 }
    );
  }
}
