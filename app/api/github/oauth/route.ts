import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;

  const githubUrl = new URL("https://github.com/login/oauth/authorize");
  githubUrl.searchParams.set("client_id", clientId!);
  githubUrl.searchParams.set("scope", "repo read:org");
  githubUrl.searchParams.set("state", code); // CLI pickup code

  return NextResponse.redirect(githubUrl.toString());
}
