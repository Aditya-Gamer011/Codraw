import { NextResponse } from "next/server";

import { getGitHubCookieName } from "@/lib/github";

type TokenResponse = {
  access_token?: string;
  error_description?: string;
};

function readCookie(req: Request, name: string) {
  const cookieHeader = req.headers.get("cookie") ?? "";

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
}

export async function GET(req: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = readCookie(req, "codraw_github_state");

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        error:
          "Missing GitHub OAuth env vars. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
      },
      { status: 500 }
    );
  }

  if (!code || !state || state !== expectedState) {
    return NextResponse.json(
      { error: "Invalid GitHub OAuth callback." },
      { status: 400 }
    );
  }

  const redirectUri =
    process.env.GITHUB_CALLBACK_URL ??
    `${url.origin}/api/github/callback`;

  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    }
  );

  if (!tokenResponse.ok) {
    return NextResponse.json(
      { error: "GitHub OAuth token exchange failed." },
      { status: 400 }
    );
  }

  const token = (await tokenResponse.json()) as TokenResponse;

  if (!token.access_token) {
    return NextResponse.json(
      {
        error:
          token.error_description ??
          "GitHub did not return an access token.",
      },
      { status: 400 }
    );
  }

  const response = NextResponse.redirect(url.origin);
  response.cookies.set(getGitHubCookieName(), token.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.delete("codraw_github_state");

  return response;
}
