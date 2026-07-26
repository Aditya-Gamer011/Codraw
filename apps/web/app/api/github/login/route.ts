import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      {
        error:
          "Missing GITHUB_CLIENT_ID. Create a GitHub OAuth app and add it to .env.local.",
      },
      { status: 500 }
    );
  }

  const state = randomUUID();
  const url = new URL(req.url);
  const redirectUri =
    process.env.GITHUB_CALLBACK_URL ??
    `${url.origin}/api/github/callback`;
  const authorizeUrl = new URL(
    "https://github.com/login/oauth/authorize"
  );

  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "repo user:email");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("codraw_github_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
