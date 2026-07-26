import { NextResponse } from "next/server";

import {
  getGitHubToken,
  githubFetch,
  writeProjectFiles,
} from "@/lib/github";

type GitHubRepo = {
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  default_branch: string;
  owner: {
    login: string;
  };
};

export async function GET(req: Request) {
  const token = getGitHubToken(req);

  if (!token) {
    return NextResponse.json(
      { error: "Connect GitHub first." },
      { status: 401 }
    );
  }

  try {
    const repos = await githubFetch<GitHubRepo[]>(
      token,
      "/user/repos?per_page=100&sort=updated"
    );

    return NextResponse.json({
      repos: repos.map((repo) => ({
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        private: repo.private,
        htmlUrl: repo.html_url,
        defaultBranch: repo.default_branch,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load GitHub repos.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const token = getGitHubToken(req);

  if (!token) {
    return NextResponse.json(
      { error: "Connect GitHub first." },
      { status: 401 }
    );
  }

  const body = await req.json();
  const name = String(body.name ?? "").trim();

  if (!name || !body.files) {
    return NextResponse.json(
      { error: "Missing repository name or project files." },
      { status: 400 }
    );
  }

  try {
    const repo = await githubFetch<GitHubRepo>(token, "/user/repos", {
      method: "POST",
      body: JSON.stringify({
        name,
        private: Boolean(body.private),
        auto_init: true,
        description: "Created with Codraw",
      }),
    });

    await writeProjectFiles(
      token,
      repo.owner.login,
      repo.name,
      repo.default_branch,
      body.files,
      "Create website from Codraw"
    );

    return NextResponse.json({
      repo: {
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        private: repo.private,
        htmlUrl: repo.html_url,
        defaultBranch: repo.default_branch,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create GitHub repo.",
      },
      { status: 500 }
    );
  }
}
