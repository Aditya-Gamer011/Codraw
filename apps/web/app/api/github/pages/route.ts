import { NextResponse } from "next/server";

import {
  getGitHubToken,
  getRepo,
  githubFetch,
} from "@/lib/github";

type GitHubPagesInfo = {
  html_url?: string;
  status?: string;
};

type GitHubBuildInfo = {
  status: string;
};

export async function GET(req: Request) {
  const token = getGitHubToken(req);
  const url = new URL(req.url);
  const owner = url.searchParams.get("owner");
  const repo = url.searchParams.get("repo");

  if (!token || !owner || !repo) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const builds = await githubFetch<GitHubBuildInfo[] | GitHubBuildInfo>(
      token,
      `/repos/${owner}/${repo}/pages/builds`
    );

    const latest = Array.isArray(builds) ? builds[0] : builds;
    const status = latest?.status ?? "built";

    return NextResponse.json({
      status,
      isLive: status === "built",
    });
  } catch {
    return NextResponse.json({ status: "built", isLive: true });
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

  if (!body.owner || !body.repo) {
    return NextResponse.json(
      { error: "Missing owner or repo name." },
      { status: 400 }
    );
  }

  try {
    const repo = await getRepo(token, body.owner, body.repo);

    let pagesInfo: GitHubPagesInfo | null = null;

    // Enable or update GitHub Pages
    try {
      pagesInfo = await githubFetch<GitHubPagesInfo>(
        token,
        `/repos/${body.owner}/${body.repo}/pages`,
        {
          method: "POST",
          body: JSON.stringify({
            source: {
              branch: repo.default_branch,
              path: "/",
            },
          }),
        }
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("409") || errMsg.includes("already exists") || errMsg.includes("422")) {
        try {
          pagesInfo = await githubFetch<GitHubPagesInfo>(
            token,
            `/repos/${body.owner}/${body.repo}/pages`,
            {
              method: "PUT",
              body: JSON.stringify({
                source: {
                  branch: repo.default_branch,
                  path: "/",
                },
              }),
            }
          );
        } catch {
          pagesInfo = await githubFetch<GitHubPagesInfo>(
            token,
            `/repos/${body.owner}/${body.repo}/pages`
          );
        }
      } else {
        throw err;
      }
    }

    // Trigger immediate new build to overrule previous releases
    try {
      await githubFetch(
        token,
        `/repos/${body.owner}/${body.repo}/pages/builds`,
        {
          method: "POST",
        }
      );
    } catch {
      // Build trigger may auto-trigger on commit
    }

    const pagesUrl =
      pagesInfo?.html_url ??
      `https://${body.owner.toLowerCase()}.github.io/${body.repo}/`;

    return NextResponse.json({
      ok: true,
      pagesUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not configure GitHub Pages.",
      },
      { status: 500 }
    );
  }
}
