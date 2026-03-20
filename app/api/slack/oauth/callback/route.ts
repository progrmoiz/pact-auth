import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state"); // CLI pickup code
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return new NextResponse(html("Authorization Failed", "Something went wrong. You can close this tab."), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Exchange code for tokens
  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: `${appUrl}/api/slack/oauth/callback`,
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    return new NextResponse(html("Authorization Failed", `Slack error: ${data.error}`), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Store tokens in KV with 5-minute TTL, keyed by CLI pickup code
  await redis.set(`pact:${state}`, JSON.stringify({
    platform: "slack",
    user_token: data.authed_user?.access_token,
    bot_token: data.access_token,
    team_id: data.team?.id,
    user_id: data.authed_user?.id,
  }), { ex: 300 }); // 5 min TTL

  return new NextResponse(
    html("Pact Connected to Slack!", "You can close this tab and return to your terminal."),
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

function html(title: string, message: string): string {
  return `<!DOCTYPE html>
<html><head><title>${title}</title>
<style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;color:#ededed}
.card{text-align:center;padding:2rem}h1{margin-bottom:0.5rem}p{color:#888}</style>
</head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
}
