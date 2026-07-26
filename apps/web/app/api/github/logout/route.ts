import { NextResponse } from "next/server";

import { getGitHubCookieName } from "@/lib/github";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(getGitHubCookieName());
  return response;
}
