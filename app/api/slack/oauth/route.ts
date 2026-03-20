import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const botScopes = ["chat:write", "im:write"].join(",");
  const userScopes = [
    "channels:history",
    "channels:read",
    "groups:history",
    "groups:read",
    "im:history",
    "im:read",
    "mpim:history",
    "mpim:read",
    "search:read",
    "users:read",
    "chat:write",
  ].join(",");

  const slackUrl = new URL("https://slack.com/oauth/v2/authorize");
  slackUrl.searchParams.set("client_id", clientId!);
  slackUrl.searchParams.set("scope", botScopes);
  slackUrl.searchParams.set("user_scope", userScopes);
  slackUrl.searchParams.set("redirect_uri", `${appUrl}/api/slack/oauth/callback`);
  slackUrl.searchParams.set("state", code); // pass CLI pickup code as state

  return NextResponse.redirect(slackUrl.toString());
}
