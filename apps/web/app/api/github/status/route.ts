import { NextResponse } from "next/server";

import { getGitHubToken, githubFetch } from "@/lib/github";

type GitHubUser = {
  login: string;
  avatar_url: string;
  html_url: string;
};

export async function GET(req: Request) {
  const token = getGitHubToken(req);

  if (!token) {
    return NextResponse.json({ connected: false });
  }

  try {
    const user = await githubFetch<GitHubUser>(token, "/user");

    return NextResponse.json({
      connected: true,
      user,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
